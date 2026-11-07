import { findCase } from "@api/features/care-loop/services/case-repository";
import { NotFoundError } from "@api/features/shared/errors/index";
import { Type } from "@sinclair/typebox";

export const authHeader = Type.Object({
  authorization: Type.Optional(Type.String()),
  cookie: Type.Optional(Type.String()),
});

export const idParams = Type.Object({ id: Type.String({ minLength: 1 }) });

export const at = (value: string | undefined): Date =>
  value === undefined ? new Date() : new Date(value);

export const findOrThrow = async (id: string, clinicId: string | null) => {
  const found = await findCase(id, clinicId);
  if (found === null) throw new NotFoundError("Case not found");
  return found;
};
