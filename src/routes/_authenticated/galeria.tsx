import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Search, Video, ImageOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/galeria")({
  ssr: false,
  component: GaleriaPage,
});

const isVideo = (path: string) => /\.(mp4|mov|webm|m4v|avi)$/i.test(path);

function GaleriaPage() {
  const [search, setSearch] = useState("");
  const [openOrder, setOpenOrder] = useState<any>(null);

  const { data: orders } = useQuery({
    queryKey: ["gallery"],
    queryFn: async () => {
      const { data } = await supabase
        .from("service_orders")
        .select("id, order_number, service_name, created_at, clients(name), vehicles(brand, model, plate), service_photos(id, kind, storage_path)")
        .order("created_at", { ascending: false })
        .limit(80);
      return (data ?? []).filter((o: any) => (o.service_photos ?? []).length > 0);
    },
  });

  const filtered = useMemo(() => {
    if (!orders) return [];
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o: any) => {
      const vehicle = `${o.vehicles?.brand ?? ""} ${o.vehicles?.model ?? ""} ${o.vehicles?.plate ?? ""}`.toLowerCase();
      return (
        (o.clients?.name ?? "").toLowerCase().includes(q) ||
        vehicle.includes(q) ||
        (o.service_name ?? "").toLowerCase().includes(q)
      );
    });
  }, [orders, search]);

  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      <header className="mb-6">
        <h2 className="text-3xl font-display font-bold">Galeria Antes & Depois</h2>
        <p className="text-muted-foreground mt-1">Repositório visual dos resultados — perfeito para compartilhar.</p>
      </header>

      <div className="relative mb-6 max-w-md">
        <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Buscar por cliente, veículo ou serviço..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {(!orders || orders.length === 0) && (
        <div className="bg-card/50 border border-border rounded-xl p-16 text-center text-muted-foreground">
          Nenhuma OS com fotos ainda. Vá em <strong>Ordens de Serviço</strong> e adicione fotos antes/depois.
        </div>
      )}

      {orders && orders.length > 0 && filtered.length === 0 && (
        <div className="bg-card/50 border border-border rounded-xl p-10 text-center text-muted-foreground">
          Nada encontrado para "{search}".
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {filtered.map((o: any) => (
          <GalleryCard key={o.id} order={o} onClick={() => setOpenOrder(o)} />
        ))}
      </div>

      {openOrder && <GalleryLightbox order={openOrder} onClose={() => setOpenOrder(null)} />}
    </div>
  );
}

function GalleryCard({ order, onClick }: { order: any; onClick: () => void }) {
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const cover = order.service_photos.find((p: any) => p.kind === "depois") ?? order.service_photos[0];
  const vehicle = order.vehicles ? `${order.vehicles.brand ?? ""} ${order.vehicles.model ?? ""}`.trim() : "";

  useEffect(() => {
    if (!cover) return;
    supabase.storage.from("service-photos").createSignedUrl(cover.storage_path, 3600).then(({ data }) => {
      if (data) setCoverUrl(data.signedUrl);
    });
  }, [cover]);

  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left bg-card border border-border rounded-lg overflow-hidden hover:border-primary/40 transition-colors group"
    >
      <div className="aspect-square bg-secondary relative">
        {coverUrl ? (
          isVideo(cover.storage_path) ? (
            <div className="relative w-full h-full">
              <video src={coverUrl} className="w-full h-full object-cover" muted playsInline preload="metadata" />
              <Video className="size-5 text-white absolute bottom-1.5 right-1.5 drop-shadow" />
            </div>
          ) : (
            <img src={coverUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
          )
        ) : (
          <div className="w-full h-full grid place-items-center text-muted-foreground/40"><ImageOff className="size-5" /></div>
        )}
        <span className="absolute top-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/60 text-white">
          {order.service_photos.length}
        </span>
      </div>
      <div className="p-2">
        <p className="text-xs font-semibold truncate">{order.clients?.name}</p>
        <p className="text-[10px] text-muted-foreground truncate">{vehicle || order.service_name}</p>
        <p className="text-[10px] text-muted-foreground/70">{formatDate(order.created_at)}</p>
      </div>
    </button>
  );
}

function GalleryLightbox({ order, onClose }: { order: any; onClose: () => void }) {
  const [urls, setUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      const map: Record<string, string> = {};
      for (const p of order.service_photos) {
        const { data } = await supabase.storage.from("service-photos").createSignedUrl(p.storage_path, 3600);
        if (data) map[p.id] = data.signedUrl;
      }
      setUrls(map);
    })();
  }, [order]);

  const antes = order.service_photos.filter((p: any) => p.kind === "antes");
  const depois = order.service_photos.filter((p: any) => p.kind === "depois");
  const vehicle = order.vehicles ? `${order.vehicles.brand ?? ""} ${order.vehicles.model ?? ""}`.trim() : "";

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {vehicle || order.service_name}
            <span className="text-muted-foreground font-normal text-sm ml-2">— {order.service_name}</span>
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {order.clients?.name} · OS #{String(order.order_number).padStart(4, "0")} · {formatDate(order.created_at)}
          </p>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(["antes", "depois"] as const).map((kind) => {
            const list = kind === "antes" ? antes : depois;
            return (
              <div key={kind}>
                <p className="text-[10px] uppercase tracking-widest font-bold mb-2 text-muted-foreground">{kind}</p>
                <div className="grid grid-cols-2 gap-2">
                  {list.length === 0 && <div className="col-span-2 aspect-video bg-secondary/30 border border-dashed border-border rounded-lg grid place-items-center text-xs text-muted-foreground">Sem arquivos</div>}
                  {list.map((p: any) => (
                    <a key={p.id} href={urls[p.id]} target="_blank" rel="noreferrer" className="block aspect-square rounded-lg overflow-hidden bg-secondary border border-border hover:border-primary/40 transition-colors">
                      {urls[p.id] && (
                        isVideo(p.storage_path)
                          ? <video src={urls[p.id]} className="w-full h-full object-cover" muted playsInline preload="metadata" controls />
                          : <img src={urls[p.id]} alt={kind} className="w-full h-full object-cover" />
                      )}
                    </a>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
