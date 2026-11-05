import { FormatRegistry, type TSchema } from "@sinclair/typebox";
import {
  DefaultErrorFunction,
  SetErrorFunction,
} from "@sinclair/typebox/errors";

// Elysia registers its own formats, but `TypeCheck` (used by the shared
// react-hook-form resolver) throws on an unregistered format. Register the
// ones our contracts use so both runtimes agree.
FormatRegistry.Set("email", (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
);

const FALLBACK_MESSAGE = "Please check this field and try again.";

const TECHNICAL_MESSAGE_PATTERN =
  /(\bexpected\b|must match|regular expression|schema|pattern|union value|unknown error type)/i;

let installed = false;

/**
 * TypeBox's stock messages are developer-facing (raw email regex, "Expected
 * union"). Prefer a schema's own `error` copy and hide anything technical
 * behind a human fallback, for API envelopes and form fields alike.
 */
export const installFriendlyTypeBoxErrors = (): void => {
  if (installed) return;
  installed = true;

  SetErrorFunction((error) => {
    const schema = error.schema as TSchema & { error?: unknown };
    if (typeof schema.error === "string" && schema.error.trim().length > 0) {
      return schema.error;
    }

    const message = DefaultErrorFunction(error);
    return TECHNICAL_MESSAGE_PATTERN.test(message) ? FALLBACK_MESSAGE : message;
  });
};

installFriendlyTypeBoxErrors();
