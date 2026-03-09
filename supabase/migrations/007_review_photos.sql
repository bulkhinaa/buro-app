-- =============================================
-- Add photo_urls to reviews table
-- =============================================

ALTER TABLE reviews ADD COLUMN photo_urls TEXT[] NOT NULL DEFAULT '{}';
