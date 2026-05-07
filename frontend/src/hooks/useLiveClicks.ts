import { useEffect, useState, useRef } from "react";

interface ClickEvent {
  url_id: number;
  short_code: string;
  country: string | null;
  device_type: string | null;
  browser: string | null;
  clicked_at: string;
}

export function useLiveClicks(shortCode: string | null) {
  const [events, setEvents] = useState<ClickEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!shortCode) return;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";
    const ws = new WebSocket(`${wsUrl}/ws/clicks/${shortCode}`);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);

    ws.onmessage = (msg) => {
      try {
        const event: ClickEvent = JSON.parse(msg.data);
        setEvents((prev) => [event, ...prev].slice(0, 50));
      } catch (e) {
        console.error("Bad WS message", e);
      }
    };

    return () => {
      ws.close();
    };
  }, [shortCode]);

  return { events, connected };
}
