'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Plus,
  FolderOpen,
  Loader2,
  ChevronUp,
  ChevronDown,
  Trash2,
  Eye,
  EyeOff,
  Package,
  X,
  Film,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getCreatorSession,
  getCreatorCollections,
  createCollection,
  toggleCollectionVisibility,
  deleteCollection,
  updateCollectionOrder,
  addItemToCollection,
  removeItemFromCollection,
  updateItemOrder,
  updateShopItemReels,
} from '@/lib/actions/creator';

interface ProductData {
  id: string;
  name: string;
  images: string[] | null;
}

interface ShopItem {
  id: string;
  creatorId: string;
  productId: string;
  collectionId: string | null;
  type: string;
  displayOrder: number;
  isVisible: boolean;
  reelsUrl?: string | null;
  reelsCaption?: string | null;
  product?: ProductData;
}

interface CollectionWithItems {
  id: string;
  creatorId: string;
  name: string;
  description: string | null;
  isVisible: boolean;
  displayOrder: number;
  items?: ShopItem[];
}

export default function CreatorCollectionsPage() {
  const [creator, setCreator] = useState<{ id: string } | null>(null);
  const [collections, setCollections] = useState<CollectionWithItems[]>([]);
  const [availableItems, setAvailableItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  // Add product dialog
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [addToCollectionId, setAddToCollectionId] = useState<string | null>(null);

  // Reels dialog
  const [reelsTarget, setReelsTarget] = useState<ShopItem | null>(null);
  const [reelsUrl, setReelsUrl] = useState('');
  const [reelsCaption, setReelsCaption] = useState('');
  const [reelsSaving, setReelsSaving] = useState(false);

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
        const data = await getCreatorCollections(creatorData.id);
        if (!cancelled) {
          setCollections(data.collections as CollectionWithItems[]);
          setAvailableItems(data.allItems as ShopItem[]);
        }
      } catch (error) {
        console.error('Failed to fetch collections:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, []);

  const handleCreate = async () => {
    if (!creator || !newName.trim()) return;
    setCreating(true);

    try {
      const data = await createCollection({
        creatorId: creator.id,
        name: newName.trim(),
        description: newDesc.trim() || undefined,
        displayOrder: collections.length,
      });

      toast.success('컬렉션이 생성되었습니다');
      setCollections((prev) => [...prev, { ...data, items: [] } as CollectionWithItems]);
      setNewName('');
      setNewDesc('');
      setCreateOpen(false);
    } catch (error) {
      toast.error('컬렉션 생성에 실패했습니다');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleVisibility = async (collection: CollectionWithItems) => {
    const newVisible = !collection.isVisible;

    setCollections((prev) =>
      prev.map((c) => (c.id === collection.id ? { ...c, isVisible: newVisible } : c))
    );

    try {
      await toggleCollectionVisibility(collection.id, newVisible);
    } catch (error) {
      toast.error('변경에 실패했습니다');
      setCollections((prev) =>
        prev.map((c) => (c.id === collection.id ? { ...c, isVisible: !newVisible } : c))
      );
    }
  };

  const handleDeleteCollection = async (collectionId: string) => {
    if (!confirm('이 컬렉션을 삭제하시겠습니까?')) return;

    try {
      await deleteCollection(collectionId);
      toast.success('컬렉션이 삭제되었습니다');
      setCollections((prev) => prev.filter((c) => c.id !== collectionId));
    } catch (error) {
      toast.error('삭제에 실패했습니다');
    }
  };

  const handleMoveCollection = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= collections.length) return;

    const newCollections = [...collections];
    const temp = newCollections[index];
    newCollections[index] = newCollections[newIndex];
    newCollections[newIndex] = temp;

    const updated = newCollections.map((c, i) => ({ ...c, displayOrder: i }));
    setCollections(updated);

    for (const col of updated) {
      await updateCollectionOrder(col.id, col.displayOrder);
    }
  };

  const handleAddProduct = async (item: ShopItem) => {
    if (!addToCollectionId) return;

    try {
      await addItemToCollection(item.id, addToCollectionId);
      toast.success('상품이 컬렉션에 추가되었습니다');
      setCollections((prev) =>
        prev.map((c) =>
          c.id === addToCollectionId
            ? { ...c, items: [...(c.items ?? []), item] }
            : c
        )
      );
      setAddProductOpen(false);
    } catch (error) {
      toast.error('추가에 실패했습니다');
    }
  };

  const handleRemoveProduct = async (collectionId: string, itemId: string) => {
    try {
      await removeItemFromCollection(itemId);
      setCollections((prev) =>
        prev.map((c) =>
          c.id === collectionId
            ? { ...c, items: (c.items ?? []).filter((item) => item.id !== itemId) }
            : c
        )
      );
    } catch (error) {
      toast.error('삭제에 실패했습니다');
    }
  };

  const handleMoveItem = async (
    collectionId: string,
    itemIndex: number,
    direction: 'up' | 'down'
  ) => {
    const col = collections.find((c) => c.id === collectionId);
    if (!col?.items) return;

    const newIndex = direction === 'up' ? itemIndex - 1 : itemIndex + 1;
    if (newIndex < 0 || newIndex >= col.items.length) return;

    const newItems = [...col.items];
    const temp = newItems[itemIndex];
    newItems[itemIndex] = newItems[newIndex];
    newItems[newIndex] = temp;

    const updatedItems = newItems.map((item, i) => ({ ...item, displayOrder: i }));

    setCollections((prev) =>
      prev.map((c) => (c.id === collectionId ? { ...c, items: updatedItems } : c))
    );

    for (const item of updatedItems) {
      await updateItemOrder(item.id, item.displayOrder);
    }
  };

  const handleOpenReels = (item: ShopItem) => {
    setReelsTarget(item);
    setReelsUrl(item.reelsUrl || '');
    setReelsCaption(item.reelsCaption || '');
  };

  const handleSaveReels = async () => {
    if (!reelsTarget) return;
    setReelsSaving(true);
    try {
      await updateShopItemReels(
        reelsTarget.id,
        reelsUrl.trim() || null,
        reelsCaption.trim() || undefined
      );
      // Update local state
      const updateItem = (item: ShopItem) =>
        item.id === reelsTarget.id
          ? { ...item, reelsUrl: reelsUrl.trim() || null, reelsCaption: reelsCaption.trim() || null }
          : item;
      setCollections((prev) =>
        prev.map((c) => ({ ...c, items: (c.items ?? []).map(updateItem) }))
      );
      setAvailableItems((prev) => prev.map(updateItem));
      toast.success('릴스 정보가 저장되었습니다');
      setReelsTarget(null);
    } catch (error: any) {
      toast.error(error?.message || '저장에 실패했습니다');
    } finally {
      setReelsSaving(false);
    }
  };

  const handleDeleteReels = async () => {
    if (!reelsTarget) return;
    setReelsSaving(true);
    try {
      await updateShopItemReels(reelsTarget.id, null);
      const updateItem = (item: ShopItem) =>
        item.id === reelsTarget.id
          ? { ...item, reelsUrl: null, reelsCaption: null }
          : item;
      setCollections((prev) =>
        prev.map((c) => ({ ...c, items: (c.items ?? []).map(updateItem) }))
      );
      setAvailableItems((prev) => prev.map(updateItem));
      toast.success('릴스 정보가 삭제되었습니다');
      setReelsTarget(null);
    } catch (error: any) {
      toast.error(error?.message || '삭제에 실패했습니다');
    } finally {
      setReelsSaving(false);
    }
  };

  // Items not assigned to any collection
  const unassignedItems = availableItems.filter(
    (item) => !item.collectionId
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">컬렉션 관리</h1>
          <p className="text-sm text-muted-foreground">
            상품을 컬렉션으로 묶어 관리하세요
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              새 컬렉션
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>새 컬렉션 만들기</DialogTitle>
              <DialogDescription>
                컬렉션 이름과 설명을 입력하세요
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>컬렉션 이름</Label>
                <Input
                  placeholder="예: 여름 스킨케어 추천"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>설명 (선택)</Label>
                <Textarea
                  placeholder="컬렉션에 대한 설명을 입력하세요"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                취소
              </Button>
              <Button onClick={handleCreate} disabled={creating || !newName.trim()}>
                {creating ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />생성 중...</>
                ) : (
                  '생성'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Collections List */}
      {collections.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">아직 컬렉션이 없습니다</p>
            <p className="text-sm text-muted-foreground">
              새 컬렉션을 만들어 상품을 정리해 보세요
            </p>
          </CardContent>
        </Card>
      ) : (
        collections.map((collection, colIndex) => (
          <Card key={collection.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => handleMoveCollection(colIndex, 'up')}
                      disabled={colIndex === 0}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => handleMoveCollection(colIndex, 'down')}
                      disabled={colIndex === collections.length - 1}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {collection.name}
                      <Badge variant="secondary">
                        {(collection.items ?? []).length}개 상품
                      </Badge>
                    </CardTitle>
                    {collection.description && (
                      <CardDescription className="mt-1">
                        {collection.description}
                      </CardDescription>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    {collection.isVisible ? (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                    <Switch
                      checked={collection.isVisible}
                      onCheckedChange={() => handleToggleVisibility(collection)}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDeleteCollection(collection.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Items in this collection */}
              {(collection.items ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  이 컬렉션에 상품이 없습니다
                </p>
              ) : (
                <div className="space-y-2">
                  {(collection.items ?? []).map((item, itemIndex) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 border rounded-lg"
                    >
                      {/* Reorder buttons */}
                      <div className="flex flex-col gap-0.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0"
                          onClick={() => handleMoveItem(collection.id, itemIndex, 'up')}
                          disabled={itemIndex === 0}
                        >
                          <ChevronUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0"
                          onClick={() =>
                            handleMoveItem(collection.id, itemIndex, 'down')
                          }
                          disabled={itemIndex === (collection.items ?? []).length - 1}
                        >
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </div>
                      {/* Product thumbnail */}
                      <div className="h-10 w-10 bg-muted rounded shrink-0">
                        {item.product?.images?.[0] ? (
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="h-full w-full object-cover rounded"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <Package className="h-4 w-4 text-muted-foreground/50" />
                          </div>
                        )}
                      </div>
                      {/* Product info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {item.product?.name ?? '상품'}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {item.type === 'GONGGU' ? '공구' : '픽'}
                        </Badge>
                      </div>
                      {/* Reels button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-8 w-8 p-0 ${item.reelsUrl ? 'text-pink-500' : 'text-muted-foreground'}`}
                        onClick={() => handleOpenReels(item)}
                        title="릴스 연결"
                      >
                        <Film className="h-4 w-4" />
                      </Button>
                      {/* Remove button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleRemoveProduct(collection.id, item.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add product button */}
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-3"
                onClick={() => {
                  setAddToCollectionId(collection.id);
                  setAddProductOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-1" />
                상품 추가
              </Button>
            </CardContent>
          </Card>
        ))
      )}

      {/* Reels Dialog */}
      <Dialog open={!!reelsTarget} onOpenChange={(open) => !open && setReelsTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>릴스 연결</DialogTitle>
            <DialogDescription>
              {reelsTarget?.product?.name ?? '상품'}에 인스타그램 릴스를 연결하세요
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>릴스 URL</Label>
              <Input
                placeholder="https://www.instagram.com/reel/..."
                value={reelsUrl}
                onChange={(e) => setReelsUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>한줄 소개 (선택)</Label>
              <Input
                placeholder="이 제품 진짜 좋아요!"
                value={reelsCaption}
                onChange={(e) => setReelsCaption(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="flex-row gap-2 sm:justify-between">
            {reelsTarget?.reelsUrl && (
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={handleDeleteReels}
                disabled={reelsSaving}
              >
                삭제
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" onClick={() => setReelsTarget(null)}>
                취소
              </Button>
              <Button onClick={handleSaveReels} disabled={reelsSaving}>
                {reelsSaving ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />저장 중...</>
                ) : (
                  '저장'
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Product to Collection Dialog */}
      <Dialog open={addProductOpen} onOpenChange={setAddProductOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>컬렉션에 상품 추가</DialogTitle>
            <DialogDescription>
              추가할 상품을 선택하세요
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-80 overflow-y-auto space-y-2 py-4">
            {unassignedItems.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                추가할 수 있는 상품이 없습니다
              </p>
            ) : (
              unassignedItems.map((item) => (
                <button
                  key={item.id}
                  className="flex items-center gap-3 w-full p-3 border rounded-lg hover:bg-accent transition-colors text-left"
                  onClick={() => handleAddProduct(item)}
                >
                  <div className="h-10 w-10 bg-muted rounded shrink-0">
                    {item.product?.images?.[0] ? (
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="h-full w-full object-cover rounded"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <Package className="h-4 w-4 text-muted-foreground/50" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {item.product?.name ?? '상품'}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {item.type === 'GONGGU' ? '공구' : '픽'}
                    </Badge>
                  </div>
                  <Plus className="h-4 w-4 text-muted-foreground" />
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
