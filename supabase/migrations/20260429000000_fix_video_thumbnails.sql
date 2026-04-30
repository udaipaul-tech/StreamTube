-- Update video thumbnails to working public domain image URLs
UPDATE public.videos
SET thumbnail_url = CASE title
  WHEN 'Big Buck Bunny'   THEN 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Big_buck_bunny_poster_big.jpg/800px-Big_buck_bunny_poster_big.jpg'
  WHEN 'Elephants Dream'  THEN 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Elephants_Dream_s5_both.jpg/800px-Elephants_Dream_s5_both.jpg'
  WHEN 'Sintel'           THEN 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Sintel_poster.jpg/800px-Sintel_poster.jpg'
  WHEN 'Tears of Steel'   THEN 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Tears_of_Steel_poster.jpg/800px-Tears_of_Steel_poster.jpg'
  WHEN 'For Bigger Blazes' THEN 'https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=640&q=80'
  ELSE thumbnail_url
END
WHERE title IN ('Big Buck Bunny','Elephants Dream','Sintel','Tears of Steel','For Bigger Blazes');
