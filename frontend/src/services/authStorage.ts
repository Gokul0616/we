import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiClient } from "./apiClient";
import { syncClient } from "./reactiveSyncClient";

const TOKEN_KEY = "@we_auth_token";
const USER_KEY = "@we_auth_user";

export interface StoredUser {
  id: string;
  username: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  cover_url?: string;
  bio?: string;
  location?: string;
  website?: string;
  social_links?: Record<string, string>;
  privacy_settings?: {
    visibility?: "public" | "friends" | "private";
    show_activity_status?: boolean;
    allow_direct_messages?: boolean;
    who_can_tag?: "everyone" | "friends" | "no_one";
  };
}

export const authStorage = {
  /**
   * Persist access token and initialize in-memory clients
   */
  async saveToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token);
      apiClient.setAuthToken(token);
      syncClient.setAuthToken(token);
    } catch (e) {
      console.warn("⚠️ [authStorage] Failed to save auth token", e);
    }
  },

  /**
   * Retrieve stored access token
   */
  async getToken(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (token) {
        apiClient.setAuthToken(token);
        syncClient.setAuthToken(token);
      }
      return token;
    } catch (e) {
      console.warn("⚠️ [authStorage] Failed to get auth token", e);
      return null;
    }
  },

  /**
   * Persist user details
   */
  async saveUser(user: StoredUser): Promise<void> {
    try {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (e) {
      console.warn("⚠️ [authStorage] Failed to save user details", e);
    }
  },

  /**
   * Retrieve cached user details
   */
  async getUser(): Promise<StoredUser | null> {
    try {
      const data = await AsyncStorage.getItem(USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.warn("⚠️ [authStorage] Failed to parse user details", e);
      return null;
    }
  },

  /**
   * Clear session on logout or token expiration
   */
  async clear(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
      apiClient.setAuthToken(null);
      syncClient.setAuthToken(null);
    } catch (e) {
      console.warn("⚠️ [authStorage] Failed to clear auth storage", e);
    }
  },
};
