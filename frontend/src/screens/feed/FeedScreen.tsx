import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation } from "../../hooks/useSync";
import { Colors } from "../../constants/theme";

interface FeedScreenProps {
  onSignOut?: () => void;
}

export function FeedScreen({ onSignOut }: FeedScreenProps) {
  const [content, setContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  // Reactive live subscription
  const posts = useQuery<any[]>("posts:getFeed", { limit: 50 });

  // Mutations
  const createPost = useMutation("posts:create");
  const likePost = useMutation("posts:like");

  const handlePost = async () => {
    if (!content.trim() || isPosting) return;
    try {
      setIsPosting(true);
      await createPost({ content: content.trim() });
      setContent("");
    } catch (err) {
      console.error("Failed to create post:", err);
    } finally {
      setIsPosting(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      await likePost({ postId });
    } catch (err) {
      console.error("Failed to like post:", err);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Social Feed</Text>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>Real-Time Sync Active</Text>
            </View>
          </View>
          {onSignOut && (
            <TouchableOpacity onPress={onSignOut} style={styles.signOutBtn}>
              <Text style={styles.signOutText}>Switch Screen</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Composer */}
        <View style={styles.composerCard}>
          <TextInput
            style={styles.input}
            placeholder="What's happening?"
            placeholderTextColor="#64748b"
            value={content}
            onChangeText={setContent}
            multiline
            maxLength={280}
          />
          <View style={styles.composerFooter}>
            <Text style={styles.charCount}>{280 - content.length}</Text>
            <TouchableOpacity
              style={[
                styles.postButton,
                (!content.trim() || isPosting) && styles.postButtonDisabled,
              ]}
              onPress={handlePost}
              disabled={!content.trim() || isPosting}
            >
              {isPosting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.postButtonText}>Post</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Live Feed List */}
        {posts === undefined ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loadingText}>Connecting to Real-Time Engine...</Text>
          </View>
        ) : (
          <FlatList
            data={posts}
            keyExtractor={(item) => item.id || String(Math.random())}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No posts yet.</Text>
                <Text style={styles.emptySubText}>
                  Write the first post above to see real-time sync in action!
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <View style={styles.postCard}>
                <View style={styles.postHeader}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {(item.author_username || "U")[0].toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.authorMeta}>
                    <Text style={styles.authorName}>
                      @{item.author_username || "guest_user"}
                    </Text>
                    <Text style={styles.postTime}>
                      {item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                    </Text>
                  </View>
                </View>

                <Text style={styles.postContent}>{item.content}</Text>

                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, item.is_liked && styles.actionBtnActive]}
                    onPress={() => handleLike(item.id)}
                  >
                    <Text style={[styles.actionIcon, item.is_liked && styles.actionIconActive]}>
                      {item.is_liked ? "❤️" : "🤍"}
                    </Text>
                    <Text style={[styles.actionText, item.is_liked && styles.actionTextActive]}>
                      {item.likes_count || 0}
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.actionBtn}>
                    <Text style={styles.actionIcon}>💬</Text>
                    <Text style={styles.actionText}>{item.comments_count || 0}</Text>
                  </View>
                </View>
              </View>
            )}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#090d16",
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
    backgroundColor: "#0f172a",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#f8fafc",
    letterSpacing: -0.5,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10b981",
    marginRight: 6,
  },
  liveText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#10b981",
  },
  signOutBtn: {
    backgroundColor: "#1e293b",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  signOutText: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "600",
  },
  composerCard: {
    margin: 16,
    padding: 16,
    backgroundColor: "#131c31",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  input: {
    color: "#f8fafc",
    fontSize: 16,
    minHeight: 60,
    textAlignVertical: "top",
  },
  composerFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#1e293b",
    paddingTop: 10,
  },
  charCount: {
    color: "#64748b",
    fontSize: 12,
  },
  postButton: {
    backgroundColor: "#6366f1",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  postButtonDisabled: {
    opacity: 0.5,
  },
  postButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    color: "#94a3b8",
    fontSize: 14,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: "center",
  },
  emptyText: {
    color: "#cbd5e1",
    fontSize: 16,
    fontWeight: "600",
  },
  emptySubText: {
    color: "#64748b",
    fontSize: 13,
    marginTop: 4,
    textAlign: "center",
    maxWidth: 240,
  },
  postCard: {
    backgroundColor: "#111827",
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#4f46e5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  avatarText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 15,
  },
  authorMeta: {
    flex: 1,
  },
  authorName: {
    color: "#f3f4f6",
    fontWeight: "600",
    fontSize: 14,
  },
  postTime: {
    color: "#6b7280",
    fontSize: 11,
    marginTop: 2,
  },
  postContent: {
    color: "#e5e7eb",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 14,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    borderTopWidth: 1,
    borderTopColor: "#1f2937",
    paddingTop: 10,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionBtnActive: {
    opacity: 1,
  },
  actionIcon: {
    fontSize: 14,
  },
  actionIconActive: {
    transform: [{ scale: 1.1 }],
  },
  actionText: {
    color: "#9ca3af",
    fontSize: 13,
    fontWeight: "500",
  },
  actionTextActive: {
    color: "#ef4444",
    fontWeight: "700",
  },
});
