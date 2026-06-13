import { supabase } from "@/integrations/supabase/client";

const SIGNED_TTL = 60 * 60 * 24 * 365; // 1 year

/** Upload a file to a storage bucket scoped under the user's folder. Returns the object path. */
export async function uploadToBucket(
  bucket: "avatars" | "project-images",
  userId: string,
  file: File,
) {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  return path;
}

/** Returns a long-lived signed URL for displaying the object. */
export async function getSignedUrl(bucket: "avatars" | "project-images", path: string) {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, SIGNED_TTL);
  if (error) throw error;
  return data.signedUrl;
}

/** Upload + return signed display URL in one call. */
export async function uploadAndGetUrl(
  bucket: "avatars" | "project-images",
  userId: string,
  file: File,
) {
  const path = await uploadToBucket(bucket, userId, file);
  const url = await getSignedUrl(bucket, path);
  return { path, url };
}
