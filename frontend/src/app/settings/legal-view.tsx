import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { useTheme } from "../../context/ThemeContext";
import { SettingsHeader } from "../../components/settings/SettingsUI";

interface DocContent {
  title: string;
  sections: { heading: string; body: string }[];
}

const DOCS: Record<string, DocContent> = {
  terms: {
    title: "Terms of Service",
    sections: [
      {
        heading: "1. Acceptance of Terms",
        body: "By creating an account or using the WE application, you agree to comply with and be bound by these Terms of Service. If you disagree with any portion, please cease usage of the platform.",
      },
      {
        heading: "2. User Conduct & Accounts",
        body: "You are responsible for maintaining the confidentiality of your login credentials and for all activities that take place under your account. You agree not to upload abusive, harmful, or illegal content.",
      },
      {
        heading: "3. Content Ownership & Licensing",
        body: "You retain ownership of the photos, videos, and texts you publish. By uploading to WE, you grant the service a non-exclusive license to host, display, and distribute your content across our network.",
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    sections: [
      {
        heading: "1. Information We Collect",
        body: "We collect information you provide directly, such as your profile details, posts, and messages, as well as automatic device diagnostic details and usage metrics to optimize your experience.",
      },
      {
        heading: "2. How We Use Data",
        body: "Your information is used to deliver real-time sync feeds, enhance personalization, secure against fraud and abuse, and provide reliable notifications.",
      },
      {
        heading: "3. Your Privacy Controls",
        body: "You can adjust your profile visibility, block unwanted users, manage hidden keywords, and customize interaction permissions at any time in Settings.",
      },
    ],
  },
  guidelines: {
    title: "Community Guidelines",
    sections: [
      {
        heading: "Authenticity & Respect",
        body: "WE is built on real connections. Treat every member with respect and kindness. Harassment, hate speech, and impersonation are strictly forbidden.",
      },
      {
        heading: "Content Standards",
        body: "Do not post violent, graphic, sexually explicit, or infringing material. Content that violates community standards will be removed promptly.",
      },
    ],
  },
  safety: {
    title: "Safety Center",
    sections: [
      {
        heading: "Protecting Your Account",
        body: "Never share your password or one-time codes with anyone. Enable Two-Factor Authentication in Settings for enhanced security against unauthorized access.",
      },
      {
        heading: "Handling Unwanted Interactions",
        body: "You can block users or filter comments using the Hidden Words feature. Use 'Report a Problem' to alert our moderation team of any violations.",
      },
    ],
  },
  mission: {
    title: "Our Mission",
    sections: [
      {
        heading: "Building a More Connected World",
        body: "WE was created to bring people closer through expressive, safe, and modern digital spaces. We believe in empowering people with privacy-first, lightning-fast social tools.",
      },
      {
        heading: "Our Vision for Social Media",
        body: "We envision an open social network where creators thrive, conversations are authentic, and users retain absolute control over their personal privacy and shared content.",
      },
    ],
  },
  values: {
    title: "Our Values",
    sections: [
      {
        heading: "1. Authenticity",
        body: "We encourage real, unfiltered human expression and champion honesty across every profile and community interaction.",
      },
      {
        heading: "2. Community",
        body: "We put people first. Our platform is built to foster inclusive, vibrant groups where everyone can belong and share their passions.",
      },
      {
        heading: "3. Creativity",
        body: "From high-definition video posts to interactive real-time experiences, we provide creators with cutting-edge tools to express themselves.",
      },
    ],
  },
};

export default function LegalViewScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ doc?: string }>();
  const docKey = params.doc || "terms";
  const doc = DOCS[docKey] || DOCS.terms;

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={["top", "bottom"]}
    >
      <SettingsHeader title={doc.title} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.updatedText, { color: colors.textSecondary }]}>
          Last updated: October 2026
        </Text>

        {doc.sections.map((sec, idx) => (
          <View
            key={idx}
            style={[
              styles.sectionCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
              {sec.heading}
            </Text>
            <Text style={[styles.sectionBody, { color: colors.textSecondary }]}>
              {sec.body}
            </Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  updatedText: {
    fontSize: 12,
    marginBottom: 16,
    marginLeft: 4,
    fontStyle: "italic",
  },
  sectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 8,
  },
  sectionBody: {
    fontSize: 14,
    lineHeight: 21,
  },
});
