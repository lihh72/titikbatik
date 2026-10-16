import { Redirect } from "expo-router";
// Preserve existing links while the catalogue now lives at the app root.
export default function CollectionRedirect() {
  return <Redirect href="/" />;
}
