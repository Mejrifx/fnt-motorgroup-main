-- Database Update for Image Upload Functionality
-- This SQL adds image storage support to your existing cars table
-- Run this in your Supabase SQL Editor

-- 1. Create a storage bucket for car images (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public)
VALUES ('car-images', 'car-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Add new columns to the cars table for image storage paths
-- These columns will store the file paths in Supabase Storage
ALTER TABLE cars 
ADD COLUMN IF NOT EXISTS cover_image_path TEXT,
ADD COLUMN IF NOT EXISTS gallery_image_paths TEXT[] DEFAULT '{}';

-- 3. Create a policy to allow authenticated users to upload images
CREATE POLICY "Allow authenticated users to upload car images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'car-images' 
  AND auth.role() = 'authenticated'
);

-- 4. Create a policy to allow public access to view car images
CREATE POLICY "Allow public access to view car images" ON storage.objects
FOR SELECT USING (bucket_id = 'car-images');

-- 5. Create a policy to allow authenticated users to update/delete their own images
CREATE POLICY "Allow authenticated users to update car images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'car-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated users to delete car images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'car-images' 
  AND auth.role() = 'authenticated'
);

-- 6. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cars_cover_image_path ON cars(cover_image_path);
CREATE INDEX IF NOT EXISTS idx_cars_gallery_image_paths ON cars USING GIN(gallery_image_paths);

-- 7. Optional: Add a function to automatically generate unique file names
CREATE OR REPLACE FUNCTION generate_car_image_filename(car_id UUID, file_extension TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN 'cars/' || car_id::TEXT || '/' || extract(epoch from now())::TEXT || '.' || file_extension;
END;
$$ LANGUAGE plpgsql;

-- 8. Optional: Add a trigger to clean up old images when a car is deleted
CREATE OR REPLACE FUNCTION cleanup_car_images()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete cover image
  IF OLD.cover_image_path IS NOT NULL THEN
    DELETE FROM storage.objects 
    WHERE bucket_id = 'car-images' AND name = OLD.cover_image_path;
  END IF;
  
  -- Delete gallery images
  IF OLD.gallery_image_paths IS NOT NULL AND array_length(OLD.gallery_image_paths, 1) > 0 THEN
    DELETE FROM storage.objects 
    WHERE bucket_id = 'car-images' AND name = ANY(OLD.gallery_image_paths);
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cleanup_car_images_trigger
  BEFORE DELETE ON cars
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_car_images();

-- Success message
SELECT 'Database updated successfully! Image upload functionality is now ready.' as message;
