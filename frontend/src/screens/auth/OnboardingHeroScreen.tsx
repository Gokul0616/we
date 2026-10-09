import React, { useRef, useState } from "react";
import {
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  StatusBar,
  Animated,
  useWindowDimensions,
  FlatList,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, FontFamily } from "../../constants/theme";
import { AppText } from "../../components/common/AppText";
import { AppButton } from "../../components/common/AppButton";

interface OnboardingSlide {
  id: string;
  image: any;
  title1: string;
  title2: string;
  description: string;
}

const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: "slide_1",
    image: require("../../../assets/images/onboarding_hero.jpg"),
    title1: "Real People",
    title2: "Real Conversations",
    description:
      "Be part of genuine conversations with people who share your interests.",
  },
  {
    id: "slide_2",
    image: require("../../../assets/images/onboarding_slide_2.jpg"),
    title1: "Visual Stories",
    title2: "Authentic Moments",
    description:
      "Share your journeys, photos, videos, and daily moments with friends.",
  },
  {
    id: "slide_3",
    image: require("../../../assets/images/onboarding_slide_3.jpg"),
    title1: "Explore & Discover",
    title2: "Find Your Tribe",
    description:
      "Discover vibrant communities, trending creators, and spaces tailored to you.",
  },
  {
    id: "slide_4",
    image: require("../../../assets/images/onboarding_slide_4.jpg"),
    title1: "Stay Connected",
    title2: "Real-Time Conversations",
    description:
      "Message friends instantly with live chat, reactions, and zero reload.",
  },
];

interface OnboardingHeroScreenProps {
  onGetStarted?: () => void;
  onLogIn?: () => void;
}

export function OnboardingHeroScreen({
  onGetStarted,
  onLogIn,
}: OnboardingHeroScreenProps) {
  const { width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList<OnboardingSlide>>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [activeIndex, setActiveIndex] = useState(0);

  const handleDotPress = (index: number) => {
    flatListRef.current?.scrollToIndex({
      index,
      animated: true,
    });
  };

  const isSmallScreen = screenWidth < 380;

  const renderSlideItem = ({ item }: { item: OnboardingSlide }) => {
    return (
      <View style={[styles.slideContainer, { width: screenWidth }]}>
        {/* Full-bleed Hero Photography */}
        <Image
          source={item.image}
          style={styles.heroImage}
          resizeMode="cover"
        />

        {/* Deep Cinematic Gradient Overlay */}
        <LinearGradient
          colors={[
            "transparent",
            "rgba(0,0,0,0.15)",
            "rgba(0,0,0,0.6)",
            "rgba(0,0,0,0.92)",
            "#000000",
          ]}
          locations={[0, 0.35, 0.62, 0.82, 1]}
          style={StyleSheet.absoluteFill}
        />

        {/* Slide Content positioned safely above bottom controls */}
        <View
          style={[
            styles.slideContent,
            {
              paddingBottom: Math.max(insets.bottom, 24) + 164,
            },
          ]}
        >
          <View style={styles.textBlock}>
            <AppText weight="extrabold" style={[styles.titleLine, isSmallScreen && styles.titleSmall]}>
              {item.title1}
            </AppText>
            <AppText weight="extrabold" style={[styles.titleLine, isSmallScreen && styles.titleSmall]}>
              {item.title2}
            </AppText>
            <AppText variant="body" style={styles.subtitle}>
              {item.description}
            </AppText>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Swipeable Horizontal Carousel with identical iOS & Android snap behavior */}
      <Animated.FlatList
        ref={flatListRef}
        data={ONBOARDING_SLIDES}
        renderItem={renderSlideItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled={Platform.OS === "ios"}
        snapToInterval={screenWidth}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum={true}
        showsHorizontalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
        scrollEventThrottle={16}
        getItemLayout={(_, index) => ({
          length: screenWidth,
          offset: screenWidth * index,
          index,
        })}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={(event) => {
          const newIndex = Math.round(
            event.nativeEvent.contentOffset.x / screenWidth
          );
          setActiveIndex(newIndex);
        }}
        style={styles.flatList}
      />

      {/* Fixed Bottom UI: Dots + CTA Button + Login footer */}
      <View
        style={[
          styles.bottomControls,
          {
            paddingBottom: Math.max(insets.bottom, 24),
          },
        ]}
        pointerEvents="box-none"
      >
        {/* Animated Carousel Pagination Dots */}
        <View style={styles.dotsRow} pointerEvents="auto">
          {ONBOARDING_SLIDES.map((_, index) => {
            const inputRange = [
              (index - 1) * screenWidth,
              index * screenWidth,
              (index + 1) * screenWidth,
            ];

            // Smooth width animation: circle (6px) -> active pill (24px) -> circle (6px)
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [6, 24, 6],
              extrapolate: "clamp",
            });

            // Smooth opacity animation
            const dotOpacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.35, 1, 0.35],
              extrapolate: "clamp",
            });

            return (
              <TouchableOpacity
                key={`dot_${index}`}
                activeOpacity={0.7}
                onPress={() => handleDotPress(index)}
                hitSlop={{ top: 14, bottom: 14, left: 8, right: 8 }}
                style={styles.dotTouchWrapper}
              >
                <Animated.View
                  style={[
                    styles.dot,
                    {
                      width: dotWidth,
                      opacity: dotOpacity,
                    },
                  ]}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Get Started Button */}
        <AppButton
          title="Get Started"
          size="lg"
          onPress={onGetStarted}
          style={styles.primaryButton}
        />

        {/* Log In Footer Link */}
        <View style={styles.footerRow}>
          <AppText variant="bodySmall" style={styles.footerText}>
            {"Already have an account? "}
          </AppText>
          <TouchableOpacity activeOpacity={0.7} onPress={onLogIn}>
            <AppText variant="bodySmall" weight="bold" style={styles.footerLink}>
              Log In
            </AppText>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  flatList: {
    flex: 1,
  },
  slideContainer: {
    flex: 1,
    height: "100%",
    position: "relative",
    justifyContent: "flex-end",
  },
  heroImage: {
    ...StyleSheet.absoluteFill,
    width: "100%",
    height: "100%",
  },
  slideContent: {
    paddingHorizontal: 28,
  },
  textBlock: {
    marginBottom: 8,
  },
  titleLine: {
    fontSize: 34,
    fontFamily: FontFamily.extraBold,
    color: "#FFFFFF",
    letterSpacing: -0.8,
    lineHeight: 40,
  },
  titleSmall: {
    fontSize: 28,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 23,
    color: "rgba(255, 255, 255, 0.82)",
    marginTop: 10,
    fontFamily: FontFamily.regular,
    maxWidth: 320,
  },
  bottomControls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    zIndex: 10,
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 24,
    height: 12,
  },
  dotTouchWrapper: {
    height: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  dot: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
  },
  primaryButton: {
    height: 56,
    backgroundColor: Colors.primary,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 18,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  footerText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.72)",
  },
  footerLink: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});

