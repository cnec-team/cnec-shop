'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Video,
  Plus,
  Calendar,
  Clock,
  Users,
  ShoppingBag,
  DollarSign,
  Bot,
  Settings,
  Play,
  Pause,
  Square,
  ExternalLink,
  Loader2,
  Instagram,
  Youtube,
  Music2,
  Copy,
  MessageSquare,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
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

export default function CreatorLivePage() {
  const params = useParams();
  const locale = params.locale as string;

  const [creator, setCreator] = useState<{ id: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [botSettingsState, setBotSettingsState] = useState<BotSettingsData>({
    isEnabled: false,
    welcomeMessage: 'Welcome to the live stream! Check out our products below.',
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
      toast.error('Please fill in required fields');
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
      toast.success('Live session scheduled!');
    } catch (error) {
      toast.error('Failed to create session');
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
      toast.success('Bot settings saved!');
    } catch (error) {
      toast.error('Failed to save settings');
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'live':
        return <Badge className="bg-red-500 animate-pulse">LIVE</Badge>;
      case 'scheduled':
        return <Badge variant="secondary">Scheduled</Badge>;
      case 'ended':
        return <Badge variant="outline">Ended</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return null;
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'instagram':
        return <Instagram className="h-4 w-4" />;
      case 'youtube':
        return <Youtube className="h-4 w-4" />;
      case 'tiktok':
        return <Music2 className="h-4 w-4" />;
      default:
        return <Video className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold flex items-center gap-2">
            <Video className="h-8 w-8" />
            Live Shopping
          </h1>
          <p className="text-muted-foreground mt-1">
            Schedule live streams and manage auto-chat bot
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)} className="btn-gold">
          <Plus className="h-4 w-4 mr-2" />
          Schedule Live
        </Button>
      </div>

      <Tabs defaultValue="sessions" className="w-full">
        <TabsList>
          <TabsTrigger value="sessions">
            <Calendar className="h-4 w-4 mr-2" />
            Sessions
          </TabsTrigger>
          <TabsTrigger value="bot">
            <Bot className="h-4 w-4 mr-2" />
            Live Bot
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="mt-6 space-y-4">
          {/* Create Form */}
          {showCreateForm && (
            <Card>
              <CardHeader>
                <CardTitle>Schedule New Live Session</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Title *</Label>
                    <Input
                      placeholder="Live Session Title"
                      value={newSession.title}
                      onChange={(e) => setNewSession({ ...newSession, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Platform</Label>
                    <select
                      value={newSession.platform}
                      onChange={(e) => setNewSession({ ...newSession, platform: e.target.value })}
                      className="w-full px-3 py-2 rounded-md border bg-background"
                    >
                      <option value="instagram">Instagram</option>
                      <option value="youtube">YouTube</option>
                      <option value="tiktok">TikTok</option>
                      <option value="internal">Internal</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="What will you be showing?"
                    value={newSession.description}
                    onChange={(e) => setNewSession({ ...newSession, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Scheduled Time *</Label>
                    <Input
                      type="datetime-local"
                      value={newSession.scheduledAt}
                      onChange={(e) => setNewSession({ ...newSession, scheduledAt: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>External URL</Label>
                    <Input
                      placeholder="https://..."
                      value={newSession.externalUrl}
                      onChange={(e) => setNewSession({ ...newSession, externalUrl: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={newSession.chatEnabled}
                      onCheckedChange={(checked) => setNewSession({ ...newSession, chatEnabled: checked })}
                    />
                    <Label>Enable Chat</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={newSession.botEnabled}
                      onCheckedChange={(checked) => setNewSession({ ...newSession, botEnabled: checked })}
                    />
                    <Label>Enable Auto Bot</Label>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleCreateSession}>Schedule</Button>
                  <Button variant="outline" onClick={() => setShowCreateForm(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sessions List */}
          {sessions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Video className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No live sessions yet</h3>
                <p className="text-muted-foreground">
                  Schedule your first live shopping session!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <Card key={session.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-lg bg-muted">
                          {getPlatformIcon(session.platform)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{session.title}</h3>
                            {getStatusBadge(session.status)}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {session.description}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(session.scheduledAt).toLocaleString()}
                            </span>
                            {session.status === 'ended' && (
                              <>
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {session.totalViewers} viewers
                                </span>
                                <span className="flex items-center gap-1">
                                  <ShoppingBag className="h-3 w-3" />
                                  {session.totalOrders} orders
                                </span>
                                <span className="flex items-center gap-1">
                                  <DollarSign className="h-3 w-3" />
                                  ${session.totalRevenue}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      {session.externalUrl && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={session.externalUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="bot" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Live Bot Settings
              </CardTitle>
              <CardDescription>
                Configure auto-chat bot for your live streams
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium">Enable Live Bot</p>
                  <p className="text-sm text-muted-foreground">
                    Automatically post product links and respond to keywords
                  </p>
                </div>
                <Switch
                  checked={botSettingsState.isEnabled}
                  onCheckedChange={(checked) => setBotSettingsState({ ...botSettingsState, isEnabled: checked })}
                />
              </div>

              <div className="space-y-2">
                <Label>Welcome Message</Label>
                <Textarea
                  placeholder="Message to send when live starts..."
                  value={botSettingsState.welcomeMessage}
                  onChange={(e) => setBotSettingsState({ ...botSettingsState, welcomeMessage: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Product Link Interval (seconds)</Label>
                <Input
                  type="number"
                  value={botSettingsState.productLinkInterval}
                  onChange={(e) => setBotSettingsState({
                    ...botSettingsState,
                    productLinkInterval: parseInt(e.target.value) || 300
                  })}
                />
                <p className="text-xs text-muted-foreground">
                  How often to automatically post product links (minimum 60 seconds)
                </p>
              </div>

              {/* Auto Responses */}
              <div className="space-y-4">
                <Label>Auto Responses</Label>
                <p className="text-sm text-muted-foreground">
                  Bot will automatically reply when viewers type these keywords
                </p>

                <div className="flex gap-2">
                  <Input
                    placeholder="Keyword (e.g., price)"
                    value={newAutoResponse.keyword}
                    onChange={(e) => setNewAutoResponse({ ...newAutoResponse, keyword: e.target.value })}
                  />
                  <Input
                    placeholder="Response"
                    value={newAutoResponse.response}
                    onChange={(e) => setNewAutoResponse({ ...newAutoResponse, response: e.target.value })}
                  />
                  <Button onClick={addAutoResponse}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  {Object.entries(botSettingsState.autoResponses).map(([keyword, response]) => (
                    <div key={keyword} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <span className="font-mono text-sm px-2 py-1 rounded bg-primary/10 text-primary">
                          {keyword}
                        </span>
                        <span className="mx-2 text-muted-foreground"></span>
                        <span className="text-sm">{response}</span>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeAutoResponse(keyword)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={handleSaveBotSettings} className="w-full">
                Save Bot Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
