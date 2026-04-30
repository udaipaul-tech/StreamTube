-- Fix broken thumbnail URLs for seeded videos
UPDATE public.videos SET thumbnail_url = NULL WHERE thumbnail_url LIKE '%commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/%';
