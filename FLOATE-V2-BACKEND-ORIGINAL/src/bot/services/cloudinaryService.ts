import { createHash, randomUUID } from "node:crypto";

type CloudinaryUploadOptions = {
  folder: string;
  publicId?: string;
  mimeType?: string;
};

export async function uploadImageToCloudinary(
  buffer: Buffer | Uint8Array,
  { folder, publicId = randomUUID(), mimeType = "image/jpeg" }: CloudinaryUploadOptions
): Promise<string> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.");
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = createHash("sha1")
    .update(`folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`)
    .digest("hex");
  const extension = mimeType === "image/png"
    ? "png"
    : mimeType === "image/webp"
    ? "webp"
    : mimeType === "image/heic" || mimeType === "image/heif"
    ? "heic"
    : "jpg";
  const form = new FormData();
  form.append("file", new Blob([Uint8Array.from(buffer)], { type: mimeType }), `${publicId}.${extension}`);
  form.append("api_key", apiKey);
  form.append("timestamp", timestamp);
  form.append("folder", folder);
  form.append("public_id", publicId);
  form.append("signature", signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`, {
    method: "POST",
    body: form,
    signal: AbortSignal.timeout(30_000),
  });
  const result = await response.json().catch(() => ({})) as {
    secure_url?: string;
    error?: { message?: string };
  };
  if (!response.ok || !result.secure_url) {
    throw new Error(result.error?.message || `Cloudinary image upload failed (HTTP ${response.status}).`);
  }
  return result.secure_url;
}
