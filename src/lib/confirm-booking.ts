import { supabase } from "@/integrations/supabase/client";

/**
 * Confirma um agendamento online: marca como confirmado e já cria a O.S
 * correspondente (com os mesmos serviços/duração), pra ficar 100% automático.
 */
export async function confirmOnlineBooking(appointment: {
  id: string;
  client_id: string;
  vehicle_id: string | null;
  title: string | null;
  starts_at: string;
  ends_at: string;
}) {
  const { error: updErr } = await supabase.from("appointments").update({ status: "confirmado" }).eq("id", appointment.id);
  if (updErr) throw updErr;

  const { data: items } = await supabase
    .from("appointment_services")
    .select("service_id, service_name, price, duration_minutes")
    .eq("appointment_id", appointment.id);

  const serviceName = items?.length ? items.map((i) => i.service_name).join(" + ") : appointment.title ?? "Serviço";
  const amount = items?.reduce((sum, i) => sum + Number(i.price), 0) ?? 0;

  const { data: order, error: orderErr } = await supabase
    .from("service_orders")
    .insert({
      client_id: appointment.client_id,
      vehicle_id: appointment.vehicle_id,
      service_id: items?.[0]?.service_id ?? null,
      service_name: serviceName,
      amount,
      payment_method: "pendente",
      status: "em_andamento",
      starts_at: appointment.starts_at,
      ends_at: appointment.ends_at,
      started_at: appointment.starts_at,
      notes: "Criada automaticamente a partir de um agendamento online confirmado.",
    })
    .select("id")
    .single();
  if (orderErr) throw orderErr;

  if (items?.length) {
    const { error: itemsErr } = await supabase.from("service_order_items").insert(
      items.map((i) => ({
        order_id: order.id,
        service_id: i.service_id,
        service_name: i.service_name,
        price: i.price,
        duration_minutes: i.duration_minutes,
      }))
    );
    if (itemsErr) throw itemsErr;
  }

  return order.id;
}

export async function cancelOnlineBooking(appointmentId: string) {
  const { error } = await supabase.from("appointments").update({ status: "cancelado" }).eq("id", appointmentId);
  if (error) throw error;
}
