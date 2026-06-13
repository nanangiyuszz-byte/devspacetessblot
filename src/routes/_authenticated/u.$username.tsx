import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Settings, UserPlus, UserCheck, Grid3x3 } from "lucide-react";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { supabase } from "@/integrations/supabase/client";
import { getSignedUrl } from "@/lib/storage";
import { VerifiedBadge, isVerifiedEmail } from "@/components/verified-badge";
import { EditProfileDialog } from "@/components/edit-profile-dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/u/$username")({
  head: ({ params }) => ({ meta: [{ title: `@${params.username} — DevSpace` }] }),
  component: ProfilePage,
});

type ProfileRow = {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  email: string | null;
  created_at: string;
};

type ProjectRow = {
  id: string;
  title: string;
  image_url: string;
};

function ProfilePage() {
  const { username } = Route.useParams();
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [stats, setStats] = useState({ posts: 0, followers: 0, following: 0, likes: 0 });
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setNotFound(false);

      const { data: prof } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, bio, email, created_at")
        .eq("username", username)
        .maybeSingle();

      if (!active) return;
      if (!prof) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setProfile(prof as ProfileRow);

      const [{ data: projectRows }, { count: followers }, { count: following }, { data: myFollow }] =
        await Promise.all([
          supabase
            .from("projects")
            .select("id, title, image_url")
            .eq("user_id", prof.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("follows")
            .select("*", { count: "exact", head: true })
            .eq("following_id", prof.id),
          supabase
            .from("follows")
            .select("*", { count: "exact", head: true })
            .eq("follower_id", prof.id),
          supabase
            .from("follows")
            .select("id")
            .eq("follower_id", user.id)
            .eq("following_id", prof.id)
            .maybeSingle(),
        ]);

      if (!active) return;
      setProjects((projectRows ?? []) as ProjectRow[]);
      setIsFollowing(!!myFollow);

      let totalLikes = 0;
      const ids = (projectRows ?? []).map((p) => p.id);
      if (ids.length) {
        const { count } = await supabase
          .from("likes")
          .select("*", { count: "exact", head: true })
          .in("project_id", ids);
        totalLikes = count ?? 0;
      }

      if (!active) return;
      setStats({
        posts: projectRows?.length ?? 0,
        followers: followers ?? 0,
        following: following ?? 0,
        likes: totalLikes,
      });
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [username, user.id]);

  async function toggleFollow() {
    if (!profile || busy) return;
    setBusy(true);
    if (isFollowing) {
      await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", profile.id);
      setIsFollowing(false);
      setStats((s) => ({ ...s, followers: Math.max(0, s.followers - 1) }));
    } else {
      const { error } = await supabase
        .from("follows")
        .insert({ follower_id: user.id, following_id: profile.id });
      if (error) {
        toast.error("Gagal mengikuti.");
      } else {
        setIsFollowing(true);
        setStats((s) => ({ ...s, followers: s.followers + 1 }));
      }
    }
    setBusy(false);
  }

  if (notFound) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="mx-auto max-w-3xl px-5 py-20 text-center">
          <h1 className="text-2xl font-bold">Pengguna tidak ditemukan</h1>
          <p className="mt-2 text-sm text-muted-foreground">@{username} belum bergabung di DevSpace.</p>
          <Link to="/explore" className="mt-6 inline-block text-sm text-primary hover:underline">
            ← Kembali ke Jelajah
          </Link>
        </main>
      </div>
    );
  }

  const isOwner = profile?.id === user.id;
  const verified = isVerifiedEmail(profile?.email);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 pb-20 pt-6 sm:px-5">
        <Link
          to="/explore"
          className="mb-5 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={13} /> Kembali ke Jelajah
        </Link>

        {loading || !profile ? (
          <ProfileSkeleton />
        ) : (
          <>
            <section className="glass animate-float-in rounded-3xl p-5 sm:p-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                <div className="relative mx-auto sm:mx-0">
                  <div className="grid h-24 w-24 place-items-center overflow-hidden rounded-full bg-accent text-xl font-bold uppercase ring-2 ring-primary/40 shadow-[0_0_28px_-6px_oklch(0.65_0.21_255_/_0.7)] sm:h-28 sm:w-28">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt={profile.username} className="h-full w-full object-cover" />
                    ) : (
                      profile.username.slice(0, 2)
                    )}
                  </div>
                </div>

                <div className="flex min-w-0 flex-1 flex-col gap-3">
                  <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                    <h1 className="font-display text-xl font-bold sm:text-2xl">@{profile.username}</h1>
                    {verified && <VerifiedBadge size={18} />}
                    <div className="ml-auto flex gap-2">
                      {isOwner ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setEditOpen(true);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-full glass px-3 py-1.5 text-xs font-semibold hover:border-primary/40"
                        >
                          <Settings size={13} /> Edit Profil
                        </button>
                      ) : (
                        <button
                          onClick={toggleFollow}
                          disabled={busy}
                          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition disabled:opacity-60 ${
                            isFollowing
                              ? "glass text-foreground hover:border-destructive/40 hover:text-destructive"
                              : "bg-primary text-primary-foreground shadow-[0_0_18px_-4px_oklch(0.65_0.21_255_/_0.7)] hover:scale-[1.03]"
                          }`}
                        >
                          {isFollowing ? (
                            <>
                              <UserCheck size={13} /> Mengikuti
                            </>
                          ) : (
                            <>
                              <UserPlus size={13} /> Ikuti
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 rounded-2xl bg-background/40 px-2 py-3 ring-1 ring-border/60 sm:gap-4 sm:px-4">
                    <Stat label="Postingan" value={stats.posts} />
                    <Stat label="Followers" value={stats.followers} />
                    <Stat label="Following" value={stats.following} />
                    <Stat label="Suka" value={stats.likes} />
                  </div>

                  {profile.bio ? (
                    <p className="whitespace-pre-line text-center text-sm leading-relaxed text-muted-foreground sm:text-left">
                      {profile.bio}
                    </p>
                  ) : (
                    <p className="text-center text-xs italic text-muted-foreground sm:text-left">
                      {isOwner ? "Belum ada bio. Tambahkan dari Edit Profil." : "Belum ada bio."}
                    </p>
                  )}
                </div>
              </div>
            </section>

            <section className="mt-6">
              <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Grid3x3 size={14} /> Galeri Project
              </div>

              {projects.length === 0 ? (
                <div className="glass flex flex-col items-center justify-center rounded-2xl p-12 text-center">
                  <h3 className="font-semibold">Belum ada project</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {isOwner ? "Posting karya pertamamu dari halaman Jelajah." : "Pengguna ini belum memposting project."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5">
                  {projects.map((p) => (
                    <ProjectThumb key={p.id} project={p} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {profile && isOwner && (
        <EditProfileDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          userId={user.id}
          profile={profile}
          onSaved={(next) => {
            setProfile((p) => (p ? { ...p, ...next } : p));
            if (next.username && next.username !== profile.username) {
              navigate({
                to: "/u/$username",
                params: { username: next.username },
                replace: true,
              });
            }
          }}
        />
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <div className="font-display text-base font-bold sm:text-lg">{value.toLocaleString("id-ID")}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground sm:text-xs">{label}</div>
    </div>
  );
}

function ProjectThumb({ project }: { project: ProjectRow }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    getSignedUrl("project-images", project.image_url)
      .then((u) => active && setUrl(u))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [project.image_url]);

  return (
    <div className="group relative aspect-square overflow-hidden rounded-lg bg-accent/30 ring-1 ring-border/50 sm:rounded-xl">
      {url ? (
        <img
          src={url}
          alt={project.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
      ) : (
        <div className="h-full w-full animate-pulse bg-accent/30" />
      )}
      <div className="pointer-events-none absolute inset-0 flex items-end bg-gradient-to-t from-black/80 via-black/0 to-transparent p-2 opacity-0 transition group-hover:opacity-100">
        <span className="line-clamp-2 text-[11px] font-semibold text-white">{project.title}</span>
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="glass rounded-3xl p-8">
      <div className="flex flex-col items-center gap-5 sm:flex-row">
        <div className="h-28 w-28 animate-pulse rounded-full bg-accent/40" />
        <div className="flex-1 space-y-3">
          <div className="h-5 w-40 animate-pulse rounded bg-accent/40" />
          <div className="h-16 w-full animate-pulse rounded-2xl bg-accent/30" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-accent/30" />
        </div>
      </div>
    </div>
  );
}
