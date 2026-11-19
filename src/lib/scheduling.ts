import { supabase } from "@/integrations/supabase/client";

/**
 * Verifica se existe conflito de horário entre agendamentos e ordens de serviço em andamento.
 * Um agendamento novo não pode coincidir com outro agendamento nem com uma OS que já está
 * ocupando aquele horário (e vice-versa).
 */
export async function checkScheduleConflict(opts: {
  startsAt: Date;
  endsAt: Date;
  excludeAppointmentId?: string;
  excludeOrderId?: string;
}): Promise<{ conflict: boolean; reason?: string }> {
  const startsIso = opts.startsAt.toISOString();
  const endsIso = opts.endsAt.toISOString();

  let apptQuery = supabase
    .from("appointments")
    .select("id, title")
    .not("status", "eq", "cancelado")
    .lt("starts_at", endsIso)
    .gt("ends_at", startsIso)
    .limit(1);
  if (opts.excludeAppointmentId) apptQuery = apptQuery.neq("id", opts.excludeAppointmentId);
  const { data: apptConflicts, error: apptErr } = await apptQuery;
  if (apptErr) throw new Error(apptErr.message);
  if (apptConflicts && apptConflicts.length > 0) {
    return { conflict: true, reason: `Já existe um agendamento (${apptConflicts[0].title}) nesse horário.` };
  }

  let osQuery = supabase
    .from("service_orders")
    .select("id, service_name, order_number")
    .not("status", "in", "(cancelado,concluido)")
    .not("starts_at", "is", null)
    .lt("starts_at", endsIso)
    .gt("ends_at", startsIso)
    .limit(1);
  if (opts.excludeOrderId) osQuery = osQuery.neq("id", opts.excludeOrderId);
  const { data: osConflicts, error: osErr } = await osQuery;
  if (osErr) throw new Error(osErr.message);
  if (osConflicts && osConflicts.length > 0) {
    return {
      conflict: true,
      reason: `A equipe já está ocupada com a OS #${String(osConflicts[0].order_number).padStart(4, "0")} (${osConflicts[0].service_name}) nesse horário.`,
    };
  }

  return { conflict: false };
}
