import { useCallback, useEffect, useRef } from "react";
import { ActionSheetIOS } from "react-native";
import { Stack } from "expo-router";
import type { SearchBarCommands, SearchBarProps } from "react-native-screens";
import type { CatalogChromeProps } from "./catalog-header";
import { useNavigationChrome } from "./tab-chrome";
import { usePalette } from "./ui";
import { feedback } from "../lib/haptics";

/** Restore the native search controller used by the first iPhone build. */
export default function CatalogChrome({
  query,
  onQueryChange,
  detailed,
  onDetailedChange,
}: CatalogChromeProps) {
  const p = usePalette();
  const search = useRef<SearchBarCommands | null>(null);
  const nativeText = useRef("");
  const presenting = useRef(false);
  const { menuOpen, setMenuOpen } = useNavigationChrome();
  const handleChangeText = useCallback<
    NonNullable<SearchBarProps["onChangeText"]>
  >(
    (event) => {
      nativeText.current = event.nativeEvent.text;
      onQueryChange(event.nativeEvent.text);
    },
    [onQueryChange],
  );
  const handleCancel = useCallback(() => {
    nativeText.current = "";
    onQueryChange("");
  }, [onQueryChange]);
  useEffect(() => {
    if (query !== nativeText.current) {
      nativeText.current = query;
      search.current?.setText(query);
    }
  }, [query]);
  useEffect(() => {
    if (!menuOpen || presenting.current) return;
    presenting.current = true;
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: "Tampilan koleksi",
        options: ["Dua kolom · Nyaman", "Tiga kolom · Rapat", "Batal"],
        cancelButtonIndex: 2,
        userInterfaceStyle: "dark",
        tintColor: p.accent,
      },
      (choice) => {
        presenting.current = false;
        setMenuOpen(false);
        if (choice < 2 && detailed !== (choice === 0)) {
          feedback();
          onDetailedChange(choice === 0);
        }
        // Keep UIKit's displayed text aligned after presenting a native sheet.
        search.current?.setText(nativeText.current);
      },
    );
  }, [menuOpen, setMenuOpen, detailed, onDetailedChange, p.accent]);
  return (
    <Stack.SearchBar
      ref={search}
      placeholder="Cari motif, warna, gaya"
      placement="stacked"
      hideWhenScrolling={false}
      hideNavigationBar={false}
      obscureBackground={false}
      autoCapitalize="none"
      tintColor={p.accent}
      textColor={p.ink}
      hintTextColor={p.soft}
      cancelButtonText="Batal"
      onChangeText={handleChangeText}
      onCancelButtonPress={handleCancel}
    />
  );
}
