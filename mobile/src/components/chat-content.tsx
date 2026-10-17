import { memo } from "react";
import { Linking, Text, View } from "react-native";
import { Copy, usePalette } from "./ui";

// Native text rendering for the Markdown structures returned by the existing assistant.
export const ChatContent = memo(function ChatContent({
  content,
}: {
  content: string;
}) {
  const p = usePalette();
  return (
    <View style={{ gap: 8 }}>
      {content.split("\n").map((line, index) => {
        const heading = line.match(/^#{1,6}\s+(.+)/);
        const bullet = line.match(/^\s*[-*]\s+(.+)/);
        const text = heading?.[1] ?? bullet?.[1] ?? line;
        return (
          <Copy
            key={index}
            style={{
              fontWeight: heading ? "700" : "400",
              fontSize: heading ? 18 : 16,
            }}
          >
            {bullet ? "• " : ""}
            {text
              .split(/(\*\*[^*]+\*\*|\[[^\]]+\]\(https?:\/\/[^)]+\))/g)
              .map((part, i) => {
                const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
                if (link)
                  return (
                    <Text
                      key={i}
                      accessibilityRole="link"
                      style={{
                        color: p.accent,
                        textDecorationLine: "underline",
                      }}
                      onPress={() => {
                        void Linking.openURL(link[2]).catch(() => {});
                      }}
                    >
                      {link[1]}
                    </Text>
                  );
                return (
                  <Text
                    key={i}
                    style={{
                      fontWeight: part.startsWith("**") ? "600" : undefined,
                    }}
                  >
                    {part.startsWith("**") ? part.slice(2, -2) : part}
                  </Text>
                );
              })}
          </Copy>
        );
      })}
    </View>
  );
});
