import { supabase } from "@/integrations/supabase/client";

/**
 * Retorna true se o usuário atual pode ver páginas administrativas
 * (financeiro, relatórios, funcionários). Contas sem registro em
 * user_roles (usuários antigos, anteriores a esse recurso) são
 * tratadas como admin — só quem tem role explícito "colaborador"
 * é bloqueado.
 */
export async function requireAdmin(): Promise<boolean> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return false;
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle();
  return data?.role !== "colaborador";
}
