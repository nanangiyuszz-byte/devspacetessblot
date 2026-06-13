import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Code2, ArrowLeft, Mail, Lock } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Masuk — DevSpace" },
      { name: "description", content: "Masuk atau daftar ke DevSpace dengan email dan password." },
    ],
  }),
  component: AuthPage,
});

const credSchema = z.object({
  email: z.string().trim().email("Email tidak valid").max(255),
  password: z.string().min(6, "Password minimal 6 karakter").max(72),
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!active || !data.user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", data.user.id)
        .maybeSingle();
      if (!active) return;
      navigate({ to: profile?.username ? "/explore" : "/onboarding", replace: true });
    })();
    return () => { active = false; };
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = credSchema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: { emailRedirectTo: `${window.location.origin}/onboarding` },
        });
        if (error) {
          toast.error(error.message.includes("registered") ? "Email sudah terdaftar." : "Gagal mendaftar: " + error.message);
          setLoading(false);
          return;
        }
        if (!data.session) {
          toast.error("Konfirmasi email masih aktif. Hubungi admin.");
          setLoading(false);
          return;
        }
        toast.success("Akun berhasil dibuat! Selamat datang.");
        navigate({ to: "/onboarding", replace: true });
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) {
          toast.error(error.message.includes("Invalid") ? "Email atau password salah." : "Gagal masuk: " + error.message);
          setLoading(false);
          return;
        }
        const { data: profile } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", data.user.id)
          .maybeSingle();
        toast.success("Berhasil masuk!");
        navigate({ to: profile?.username ? "/explore" : "/onboarding", replace: true });
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan. Coba lagi.");
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-5">
      <Link
        to="/"
        className="absolute left-5 top-5 inline-flex items-center gap-1.5 rounded-full glass px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={14} /> Kembali
      </Link>

      <div className="glass animate-float-in w-full max-w-md rounded-3xl p-8 sm:p-10">
        <div className="mb-7 flex flex-col items-center text-center">
          <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-[0_0_30px_oklch(0.65_0.21_255_/_0.6)]">
            <Code2 size={26} />
          </div>
          <h1 className="text-2xl font-bold">
            {mode === "signin" ? "Masuk ke DevSpace" : "Daftar ke DevSpace"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Lanjutkan perjalananmu di komunitas developer."
              : "Bergabung dengan komunitas developer Indonesia."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Email</label>
            <div className="flex items-center rounded-xl border border-input bg-background/60 px-3 focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/20">
              <Mail size={16} className="text-muted-foreground" />
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="kamu@email.com"
                className="w-full bg-transparent px-2.5 py-3 text-sm outline-none placeholder:text-muted-foreground/60"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Password</label>
            <div className="flex items-center rounded-xl border border-input bg-background/60 px-3 focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/20">
              <Lock size={16} className="text-muted-foreground" />
              <input
                type="password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-transparent px-2.5 py-3 text-sm outline-none placeholder:text-muted-foreground/60"
                required
                minLength={6}
              />
            </div>
            {mode === "signup" && (
              <p className="mt-1.5 text-xs text-muted-foreground">Minimal 6 karakter.</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-[0_0_24px_-6px_oklch(0.65_0.21_255_/_0.7)] hover:bg-primary/90 disabled:opacity-60"
          >
            {loading ? "Memproses..." : mode === "signin" ? "Masuk" : "Daftar"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          {mode === "signin" ? "Belum punya akun?" : "Sudah punya akun?"}{" "}
          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="font-semibold text-primary hover:underline"
          >
            {mode === "signin" ? "Daftar di sini" : "Masuk di sini"}
          </button>
        </p>
      </div>
    </div>
  );
}
