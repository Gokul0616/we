import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";

interface CustomDatePickerProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (date: Date) => void;
  initialDate?: Date;
}

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const getZodiacSign = (day: number, month: number) => {
  if ((month === 2 && day >= 21) || (month === 3 && day <= 19)) return { sign: "Aries", icon: "♈️" };
  if ((month === 3 && day >= 20) || (month === 4 && day <= 20)) return { sign: "Taurus", icon: "♉️" };
  if ((month === 4 && day >= 21) || (month === 5 && day <= 20)) return { sign: "Gemini", icon: "♊️" };
  if ((month === 5 && day >= 21) || (month === 6 && day <= 22)) return { sign: "Cancer", icon: "♋️" };
  if ((month === 6 && day >= 23) || (month === 7 && day <= 22)) return { sign: "Leo", icon: "♌️" };
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return { sign: "Virgo", icon: "♍️" };
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return { sign: "Libra", icon: "♎️" };
  if ((month === 9 && day >= 23) || (month === 10 && day <= 21)) return { sign: "Scorpio", icon: "♏️" };
  if ((month === 10 && day >= 22) || (month === 11 && day <= 21)) return { sign: "Sagittarius", icon: "♐️" };
  if ((month === 11 && day >= 22) || (month === 0 && day <= 19)) return { sign: "Capricorn", icon: "♑️" };
  if ((month === 0 && day >= 20) || (month === 1 && day <= 18)) return { sign: "Aquarius", icon: "♒️" };
  if ((month === 1 && day >= 19) || (month === 2 && day <= 20)) return { sign: "Pisces", icon: "♓️" };
  return { sign: "", icon: "" };
};

const WheelPicker = ({ items, selectedValue, onValueChange, colors }: any) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const index = items.findIndex((i: any) => i.value === selectedValue);
    if (index >= 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: index * ITEM_HEIGHT, animated: false });
      }, 50);
    }
  }, [selectedValue, items]);

  const handleScrollEnd = (event: any) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    if (items[index]) {
      onValueChange(items[index].value);
    }
  };

  return (
    <View style={styles.wheelContainer}>
      <Animated.ScrollView
        ref={scrollViewRef as any}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={(e) => {
          if (Platform.OS === "android") {
            const y = e.nativeEvent.contentOffset.y;
            const index = Math.round(y / ITEM_HEIGHT);
            scrollViewRef.current?.scrollTo({ y: index * ITEM_HEIGHT, animated: true });
            if (items[index]) {
              onValueChange(items[index].value);
            }
          }
        }}
        contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * 2 }}
      >
        {items.map((item: any, idx: number) => {
          const inputRange = [
            (idx - 2) * ITEM_HEIGHT,
            (idx - 1) * ITEM_HEIGHT,
            idx * ITEM_HEIGHT,
            (idx + 1) * ITEM_HEIGHT,
            (idx + 2) * ITEM_HEIGHT,
          ];

          const scale = scrollY.interpolate({
            inputRange,
            outputRange: [0.7, 0.85, 1.25, 0.85, 0.7],
            extrapolate: "clamp",
          });

          const opacity = scrollY.interpolate({
            inputRange,
            outputRange: [0.2, 0.5, 1, 0.5, 0.2],
            extrapolate: "clamp",
          });

          return (
            <View key={idx} style={[styles.wheelItem, { height: ITEM_HEIGHT }]}>
              <Animated.Text
                style={[
                  styles.wheelItemText,
                  { 
                    color: colors.textPrimary,
                    opacity,
                    transform: [{ scale }],
                    fontWeight: item.value === selectedValue ? "700" : "500",
                  }
                ]}
              >
                {item.label}
              </Animated.Text>
            </View>
          );
        })}
      </Animated.ScrollView>
      <View style={[styles.selectionOverlay, { borderColor: colors.border }]} pointerEvents="none" />
    </View>
  );
};

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  visible,
  onClose,
  onConfirm,
  initialDate,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  
  const currentYear = new Date().getFullYear();
  const defaultDate = initialDate || new Date(1990, 0, 1);
  
  const [day, setDay] = useState(defaultDate.getDate());
  const [month, setMonth] = useState(defaultDate.getMonth());
  const [year, setYear] = useState(defaultDate.getFullYear());

  // Generate Days based on month & year
  const getDaysInMonth = (m: number, y: number) => {
    return new Date(y, m + 1, 0).getDate();
  };
  
  const numDays = getDaysInMonth(month, year);
  
  // Adjust day if month changes to one with fewer days (e.g. 31 to 28)
  useEffect(() => {
    if (day > numDays) {
      setDay(numDays);
    }
  }, [month, year, numDays]);

  const days = Array.from({ length: numDays }, (_, i) => ({
    label: `${i + 1}`,
    value: i + 1,
  }));

  const months = MONTHS.map((m, i) => ({
    label: m,
    value: i,
  }));

  const years = Array.from({ length: currentYear - 1900 + 1 }, (_, i) => ({
    label: `${currentYear - i}`,
    value: currentYear - i,
  })).reverse();

  const handleConfirm = () => {
    const selectedDate = new Date(year, month, day);
    onConfirm(selectedDate);
    onClose();
  };

  const zodiac = getZodiacSign(day, month);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.fullScreenContainer, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
            <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Select Date</Text>
          <TouchableOpacity onPress={handleConfirm} style={styles.headerBtn}>
            <Text style={styles.confirmText}>Done</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.centerContent}>
          <View style={styles.pickersWrapper}>
            <WheelPicker items={months} selectedValue={month} onValueChange={setMonth} colors={colors} />
            <WheelPicker items={days} selectedValue={day} onValueChange={setDay} colors={colors} />
            <WheelPicker items={years} selectedValue={year} onValueChange={setYear} colors={colors} />
          </View>

          <View style={styles.zodiacContainer}>
            <Text style={styles.zodiacIcon}>{zodiac.icon}</Text>
            <Text style={[styles.zodiacText, { color: colors.textPrimary }]}>{zodiac.sign}</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: 56,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: {
    paddingVertical: 8,
    minWidth: 60,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "500",
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
  },
  confirmText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2563EB",
    textAlign: "right",
  },
  pickersWrapper: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    height: ITEM_HEIGHT * VISIBLE_ITEMS,
    paddingHorizontal: 20,
    borderRadius: 24,
    width: "100%",
  },
  wheelContainer: {
    flex: 1,
    height: ITEM_HEIGHT * VISIBLE_ITEMS,
    position: "relative",
  },
  wheelItem: {
    justifyContent: "center",
    alignItems: "center",
  },
  wheelItemText: {
    fontSize: 16,
    fontWeight: "400",
  },
  selectionOverlay: {
    position: "absolute",
    top: ITEM_HEIGHT * 2,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  zodiacContainer: {
    alignItems: "center",
    marginTop: 40,
  },
  zodiacIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  zodiacText: {
    fontSize: 20,
    fontWeight: "600",
  },
});
