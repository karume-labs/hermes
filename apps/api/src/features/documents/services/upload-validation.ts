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

const startsWith = (bytes: Uint8Array, signature: number[]): boolean =>
  signature.every((byte, index) => bytes[index] === byte);

const ascii = (bytes: Uint8Array, start: number, end: number): string =>
  new TextDecoder("ascii").decode(bytes.subarray(start, end));

// The client-declared MIME type selects the extension and is also the type the
// browser later renders, so verify the bytes actually match before storing.
export const contentMatches = (
  mimeType: string,
  bytes: Uint8Array,
): boolean => {
  switch (mimeType) {
    case "application/pdf":
      return ascii(bytes, 0, 5) === "%PDF-";
    case "image/png":
      return startsWith(
        bytes,
        [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
      );
    case "image/jpeg":
      return startsWith(bytes, [0xff, 0xd8, 0xff]);
    case "image/webp":
      return ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 12) === "WEBP";
    case "text/plain":
      return !bytes.includes(0);
    default:
      return false;
  }
};

/** Checks size, type and magic bytes; returns the extension to store under. */
export const assertUploadable = async (file: File): Promise<string> => {
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
  const header = new Uint8Array(await file.slice(0, 64).arrayBuffer());
  if (!contentMatches(file.type, header)) {
    throw new UnprocessableError(
      "The file contents do not match the declared file type.",
    );
  }
  return extension;
};
