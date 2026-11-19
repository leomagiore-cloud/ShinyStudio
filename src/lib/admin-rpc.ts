import { supabase } from "@/integrations/supabase/client";

// As funções abaixo foram criadas via migration no Supabase mas ainda não
// estão no types.ts gerado (rode a geração de types do Supabase para
// remover os `as any`). Até lá, os casts ficam centralizados aqui.
const rpc = supabase.rpc.bind(supabase) as (fn: string, args?: Record<string, unknown>) => any;

/** Define/atualiza o PIN de exclusão do estúdio. Somente admin pode chamar. */
export async function setAdminPin(pin: string) {
  const { error } = await rpc("set_admin_pin", { p_pin: pin });
  if (error) throw error;
}

/** Exclui um cliente. Admin não precisa de PIN; colaborador precisa. */
export async function adminDeleteClient(id: string, pin?: string | null) {
  const { error } = await rpc("admin_delete_client", { p_client_id: id, p_pin: pin ?? null });
  if (error) throw error;
}

/** Exclui uma O.S. Admin não precisa de PIN; colaborador precisa. */
export async function adminDeleteServiceOrder(id: string, pin?: string | null) {
  const { error } = await rpc("admin_delete_service_order", { p_order_id: id, p_pin: pin ?? null });
  if (error) throw error;
}

/** Exclui um agendamento. Admin não precisa de PIN; colaborador precisa. */
export async function adminDeleteAppointment(id: string, pin?: string | null) {
  const { error } = await rpc("admin_delete_appointment", { p_appointment_id: id, p_pin: pin ?? null });
  if (error) throw error;
}
