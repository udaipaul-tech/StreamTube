-- Replace broken Google CDN video URLs with working public MP4s
UPDATE public.videos SET
  video_url = 'https://www.w3schools.com/html/mov_bbb.mp4',
  thumbnail_url = 'https://peach.blender.org/wp-content/uploads/bbb-splash.png',
  duration_seconds = 10
WHERE title = 'Big Buck Bunny';

UPDATE public.videos SET
  video_url = 'https://www.w3schools.com/html/movie.mp4',
  thumbnail_url = 'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=640&q=80',
  duration_seconds = 14
WHERE title = 'Elephants Dream';

UPDATE public.videos SET
  video_url = 'https://samplelib.com/lib/preview/mp4/sample-5s.mp4',
  thumbnail_url = 'https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=640&q=80',
  duration_seconds = 5
WHERE title = 'For Bigger Blazes';

UPDATE public.videos SET
  video_url = 'https://filesamples.com/samples/video/mp4/sample_640x360.mp4',
  thumbnail_url = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=640&q=80',
  duration_seconds = 30
WHERE title = 'Sintel';

UPDATE public.videos SET
  video_url = 'https://samplelib.com/lib/preview/mp4/sample-5s.mp4',
  thumbnail_url = 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=640&q=80',
  duration_seconds = 5
WHERE title = 'Tears of Steel';
