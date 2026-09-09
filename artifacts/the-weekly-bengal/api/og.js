export default async function handler(req, res) {
  const { id } = req.query;

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

  let title = "The Weekly Bengal";
  let description = "সত্যের পাশে, মানুষের কাছে";
  let imageUrl = "https://images.pexels.com/photos/2403851/pexels-photo-2403851.jpeg";

  if (SUPABASE_URL && SUPABASE_KEY && id) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/news?id=eq.${id}&select=title,excerpt,image_url`, {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      });
      const data = await response.json();
      if (data && data[0]) {
        title = data[0].title;
        description = data[0].excerpt || description;
        imageUrl = data[0].image_url || imageUrl;
      }
    } catch (e) {
      console.error(e);
    }
  }

  const html = `<!DOCTYPE html>
  <html lang="bn">
    <head>
      <meta charset="utf-8" />
      <title>${title}</title>
      <meta property="og:type" content="article" />
      <meta property="og:title" content="${title}" />
      <meta property="og:description" content="${description}" />
      <meta property="og:image" content="${imageUrl}" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="${title}" />
      <meta name="twitter:description" content="${description}" />
      <meta name="twitter:image" content="${imageUrl}" />
    </head>
    <body>
      <script>
        window.location.href = '/article/${id}';
      </script>
    </body>
  </html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(html);
}
