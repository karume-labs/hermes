import "@mantine/core/styles.css";
import "@fontsource-variable/inter";
import "@fontsource/montserrat/500.css";
import "@fontsource/montserrat/600.css";
import "@fontsource/montserrat/700.css";
import "@fontsource/montserrat/800.css";
import { ColorSchemeScript, mantineHtmlProps } from "@mantine/core";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Providers } from "@/features/shared/providers/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Hermes Care Loop",
    template: "%s · Hermes Care",
  },
  description: "Screening to sign-off: patient loop closure for clinics.",
};

interface RootLayoutProps {
  children: ReactNode;
}

const RootLayout = ({ children }: RootLayoutProps): ReactNode => (
  <html lang="en" {...mantineHtmlProps}>
    <head>
      <ColorSchemeScript defaultColorScheme="light" />
    </head>
    <body>
      <Providers>{children}</Providers>
    </body>
  </html>
);

export default RootLayout;
