import Ionicons from "@expo/vector-icons/Ionicons";
import { feedback } from "../lib/haptics";
import {
  GlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from "expo-glass-effect";
import { Image } from "expo-image";
import BatikPreviewLink from "./batik-preview-link";
import {
  useEffect,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import {
  AccessibilityInfo,
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-screens/experimental";
import type { Batik } from "../lib/types";
import { useApp } from "../state/app";

const dark = {
  paper: "#000000",
  raised: "#151515",
  ink: "#f4f1e9",
  soft: "#b3bcb5",
  line: "#303030",
  accent: "#f28b72",
  tint: "#362b25",
};
export function usePalette() {
  return dark;
}
export function useAccessibility() {
  const [reducedMotion, setMotion] = useState(false);
  const [reducedTransparency, setTransparency] = useState(true);
  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (active) setMotion(value);
      })
      .catch(() => {});
    if (Platform.OS === "ios")
      AccessibilityInfo.isReduceTransparencyEnabled()
        .then((value) => {
          if (active) setTransparency(value);
        })
        .catch(() => {});
    const motion = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setMotion,
    );
    const transparency =
      Platform.OS === "ios"
        ? AccessibilityInfo.addEventListener(
            "reduceTransparencyChanged",
            setTransparency,
          )
        : null;
    return () => {
      active = false;
      motion.remove();
      transparency?.remove();
    };
  }, []);
  return { reducedMotion, reducedTransparency };
}
export function Icon({
  name,
  color,
  size = 22,
}: {
  name: ComponentProps<typeof Ionicons>["name"];
  color?: ComponentProps<typeof Ionicons>["color"];
  size?: number;
}) {
  const palette = usePalette();
  return (
    <Ionicons
      name={name}
      color={color ?? palette.ink}
      size={size}
      accessible={false}
    />
  );
}
export function Copy({
  children,
  muted = false,
  style,
  ...props
}: ComponentProps<typeof Text> & { muted?: boolean }) {
  const p = usePalette();
  return (
    <Text
      {...props}
      style={[
        { fontSize: 16, lineHeight: 24, color: muted ? p.soft : p.ink },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
export function Title({
  children,
  large = false,
}: {
  children: ReactNode;
  large?: boolean;
}) {
  const p = usePalette();
  return (
    <Text
      accessibilityRole="header"
      style={{
        color: p.ink,
        fontSize: large ? 32 : 23,
        lineHeight: large ? 38 : 29,
        fontWeight: "700",
        letterSpacing: large ? -1.3 : -0.6,
      }}
    >
      {children}
    </Text>
  );
}
export function Button({
  label,
  onPress,
  secondary = false,
  disabled = false,
  icon,
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  icon?: ComponentProps<typeof Ionicons>["name"];
}) {
  const p = usePalette();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      onPress={() => {
        feedback("light");
        onPress();
      }}
      disabled={disabled}
      style={({ pressed }) => ({
        minHeight: 48,
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 8,
        backgroundColor: secondary ? p.raised : p.ink,
        borderWidth: secondary ? 1 : 0,
        borderColor: p.line,
        opacity: disabled ? 0.45 : pressed ? 0.7 : 1,
      })}
    >
      {icon && (
        <Icon name={icon} color={secondary ? p.ink : p.paper} size={19} />
      )}
      <Text
        style={{
          fontSize: 15,
          fontWeight: "600",
          color: secondary ? p.ink : p.paper,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
export function Glass({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const p = usePalette();
  const { reducedTransparency, reducedMotion } = useAccessibility();
  if (
    Platform.OS === "ios" &&
    !reducedTransparency &&
    isGlassEffectAPIAvailable() &&
    isLiquidGlassAvailable()
  )
    return (
      <GlassView
        glassEffectStyle={{
          style: "regular",
          animate: !reducedMotion,
          animationDuration: 0.28,
        }}
        colorScheme="dark"
        isInteractive
        style={[{ borderRadius: 24 }, style]}
      >
        {children}
      </GlassView>
    );
  return (
    <View
      style={[
        {
          backgroundColor: p.raised,
          borderColor: p.line,
          borderWidth: 1,
          borderRadius: 24,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
export function IconButton({
  name,
  label,
  onPress,
  selected = false,
}: {
  name: ComponentProps<typeof Ionicons>["name"];
  label: string;
  onPress: () => void;
  selected?: boolean;
}) {
  const p = usePalette();
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={() => {
        feedback();
        onPress();
      }}
      style={({ pressed }) => ({
        minWidth: 48,
        minHeight: 48,
        padding: 12,
        alignItems: "center",
        justifyContent: "center",
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <Icon name={name} color={selected ? p.accent : p.ink} />
    </Pressable>
  );
}
export function Screen({
  children,
  top = true,
  style,
}: {
  children: ReactNode;
  top?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const p = usePalette();
  const { storageError } = useApp();
  return (
    <SafeAreaView
      edges={{ top, bottom: true, left: true, right: true }}
      style={[{ flex: 1, backgroundColor: p.paper }, style]}
    >
      {storageError && (
        <Copy style={{ padding: 12, color: p.accent }}>{storageError}</Copy>
      )}
      {children}
    </SafeAreaView>
  );
}
export function Status({
  loading,
  error,
  empty,
  retry,
}: {
  loading?: boolean;
  error?: string | null;
  empty?: string;
  retry?: () => void;
}) {
  const p = usePalette();
  return (
    <View
      style={{
        paddingHorizontal: 24,
        paddingVertical: 40,
        alignItems: "center",
        gap: 16,
      }}
    >
      {loading ? (
        <ActivityIndicator color={p.accent} accessibilityLabel="Memuat karya" />
      ) : (
        <>
          <Icon
            name={error ? "cloud-offline-outline" : "albums-outline"}
            color={p.soft}
            size={32}
          />
          <Copy muted style={{ textAlign: "center" }}>
            {error ?? empty}
          </Copy>
          {error && retry && (
            <Button label="Coba lagi" onPress={retry} secondary />
          )}
        </>
      )}
    </View>
  );
}
export function BatikCard({
  item,
  compact = false,
}: {
  item: Batik;
  compact?: boolean;
}) {
  const p = usePalette();
  const { reducedMotion } = useAccessibility();
  const { preferences, toggleSave } = useApp();
  const saved = preferences.saved.some((value) => value.id === item.id);
  const preview = item.media.find((media) => media.kind === "image");
  return (
    <View style={{ flex: 1, position: "relative" }}>
      <BatikPreviewLink item={item}>
        <View
          style={{
            borderRadius: 19,
            overflow: "hidden",
            backgroundColor: p.raised,
          }}
        >
          {preview ? (
            <Image
              source={preview.source}
              contentFit="cover"
              transition={reducedMotion ? 0 : 160}
              style={{ width: "100%", aspectRatio: compact ? 0.9 : 0.82 }}
            />
          ) : (
            <View
              style={{
                aspectRatio: 0.82,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="image-outline" />
            </View>
          )}
          {item.media.length > 1 && (
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                bottom: 10,
                left: 10,
                backgroundColor: "#000000a6",
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 8,
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Icon
                name={
                  item.media.some((media) => media.kind === "video")
                    ? "play-circle-outline"
                    : "layers-outline"
                }
                color="#f4f1e9"
                size={13}
              />
              <Text style={{ color: "#f4f1e9", fontSize: 11, lineHeight: 15 }}>
                {item.media.length} media
              </Text>
            </View>
          )}
        </View>
        <View style={{ gap: 3 }}>
          <Text
            numberOfLines={2}
            style={{
              color: p.ink,
              fontSize: compact ? 13 : 16,
              lineHeight: compact ? 18 : 21,
              fontWeight: "600",
              letterSpacing: -0.35,
            }}
          >
            {item.title}
          </Text>
          <Text
            numberOfLines={1}
            style={{ color: p.soft, fontSize: 12, lineHeight: 18 }}
          >
            {item.style}
          </Text>
        </View>
      </BatikPreviewLink>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          saved ? `Hapus ${item.title} dari tersimpan` : `Simpan ${item.title}`
        }
        accessibilityState={{ selected: saved }}
        onPress={() => toggleSave(item)}
        style={({ pressed }) => ({
          position: "absolute",
          top: 7,
          right: 7,
          width: 44,
          height: 44,
          alignItems: "center",
          justifyContent: "center",
          opacity: pressed ? 0.65 : 1,
        })}
      >
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            backgroundColor: saved ? "#c94e38" : "#f4f1e9",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon
            name={saved ? "bookmark" : "bookmark-outline"}
            color={saved ? "#fff6eb" : "#18201c"}
            size={17}
          />
        </View>
      </Pressable>
    </View>
  );
}
export const styles = StyleSheet.create({
  pad: { paddingHorizontal: 22 },
  gap: { gap: 16 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
});
