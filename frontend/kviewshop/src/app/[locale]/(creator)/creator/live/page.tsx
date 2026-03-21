'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Video,
  Plus,
  Calendar,
  Clock,
  Users,
  ShoppingBag,
  Bot,
  ExternalLink,
  Loader2,
  Instagram,
  Youtube,
  Music2,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/i18n/config';
import {
  getCreatorSession,
  getCreatorLiveSessions,
  getCreatorBotSettings,
  createLiveSession,
  saveBotSettings,
} from '@/lib/actions/creator';

interface LiveSession {
  id: string;
  title: string;
  description: string;
  platform: string;
  externalUrl?: string;
  scheduledAt: string;
  startedAt: string | null;
  endedAt?: string | null;
  status: string;
  peakViewers?: number;
  totalViewers?: number;
  totalOrders?: number;
  totalRevenue?: number;
  chatEnabled: boolean;
  botEnabled: boolean;
}

interface BotSettingsData {
  isEnabled: boolean;
  welcomeMessage: string;
  productLinkInterval: number;
  scheduledMessages: Array<{ time_offset: number; message: string }>;
  autoResponses: Record<string, string>;
}

const STATUS_LABELS: Record<string, string> = {
  live: '라이브 중',
  scheduled: '예정됨',
  ended: '종료됨',
  cancelled: '취소됨',
};

const STATUS_COLORS: Record<string, string> = {
  live: 'bg-red-500 text-white',
  scheduled: 'bg-blue-50 text-blue-700',
  ended: 'bg-gray-100 text-gray-500',
  cancelled: 'bg-red-50 text-red-600',
};

export default function CreatorLivePage() {
  const params = useParams();
  const locale = params.locale as string;

  const [creator, setCreator] = useState<{ id: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'sessions' | 'bot'>('sessions');
  const [botSettingsState, setBotSettingsState] = useState<BotSettingsData>({
    isEnabled: false,
    welcomeMessage: '라이브에 오신 것을 환영합니다! 아래에서 상품을 확인해보세요.',
    productLinkInterval: 300,
    scheduledMessages: [],
    autoResponses: {},
  });

  const [newSession, setNewSession] = useState({
    title: '',
    description: '',
    platform: 'instagram' as string,
    externalUrl: '',
    scheduledAt: '',
    chatEnabled: true,
    botEnabled: false,
  });

  const [newAutoResponse, setNewAutoResponse] = useState({ keyword: '', response: '' });

  useEffect(() => {
    const loadData = async () => {
      const creatorData = await getCreatorSession();
      if (!creatorData) {
        setIsLoading(false);
        return;
      }
      setCreator(creatorData as any);

      try {
        const [sessionsData, botData] = await Promise.all([
          getCreatorLiveSessions(creatorData.id),
          getCreatorBotSettings(creatorData.id),
        ]);

        if (sessionsData) {
          setSessions(sessionsData as unknown as LiveSession[]);
        }

        if (botData) {
          setBotSettingsState({
            isEnabled: (botData as any).isEnabled ?? false,
            welcomeMessage: (botData as any).welcomeMessage ?? '',
            productLinkInterval: (botData as any).productLinkInterval ?? 300,
            scheduledMessages: (botData as any).scheduledMessages ?? [],
            autoResponses: (botData as any).autoResponses ?? {},
          });
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleCreateSession = async () => {
    if (!creator || !newSession.title || !newSession.scheduledAt) {
      toast.error('필수 항목을 입력해주세요');
      return;
    }

    try {
      const data = await createLiveSession({
        creatorId: creator.id,
        title: newSession.title,
        description: newSession.description,
        platform: newSession.platform,
        externalUrl: newSession.externalUrl,
        scheduledAt: newSession.scheduledAt,
        chatEnabled: newSession.chatEnabled,
        botEnabled: newSession.botEnabled,
      });

      setSessions([data as unknown as LiveSession, ...sessions]);
      setShowCreateForm(false);
      setNewSession({
        title: '',
        description: '',
        platform: 'instagram',
        externalUrl: '',
        scheduledAt: '',
        chatEnabled: true,
        botEnabled: false,
      });
      toast.success('라이브가 예약되었습니다');
    } catch (error) {
      toast.error('라이브 예약에 실패했습니다');
    }
  };

  const handleSaveBotSettings = async () => {
    if (!creator) return;

    try {
      await saveBotSettings({
        creatorId: creator.id,
        isEnabled: botSettingsState.isEnabled,
        welcomeMessage: botSettingsState.welcomeMessage,
        productLinkInterval: botSettingsState.productLinkInterval,
        scheduledMessages: botSettingsState.scheduledMessages,
        autoResponses: botSettingsState.autoResponses,
      });
      toast.success('봇 설정이 저장되었습니다');
    } catch (error) {
      toast.error('설정 저장에 실패했습니다');
    }
  };

  const addAutoResponse = () => {
    if (!newAutoResponse.keyword || !newAutoResponse.response) return;
    setBotSettingsState({
      ...botSettingsState,
      autoResponses: {
        ...botSettingsState.autoResponses,
        [newAutoResponse.keyword]: newAutoResponse.response,
      },
    });
    setNewAutoResponse({ keyword: '', response: '' });
  };

  const removeAutoResponse = (keyword: string) => {
    const { [keyword]: _, ...rest } = botSettingsState.autoResponses;
    setBotSettingsState({ ...botSettingsState, autoResponses: rest });
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'instagram': return <Instagram className="h-4 w-4" />;
      case 'youtube': return <Youtube className="h-4 w-4" />;
      case 'tiktok': return <Music2 className="h-4 w-4" />;
      default: return <Video className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="hidden md:flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Video className="h-5 w-5" />
            라이브 쇼핑
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            라이브 방송을 예약하고 자동 채팅 봇을 설정하세요
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)} className="bg-gray-900 text-white hover:bg-gray-800 rounded-xl h-10">
          <Plus className="h-4 w-4 mr-2" />
          라이브 예약
        </Button>
      </div>

      {/* Mobile header + button */}
      <div className="md:hidden">
        <Button onClick={() => setShowCreateForm(true)} className="w-full bg-gray-900 text-white hover:bg-gray-800 rounded-xl h-12">
          <Plus className="h-4 w-4 mr-2" />
          라이브 예약
        </Button>
      </div>

      {/* Tab Switcher */}
      <div className="flex rounded-xl bg-gray-100 p-1 gap-1">
        <button
          onClick={() => setActiveTab('sessions')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'sessions' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
          }`}
        >
          <Calendar className="h-4 w-4" />
          세션
        </button>
        <button
          onClick={() => setActiveTab('bot')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'bot' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
          }`}
        >
          <Bot className="h-4 w-4" />
          라이브 봇
        </button>
      </div>

      {activeTab === 'sessions' && (
        <div className="space-y-4">
          {/* Create Form */}
          {showCreateForm && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
              <h3 className="text-base font-semibold text-gray-900">새 라이브 예약</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-500">제목 *</Label>
                  <Input
                    placeholder="라이브 제목을 입력하세요"
                    value={newSession.title}
                    onChange={(e) => setNewSession({ ...newSession, title: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-500">플랫폼</Label>
                  <select
                    value={newSession.platform}
                    onChange={(e) => setNewSession({ ...newSession, platform: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-white text-sm"
                  >
                    <option value="instagram">인스타그램</option>
                    <option value="youtube">유튜브</option>
                    <option value="tiktok">틱톡</option>
                    <option value="internal">자체 플랫폼</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">설명</Label>
                <Textarea
                  placeholder="어떤 내용으로 방송하실 건가요?"
                  value={newSession.description}
                  onChange={(e) => setNewSession({ ...newSession, description: e.target.value })}
                  rows={3}
                  className="rounded-xl"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-500">예약 시간 *</Label>
                  <Input
                    type="datetime-local"
                    value={newSession.scheduledAt}
                    onChange={(e) => setNewSession({ ...newSession, scheduledAt: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-500">외부 링크</Label>
                  <Input
                    placeholder="https://..."
                    value={newSession.externalUrl}
                    onChange={(e) => setNewSession({ ...newSession, externalUrl: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={newSession.chatEnabled}
                    onCheckedChange={(checked) => setNewSession({ ...newSession, chatEnabled: checked })}
                  />
                  <Label className="text-sm">채팅 활성화</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={newSession.botEnabled}
                    onCheckedChange={(checked) => setNewSession({ ...newSession, botEnabled: checked })}
                  />
                  <Label className="text-sm">자동 봇 활성화</Label>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleCreateSession} className="bg-gray-900 text-white hover:bg-gray-800 rounded-xl h-12 flex-1">
                  예약하기
                </Button>
                <Button variant="outline" onClick={() => setShowCreateForm(false)} className="rounded-xl h-12 flex-1">
                  취소
                </Button>
              </div>
            </div>
          )}

          {/* Sessions List */}
          {sessions.length === 0 ? (
            <div className="text-center py-16">
              <Video className="h-12 w-12 mx-auto text-gray-200 mb-3" />
              <p className="text-sm font-medium text-gray-500">아직 라이브 세션이 없어요</p>
              <p className="text-xs text-gray-400 mt-1">첫 번째 라이브 쇼핑을 예약해보세요</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div key={session.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-gray-50">
                        {getPlatformIcon(session.platform)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-sm text-gray-900">{session.title}</h3>
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[session.status] || 'bg-gray-100 text-gray-500'} ${session.status === 'live' ? 'animate-pulse' : ''}`}>
                            {STATUS_LABELS[session.status] || session.status}
                          </span>
                        </div>
                        {session.description && (
                          <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{session.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(session.scheduledAt).toLocaleString('ko-KR')}
                          </span>
                          {session.status === 'ended' && (
                            <>
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {session.totalViewers}명
                              </span>
                              <span className="flex items-center gap-1">
                                <ShoppingBag className="h-3 w-3" />
                                {session.totalOrders}건
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    {session.externalUrl && (
                      <a href={session.externalUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-400 hover:text-gray-600">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'bot' && (
        <div className="space-y-4">
          {/* Bot Enable */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">라이브 봇 활성화</p>
                <p className="text-xs text-gray-400 mt-0.5">자동으로 상품 링크 전송 및 키워드 응답</p>
              </div>
              <Switch
                checked={botSettingsState.isEnabled}
                onCheckedChange={(checked) => setBotSettingsState({ ...botSettingsState, isEnabled: checked })}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">환영 메시지</Label>
              <Textarea
                placeholder="라이브 시작 시 보낼 메시지..."
                value={botSettingsState.welcomeMessage}
                onChange={(e) => setBotSettingsState({ ...botSettingsState, welcomeMessage: e.target.value })}
                rows={2}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">상품 링크 전송 간격 (초)</Label>
              <Input
                type="number"
                value={botSettingsState.productLinkInterval}
                onChange={(e) => setBotSettingsState({
                  ...botSettingsState,
                  productLinkInterval: parseInt(e.target.value) || 300
                })}
                className="rounded-xl"
              />
              <p className="text-xs text-gray-400">
                자동으로 상품 링크를 전송하는 간격 (최소 60초)
              </p>
            </div>

            {/* Auto Responses */}
            <div className="space-y-3">
              <Label className="text-xs text-gray-500">자동 응답</Label>
              <p className="text-xs text-gray-400">
                시청자가 키워드를 입력하면 봇이 자동으로 응답합니다
              </p>

              <div className="flex gap-2">
                <Input
                  placeholder="키워드 (예: 가격)"
                  value={newAutoResponse.keyword}
                  onChange={(e) => setNewAutoResponse({ ...newAutoResponse, keyword: e.target.value })}
                  className="rounded-xl"
                />
                <Input
                  placeholder="응답 메시지"
                  value={newAutoResponse.response}
                  onChange={(e) => setNewAutoResponse({ ...newAutoResponse, response: e.target.value })}
                  className="rounded-xl"
                />
                <Button onClick={addAutoResponse} size="icon" className="shrink-0 rounded-xl h-10 w-10">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                {Object.entries(botSettingsState.autoResponses).map(([keyword, response]) => (
                  <div key={keyword} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-xs px-2 py-1 rounded-lg bg-blue-50 text-blue-700 shrink-0">
                        {keyword}
                      </span>
                      <span className="text-sm text-gray-600 truncate">{response}</span>
                    </div>
                    <button onClick={() => removeAutoResponse(keyword)} className="p-2 text-gray-400 hover:text-red-500 shrink-0 min-h-[48px] min-w-[48px] flex items-center justify-center">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={handleSaveBotSettings} className="w-full h-12 bg-gray-900 text-white hover:bg-gray-800 rounded-xl">
              봇 설정 저장
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
