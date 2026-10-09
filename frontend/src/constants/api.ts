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
    checkUsername: (username: string) => `${API_CONFIG.AUTH_URL}/check-username?username=${encodeURIComponent(username)}`,
    me: `${API_CONFIG.AUTH_URL}/me`,
    updateProfile: `${API_CONFIG.AUTH_URL}/me`,
    changePassword: `${API_CONFIG.AUTH_URL}/change-password`,
    deleteAccount: `${API_CONFIG.AUTH_URL}/me`,
    blockUser: `${API_CONFIG.AUTH_URL}/users/block`,
    unblockUser: `${API_CONFIG.AUTH_URL}/users/unblock`,
    upload: `${API_CONFIG.AUTH_URL}/upload`,
    health: `${API_CONFIG.AUTH_URL}/health`,
  },
  posts: {
    list: (limit = 15, skip = 0) => `${API_CONFIG.POSTS_URL}/posts?limit=${limit}&skip=${skip}`,
    create: `${API_CONFIG.POSTS_URL}/posts`,
    upload: `${API_CONFIG.POSTS_URL}/upload`,
    detail: (id: string) => `${API_CONFIG.POSTS_URL}/posts/${id}`,
    userPosts: (username: string, tab: string = "posts", limit = 12, skip = 0) => `${API_CONFIG.POSTS_URL}/posts/user/${encodeURIComponent(username)}?tab=${tab}&limit=${limit}&skip=${skip}`,
    like: (id: string) => `${API_CONFIG.POSTS_URL}/posts/${id}/like`,
    comments: (id: string) => `${API_CONFIG.POSTS_URL}/posts/${id}/comments`,
  },
  gateway: {
    upload: `${API_CONFIG.GATEWAY_URL}/upload`,
    health: `${API_CONFIG.GATEWAY_URL}/health`,
    query: `${API_CONFIG.GATEWAY_URL}/api/query`,
    mutation: `${API_CONFIG.GATEWAY_URL}/api/mutation`,
    ws: API_CONFIG.WS_GATEWAY_URL,
    syncWs: API_CONFIG.WS_SYNC_URL,
  },
};
