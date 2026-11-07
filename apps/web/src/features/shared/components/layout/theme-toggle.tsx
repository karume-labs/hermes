"use client";

import { ActionIcon, Tooltip, useMantineColorScheme } from "@mantine/core";
import { IconMoon, IconSun } from "@tabler/icons-react";
import type { ReactNode } from "react";

export const ThemeToggle = (): ReactNode => {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";
  const label = isDark ? "Switch to light theme" : "Switch to dark theme";

  return (
    <Tooltip label={label} withArrow position="bottom">
      <ActionIcon
        variant="subtle"
        color="ink"
        size="lg"
        aria-label={label}
        onClick={() => setColorScheme(isDark ? "light" : "dark")}
      >
        {isDark ? (
          <IconSun size={20} stroke={1.5} />
        ) : (
          <IconMoon size={20} stroke={1.5} />
        )}
      </ActionIcon>
    </Tooltip>
  );
};
