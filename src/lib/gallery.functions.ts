import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getPublicGallery = createServerFn({ method: "POST" })
  .inputValidator((d: { orderId: string }) => z.object({ orderId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: orderRaw, error } = await supabaseAdmin
      .from("service_orders")
      .select(
        "id, order_number, service_name, completed_at, created_at, studio_id, clients(name), vehicles(brand, model, plate), service_photos(id, kind, storage_path), studios(name)",
      )
      .eq("id", data.orderId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!orderRaw) throw new Error("Galeria não encontrada");
    const order = orderRaw as any;

    const photos = await Promise.all(
      (order.service_photos ?? []).map(async (p: any) => {
        const { data: signed } = await supabaseAdmin.storage
          .from("service-photos")
          .createSignedUrl(p.storage_path, 60 * 60 * 24 * 7); // 7 dias
        return { id: p.id, kind: p.kind, url: signed?.signedUrl ?? null, isVideo: /\.(mp4|mov|webm|m4v|avi)$/i.test(p.storage_path) };
      }),
    );

    return {
      orderNumber: order.order_number,
      serviceName: order.service_name,
      date: order.completed_at ?? order.created_at,
      clientName: (order.clients as any)?.name ?? null,
      vehicle: order.vehicles
        ? [(order.vehicles as any).brand, (order.vehicles as any).model].filter(Boolean).join(" ")
        : null,
      studioName: (order.studios as any)?.name ?? "Estúdio",
      photos,
    };
  });
