import { Instagram } from "lucide-react";

export function InstagramFooter({ studioName }: { studioName: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 py-6">
      <a
        href="https://www.instagram.com/esteticashiny/"
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 text-sm font-semibold text-foreground hover:text-primary transition-colors"
      >
        <Instagram className="size-5" />
        @esteticashiny
      </a>
      <span className="text-xs text-muted-foreground">{studioName}</span>
    </div>
  );
}
