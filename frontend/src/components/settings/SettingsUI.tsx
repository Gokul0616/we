import React, { ReactNode } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { FontFamily } from "../../constants/theme";

interface SettingsHeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: ReactNode;
}

export const SettingsHeader = ({
  title,
  showBack = true,
  onBack,
  rightAction,
}: SettingsHeaderProps) => {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <View style={[styles.headerContainer, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
      <View style={styles.headerLeft}>
        {showBack ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack || (() => router.back())}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 36 }} />
        )}
      </View>

      <Text style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>
        {title}
      </Text>

      <View style={styles.headerRight}>
        {rightAction || <View style={{ width: 36 }} />}
      </View>
    </View>
  );
};

export const SettingsSection = ({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) => {
  const { colors } = useTheme();

  return (
    <View style={styles.sectionContainer}>
      {title ? (
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          {title}
        </Text>
      ) : null}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {children}
      </View>
    </View>
  );
};

interface SettingsRowProps {
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBg?: string;
  title: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
  destructive?: boolean;
  isLast?: boolean;
}

export const SettingsRow = ({
  icon,
  iconColor,
  iconBg,
  title,
  subtitle,
  value,
  onPress,
  showChevron = true,
  destructive = false,
  isLast = false,
}: SettingsRowProps) => {
  const { colors } = useTheme();

  return (
    <>
      <TouchableOpacity
        style={styles.rowContainer}
        onPress={onPress}
        disabled={!onPress}
        activeOpacity={onPress ? 0.65 : 1}
      >
        {icon ? (
          <View
            style={[
              styles.iconWrapper,
              iconBg ? { backgroundColor: iconBg } : null,
            ]}
          >
            <Ionicons
              name={icon}
              size={20}
              color={iconColor || (destructive ? colors.danger : colors.textPrimary)}
            />
          </View>
        ) : null}

        <View style={styles.textContainer}>
          <Text
            style={[
              styles.rowTitle,
              { color: destructive ? colors.danger : colors.textPrimary },
            ]}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        {value ? (
          <Text style={[styles.rowValue, { color: colors.textSecondary }]}>
            {value}
          </Text>
        ) : null}

        {showChevron && onPress ? (
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.textMuted}
            style={styles.chevron}
          />
        ) : null}
      </TouchableOpacity>
      {!isLast && (
        <View
          style={[
            styles.divider,
            {
              backgroundColor: colors.borderLight,
              marginLeft: icon ? 52 : 16,
            },
          ]}
        />
      )}
    </>
  );
};

interface SettingsSwitchRowProps {
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBg?: string;
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (val: boolean) => void;
  isLast?: boolean;
  disabled?: boolean;
}

export const SettingsSwitchRow = ({
  icon,
  iconColor,
  iconBg,
  title,
  subtitle,
  value,
  onValueChange,
  isLast = false,
  disabled = false,
}: SettingsSwitchRowProps) => {
  const { colors, isDark } = useTheme();

  return (
    <>
      <View style={styles.rowContainer}>
        {icon ? (
          <View
            style={[
              styles.iconWrapper,
              iconBg ? { backgroundColor: iconBg } : null,
            ]}
          >
            <Ionicons
              name={icon}
              size={20}
              color={iconColor || colors.textPrimary}
            />
          </View>
        ) : null}

        <View style={styles.textContainer}>
          <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        <Switch
          value={value}
          onValueChange={onValueChange}
          disabled={disabled}
          trackColor={{
            false: isDark ? "#27272A" : "#E2E8F0",
            true: "#2563EB",
          }}
          thumbColor="#FFFFFF"
          ios_backgroundColor={isDark ? "#27272A" : "#E2E8F0"}
        />
      </View>
      {!isLast && (
        <View
          style={[
            styles.divider,
            {
              backgroundColor: colors.borderLight,
              marginLeft: icon ? 52 : 16,
            },
          ]}
        />
      )}
    </>
  );
};

interface SettingsRadioRowProps {
  title: string;
  subtitle?: string;
  selected: boolean;
  onSelect: () => void;
  isLast?: boolean;
}

export const SettingsRadioRow = ({
  title,
  subtitle,
  selected,
  onSelect,
  isLast = false,
}: SettingsRadioRowProps) => {
  const { colors } = useTheme();

  return (
    <>
      <TouchableOpacity
        style={styles.rowContainer}
        onPress={onSelect}
        activeOpacity={0.7}
      >
        <View style={styles.textContainer}>
          <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        <View
          style={[
            styles.radioCircle,
            {
              borderColor: selected ? "#2563EB" : colors.border,
              backgroundColor: colors.card,
            },
          ]}
        >
          {selected && <View style={styles.radioDot} />}
        </View>
      </TouchableOpacity>
      {!isLast && (
        <View
          style={[
            styles.divider,
            {
              backgroundColor: colors.borderLight,
              marginLeft: 16,
            },
          ]}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {
    minWidth: 44,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  headerRight: {
    minWidth: 44,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  backButton: {
    padding: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: FontFamily.bold,
    textAlign: "center",
    flex: 1,
  },
  sectionContainer: {
    marginTop: 20,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: FontFamily.semiBold,
    marginBottom: 8,
    marginLeft: 4,
    textTransform: "none",
    letterSpacing: 0.2,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  rowContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 52,
  },
  iconWrapper: {
    width: 28,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
    paddingRight: 8,
  },
  rowTitle: {
    fontSize: 15,
    fontFamily: FontFamily.semiBold,
  },
  rowSubtitle: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    marginTop: 2,
    lineHeight: 16,
  },
  rowValue: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    marginRight: 6,
  },
  chevron: {
    marginLeft: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioDot: {
    width: 11,
    height: 11,
    borderRadius: 5.5,
    backgroundColor: "#2563EB",
  },
});
