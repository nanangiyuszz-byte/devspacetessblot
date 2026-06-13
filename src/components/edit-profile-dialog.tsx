import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { uploadAndGetUrl } from "@/lib/storage";

const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username minimal 3 karakter")
  .max(20, "Username maksimal 20 karakter")
  .regex(/^[a-z0-9_]+$/, "Hanya huruf kecil, angka, dan underscore");

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  profile: {
    username?: string | null;
    bio?: string | null;
    avatar_url?: string | null;
  } | null;
  onSaved: (next: { username: string; bio: string; avatar_url: string | null }) => void;
};

export function EditProfileDialog({ open, onOpenChange, userId, profile, onSaved }: Props) {
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      setUsername(profile?.username || "");
      setBio(profile?.bio || "");
      setAvatarUrl(profile?.avatar_url || null);
    }
  }, [open, profile]);

  async function handleAvatarPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran gambar maksimal 5MB.");
      return;
    }
    setUploading(true);
    try {
      const { url } = await uploadAndGetUrl("avatars", userId, file);
      setAvatarUrl(url);
      toast.success("Avatar siap disimpan.");
    } catch {
      toast.error("Gagal mengunggah avatar.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;

    const parsed = usernameSchema.safeParse(username);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    const cleanUsername = parsed.data.toLowerCase();
    const cleanBio = (bio || "").trim().slice(0, 280);

    setSaving(true);
    try {
      if (cleanUsername !== (profile?.username || "")) {
        const { data: exists } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", cleanUsername)
          .neq("id", userId)
          .maybeSingle();
        if (exists) {
          toast.error("Username sudah dipakai.");
          setSaving(false);
          return;
        }
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          username: cleanUsername,
          bio: cleanBio,
          avatar_url: avatarUrl,
        })
        .eq("id", userId);

      if (error) {
        toast.error("Gagal menyimpan perubahan.");
        setSaving(false);
        return;
      }

      toast.success("Profil berhasil diperbarui.");
      onSaved({ username: cleanUsername, bio: cleanBio, avatar_url: avatarUrl });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong max-w-md border-border/60 sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display">Edit Profil</DialogTitle>
          <DialogDescription>Perbarui username, bio, dan foto profilmu.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-accent ring-2 ring-primary/30">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center text-base font-bold uppercase">
                  {(username || "DS").slice(0, 2)}
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 grid place-items-center bg-black/60">
                  <Loader2 className="animate-spin" size={18} />
                </div>
              )}
            </div>
            <div className="flex-1">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-1.5 rounded-full glass px-3 py-1.5 text-xs font-semibold hover:border-primary/40 disabled:opacity-60"
              >
                <Camera size={13} /> Ganti foto
              </button>
              <p className="mt-1.5 text-[11px] text-muted-foreground">JPG / PNG · maks 5MB</p>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handleAvatarPick}
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Username
            </label>
            <div className="flex items-center rounded-xl border border-input bg-background/60 px-3 focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/20">
              <span className="text-sm text-muted-foreground">@</span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder="usernamekamu"
                className="w-full bg-transparent px-1.5 py-2.5 text-sm outline-none"
                maxLength={20}
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={280}
              rows={3}
              placeholder="Ceritakan tentang dirimu..."
              className="w-full resize-none rounded-xl border border-input bg-background/60 px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground/60 focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
            />
            <p className="mt-1 text-right text-[11px] text-muted-foreground">
              {bio.length}/280
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-full glass px-4 py-2 text-xs font-semibold hover:border-border"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving || uploading}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-[0_0_18px_-4px_oklch(0.65_0.21_255_/_0.7)] hover:bg-primary/90 disabled:opacity-60"
            >
              {saving ? <Loader2 className="animate-spin" size={13} /> : <Save size={13} />}
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
