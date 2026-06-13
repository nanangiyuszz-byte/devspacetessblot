import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export type Profile = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  email: string | null;
};

export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadProfile(u: User | null) {
      if (!u) {
        if (active) {
          setProfile(null);
          setLoading(false);
        }
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, bio, email")
        .eq("id", u.id)
        .maybeSingle();
      if (active) {
        setProfile(data ?? null);
        setLoading(false);
      }
    }

    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setUser(data.user);
      loadProfile(data.user);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      setUser(session?.user ?? null);
      loadProfile(session?.user ?? null);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { user, profile, loading, refresh: async () => {
    const { data } = await supabase.auth.getUser();
    setUser(data.user);
    if (data.user) {
      const { data: p } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, bio, email")
        .eq("id", data.user.id)
        .maybeSingle();
      setProfile(p ?? null);
    }
  } };
}
