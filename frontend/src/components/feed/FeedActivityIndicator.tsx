import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, TouchableOpacity, Easing, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications } from '../../context/NotificationContext';
import { useTheme } from '../../context/ThemeContext';
import { useRouter } from 'expo-router';
import { FontFamily } from '../../constants/theme';
import { AppText } from '../common/AppText';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface FeedActivityIndicatorProps {
  postId?: string;
  isGlobal?: boolean;
  bellIconCenterX?: number; // absolute X position of the bell icon center
}

const INDICATOR_BG = '#3478F6'; // iOS-style blue

export function FeedActivityIndicator({ postId, isGlobal, bellIconCenterX }: FeedActivityIndicatorProps) {
  const { notifications } = useNotifications();
  const { colors, isDark } = useTheme();
  const router = useRouter();

  // Animation refs
  const slideAnim = useRef(new Animated.Value(-30)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [bubbleWidth, setBubbleWidth] = useState(0);

  // Extract unread notifications
  const relevantNotifs = React.useMemo(() => {
    return notifications.filter(n => {
      if (n.read) return false;
      if (postId) return n.post_id === postId;
      if (isGlobal) return true;
      return false;
    });
  }, [notifications, postId, isGlobal]);

  const counts = React.useMemo(() => {
    return relevantNotifs.reduce((acc, n) => {
      if (n.type === 'LIKE' || n.type === 'REPOST') acc.likes++;
      else if (n.type === 'COMMENT' || n.type === 'REPLY') acc.comments++;
      else if (n.type === 'FOLLOW' || n.type === 'FOLLOW_REQUEST' || n.type === 'FOLLOW_ACCEPTED') acc.follows++;
      return acc;
    }, { likes: 0, comments: 0, follows: 0 });
  }, [relevantNotifs]);

  const totalCount = counts.likes + counts.comments + counts.follows;
  const [isVisible, setIsVisible] = useState(false);

  const showIndicator = () => {
    setIsVisible(true);
    setDismissed(false);
    slideAnim.setValue(-20);
    opacityAnim.setValue(0);
    scaleAnim.setValue(0.9);

    Animated.stagger(50, [
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 7,
          tension: 70,
          useNativeDriver: true,
        }),
      ]),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideIndicator = (cb?: () => void) => {
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -16,
        duration: 250,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsVisible(false);
      setDismissed(true);
      cb?.();
    });
  };

  useEffect(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }

    if (totalCount > 0 && !dismissed) {
      showIndicator();
      if (isGlobal) {
        hideTimerRef.current = setTimeout(() => hideIndicator(), 5000);
      }
    } else if (totalCount === 0) {
      setDismissed(false);
      if (isVisible) hideIndicator();
    }

    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [totalCount]);

  if (!isVisible) return null;

  const handlePress = () => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideIndicator(() => {
      if (postId) {
        router.push({ pathname: "/post/[id]", params: { id: postId } });
      } else if (isGlobal) {
        router.push("/notifications");
      }
    });
  };

  // Build items
  const items: { icon: string; count: number }[] = [];
  if (counts.likes > 0) items.push({ icon: 'heart', count: counts.likes });
  if (counts.comments > 0) items.push({ icon: 'chatbubble', count: counts.comments });
  if (counts.follows > 0) items.push({ icon: 'person-add', count: counts.follows });
  if (items.length === 0) return null;

  // Dynamically calculate where the tail should point
  // tailRightOffset = distance from the RIGHT edge of the bubble to the bell icon center
  // We position the whole container from the right, so we need to know:
  //   - bubble's right edge = SCREEN_WIDTH - containerRight (8px margin)
  //   - tail position from right edge of bubble = bubbleRightEdge - bellIconCenterX
  const containerRight = 8;
  const tailRightFromBubble = bellIconCenterX
    ? Math.max(10, (SCREEN_WIDTH - containerRight) - bellIconCenterX - 7) // 7 = half the tail width
    : 12; // fallback

  return (
    <Animated.View
      style={[
        styles.container,
        isGlobal ? styles.globalPos : styles.postPos,
        {
          opacity: opacityAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim },
          ],
        },
      ]}
      pointerEvents="box-none"
    >
      {/* Upward-pointing tail for global indicator */}
      {isGlobal && (
        <View style={[styles.tailContainer, { paddingRight: tailRightFromBubble }]}>
          <View style={styles.tailTriangle} />
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.bubble,
          isGlobal
            ? styles.globalBubble
            : {
                backgroundColor: isDark ? 'rgba(30,41,59,0.95)' : 'rgba(255,255,255,0.95)',
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
              },
        ]}
        activeOpacity={0.85}
        onPress={handlePress}
        onLayout={(e) => {
          setBubbleWidth(e.nativeEvent.layout.width);
        }}
      >
        <View style={styles.content}>
          {items.map((item, idx) => (
            <React.Fragment key={item.icon}>
              {idx > 0 && <View style={[styles.separator, isGlobal ? styles.globalSep : { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]} />}
              <View style={styles.item}>
                <Ionicons
                  name={item.icon as any}
                  size={isGlobal ? 14 : 11}
                  color={isGlobal ? '#FFFFFF' : (
                    item.icon === 'heart' ? '#EF4444' :
                    item.icon === 'chatbubble' ? '#3B82F6' : '#10B981'
                  )}
                />
                <AppText
                  weight="extrabold"
                  style={[
                    styles.countText,
                    { color: isGlobal ? '#FFFFFF' : colors.textPrimary },
                  ]}
                >
                  {item.count}
                </AppText>
              </View>
            </React.Fragment>
          ))}
        </View>
      </TouchableOpacity>

      {/* Downward tail for post-level indicators */}
      {!isGlobal && (
        <View style={styles.postTailContainer}>
          <View style={[styles.postTailTriangle, {
            borderTopColor: isDark ? 'rgba(30,41,59,0.95)' : 'rgba(255,255,255,0.95)',
          }]} />
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 9999,
    elevation: 9999,
  },

  // Global: right-aligned, just below the header bar
  globalPos: {
    top: 0, // wrapper is already right below the header
    right: 8,
    zIndex: 9999,
    alignItems: 'flex-end',
  },

  // Post-level
  postPos: {
    bottom: -14,
    left: 16,
    zIndex: 9999,
  },

  // ─── Upward tail (global) ────────────
  tailContainer: {
    alignItems: 'flex-end',
    marginBottom: -1,
  },
  tailTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderBottomWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: INDICATOR_BG,
  },

  // ─── Downward tail (post) ────────────
  postTailContainer: {
    alignItems: 'flex-start',
    paddingLeft: 14,
    marginTop: -1,
  },
  postTailTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },

  // ─── Bubble ──────────────────────────
  bubble: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 8,
  },
  globalBubble: {
    backgroundColor: INDICATOR_BG,
    borderColor: 'transparent',
  },

  // ─── Content ─────────────────────────
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  separator: {
    width: 1,
    height: 14,
    marginHorizontal: 10,
  },
  globalSep: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  countText: {
    fontSize: 14,
    fontFamily: FontFamily.extraBold,
    letterSpacing: -0.3,
  },
});
