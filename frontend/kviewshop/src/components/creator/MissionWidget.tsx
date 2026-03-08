'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle2, Circle, Rocket, Trophy } from 'lucide-react';
import { MISSION_LABELS } from '@/types/database';
import type { MissionKey } from '@/types/database';

interface Mission {
  id: string;
  mission_key: MissionKey;
  is_completed: boolean;
  completed_at?: string;
  reward_amount: number;
}

interface MissionsData {
  missions: Mission[];
  completedCount: number;
  totalCount: number;
  daysSinceSignup: number;
  allCompleted: boolean;
  expired: boolean;
}

export function MissionWidget() {
  const [data, setData] = useState<MissionsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMissions = async () => {
      try {
        const res = await fetch('/api/creator/missions');
        if (res.ok) {
          setData(await res.json());
        }
      } catch (err) {
        console.error('Failed to fetch missions:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMissions();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.expired) return null;

  const daysLeft = Math.max(0, 30 - data.daysSinceSignup);
  const progressPercent = data.totalCount > 0
    ? Math.round((data.completedCount / data.totalCount) * 100)
    : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Rocket className="h-5 w-5 text-pink-500" />
            크리에이터 파일럿
          </CardTitle>
          {data.allCompleted ? (
            <span className="flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
              <Trophy className="h-3 w-3" />
              완료!
            </span>
          ) : (
            <span className="rounded-full bg-pink-100 px-3 py-1 text-xs font-medium text-pink-700">
              D-{daysLeft}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div>
          <div className="mb-1 flex justify-between text-xs text-gray-500">
            <span>{data.completedCount}/{data.totalCount} 미션</span>
            <span>{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Mission List */}
        <div className="space-y-2">
          {data.missions.map((mission) => (
            <div
              key={mission.id}
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                mission.is_completed
                  ? 'bg-green-50 text-green-700'
                  : 'bg-gray-50 text-gray-600'
              }`}
            >
              <div className="flex items-center gap-2">
                {mission.is_completed ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <Circle className="h-4 w-4 text-gray-300" />
                )}
                <span className={mission.is_completed ? 'line-through' : ''}>
                  {MISSION_LABELS[mission.mission_key]}
                </span>
              </div>
              <span className={`text-xs font-medium ${
                mission.is_completed ? 'text-green-600' : 'text-gray-400'
              }`}>
                {mission.reward_amount > 0
                  ? `+${mission.reward_amount.toLocaleString()}P`
                  : '개설 완료'}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
