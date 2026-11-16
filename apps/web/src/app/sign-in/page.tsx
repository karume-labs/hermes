// The form reads the session before it renders, so opt out of instant
// navigation validation like the dashboard pages behind the same gate.
export const instant = false;

import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AuthLayout } from "@/features/auth/components/auth-layout";
import { SignInForm } from "@/features/auth/components/sign-in-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Staff sign-in for the Hermes care dashboard.",
};

const SignInPage = (): ReactNode => (
  <AuthLayout>
    <SignInForm />
  </AuthLayout>
);

export default SignInPage;
