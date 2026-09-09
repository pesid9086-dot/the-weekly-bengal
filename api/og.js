export default async function handler(req, res) {
  const { id } = req.query;

  let title = "The Weekly Bengal";
  let description = "সত্যের পাশে, মানুষের কাছে — ঢাকার নির্ভরযোগ্য সাপ্তাহিক সংবাদপত্র";
  let imageUrl = "https://images.pexels.com/photos/2403851/pexels-photo-2403851.jpeg?auto=compress&cs=tinysrgb&w=1200";

  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;

  if (id && url && key) {
    try {
      const response = await fetch(`${url}/rest/v1/news?id=eq.${encodeURIComponent(id)}&select=*`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` }
      });
      const data = await response.json();
      if (data && data.length > 0) {
        title = data[0].title || title;
        description = data[0].excerpt || description;
        imageUrl = data[0].image_url || imageUrl;
      }
    } catch (e) {}
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(`<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="The Weekly Bengal" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${imageUrl}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:url" content="https://${req.headers.host}/article/${id}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${imageUrl}" />
  <meta http-equiv="refresh" content="0;url=/article/${id}" />
</head>
<body>
  <h1>${title}</h1>
  <p>${description}</p>
  <img src="${imageUrl}" alt="${title}" />
</body>
</html>`);
}
