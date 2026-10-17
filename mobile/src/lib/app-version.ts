import Constants from "expo-constants";

export const appVersion =
  Constants.expoConfig?.extra?.versionLabel ??
  Constants.expoConfig?.version ??
  "0.1.0-alpha.1";
