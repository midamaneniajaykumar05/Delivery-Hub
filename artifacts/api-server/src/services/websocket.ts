import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage } from "http";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "food-delivery-secret-key-2024";

interface AuthenticatedWS extends WebSocket {
  userId?: number;
  isAlive?: boolean;
}

let wss: WebSocketServer | null = null;
const clients = new Map<number, Set<AuthenticatedWS>>();

export function initWebSocket(server: import("http").Server) {
  wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws: AuthenticatedWS, req: IncomingMessage) => {
    ws.isAlive = true;

    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const token = url.searchParams.get("token");

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
        ws.userId = decoded.id;
        if (!clients.has(decoded.id)) clients.set(decoded.id, new Set());
        clients.get(decoded.id)!.add(ws);
      } catch {
        ws.close(1008, "Invalid token");
        return;
      }
    }

    ws.on("pong", () => { ws.isAlive = true; });

    ws.on("message", (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === "ping") ws.send(JSON.stringify({ type: "pong" }));
      } catch {}
    });

    ws.on("close", () => {
      if (ws.userId && clients.has(ws.userId)) {
        clients.get(ws.userId)!.delete(ws);
        if (clients.get(ws.userId)!.size === 0) clients.delete(ws.userId);
      }
    });

    ws.send(JSON.stringify({ type: "connected", message: "Connected to FoodFleet real-time" }));
  });

  // Heartbeat - ping every 30s, remove dead connections
  const interval = setInterval(() => {
    wss!.clients.forEach((ws: AuthenticatedWS) => {
      if (!ws.isAlive) { ws.terminate(); return; }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on("close", () => clearInterval(interval));
  return wss;
}

export function sendNotificationToUser(userId: number, notification: object) {
  const userClients = clients.get(userId);
  if (!userClients || userClients.size === 0) return;
  const payload = JSON.stringify({ type: "notification", data: notification });
  userClients.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) ws.send(payload);
  });
}

export function broadcastOrderUpdate(userId: number, orderId: number, status: string) {
  sendNotificationToUser(userId, { orderId, status, timestamp: new Date().toISOString() });
}
