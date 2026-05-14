
DROP POLICY IF EXISTS "avatars public read" ON storage.objects;
-- No SELECT policy on storage.objects for avatars: public CDN still serves
-- files directly (bucket is public), but the API cannot enumerate the bucket.
