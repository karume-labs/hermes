import { useRouter } from "expo-router";
import { View } from "react-native";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";

const NotFoundScreen = () => {
  const router = useRouter();

  return (
    <View className="flex-1 justify-center gap-3 bg-background px-6">
      <Text className="text-[11px] font-bold uppercase tracking-[1.2px] text-muted-foreground">
        Hermes Care
      </Text>
      <Text className="text-[24px] font-bold leading-[30px] text-foreground">
        We could not find that screen
      </Text>
      <Text className="text-[15px] leading-[22px] text-muted-foreground">
        The link may be out of date. Your results, bookings and messages are
        still in your care loop.
      </Text>
      <View className="mt-3">
        <Button size="lg" onPress={() => router.replace("/")}>
          <Text>Back to my care loop</Text>
        </Button>
      </View>
    </View>
  );
};

export default NotFoundScreen;
