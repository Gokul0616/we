import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../constants/theme";

export default function ProfileTab() {
  const highlights = ["Travel", "Food", "Friends", "Life"];
  const subTabs = ["Posts", "Replies", "Media", "Likes"];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatarRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>G</Text>
            </View>
            <TouchableOpacity style={styles.editBtn}>
              <Text style={styles.editBtnText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.name}>Gokul Ssb</Text>
          <Text style={styles.handle}>@gokul_ssb</Text>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>248</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>1.2K</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>312</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
          </View>

          {/* Bio */}
          <Text style={styles.bio}>
            Building cool things{"\n"}Developer | Traveler | Foodie{"\n"}📍 Bangalore, India
          </Text>

          {/* Story Highlights */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.highlightsRow}>
            {highlights.map((item) => (
              <View key={item} style={styles.highlightItem}>
                <View style={styles.highlightRing}>
                  <Text style={styles.highlightEmoji}>✨</Text>
                </View>
                <Text style={styles.highlightLabel}>{item}</Text>
              </View>
            ))}
          </ScrollView>

          {/* Sub Navigation Tabs */}
          <View style={styles.subTabsRow}>
            {subTabs.map((tab, idx) => (
              <TouchableOpacity key={tab} style={[styles.subTab, idx === 0 && styles.activeSubTab]}>
                <Text style={[styles.subTabText, idx === 0 && styles.activeSubTabText]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* User Posts Grid */}
          <View style={styles.grid}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <View key={i} style={styles.gridTile}>
                <Text style={styles.gridTileText}>📷 {i}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  avatarRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#1e3a8a",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  editBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  name: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.3,
  },
  handle: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 2,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: "row",
    gap: 28,
    marginBottom: 16,
  },
  statItem: {
    alignItems: "flex-start",
  },
  statNumber: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
  },
  statLabel: {
    fontSize: 12,
    color: "#64748B",
  },
  bio: {
    fontSize: 14,
    lineHeight: 20,
    color: "#334155",
    marginBottom: 20,
  },
  highlightsRow: {
    marginBottom: 24,
  },
  highlightItem: {
    alignItems: "center",
    marginRight: 16,
  },
  highlightRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  highlightEmoji: {
    fontSize: 20,
  },
  highlightLabel: {
    fontSize: 11,
    color: "#64748B",
  },
  subTabsRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    marginBottom: 12,
  },
  subTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  activeSubTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#0F172A",
  },
  subTabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#94A3B8",
  },
  activeSubTabText: {
    color: "#0F172A",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    paddingBottom: 32,
  },
  gridTile: {
    width: "32%",
    height: 110,
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  gridTileText: {
    color: "#94A3B8",
    fontSize: 13,
  },
});
