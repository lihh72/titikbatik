export type HeaderMode = "catalog" | "saved" | "assistant" | "detail";
export type HeaderIcon =
  | "ellipsis"
  | "xmark"
  | "gearshape"
  | "trash"
  | "bookmark"
  | "bookmark.fill"
  | "square.and.arrow.up";
type Actions = { primary: () => void; secondary?: () => void };
type State = {
  menuOpen?: boolean;
  disabled?: boolean;
  saved?: boolean;
  loading?: boolean;
};

function button(
  identifier: string,
  label: string,
  name: HeaderIcon,
  onPress: () => void,
  disabled = false,
  selected = false,
) {
  return {
    type: "button" as const,
    identifier,
    label,
    accessibilityLabel: label,
    icon: { type: "sfSymbol" as const, name },
    onPress,
    disabled,
    selected,
    sharesBackground: true,
    hidesSharedBackground: false,
    tintColor: "#f4f1e9",
  };
}
/** Stable action slots; the header animates their contents without remounting the controls. */
export function headerButtons(
  mode: HeaderMode,
  actions: Actions,
  state: State = {},
) {
  const primary = button(
    "titikbatik.primary-action",
    mode === "detail"
      ? "Bagikan media"
      : mode === "assistant"
        ? "Hapus riwayat"
        : "Pengaturan",
    mode === "detail"
      ? "square.and.arrow.up"
      : mode === "assistant"
        ? "trash"
        : "gearshape",
    actions.primary,
    state.disabled || state.loading,
  );
  if (mode === "saved" || mode === "assistant") return [primary];
  const secondary = button(
    "titikbatik.secondary-action",
    mode === "detail"
      ? state.saved
        ? "Hapus dari tersimpan"
        : "Simpan motif"
      : "Pilihan tampilan",
    mode === "detail"
      ? state.saved
        ? "bookmark.fill"
        : "bookmark"
      : state.menuOpen
        ? "xmark"
        : "ellipsis",
    actions.secondary ?? (() => {}),
    state.loading,
    mode === "detail" && !!state.saved,
  );
  return [secondary, primary];
}
