'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Headphones,
  Package,
  MessageSquare,
  Loader2,
  Clock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Send,
  Inbox,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import { getClient } from '@/lib/supabase/client';

type TicketCategory = 'product' | 'cs';
type TicketStatus = 'open' | 'resolved';

interface SupportTicket {
  id: string;
  category: TicketCategory;
  subject: string;
  description: string;
  status: TicketStatus;
  from_name: string;
  from_email: string;
  order_id?: string;
  created_at: string;
  updated_at: string;
  response?: string;
}

export default function BrandSupportPage() {
  const t = useTranslations('support');
  const tCommon = useTranslations('common');

  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('all');
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);

  useEffect(() => {
    async function loadTickets() {
      try {
        const supabase = getClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        const { data: brand } = await supabase
          .from('brands')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!brand) { setLoading(false); return; }

        const { data } = await supabase
          .from('support_tickets')
          .select('*')
          .eq('brand_id', brand.id)
          .order('created_at', { ascending: false });

        setTickets(data || []);
      } catch (error) {
        console.error('Failed to load tickets:', error);
      } finally {
        setLoading(false);
      }
    }

    loadTickets();
  }, []);

  const handleReply = async (ticketId: string) => {
    const text = replyText[ticketId]?.trim();
    if (!text) return;

    setSubmitting(ticketId);
    try {
      const supabase = getClient();
      const { error } = await supabase
        .from('support_tickets')
        .update({ response: text, status: 'resolved', updated_at: new Date().toISOString() })
        .eq('id', ticketId);

      if (error) {
        toast.error(tCommon('error'));
      } else {
        setTickets(tickets.map(t =>
          t.id === ticketId ? { ...t, response: text, status: 'resolved' as TicketStatus } : t
        ));
        setReplyText({ ...replyText, [ticketId]: '' });
        toast.success(t('replied'));
      }
    } catch {
      toast.error(tCommon('error'));
    } finally {
      setSubmitting(null);
    }
  };

  const filteredTickets = filter === 'all'
    ? tickets
    : tickets.filter(tk => tk.status === filter);

  const openCount = tickets.filter(tk => tk.status === 'open').length;
  const resolvedCount = tickets.filter(tk => tk.status === 'resolved').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-headline font-bold">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-3">
        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{tCommon('all')}</p>
                <p className="text-2xl font-bold">{tickets.length}</p>
              </div>
              <Inbox className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{t('waiting')}</p>
                <p className="text-2xl font-bold">{openCount}</p>
              </div>
              <Clock className="h-5 w-5 text-warning" />
            </div>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{t('resolvedLabel')}</p>
                <p className="text-2xl font-bold">{resolvedCount}</p>
              </div>
              <CheckCircle2 className="h-5 w-5 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CS Responsibility Guide */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-primary/5 border-primary/10">
          <CardContent className="p-4 flex items-start gap-3">
            <Package className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium">{t('brandResponsibility')}</p>
              <p className="text-xs text-muted-foreground mt-1">{t('brandResponsibilityDesc')}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-accent/5 border-accent/10">
          <CardContent className="p-4 flex items-start gap-3">
            <Headphones className="h-5 w-5 text-accent mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium">{t('cnecResponsibility')}</p>
              <p className="text-xs text-muted-foreground mt-1">{t('cnecResponsibilityDesc')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inquiry List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle>{t('inquiries')}</CardTitle>
              <CardDescription>{t('inquiriesDesc')}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                {tCommon('all')} ({tickets.length})
              </Button>
              <Button
                variant={filter === 'open' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('open')}
              >
                {t('waiting')} ({openCount})
              </Button>
              <Button
                variant={filter === 'resolved' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('resolved')}
              >
                {t('resolvedLabel')} ({resolvedCount})
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTickets.length === 0 ? (
            <div className="text-center py-12">
              <Headphones className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">{t('noInquiries')}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t('noInquiriesDesc')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTickets.map((ticket) => {
                const isExpanded = expandedTicket === ticket.id;
                const isProduct = ticket.category === 'product';

                return (
                  <div
                    key={ticket.id}
                    className={`border rounded-lg overflow-hidden ${ticket.status === 'open' ? 'border-warning/30' : ''}`}
                  >
                    <button
                      className="w-full text-left p-4 hover:bg-muted/30 transition-colors"
                      onClick={() => setExpandedTicket(isExpanded ? null : ticket.id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          {isProduct ? (
                            <Package className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                          ) : (
                            <MessageSquare className="h-4 w-4 mt-0.5 text-accent shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{ticket.subject}</p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <Badge variant="outline" className="text-[10px]">
                                {isProduct ? t('productInquiry') : t('csInquiry')}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <User className="h-2.5 w-2.5" />
                                {ticket.from_name || 'Customer'}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(ticket.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {ticket.status === 'open' ? (
                            <Badge variant="outline" className="text-warning border-warning/30">
                              <Clock className="mr-1 h-3 w-3" />{t('waiting')}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-success border-success/30">
                              <CheckCircle2 className="mr-1 h-3 w-3" />{t('resolvedLabel')}
                            </Badge>
                          )}
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </div>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="p-4 pt-0 border-t space-y-4">
                        {/* Inquiry content */}
                        <div className="bg-muted/30 p-3 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <User className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs font-medium">{ticket.from_name || 'Customer'}</span>
                            {ticket.from_email && (
                              <span className="text-xs text-muted-foreground">{ticket.from_email}</span>
                            )}
                          </div>
                          <p className="text-sm">{ticket.description}</p>
                          {ticket.order_id && (
                            <p className="text-xs text-muted-foreground mt-2">
                              {t('relatedOrder')}: <span className="font-mono">#{ticket.order_id}</span>
                            </p>
                          )}
                        </div>

                        {/* Response */}
                        {ticket.response ? (
                          <div className="bg-primary/5 p-3 rounded-lg border border-primary/10">
                            <p className="text-xs font-medium text-primary mb-1">{t('yourReply')}</p>
                            <p className="text-sm">{ticket.response}</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Textarea
                              placeholder={t('replyPlaceholder')}
                              value={replyText[ticket.id] || ''}
                              onChange={(e) => setReplyText({ ...replyText, [ticket.id]: e.target.value })}
                              rows={3}
                              className="text-sm"
                            />
                            <div className="flex justify-end">
                              <Button
                                size="sm"
                                className="btn-gold"
                                onClick={() => handleReply(ticket.id)}
                                disabled={submitting === ticket.id || !replyText[ticket.id]?.trim()}
                              >
                                {submitting === ticket.id ? (
                                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                ) : (
                                  <Send className="mr-2 h-3 w-3" />
                                )}
                                {t('sendReply')}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
