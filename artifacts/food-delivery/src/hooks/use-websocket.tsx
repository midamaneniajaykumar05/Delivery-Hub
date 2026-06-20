import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./use-auth";
import { getListNotificationsQueryKey, getListOrdersQueryKey } from "@workspace/api-client-react";
import { useToast } from "./use-toast";

export function useRealtimeNotifications() {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (!token || !user) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws?token=${encodeURIComponent(token)}`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {};

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "notification") {
            // Invalidate notifications so the badge/list refreshes
            queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
            // Also refresh orders if it's an order update
            if (msg.data?.type === "order" || msg.data?.orderId) {
              queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
            }
            // Show a toast for real-time notifications
            if (msg.data?.title) {
              toast({ title: msg.data.title, description: msg.data.message });
            }
          }
        } catch {}
      };

      ws.onclose = () => {
        wsRef.current = null;
        // Reconnect after 5 seconds
        reconnectTimerRef.current = setTimeout(() => connect(), 5000);
      };

      ws.onerror = () => { ws.close(); };
    } catch {}
  }, [token, user, queryClient, toast]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [connect]);
}
