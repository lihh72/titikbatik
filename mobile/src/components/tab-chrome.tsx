import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useSegments } from "expo-router";
import { useSharedValue, type SharedValue } from "react-native-reanimated";
import type { HeaderMode } from "../lib/header-buttons";

type DetailState = { saved: boolean; disabled: boolean; loading: boolean };
type DetailActions = { primary: () => void; secondary: () => void };

type NavigationChrome = {
  catalogScroll: SharedValue<number>;
  setReturning: (returning: boolean) => void;
  tab: "catalog" | "saved" | "assistant";
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  clearDisabled: boolean;
  clearChat: () => void;
  registerClear: (action: () => void, disabled: boolean) => () => void;
  page: HeaderMode;
  fromPage: HeaderMode;
  detail: DetailState;
  shareDetail: () => void;
  saveDetail: () => void;
  registerDetail: (actions: DetailActions, state: DetailState) => () => void;
};
const NavigationContext = createContext<NavigationChrome | null>(null);
export const HeightContext = createContext(0);
export function useNavigationChrome() {
  const value = useContext(NavigationContext);
  if (!value) throw new Error("NavigationChromeProvider is required");
  return value;
}
export function useTabChrome() {
  return { ...useNavigationChrome(), height: useContext(HeightContext) };
}
export function useChatHeaderAction(action: () => void, disabled: boolean) {
  const { registerClear } = useNavigationChrome();
  useEffect(
    () => registerClear(action, disabled),
    [action, disabled, registerClear],
  );
}
export function useDetailHeaderAction(
  actions: DetailActions,
  state: DetailState,
  enabled = true,
) {
  const { registerDetail } = useNavigationChrome();
  const { primary, secondary } = actions;
  const { saved, disabled, loading } = state;
  useEffect(
    () =>
      enabled
        ? registerDetail({ primary, secondary }, { saved, disabled, loading })
        : undefined,
    [registerDetail, primary, secondary, saved, disabled, loading, enabled],
  );
}
export function NavigationChromeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const segments = useSegments();
  const [returning, setReturning] = useState(false);
  const catalogScroll = useSharedValue(0);
  const currentTab = segments.some((segment) => segment === "(assistant)")
    ? "assistant"
    : segments.some((segment) => segment === "(saved)")
      ? "saved"
      : segments.some((segment) => segment === "(catalog)")
        ? "catalog"
        : null;
  const [lastTab, setLastTab] = useState<NavigationChrome["tab"]>(
    currentTab ?? "catalog",
  );
  if (currentTab && currentTab !== lastTab) setLastTab(currentTab);
  const observedPage: HeaderMode | null = segments.some(
    (segment) => segment === "batik",
  )
    ? "detail"
    : currentTab;
  if (returning && observedPage && observedPage !== "detail")
    setReturning(false);
  const [pages, setPages] = useState({
    current: observedPage ?? lastTab,
    previous: observedPage ?? lastTab,
  });
  const targetPage =
    returning && observedPage === "detail"
      ? lastTab
      : (observedPage ?? pages.current);
  if (targetPage !== pages.current)
    setPages({ current: targetPage, previous: pages.current });
  const [menuOpen, setMenuOpen] = useState(false);
  const clearAction = useRef<(() => void) | null>(null);
  const [clearDisabled, setClearDisabled] = useState(true);
  const registerClear = useCallback((action: () => void, disabled: boolean) => {
    clearAction.current = action;
    setClearDisabled(disabled);
    return () => {
      if (clearAction.current === action) clearAction.current = null;
    };
  }, []);
  const clearChat = useCallback(() => clearAction.current?.(), []);
  const detailActions = useRef<DetailActions | null>(null);
  const [detail, setDetail] = useState<DetailState>({
    saved: false,
    disabled: true,
    loading: true,
  });
  const registerDetail = useCallback(
    (actions: DetailActions, state: DetailState) => {
      detailActions.current = actions;
      setDetail((current) =>
        current.saved === state.saved &&
        current.disabled === state.disabled &&
        current.loading === state.loading
          ? current
          : state,
      );
      return () => {
        if (detailActions.current === actions) detailActions.current = null;
      };
    },
    [],
  );
  const shareDetail = useCallback(() => detailActions.current?.primary(), []);
  const saveDetail = useCallback(() => detailActions.current?.secondary(), []);
  const value = useMemo(
    () => ({
      catalogScroll,
      setReturning,
      tab: currentTab ?? lastTab,
      menuOpen,
      setMenuOpen,
      clearDisabled,
      clearChat,
      registerClear,
      page: targetPage,
      fromPage: pages.previous,
      detail,
      shareDetail,
      saveDetail,
      registerDetail,
    }),
    [
      catalogScroll,
      currentTab,
      lastTab,
      menuOpen,
      clearDisabled,
      clearChat,
      registerClear,
      targetPage,
      pages.previous,
      detail,
      shareDetail,
      saveDetail,
      registerDetail,
    ],
  );
  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}
