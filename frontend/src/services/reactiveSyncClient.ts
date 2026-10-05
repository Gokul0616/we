import { API_CONFIG } from "../constants/api";

type QueryCallback = (data: any) => void;

export class ReactiveSyncClient {
  private ws: WebSocket | null = null;
  private url: string;
  private token: string | null = null;
  private pendingCalls: Map<string, { resolve: (val: any) => void; reject: (err: any) => void }> = new Map();
  private subscriptions: Map<string, { query: string; args: any; callback: QueryCallback }> = new Map();
  private reconnectTimeout: any = null;
  private callCounter = 0;

  constructor(url: string = API_CONFIG.WS_SYNC_URL) {
    this.url = url;
  }

  public setAuthToken(token: string | null) {
    this.token = token;
    if (this.ws && this.ws.readyState === WebSocket.OPEN && token) {
      this.send({ type: "authenticate", token });
    }
  }

  public connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const wsUrl = this.token ? `${this.url}?token=${encodeURIComponent(this.token)}` : this.url;
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log("⚡ [SyncEngine] Connected to Reactive Gateway");
      // Re-establish all active query subscriptions
      this.subscriptions.forEach((sub, subId) => {
        this.send({
          type: "subscribe",
          subId,
          query: sub.query,
          args: sub.args,
        });
      });
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        const { type, subId, callId, data, message } = msg;

        // Query initial result or reactive update
        if ((type === "query_result" || type === "query_update") && subId) {
          const sub = this.subscriptions.get(subId);
          if (sub) {
            sub.callback(data);
          }
        }

        // Mutation resolution
        if (type === "mutation_result" && callId) {
          const promise = this.pendingCalls.get(callId);
          if (promise) {
            promise.resolve(data);
            this.pendingCalls.delete(callId);
          }
        }

        // Error handling
        if (type === "error") {
          if (callId && this.pendingCalls.has(callId)) {
            this.pendingCalls.get(callId)!.reject(new Error(message || "Mutation failed"));
            this.pendingCalls.delete(callId);
          } else {
            console.log("SyncEngine error:", message);
          }
        }
      } catch (e) {
        console.log("Failed to parse sync message:", e);
      }
    };

    this.ws.onclose = () => {
      console.log("SyncEngine disconnected. Reconnecting in 3s...");
      this.reconnectTimeout = setTimeout(() => this.connect(), 3000);
    };

    this.ws.onerror = (err) => {
      console.log("SyncEngine WebSocket error:", err);
    };
  }

  private send(payload: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  /**
   * Subscribes to a reactive query. The callback receives data whenever the database changes.
   */
  public subscribe(query: string, args: Record<string, any>, callback: QueryCallback): () => void {
    const subId = `sub_${++this.callCounter}_${Date.now()}`;
    this.subscriptions.set(subId, { query, args, callback });

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.send({ type: "subscribe", subId, query, args });
    } else {
      this.connect();
    }

    // Return cleanup function to unsubscribe
    return () => {
      this.subscriptions.delete(subId);
      this.send({ type: "unsubscribe", subId });
    };
  }

  /**
   * Executes a mutation. Modifies the database and automatically triggers real-time updates for affected queries.
   */
  public async mutation<T = any>(mutationName: string, args: Record<string, any> = {}): Promise<T> {
    return new Promise((resolve, reject) => {
      const callId = `call_${++this.callCounter}_${Date.now()}`;
      this.pendingCalls.set(callId, { resolve, reject });

      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({ type: "mutation", callId, mutation: mutationName, args });
      } else {
        this.connect();
        // Wait briefly for connection or send once open
        setTimeout(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.send({ type: "mutation", callId, mutation: mutationName, args });
          } else {
            reject(new Error("Unable to connect to Reactive Sync Gateway"));
            this.pendingCalls.delete(callId);
          }
        }, 1000);
      }
    });
  }
}

export const syncClient = new ReactiveSyncClient();
