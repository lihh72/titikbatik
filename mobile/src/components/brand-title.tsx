import { Image } from "expo-image";
import { Platform, Text, View } from "react-native";
export default function BrandTitle() {
  return (
    <View
      accessibilityLabel="TitikBatik"
      style={{ flexDirection: "row", alignItems: "center", gap: 7 }}
    >
      <Image
        source={require("../../assets/logo.png")}
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          backgroundColor: "#f4f1e9",
        }}
        contentFit="contain"
      />
      <Text
        allowFontScaling={false}
        style={{
          fontFamily: Platform.OS === "android" ? "serif" : "Georgia",
          color: "#f4f1e9",
          fontSize: 22,
          fontWeight: "700",
          letterSpacing: -1,
        }}
      >
        Titik
        <Text style={{ color: "#f28b72", fontStyle: "italic" }}>Batik</Text>
      </Text>
    </View>
  );
}
