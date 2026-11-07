import { router } from "expo-router";
import {
  CalendarCheck,
  CalendarDays,
  HeartPulse,
  type LucideIcon,
  ShieldCheck,
} from "lucide-react-native";
import { useRef, useState } from "react";
import {
  FlatList,
  type ListRenderItem,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { markOnboardingDone } from "@/lib/onboarding";

type Slide = {
  id: string;
  icon: LucideIcon;
  title: string;
  body: string;
};

const SLIDES: Slide[] = [
  {
    id: "welcome",
    icon: HeartPulse,
    title: "Care, close to home",
    body: "Hermes Care keeps your visits, results and messages with your clinic in one place.",
  },
  {
    id: "visits",
    icon: CalendarDays,
    title: "Book in a few taps",
    body: "Pick a time that suits you. Reschedule or cancel from the Visits tab whenever plans change.",
  },
  {
    id: "privacy",
    icon: ShieldCheck,
    title: "Your results, privately",
    body: "Results are shared only with your care team and are never used for marketing.",
  },
  {
    id: "start",
    icon: CalendarCheck,
    title: "You're all set",
    body: "Check your journey any time. We'll let you know when there's something new to read.",
  },
];

const OnboardingScreen = () => {
  const { width } = useWindowDimensions();
  const listRef = useRef<FlatList<Slide>>(null);
  const [index, setIndex] = useState(0);
  const isLast = index === SLIDES.length - 1;

  const finish = async () => {
    await markOnboardingDone();
    router.replace("/");
  };

  const goTo = (next: number) => {
    listRef.current?.scrollToIndex({ index: next, animated: true });
    setIndex(next);
  };

  const onMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(event.nativeEvent.contentOffset.x / width));
  };

  const renderSlide: ListRenderItem<Slide> = ({ item }) => (
    <View style={{ width }} className="flex-1 items-center justify-center px-8">
      <View className="mb-10 size-32 items-center justify-center rounded-[40px] bg-primary/15">
        <Icon as={item.icon} className="size-14 text-primary" />
      </View>
      <Text className="text-center text-3xl font-extrabold">{item.title}</Text>
      <Text className="mt-4 text-center text-base leading-6 text-muted-foreground">
        {item.body}
      </Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      <View className="flex-row justify-end px-6 pt-2" style={{ height: 48 }}>
        {isLast ? null : (
          <Button
            variant="ghost"
            onPress={finish}
            accessibilityLabel="Skip intro"
          >
            <Text className="text-muted-foreground">Skip</Text>
          </Button>
        )}
      </View>

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumEnd}
        getItemLayout={(_, i) => ({
          length: width,
          offset: width * i,
          index: i,
        })}
        className="flex-1"
      />

      <View className="px-6 pb-6 pt-4">
        <View className="mb-6 flex-row items-center justify-center gap-2">
          {SLIDES.map((slide, i) => (
            <View
              key={slide.id}
              className={
                i === index
                  ? "h-2 w-6 rounded-full bg-primary"
                  : "size-2 rounded-full bg-border"
              }
            />
          ))}
        </View>
        <Button
          size="lg"
          className="w-full"
          onPress={isLast ? finish : () => goTo(index + 1)}
        >
          <Text className="text-base font-bold text-primary-foreground">
            {isLast ? "Get started" : "Next"}
          </Text>
        </Button>
      </View>
    </SafeAreaView>
  );
};

export default OnboardingScreen;
