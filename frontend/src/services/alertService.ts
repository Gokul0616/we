import { Alert, AlertButton, Platform } from "react-native";

export interface CustomAlertButton {
  text: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
}

export interface CustomAlertOptions {
  cancelable?: boolean;
  onDismiss?: () => void;
}

export interface AlertPayload {
  id: string;
  title: string;
  message?: string;
  buttons?: CustomAlertButton[];
  options?: CustomAlertOptions;
}

type AlertListener = (payload: AlertPayload | null) => void;

class CustomAlertService {
  private listeners: Set<AlertListener> = new Set();

  public subscribe(listener: AlertListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public show(
    title: string,
    message?: string,
    buttons?: CustomAlertButton[],
    options?: CustomAlertOptions
  ) {
    const payload: AlertPayload = {
      id: `${Date.now()}_${Math.random()}`,
      title,
      message,
      buttons: buttons && buttons.length > 0 ? buttons : [{ text: "OK", style: "default" }],
      options,
    };
    this.listeners.forEach((listener) => listener(payload));
  }

  public hide() {
    this.listeners.forEach((listener) => listener(null));
  }
}

export const customAlertManager = new CustomAlertService();

/**
 * Universal showAlert function:
 * - On iOS: uses Apple's native UIAlertController (native blur, system buttons)
 * - On Android: presents a custom modern Android Material dialog component
 */
export function showAlert(
  title: string,
  message?: string,
  buttons?: CustomAlertButton[],
  options?: CustomAlertOptions
) {
  if (Platform.OS === "ios") {
    // Native iOS Alert (standard iOS modal controller)
    Alert.alert(
      title,
      message,
      buttons as AlertButton[] | undefined,
      options
    );
  } else {
    // Android Custom Dialog
    customAlertManager.show(title, message, buttons, options);
  }
}
