import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { env } from "@api/features/shared/env/index";
import { UnprocessableError } from "@api/features/shared/errors/index";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

// The extension is derived from the MIME type, never from the client filename,
// so a crafted name cannot escape the upload directory.
const EXTENSIONS: Record<string, string> = {
  "application/pdf": ".pdf",
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "text/plain": ".txt",
};

export const uploadsDirectory = (): string =>
  join(process.cwd(), env.UPLOAD_DIR);

export const ensureUploadsDirectory = async (): Promise<void> => {
  await mkdir(uploadsDirectory(), { recursive: true });
};

export const storeUpload = async (
  file: File,
): Promise<{ storedName: string; sizeBytes: number }> => {
  const extension = EXTENSIONS[file.type];
  if (extension === undefined) {
    throw new UnprocessableError(
      "Upload a PDF, PNG, JPEG, WebP or plain-text file.",
    );
  }
  if (file.size === 0) throw new UnprocessableError("The file is empty.");
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new UnprocessableError("Files must be 10 MB or smaller.");
  }

  await ensureUploadsDirectory();
  const storedName = `${randomUUID()}${extension}`;
  await Bun.write(join(uploadsDirectory(), storedName), file);
  return { storedName, sizeBytes: file.size };
};

export const readUpload = (storedName: string) =>
  Bun.file(join(uploadsDirectory(), storedName));
