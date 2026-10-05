import React, { useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/theme";
import { ENDPOINTS } from "../../constants/api";
import { apiClient } from "../../services/apiClient";

interface EmailInputScreenProps {
  onContinue: (email: string) => void;
  onBack: () => void;
}

export function EmailInputScreen({ onContinue, onBack }: EmailInputScreenProps) {
  const [email, setEmail] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const emailRef = useRef<TextInput>(null);

  const isValidEmail = email.includes("@") && email.includes(".");

  const handleNext = async () => {
    if (!isValidEmail || isLoading) return;
    Keyboard.dismiss();
    setIsLoading(true);

    try {
      await apiClient.post(ENDPOINTS.auth.sendOtp, {
        email: email.trim().toLowerCase(),
      });
      onContinue(email.trim().toLowerCase());
    } catch (err: any) {
      // Toast notification is shown automatically by apiClient interceptor.
      // Do not proceed next if sending OTP fails.
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Navigation Bar */}
        <View style={styles.navBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color="#0F172A" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="none"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>What's your email?</Text>
              <Text style={styles.subtitle}>
                We'll send a 6-digit verification code to confirm your address.
              </Text>
            </View>

            {/* Input Card with Container Click-to-Focus */}
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => emailRef.current?.focus()}
              style={[
                styles.inputCard,
                isFocused && styles.inputCardFocused,
              ]}
            >
              <Ionicons
                name="mail-outline"
                size={20}
                color={isFocused ? Colors.primary : "#94A3B8"}
                style={styles.leadingIcon}
              />
              <TextInput
                ref={emailRef}
                style={styles.input}
                placeholder="name@example.com"
                placeholderTextColor="#94A3B8"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="emailAddress"
                autoComplete="email"
                returnKeyType="done"
                autoFocus
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onSubmitEditing={handleNext}
                selectionColor={Colors.primary}
              />
              {email.length > 0 && (
                <TouchableOpacity
                  onPress={() => setEmail("")}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Ionicons name="close-circle" size={18} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                (!isValidEmail || isLoading) && styles.buttonDisabled,
              ]}
              onPress={handleNext}
              disabled={!isValidEmail || isLoading}
              activeOpacity={0.88}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Continue</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  navBar: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.6,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: "#64748B",
  },
  inputCard: {
    height: 54,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  inputCardFocused: {
    borderColor: Colors.primary,
    backgroundColor: "#FFFFFF",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  leadingIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#0F172A",
    paddingVertical: 0,
  },
  primaryButton: {
    height: 52,
    backgroundColor: Colors.primary,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },
});

