-- Add more videos with working public MP4 URLs and Unsplash thumbnails
INSERT INTO public.videos (title, description, video_url, thumbnail_url, duration_seconds) VALUES

-- Fix existing broken URLs first
('Big Buck Bunny', 'A giant rabbit with a big heart gets revenge on three bullying rodents. Open-source animated short by Blender Foundation.', 'https://www.w3schools.com/html/mov_bbb.mp4', 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=640&q=80', 10),
('Elephants Dream', 'The first open movie from the Blender Foundation. A surreal journey through a mechanical world.', 'https://www.w3schools.com/html/movie.mp4', 'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=640&q=80', 14),

-- New videos
('Nature Walk', 'A peaceful walk through lush green forests and scenic trails.', 'https://samplelib.com/lib/preview/mp4/sample-5s.mp4', 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=640&q=80', 5),
('City Timelapse', 'Stunning timelapse of a modern city from dawn to dusk.', 'https://samplelib.com/lib/preview/mp4/sample-10s.mp4', 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=640&q=80', 10),
('Ocean Waves', 'Relaxing footage of ocean waves crashing on a sandy beach.', 'https://samplelib.com/lib/preview/mp4/sample-15s.mp4', 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=640&q=80', 15),
('Mountain Sunrise', 'Breathtaking sunrise over snow-capped mountain peaks.', 'https://samplelib.com/lib/preview/mp4/sample-20s.mp4', 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=640&q=80', 20),
('Coding Tutorial', 'Learn the basics of web development in this beginner-friendly tutorial.', 'https://filesamples.com/samples/video/mp4/sample_640x360.mp4', 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=640&q=80', 30),
('Street Food Tour', 'Exploring the best street food spots in a vibrant Asian market.', 'https://samplelib.com/lib/preview/mp4/sample-5s.mp4', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=640&q=80', 5),
('Space Documentary', 'Journey through the cosmos — stars, galaxies, and black holes explained.', 'https://samplelib.com/lib/preview/mp4/sample-10s.mp4', 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=640&q=80', 10),
('Yoga Morning Routine', 'Start your day with this calming 15-minute yoga flow for beginners.', 'https://samplelib.com/lib/preview/mp4/sample-15s.mp4', 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=640&q=80', 15),
('Guitar Lesson', 'Learn your first 5 chords on acoustic guitar — perfect for beginners.', 'https://samplelib.com/lib/preview/mp4/sample-20s.mp4', 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=640&q=80', 20),
('Wildlife Safari', 'Up close with lions, elephants, and zebras on the African savanna.', 'https://filesamples.com/samples/video/mp4/sample_640x360.mp4', 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=640&q=80', 30),
('Cooking Masterclass', 'Chef Marco shows you how to make authentic Italian pasta from scratch.', 'https://samplelib.com/lib/preview/mp4/sample-5s.mp4', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=640&q=80', 5),
('Travel Vlog Tokyo', 'Three days in Tokyo — temples, ramen, and neon lights.', 'https://samplelib.com/lib/preview/mp4/sample-10s.mp4', 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=640&q=80', 10),
('Drone Footage Iceland', 'Aerial views of Iceland''s volcanoes, waterfalls, and glaciers.', 'https://samplelib.com/lib/preview/mp4/sample-15s.mp4', 'https://images.unsplash.com/photo-1476610182048-b716b8518aae?w=640&q=80', 15)

ON CONFLICT DO NOTHING;

-- Also fix the existing broken Google CDN URLs
UPDATE public.videos SET video_url = 'https://www.w3schools.com/html/mov_bbb.mp4'
WHERE video_url LIKE '%commondatastorage.googleapis.com%' AND title = 'Big Buck Bunny';

UPDATE public.videos SET video_url = 'https://www.w3schools.com/html/movie.mp4'
WHERE video_url LIKE '%commondatastorage.googleapis.com%' AND title = 'Elephants Dream';

UPDATE public.videos SET video_url = 'https://samplelib.com/lib/preview/mp4/sample-5s.mp4'
WHERE video_url LIKE '%commondatastorage.googleapis.com%' AND title = 'For Bigger Blazes';

UPDATE public.videos SET video_url = 'https://filesamples.com/samples/video/mp4/sample_640x360.mp4'
WHERE video_url LIKE '%commondatastorage.googleapis.com%' AND title = 'Sintel';

UPDATE public.videos SET video_url = 'https://samplelib.com/lib/preview/mp4/sample-5s.mp4'
WHERE video_url LIKE '%commondatastorage.googleapis.com%' AND title = 'Tears of Steel';
