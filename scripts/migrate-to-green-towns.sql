
-- Migration script: Move data from impact_stories to Green Towns Initiative tables
-- Run this in your Supabase SQL Editor AFTER creating the tables

-- 1. Migrate Water Source stories (category = 'water')
INSERT INTO water_source_gallery (
  spring_name,
  media_url,
  media_type,
  story,
  display_order,
  is_active,
  created_at,
  updated_at
)
SELECT 
  title as spring_name,
  CASE 
    WHEN media_urls IS NOT NULL AND array_length(media_urls, 1) > 0 
    THEN media_urls[1]
    ELSE ''
  END as media_url,
  'image' as media_type,
  text as story,
  display_order,
  is_published as is_active,
  created_at,
  updated_at
FROM impact_stories
WHERE category = 'water';

-- 2. Migrate school/beautification stories to Green Champions
-- (Since there's no 'green_champions' category in impact_stories, 
-- we'll migrate 'beautification' or 'food_security' stories that look like school stories)
INSERT INTO green_champions_gallery (
  school_name,
  media_url,
  story,
  display_order,
  is_active,
  created_at,
  updated_at
)
SELECT 
  title as school_name,
  CASE 
    WHEN media_urls IS NOT NULL AND array_length(media_urls, 1) > 0 
    THEN media_urls[1]
    ELSE ''
  END as media_url,
  text as story,
  display_order,
  is_published as is_active,
  created_at,
  updated_at
FROM impact_stories
WHERE category IN ('beautification', 'food_security');

-- 3. Verify the migration
SELECT 
  'Water Sources Migrated' as table_name,
  COUNT(*) as count
FROM water_source_gallery
UNION ALL
SELECT 
  'Green Champions Migrated' as table_name,
  COUNT(*) as count
FROM green_champions_gallery;

-- 4. Show what was in the original table
SELECT 
  category,
  COUNT(*) as story_count,
  string_agg(title, ', ') as titles
FROM impact_stories
GROUP BY category;
