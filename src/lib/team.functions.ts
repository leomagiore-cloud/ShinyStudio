import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const createSchema = z.object({
  access_token: z.string(),
  email: z.string().trim().email(),
  password: z.string().min(6),
  name: z.string().trim().min(2).max(120),
});

/**
 * Cria um login de colaborador (só cadastra clientes, cria O.S e agendamentos —
 * sem acesso a financeiro/relatórios/funcionários, e sem excluir nada sem o PIN).
 * Só um admin autenticado pode chamar isso.
 */
export const createEmployeeAccount = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => createSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: callerData, error: callerErr } = await supabaseAdmin.auth.getUser(data.access_token);
    if (callerErr || !callerData.user) throw new Error("Sessão inválida — faça login novamente.");

    const { data: callerRole } = await supabaseAdmin
      .from("user_roles").select("role").eq("user_id", callerData.user.id).maybeSingle();
    if (callerRole?.role === "colaborador") throw new Error("Apenas administradores podem criar acessos de equipe.");

    const { data: callerProfile } = await supabaseAdmin
      .from("profiles").select("studio_id").eq("id", callerData.user.id).maybeSingle();
    if (!callerProfile?.studio_id) throw new Error("Estúdio do administrador não encontrado.");
    const studioId = callerProfile.studio_id;

    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.name },
    });
    if (createErr) throw new Error(createErr.message);
    const newUserId = created.user!.id;

    // O trigger de novo usuário cria um estúdio novo automaticamente — desfazemos isso
    // movendo o funcionário pro estúdio do admin e removendo o estúdio órfão.
    const { data: autoProfile } = await supabaseAdmin
      .from("profiles").select("studio_id").eq("id", newUserId).maybeSingle();
    const orphanStudioId = autoProfile?.studio_id;

    await supabaseAdmin.from("profiles").update({ studio_id: studioId, full_name: data.name }).eq("id", newUserId);
    await supabaseAdmin.from("user_roles").update({ role: "colaborador" }).eq("user_id", newUserId);

    if (orphanStudioId && orphanStudioId !== studioId) {
      await supabaseAdmin.from("service_catalog").delete().eq("studio_id", orphanStudioId);
      await supabaseAdmin.from("studios").delete().eq("id", orphanStudioId);
    }

    return { ok: true };
  });

const revokeSchema = z.object({
  access_token: z.string(),
  target_user_id: z.string().uuid(),
});

/** Remove por completo o login de um colaborador. Só admin pode chamar. */
export const revokeEmployeeAccess = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => revokeSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: callerData, error: callerErr } = await supabaseAdmin.auth.getUser(data.access_token);
    if (callerErr || !callerData.user) throw new Error("Sessão inválida — faça login novamente.");

    const { data: callerRole } = await supabaseAdmin
      .from("user_roles").select("role").eq("user_id", callerData.user.id).maybeSingle();
    if (callerRole?.role === "colaborador") throw new Error("Apenas administradores podem remover acessos.");
    if (data.target_user_id === callerData.user.id) throw new Error("Você não pode remover o próprio acesso.");

    const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(data.target_user_id);
    if (delErr) throw new Error(delErr.message);

    return { ok: true };
  });
