-- Fix all video thumbnails to working public URLs
UPDATE public.videos SET thumbnail_url =
  CASE title
    WHEN 'Big Buck Bunny'    THEN 'https://peach.blender.org/wp-content/uploads/bbb-splash.png'
    WHEN 'Elephants Dream'   THEN 'https://orange.blender.org/wp-content/uploads/elephants-dream-poster.jpg'
    WHEN 'Sintel'            THEN 'https://durian.blender.org/wp-content/uploads/2010/09/sintel-poster.jpg'
    WHEN 'Tears of Steel'    THEN 'https://mango.blender.org/wp-content/uploads/2013/05/01_thom_celia_bridge.jpg'
    WHEN 'For Bigger Blazes' THEN 'https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=640&q=80'
    ELSE thumbnail_url
  END
WHERE title IN ('Big Buck Bunny','Elephants Dream','Sintel','Tears of Steel','For Bigger Blazes');
