import { apiClient } from "./apiClient";
import { syncClient } from "./reactiveSyncClient";
import { authStorage } from "./authStorage";
import { ENDPOINTS } from "../constants/api";
import { uploadFileToServer } from "../utils/fileUploader";

export interface CreatePostPayload {
  content: string;
  media_url?: string;
  media_urls?: string[];
  media_type?: "none" | "photo" | "video" | "carousel";
  location?: string;
  /** Coordinates for `location` — both or neither (validated by the backend). */
  location_lat?: number;
  location_lng?: number;
  tags?: string[];
  labels?: string[];
  privacy?: "public" | "friends" | "private";
  add_to_story?: boolean;
  /** Idempotency key — a retry of the same composed post returns the original. */
  client_post_id?: string;
}

export interface PostItemData {
  id: string;
  author_id?: string;
  author_username: string;
  author_fullName?: string;
  author_avatar?: any;
  content: string;
  media_url?: string;
  media_urls?: string[];
  media_type?: "none" | "photo" | "video" | "carousel";
  location?: string;
  location_lat?: number;
  location_lng?: number;
  tags?: string[];
  labels?: string[];
  privacy?: string;
  add_to_story?: boolean;
  likes_count: number;
  comments_count: number;
  is_liked?: boolean;
  created_at: string;
}

type PostListener = (post: PostItemData) => void;

class PostService {
  private listeners: PostListener[] = [];

  public subscribe(listener: PostListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(post: PostItemData) {
    this.listeners.forEach((listener) => {
      try {
        listener(post);
      } catch (e) {
        console.log("PostListener error:", e);
      }
    });
  }

  /**
   * Upload media file (photo or video) to backend server.
   * @param onProgress optional 0..1 callback for smooth per-file upload feedback.
   */
  public async uploadMedia(
    uri: string,
    type: "photo" | "video" = "photo",
    onProgress?: (progress: number) => void
  ): Promise<string> {
    return uploadFileToServer(uri, type, onProgress);
  }

  /**
   * Upload every selected media file **in parallel** and return the remote URLs in
   * the original selection order. Already-remote URLs are passed through without a
   * network call (and counted as instantly complete).
   *
   * @param onItemProgress called with (index, 0..1) whenever a file's progress changes.
   */
  public async uploadMediaBatch(
    items: { uri: string; type: "photo" | "video" }[],
    onItemProgress?: (index: number, progress: number) => void
  ): Promise<string[]> {
    return Promise.all(
      items.map(async (item, index) => {
        if (
          item.uri.startsWith("http://") ||
          item.uri.startsWith("https://") ||
          item.uri.startsWith("asset:")
        ) {
          onItemProgress?.(index, 1);
          return item.uri;
        }
        return this.uploadMedia(item.uri, item.type, (p) => onItemProgress?.(index, p));
      })
    );
  }

  /**
   * Create a post and persist it to DB + Convex-like reactive sync
   */
  public async createPost(payload: CreatePostPayload): Promise<PostItemData> {
    const user = await authStorage.getUser();

    const author_username = user?.username || "user";
    const author_id = user?.id || "user_current";

    // 1. Reactive Sync Engine mutation (Convex-like instantaneous sync across all connected clients)
    try {
      const syncResult = await syncClient.mutation<PostItemData>("posts:create", {
        content: payload.content,
        media_url: payload.media_url,
        media_urls: payload.media_urls || (payload.media_url ? [payload.media_url] : []),
        media_type: payload.media_type || "photo",
        location: payload.location,
        location_lat: payload.location_lat,
        location_lng: payload.location_lng,
        tags: payload.tags || [],
        labels: payload.labels || [],
        privacy: payload.privacy || "public",
        add_to_story: payload.add_to_story || false,
        client_post_id: payload.client_post_id,
      });

      if (syncResult && syncResult.id) {
        this.notify(syncResult);
        return syncResult;
      }
    } catch (err) {
      console.log("Sync mutation failed, falling back to HTTP:", err);
    }

    // 2. HTTP Fallback to Post Service using env endpoint
    try {
      const httpResult = await apiClient.post<PostItemData>(
        ENDPOINTS.posts.create,
        {
          content: payload.content,
          media_url: payload.media_url,
          media_urls: payload.media_urls || (payload.media_url ? [payload.media_url] : []),
          media_type: payload.media_type || "photo",
          location: payload.location,
          location_lat: payload.location_lat,
          location_lng: payload.location_lng,
          tags: payload.tags || [],
          labels: payload.labels || [],
          privacy: payload.privacy || "public",
          add_to_story: payload.add_to_story || false,
          client_post_id: payload.client_post_id,
        },
        { silent: true }
      );

      if (httpResult && httpResult.id) {
        this.notify(httpResult);
        return httpResult;
      }
    } catch (e) {
      console.log("HTTP create post failed, falling back to local object:", e);
    }

    // 3. Fallback post object
    const fallbackPost: PostItemData = {
      id: "post_" + Date.now(),
      author_id,
      author_username,
      author_avatar: user?.avatar_url || require("../../assets/images/default_avatar.png"),
      content: payload.content,
      media_url: payload.media_url,
      media_urls: payload.media_urls || (payload.media_url ? [payload.media_url] : []),
      media_type: payload.media_type || "photo",
      location: payload.location,
      location_lat: payload.location_lat,
      location_lng: payload.location_lng,
      tags: payload.tags || [],
      labels: payload.labels || [],
      privacy: payload.privacy || "public",
      add_to_story: payload.add_to_story || false,
      likes_count: 0,
      comments_count: 0,
      is_liked: false,
      created_at: new Date().toISOString(),
    };

    this.notify(fallbackPost);
    return fallbackPost;
  }

  /**
   * Fetch user posts by tab ("posts", "replies", "media", "likes")
   */
  public async getUserPosts(
    usernameOrId: string = "",
    tab: "posts" | "replies" | "media" | "likes" = "posts",
    options?: { limit?: number; skip?: number }
  ): Promise<PostItemData[]> {
    const limit = options?.limit ?? 12;
    const skip = options?.skip ?? 0;

    // 1. First try Sync Engine live query
    try {
      const syncPosts = await syncClient.query<PostItemData[]>("posts:getUserPosts", {
        username: usernameOrId,
        tab,
        limit,
        skip,
      });
      if (Array.isArray(syncPosts)) {
        return syncPosts;
      }
    } catch (e) {
      console.log("Sync engine getUserPosts fallback to HTTP:", e);
    }

    // 2. HTTP endpoint using env
    try {
      const res = await apiClient.get<{ posts: PostItemData[] }>(
        ENDPOINTS.posts.userPosts(usernameOrId, tab, limit, skip),
        { silent: true }
      );
      if (res && Array.isArray(res.posts)) {
        return res.posts;
      }
    } catch (e) {
      console.log("HTTP getUserPosts failed:", e);
    }

    return [];
  }

  /**
   * Fetch all feed posts from backend using reactive sync / env endpoint
   */
  public async getFeedPosts(options?: { limit?: number; skip?: number }): Promise<PostItemData[]> {
    const limit = options?.limit ?? 15;
    const skip = options?.skip ?? 0;

    // 1. First try Sync Engine query
    try {
      const syncPosts = await syncClient.query<PostItemData[]>("posts:getFeed", { limit, skip });
      if (Array.isArray(syncPosts)) {
        return syncPosts;
      }
    } catch (e) {
      console.log("Sync engine getFeed fallback to HTTP:", e);
    }

    // 2. HTTP endpoint using env
    try {
      const res = await apiClient.get<{ posts: PostItemData[] }>(
        ENDPOINTS.posts.list(limit, skip),
        { silent: true }
      );
      if (res && Array.isArray(res.posts)) {
        return res.posts;
      }
    } catch (e) {
      console.log("HTTP getFeed failed:", e);
    }

    return [];
  }

  /**
   * Fetch single post by ID (Sync Engine first, then HTTP fallback)
   */
  public async getPostById(id: string): Promise<PostItemData | null> {
    if (!id) return null;

    // 1. Try Sync Engine query
    try {
      const syncPost = await syncClient.query<PostItemData>("posts:getPost", { postId: id });
      if (syncPost && (syncPost.id || (syncPost as any)._id)) {
        return syncPost;
      }
    } catch (e) {
      console.log("Sync engine getPost fallback to HTTP:", e);
    }

    // 2. HTTP endpoint using env
    try {
      const res = await apiClient.get<PostItemData>(ENDPOINTS.posts.detail(id), { silent: true });
      if (res && res.id) {
        return res;
      }
    } catch (e) {
      console.log("HTTP getPostById failed:", e);
    }

    return null;
  }

  /**
   * Toggle like on post (Sync Engine first, then HTTP fallback)
   */
  public async toggleLike(postId: string): Promise<{ isLiked: boolean; likesCount: number }> {
    try {
      const res = await syncClient.mutation<{ isLiked: boolean; likesCount: number }>("posts:like", { postId });
      if (res && typeof res.isLiked === "boolean") {
        return res;
      }
    } catch (e) {
      console.log("Sync engine like fallback to HTTP:", e);
    }

    try {
      const httpRes = await apiClient.post<{ is_liked: boolean; likes_count: number }>(
        ENDPOINTS.posts.like(postId),
        {},
        { silent: true }
      );
      if (httpRes) {
        return { isLiked: httpRes.is_liked, likesCount: httpRes.likes_count };
      }
    } catch (e) {
      console.log("HTTP like failed:", e);
    }

    return { isLiked: false, likesCount: 0 };
  }

  /**
   * Add a comment to post
   */
  public async addComment(postId: string, content: string): Promise<any> {
    try {
      const res = await syncClient.mutation("posts:addComment", { postId, content });
      if (res) return res;
    } catch (e) {
      console.log("Sync engine addComment fallback to HTTP:", e);
    }

    try {
      return await apiClient.post(ENDPOINTS.posts.comments(postId), { content }, { silent: true });
    } catch (e) {
      console.log("HTTP addComment failed:", e);
    }
    return null;
  }

  /**
   * Get comments for a post
   */
  public async getComments(postId: string): Promise<any[]> {
    try {
      const res = await syncClient.query<any[]>("posts:getComments", { postId });
      if (Array.isArray(res)) return res;
    } catch (e) {
      console.log("Sync engine getComments fallback to HTTP:", e);
    }

    try {
      const httpRes = await apiClient.get<{ comments: any[] }>(ENDPOINTS.posts.comments(postId), { silent: true });
      if (httpRes && Array.isArray(httpRes.comments)) return httpRes.comments;
    } catch {
      // no-op — fall through to the HTTP path
    }
    return [];
  }
}

export const postService = new PostService();
