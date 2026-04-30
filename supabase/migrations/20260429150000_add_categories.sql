-- Add category column to videos
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'all';

-- Update existing videos with categories
UPDATE public.videos SET category = 'music'    WHERE title IN ('Guitar Lesson');
UPDATE public.videos SET category = 'gaming'   WHERE title IN ('Coding Tutorial');
UPDATE public.videos SET category = 'news'     WHERE title IN ('Space Documentary', 'City Timelapse');
UPDATE public.videos SET category = 'sports'   WHERE title IN ('Yoga Morning Routine', 'Wildlife Safari');
UPDATE public.videos SET category = 'learning' WHERE title IN ('Coding Tutorial', 'Guitar Lesson', 'Yoga Morning Routine');
UPDATE public.videos SET category = 'travel'   WHERE title IN ('Travel Vlog Tokyo', 'Drone Footage Iceland', 'Nature Walk', 'Mountain Sunrise');
UPDATE public.videos SET category = 'food'     WHERE title IN ('Street Food Tour', 'Cooking Masterclass');
UPDATE public.videos SET category = 'shorts'   WHERE duration_seconds <= 15;

-- Insert categorised videos for each menu
INSERT INTO public.videos (title, description, video_url, thumbnail_url, duration_seconds, category) VALUES

-- Music
('Piano Basics', 'Learn your first piano scales and chords in this beginner lesson.', 'https://samplelib.com/lib/preview/mp4/sample-10s.mp4', 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=640&q=80', 10, 'music'),
('Drum Tutorial', 'Master the basic drum beat patterns used in pop and rock music.', 'https://samplelib.com/lib/preview/mp4/sample-15s.mp4', 'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=640&q=80', 15, 'music'),
('Violin for Beginners', 'Start your violin journey with proper posture and bow technique.', 'https://samplelib.com/lib/preview/mp4/sample-20s.mp4', 'https://images.unsplash.com/photo-1465821185615-20b3c2fbf41b?w=640&q=80', 20, 'music'),
('DJ Mixing Basics', 'Learn how to mix tracks like a pro DJ using free software.', 'https://filesamples.com/samples/video/mp4/sample_640x360.mp4', 'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=640&q=80', 30, 'music'),

-- Gaming
('Minecraft Survival Guide', 'Everything you need to survive your first night in Minecraft.', 'https://samplelib.com/lib/preview/mp4/sample-10s.mp4', 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=640&q=80', 10, 'gaming'),
('Chess Strategy', 'Top 5 opening moves every chess player should know.', 'https://samplelib.com/lib/preview/mp4/sample-15s.mp4', 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=640&q=80', 15, 'gaming'),
('Mobile Gaming Tips', 'Improve your mobile gaming performance with these pro settings.', 'https://samplelib.com/lib/preview/mp4/sample-20s.mp4', 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=640&q=80', 20, 'gaming'),
('Game Dev Intro', 'Build your first 2D game in Unity — complete beginner guide.', 'https://filesamples.com/samples/video/mp4/sample_640x360.mp4', 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=640&q=80', 30, 'gaming'),

-- News
('Tech News Weekly', 'This week in technology — AI breakthroughs, new gadgets, and more.', 'https://samplelib.com/lib/preview/mp4/sample-10s.mp4', 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=640&q=80', 10, 'news'),
('Climate Update', 'Latest developments in climate science and renewable energy.', 'https://samplelib.com/lib/preview/mp4/sample-15s.mp4', 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=640&q=80', 15, 'news'),
('World Headlines', 'Top stories from around the globe this week.', 'https://samplelib.com/lib/preview/mp4/sample-20s.mp4', 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=640&q=80', 20, 'news'),

-- Sports
('Football Skills', 'Master dribbling, passing, and shooting with these drills.', 'https://samplelib.com/lib/preview/mp4/sample-10s.mp4', 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=640&q=80', 10, 'sports'),
('Swimming Technique', 'Improve your freestyle stroke with these professional tips.', 'https://samplelib.com/lib/preview/mp4/sample-15s.mp4', 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=640&q=80', 15, 'sports'),
('Cricket Batting Tips', 'Improve your batting stance and shot selection.', 'https://samplelib.com/lib/preview/mp4/sample-20s.mp4', 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=640&q=80', 20, 'sports'),
('Marathon Training', 'A 12-week plan to run your first marathon successfully.', 'https://filesamples.com/samples/video/mp4/sample_640x360.mp4', 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=640&q=80', 30, 'sports'),

-- Learning
('Python in 30 Minutes', 'Get started with Python programming — variables, loops, and functions.', 'https://samplelib.com/lib/preview/mp4/sample-10s.mp4', 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=640&q=80', 10, 'learning'),
('Public Speaking Tips', 'Overcome stage fright and deliver confident presentations.', 'https://samplelib.com/lib/preview/mp4/sample-15s.mp4', 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=640&q=80', 15, 'learning'),
('History of India', 'A concise overview of Indian history from ancient times to independence.', 'https://samplelib.com/lib/preview/mp4/sample-20s.mp4', 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=640&q=80', 20, 'learning'),
('Math Made Easy', 'Algebra fundamentals explained simply for students of all ages.', 'https://filesamples.com/samples/video/mp4/sample_640x360.mp4', 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=640&q=80', 30, 'learning'),

-- Fashion
('Summer Outfit Ideas', 'Style your summer wardrobe with these trendy outfit combinations.', 'https://samplelib.com/lib/preview/mp4/sample-10s.mp4', 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=640&q=80', 10, 'fashion'),
('Sustainable Fashion', 'How to build an eco-friendly wardrobe on any budget.', 'https://samplelib.com/lib/preview/mp4/sample-15s.mp4', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=640&q=80', 15, 'fashion'),
('Skincare Routine', 'A simple morning and evening skincare routine for glowing skin.', 'https://samplelib.com/lib/preview/mp4/sample-20s.mp4', 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=640&q=80', 20, 'fashion'),
('Men''s Style Guide', 'Essential wardrobe pieces every man should own.', 'https://filesamples.com/samples/video/mp4/sample_640x360.mp4', 'https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=640&q=80', 30, 'fashion'),

-- Shorts (≤15s)
('Quick Recipe', 'Make a delicious omelette in under 60 seconds.', 'https://samplelib.com/lib/preview/mp4/sample-5s.mp4', 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=640&q=80', 5, 'shorts'),
('Life Hack', 'This simple trick will save you 10 minutes every morning.', 'https://samplelib.com/lib/preview/mp4/sample-5s.mp4', 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=640&q=80', 5, 'shorts'),
('Funny Moment', 'When your code finally works after 3 hours of debugging.', 'https://samplelib.com/lib/preview/mp4/sample-5s.mp4', 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=640&q=80', 5, 'shorts'),
('Motivational Quote', 'Start your day with this powerful 5-second reminder.', 'https://samplelib.com/lib/preview/mp4/sample-5s.mp4', 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=640&q=80', 5, 'shorts')

ON CONFLICT DO NOTHING;
