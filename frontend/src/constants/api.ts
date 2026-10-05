/**
 * Centralized API configuration and endpoints.
 * Uses environment variables from .env with fallback to machine local IP.
 */

const DEFAULT_IP = "192.168.1.83";

export const API_HOST = process.env.EXPO_PUBLIC_API_HOST || DEFAULT_IP;

export const API_CONFIG = {
  HOST: API_HOST,
  GATEWAY_URL: process.env.EXPO_PUBLIC_GATEWAY_URL || `http://${API_HOST}:8000`,
  AUTH_URL: process.env.EXPO_PUBLIC_AUTH_URL || `http://${API_HOST}:8001`,
  POSTS_URL: process.env.EXPO_PUBLIC_POSTS_URL || `http://${API_HOST}:8002`,
  NOTIFICATIONS_URL: process.env.EXPO_PUBLIC_NOTIFICATIONS_URL || `http://${API_HOST}:8003`,
  WS_GATEWAY_URL: process.env.EXPO_PUBLIC_WS_GATEWAY_URL || `ws://${API_HOST}:8000/ws`,
  WS_SYNC_URL: process.env.EXPO_PUBLIC_WS_SYNC_URL || `ws://${API_HOST}:8000/sync`,
};

export const ENDPOINTS = {
  auth: {
    login: `${API_CONFIG.AUTH_URL}/login`,
    register: `${API_CONFIG.AUTH_URL}/register`,
    sendOtp: `${API_CONFIG.AUTH_URL}/send-otp`,
    verifyOtp: `${API_CONFIG.AUTH_URL}/verify-otp`,
    me: `${API_CONFIG.AUTH_URL}/me`,
    health: `${API_CONFIG.AUTH_URL}/health`,
  },
  posts: {
    list: `${API_CONFIG.POSTS_URL}/posts`,
    create: `${API_CONFIG.POSTS_URL}/posts`,
    like: (id: string) => `${API_CONFIG.POSTS_URL}/posts/${id}/like`,
    comments: (id: string) => `${API_CONFIG.POSTS_URL}/posts/${id}/comments`,
  },
  gateway: {
    health: `${API_CONFIG.GATEWAY_URL}/health`,
    ws: API_CONFIG.WS_GATEWAY_URL,
    syncWs: API_CONFIG.WS_SYNC_URL,
  },
};
