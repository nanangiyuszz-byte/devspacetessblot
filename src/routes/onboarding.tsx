import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Code2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Buat username — DevSpace" }] }),
  component: Onboarding,
});

const usernameSchema = z
  .string()
  .trim()
  .min(3, "Minimal 3 karakter")
  .max(20, "Maksimal 20 karakter")
  .regex(/^[a-z0-9_]+$/, "Hanya huruf kecil, angka, dan underscore");

function Onboarding() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        navigate({ to: "/auth", replace: true });
        return;
      }
      setUserId(data.user.id);
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", data.user.id)
        .maybeSingle();
      if (profile?.username) {
        navigate({ to: "/explore", replace: true });
        return;
      }
      setChecking(false);
    })();
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    const parsed = usernameSchema.safeParse(username);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    const uname = parsed.data.toLowerCase();

    // Check uniqueness
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", uname)
      .maybeSingle();
    if (existing) {
      toast.error("Username sudah dipakai. Coba yang lain.");
      setSubmitting(false);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ username: uname })
      .eq("id", userId);

    if (error) {
      toast.error("Gagal menyimpan username.");
      setSubmitting(false);
      return;
    }
    toast.success("Selamat datang di DevSpace!");
    navigate({ to: "/explore", replace: true });
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Memuat...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-5">
      <div className="glass animate-float-in w-full max-w-md rounded-3xl p-8 sm:p-10">
        <div className="mb-7 flex flex-col items-center text-center">
          <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-[0_0_30px_oklch(0.65_0.21_255_/_0.6)]">
            <Code2 size={26} />
          </div>
          <h1 className="text-2xl font-bold">Buat username kamu</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Username ini akan jadi identitasmu di DevSpace. Pilih dengan teliti.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Username
            </label>
            <div className="flex items-center rounded-xl border border-input bg-background/60 px-3 focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/20">
              <span className="text-sm text-muted-foreground">@</span>
              <input
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder="usernamekamu"
                className="w-full bg-transparent px-1.5 py-3 text-sm outline-none placeholder:text-muted-foreground/60"
                maxLength={20}
              />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              3–20 karakter · huruf kecil, angka, dan underscore.
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-[0_0_24px_-6px_oklch(0.65_0.21_255_/_0.7)] hover:bg-primary/90 disabled:opacity-60"
          >
            {submitting ? "Menyimpan..." : "Lanjut"}
          </button>
        </form>
      </div>
    </div>
  );
}
