import Animated from "react-native-reanimated";
import { useHeaderScroll } from "../../../components/header-scroll";
import PageHeading from "../../../components/page-heading";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { router, Stack, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  type ScrollViewInstance,
  TextInput,
  View,
} from "react-native";
import {
  useTabChrome,
  useChatHeaderAction,
} from "../../../components/tab-chrome";
import { ChatContent } from "../../../components/chat-content";
import {
  Button,
  Copy,
  Glass,
  IconButton,
  Screen,
  Title,
  usePalette,
} from "../../../components/ui";
import { cardSlug } from "../../../lib/api";
import { feedback } from "../../../lib/haptics";
import { streamChat } from "../../../lib/chat";
import { demoBatiks, searchDemo } from "../../../lib/demo";
import type { Attachment, Message } from "../../../lib/types";
import { useCatalog, useChat } from "../../../state/app";

const suggestions = [
  "Tampilkan koleksi terbaru",
  "Cari motif geometris",
  "Jelaskan Batik #9",
];
const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;
export default function Assistant() {
  const p = usePalette();
  const { settings } = useCatalog();
  const { messages, setPreferences } = useChat();
  const { height: headerHeight } = useTabChrome();
  const [input, setInput] = useState("");
  const [image, setImage] = useState<Attachment | null>(null);
  const [busy, setBusy] = useState(false);
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const request = useRef<AbortController | null>(null);
  const [retry, setRetry] = useState<{
    history: Message[];
    image: Attachment | null;
  } | null>(null);
  const scroll = useRef<ScrollViewInstance>(null);
  const nearBottom = useRef(true);
  const updateScrollPosition = useCallback(
    (offset: number, size: number, viewport: number) => {
      nearBottom.current = size - offset - viewport < 120;
    },
    [],
  );
  const headerScroll = useHeaderScroll(updateScrollPosition);
  const update = useCallback(
    (id: string, apply: (message: Message) => Message) =>
      setPreferences((current) => ({
        ...current,
        messages: current.messages.map((message) =>
          message.id === id ? apply(message) : message,
        ),
      })),
    [setPreferences],
  );
  useFocusEffect(
    useCallback(
      () => () => {
        request.current?.abort();
      },
      [],
    ),
  );
  useEffect(() => () => request.current?.abort(), []);
  async function send(history: Message[], attachment: Attachment | null) {
    if (request.current) return;
    feedback("light");
    const controller = new AbortController();
    request.current = controller;
    const assistantId = newId();
    const assistant: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
    };
    setRetry({ history, image: attachment });
    setBusy(true);
    setError(null);
    setInput("");
    setImage(null);
    nearBottom.current = true;
    setPreferences((current) => ({
      ...current,
      messages: [...history, assistant],
    }));
    const timer = setTimeout(
      () =>
        controller.abort(new Error("Waktu tunggu chatbot habis. Coba lagi.")),
      90000,
    );
    try {
      if (settings.mode === "demo") {
        const query = history[history.length - 1].content;
        const reference = query.match(/#\s*(\d+)/)?.[1];
        const keywords = query
          .replace(
            /\b(cari|motif|tampilkan|koleksi|terbaru|jelaskan|batik)\b/gi,
            "",
          )
          .trim();
        const found = reference
          ? demoBatiks.filter((item) => item.slug === reference)
          : searchDemo(demoBatiks, keywords, 1, 3).items;
        const items = found.length ? found : demoBatiks.slice(0, 3);
        update(assistantId, (message) => ({
          ...message,
          content: `**Simulasi demo**\n${found.length ? "Berikut pilihan dari koleksi lokal." : "Sebagai contoh, jelajahi karya lokal berikut."}\n\n${items.map((item) => `• ${item.title}: ${item.style.toLowerCase()}, palet ${item.color.toLowerCase()}.`).join("\n")}\n\nBuka karya untuk melihat motif dan penerapannya. Jawaban ini disusun lokal; tidak menggunakan AI atau menganalisis gambar.`,
          demoSlugs: items.map((item) => item.slug),
        }));
      } else {
        await streamChat(
          settings.baseUrl,
          history,
          attachment,
          controller.signal,
          (token) =>
            update(assistantId, (message) => ({
              ...message,
              content: message.content + token,
            })),
          (card) =>
            update(assistantId, (message) => ({
              ...message,
              cards: [...(message.cards ?? []), card].slice(0, 3),
            })),
        );
      }
      setRetry(null);
      feedback("success");
    } catch (reason) {
      if (!controller.signal.aborted) feedback("error");
      update(assistantId, (message) => ({ ...message, interrupted: true }));
      const message = controller.signal.aborted
        ? controller.signal.reason instanceof Error &&
          controller.signal.reason.name !== "AbortError"
          ? controller.signal.reason.message
          : "Jawaban dihentikan. Kamu bisa mencoba lagi."
        : reason instanceof Error
          ? reason.message
          : "Chatbot gagal menjawab.";
      setError(message);
    } finally {
      clearTimeout(timer);
      request.current = null;
      setBusy(false);
    }
  }
  function submit(text = input) {
    const value = text.trim();
    if (!value || busy) return;
    if (value.length > 2000) {
      setError("Pesan maksimal 2.000 karakter.");
      return;
    }
    const user: Message = {
      id: newId(),
      role: "user",
      content: value,
      attachmentName: image?.name,
    };
    void send([...messages.filter((m) => !m.interrupted), user], image);
  }
  async function pickImage() {
    if (busy || picking) return;
    setPicking(true);
    setError(null);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.85,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (
        asset.mimeType &&
        ![
          "image/jpeg",
          "image/png",
          "image/webp",
          "image/gif",
          "image/heic",
          "image/heif",
        ].includes(asset.mimeType)
      )
        throw new Error("Pilih file gambar JPEG, PNG, WebP, GIF, atau HEIC.");
      const context = ImageManipulator.manipulate(asset.uri);
      if (Math.max(asset.width, asset.height) > 1600)
        context.resize(
          asset.width >= asset.height ? { width: 1600 } : { height: 1600 },
        );
      const rendered = await context.renderAsync();
      const converted = await rendered.saveAsync({
        format: SaveFormat.JPEG,
        compress: 0.82,
        base64: true,
      });
      if (!converted.base64 || converted.base64.length * 0.75 > 5 * 1024 * 1024)
        throw new Error("Ukuran gambar setelah kompresi harus di bawah 5 MB.");
      setImage({
        dataUrl: `data:image/jpeg;base64,${converted.base64}`,
        mimeType: "image/jpeg",
        name: `${asset.fileName?.replace(/\.[^.]+$/, "") ?? "gambar"}.jpg`,
      });
      feedback("success");
    } catch (reason) {
      feedback("error");
      setError(
        reason instanceof Error ? reason.message : "Gambar tidak dapat dibaca.",
      );
    } finally {
      setPicking(false);
    }
  }
  const clear = useCallback(() => {
    Alert.alert(
      "Hapus riwayat?",
      "Percakapan pada mode ini akan dihapus dari perangkat.",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: () => {
            feedback("light");
            setRetry(null);
            setError(null);
            setPreferences((current) => ({ ...current, messages: [] }));
          },
        },
      ],
    );
  }, [setPreferences]);
  useChatHeaderAction(clear, busy);
  return (
    <Screen top={false}>
      <Stack.Screen
        options={{ title: "Asisten", headerShown: Platform.OS === "ios" }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
        style={{ flex: 1 }}
      >
        <Animated.ScrollView
          contentInsetAdjustmentBehavior={
            Platform.OS === "ios" ? "automatic" : "never"
          }
          ref={scroll}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: Platform.OS === "ios" ? 0 : headerHeight,
            paddingBottom: 16,
            gap: 22,
          }}
          onScroll={headerScroll.onScroll}
          scrollEventThrottle={16}
          onContentSizeChange={() => {
            if (nearBottom.current && messages.length > 0)
              scroll.current?.scrollToEnd({ animated: false });
          }}
        >
          <PageHeading
            title="Asisten"
            subtitle="Temukan motif lewat percakapan."
          />
          {!messages.length && (
            <View style={{ gap: 16, paddingTop: 4, paddingBottom: 20 }}>
              <Title>Cari di koleksi</Title>
              {suggestions.map((text) => (
                <Button
                  key={text}
                  label={text}
                  secondary
                  onPress={() => submit(text)}
                />
              ))}
            </View>
          )}
          {messages.map((message) => (
            <View
              key={message.id}
              style={{
                alignSelf: message.role === "user" ? "flex-end" : "stretch",
                backgroundColor:
                  message.role === "user" ? p.tint : "transparent",
                borderRadius: 18,
                padding: message.role === "user" ? 16 : 0,
                maxWidth: message.role === "user" ? "92%" : "100%",
                gap: 12,
              }}
            >
              <Copy muted style={{ fontSize: 12, fontWeight: "600" }}>
                {message.role === "user"
                  ? "Kamu"
                  : settings.mode === "demo"
                    ? "TitikBatik · simulasi"
                    : "TitikBatik"}
              </Copy>
              {message.attachmentName && (
                <Copy muted style={{ fontSize: 13 }}>
                  Lampiran: {message.attachmentName}
                </Copy>
              )}
              <ChatContent
                content={
                  message.content ||
                  (message.interrupted
                    ? "Jawaban belum tersedia."
                    : "Sedang merangkai jawaban…")
                }
              />
              {message.interrupted && (
                <Copy style={{ fontSize: 12, color: p.accent }}>
                  Jawaban terhenti
                </Copy>
              )}
              {message.cards?.map((card) => (
                <Pressable
                  key={card.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Lihat ${card.title}`}
                  onPress={() => {
                    try {
                      router.push({
                        pathname: "/batik/[slug]",
                        params: { slug: cardSlug(card.detailUrl) },
                      });
                    } catch {
                      setError("Tautan karya tidak valid.");
                    }
                  }}
                  style={{
                    backgroundColor: p.raised,
                    borderRadius: 14,
                    overflow: "hidden",
                  }}
                >
                  <Image
                    source={card.previewUrl}
                    style={{ height: 160, width: "100%" }}
                    contentFit="cover"
                  />
                  <Copy style={{ padding: 14, fontWeight: "600" }}>
                    {card.title}
                  </Copy>
                </Pressable>
              ))}
              {message.demoSlugs?.map((slug) => {
                const item = demoBatiks.find((value) => value.slug === slug);
                return item ? (
                  <Pressable
                    key={slug}
                    accessibilityRole="button"
                    accessibilityLabel={`Lihat ${item.title}`}
                    onPress={() =>
                      router.push({
                        pathname: "/batik/[slug]",
                        params: { slug },
                      })
                    }
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                      padding: 10,
                      backgroundColor: p.raised,
                      borderRadius: 14,
                    }}
                  >
                    <Image
                      source={item.media[0].source}
                      style={{ width: 64, height: 70, borderRadius: 8 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Copy style={{ fontWeight: "600" }}>{item.title}</Copy>
                      <Copy muted style={{ fontSize: 13 }}>
                        Lihat karya →
                      </Copy>
                    </View>
                  </Pressable>
                ) : null;
              })}
            </View>
          ))}
        </Animated.ScrollView>
        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: 12,
            gap: 10,
          }}
        >
          {error && (
            <View style={{ gap: 8 }}>
              <Copy style={{ color: p.accent, fontSize: 13 }}>{error}</Copy>
              {!busy && retry && (
                <Button
                  label="Coba kirim lagi"
                  secondary
                  onPress={() => void send(retry.history, retry.image)}
                />
              )}
            </View>
          )}
          {image && (
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <Image
                source={image.dataUrl}
                style={{ width: 44, height: 44, borderRadius: 8 }}
              />
              <Copy muted style={{ flex: 1, fontSize: 13 }}>
                {image.name}
              </Copy>
              <IconButton
                name="close"
                label="Hapus lampiran"
                onPress={() => setImage(null)}
              />
            </View>
          )}
          <Glass
            style={{ flexDirection: "row", alignItems: "flex-end", padding: 4 }}
          >
            {settings.mode === "backend" && !busy && (
              <IconButton
                name="add"
                label={picking ? "Memproses gambar" : "Lampirkan gambar"}
                onPress={() => void pickImage()}
              />
            )}
            <TextInput
              accessibilityLabel="Pesan untuk asisten"
              value={input}
              onChangeText={setInput}
              placeholder={
                busy ? "Menunggu jawaban…" : "Tanyakan tentang batik…"
              }
              placeholderTextColor={p.soft}
              multiline
              maxLength={2000}
              editable={!busy}
              style={{
                flex: 1,
                minHeight: 48,
                maxHeight: 130,
                color: p.ink,
                fontSize: 16,
                paddingVertical: 13,
                paddingHorizontal: 12,
              }}
            />
            <IconButton
              name={busy ? "stop-circle-outline" : "arrow-up-circle"}
              label={busy ? "Hentikan jawaban" : "Kirim pesan"}
              onPress={() => {
                if (busy) request.current?.abort();
                else if (!picking) submit();
              }}
            />
          </Glass>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
