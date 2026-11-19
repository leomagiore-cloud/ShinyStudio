import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const BOOKING_MARKER = "[Agendamento online]";
export { BOOKING_MARKER };

// O servidor (Netlify) roda em UTC, mas o estúdio funciona no horário de Brasília.
// Por isso hora/dia da semana precisam ser calculados explicitamente em America/Sao_Paulo.
const STUDIO_TZ = "America/Sao_Paulo";
function studioParts(d: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: STUDIO_TZ,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return {
    weekday: get("weekday"), // "Sun", "Mon"...
    hour: Number(get("hour")),
    minute: Number(get("minute")),
  };
}

async function resolveStudioId(supabaseAdmin: any, slug: string) {
  const { data, error } = await supabaseAdmin.from("studios").select("id, name").eq("slug", slug).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Estúdio não encontrado");
  return data as { id: string; name: string };
}

export const getStudioInfo = createServerFn({ method: "POST" })
  .inputValidator((d: { slug: string }) => z.object({ slug: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return resolveStudioId(supabaseAdmin, data.slug);
  });

export const getPublicServices = createServerFn({ method: "POST" })
  .inputValidator((d: { slug: string }) => z.object({ slug: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const studio = await resolveStudioId(supabaseAdmin, data.slug);
    const { data: rows, error } = await supabaseAdmin
      .from("service_catalog")
      .select("id, name, description, duration_minutes, price")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true })
      .eq("is_active", true)
      .eq("studio_id", studio.id)
      .order("name");
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getBookedSlots = createServerFn({ method: "POST" })
  .inputValidator((d: { slug: string; from: string; to: string }) =>
    z.object({ slug: z.string(), from: z.string(), to: z.string() }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const studio = await resolveStudioId(supabaseAdmin, data.slug);

    const { data: rows, error } = await supabaseAdmin
      .from("appointments")
      .select("starts_at, ends_at, status")
      .eq("studio_id", studio.id)
      .gte("starts_at", data.from)
      .lte("starts_at", data.to)
      .not("status", "in", "(cancelado)");
    if (error) throw new Error(error.message);

    const { data: osRows, error: osError } = await supabaseAdmin
      .from("service_orders")
      .select("starts_at, ends_at, status")
      .eq("studio_id", studio.id)
      .not("starts_at", "is", null)
      .gte("starts_at", data.from)
      .lte("starts_at", data.to)
      .not("status", "in", "(cancelado,concluido)");
    if (osError) throw new Error(osError.message);

    const { data: blockRows, error: blockError } = await supabaseAdmin
      .from("schedule_blocks")
      .select("starts_at, ends_at")
      .eq("studio_id", studio.id)
      .gte("starts_at", data.from)
      .lte("ends_at", data.to);
    if (blockError) throw new Error(blockError.message);

    return [...(rows ?? []), ...(osRows ?? []), ...(blockRows ?? [])]
      .filter((r) => r.starts_at && r.ends_at)
      .map((r) => ({ starts_at: r.starts_at as string, ends_at: r.ends_at as string }));
  });

const bookingSchema = z.object({
  slug: z.string(),
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(8).max(30),
  car_model: z.string().trim().max(80).optional().or(z.literal("")),
  plate: z.string().trim().max(12).optional().or(z.literal("")),
  service_ids: z.array(z.string().uuid()).min(1, "Selecione ao menos um serviço"),
  starts_at: z.string().min(10),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export const createPublicBooking = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => bookingSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const studio = await resolveStudioId(supabaseAdmin, data.slug);
    const studioId = studio.id;

    const { data: svcRows, error: svcErr } = await supabaseAdmin
      .from("service_catalog")
      .select("id, name, price, duration_minutes, is_active")
      .in("id", data.service_ids)
      .eq("studio_id", studioId);
    if (svcErr) throw new Error(svcErr.message);
    if (!svcRows || svcRows.length !== data.service_ids.length || svcRows.some((s) => !s.is_active)) {
      throw new Error("Um ou mais serviços selecionados estão indisponíveis");
    }
    // Soma a duração de todos os serviços escolhidos — isso é o que trava o horário na agenda.
    const totalDurationMin = svcRows.reduce((sum, s) => sum + s.duration_minutes, 0);
    const title = svcRows.map((s) => s.name).join(" + ");

    const starts = new Date(data.starts_at);
    const ends = new Date(starts.getTime() + totalDurationMin * 60_000);

    const sp = studioParts(starts);
    const ep = studioParts(ends);
    if (sp.weekday === "Sun") throw new Error("Não atendemos aos domingos");
    if (sp.hour < 8 || ep.hour > 17 || (ep.hour === 17 && ep.minute > 0)) {
      throw new Error("Horário fora do funcionamento (8h às 17h)");
    }

    const { data: conflicts, error: cErr } = await supabaseAdmin
      .from("appointments")
      .select("id")
      .eq("studio_id", studioId)
      .not("status", "in", "(cancelado)")
      .lt("starts_at", ends.toISOString())
      .gt("ends_at", starts.toISOString())
      .limit(1);
    if (cErr) throw new Error(cErr.message);
    if (conflicts && conflicts.length > 0) throw new Error("Este horário acabou de ser ocupado. Escolha outro.");

    const { data: osConflicts, error: osErr } = await supabaseAdmin
      .from("service_orders")
      .select("id")
      .eq("studio_id", studioId)
      .not("status", "in", "(cancelado,concluido)")
      .not("starts_at", "is", null)
      .lt("starts_at", ends.toISOString())
      .gt("ends_at", starts.toISOString())
      .limit(1);
    if (osErr) throw new Error(osErr.message);
    if (osConflicts && osConflicts.length > 0) throw new Error("Este horário acabou de ser ocupado. Escolha outro.");

    const { data: blockConflicts, error: blkErr } = await supabaseAdmin
      .from("schedule_blocks")
      .select("id")
      .eq("studio_id", studioId)
      .lt("starts_at", ends.toISOString())
      .gt("ends_at", starts.toISOString())
      .limit(1);
    if (blkErr) throw new Error(blkErr.message);
    if (blockConflicts && blockConflicts.length > 0) throw new Error("Esse dia/horário está indisponível (feriado ou bloqueio do estúdio).");

    const phoneDigits = data.phone.replace(/\D/g, "");
    let clientId: string | null = null;
    if (phoneDigits) {
      const { data: existing } = await supabaseAdmin
        .from("clients")
        .select("id")
        .eq("studio_id", studioId)
        .or(`phone.eq.${phoneDigits},whatsapp.eq.${phoneDigits}`)
        .limit(1)
        .maybeSingle();
      clientId = existing?.id ?? null;
    }
    if (!clientId) {
      const { data: newClient, error: nErr } = await supabaseAdmin
        .from("clients")
        .insert({ name: data.name, phone: phoneDigits, whatsapp: phoneDigits, studio_id: studioId })
        .select("id")
        .single();
      if (nErr) throw new Error(nErr.message);
      clientId = newClient.id;
    }

    const plate = data.plate ? data.plate.toUpperCase().replace(/\s|-/g, "") : "";
    let vehicleId: string | null = null;
    if (plate || data.car_model) {
      let exVeh = null;
      if (plate) {
        const { data: found } = await supabaseAdmin
          .from("vehicles")
          .select("id")
          .eq("plate", plate)
          .eq("studio_id", studioId)
          .limit(1)
          .maybeSingle();
        exVeh = found;
      }
      if (exVeh) {
        vehicleId = exVeh.id;
      } else {
        const { data: newV, error: vErr } = await supabaseAdmin
          .from("vehicles")
          .insert({ client_id: clientId, plate: plate || null, model: data.car_model || null, studio_id: studioId })
          .select("id")
          .single();
        if (vErr) throw new Error(vErr.message);
        vehicleId = newV.id;
      }
    }

    const note = `${BOOKING_MARKER}${data.notes ? ` — ${data.notes}` : ""}`;
    const { data: createdAppt, error: aErr } = await supabaseAdmin.from("appointments").insert({
      client_id: clientId,
      vehicle_id: vehicleId,
      service_id: svcRows[0].id, // compat: primeiro serviço selecionado
      title,
      starts_at: starts.toISOString(),
      ends_at: ends.toISOString(),
      status: "pendente",
      notes: note,
      studio_id: studioId,
    }).select("id").single();
    if (aErr) throw new Error(aErr.message);

    const { error: itemsErr } = await supabaseAdmin.from("appointment_services").insert(
      svcRows.map((s) => ({
        appointment_id: createdAppt.id,
        service_id: s.id,
        service_name: s.name,
        price: s.price,
        duration_minutes: s.duration_minutes,
        studio_id: studioId,
      }))
    );
    if (itemsErr) throw new Error(itemsErr.message);

    await supabaseAdmin.from("notifications").insert({
      studio_id: studioId,
      type: "agendamento_online",
      title: "Novo agendamento online",
      body: `${data.name} — ${title} — ${starts.toLocaleDateString("pt-BR", { timeZone: STUDIO_TZ })} às ${starts.toLocaleTimeString("pt-BR", { timeZone: STUDIO_TZ, hour: "2-digit", minute: "2-digit" })}`,
      appointment_id: createdAppt.id,
    });

    return { ok: true };
  });