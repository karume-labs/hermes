import { env } from "@api/features/shared/env/index";
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const client = (): S3Client =>
  new S3Client({
    region: env.S3_REGION,
    ...(env.S3_ENDPOINT === "" ? {} : { endpoint: env.S3_ENDPOINT }),
    forcePathStyle: env.S3_FORCE_PATH_STYLE,
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY_ID,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    },
  });

export const writeS3 = async (
  storedName: string,
  file: File,
): Promise<void> => {
  const client_ = client();
  await client_.send(
    new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: storedName,
      Body: new Uint8Array(await file.arrayBuffer()),
      ContentType: file.type,
      // Attachments are private: the API streams them after an access check.
      ACL: "private",
    }),
  );
  client_.destroy();
};

export const readS3 = async (storedName: string): Promise<ArrayBuffer> => {
  const client_ = client();
  try {
    const object = await client_.send(
      new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: storedName }),
    );
    if (object.Body === undefined) throw new Error("Object has no body");
    const bytes = await object.Body.transformToByteArray();
    // Copy into a plain ArrayBuffer so the response body type is exact.
    const buffer = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(buffer).set(bytes);
    return buffer;
  } finally {
    client_.destroy();
  }
};
