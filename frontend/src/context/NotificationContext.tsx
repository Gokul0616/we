import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { syncClient } from "../services/reactiveSyncClient";
import { authStorage } from "../services/authStorage";

export interface NotificationItem {
  id: string;
  type: "LIKE" | "COMMENT" | "REPLY" | "FOLLOW" | "FOLLOW_REQUEST" | "FOLLOW_ACCEPTED" | "MENTION" | "REPOST" | "SYSTEM";
  recipient_id: string;
  actor_id: string;
  actor_username: string;
  actor_fullName?: string;
  actor_avatar?: string;
  post_id?: string;
  comment_id?: string;
  message?: string;
  read: boolean;
  created_at: string;
}

export interface FollowRequestItem {
  id: string;
  follower_id: string;
  follower_username: string;
  target_id: string;
  target_username: string;
  created_at: string;
  actor_fullName?: string;
  actor_avatar?: string;
}

interface NotificationContextValue {
  notifications: NotificationItem[];
  unreadCount: number;
  followRequests: FollowRequestItem[];
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  acceptFollowRequest: (followerId: string) => Promise<void>;
  rejectFollowRequest: (followerId: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  refreshNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextValue>({
  notifications: [],
  unreadCount: 0,
  followRequests: [],
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  acceptFollowRequest: async () => {},
  rejectFollowRequest: async () => {},
  clearAllNotifications: async () => {},
  refreshNotifications: () => {},
});

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [followRequests, setFollowRequests] = useState<FollowRequestItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isCancelled = false;
    let unsubNotifs: () => void;
    let unsubUnread: () => void;
    let unsubReqs: () => void;

    const init = async () => {
      const user = await authStorage.getUser();
      if (!user) return;

      // Subscribe to Notifications
      unsubNotifs = syncClient.subscribe("notifications:list", {}, (data) => {
        if (!isCancelled && Array.isArray(data)) {
          setNotifications(data);
          // Calculate unread safely if unreadCount sub fails
          const count = data.filter(n => !n.read).length;
          setUnreadCount(count);
        }
      });

      // Subscribe to Unread Count specifically (optimized)
      unsubUnread = syncClient.subscribe("notifications:unreadCount", {}, (data) => {
        if (!isCancelled && data && typeof data.count === 'number') {
          setUnreadCount(data.count);
        }
      });

      // Subscribe to Follow Requests
      unsubReqs = syncClient.subscribe("followRequests:list", {}, (data) => {
        if (!isCancelled && Array.isArray(data)) {
          setFollowRequests(data);
        }
      });
    };

    init();

    return () => {
      isCancelled = true;
      if (unsubNotifs) unsubNotifs();
      if (unsubUnread) unsubUnread();
      if (unsubReqs) unsubReqs();
    };
  }, [refreshKey]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await syncClient.mutation("notifications:markRead", { notificationId });
      // Optimistic update
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.warn("Failed to mark as read", e);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await syncClient.mutation("notifications:markAllRead", {});
      // Optimistic update
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.warn("Failed to mark all as read", e);
    }
  }, []);

  const acceptFollowRequest = useCallback(async (followerId: string) => {
    try {
      await syncClient.mutation("users:acceptFollowRequest", { followerId });
      // Follow requests and notifications update reactively
    } catch (e) {
      console.warn("Failed to accept follow request", e);
    }
  }, []);

  const rejectFollowRequest = useCallback(async (followerId: string) => {
    try {
      await syncClient.mutation("users:rejectFollowRequest", { followerId });
      // Follow requests update reactively
    } catch (e) {
      console.warn("Failed to reject follow request", e);
    }
  }, []);

  const clearAllNotifications = useCallback(async () => {
    try {
      await syncClient.mutation("notifications:clearAll", {});
      setNotifications([]);
      setUnreadCount(0);
    } catch (e) {
      console.warn("Failed to clear notifications", e);
    }
  }, []);

  const refreshNotifications = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        followRequests,
        markAsRead,
        markAllAsRead,
        acceptFollowRequest,
        rejectFollowRequest,
        clearAllNotifications,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
