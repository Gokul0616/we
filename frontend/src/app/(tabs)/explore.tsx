import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../constants/theme";

export default function ExploreTab() {
  const categories = ["For You", "Trending", "Travel", "Food", "Music", "Fitness"];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Explore</Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchCard}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search people, topics, places..."
          placeholderTextColor="#94A3B8"
        />
      </View>

      {/* Category Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        {categories.map((cat, idx) => (
          <TouchableOpacity
            key={cat}
            style={[styles.chip, idx === 0 && styles.activeChip]}
          >
            <Text style={[styles.chipText, idx === 0 && styles.activeChipText]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Explore Grid Preview */}
      <ScrollView contentContainerStyle={styles.gridContainer}>
        <View style={styles.gridRow}>
          <View style={[styles.card, { backgroundColor: "#1e293b" }]}>
            <Text style={styles.cardTitle}>Travel</Text>
            <Text style={styles.cardSub}>12.4M posts</Text>
          </View>
          <View style={[styles.card, { backgroundColor: "#334155" }]}>
            <Text style={styles.cardTitle}>Photography</Text>
            <Text style={styles.cardSub}>8.7M posts</Text>
          </View>
        </View>

        <View style={styles.gridRow}>
          <View style={[styles.card, { backgroundColor: "#475569" }]}>
            <Text style={styles.cardTitle}>Music</Text>
            <Text style={styles.cardSub}>6.2M posts</Text>
          </View>
          <View style={[styles.card, { backgroundColor: "#1e3a8a" }]}>
            <Text style={styles.cardTitle}>Fitness</Text>
            <Text style={styles.cardSub}>4.8M posts</Text>
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
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  searchCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 20,
    marginHorizontal: 20,
    paddingHorizontal: 14,
    height: 44,
    marginTop: 8,
    marginBottom: 12,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#0F172A",
  },
  chipsRow: {
    paddingHorizontal: 20,
    gap: 8,
    paddingBottom: 16,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
  },
  activeChip: {
    backgroundColor: Colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  activeChipText: {
    color: "#FFFFFF",
  },
  gridContainer: {
    paddingHorizontal: 20,
    gap: 12,
    paddingBottom: 24,
  },
  gridRow: {
    flexDirection: "row",
    gap: 12,
  },
  card: {
    flex: 1,
    height: 150,
    borderRadius: 16,
    padding: 16,
    justifyContent: "flex-end",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  cardSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    marginTop: 2,
  },
});
