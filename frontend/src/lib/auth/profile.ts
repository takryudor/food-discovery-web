import { supabase } from "@/lib/supabase";

const AVATAR_BUCKET = "avatars";
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export function validateAvatarFile(file: File): string | null {
  if (!ALLOWED_AVATAR_TYPES.has(file.type)) {
    return "avatarInvalidType";
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return "avatarTooLarge";
  }
  return null;
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const validationKey = validateAvatarFile(file);
  if (validationKey) {
    const error = new Error(validationKey);
    (error as Error & { i18nKey: string }).i18nKey = validationKey;
    throw error;
  }

  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const filePath = `${userId}/${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(filePath, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    const error = new Error(uploadError.message);
    (error as Error & { i18nKey: string }).i18nKey = "avatarUploadFailed";
    throw error;
  }

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}

export async function updateUserProfile(options: {
  name: string;
  avatarUrl?: string;
}): Promise<void> {
  const { error } = await supabase.auth.updateUser({
    data: {
      full_name: options.name.trim(),
      name: options.name.trim(),
      ...(options.avatarUrl ? { avatar_url: options.avatarUrl } : {}),
    },
  });

  if (error) throw error;
}

export async function changeUserPassword(
  email: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: currentPassword,
  });
  if (signInError) throw signInError;

  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });
  if (updateError) throw updateError;
}
