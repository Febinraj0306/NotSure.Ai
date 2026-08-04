import axios from 'axios';

/**
 * Extracts the core claim from a longer message for better search queries.
 */
function extractCoreQuery(text) {
  // Trim and take first 200 chars to form a focused query
  const trimmed = text.trim().substring(0, 200);
  // Remove common WhatsApp forward prefixes
  return trimmed
    .replace(/^(fw|fwd|forward|forwarded)[:\s]+/i, '')
    .replace(/^please (share|forward|send).+?[:.\n]/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Search using Tavily API (preferred) or Serper API as fallback.
 * Returns array of { title, url, snippet } objects.
 */
export async function searchWeb(claimText) {
  const query = extractCoreQuery(claimText);

  // Try Tavily first
  if (process.env.TAVILY_API_KEY) {
    return await searchTavily(query);
  }

  // Try Serper as fallback
  if (process.env.SERPER_API_KEY) {
    return await searchSerper(query);
  }

  // No search API configured — return empty so Claude uses its own knowledge
  console.warn('[searchService] No search API key configured. Claude will reason without live sources.');
  return [];
}

async function searchTavily(query) {
  try {
    const response = await axios.post(
      'https://api.tavily.com/search',
      {
        api_key: process.env.TAVILY_API_KEY,
        query,
        search_depth: 'basic',
        max_results: 5,
        include_answer: false,
        include_raw_content: false
      },
      { timeout: 8000 }
    );

    const results = response.data?.results || [];
    return results.map(r => ({
      title: r.title || 'Source',
      url: r.url || '',
      snippet: r.content || r.snippet || ''
    }));
  } catch (err) {
    console.error('[searchService] Tavily error:', err.message);
    return [];
  }
}

async function searchSerper(query) {
  try {
    const response = await axios.post(
      'https://google.serper.dev/search',
      { q: query, num: 5 },
      {
        headers: {
          'X-API-KEY': process.env.SERPER_API_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 8000
      }
    );

    const organic = response.data?.organic || [];
    const knowledgeGraph = response.data?.knowledgeGraph;
    const results = [];

    if (knowledgeGraph?.description) {
      results.push({
        title: knowledgeGraph.title || 'Knowledge Graph',
        url: knowledgeGraph.website || '',
        snippet: knowledgeGraph.description
      });
    }

    organic.forEach(r => {
      results.push({
        title: r.title || 'Source',
        url: r.link || '',
        snippet: r.snippet || ''
      });
    });

    return results.slice(0, 5);
  } catch (err) {
    console.error('[searchService] Serper error:', err.message);
    return [];
  }
}
