import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AppState, FlatList, Pressable, View } from "react-native";
import { useIsFocused } from "expo-router";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  cancelAnimation,
  Easing,
  type SharedValue,
} from "react-native-reanimated";
import { feedback } from "../lib/haptics";
import { CarouselClock } from "../lib/carousel-clock";
import { Glass, Icon, useAccessibility } from "./ui";
import { useBootReady } from "./boot-entrance";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function PageDot({
  active,
  label,
  onPress,
  progress,
  reducedMotion,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
  progress: SharedValue<number>;
  reducedMotion: boolean;
}) {
  const width = useSharedValue(active ? 32 : 8);
  useEffect(() => {
    width.value = withTiming(active ? 32 : 8, {
      duration: reducedMotion ? 0 : 220,
    });
  }, [active, reducedMotion, width]);
  const style = useAnimatedStyle(() => ({ width: width.value }));
  const hitStyle = useAnimatedStyle(() => ({ width: width.value + 16 }));
  const fillStyle = useAnimatedStyle(() => ({
    width: active ? 32 * (reducedMotion ? 1 : progress.value) : 0,
  }));
  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[
        {
          height: 44,
          alignItems: "center",
          justifyContent: "center",
        },
        hitStyle,
      ]}
    >
      <Animated.View
        style={[
          {
            height: 8,
            borderRadius: 4,
            overflow: "hidden",
            backgroundColor: active ? "#ffffff38" : "#f4f1e9cc",
          },
          style,
        ]}
      >
        <Animated.View
          style={[
            { height: 8, borderRadius: 4, backgroundColor: "#f28b72" },
            fillStyle,
          ]}
        />
      </Animated.View>
    </AnimatedPressable>
  );
}

export default function LoopCarousel<T extends { id: string }>({
  items,
  renderSlide,
  label,
  selectedId,
  onSelect,
  autoplay = true,
  controlsBelow = false,
  initialWidth = 0,
  slideHeight,
}: {
  items: T[];
  renderSlide: (
    item: T,
    index: number,
    width: number,
    active: boolean,
  ) => ReactNode;
  label: (item: T, index: number) => string;
  selectedId?: string;
  onSelect?: (id: string) => void;
  autoplay?: boolean;
  controlsBelow?: boolean;
  initialWidth?: number;
  slideHeight?: number;
}) {
  const focused = useIsFocused();
  const bootReady = useBootReady();
  const { reducedMotion } = useAccessibility();
  const list = useRef<FlatList<T>>(null);
  const [width, setWidth] = useState(initialWidth);
  const previousWidth = useRef(initialWidth);
  const progress = useSharedValue(0);
  const [clock] = useState(() => new CarouselClock());
  const [restart, setRestart] = useState(0);
  const [index, setIndex] = useState(() =>
    Math.max(
      0,
      items.findIndex((item) => item.id === selectedId),
    ),
  );
  const physical = useRef(index + (items.length > 1 ? 1 : 0));
  const selection = useRef(onSelect);
  useEffect(() => {
    selection.current = onSelect;
  }, [onSelect]);
  const [paused, setPaused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [appActive, setAppActive] = useState(
    AppState.currentState !== "background" &&
      AppState.currentState !== "inactive",
  );
  const count = items.length;
  const pages = useMemo(
    () => (count > 1 ? [items[count - 1], ...items, items[0]] : items),
    [items, count],
  );
  const current = Math.min(index, Math.max(0, count - 1));
  const timerPage = useRef(current);
  const timerRestart = useRef(restart);
  const scrollTarget = useRef<number | null>(null);
  const manualSwipe = useRef(false);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  useEffect(() => () => clearTimeout(settleTimer.current), []);
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) =>
      setAppActive(state === "active"),
    );
    return () => subscription.remove();
  }, []);
  useEffect(() => {
    if (width && previousWidth.current !== width)
      list.current?.scrollToOffset({
        offset: (current + (count > 1 ? 1 : 0)) * width,
        animated: false,
      });
    previousWidth.current = width;
    // Keep the same slide on rotation, without interrupting a swipe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width]);
  useEffect(() => {
    if (timerPage.current !== current || timerRestart.current !== restart) {
      clock.reset();
      progress.value = 0;
      timerPage.current = current;
      timerRestart.current = restart;
    }
    if (
      !focused ||
      !bootReady ||
      !autoplay ||
      !appActive ||
      paused ||
      dragging ||
      reducedMotion ||
      count < 2 ||
      !width
    )
      return;
    const remaining = clock.start(() => {
      const next = (current + 1) % count;
      const target = current + 2;
      scrollTarget.current = target;
      physical.current = target;
      list.current?.scrollToOffset({ offset: target * width, animated: true });
      setIndex(next);
      selection.current?.(items[next].id);
    });
    progress.value = 1 - remaining / clock.duration;
    progress.value = withTiming(1, {
      duration: remaining,
      easing: Easing.linear,
    });
    return () => {
      clock.pause();
      cancelAnimation(progress);
    };
  }, [
    focused,
    bootReady,
    autoplay,
    items,
    appActive,
    paused,
    dragging,
    reducedMotion,
    count,
    width,
    current,
    progress,
    restart,
    clock,
  ]);
  function goTo(position: number, notify = true) {
    const next = ((position % count) + count) % count;
    if (!count || !width) return;
    if (notify) feedback();
    clock.reset();
    clearTimeout(settleTimer.current);
    manualSwipe.current = false;
    setDragging(false);
    cancelAnimation(progress);
    const direction = position < 0 ? -1 : position >= count ? 1 : 0;
    const target =
      count > 1
        ? direction < 0
          ? 0
          : direction > 0
            ? count + 1
            : next + 1
        : 0;
    scrollTarget.current = target;
    physical.current = target;
    progress.set(0);
    setRestart((value) => value + 1);
    setIndex(next);
    if (notify) selection.current?.(items[next].id);
    list.current?.scrollToOffset({
      offset: target * width,
      animated: !reducedMotion,
    });
    if (reducedMotion) settle(target * width);
  }
  useEffect(() => {
    const next = items.findIndex((item) => item.id === selectedId);
    if (next < 0 || next === current) return;
    // Apply controlled thumbnail changes after native layout has committed.
    const frame = requestAnimationFrame(() => goTo(next, false));
    return () => cancelAnimationFrame(frame);
    // External thumbnail selections; internal swipes already report their selection.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);
  function settle(offset: number) {
    if (!width || !count) return;
    const page = Math.max(
      0,
      Math.min(pages.length - 1, Math.round(offset / width)),
    );
    if (scrollTarget.current !== null && page !== scrollTarget.current) return;
    const next = count > 1 ? (page - 1 + count) % count : 0;
    physical.current = next + (count > 1 ? 1 : 0);
    if (count > 1 && (page === 0 || page === count + 1)) {
      list.current?.scrollToOffset({
        offset: physical.current * width,
        animated: false,
      });
      setRestart((value) => value + 1);
    }
    clearTimeout(settleTimer.current);
    scrollTarget.current = null;
    if (manualSwipe.current) {
      clock.reset();
      cancelAnimation(progress);
      progress.set(0);
      setRestart((value) => value + 1);
    }
    manualSwipe.current = false;
    setIndex(next);
    selection.current?.(items[next].id);
    setDragging(false);
  }
  if (!count) return null;
  return (
    <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      {width > 0 && (
        <FlatList
          ref={list}
          horizontal
          style={slideHeight ? { height: slideHeight } : undefined}
          removeClippedSubviews={false}
          pagingEnabled
          data={pages}
          initialScrollIndex={physical.current}
          initialNumToRender={Math.min(pages.length, 5)}
          showsHorizontalScrollIndicator={false}
          bounces={false}
          keyExtractor={(item, position) => `${position}-${item.id}`}
          extraData={width}
          getItemLayout={(_, position) => ({
            length: width,
            offset: width * position,
            index: position,
          })}
          onScrollBeginDrag={() => {
            clearTimeout(settleTimer.current);
            manualSwipe.current = true;
            scrollTarget.current = null;
            setDragging(true);
          }}
          onTouchStart={() => setDragging(true)}
          onTouchEnd={() => {
            if (!manualSwipe.current) setDragging(false);
          }}
          onTouchCancel={() => {
            if (!manualSwipe.current) setDragging(false);
          }}
          onScrollEndDrag={(event) => {
            // Keep autoplay paused throughout momentum, not only while the finger is down.
            const target =
              event.nativeEvent.targetContentOffset?.x ??
              event.nativeEvent.contentOffset.x;
            clearTimeout(settleTimer.current);
            settleTimer.current = setTimeout(() => settle(target), 700);
          }}
          onMomentumScrollEnd={(event) =>
            settle(event.nativeEvent.contentOffset.x)
          }
          renderItem={({ item, index: position }) => {
            const logical = count > 1 ? (position - 1 + count) % count : 0;
            const active = current === logical && position === physical.current;
            return (
              <View
                accessibilityElementsHidden={!active}
                importantForAccessibility={
                  active ? "auto" : "no-hide-descendants"
                }
                aria-hidden={!active}
                style={{ width }}
              >
                {renderSlide(item, logical, width, active)}
              </View>
            );
          }}
        />
      )}
      {count > 1 && (
        <View
          style={{
            position: controlsBelow ? "relative" : "absolute",
            bottom: controlsBelow ? undefined : 12,
            left: controlsBelow ? undefined : 16,
            right: controlsBelow ? undefined : 16,
            marginTop: controlsBelow ? 12 : 0,
            alignItems: "center",
          }}
        >
          <Glass
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 4,
              borderRadius: 24,
              backgroundColor: "#00000066",
            }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Sorotan sebelumnya"
              onPress={() => goTo(current - 1)}
              style={{
                width: 44,
                height: 44,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="chevron-back" size={17} color="#f4f1e9" />
            </Pressable>
            {items.map((item, position) => (
              <PageDot
                key={item.id}
                active={current === position}
                progress={progress}
                reducedMotion={reducedMotion}
                label={label(item, position)}
                onPress={() => goTo(position)}
              />
            ))}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Sorotan berikutnya"
              onPress={() => goTo(current + 1)}
              style={{
                width: 44,
                height: 44,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="chevron-forward" size={17} color="#f4f1e9" />
            </Pressable>
            {!reducedMotion && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  paused ? "Putar slide otomatis" : "Jeda slide otomatis"
                }
                onPress={() => {
                  feedback();
                  if (!paused) {
                    clock.pause();
                    cancelAnimation(progress);
                  }
                  setPaused((value) => !value);
                }}
                style={{
                  width: 44,
                  height: 44,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon
                  name={paused ? "play" : "pause"}
                  size={13}
                  color="#f4f1e9"
                />
              </Pressable>
            )}
          </Glass>
        </View>
      )}
    </View>
  );
}
