import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AuthLayout } from "@/features/auth/components/auth-layout";
import { SignUpForm } from "@/features/auth/components/sign-up-form";

export const metadata: Metadata = {
  title: "Create account",
  description:
    "Create a Hermes Care staff account for the care loop dashboard.",
};

const SignUpPage = (): ReactNode => (
  <AuthLayout>
    <SignUpForm />
  </AuthLayout>
);

export default SignUpPage;
