
CREATE POLICY "Authenticated read service photos" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'service-photos');
CREATE POLICY "Authenticated upload service photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'service-photos');
CREATE POLICY "Authenticated update service photos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'service-photos');
CREATE POLICY "Authenticated delete service photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'service-photos');
