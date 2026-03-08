'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, ChevronUp, ChevronDown, Loader2, Eye, EyeOff, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import {
  getCreatorSession,
  getCreatorRoutines,
  createRoutine,
  updateRoutine,
  deleteRoutine,
} from '@/lib/actions/creator';

// ── Local types ──────────────────────────────────────────────────────
interface RoutineStep {
  id: string;
  stepName: string;
  stepDescription: string;
  imageUrl: string;
  productTags: string[];
  displayOrder: number;
}

interface Routine {
  id: string;
  creatorId: string;
  name: string;
  isVisible: boolean;
  displayOrder: number;
  steps: RoutineStep[];
  createdAt?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────
function generateId() {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ── Page component ──────────────────────────────────────────────────────
export default function CreatorRoutinesPage() {
  const [creator, setCreator] = useState<{ id: string } | null>(null);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRoutineId, setExpandedRoutineId] = useState<string | null>(null);

  // New routine form
  const [newRoutineName, setNewRoutineName] = useState('');
  const [creatingRoutine, setCreatingRoutine] = useState(false);

  // New step form (per routine)
  const [addingStepToId, setAddingStepToId] = useState<string | null>(null);
  const [newStep, setNewStep] = useState<{
    stepName: string;
    stepDescription: string;
    imageUrl: string;
    productTags: string;
  }>({ stepName: '', stepDescription: '', imageUrl: '', productTags: '' });

  // ── Data fetching ────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      const creatorData = await getCreatorSession();
      if (!creatorData || cancelled) {
        if (!cancelled) setLoading(false);
        return;
      }
      setCreator(creatorData as any);

      try {
        const data = await getCreatorRoutines(creatorData.id);
        if (!cancelled) {
          const mapped = (data as any[]).map((r) => ({
            ...r,
            steps: Array.isArray(r.steps) ? r.steps : [],
          }));
          setRoutines(mapped as Routine[]);
          if (mapped.length > 0) {
            setExpandedRoutineId(mapped[0].id);
          }
        }
      } catch (error) {
        console.error('Failed to fetch routines:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, []);

  // ── Routine CRUD ────────────────────────────────────────────────────
  const handleCreateRoutine = async () => {
    const trimmed = newRoutineName.trim();
    if (!trimmed || !creator) return;

    setCreatingRoutine(true);

    try {
      const data = await createRoutine({
        creatorId: creator.id,
        name: trimmed,
      });

      const routine: Routine = {
        ...(data as any),
        steps: [],
      };

      setRoutines((prev) => [...prev, routine]);
      setNewRoutineName('');
      setExpandedRoutineId(routine.id);
      toast.success('루틴이 생성되었습니다');
    } catch (error) {
      toast.error('생성에 실패했습니다');
    } finally {
      setCreatingRoutine(false);
    }
  };

  const handleDeleteRoutine = async (routineId: string) => {
    if (!confirm('이 루틴을 삭제하시겠습니까?')) return;

    try {
      await deleteRoutine(routineId);
      setRoutines((prev) => prev.filter((r) => r.id !== routineId));
      if (expandedRoutineId === routineId) setExpandedRoutineId(null);
      toast.success('루틴이 삭제되었습니다');
    } catch (error) {
      toast.error('삭제에 실패했습니다');
    }
  };

  const handleToggleVisibility = async (routineId: string) => {
    const routine = routines.find((r) => r.id === routineId);
    if (!routine) return;

    const newVisible = !routine.isVisible;
    setRoutines((prev) =>
      prev.map((r) => (r.id === routineId ? { ...r, isVisible: newVisible } : r))
    );

    try {
      await updateRoutine(routineId, { isVisible: newVisible });
    } catch (error) {
      setRoutines((prev) =>
        prev.map((r) => (r.id === routineId ? { ...r, isVisible: !newVisible } : r))
      );
    }
  };

  const handleMoveRoutine = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= routines.length) return;

    const updated = [...routines];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;

    const reordered = updated.map((r, i) => ({ ...r, displayOrder: i }));
    setRoutines(reordered);

    for (const r of reordered) {
      await updateRoutine(r.id, { displayOrder: r.displayOrder });
    }
  };

  // ── Step CRUD ───────────────────────────────────────────────────────
  const handleAddStep = async (routineId: string) => {
    const name = newStep.stepName.trim();
    const desc = newStep.stepDescription.trim();
    if (!name) return;

    const routine = routines.find((r) => r.id === routineId);
    if (!routine) return;

    const step: RoutineStep = {
      id: generateId(),
      stepName: name,
      stepDescription: desc,
      imageUrl: newStep.imageUrl.trim(),
      productTags: newStep.productTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      displayOrder: routine.steps.length,
    };

    const updatedSteps = [...routine.steps, step];
    setRoutines((prev) =>
      prev.map((r) =>
        r.id === routineId ? { ...r, steps: updatedSteps } : r
      )
    );

    try {
      await updateRoutine(routineId, { steps: updatedSteps });
    } catch (error) {
      console.error('Failed to save step:', error);
    }

    setNewStep({ stepName: '', stepDescription: '', imageUrl: '', productTags: '' });
    setAddingStepToId(null);
    toast.success('단계가 추가되었습니다');
  };

  const handleDeleteStep = async (routineId: string, stepId: string) => {
    const routine = routines.find((r) => r.id === routineId);
    if (!routine) return;

    const updatedSteps = routine.steps
      .filter((s) => s.id !== stepId)
      .map((s, i) => ({ ...s, displayOrder: i }));

    setRoutines((prev) =>
      prev.map((r) =>
        r.id === routineId ? { ...r, steps: updatedSteps } : r
      )
    );

    try {
      await updateRoutine(routineId, { steps: updatedSteps });
    } catch (error) {
      console.error('Failed to delete step:', error);
    }
  };

  const handleMoveStep = async (routineId: string, stepIndex: number, direction: 'up' | 'down') => {
    const routine = routines.find((r) => r.id === routineId);
    if (!routine) return;

    const newIndex = direction === 'up' ? stepIndex - 1 : stepIndex + 1;
    if (newIndex < 0 || newIndex >= routine.steps.length) return;

    const newSteps = [...routine.steps];
    const temp = newSteps[stepIndex];
    newSteps[stepIndex] = newSteps[newIndex];
    newSteps[newIndex] = temp;

    const reordered = newSteps.map((s, i) => ({ ...s, displayOrder: i }));

    setRoutines((prev) =>
      prev.map((r) => (r.id === routineId ? { ...r, steps: reordered } : r))
    );

    try {
      await updateRoutine(routineId, { steps: reordered });
    } catch (error) {
      console.error('Failed to reorder steps:', error);
    }
  };

  // ── Loading state ───────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          <div className="h-4 w-72 mt-2 bg-muted rounded animate-pulse" />
        </div>
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-40 w-full bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
          <Sparkles className="h-6 w-6" />
          뷰티 루틴 관리
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          스킨케어 루틴을 단계별로 소개하며 상품을 태그하세요
        </p>
      </div>

      {/* Create New Routine */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 space-y-1">
              <Label htmlFor="new-routine-name">새 루틴 이름</Label>
              <Input
                id="new-routine-name"
                placeholder="예: 나의 모닝 루틴"
                value={newRoutineName}
                onChange={(e) => setNewRoutineName(e.target.value.slice(0, 20))}
                maxLength={20}
              />
              <p className="text-xs text-muted-foreground">
                {newRoutineName.length}/20
              </p>
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleCreateRoutine}
                disabled={creatingRoutine || !newRoutineName.trim()}
              >
                {creatingRoutine ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                루틴 만들기
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Routines List */}
      {routines.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Sparkles className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">아직 루틴이 없습니다</p>
            <p className="text-sm text-muted-foreground">
              새 루틴을 만들어 스킨케어 단계를 소개해 보세요
            </p>
          </CardContent>
        </Card>
      ) : (
        routines.map((routine, routineIndex) => {
          const isExpanded = expandedRoutineId === routine.id;

          return (
            <Card key={routine.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Reorder buttons */}
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleMoveRoutine(routineIndex, 'up')}
                        disabled={routineIndex === 0}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleMoveRoutine(routineIndex, 'down')}
                        disabled={routineIndex === routines.length - 1}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Title & badge */}
                    <button
                      className="text-left"
                      onClick={() =>
                        setExpandedRoutineId(isExpanded ? null : routine.id)
                      }
                    >
                      <CardTitle className="flex items-center gap-2">
                        {routine.name}
                        <Badge variant="secondary">
                          {routine.steps.length}단계
                        </Badge>
                      </CardTitle>
                    </button>
                  </div>

                  {/* Visibility + delete */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      {routine.isVisible ? (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      )}
                      <Switch
                        checked={routine.isVisible}
                        onCheckedChange={() => handleToggleVisibility(routine.id)}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeleteRoutine(routine.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Expanded: show steps */}
              {isExpanded && (
                <CardContent>
                  <Separator className="mb-4" />

                  {routine.steps.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      아직 단계가 없습니다. 아래에서 단계를 추가하세요.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {routine.steps.map((step, stepIndex) => (
                        <div
                          key={step.id}
                          className="flex items-start gap-3 p-3 border rounded-lg"
                        >
                          {/* Step reorder */}
                          <div className="flex flex-col gap-0.5 pt-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0"
                              onClick={() =>
                                handleMoveStep(routine.id, stepIndex, 'up')
                              }
                              disabled={stepIndex === 0}
                            >
                              <ChevronUp className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0"
                              onClick={() =>
                                handleMoveStep(routine.id, stepIndex, 'down')
                              }
                              disabled={stepIndex === routine.steps.length - 1}
                            >
                              <ChevronDown className="h-3 w-3" />
                            </Button>
                          </div>

                          {/* Step number */}
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                            {stepIndex + 1}
                          </div>

                          {/* Step content */}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">{step.stepName}</p>
                            <p className="text-sm text-muted-foreground mt-0.5 whitespace-pre-wrap">
                              {step.stepDescription}
                            </p>
                            {step.imageUrl && (
                              <div className="mt-2 rounded-lg overflow-hidden border max-w-[200px]">
                                <img
                                  src={step.imageUrl}
                                  alt={step.stepName}
                                  className="w-full h-24 object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              </div>
                            )}
                            {step.productTags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {step.productTags.map((tag, ti) => (
                                  <Badge key={ti} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Delete step */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 shrink-0"
                            onClick={() => handleDeleteStep(routine.id, step.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add step form */}
                  {addingStepToId === routine.id ? (
                    <div className="mt-4 p-4 border rounded-lg space-y-3 bg-muted/30">
                      <div className="space-y-1">
                        <Label>단계 이름</Label>
                        <Input
                          placeholder="예: 클렌징"
                          value={newStep.stepName}
                          onChange={(e) =>
                            setNewStep((prev) => ({
                              ...prev,
                              stepName: e.target.value.slice(0, 20),
                            }))
                          }
                          maxLength={20}
                        />
                        <p className="text-xs text-muted-foreground">
                          {newStep.stepName.length}/20
                        </p>
                      </div>
                      <div className="space-y-1">
                        <Label>설명</Label>
                        <Textarea
                          placeholder="이 단계에서 어떤 스킨케어를 하는지 설명해 주세요"
                          value={newStep.stepDescription}
                          onChange={(e) =>
                            setNewStep((prev) => ({
                              ...prev,
                              stepDescription: e.target.value.slice(0, 500),
                            }))
                          }
                          rows={3}
                          maxLength={500}
                        />
                        <p className="text-xs text-muted-foreground">
                          {newStep.stepDescription.length}/500
                        </p>
                      </div>
                      <div className="space-y-1">
                        <Label>이미지 URL (선택)</Label>
                        <Input
                          placeholder="https://example.com/step-image.jpg"
                          value={newStep.imageUrl}
                          onChange={(e) =>
                            setNewStep((prev) => ({ ...prev, imageUrl: e.target.value }))
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>상품 태그 (선택, 콤마로 구분)</Label>
                        <Input
                          placeholder="예: 클렌징폼, 클렌징오일"
                          value={newStep.productTags}
                          onChange={(e) =>
                            setNewStep((prev) => ({ ...prev, productTags: e.target.value }))
                          }
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setAddingStepToId(null);
                            setNewStep({
                              stepName: '',
                              stepDescription: '',
                              imageUrl: '',
                              productTags: '',
                            });
                          }}
                        >
                          취소
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleAddStep(routine.id)}
                          disabled={!newStep.stepName.trim()}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          단계 추가
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-4"
                      onClick={() => setAddingStepToId(routine.id)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      새 단계 추가
                    </Button>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })
      )}
    </div>
  );
}
