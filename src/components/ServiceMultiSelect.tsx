import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { formatBRL } from "@/lib/format";

type Service = { id: string; name: string; price: number; duration_minutes: number };

export function ServiceMultiSelect({
  services,
  selectedIds,
  onToggle,
  placeholder = "Selecione os serviços",
}: {
  services: Service[] | undefined;
  selectedIds: string[];
  onToggle: (id: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const filtered = (services ?? []).filter((s) => s.name.toLowerCase().includes(query.toLowerCase()));
  const selected = (services ?? []).filter((s) => selectedIds.includes(s.id));

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm h-10"
      >
        <span className={selected.length ? "" : "text-muted-foreground"}>
          {selected.length ? `${selected.length} serviço${selected.length > 1 ? "s" : ""} selecionado${selected.length > 1 ? "s" : ""}` : placeholder}
        </span>
        <ChevronDown className="size-4 shrink-0 opacity-50" />
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full rounded-md border border-border bg-popover shadow-lg">
          <div className="p-2 border-b border-border flex items-center gap-2">
            <Search className="size-4 text-muted-foreground shrink-0" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar serviço..."
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 && <p className="px-3 py-2 text-xs text-muted-foreground">Nenhum serviço encontrado.</p>}
            {filtered.map((s) => {
              const active = selectedIds.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onToggle(s.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary/60 text-left"
                >
                  <span className={`size-4 shrink-0 rounded border flex items-center justify-center ${active ? "bg-primary border-primary" : "border-input"}`}>
                    {active && <Check className="size-3 text-primary-foreground" />}
                  </span>
                  <span className="flex-1 truncate">{s.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{formatBRL(Number(s.price))}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {selected.map((s) => (
            <span key={s.id} className="text-xs pl-2.5 pr-1.5 py-1 rounded-full bg-secondary/60 border border-border flex items-center gap-1">
              {s.name}
              <button type="button" onClick={() => onToggle(s.id)} className="text-muted-foreground hover:text-destructive">
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
