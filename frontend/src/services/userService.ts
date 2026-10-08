import { apiClient } from "./apiClient";
import { syncClient } from "./reactiveSyncClient";
import { authStorage, StoredUser } from "./authStorage";
import { ENDPOINTS } from "../constants/api";

export interface UserUpdatePayload {
  full_name?: string;
  username?: string;
  email?: string;
  phone?: string;
  gender?: string;
  date_of_birth?: string;
  bio?: string;
  avatar_url?: string;
  cover_url?: string;
  location?: string;
  website?: string;
  social_links?: Record<string, string>;
  privacy_settings?: {
    visibility?: "public" | "friends" | "private";
    show_activity_status?: boolean;
    allow_direct_messages?: boolean;
    who_can_tag?: "everyone" | "friends" | "no_one";
  };
  notification_settings?: Record<string, boolean>;
  content_preferences?: StoredUser["content_preferences"];
  two_factor?: StoredUser["two_factor"];
  blocked_users?: string[];
}

type UserListener = (user: StoredUser) => void;

class UserService {
  private listeners: UserListener[] = [];

  public subscribe(listener: UserListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(user: StoredUser) {
    this.listeners.forEach((l) => {
      try {
        l(user);
      } catch (e) {
        console.warn("UserListener error:", e);
      }
    });
  }

  /**
   * Fetch current user profile from server or cache
   */
  public async getProfile(): Promise<StoredUser | null> {
    // 1. Try local cache
    const cached = await authStorage.getUser();

    // 2. Try Sync Engine live query
    try {
      const syncUser = await syncClient.query<StoredUser>("users:getProfile");
      if (syncUser && syncUser.id) {
        await authStorage.saveUser(syncUser);
        this.notify(syncUser);
        return syncUser;
      }
    } catch (e) {
      console.warn("Sync engine getProfile fallback to HTTP:", e);
    }

    // 3. Try HTTP /me endpoint
    try {
      const res = await apiClient.get<StoredUser>(ENDPOINTS.auth.me, { silent: true });
      if (res && res.id) {
        await authStorage.saveUser(res);
        this.notify(res);
        return res;
      }
    } catch (e) {
      console.warn("HTTP getProfile fallback to cache:", e);
    }

    return cached;
  }

  /**
   * Upload an image (avatar or cover)
   */
  public async uploadImage(uri: string, type: "avatar" | "cover" = "avatar"): Promise<string> {
    if (!uri) return uri;
    if (uri.startsWith("http://") || uri.startsWith("https://")) {
      return uri;
    }

    try {
      const filename = uri.split("/").pop() || `${type}.jpg`;
      const ext = filename.split(".").pop()?.toLowerCase() || "jpg";
      const mimeType = ext === "png" ? "image/png" : "image/jpeg";

      const formData = new FormData();
      formData.append("file", {
        uri,
        name: filename,
        type: mimeType,
      } as any);

      const token = await authStorage.getToken();
      const headers: Record<string, string> = {
        Accept: "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(ENDPOINTS.posts.upload, {
        method: "POST",
        body: formData,
        headers,
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.url) {
          return data.url;
        }
      }
    } catch (e) {
      console.warn("Upload image via FormData error, trying JSON fallback:", e);
    }

    try {
      const res = await apiClient.post<{ url: string; status: string }>(
        ENDPOINTS.posts.upload,
        {
          data: uri,
          media_type: "image/jpeg",
        },
        { silent: true }
      );
      if (res && res.url) {
        return res.url;
      }
    } catch (e) {
      console.warn("Upload image fallback:", e);
    }
    return uri;
  }

  /**
   * Update profile across DB and Reactive Sync Engine
   */
  public async updateProfile(payload: UserUpdatePayload): Promise<StoredUser | null> {
    const currentUser = await authStorage.getUser();
    const userId = currentUser?.id;

    const sanitizedPayload: UserUpdatePayload = { ...payload };
    if (payload.avatar_url !== undefined) {
      sanitizedPayload.avatar_url = payload.avatar_url || "asset:default_avatar.png";
    }

    // 1. Reactive Sync Engine mutation
    try {
      const syncResult = await syncClient.mutation<StoredUser>("users:updateProfile", {
        userId,
        ...sanitizedPayload,
      });
      if (syncResult && syncResult.id) {
        const merged: StoredUser = {
          ...currentUser,
          ...syncResult,
        };
        await authStorage.saveUser(merged);
        this.notify(merged);
      }
    } catch (e) {
      console.warn("Sync engine updateProfile fallback to HTTP:", e);
    }

    // 2. HTTP PUT /me endpoint
    try {
      const res = await apiClient.put<{ status: string; user: StoredUser; access_token?: string }>(
        ENDPOINTS.auth.updateProfile,
        sanitizedPayload,
        { silent: true }
      );
      if (res && res.user) {
        if (res.access_token) {
          await authStorage.saveToken(res.access_token);
        }
        await authStorage.saveUser(res.user);
        this.notify(res.user);
        return res.user;
      }
    } catch (e) {
      console.warn("HTTP updateProfile error:", e);
    }

    // 3. Fallback optimistic local update
    if (currentUser) {
      const updated: StoredUser = {
        ...currentUser,
        ...payload,
      };
      await authStorage.saveUser(updated);
      this.notify(updated);
      return updated;
    }

    return null;
  }

  public async updatePrivacy(privacy: NonNullable<UserUpdatePayload["privacy_settings"]>): Promise<StoredUser | null> {
    const currentUser = await authStorage.getUser();
    const existing = currentUser?.privacy_settings || {};
    return this.updateProfile({
      privacy_settings: {
        ...existing,
        ...privacy,
      },
    });
  }

  public async changePassword(currentPassword: string, newPassword: string): Promise<boolean> {
    const res = await apiClient.post<{ status: string; message: string }>(
      ENDPOINTS.auth.changePassword,
      { current_password: currentPassword, new_password: newPassword }
    );
    return res && res.status === "ok";
  }

  public async deleteAccount(): Promise<boolean> {
    try {
      await apiClient.delete(ENDPOINTS.auth.deleteAccount);
    } catch (_) {}
    await authStorage.clear();
    return true;
  }

  public async updateNotificationSettings(settings: Record<string, boolean>): Promise<StoredUser | null> {
    const currentUser = await authStorage.getUser();
    const existing = currentUser?.notification_settings || {};
    return this.updateProfile({
      notification_settings: {
        ...existing,
        ...settings,
      },
    });
  }

  public async updateContentPreferences(prefs: Partial<NonNullable<StoredUser["content_preferences"]>>): Promise<StoredUser | null> {
    const currentUser = await authStorage.getUser();
    const existing = currentUser?.content_preferences || {};
    return this.updateProfile({
      content_preferences: {
        ...existing,
        ...prefs,
      },
    });
  }

  public async updateTwoFactor(twoFactor: Partial<NonNullable<StoredUser["two_factor"]>>): Promise<StoredUser | null> {
    const currentUser = await authStorage.getUser();
    const existing = currentUser?.two_factor || {};
    return this.updateProfile({
      two_factor: {
        ...existing,
        ...twoFactor,
      },
    });
  }

  public async blockUser(targetUsername: string): Promise<boolean> {
    const clean = targetUsername.replace(/^@/, "").trim().toLowerCase();
    const res = await apiClient.post<{ status: string }>(ENDPOINTS.auth.blockUser, { target_username: clean });
    const user = await authStorage.getUser();
    if (user) {
      const blocked = user.blocked_users || [];
      if (!blocked.includes(clean)) {
        await authStorage.saveUser({ ...user, blocked_users: [...blocked, clean] });
      }
    }
    return res && res.status === "ok";
  }

  public async unblockUser(targetUsername: string): Promise<boolean> {
    const clean = targetUsername.replace(/^@/, "").trim().toLowerCase();
    const res = await apiClient.post<{ status: string }>(ENDPOINTS.auth.unblockUser, { target_username: clean });
    const user = await authStorage.getUser();
    if (user && user.blocked_users) {
      await authStorage.saveUser({
        ...user,
        blocked_users: user.blocked_users.filter((u) => u !== clean),
      });
    }
    return res && res.status === "ok";
  }

  /**
   * Toggle follow/unfollow for a target user with reactive sync & HTTP fallback
   */
  public async toggleFollow(targetUsername: string): Promise<{ isFollowing: boolean; followersCount: number; followingCount: number; postsCount: number }> {
    const cleanTarget = targetUsername.replace(/^@/, "").trim().toLowerCase();
    const currentUser = await authStorage.getUser();

    // 1. Try Reactive Sync mutation
    try {
      const syncRes = await syncClient.mutation<{ isFollowing: boolean; followersCount: number; followingCount: number; postsCount: number }>(
        "users:toggleFollow",
        {
          targetUsername: cleanTarget,
          followerId: currentUser?.id,
          followerUsername: currentUser?.username,
        }
      );
      if (syncRes && typeof syncRes.isFollowing === "boolean") {
        return {
          isFollowing: syncRes.isFollowing,
          followersCount: syncRes.followersCount ?? 0,
          followingCount: syncRes.followingCount ?? 0,
          postsCount: syncRes.postsCount ?? 0,
        };
      }
    } catch (e) {
      console.warn("Sync engine toggleFollow fallback to HTTP:", e);
    }

    // 2. Try HTTP endpoint
    try {
      const res = await apiClient.post<{ status: string; is_following: boolean; followers_count: number; following_count: number; posts_count: number }>(
        `/users/${cleanTarget}/toggle-follow`,
        {},
        { silent: true }
      );
      if (res && typeof res.is_following === "boolean") {
        return {
          isFollowing: res.is_following,
          followersCount: res.followers_count ?? 0,
          followingCount: res.following_count ?? 0,
          postsCount: res.posts_count ?? 0,
        };
      }
    } catch (e) {
      console.warn("HTTP toggleFollow error:", e);
    }

    return { isFollowing: true, followersCount: 1, followingCount: 0, postsCount: 0 };
  }

  /**
   * Get follow status for a user
   */
  public async getFollowStatus(targetUsername: string): Promise<{ isFollowing: boolean; followersCount: number; followingCount: number; postsCount: number }> {
    const cleanTarget = targetUsername.replace(/^@/, "").trim().toLowerCase();
    const currentUser = await authStorage.getUser();

    // 1. Try Reactive Sync query
    try {
      const syncRes = await syncClient.query<{ isFollowing: boolean; followersCount: number; followingCount: number; postsCount: number }>(
        "users:getFollowStatus",
        {
          targetUsername: cleanTarget,
          followerId: currentUser?.id,
        }
      );
      if (syncRes && typeof syncRes.isFollowing === "boolean") {
        return {
          isFollowing: syncRes.isFollowing,
          followersCount: syncRes.followersCount ?? 0,
          followingCount: syncRes.followingCount ?? 0,
          postsCount: syncRes.postsCount ?? 0,
        };
      }
    } catch (_) {}

    // 2. Try HTTP endpoint
    try {
      const res = await apiClient.get<{ is_following: boolean; followers_count: number; following_count: number; posts_count: number }>(
        `/users/${cleanTarget}/follow-status`,
        { silent: true }
      );
      if (res && typeof res.is_following === "boolean") {
        return {
          isFollowing: res.is_following,
          followersCount: res.followers_count ?? 0,
          followingCount: res.following_count ?? 0,
          postsCount: res.posts_count ?? 0,
        };
      }
    } catch (_) {}

    return { isFollowing: false, followersCount: 0, followingCount: 0, postsCount: 0 };
  }

  /**
   * Check if a username is available
   */
  public async checkUsername(username: string): Promise<any> {
    const clean = username.replace(/^@/, "").trim().toLowerCase();
    
    // 1. Try Reactive Sync query
    try {
      const syncRes = await syncClient.query("users:checkUsername", { username: clean });
      if (syncRes) return syncRes;
    } catch (e) {
      console.warn("Sync engine checkUsername fallback to HTTP:", e);
    }
    
    // 2. Try HTTP endpoint
    try {
      return await apiClient.get(`/auth/check-username/${clean}`, { silent: true });
    } catch (e) {
      throw e;
    }
  }

  /**
   * Get notifications for the current user
   */
  public async getNotifications(): Promise<any[]> {
    // 1. Try Reactive Sync query
    try {
      const syncRes = await syncClient.query("notifications:list", {});
      if (Array.isArray(syncRes)) return syncRes;
    } catch (e) {
      console.warn("Sync engine getNotifications fallback to HTTP:", e);
    }
    
    // 2. Try HTTP endpoint (fallback if it exists, otherwise empty array)
    try {
      const res = await apiClient.get<{ notifications: any[] }>("/notifications", { silent: true });
      if (res && Array.isArray(res.notifications)) return res.notifications;
    } catch (e) {
      // Endpoint might not exist in Python backend yet
    }
    return [];
  }
}

export const userService = new UserService();
