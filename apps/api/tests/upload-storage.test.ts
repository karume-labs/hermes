import { describe, expect, test } from "bun:test";
import { unlink } from "node:fs/promises";
import { join } from "node:path";
import { uploadsDirectory } from "@api/features/documents/services/local-storage";
import {
  readUpload,
  storeUpload,
} from "@api/features/documents/services/storage";
import {
  contentMatches,
  MAX_UPLOAD_BYTES,
} from "@api/features/documents/services/upload-validation";

const PDF_BYTES = new Uint8Array([
  0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37, 0x0a, 0x25, 0xe2, 0xe3,
]);

const pdf = (bytes: Uint8Array = PDF_BYTES) =>
  new File([bytes], "report.pdf", { type: "application/pdf" });

describe("attachment validation", () => {
  test("magic bytes identify the declared type", () => {
    expect(contentMatches("application/pdf", PDF_BYTES)).toBe(true);
    expect(contentMatches("image/png", PDF_BYTES)).toBe(false);
    expect(contentMatches("text/plain", new TextEncoder().encode("note"))).toBe(
      true,
    );
    expect(contentMatches("text/plain", new Uint8Array([0x00, 0x01]))).toBe(
      false,
    );
  });

  test("a disguised file is refused", async () => {
    const disguised = new File(
      [new TextEncoder().encode("not a pdf")],
      "x.pdf",
      {
        type: "application/pdf",
      },
    );
    await expect(storeUpload(disguised)).rejects.toThrow(
      "do not match the declared file type",
    );
  });

  test("unknown types, empty files and oversized files are refused", async () => {
    const zip = new File([PDF_BYTES], "a.zip", { type: "application/zip" });
    await expect(storeUpload(zip)).rejects.toThrow("PDF, PNG, JPEG, WebP");
    await expect(storeUpload(pdf(new Uint8Array()))).rejects.toThrow("empty");
    const big = pdf(new Uint8Array(MAX_UPLOAD_BYTES + 1));
    await expect(storeUpload(big)).rejects.toThrow("10 MB or smaller");
  });
});

describe("local storage driver", () => {
  test("a valid file round-trips with its content type", async () => {
    const stored = await storeUpload(pdf());
    expect(stored.storedName.endsWith(".pdf")).toBe(true);
    expect(stored.sizeBytes).toBe(PDF_BYTES.byteLength);

    const response = await readUpload(stored.storedName, {
      "content-type": "application/pdf",
    });
    expect(response.headers.get("content-type")).toBe("application/pdf");
    const bytes = new Uint8Array(await response.arrayBuffer());
    expect(bytes.byteLength).toBe(PDF_BYTES.byteLength);
    expect(new TextDecoder().decode(bytes.subarray(0, 5))).toBe("%PDF-");

    await unlink(join(uploadsDirectory(), stored.storedName));
  });
});
