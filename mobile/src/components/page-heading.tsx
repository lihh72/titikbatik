import { View } from "react-native";
import { Copy } from "./ui";

/** Regular scroll content: never hide a heading during tab focus changes. */
export default function PageHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={{ gap: 8 }}>
      <Copy
        accessibilityRole="header"
        style={{
          fontSize: 32,
          lineHeight: 38,
          fontWeight: "600",
          letterSpacing: -0.65,
        }}
      >
        {title}
      </Copy>
      {subtitle && (
        <Copy muted style={{ fontSize: 15 }}>
          {subtitle}
        </Copy>
      )}
    </View>
  );
}
