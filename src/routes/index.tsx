import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Code2, Search, Heart, MessageCircle, Users, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DevSpace — Komunitas Developer Indonesia" },
      { name: "description", content: "Platform untuk developer Indonesia membagikan project, mencari inspirasi, dan saling terhubung." },
    ],
  }),
  component: Landing,
});

function Feature({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="glass card-lift group rounded-2xl p-6">
      <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/30">
        <Icon size={20} />
      </div>
      <h3 className="mb-1.5 text-lg font-semibold">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
    </div>
  );
}

function Step({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <div className="glass rounded-2xl p-6">
      <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 font-mono text-sm font-bold text-primary">
        {n}
      </div>
      <h4 className="mb-1 font-semibold">{title}</h4>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

function Landing() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Nav */}
      <header className="sticky top-0 z-40">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-2.5 font-display text-lg font-bold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground shadow-[0_0_20px_oklch(0.65_0.21_255_/_0.6)]">
              <Code2 size={18} />
            </span>
            DevSpace
          </Link>
          <Link
            to="/auth"
            className="rounded-full glass px-4 py-2 text-sm font-medium hover:border-primary/40 transition"
          >
            Masuk
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative mx-auto max-w-5xl px-5 pt-16 pb-24 text-center sm:pt-24">
        <div className="animate-float-in inline-flex items-center gap-2 rounded-full glass px-3.5 py-1.5 text-xs font-medium text-muted-foreground">
          <Sparkles size={13} className="text-primary" />
          Komunitas developer Indonesia
        </div>

        <h1 className="mt-7 text-balance text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl">
          Tempat developer{" "}
          <span className="text-gradient">memamerkan karya</span>{" "}
          dan saling terhubung.
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-balance text-base text-muted-foreground sm:text-lg">
          DevSpace adalah ruang sosial untuk membagikan project kamu, menemukan
          developer lain, dan membangun jejaring nyata di komunitas Indonesia.
        </p>

        <div className="mt-10 flex items-center justify-center">
          <Link
            to="/auth"
            className="group relative inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-semibold text-primary-foreground animate-pulse-glow"
          >
            Mulai
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Gratis · Masuk dengan Google
        </p>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">Apa itu DevSpace?</h2>
          <p className="mt-3 text-muted-foreground">
            Platform terbuka di mana karya kamu bertemu komunitas.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Feature icon={Code2} title="Posting Project" desc="Bagikan screenshot, deskripsi, dan link project kamu — dari web app sampai bot script." />
          <Feature icon={Search} title="Cari Karya & Developer" desc="Pencarian real-time dua arah: temukan project menarik atau developer berdasarkan nama." />
          <Feature icon={Heart} title="Suka & Trending" desc="Dukung karya developer lain. Project paling disukai muncul di halaman Trending." />
          <Feature icon={MessageCircle} title="Komentar" desc="Tinggalkan feedback langsung di setiap project untuk membantu kreator berkembang." />
          <Feature icon={Users} title="Follow & Teman 🤝" desc="Ikuti developer favoritmu. Saling follow otomatis menjadi 'Teman'." />
          <Feature icon={Sparkles} title="Profil Lengkap" desc="Profil ala Instagram dengan statistik posting, followers, dan total suka kamu." />
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-5 pb-24">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">Cara kerjanya</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Step n="01" title="Masuk dengan Google" desc="Klik Mulai dan login sekali pakai akun Google kamu." />
          <Step n="02" title="Buat username" desc="Pilih username unik kamu di onboarding. Wajib hanya sekali." />
          <Step n="03" title="Jelajahi & ikuti" desc="Telusuri project, ikuti developer yang menarik buat kamu." />
          <Step n="04" title="Posting karyamu" desc="Tap tombol + dan unggah screenshot project dari galeri kamu." />
        </div>

        <div className="mt-14 text-center">
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground animate-pulse-glow"
          >
            Mulai sekarang
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <footer className="border-t border-border/50 px-5 py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} DevSpace — Dibuat untuk komunitas developer Indonesia.
      </footer>
    </div>
  );
}
