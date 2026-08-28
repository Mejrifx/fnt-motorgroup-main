-- =====================================================
-- Migration 018: allow proof-of-work photos in the invoices bucket
-- =====================================================
--
-- TNT service invoices can carry a proof-of-work page built from photos of the
-- job. The photos are kept under tnt-proof/<invoice number>/ in the same private
-- invoices bucket, so that editing an invoice can rebuild its PDF, and so the
-- reference printed on the page can be checked against the images it came from.
--
-- The bucket was created accepting application/pdf only, which rejects those
-- uploads, so JPEG is added here.
--
-- Note this deliberately leaves `public` alone: the bucket is private and reads
-- go through short-lived signed URLs.
-- =====================================================

UPDATE storage.buckets
SET allowed_mime_types = ARRAY['application/pdf', 'image/jpeg']
WHERE id = 'invoices';

-- Verify
SELECT id, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id = 'invoices';
