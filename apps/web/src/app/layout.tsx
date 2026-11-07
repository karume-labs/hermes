import "@mantine/core/styles.css";
import "@fontsource-variable/plus-jakarta-sans";
import { ColorSchemeScript, mantineHtmlProps } from "@mantine/core";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Providers } from "@/features/shared/providers/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Hermes Care",
    template: "%s · Hermes Care",
  },
  description:
    "Screening to sign-off for clinics, with the patient in the loop.",
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
