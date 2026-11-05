import { typeboxResolver } from "@hookform/resolvers/typebox";
import "@hermes/validators";

/**
 * Every TypeBox-backed form uses this resolver. Importing the validators
 * package installs the friendly error copy before validation runs, so raw
 * schema/regex text never reaches a field.
 */
export const friendlyTypeboxResolver = typeboxResolver;

/** First server error message, for a form-level alert. */
export const errorMessage = (error: unknown): string => {
  if (error === null || typeof error !== "object")
    return "Something went wrong.";
  if ("message" in error && typeof error.message === "string") {
    return error.message;
  }
  if ("value" in error) return errorMessage(error.value);
  return "Something went wrong. Try again.";
};
