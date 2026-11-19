import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Sparkles } from "lucide-react";
import { getPublicGallery } from "@/lib/gallery.functions";
import { InstagramFooter } from "@/components/InstagramFooter";

export const Route = createFileRoute("/galeria/$id")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Antes & Depois — Confira seu carro!" }],
  }),
  component: PublicGalleryPage,
});

function PublicGalleryPage() {
  const { id } = Route.useParams();

  const { data, isLoading, error } = useQuery({
    queryKey: ["public-gallery", id],
    queryFn: () => getPublicGallery({ data: { orderId: id } }),
    retry: false,
  });

  if (isLoading) {
    return <div className="min-h-screen bg-background grid place-items-center text-muted-foreground text-sm">Carregando...</div>;
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background grid place-items-center p-6 text-center">
        <div>
          <p className="font-display text-xl font-bold mb-2">Link não encontrado</p>
          <p className="text-muted-foreground text-sm">Esse link de galeria não existe mais.</p>
        </div>
      </div>
    );
  }

  const antes = data.photos.filter((p) => p.kind === "antes");
  const depois = data.photos.filter((p) => p.kind === "depois");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-5 py-5 flex items-center gap-3">
          <div className="size-10 rounded-lg bg-primary grid place-items-center font-display font-bold text-white italic shadow-lg shadow-primary/30 shrink-0">
            <Sparkles className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="font-display font-bold truncate">{data.studioName}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Antes & Depois</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-8">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold">{data.vehicle ?? data.serviceName}</h1>
          <p className="text-muted-foreground mt-1">
            {data.serviceName} · {format(parseISO(data.date), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
            {data.clientName && ` · ${data.clientName}`}
          </p>
        </div>

        {data.photos.length === 0 && (
          <p className="text-center text-muted-foreground py-16">Ainda não há fotos nessa galeria.</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {(["antes", "depois"] as const).map((kind) => {
            const list = kind === "antes" ? antes : depois;
            if (list.length === 0) return null;
            return (
              <div key={kind}>
                <p className="text-xs uppercase tracking-widest font-bold mb-3 text-muted-foreground">{kind}</p>
                <div className="grid grid-cols-2 gap-2">
                  {list.map((p) => (
                    <a
                      key={p.id}
                      href={p.url ?? undefined}
                      target="_blank"
                      rel="noreferrer"
                      className="block aspect-square rounded-xl overflow-hidden bg-secondary border border-border"
                    >
                      {p.url && (
                        p.isVideo ? (
                          <video src={p.url} className="w-full h-full object-cover" muted playsInline controls preload="metadata" />
                        ) : (
                          <img src={p.url} alt={kind} className="w-full h-full object-cover" />
                        )
                      )}
                    </a>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12">
          <InstagramFooter studioName={data.studioName} />
        </div>
      </main>
    </div>
  );
}
