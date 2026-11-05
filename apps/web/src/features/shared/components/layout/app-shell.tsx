"use client";

import {
  AppShell,
  AppShellHeader,
  AppShellMain,
  AppShellNavbar,
  Burger,
  Center,
  Group,
  Loader,
  NavLink,
  ScrollArea,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconActivityHeartbeat,
  IconLayoutDashboard,
  IconRoute,
  IconSend,
  IconStethoscope,
  IconWebhook,
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { authClient } from "@/features/auth/services/client";
import { UserMenu } from "@/features/shared/components/layout/user-menu";

type NavItem = {
  label: string;
  href: string;
  icon: ReactNode;
  adminOnly?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Queue", href: "/queue", icon: <IconStethoscope size={20} /> },
  {
    label: "Governance",
    href: "/admin",
    icon: <IconLayoutDashboard size={20} />,
    adminOnly: true,
  },
  {
    label: "Delivery",
    href: "/admin/delivery",
    icon: <IconSend size={20} />,
    adminOnly: true,
  },
  {
    label: "Webhook log",
    href: "/admin/webhooks",
    icon: <IconWebhook size={20} />,
    adminOnly: true,
  },
  {
    label: "Routing",
    href: "/admin/routing",
    icon: <IconRoute size={20} />,
    adminOnly: true,
  },
];

interface AppShellLayoutProps {
  children: ReactNode;
}

export const AppShellLayout = ({ children }: AppShellLayoutProps) => {
  const [mobileOpened, { toggle: toggleMobile, close: closeMobile }] =
    useDisclosure(false);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const user = session === null ? null : session.user;

  // proxy.ts already blocks signed-out traffic; this covers client-side
  // navigation and expired sessions without a server fetch in the layout.
  useEffect(() => {
    if (!isPending && session === null) router.replace("/sign-in");
  }, [isPending, session, router]);

  if (user === null) {
    return (
      <Center mih="100vh">
        <Loader size="sm" />
      </Center>
    );
  }

  const items = NAV_ITEMS.filter(
    (item) => item.adminOnly !== true || user.role === "admin",
  );

  return (
    <AppShell
      layout="alt"
      header={{ height: 64 }}
      navbar={{
        width: 248,
        breakpoint: "sm",
        collapsed: { mobile: !mobileOpened },
      }}
      padding="lg"
      bg="var(--mantine-color-gray-0)"
    >
      <AppShellHeader withBorder={false} px="md" bg="teal.9">
        <Group h="100%" justify="space-between">
          <Group gap="xs">
            <Burger
              opened={mobileOpened}
              onClick={toggleMobile}
              hiddenFrom="sm"
              color="white"
              size="sm"
            />
            <IconActivityHeartbeat size={24} color="white" />
            <Title order={4} c="white">
              Hermes Care
            </Title>
          </Group>
          <UserMenu user={user} />
        </Group>
      </AppShellHeader>

      <AppShellNavbar p="md" bg="white">
        <Stack gap={4}>
          <Text
            size="xs"
            fw={700}
            c="dimmed"
            tt="uppercase"
            lts="0.08em"
            px="sm"
          >
            {user.role === "admin" ? "Administration" : "Coordinator"}
          </Text>
          <ScrollArea>
            {items.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/queue" && pathname.startsWith(item.href));
              return (
                <NavLink
                  key={item.href}
                  component={Link}
                  href={item.href}
                  label={item.label}
                  leftSection={item.icon}
                  active={active}
                  onClick={closeMobile}
                  variant="light"
                  color="teal"
                  fw={600}
                  style={{ borderRadius: 8, height: 42 }}
                />
              );
            })}
          </ScrollArea>
        </Stack>
      </AppShellNavbar>

      <AppShellMain>{children}</AppShellMain>
    </AppShell>
  );
};
