import { BadgeCheck } from "lucide-react";

export const VERIFIED_EMAIL = "bayuraya711@gmail.com";

export function isVerifiedEmail(email?: string | null) {
  return !!email && email.toLowerCase() === VERIFIED_EMAIL;
}

export function VerifiedBadge({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <span
      title="Developer terverifikasi"
      className={`inline-flex items-center justify-center text-primary ${className}`}
      style={{
        filter: "drop-shadow(0 0 6px oklch(0.65 0.21 255 / 0.85))",
      }}
    >
      <BadgeCheck size={size} strokeWidth={2.5} fill="currentColor" stroke="#090A0F" />
    </span>
  );
}
