import { useRef, useState } from "react";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { uploadToBucket } from "@/lib/storage";

const TAG_SUGGESTIONS = ["React", "Tailwind", "Bot Script", "HTML/CSS", "Next.js", "Vue", "Node.js", "Python", "Mobile", "AI"];

const schema = z.object({
  title: z.string().trim().min(3, "Judul minimal 3 karakter").max(80),
  description: z.string().trim().min(10, "Deskripsi minimal 10 karakter").max(500),
  link: z.string().trim().max(300).optional().or(z.literal("")),
});

export function PostProjectModal({
  userId,
  open,
  onClose,
  onPosted,
}: {
  userId: string;
  open: boolean;
  onClose: () => void;
  onPosted: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  function handleFile(f: File | null) {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast.error("File harus berupa gambar.");
      return;
    }
    if (f.size > 8 * 1024 * 1024) {
      toast.error("Maksimal 8MB.");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  function toggleTag(t: string) {
    setTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));
  }

  function reset() {
    setTitle(""); setDescription(""); setLink(""); setTags([]); setFile(null); setPreview(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      toast.error("Unggah screenshot project terlebih dahulu.");
      return;
    }
    const parsed = schema.safeParse({ title, description, link });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setPosting(true);
    try {
      const path = await uploadToBucket("project-images", userId, file);
      const { error } = await supabase.from("projects").insert({
        user_id: userId,
        title: parsed.data.title,
        description: parsed.data.description,
        image_url: path,
        link: parsed.data.link || null,
        tags,
      });
      if (error) throw error;
      toast.success("Project berhasil diposting!");
      reset();
      onPosted();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Gagal memposting project.");
    } finally {
      setPosting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="glass-strong animate-float-in w-full max-w-lg overflow-hidden rounded-t-3xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
          <h2 className="font-display text-lg font-bold">Posting Project</h2>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full hover:bg-accent">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[80vh] space-y-4 overflow-y-auto p-5">
          {/* Image picker */}
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
            {preview ? (
              <div className="relative overflow-hidden rounded-2xl border border-border">
                <img src={preview} className="aspect-[16/10] w-full object-cover" alt="" />
                <button
                  type="button"
                  onClick={() => { setFile(null); setPreview(null); }}
                  className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/70 backdrop-blur"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="glass flex aspect-[16/10] w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border text-muted-foreground transition hover:border-primary/60 hover:text-primary"
              >
                <ImagePlus size={28} />
                <span className="text-sm font-medium">Unggah screenshot project</span>
                <span className="text-[11px]">JPG, PNG · maks 8MB</span>
              </button>
            )}
          </div>

          <Field label="Judul Project">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={80}
              placeholder="Mis. Dashboard Analytics"
              className="w-full rounded-xl border border-input bg-background/60 px-3.5 py-2.5 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
            />
          </Field>

          <Field label="Deskripsi">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Ceritakan singkat tentang project kamu..."
              className="w-full resize-none rounded-xl border border-input bg-background/60 px-3.5 py-2.5 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
            />
          </Field>

          <Field label="Live / Repo Link (opsional)">
            <input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-xl border border-input bg-background/60 px-3.5 py-2.5 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
            />
          </Field>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Tech Stack</label>
            <div className="flex flex-wrap gap-1.5">
              {TAG_SUGGESTIONS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleTag(t)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    tags.includes(t)
                      ? "bg-primary text-primary-foreground shadow-[0_0_16px_-4px_oklch(0.65_0.21_255_/_0.7)]"
                      : "glass text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={posting}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-[0_0_24px_-6px_oklch(0.65_0.21_255_/_0.7)] hover:bg-primary/90 disabled:opacity-60"
          >
            {posting && <Loader2 size={16} className="animate-spin" />}
            {posting ? "Memposting..." : "Posting Project"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
