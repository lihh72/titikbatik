import { useEffect, useRef, useState } from "react";
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
import type { Batik } from "../lib/types";
import { feedback } from "../lib/haptics";
import { CarouselClock } from "../lib/carousel-clock";
import CatalogIntro from "./catalog-intro";
import { Icon, useAccessibility, usePalette } from "./ui";

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
  const width = useSharedValue(active ? 40 : 8);
  useEffect(() => {
    width.value = withTiming(active ? 40 : 8, {
      duration: reducedMotion ? 0 : 220,
    });
  }, [active, reducedMotion, width]);
  const style = useAnimatedStyle(() => ({ width: width.value }));
  const fillStyle = useAnimatedStyle(() => ({
    width: active ? 40 * (reducedMotion ? 1 : progress.value) : 0,
  }));
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={{
        minWidth: 48,
        height: 44,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Animated.View
        style={[
          {
            height: 8,
            borderRadius: 4,
            overflow: "hidden",
            backgroundColor: "#333333",
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
    </Pressable>
  );
}

export default function CatalogCarousel({ items }: { items: Batik[] }) {
  const p = usePalette();
  const focused = useIsFocused();
  const { reducedMotion } = useAccessibility();
  const list = useRef<FlatList<Batik>>(null);
  const [width, setWidth] = useState(0);
  const progress = useSharedValue(0);
  const [clock] = useState(() => new CarouselClock());
  const [restart, setRestart] = useState(0);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [appActive, setAppActive] = useState(
    AppState.currentState !== "background" &&
      AppState.currentState !== "inactive",
  );
  const count = items.length;
  const current = Math.min(index, Math.max(0, count - 1));
  const timerPage = useRef(current);
  const timerRestart = useRef(restart);
  const scrollTarget = useRef<number | null>(null);
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) =>
      setAppActive(state === "active"),
    );
    return () => subscription.remove();
  }, []);
  useEffect(() => {
    if (width)
      list.current?.scrollToOffset({
        offset: current * width,
        animated: false,
      });
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
      scrollTarget.current = next;
      list.current?.scrollToOffset({ offset: next * width, animated: true });
      setIndex(next);
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
  if (!count) return null;
  return (
    <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      {width > 0 && (
        <FlatList
          ref={list}
          horizontal
          pagingEnabled
          data={items}
          showsHorizontalScrollIndicator={false}
          bounces={false}
          keyExtractor={(item) => item.id}
          extraData={width}
          getItemLayout={(_, position) => ({
            length: width,
            offset: width * position,
            index: position,
          })}
          onScrollBeginDrag={() => {
            scrollTarget.current = null;
            setDragging(true);
          }}
          onTouchStart={() => setDragging(true)}
          onTouchEnd={() => setDragging(false)}
          onTouchCancel={() => setDragging(false)}
          onScrollEndDrag={() => setDragging(false)}
          onMomentumScrollEnd={(event) => {
            const settled = Math.max(
              0,
              Math.min(
                count - 1,
                Math.round(event.nativeEvent.contentOffset.x / width),
              ),
            );
            if (
              scrollTarget.current !== null &&
              settled !== scrollTarget.current
            )
              return;
            scrollTarget.current = null;
            setIndex(settled);
            setDragging(false);
          }}
          renderItem={({ item, index: position }) => (
            <View
              accessibilityElementsHidden={current !== position}
              importantForAccessibility={
                current === position ? "auto" : "no-hide-descendants"
              }
              aria-hidden={current !== position}
              style={{ width }}
            >
              <CatalogIntro item={item} variant={position} />
            </View>
          )}
        />
      )}
      {count > 1 && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            marginTop: 2,
          }}
        >
          {items.map((item, position) => (
            <PageDot
              key={item.id}
              active={current === position}
              progress={progress}
              reducedMotion={reducedMotion}
              label={`Sorotan ${position + 1} dari ${count}: ${item.title}`}
              onPress={() => {
                feedback();
                scrollTarget.current = position;
                progress.value = 0;
                setRestart((value) => value + 1);
                setIndex(position);
                list.current?.scrollToOffset({
                  offset: position * width,
                  animated: !reducedMotion,
                });
              }}
            />
          ))}
          {!reducedMotion && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                paused ? "Putar slide otomatis" : "Jeda slide otomatis"
              }
              onPress={() => {
                feedback();
                setPaused((value) => !value);
              }}
              style={{
                position: "absolute",
                right: 16,
                width: 44,
                height: 44,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name={paused ? "play" : "pause"} size={13} color={p.soft} />
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}
