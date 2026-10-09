import React, { useMemo, useState } from "react";
import {
  Switch,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { AppText } from "../common/AppText";
import { ComposeSheet, SheetOptionRow } from "./ComposeSheet";
import { FontFamily, withAlpha } from "../../constants/theme";

export interface PrivacyOption {
  key: "public" | "friends" | "private";
  label: string;
  icon: string;
  desc: string;
}

/* ------------------------------------------------------------------ */
/* Audience / privacy sheet                                           */
/* ------------------------------------------------------------------ */

interface PrivacySheetProps {
  visible: boolean;
  onClose: () => void;
  options: readonly PrivacyOption[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  addToStory: boolean;
  onToggleStory: (value: boolean) => void;
}

export function PrivacySheet({
  visible,
  onClose,
  options,
  selectedIndex,
  onSelect,
  addToStory,
  onToggleStory,
}: PrivacySheetProps) {
  const { colors } = useTheme();

  return (
    <ComposeSheet
      visible={visible}
      onClose={onClose}
      title="Who can see this post?"
      subtitle="You can change this any time before sharing"
      scrollable={false}
    >
      {options.map((opt, idx) => (
        <SheetOptionRow
          key={opt.key}
          icon={opt.icon}
          label={opt.label}
          description={opt.desc}
          selected={selectedIndex === idx}
          onPress={() => {
            onSelect(idx);
            onClose();
          }}
          isLast={idx === options.length - 1}
        />
      ))}

      <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

      <View style={styles.storyRow}>
        <View style={[styles.storyIcon, { backgroundColor: colors.surfaceHighlight }]}>
          <Ionicons name="sparkles-outline" size={17} color={colors.textSecondary} />
        </View>
        <View style={styles.storyTextCol}>
          <AppText weight="semibold" style={[styles.storyLabel, { color: colors.textPrimary }]}>
            Also share to my story
          </AppText>
          <AppText variant="caption" color="textSecondary">
            {"Cross-post this to your followers' story feed"}
          </AppText>
        </View>
        <Switch
          value={addToStory}
          onValueChange={onToggleStory}
          trackColor={{
            false: colors.border,
            true: withAlpha(colors.primary, 0.55),
          }}
          thumbColor={addToStory ? colors.primary : colors.surface}
          ios_backgroundColor={colors.border}
        />
      </View>
    </ComposeSheet>
  );
}

/* ------------------------------------------------------------------ */
/* Topics / tags sheet                                                */
/* ------------------------------------------------------------------ */

export function normalizeTag(raw: string): string {
  const cleaned = raw
    .trim()
    .replace(/^#+/, "")
    .replace(/\s+/g, "")
    .slice(0, 24);
  return cleaned ? `#${cleaned}` : "";
}

interface TagsSheetProps {
  visible: boolean;
  onClose: () => void;
  selected: string[];
  suggestions: string[];
  max?: number;
  onChange: (tags: string[]) => void;
}

export function TagsSheet(props: TagsSheetProps) {
  return (
    <ComposeSheet
      visible={props.visible}
      onClose={props.onClose}
      title="Add topics"
      subtitle={
        props.selected.length < (props.max ?? 8)
          ? `Up to ${props.max ?? 8} topics · ${(props.max ?? 8) - props.selected.length} left`
          : `Topic limit reached (${props.max ?? 8})`
      }
    >
      {/* Mounted only while open → input state resets on every open. */}
      {props.visible ? <TagsSheetBody {...props} /> : null}
    </ComposeSheet>
  );
}

function TagsSheetBody({ selected, suggestions, max = 8, onChange }: Omit<TagsSheetProps, "visible" | "onClose">) {
  const { colors } = useTheme();
  const [query, setQuery] = useState("");

  const canAddMore = selected.length < max;

  const addTag = (raw: string) => {
    const tag = normalizeTag(raw);
    if (!tag || selected.includes(tag) || !canAddMore) return;
    onChange([...selected, tag]);
    setQuery("");
  };

  const toggleSuggestion = (tag: string) => {
    if (selected.includes(tag)) {
      onChange(selected.filter((t) => t !== tag));
    } else if (canAddMore) {
      onChange([...selected, tag]);
    }
  };

  const available = useMemo(
    () => suggestions.filter((s) => !selected.includes(s)),
    [suggestions, selected]
  );

  const entryLocked = !query.trim() || !canAddMore;

  return (
    <>
      {/* Selected chips */}
      {selected.length > 0 && (
        <View style={styles.chipWrap}>
          {selected.map((tag) => (
            <TouchableOpacity
              key={tag}
              style={[styles.selectedChip, { backgroundColor: withAlpha(colors.primary, 0.12) }]}
              onPress={() => onChange(selected.filter((t) => t !== tag))}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Remove topic ${tag}`}
            >
              <AppText weight="semibold" style={[styles.selectedChipText, { color: colors.primary }]}>
                {tag}
              </AppText>
              <Ionicons name="close" size={13} color={colors.primary} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Free-form entry */}
      <View
        style={[
          styles.searchBox,
          { backgroundColor: colors.surfaceHighlight, borderColor: colors.border },
        ]}
      >
        <Ionicons name="pricetag" size={15} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={(t) => setQuery(t.replace(/[^a-zA-Z0-9_ #]/g, ""))}
          onSubmitEditing={() => addTag(query)}
          placeholder="Create a topic"
          placeholderTextColor={colors.textMuted}
          style={[styles.searchInput, { color: colors.textPrimary }]}
          returnKeyType="done"
          autoCorrect={false}
          maxLength={26}
          editable={canAddMore}
          accessibilityLabel="Create a topic"
        />
        <TouchableOpacity
          onPress={() => addTag(query)}
          disabled={entryLocked}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Add topic"
        >
          <Ionicons
            name="add-circle"
            size={22}
            color={entryLocked ? colors.border : colors.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Suggestions */}
      <View style={styles.chipWrap}>
        {available.map((tag) => (
          <TouchableOpacity
            key={tag}
            style={[
              styles.suggestionChip,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
            onPress={() => toggleSuggestion(tag)}
            activeOpacity={0.7}
            disabled={!canAddMore}
            accessibilityRole="button"
            accessibilityLabel={`Add topic ${tag}`}
          >
            <AppText
              weight="medium"
              style={[
                styles.suggestionChipText,
                { color: canAddMore ? colors.textPrimary : colors.textMuted },
              ]}
            >
              {tag}
            </AppText>
            <Ionicons
              name="add"
              size={13}
              color={canAddMore ? colors.textSecondary : colors.textMuted}
            />
          </TouchableOpacity>
        ))}
        {available.length === 0 && (
          <AppText variant="caption" color="textMuted" style={styles.emptyState}>
            {canAddMore
              ? "No suggestions left — type your own above."
              : "Every suggested topic is already picked."}
          </AppText>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 10,
    marginTop: 8,
  },
  storyRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  storyIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  storyTextCol: {
    flex: 1,
    marginHorizontal: 12,
  },
  storyLabel: {
    fontSize: 14.5,
    fontFamily: FontFamily.semiBold,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    marginHorizontal: 10,
    marginTop: 8,
    marginBottom: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: FontFamily.regular,
    paddingVertical: 0,
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  selectedChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
  },
  selectedChipText: {
    fontSize: 13,
    fontFamily: FontFamily.semiBold,
  },
  suggestionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  suggestionChipText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
  },
  emptyState: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});
