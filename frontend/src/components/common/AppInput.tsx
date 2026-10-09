import React, { useState, forwardRef, useImperativeHandle, useRef } from "react";
import {
  View,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
  NativeSyntheticEvent,
  TextInputFocusEventData,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { FontFamily, InputStyles, Radius } from "../../constants/theme";
import { AppText } from "./AppText";

export interface AppInputProps extends TextInputProps {
  /**
   * Field label displayed above the input
   */
  label?: string;
  /**
   * Error message displayed below the input
   */
  error?: string;
  /**
   * Informative helper message displayed below the input
   */
  helperText?: string;
  /**
   * Icon or accessory rendered on the left of the input
   */
  leadingIcon?: React.ReactNode;
  /**
   * Icon or accessory rendered on the right of the input
   */
  trailingIcon?: React.ReactNode;
  /**
   * Root wrapper container style
   */
  containerStyle?: StyleProp<ViewStyle>;
  /**
   * Inner border box container style
   */
  inputCardStyle?: StyleProp<ViewStyle>;
  /**
   * Label text style override
   */
  labelStyle?: StyleProp<TextStyle>;
  /**
   * Error text style override
   */
  errorStyle?: StyleProp<TextStyle>;
  /**
   * Helper text style override
   */
  helperStyle?: StyleProp<TextStyle>;
}

export const AppInput = forwardRef<TextInput, AppInputProps>(
  (
    {
      label,
      error,
      helperText,
      leadingIcon,
      trailingIcon,
      containerStyle,
      inputCardStyle,
      labelStyle,
      errorStyle,
      helperStyle,
      style,
      placeholderTextColor,
      selectionColor,
      onFocus,
      onBlur,
      editable = true,
      ...props
    },
    ref
  ) => {
    const { colors, isDark } = useTheme();
    const [isFocused, setIsFocused] = useState(false);
    const internalInputRef = useRef<TextInput>(null);

    // Forward ref to internal input
    useImperativeHandle(ref, () => internalInputRef.current as TextInput);

    const handleFocus: NonNullable<TextInputProps["onFocus"]> = (e) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur: NonNullable<TextInputProps["onBlur"]> = (e) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    const handleCardPress = () => {
      if (editable) {
        internalInputRef.current?.focus();
      }
    };

    const hasError = Boolean(error);

    // Dynamic border & background colors based on focus & error & theme
    const getBorderColor = () => {
      if (hasError) return colors.danger;
      if (isFocused) return colors.primary;
      return colors.border;
    };

    const getBackgroundColor = () => {
      if (!editable) return isDark ? "#18181B" : "#F1F5F9";
      if (isFocused) return isDark ? "#121212" : "#FFFFFF";
      return isDark ? "#18181B" : "#F8FAFC";
    };

    return (
      <View style={[styles.rootContainer, containerStyle]}>
        {label ? (
          <AppText
            variant="label"
            style={[
              styles.label,
              { color: colors.textPrimary },
              labelStyle,
            ]}
          >
            {label}
          </AppText>
        ) : null}

        <TouchableOpacity
          activeOpacity={1}
          onPress={handleCardPress}
          style={[
            styles.cardContainer,
            {
              backgroundColor: getBackgroundColor(),
              borderColor: getBorderColor(),
            },
            inputCardStyle,
          ]}
        >
          {leadingIcon ? (
            <View style={styles.leadingIconContainer}>{leadingIcon}</View>
          ) : null}

          <TextInput
            ref={internalInputRef}
            editable={editable}
            placeholderTextColor={placeholderTextColor || colors.textMuted}
            selectionColor={selectionColor || colors.primary}
            style={[
              styles.textInput,
              {
                color: colors.textPrimary,
                fontFamily: FontFamily.regular,
              },
              style,
            ]}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...props}
          />

          {trailingIcon ? (
            <View style={styles.trailingIconContainer}>{trailingIcon}</View>
          ) : null}
        </TouchableOpacity>

        {hasError ? (
          <AppText
            variant="caption"
            style={[styles.feedbackText, { color: colors.danger }, errorStyle]}
          >
            {error}
          </AppText>
        ) : helperText ? (
          <AppText
            variant="caption"
            style={[
              styles.feedbackText,
              { color: colors.textSecondary },
              helperStyle,
            ]}
          >
            {helperText}
          </AppText>
        ) : null}
      </View>
    );
  }
);

AppInput.displayName = "AppInput";

const styles = StyleSheet.create({
  rootContainer: {
    width: "100%",
  },
  label: {
    marginBottom: 6,
    fontSize: InputStyles.labelTypography.fontSize,
    fontFamily: InputStyles.labelTypography.fontFamily,
  },
  cardContainer: {
    minHeight: InputStyles.height.md,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  leadingIconContainer: {
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  trailingIconContainer: {
    marginLeft: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  textInput: {
    flex: 1,
    fontSize: InputStyles.typography.fontSize,
    paddingVertical: 10,
  },
  feedbackText: {
    marginTop: 4,
    marginLeft: 4,
    fontSize: InputStyles.helperTypography.fontSize,
    fontFamily: InputStyles.helperTypography.fontFamily,
  },
});

export default AppInput;
