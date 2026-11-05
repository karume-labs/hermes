"use client";

import { Alert, Button } from "@mantine/core";
import { IconBrandGoogleFilled } from "@tabler/icons-react";
import type { ReactNode } from "react";
import { useGoogleSignIn } from "@/features/auth/services/mutations";
import { errorMessage } from "@/features/shared/utils/form-errors";

export const GoogleButton = (): ReactNode => {
  const google = useGoogleSignIn();
  return (
    <>
      <Button
        variant="default"
        fullWidth
        leftSection={<IconBrandGoogleFilled size={16} />}
        loading={google.isPending}
        onClick={() => google.mutate()}
      >
        Continue with Google
      </Button>
      {google.isError ? (
        <Alert color="red" mt="xs" p="xs">
          {errorMessage(google.error)}
        </Alert>
      ) : null}
    </>
  );
};
