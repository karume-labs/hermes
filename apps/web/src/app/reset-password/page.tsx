import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AuthLayout } from "@/features/auth/components/auth-layout";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Choose a new password for your Hermes staff account.",
};

const ResetPasswordPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}): Promise<ReactNode> => {
  const { token } = await searchParams;
  return (
    <AuthLayout>
      <ResetPasswordForm token={token ?? ""} />
    </AuthLayout>
  );
};

export default ResetPasswordPage;
