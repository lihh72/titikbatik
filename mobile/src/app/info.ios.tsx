import { appVersion } from "../lib/app-version";
import {
  Button,
  Form,
  Host,
  HStack,
  Picker,
  Section,
  Spacer,
  Text,
  TextField,
  useNativeState,
} from "@expo/ui/swift-ui";
import {
  autocorrectionDisabled,
  disabled,
  keyboardType,
  pickerStyle,
  tag,
  textInputAutocapitalization,
} from "@expo/ui/swift-ui/modifiers";
import { router, Stack } from "expo-router";
import { feedback } from "../lib/haptics";
import { useState } from "react";
import { Alert } from "react-native";
import { useApp } from "../state/app";
import { usePalette } from "../components/ui";
import type { Mode } from "../lib/types";

export default function NativeSettings() {
  const { settings, changeSettings, preferences } = useApp();
  const p = usePalette();
  const [mode, setMode] = useState<Mode>(settings.mode);
  const server = useNativeState(settings.baseUrl);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function save() {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      await changeSettings({ mode, baseUrl: server.get().trim() });
      feedback("success");
      router.replace("/");
    } catch (reason) {
      feedback("error");
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
    <>
      <Stack.Screen
        options={{ title: "Pengaturan", headerTransparent: false }}
      />
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button
          icon="xmark"
          accessibilityLabel="Tutup tanpa menyimpan"
          onPress={() => {
            feedback();
            router.back();
          }}
        />
      </Stack.Toolbar>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          icon="checkmark"
          variant="done"
          disabled={saving}
          accessibilityLabel="Simpan pengaturan"
          onPress={() => void save()}
        />
      </Stack.Toolbar>
      <Host style={{ flex: 1 }} colorScheme="dark" seedColor={p.accent}>
        <Form>
          <Section
            title="Koleksi"
            footer={
              <Text>
                Demo tersedia tanpa server. Pilih backend untuk mengakses
                koleksi dan asisten AI milikmu.
              </Text>
            }
          >
            <Picker
              label="Sumber data"
              selection={mode}
              onSelectionChange={(value) => {
                feedback();
                setMode(value);
              }}
              modifiers={[pickerStyle("menu"), disabled(saving)]}
            >
              <Text modifiers={[tag("demo")]}>Demo offline</Text>
              <Text modifiers={[tag("backend")]}>Backend asli</Text>
            </Picker>
          </Section>
          <Section
            title="Alamat server"
            footer={
              <Text>
                Gunakan alamat Next.js yang dapat diakses iPhone, misalnya
                http://192.168.1.10:3000. localhost menunjuk ke iPhone ini.
              </Text>
            }
          >
            <TextField
              text={server}
              placeholder="https://server.titikbatik.id"
              maxLength={2048}
              modifiers={[
                keyboardType("url"),
                textInputAutocapitalization("never"),
                autocorrectionDisabled(),
                disabled(saving),
              ]}
            />
          </Section>
          {error && (
            <Section title="Belum tersimpan">
              <Text>{error}</Text>
            </Section>
          )}
          <Section
            title="Di perangkat ini"
            footer={
              <Text>
                Tersimpan dan riwayat asisten dipisahkan untuk setiap sumber
                data.
              </Text>
            }
          >
            <HStack>
              <Text>Motif tersimpan</Text>
              <Spacer />
              <Text>{String(preferences.saved.length)}</Text>
            </HStack>
            <HStack>
              <Text>Motif disukai</Text>
              <Spacer />
              <Text>{String(preferences.liked.length)}</Text>
            </HStack>
          </Section>
          <Section title="Bantuan">
            <Button
              label="Menjelajahi motif"
              systemImage="photo.on.rectangle"
              onPress={() =>
                Alert.alert(
                  "Menjelajahi motif",
                  "Ketuk gambar untuk membuka detail, costume, dan video. Tekan lama motif untuk melihat preview serta menu simpan dan sukai.",
                )
              }
            />
            <Button
              label="Menyimpan dan berbagi"
              systemImage="square.and.arrow.up"
              onPress={() =>
                Alert.alert(
                  "Menyimpan dan berbagi",
                  "Simpan motif dari menu tekan-lama atau halaman detail. Tombol bagikan pada detail membuka share sheet iOS untuk media yang sedang dipilih.",
                )
              }
            />
            <Button
              label="Asisten batik"
              systemImage="bubble.left.and.bubble.right"
              onPress={() =>
                Alert.alert(
                  "Asisten batik",
                  "Mode backend mendukung jawaban AI dan lampiran foto. Mode demo memakai respons simulasi lokal.",
                )
              }
            />
          </Section>
          <Section
            footer={
              <Text>TitikBatik · katalog motif digital dan penerapannya.</Text>
            }
          >
            <Text>{`Versi ${appVersion}`}</Text>
          </Section>
        </Form>
      </Host>
    </>
  );
}
