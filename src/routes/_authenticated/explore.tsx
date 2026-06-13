import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, Plus, TrendingUp, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/navbar";
import { ProjectCard, type ProjectWithAuthor } from "@/components/project-card";
import { PostProjectModal } from "@/components/post-project-modal";
import { VerifiedBadge, isVerifiedEmail } from "@/components/verified-badge";

export const Route = createFileRoute("/_authenticated/explore")({
  head: () => ({ meta: [{ title: "Jelajah — DevSpace" }] }),
  component: ExplorePage,
});

const TAG_FILTERS = ["Semua", "React", "Tailwind", "Bot Script", "HTML/CSS", "Next.js", "Python", "AI"];

type DevProfile = {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  email: string | null;
};

function ExplorePage() {
  const { user } = Route.useRouteContext();
  const [tab, setTab] = useState<"project" | "developer">("project");
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState("Semua");
  const [sort, setSort] = useState<"new" | "trending">("new");
  const [projects, setProjects] = useState<ProjectWithAuthor[]>([]);
  const [developers, setDevelopers] = useState<DevProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [postOpen, setPostOpen] = useState(false);

  async function loadProjects() {
    setLoading(true);
    const { data: projectRows } = await supabase
      .from("projects")
      .select("id, user_id, title, description, image_url, link, tags, created_at")
      .order("created_at", { ascending: false });

    if (!projectRows) {
      setProjects([]);
      setLoading(false);
      return;
    }

    const userIds = [...new Set(projectRows.map((p) => p.user_id))];
    const projectIds = projectRows.map((p) => p.id);

    const [{ data: authors }, { data: likes }] = await Promise.all([
      supabase.from("profiles").select("id, username, avatar_url, email").in("id", userIds),
      supabase.from("likes").select("project_id, user_id").in("project_id", projectIds),
    ]);

    const authorMap = new Map((authors ?? []).map((a) => [a.id, a]));
    const likeCounts = new Map<string, number>();
    const likedByMe = new Set<string>();
    (likes ?? []).forEach((l) => {
      likeCounts.set(l.project_id, (likeCounts.get(l.project_id) ?? 0) + 1);
      if (l.user_id === user.id) likedByMe.add(l.project_id);
    });

    setProjects(
      projectRows.map((p) => ({
        ...p,
        author: authorMap.get(p.user_id) ?? null,
        likes_count: likeCounts.get(p.id) ?? 0,
        liked_by_me: likedByMe.has(p.id),
      })),
    );
    setLoading(false);
  }

  async function loadDevelopers() {
    const { data } = await supabase
      .from("profiles")
      .select("id, username, avatar_url, bio, email")
      .not("username", "is", null)
      .order("created_at", { ascending: false })
      .limit(60);
    setDevelopers((data ?? []) as DevProfile[]);
  }

  useEffect(() => {
    loadProjects();
    loadDevelopers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredProjects = useMemo(() => {
    let out = projects;
    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.author?.username ?? "").toLowerCase().includes(q),
      );
    }
    if (tagFilter !== "Semua") {
      out = out.filter((p) => p.tags?.some((t) => t.toLowerCase() === tagFilter.toLowerCase()));
    }
    if (sort === "trending") {
      out = [...out].sort((a, b) => b.likes_count - a.likes_count);
    }
    return out;
  }, [projects, search, tagFilter, sort]);

  const filteredDevelopers = useMemo(() => {
    if (!search.trim()) return developers;
    const q = search.toLowerCase();
    return developers.filter(
      (d) =>
        d.username.toLowerCase().includes(q) ||
        (d.bio ?? "").toLowerCase().includes(q),
    );
  }, [developers, search]);

  function handleLikeToggled(id: string, liked: boolean) {
    setProjects((cur) =>
      cur.map((p) =>
        p.id === id
          ? { ...p, liked_by_me: liked, likes_count: p.likes_count + (liked ? 1 : -1) }
          : p,
      ),
    );
  }

  function handleDeleted(id: string) {
    setProjects((cur) => cur.filter((p) => p.id !== id));
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-5">
        {/* Search */}
        <div className="glass-strong sticky top-[60px] z-20 -mx-4 mb-5 rounded-none border-y border-border/50 px-4 py-3 sm:static sm:mx-0 sm:rounded-2xl sm:border sm:px-4">
          <div className="flex items-center gap-2.5 rounded-full bg-background/60 px-4 py-2.5 ring-1 ring-border focus-within:ring-primary/50">
            <Search size={16} className="text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari project atau developer..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-5 flex gap-1.5">
          {(["project", "developer"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold capitalize transition ${
                tab === t
                  ? "bg-primary text-primary-foreground shadow-[0_0_16px_-4px_oklch(0.65_0.21_255_/_0.7)]"
                  : "glass text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "project" ? "Project" : "Developer"}
            </button>
          ))}
        </div>

        {tab === "project" && (
          <>
            {/* Sort + tag filters */}
            <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setSort("new")}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition ${
                  sort === "new" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Sparkles size={12} /> Terbaru
              </button>
              <button
                onClick={() => setSort("trending")}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition ${
                  sort === "trending" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <TrendingUp size={12} /> Trending
              </button>
              <div className="mx-1 h-4 w-px bg-border" />
              {TAG_FILTERS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTagFilter(t)}
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition ${
                    tagFilter === t
                      ? "bg-primary/15 text-primary ring-1 ring-primary/30"
                      : "glass text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {loading ? (
              <SkeletonGrid />
            ) : filteredProjects.length === 0 ? (
              <EmptyState
                title="Belum ada project"
                desc="Jadi yang pertama posting karyamu di DevSpace."
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredProjects.map((p) => (
                  <ProjectCard
                    key={p.id}
                    project={p}
                    currentUserId={user.id}
                    onLikeToggled={handleLikeToggled}
                    onDeleted={handleDeleted}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {tab === "developer" && (
          <>
            {filteredDevelopers.length === 0 ? (
              <EmptyState title="Tidak ada developer" desc="Coba kata kunci lain." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredDevelopers.map((d) => (
                  <Link
                    key={d.id}
                    to="/u/$username"
                    params={{ username: d.username }}
                    className="glass card-lift flex items-center gap-3 rounded-2xl p-4"
                  >
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-accent text-sm font-bold uppercase ring-2 ring-primary/30">
                      {d.avatar_url ? (
                        <img src={d.avatar_url} className="h-12 w-12 rounded-full object-cover" alt="" />
                      ) : (
                        d.username.slice(0, 2)
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate font-semibold">@{d.username}</span>
                        {isVerifiedEmail(d.email) && <VerifiedBadge size={13} />}
                      </div>
                      <p className="line-clamp-1 text-xs text-muted-foreground">
                        {d.bio || "Developer di DevSpace"}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Floating action button */}
      <button
        onClick={() => setPostOpen(true)}
        aria-label="Posting Project"
        className="fixed bottom-6 right-6 z-30 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground animate-pulse-glow transition hover:scale-105"
      >
        <Plus size={26} strokeWidth={2.5} />
      </button>

      <PostProjectModal
        userId={user.id}
        open={postOpen}
        onClose={() => setPostOpen(false)}
        onPosted={loadProjects}
      />
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="glass overflow-hidden rounded-2xl">
          <div className="aspect-[16/10] animate-pulse bg-accent/30" />
          <div className="space-y-2 p-4">
            <div className="h-4 w-2/3 animate-pulse rounded bg-accent/30" />
            <div className="h-3 w-full animate-pulse rounded bg-accent/20" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="glass flex flex-col items-center justify-center rounded-2xl p-12 text-center">
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}
