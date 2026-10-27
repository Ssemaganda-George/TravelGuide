"use server";

import { authClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function signOut(fd: FormData) {
  const sb = await authClient();
  await sb.auth.signOut();
  revalidatePath("/");
  redirect("/");
}

export async function uploadMedia(fd: FormData) {
  const sb = await authClient();
  const file = fd.get("file") as File;
  const type = String(fd.get("type") ?? "image");
  if (!file) return { error: "No file provided" };

  const ext = file.name.split(".").pop() ?? "bin";
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const bucket = type === "video" ? "videos" : "images";

  const { error, data } = await sb.storage.from(bucket).upload(fileName, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) return { error: error.message };

  const { data: urlData } = sb.storage.from(bucket).getPublicUrl(data.path);
  return { url: urlData.publicUrl, path: data.path };
}
