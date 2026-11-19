
-- 1) Restrict user_roles writes to admins only (prevent privilege escalation)
CREATE POLICY "Only admins can insert roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update roles" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete roles" ON public.user_roles
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 2) Lock down has_role SECURITY DEFINER execution: only usable within RLS policies as authenticated
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;

-- 3) Replace overly permissive USING(true) / WITH CHECK(true) policies with authenticated-scoped checks
DROP POLICY IF EXISTS "Clients insertable by team" ON public.clients;
DROP POLICY IF EXISTS "Clients updatable by team" ON public.clients;
CREATE POLICY "Clients insertable by team" ON public.clients
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Clients updatable by team" ON public.clients
  FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Vehicles insertable by team" ON public.vehicles;
DROP POLICY IF EXISTS "Vehicles updatable by team" ON public.vehicles;
CREATE POLICY "Vehicles insertable by team" ON public.vehicles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Vehicles updatable by team" ON public.vehicles
  FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Catalog insertable by team" ON public.service_catalog;
DROP POLICY IF EXISTS "Catalog updatable by team" ON public.service_catalog;
CREATE POLICY "Catalog insertable by team" ON public.service_catalog
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Catalog updatable by team" ON public.service_catalog
  FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Appointments insertable by team" ON public.appointments;
DROP POLICY IF EXISTS "Appointments updatable by team" ON public.appointments;
CREATE POLICY "Appointments insertable by team" ON public.appointments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Appointments updatable by team" ON public.appointments
  FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Orders insertable by team" ON public.service_orders;
DROP POLICY IF EXISTS "Orders updatable by team" ON public.service_orders;
CREATE POLICY "Orders insertable by team" ON public.service_orders
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Orders updatable by team" ON public.service_orders
  FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Photos insertable by team" ON public.service_photos;
DROP POLICY IF EXISTS "Photos updatable by team" ON public.service_photos;
DROP POLICY IF EXISTS "Photos deletable by team" ON public.service_photos;
CREATE POLICY "Photos insertable by team" ON public.service_photos
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Photos updatable by team" ON public.service_photos
  FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Photos deletable by team" ON public.service_photos
  FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);
