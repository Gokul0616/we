import React, { useState, useRef } from "react";
import { View, Image, StyleSheet, Platform, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useVideoPlayer, VideoView } from "expo-video";

export interface PostMediaProps {
  source: any;
  mediaType?: string;
  style?: any;
  resizeMode?: "cover" | "contain";
  isDetailScreen?: boolean;
  autoPlay?: boolean;
  isGrid?: boolean;
}

export function isVideoSource(source: any, mediaType?: string): boolean {
  if (mediaType === "video" || mediaType === "reel") return true;
  if (!source) return false;
  const uri = typeof source === "string" ? source : source?.uri;
  if (typeof uri === "string") {
    const clean = uri.toLowerCase();
    return clean.endsWith(".mp4") || clean.endsWith(".mov") || clean.includes(".mp4?") || clean.includes(".mov?") || clean.includes("/video");
  }
  return false;
}

function NativeVideoPlayer({
  uri,
  style,
  resizeMode,
  isDetailScreen,
  autoPlay = true,
  isGrid = false,
}: {
  uri: string;
  style: any;
  resizeMode?: string;
  isDetailScreen?: boolean;
  autoPlay?: boolean;
  isGrid?: boolean;
}) {
  const [isPlaying, setIsPlaying] = useState(autoPlay && !isGrid);
  const [isMuted, setIsMuted] = useState(!isDetailScreen);

  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = !isDetailScreen;
    if (autoPlay && !isGrid) {
      p.play();
    } else {
      p.pause();
    }
  });

  const togglePlay = () => {
    if (player.playing) {
      player.pause();
      setIsPlaying(false);
    } else {
      player.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    player.muted = !player.muted;
    setIsMuted(player.muted);
  };

  return (
    <View style={[style, styles.videoWrapper]}>
      <VideoView
        style={StyleSheet.absoluteFill}
        player={player}
        contentFit={resizeMode === "contain" ? "contain" : "cover"}
        nativeControls={isDetailScreen}
      />
      {!isGrid && !isPlaying && (
        <TouchableOpacity style={styles.playOverlay} onPress={togglePlay} activeOpacity={0.8}>
          <View style={styles.playBadge}>
            <Ionicons name="play" size={24} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      )}
      {!isGrid && !isDetailScreen && (
        <View style={styles.videoOverlayControls}>
          <TouchableOpacity style={styles.muteBadge} onPress={toggleMute} activeOpacity={0.8}>
            <Ionicons name={isMuted ? "volume-mute" : "volume-high"} size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}
      {isGrid && (
        <View style={styles.gridVideoIndicator}>
          <Ionicons name="videocam" size={13} color="#FFFFFF" />
        </View>
      )}
    </View>
  );
}

export const PostMedia: React.FC<PostMediaProps> = ({
  source,
  mediaType,
  style,
  resizeMode = "cover",
  isDetailScreen = false,
  autoPlay = true,
  isGrid = false,
}) => {
  const isVideo = isVideoSource(source, mediaType);
  const uri = typeof source === "string" ? source : source?.uri;

  if (isVideo && uri) {
    if (Platform.OS === "web") {
      return (
        <View style={[style, styles.videoWrapper]}>
          <video
            src={uri}
            controls={isDetailScreen && !isGrid}
            autoPlay={autoPlay && !isGrid}
            loop
            muted={!isDetailScreen}
            playsInline
            style={{
              width: "100%",
              height: "100%",
              objectFit: resizeMode === "contain" ? "contain" : "cover",
              borderRadius: style?.borderRadius || 0,
            }}
          />
          {isGrid && (
            <View style={styles.gridVideoIndicator}>
              <Ionicons name="videocam" size={13} color="#FFFFFF" />
            </View>
          )}
        </View>
      );
    }

    return (
      <NativeVideoPlayer
        uri={uri}
        style={style}
        resizeMode={resizeMode}
        isDetailScreen={isDetailScreen}
        autoPlay={autoPlay}
        isGrid={isGrid}
      />
    );
  }

  return (
    <Image
      source={source}
      style={style}
      resizeMode={resizeMode}
    />
  );
};

const styles = StyleSheet.create({
  videoWrapper: {
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#000000",
  },
  playOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  playBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
    paddingLeft: 3,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.8)",
  },
  videoOverlayControls: {
    position: "absolute",
    bottom: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  muteBadge: {
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    padding: 6,
    borderRadius: 16,
  },
  gridVideoIndicator: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderRadius: 4,
  },
});
