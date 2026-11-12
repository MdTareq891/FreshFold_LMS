/**
 * Uploads a file directly to Cloudinary using an unsigned upload preset.
 * This keeps the backend simple (no API secret needed there) and works
 * entirely within Cloudinary's free tier (25GB storage/bandwidth, no card).
 *
 * Requires two env vars on the frontend:
 *   VITE_CLOUDINARY_CLOUD_NAME
 *   VITE_CLOUDINARY_UPLOAD_PRESET (unsigned preset, see DEPLOYMENT.md)
 */
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export const cloudinaryConfigured = Boolean(CLOUD_NAME && UPLOAD_PRESET);

export async function uploadToCloudinary(file) {
  if (!cloudinaryConfigured) {
    throw new Error("Cloudinary is not configured (missing VITE_CLOUDINARY_CLOUD_NAME / VITE_CLOUDINARY_UPLOAD_PRESET)");
  }
  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", UPLOAD_PRESET);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || "Photo upload failed");
  }
  const data = await res.json();
  return data.secure_url;
}
