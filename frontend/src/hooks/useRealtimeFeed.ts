import { useState, useEffect, useCallback } from "react";
import { realtimeClient } from "../services/realtimeClient";
import { API_CONFIG } from "../constants/api";
import { apiClient } from "../services/apiClient";

export interface Post {
  id: string;
  author_id: string;
  author_username: string;
  author_avatar?: string;
  content: string;
  media_url?: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
}

export function useRealtimeFeed(apiUrl: string = API_CONFIG.POSTS_URL) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Initial fetch
  const fetchFeed = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiClient.get(`${apiUrl}/posts`);
      setPosts(data?.posts || []);
    } catch (err) {
      console.log("Failed to fetch initial feed:", err);
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchFeed();

    // Subscribe to real-time feed updates via reactive sync
    const unsubscribe = realtimeClient.subscribe("feed", (eventPayload) => {
      const { event, data } = eventPayload;

      if (event === "POST_CREATED") {
        setPosts((prev) => [data, ...prev.filter((p) => p.id !== data.id)]);
      } else if (event === "POST_LIKED") {
        setPosts((prev) =>
          prev.map((post) =>
            post.id === data.post_id ? { ...post, likes_count: data.likes_count } : post
          )
        );
      } else if (event === "COMMENT_COUNT_UPDATED") {
        setPosts((prev) =>
          prev.map((post) =>
            post.id === data.post_id
              ? { ...post, comments_count: (post.comments_count || 0) + data.delta }
              : post
          )
        );
      }
    });

    return () => {
      unsubscribe();
    };
  }, [fetchFeed]);

  return { posts, loading, refetch: fetchFeed };
}
