export const PROMPTS = {
  extractThemes: `You are a senior content strategist. Extract 5–10 standalone, high-value themes from this content.

Return ONLY valid JSON:
{
  "themes": [
    {
      "theme_id": "string-kebab-case",
      "title": "8–14 word punchy headline",
      "summary": "2–3 sentences max",
      "importance_score": 1–10,
      "why_it_spreads": "why this hooks (stat, pain, surprise, etc)",
      "key_insights": ["bullet 1", "bullet 2", "max 5"]
    }
  ]
}`,

  generateAssets: `You are a world-class marketer. Using ONLY the theme below, create 4 platform versions.

Theme: {title}
Summary: {summary}
Key Insights: {key_insights}

Return ONLY valid JSON:
{
  "linkedin_post": "under 1300 chars, hook first, 3–5 hashtags, CTA",
  "x_thread": ["1/7 Hook...", "2/7 ...", "... final CTA"],
  "short_blog": "# SEO Title\\\\n\\\\nFull 550–700 word markdown blog",
  "carousel": "Slide 1: BIG HEADLINE\\\\nSupporting text\\\\n---\\\\nSlide 2: ..."
}`,

  rankAssets: `Rank these {n} generated posts by predicted viral performance (1–100).

Factors: hook, emotion, specificity, controversy, value, platform fit.

Return sorted JSON array:
[
  {
    "rank": 1,
    "platform": "LinkedIn",
    "score": 96,
    "reason": "Shocking stat + pain point",
    "preview": "First 120 chars..."
  }
]`
};