'use client';

import { useEffect } from 'react';

interface VisitTrackerProps {
  creatorId: string;
}

export function VisitTracker({ creatorId }: VisitTrackerProps) {
  useEffect(() => {
    const key = `cnec_tracked_${creatorId}`;
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem(key)) return;

    const params = new URLSearchParams(window.location.search);
    const utmSource = params.get('utm_source') || '';
    const utmMedium = params.get('utm_medium') || '';
    const utmCampaign = params.get('utm_campaign') || '';

    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creator_id: creatorId,
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
        referrer: document.referrer || '',
      }),
    }).catch(() => {});

    sessionStorage.setItem(key, '1');
  }, [creatorId]);

  return null;
}
