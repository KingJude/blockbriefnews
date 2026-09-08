const FEEDS = [
  { name: "CoinDesk", url: "https://www.coindesk.com/arc/outboundfeeds/rss/" },
  { name: "Decrypt", url: "https://decrypt.co/feed" },
  { name: "Cointelegraph", url: "https://cointelegraph.com/rss" }
];

function decodeEntities(value = "") {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#x2F;/gi, "/")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

function stripHtml(value = "") {
  return decodeEntities(value)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tagValue(block, tags) {
  for (const tag of tags) {
    const escaped = tag.replace(":", "\\:");
    const paired = new RegExp(`<${escaped}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${escaped}>`, "i");
    const match = block.match(paired);
    if (match) return decodeEntities(match[1]).trim();
  }
  return "";
}

function atomLink(block) {
  const match = block.match(/<link[^>]+href=["']([^"']+)["'][^>]*>/i);
  return match ? decodeEntities(match[1]).trim() : "";
}

function parseFeed(xml, source) {
  const items = [];
  const rssItems = xml.match(/<item\b[\s\S]*?<\/item>/gi) || [];
  const atomEntries = xml.match(/<entry\b[\s\S]*?<\/entry>/gi) || [];
  const blocks = rssItems.length ? rssItems : atomEntries;

  for (const block of blocks.slice(0, 20)) {
    const title = stripHtml(tagValue(block, ["title"]));
    let link = stripHtml(tagValue(block, ["link", "guid"]));
    if (!link && atomEntries.length) link = atomLink(block);
    const description = stripHtml(tagValue(block, ["description", "content:encoded", "content", "summary"]));
    const pubDate = stripHtml(tagValue(block, ["pubDate", "dc:date", "published", "updated"]));

    if (!title || !link || !/^https?:\/\//i.test(link)) continue;

    items.push({
      source,
      title,
      description,
      link,
      pubDate: pubDate || new Date().toISOString()
    });
  }

  return items;
}

function categoryFor(title, description) {
  const text = `${title} ${description}`.toLowerCase();
  if (/\bsolana\b|\bsol\b/.test(text)) return "solana";
  if (/\bethereum\b|\beth\b/.test(text)) return "ethereum";
  if (/\bbitcoin\b|\bbtc\b/.test(text)) return "bitcoin";
  if (/\bsec\b|\bcftc\b|regulat|policy|congress|senate|court|law|etf/.test(text)) return "regulation";
  return "markets";
}

async function fetchFeed(feed) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(feed.url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "BlockBrief/1.0 (+https://blockbriefnews.com)",
        "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml, */*"
      }
    });

    if (!response.ok) throw new Error(`${feed.name} returned ${response.status}`);
    const xml = await response.text();
    return parseFeed(xml, feed.name);
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=180, stale-while-revalidate=600");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const settled = await Promise.allSettled(FEEDS.map(fetchFeed));
  const merged = [];
  const errors = [];

  settled.forEach((result, index) => {
    if (result.status === "fulfilled") merged.push(...result.value);
    else errors.push(`${FEEDS[index].name}: ${result.reason?.message || "feed unavailable"}`);
  });

  const seen = new Set();
  const items = merged
    .map(item => ({ ...item, category: categoryFor(item.title, item.description) }))
    .filter(item => {
      const key = item.title.toLowerCase().replace(/\s+/g, " ").trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
    .slice(0, 36);

  res.status(items.length ? 200 : 502).json({
    ok: items.length > 0,
    updatedAt: new Date().toISOString(),
    count: items.length,
    items,
    errors
  });
};
