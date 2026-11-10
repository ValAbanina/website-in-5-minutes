/** Anonymous stats. No-op when STATS_URL is empty. No personal data. */

export function createStats(url) {
  const session = (crypto.randomUUID && crypto.randomUUID()) || String(Date.now());
  const device = () => {
    const w = window.innerWidth;
    if (w < 768) return 'phone';
    if (w < 1200) return 'tablet';
    return 'desktop';
  };

  return {
    send(event, fields = {}) {
      if (!url) return;
      const body = JSON.stringify({ event, session, device: device(), ...fields });
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body,
        mode: 'no-cors',
        keepalive: true,
      }).catch(() => {});
    },
  };
}
