import { useEffect, useState } from 'react';
export interface WebsiteRelease { available: boolean; version?: string; size?: number; sha256?: string }
export function useRelease() {
  const [release, setRelease] = useState<WebsiteRelease>({available:false});
  useEffect(() => {
    const controller = new AbortController();
    const refresh = () => { if(document.hidden) return; fetch('/api/release', {signal:controller.signal, cache:'no-store'})
      .then(r => r.ok ? r.json() : null)
      .then(r => { if(r?.available === false) setRelease({available:false}); else if(r && r.available === true && typeof r.version === 'string' && r.size > 0) setRelease(r); })
      .catch(() => {}); };
    refresh();
    const timer = window.setInterval(refresh, 30000);
    document.addEventListener('visibilitychange',refresh);
    return () => { controller.abort(); window.clearInterval(timer); document.removeEventListener('visibilitychange',refresh); };
  }, []);
  return release;
}
