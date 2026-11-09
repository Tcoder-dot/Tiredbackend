// Vercel Serverless Function Proxy for Floate Search API
export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { query, location, budget } = req.body || {};

    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ success: false, error: "Parameter 'query' is required." });
    }

    const apiKey = process.env.FLOATE_SEARCH_API_KEY || process.env.FLOATE_API_KEY || "floate_live_sk_7f8a92b3c4e5d6";
    const backendBase = (
      process.env.FLOATE_BACKEND_URL ||
      process.env.VITE_FLOATE_BACKEND_URL ||
      process.env.NEXT_PUBLIC_FLOATE_BACKEND_URL ||
      ""
    ).replace(/\/+$/, "");
    const externalApiUrl = `${backendBase}/api/search`;

    const cleanQuery = query.trim();
    const payload: Record<string, string> = { query: cleanQuery };
    if (location) payload.location = location;
    if (budget) payload.budget = budget;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    try {
      const response = await fetch(externalApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const responseText = await response.text();

      if (response.ok && responseText && !responseText.trim().startsWith("<")) {
        try {
          const externalData = JSON.parse(responseText);
          return res.status(200).json({
            success: true,
            data: externalData
          });
        } catch (e) {
          console.warn("External API returned non-JSON:", responseText.slice(0, 100));
        }
      }
    } catch (fetchErr: any) {
      clearTimeout(timeoutId);
      console.warn("Serverless search proxy fetch error:", fetchErr?.message);
    }

    return res.status(502).json({
      success: false,
      error: "Search service is temporarily unavailable."
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: "Failed to query Floate Search API",
      details: error?.message
    });
  }
}
