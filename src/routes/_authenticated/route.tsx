import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { AppointmentReminder } from "@/components/AppointmentReminder";
import { OnlineBookingNotifier } from "@/components/OnlineBookingNotifier";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      // Cliente digitou /agenda por engano → manda para a agenda pública
      if (location.pathname === "/agenda" || location.pathname.startsWith("/agenda/")) {
        throw redirect({ to: "/agendar" });
      }
      // Qualquer outra página interna → login
      throw redirect({ to: "/auth" });
    }

    return { user: data.user };
  },
  component: () => (
    <AppShell>
      <Outlet />
      <AppointmentReminder />
      <OnlineBookingNotifier />
    </AppShell>
  ),
});