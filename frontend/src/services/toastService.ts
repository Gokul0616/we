type ToastType = "error" | "success" | "info";

export interface ToastPayload {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

type ToastListener = (toast: ToastPayload | null) => void;

class ToastService {
  private listeners: Set<ToastListener> = new Set();
  private currentTimeout: any = null;

  public subscribe(listener: ToastListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public show(message: string, type: ToastType = "error", duration: number = 3500) {
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
      this.currentTimeout = null;
    }

    const payload: ToastPayload = {
      id: `${Date.now()}_${Math.random()}`,
      type,
      message,
      duration,
    };

    this.listeners.forEach((listener) => listener(payload));

    this.currentTimeout = setTimeout(() => {
      this.hide();
    }, duration);
  }

  public error(message: string, duration?: number) {
    this.show(message, "error", duration);
  }

  public success(message: string, duration?: number) {
    this.show(message, "success", duration);
  }

  public info(message: string, duration?: number) {
    this.show(message, "info", duration);
  }

  public hide() {
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
      this.currentTimeout = null;
    }
    this.listeners.forEach((listener) => listener(null));
  }
}

export const toast = new ToastService();
