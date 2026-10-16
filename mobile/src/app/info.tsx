import { router, Stack } from "expo-router";
import { useState, type ReactNode } from "react";
import { Alert, Pressable, ScrollView, TextInput, View } from "react-native";
import { Copy, Icon, Screen, usePalette } from "../components/ui";
import { useApp } from "../state/app";

export default function Settings() {
  const p = usePalette();
  const { settings, changeSettings } = useApp();
  const [mode, setMode] = useState(settings.mode);
  const [url, setUrl] = useState(settings.baseUrl);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function save() {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      await changeSettings({ mode, baseUrl: url.trim() });
      router.replace("/");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Pengaturan belum tersimpan.",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <Screen top={false}>
      <Stack.Screen
        options={{
          title: "Pengaturan",
          headerRight: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Simpan pengaturan"
              disabled={saving}
              onPress={() => void save()}
              style={{ padding: 12, minHeight: 44 }}
            >
              <Copy style={{ color: p.accent, fontWeight: "600" }}>
                Selesai
              </Copy>
            </Pressable>
          ),
          headerLeft: () => (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.back()}
              style={{ padding: 12, minHeight: 44 }}
            >
              <Copy style={{ color: p.accent }}>Batal</Copy>
            </Pressable>
          ),
        }}
      />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 20, gap: 28, paddingBottom: 40 }}
      >
        <SettingsSection
          title="SUMBER KOLEKSI"
          footer="Demo tersedia offline. Backend memakai layanan TitikBatik yang kamu jalankan."
        >
          {(["demo", "backend"] as const).map((value) => (
            <Pressable
              key={value}
              accessibilityRole="radio"
              accessibilityState={{ checked: mode === value }}
              aria-checked={mode === value}
              onPress={() => setMode(value)}
              style={{
                padding: 14,
                minHeight: 48,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottomWidth: value === "demo" ? 0.5 : 0,
                borderColor: p.line,
              }}
            >
              <Copy>{value === "demo" ? "Demo offline" : "Backend asli"}</Copy>
              {mode === value && (
                <Icon name="checkmark" color={p.accent} size={21} />
              )}
            </Pressable>
          ))}
        </SettingsSection>
        <SettingsSection
          title="ALAMAT SERVER"
          footer="Gunakan alamat Next.js yang bisa diakses iPhone. localhost menunjuk ke iPhone itu sendiri."
        >
          <TextInput
            accessibilityLabel="Alamat server"
            value={url}
            onChangeText={setUrl}
            placeholder="https://server.titikbatik.id"
            placeholderTextColor={p.soft}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            style={{ padding: 14, minHeight: 48, fontSize: 17, color: p.ink }}
          />
        </SettingsSection>
        {error && <Copy style={{ color: p.accent }}>{error}</Copy>}
        <SettingsSection title="BANTUAN">
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              Alert.alert(
                "Menjelajahi motif",
                "Ketuk motif untuk membuka detail. Geser untuk melihat costume dan video. Simpan melalui tombol bookmark pada detail.",
              )
            }
            style={{ padding: 14, minHeight: 48 }}
          >
            <Copy style={{ color: p.accent }}>
              Menjelajahi dan menyimpan motif
            </Copy>
          </Pressable>
        </SettingsSection>
        <Copy muted style={{ textAlign: "center", fontSize: 13 }}>
          TitikBatik · Versi 1.0
        </Copy>
      </ScrollView>
    </Screen>
  );
}
function SettingsSection({
  title,
  footer,
  children,
}: {
  title: string;
  footer?: string;
  children: ReactNode;
}) {
  const p = usePalette();
  return (
    <View style={{ gap: 8 }}>
      <Copy muted style={{ fontSize: 12, paddingHorizontal: 14 }}>
        {title}
      </Copy>
      <View
        style={{
          borderRadius: 10,
          overflow: "hidden",
          backgroundColor: p.raised,
        }}
      >
        {children}
      </View>
      {footer && (
        <Copy
          muted
          style={{ fontSize: 13, lineHeight: 18, paddingHorizontal: 14 }}
        >
          {footer}
        </Copy>
      )}
    </View>
  );
}
