import { API_CONFIG } from "../constants/api";

type MessageHandler = (data: any) => void;

class RealtimeClient {
  private ws: WebSocket | null = null;
  private url: string;
  private subscriptions: Set<string> = new Set();
  private listeners: Map<string, Set<MessageHandler>> = new Map();
  private reconnectTimeout: any = null;

  constructor(url: string = API_CONFIG.WS_GATEWAY_URL) {
    this.url = url;
  }

  public connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log("⚡ Connected to Realtime Gateway");
      // Re-subscribe to any active topics
      this.subscriptions.forEach((topic) => {
        this.send({ action: "subscribe", topic });
      });
    };

    this.ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        const topic = payload.topic;
        if (topic && this.listeners.has(topic)) {
          this.listeners.get(topic)!.forEach((handler) => handler(payload));
        }
      } catch (err) {
        console.log("Failed to parse websocket message:", err);
      }
    };

    this.ws.onclose = () => {
      console.log("WebSocket disconnected. Reconnecting in 3s...");
      this.reconnectTimeout = setTimeout(() => this.connect(), 3000);
    };

    this.ws.onerror = (err) => {
      console.log("WebSocket error:", err);
    };
  }

  public subscribe(topic: string, handler: MessageHandler) {
    if (!this.listeners.has(topic)) {
      this.listeners.set(topic, new Set());
    }
    this.listeners.get(topic)!.add(handler);
    this.subscriptions.add(topic);

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.send({ action: "subscribe", topic });
    } else {
      this.connect();
    }

    // Return unsubscribe function
    return () => {
      const handlers = this.listeners.get(topic);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.listeners.delete(topic);
          this.subscriptions.delete(topic);
          this.send({ action: "unsubscribe", topic });
        }
      }
    };
  }

  private send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  public disconnect() {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    if (this.ws) this.ws.close();
  }
}

export const realtimeClient = new RealtimeClient();
