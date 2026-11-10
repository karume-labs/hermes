import { ChevronRight } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, View } from "react-native";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

interface ListSectionProps {
  title?: string;
  footer?: string;
  children: ReactNode;
}

/** Inset grouped list, the shape phones use for settings and record rows. */
export const ListSection = ({ title, footer, children }: ListSectionProps) => (
  <View className="gap-2">
    {title === undefined ? null : (
      <Text className="px-5 text-[12px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
        {title}
      </Text>
    )}
    <View className="mx-4 overflow-hidden rounded-[16px] border border-border/80 bg-card">
      {children}
    </View>
    {footer === undefined ? null : (
      <Text className="px-5 text-[12px] leading-[17px] text-muted-foreground">
        {footer}
      </Text>
    )}
  </View>
);

interface ListRowProps {
  title: string;
  subtitle?: string;
  value?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  chevron?: boolean;
  tone?: "default" | "danger";
  first?: boolean;
  disabled?: boolean;
  onPress?: () => void;
}

export const ListRow = ({
  title,
  subtitle,
  value,
  leading,
  trailing,
  chevron = false,
  tone = "default",
  first = false,
  disabled = false,
  onPress,
}: ListRowProps) => (
  <Pressable
    accessibilityRole={onPress === undefined ? undefined : "button"}
    android_ripple={{ color: "rgba(148,163,184,0.14)" }}
    disabled={disabled || onPress === undefined}
    onPress={onPress}
    className={cn(
      "min-h-[58px] flex-row items-center gap-3 bg-card px-4 py-3",
      first ? null : "border-t border-border/70",
      onPress === undefined ? null : "active:bg-secondary/60",
      disabled ? "opacity-50" : null,
    )}
  >
    {leading}
    <View className="flex-1 gap-0.5">
      <Text
        className={cn(
          "text-[16px] font-medium leading-[21px]",
          tone === "danger" ? "text-destructive" : null,
        )}
        numberOfLines={2}
      >
        {title}
      </Text>
      {subtitle === undefined ? null : (
        <Text
          className="text-[13px] leading-[18px] text-muted-foreground"
          numberOfLines={2}
        >
          {subtitle}
        </Text>
      )}
    </View>
    {value === undefined ? null : (
      <Text className="text-[14px] text-muted-foreground">{value}</Text>
    )}
    {trailing}
    {chevron ? (
      <Icon as={ChevronRight} className="size-[18px] text-muted-foreground" />
    ) : null}
  </Pressable>
);

const TILE: Record<"spark" | "info" | "muted" | "success" | "urgent", string> =
  {
    spark: "bg-primary/15",
    info: "bg-accent",
    muted: "bg-secondary",
    success: "bg-success-fill",
    urgent: "bg-urgent-fill",
  };

interface IconTileProps {
  tone?: "spark" | "info" | "muted" | "success" | "urgent";
  children: ReactNode;
}

export const IconTile = ({ tone = "muted", children }: IconTileProps) => (
  <View
    className={cn(
      "size-9 items-center justify-center rounded-[11px]",
      TILE[tone],
    )}
  >
    {children}
  </View>
);
