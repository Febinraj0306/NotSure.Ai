import { GoogleGenerativeAI } from '@google/generative-ai';

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_PROMPT = `You are TruthCheck, an expert misinformation analyst. Your job is to evaluate claims from WhatsApp forwards and social media posts.

You will be given:
1. The claim/message to check
2. Web search results (if available) with real sources

YOUR TASK:
- Analyze the claim against the provided search results and your knowledge
- Determine if the claim is true, false, misleading, or unverifiable
- Provide clear reasoning that a non-expert can understand
- Identify the best sources

VERDICT DEFINITIONS:
- TRUE: Claim is accurate and well-supported by evidence
- FALSE: Claim is factually incorrect, proven wrong by evidence  
- MISLEADING: Contains some truth but omits context, exaggerates, or frames facts deceptively
- UNVERIFIED: Cannot be confirmed or denied with available evidence

You MUST respond with ONLY valid JSON, no preamble, no markdown, no explanation outside the JSON:
{
  "verdict": "TRUE" | "FALSE" | "MISLEADING" | "UNVERIFIED",
  "confidence": <number 0-100>,
  "reasoning": "<2-3 sentences in plain English explaining the verdict, mention specific evidence>",
  "sources": [{"title": "<source title>", "url": "<source url>"}]
}

CONFIDENCE GUIDE:
- 90-100: Very strong evidence either way
- 70-89: Good evidence, minor gaps
- 50-69: Some evidence but significant uncertainty
- 30-49: Mostly unverifiable, educated assessment
- 0-29: Extremely uncertain

If the claim is in a non-English language, write your reasoning in the SAME language.
Always include at least one source if search results were provided.
IMPORTANT: Return ONLY the JSON object, nothing else. No markdown fences, no explanation.`;

// Instantiate model once at module level for performance
const model = genai.getGenerativeModel({
  model: 'gemini-2.0-flash',
  systemInstruction: SYSTEM_PROMPT,
  generationConfig: {
    temperature: 0.2,       // low temp for factual, consistent output
    maxOutputTokens: 2048   // avoid truncated JSON responses
  }
});

/**
 * Calls Gemini to analyze a claim with optional web search snippets.
 */
export async function analyzeClaimWithGemini(claimText, searchResults = []) {
  // Build the prompt
  let userPrompt = `CLAIM TO FACT-CHECK:\n"${claimText}"`;

  if (searchResults.length > 0) {
    userPrompt += '\n\nWEB SEARCH RESULTS (use these as evidence):\n';
    searchResults.forEach((r, i) => {
      userPrompt += `\n[${i + 1}] ${r.title}\nURL: ${r.url}\n${r.snippet}\n`;
    });
    userPrompt += '\nBased on these search results and your knowledge, provide your verdict as JSON.';
  } else {
    userPrompt += '\n\nNo external search results available. Use your training knowledge to assess this claim, and note the confidence accordingly. Respond with JSON verdict.';
  }

  let rawText;
  try {
    const result = await model.generateContent(userPrompt);
    rawText = result.response.text();
  } catch (err) {
    console.error('[geminiService] API error:', err.message);

    // Surface friendly errors
    if (err.message?.includes('API_KEY') || err.message?.includes('API key')) {
      throw new Error('API key error: check your GEMINI_API_KEY in .env');
    }
    if (err.message?.includes('quota') || err.message?.includes('429')) {
      throw new Error('rate limit');
    }
    throw err;
  }

  return parseGeminiResponse(rawText, searchResults);
}

function parseGeminiResponse(rawText, searchResults) {
  // Strip any accidental markdown fences
  let jsonStr = rawText
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  // Extract the JSON object
  const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Gemini did not return valid JSON');
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch (e) {
    throw new Error(`JSON parse failed: ${e.message}`);
  }

  // Validate and normalize verdict
  const validVerdicts = ['TRUE', 'FALSE', 'MISLEADING', 'UNVERIFIED'];
  if (!validVerdicts.includes(parsed.verdict)) {
    parsed.verdict = 'UNVERIFIED';
  }

  parsed.confidence = Math.max(0, Math.min(100, parseInt(parsed.confidence) || 50));
  parsed.reasoning = parsed.reasoning || 'Unable to determine a clear verdict for this claim.';

  // Fall back to search result URLs if Gemini didn't include sources
  if (!parsed.sources || parsed.sources.length === 0) {
    parsed.sources = searchResults
      .filter(r => r.url)
      .slice(0, 3)
      .map(r => ({ title: r.title, url: r.url }));
  }

  // Remove any sources without valid URLs
  parsed.sources = (parsed.sources || []).filter(s => s.url && s.url.startsWith('http'));

  return {
    verdict: parsed.verdict,
    confidence: parsed.confidence,
    reasoning: parsed.reasoning,
    sources: parsed.sources.slice(0, 5)
  };
}
