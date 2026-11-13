import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { env } from "@api/features/shared/env/index";

export const uploadsDirectory = (): string =>
  join(process.cwd(), env.UPLOAD_DIR);

export const ensureUploadsDirectory = async (): Promise<void> => {
  await mkdir(uploadsDirectory(), { recursive: true });
};

export const writeLocal = async (
  storedName: string,
  file: File,
): Promise<void> => {
  await ensureUploadsDirectory();
  await Bun.write(join(uploadsDirectory(), storedName), file);
};

export const readLocal = (storedName: string) =>
  Bun.file(join(uploadsDirectory(), storedName));
