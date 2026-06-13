import { Link, useNavigate } from "@tanstack/react-router";
import { Code2, LogOut, User as UserIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { isVerifiedEmail, VerifiedBadge } from "@/components/verified-badge";
import { useQueryClient } from "@tanstack/react-query";

export function Navbar() {
  const { user, profile } = useCurrentUser();
  const navigate = useNavigate();
  const qc = useQueryClient();

  async function handleSignOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="sticky top-0 z-30 glass-strong">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-5">
        <Link to="/explore" className="flex items-center gap-2 font-display text-base font-bold sm:text-lg">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground shadow-[0_0_18px_oklch(0.65_0.21_255_/_0.6)]">
            <Code2 size={17} />
          </span>
          <span className="hidden sm:inline">DevSpace</span>
        </Link>

        <nav className="flex items-center gap-1.5">
          {profile?.username && (
            <Link
              to="/u/$username"
              params={{ username: profile.username }}
              className="flex items-center gap-2 rounded-full glass px-2.5 py-1.5 text-xs font-medium hover:border-primary/40 sm:text-sm"
            >
              <div className="grid h-6 w-6 place-items-center rounded-full bg-accent text-[10px] font-bold uppercase">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} className="h-6 w-6 rounded-full object-cover" alt="" />
                ) : (
                  profile.username.slice(0, 2)
                )}
              </div>
              <span className="hidden sm:inline">@{profile.username}</span>
              {isVerifiedEmail(user?.email) && <VerifiedBadge size={13} />}
            </Link>
          )}
          <button
            onClick={handleSignOut}
            title="Keluar"
            className="grid h-9 w-9 place-items-center rounded-full glass text-muted-foreground hover:text-destructive hover:border-destructive/40"
          >
            <LogOut size={15} />
          </button>
        </nav>
      </div>
    </header>
  );
}
