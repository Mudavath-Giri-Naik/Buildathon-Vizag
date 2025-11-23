import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import mammoth from 'mammoth';

// Enhanced prompts for better content generation
const PROMPTS = {
  extractThemes: `You are a senior content strategist and expert analyst. Extract 3-5 standalone, high-value themes from this content.

CRITICAL REQUIREMENTS:
- Extract ACTUAL specific insights from the content, not generic placeholders
- For "why_it_spreads", be nuanced and human - explain the psychological hooks, emotional triggers, or practical value
- For "key_insights", extract REAL insights found in the text, not placeholder text
- Make titles compelling and benefit-driven
- Focus on concrete examples, data points, and specific insights from the content
- If the content is about films/cinema, extract insights about the industry, success factors, cultural impact
- If the content is about learning/education, extract insights about methodologies, outcomes, practical applications

Return ONLY valid JSON:
{
  "themes": [
    {
      "theme_id": "specific-theme-from-content",
      "title": "8-14 word compelling headline that highlights a specific benefit or insight",
      "summary": "2-3 sentences max with concrete insights from the content",
      "importance_score": 1-10,
      "why_it_spreads": "Nuanced explanation of psychological appeal - e.g., 'Taps into curiosity about industry success stories while providing actionable insights'",
      "key_insights": ["Specific insight 1 from content", "Specific insight 2 from content", "Specific insight 3 from content"]
    }
  ]
}`,

  generateAssets: `You are a world-class marketer and copywriter. Using the theme below, create complete, ready-to-use platform versions for the SELECTED PLATFORMS ONLY.

CONTEXT/TONE GUIDELINES: {tone}

Theme: {title}
Summary: {summary}
Key Insights: {key_insights}

SELECTED PLATFORMS TO GENERATE: {selectedPlatforms}

CRITICAL REQUIREMENTS:
- DO NOT use generic placeholder text like "Main point extracted from content"
- Extract and use ACTUAL specific insights from the provided theme information
- Make content compelling, specific, and valuable
- ONLY generate content for the platforms specified in SELECTED PLATFORMS
- Create complete, ready-to-use content pieces
- Ensure all content is properly formatted without HTML entities

Return ONLY valid JSON with content for ONLY the selected platforms. Available platform keys:
- linkedin_post: For LinkedIn platform
- x_thread: For Twitter/X platform (as array of tweets)
- instagram_post: For Instagram platform
- short_blog: For blog platform
- email: For newsletter/email platform (format: "Subject: ...\\n\\nBody: ...")
- youtube_script: For YouTube platform
- carousel: For carousel/slide format (format: "Slide 1: ...\\n---\\nSlide 2: ...")

Example JSON structure (only include platforms from SELECTED PLATFORMS):
{
  "linkedin_post": "Complete LinkedIn post...",
  "x_thread": ["1/ ...", "2/ ..."],
  "instagram_post": "Instagram post with hashtags...",
  "short_blog": "# Title\\n\\nContent...",
  "email": "Subject: ...\\n\\nBody: ...",
  "youtube_script": "Video script...",
  "carousel": "Slide 1: ...\\n---\\nSlide 2: ..."
}`,

  rankAssets: `Rank these {n} generated posts by predicted viral performance (1-100).

Factors: hook quality, emotional appeal, specificity, value provided, platform optimization.

Return sorted JSON array:
[
  {
    "rank": 1,
    "platform": "LinkedIn",
    "score": 96,
    "reason": "Strong hook + specific value proposition",
    "preview": "First 120 chars..."
  }
]`
};

// Initialize OpenAI client
let openai: OpenAI;

try {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || '',
  });
} catch (error) {
  console.error('Failed to initialize OpenAI client:', error);
}

// Function to decode HTML entities
function decodeHtmlEntities(text: string): string {
  if (!text) return '';
  
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&copy;/g, '©')
    .replace(/&reg;/g, '®')
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#038;/g, '&')
    .replace(/<[^>]*>/g, ' ') // Replace HTML tags with spaces
    .replace(/\s+/g, ' ')
    .trim();
}

// Improved URL fetch function with better content extraction
async function fetchUrlContent(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    
    // Improved content extraction - remove scripts, styles, nav, footer
    let text = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
      .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, ' ')
      .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, ' ')
      .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, ' ')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Extract text between body tags if available
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) {
      text = bodyMatch[1]
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    // Clean up the text and decode HTML entities
    text = decodeHtmlEntities(text);

    if (!text || text.length < 200) {
      throw new Error('Could not extract sufficient content from URL (need 200+ meaningful characters)');
    }

    console.log('URL content extracted, length:', text.length);
    return text;
    
  } catch (error) {
    console.error('URL fetch error:', error);
    throw new Error('Failed to fetch URL content. Please check the URL and try again.');
  }
}

// PDF processing function
async function processPdfFile(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    const pdfParse = require('pdf-parse');
    const pdfData = await pdfParse(Buffer.from(arrayBuffer));
    
    if (!pdfData.text || pdfData.text.trim().length < 50) {
      throw new Error('PDF contains no extractable text (may be scanned images)');
    }
    
    return decodeHtmlEntities(pdfData.text);
  } catch (error: any) {
    console.error('PDF processing error:', error);
    throw new Error(
      'PDF processing failed. Please ensure the PDF contains selectable text, not scanned images.'
    );
  }
}

// Image processing function using GPT-4 Vision
async function processImageFile(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = file.type || 'image/jpeg';
    
    console.log('Processing image with GPT-4 Vision:', file.name);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract all text and describe the key content, themes, and insights from this image. Be detailed and specific. Format as clear, readable text."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64}`,
              },
            },
          ],
        },
      ],
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content extracted from image');
    }
    
    return content;
  } catch (error: any) {
    console.error('Image processing error:', error);
    throw new Error(`Failed to process image ${file.name}: ${error.message}`);
  }
}

// File processing function
async function processFile(file: File): Promise<string> {
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  const fileName = file.name.toLowerCase();
  console.log(`Processing ${fileExtension} file:`, file.name, 'size:', file.size);
  
  // Validate file type
  const allowedExtensions = ['pdf', 'docx', 'txt', 'md', 'jpg', 'jpeg', 'png', 'gif', 'webp'];
  if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
    throw new Error(
      `Unsupported file type: ${fileExtension}. ` +
      `Please upload: ${allowedExtensions.join(', ')} files.`
    );
  }
  
  // Validate file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('File size too large. Please upload files smaller than 10MB.');
  }
  
  try {
    let text: string;
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    
    if (imageExtensions.includes(fileExtension)) {
      // Process image with GPT-4 Vision
      text = await processImageFile(file);
    } else if (fileExtension === 'pdf') {
      const arrayBuffer = await file.arrayBuffer();
      text = await processPdfFile(arrayBuffer);
    } else if (fileExtension === 'docx') {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      text = result.value;
    } else {
      // For txt, md files
      text = await file.text();
    }
    
    if (!text || text.trim().length < 10) {
      throw new Error('File appears to be empty or contains very little content.');
    }
    
    return decodeHtmlEntities(text);
  } catch (err: any) {
    console.error(`Error processing ${fileExtension} file:`, err);
    throw new Error(
      `Failed to process ${file.name}: ${err.message}`
    );
  }
}

// Helper function to call OpenAI with JSON response and better error handling
async function callOpenAIWithJSON(prompt: string, systemPrompt?: string): Promise<any> {
  try {
    const messages: any[] = [];
    
    if (systemPrompt) {
      messages.push({ 
        role: "system" as const, 
        content: systemPrompt 
      });
    }
    
    messages.push({ 
      role: "user" as const, 
      content: prompt 
    });
    
    console.log('Calling OpenAI with prompt length:', prompt.length);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: messages,
      response_format: { type: "json_object" },
      max_tokens: 8000,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    console.log('OpenAI response received');
    return JSON.parse(content);
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error;
  }
}

// Function to clean and preprocess content before sending to AI
function preprocessContent(text: string): string {
  return decodeHtmlEntities(text)
    // Remove common noise patterns
    .replace(/javascript:void\(0\)/g, ' ')
    .replace(/window\.location\.href/g, ' ')
    .replace(/document\./g, ' ')
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    // Limit length to avoid token limits
    .slice(0, 100000)
    .trim();
}

// Function to extract meaningful content for fallback themes
function extractMeaningfulContent(text: string): { title: string, insights: string[], summary: string } {
  const decodedText = decodeHtmlEntities(text);
  
  // Extract first meaningful sentence as title
  const sentences = decodedText.split(/[.!?]+/).filter(s => s.trim().length > 20);
  let title = "Key Industry Insights and Success Strategies";
  
  // Try to find a good title sentence
  const titleCandidates = sentences.filter(s => 
    s.length > 30 && 
    s.length < 100 && 
    !s.toLowerCase().includes('http') && 
    !s.toLowerCase().includes('menu') &&
    !s.toLowerCase().includes('navigation')
  );
  
  if (titleCandidates.length > 0) {
    title = titleCandidates[0].trim().slice(0, 80);
  }
  
  // Extract key insights (sentences that seem substantive)
  const insights = sentences
    .slice(1, 6)
    .filter(s => s.length > 25 && 
           !s.toLowerCase().includes('http') && 
           !s.toLowerCase().includes('click') &&
           !s.toLowerCase().includes('menu'))
    .map(s => s.trim().slice(0, 120));
  
  // Create summary from first few meaningful sentences
  const summarySentences = sentences.slice(0, 3).filter(s => s.length > 20);
  const summary = summarySentences.length > 0 ? 
    summarySentences.join('. ') + '.' : 
    "This content provides valuable industry insights and strategic perspectives that can inform decision-making and drive success.";
  
  return {
    title,
    insights: insights.length > 0 ? insights : [
      "Strategic planning and execution drive industry success",
      "Cultural relevance combined with quality creates global impact", 
      "Innovation in approach leads to breakthrough achievements"
    ],
    summary
  };
}

export async function POST(req: NextRequest) {
  console.log('API route called');
  
  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];
    const url = formData.get('url') as string | null;
    const creationMode = formData.get('creationMode') as string || 'standard';
    const postCount = formData.get('postCount') as string || '3';
    const tone = formData.get('tone') as string || 'Professional and engaging';
    const selectedPlatformsJson = formData.get('selectedPlatforms') as string | null;
    
    // Parse selected platforms - these are the platforms we should generate content for
    let selectedPlatforms: string[] = [];
    if (selectedPlatformsJson) {
      try {
        selectedPlatforms = JSON.parse(selectedPlatformsJson);
      } catch (e) {
        console.error('Error parsing selectedPlatforms:', e);
      }
    }

    console.log('Received data:', { 
      filesCount: files.length, 
      hasUrl: !!url,
      fileNames: files.map(f => f.name),
      creationMode,
      postCount,
      tone,
      selectedPlatforms
    });

    let combinedText = '';

    // Handle URL scraping
    if (url) {
      try {
        console.log('Fetching URL:', url);
        const urlContent = await fetchUrlContent(url);
        combinedText += urlContent + '\n\n';
        console.log('URL content fetched, length:', urlContent.length);
      } catch (error) {
        console.error('URL fetch error:', error);
        return NextResponse.json(
          { error: 'Failed to fetch URL content. Please check the URL and try again.' }, 
          { status: 400 }
        );
      }
    }
    
    // Handle multiple file uploads (text, PDF, DOCX, images)
    if (files.length > 0) {
      for (const file of files) {
        console.log('Processing file:', file.name, 'size:', file.size);
        
        try {
          const fileContent = await processFile(file);
          
          // Lower threshold for images since GPT-4 Vision can extract less text
          const fileExtension = file.name.split('.').pop()?.toLowerCase();
          const isImage = fileExtension && ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension);
          const minLength = isImage ? 10 : 50;
          
          if (fileContent && fileContent.trim().length >= minLength) {
            combinedText += `--- Content from ${file.name} ---\n\n${fileContent}\n\n`;
            console.log('File content processed, length:', fileContent.length);
          }
        } catch (error: any) {
          console.error('File processing error:', error);
          // Continue with other files even if one fails
          continue;
        }
      }
    }

    if (!combinedText.trim()) {
      return NextResponse.json(
        { error: 'No valid content provided from files or URL' }, 
        { status: 400 }
      );
    }

    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY not configured');
      return NextResponse.json(
        { error: 'API configuration error: OPENAI_API_KEY not set' },
        { status: 500 }
      );
    }

    // Preprocess content - decode HTML entities and clean
    const cleanedText = preprocessContent(combinedText);
    console.log('Content cleaned, length:', cleanedText.length);

    if (cleanedText.length < 100) {
      return NextResponse.json(
        { error: 'Content too short after cleaning. Please provide more substantial content.' },
        { status: 400 }
      );
    }

    // Step 1: Extract Themes
    console.log('Extracting themes...');
    let themesJson;
    
    try {
      const themesPrompt = `Content:\n\n${cleanedText}\n\nExtract themes using this prompt:\n${PROMPTS.extractThemes}`;
      
      themesJson = await callOpenAIWithJSON(
        themesPrompt,
        "You are a senior content strategist. Extract high-value themes from content and return ONLY valid JSON. Focus on the main content and ignore navigation, headers, footers, and repetitive elements. Be specific and nuanced in your analysis. Extract actual insights, not generic placeholders."
      );
      console.log('Themes extracted successfully:', themesJson.themes?.length || 0);
    } catch (error) {
      console.error('Theme extraction error:', error);
      // Improved fallback: create specific themes from content analysis
      const meaningfulContent = extractMeaningfulContent(cleanedText);
      themesJson = {
        themes: [
          {
            theme_id: "core-industry-insights",
            title: meaningfulContent.title,
            summary: meaningfulContent.summary,
            importance_score: 8,
            why_it_spreads: "Reveals behind-the-scenes success factors and strategic insights that professionals can immediately apply",
            key_insights: meaningfulContent.insights
          }
        ]
      };
      console.log('Using improved fallback themes');
    }

    // Clean theme data
    if (themesJson.themes) {
      themesJson.themes = themesJson.themes.map((theme: any) => ({
        ...theme,
        title: decodeHtmlEntities(theme.title || ''),
        summary: decodeHtmlEntities(theme.summary || ''),
        why_it_spreads: decodeHtmlEntities(theme.why_it_spreads || ''),
        key_insights: (theme.key_insights || []).map((insight: string) => decodeHtmlEntities(insight))
      }));
    }

    // Determine how many themes to process based on postCount
    let themesToProcess = themesJson.themes;
    const count = parseInt(postCount);
    if (!isNaN(count) && count > 0) {
      themesToProcess = themesJson.themes.slice(0, Math.min(count, themesJson.themes.length));
    }

    // Map platform IDs to display names for GPT
    const platformMapping: { [key: string]: string } = {
      'linkedin': 'LinkedIn',
      'twitter': 'Twitter/X',
      'instagram': 'Instagram',
      'blog': 'Blog',
      'newsletter': 'Newsletter/Email',
      'youtube': 'YouTube',
      'carousel': 'Carousel'
    };
    
    const selectedPlatformNames = selectedPlatforms.length > 0
      ? selectedPlatforms.map(p => platformMapping[p] || p).join(', ')
      : 'LinkedIn, Twitter/X, Blog, Email, Carousel'; // Default if none selected
    
    // Step 2: Generate Assets Per Theme with Tone Context - ONLY for selected platforms
    console.log('Generating assets for', themesToProcess.length, 'themes for platforms:', selectedPlatformNames);
    const assetsPromises = themesToProcess.map(async (theme: any) => {
      try {
        const assetsPrompt = PROMPTS.generateAssets
          .replace("{title}", theme.title || '')
          .replace("{summary}", theme.summary || '')
          .replace("{key_insights}", (theme.key_insights || []).join("\n"))
          .replace("{tone}", tone)
          .replace("{selectedPlatforms}", selectedPlatformNames);
        
        const assets = await callOpenAIWithJSON(
          assetsPrompt,
          `You are a world-class marketer. Create platform-optimized, complete content versions for ONLY these platforms: ${selectedPlatformNames}. Ensure all content is specific, compelling, and uses actual insights from the theme. Never use generic placeholder text. Create ready-to-use content that provides real value.`
        );
        
        // Clean assets data - only include selected platforms
        const cleanAssets: any = {};
        if (selectedPlatforms.includes('linkedin') && assets.linkedin_post) {
          cleanAssets.linkedin_post = decodeHtmlEntities(assets.linkedin_post);
        }
        if (selectedPlatforms.includes('twitter') && assets.x_thread) {
          cleanAssets.x_thread = Array.isArray(assets.x_thread) 
            ? assets.x_thread.map((t: string) => decodeHtmlEntities(t))
            : [decodeHtmlEntities(assets.x_thread)];
        }
        if (selectedPlatforms.includes('instagram') && assets.instagram_post) {
          cleanAssets.instagram_post = decodeHtmlEntities(assets.instagram_post);
        }
        if (selectedPlatforms.includes('blog') && assets.short_blog) {
          cleanAssets.short_blog = decodeHtmlEntities(assets.short_blog);
        }
        if (selectedPlatforms.includes('newsletter') && assets.email) {
          cleanAssets.email = decodeHtmlEntities(assets.email);
        }
        if (selectedPlatforms.includes('youtube') && assets.youtube_script) {
          cleanAssets.youtube_script = decodeHtmlEntities(assets.youtube_script);
        }
        if (selectedPlatforms.includes('carousel') && assets.carousel) {
          cleanAssets.carousel = decodeHtmlEntities(assets.carousel);
        }
        
        return { ...theme, assets: cleanAssets };
      } catch (error) {
        console.error(`Error generating assets for theme ${theme.theme_id}:`, error);
        // Return comprehensive fallback assets that are specific - ONLY for selected platforms
        const meaningfulContent = extractMeaningfulContent(cleanedText);
        const fallbackAssets: any = {};
        
        // Only generate fallback content for selected platforms
        if (selectedPlatforms.includes('linkedin')) {
          fallbackAssets.linkedin_post = `🎯 ${theme.title}\n\n${theme.summary}\n\nKey insights:\n${(theme.key_insights || meaningfulContent.insights).map((insight: string) => `• ${insight}`).join('\n')}\n\n💡 Ready to implement these insights? DM me for more!\n\n#IndustryInsights #Strategy #ProfessionalGrowth`;
        }
        if (selectedPlatforms.includes('twitter')) {
          fallbackAssets.x_thread = [
            `1/ ${theme.title}`,
            `2/ ${theme.summary}`,
            `3/ Key insights:\n${(theme.key_insights || meaningfulContent.insights).slice(0, 3).map((insight: string) => `• ${insight}`).join('\n')}`,
            `4/ Want to dive deeper into these strategies? Follow for more insights!`
          ];
        }
        if (selectedPlatforms.includes('blog')) {
          fallbackAssets.short_blog = `# ${theme.title}\n\n## Overview\n\n${theme.summary}\n\n## Key Insights\n\n${(theme.key_insights || meaningfulContent.insights).map((insight: string) => `- ${insight}`).join('\n')}\n\n## Conclusion\n\nThese insights provide valuable perspectives that can be immediately applied to improve your strategy and outcomes.`;
        }
        if (selectedPlatforms.includes('newsletter')) {
          fallbackAssets.email = `Subject: ${theme.title}\n\nHi there,\n\n${theme.summary}\n\nHere are the key insights:\n${(theme.key_insights || meaningfulContent.insights).map((insight: string) => `• ${insight}`).join('\n')}\n\nBest regards,\nYour Team`;
        }
        if (selectedPlatforms.includes('carousel')) {
          fallbackAssets.carousel = `Slide 1: ${theme.title}\n${theme.summary}\n---\nSlide 2: Key Insights\n${(theme.key_insights || meaningfulContent.insights).slice(0, 3).map((insight: string) => `• ${insight}`).join('\n')}\n---\nSlide 3: Implementation\nPractical ways to apply these insights\n---\nSlide 4: Next Steps\nReady to implement? Contact us today!`;
        }
        if (selectedPlatforms.includes('instagram')) {
          fallbackAssets.instagram_post = `${theme.title}\n\n${theme.summary}\n\nKey insights:\n${(theme.key_insights || meaningfulContent.insights).slice(0, 3).map((insight: string) => `• ${insight}`).join('\n')}\n\n#ContentStrategy #BusinessTips #Marketing`;
        }
        if (selectedPlatforms.includes('youtube')) {
          fallbackAssets.youtube_script = `Introduction:\n${theme.title}\n\n${theme.summary}\n\nMain Points:\n${(theme.key_insights || meaningfulContent.insights).map((insight: string) => `- ${insight}`).join('\n')}\n\nConclusion:\nThese insights provide valuable perspectives that can be immediately applied to improve your strategy and outcomes.`;
        }
        
        return { ...theme, assets: fallbackAssets };
      }
    });

    const themesWithAssets = await Promise.all(assetsPromises);
    console.log('Assets generated for themes');

    // Step 3: Rank All Assets - ONLY for selected platforms
    console.log('Ranking assets for selected platforms:', selectedPlatformNames);
    const allPosts = themesWithAssets.flatMap(t => {
      const posts: any[] = [];
      
      if (selectedPlatforms.includes('linkedin') && t.assets.linkedin_post) {
        posts.push({
          platform: "LinkedIn",
          content: t.assets.linkedin_post,
          theme: t.title,
          theme_id: t.theme_id
        });
      }
      
      if (selectedPlatforms.includes('twitter') && t.assets.x_thread) {
        const threadContent = Array.isArray(t.assets.x_thread) 
          ? t.assets.x_thread.join("\n\n") 
          : t.assets.x_thread;
        posts.push({
          platform: "X",
          content: threadContent,
          theme: t.title,
          theme_id: t.theme_id
        });
      }
      
      if (selectedPlatforms.includes('instagram') && t.assets.instagram_post) {
        posts.push({
          platform: "Instagram",
          content: t.assets.instagram_post,
          theme: t.title,
          theme_id: t.theme_id
        });
      }
      
      if (selectedPlatforms.includes('blog') && t.assets.short_blog) {
        posts.push({
          platform: "Blog",
          content: typeof t.assets.short_blog === 'string' ? t.assets.short_blog.slice(0, 500) : '',
          theme: t.title,
          theme_id: t.theme_id
        });
      }
      
      if (selectedPlatforms.includes('newsletter') && t.assets.email) {
        posts.push({
          platform: "Email",
          content: typeof t.assets.email === 'string' ? t.assets.email.slice(0, 500) : '',
          theme: t.title,
          theme_id: t.theme_id
        });
      }
      
      if (selectedPlatforms.includes('youtube') && t.assets.youtube_script) {
        posts.push({
          platform: "YouTube",
          content: typeof t.assets.youtube_script === 'string' ? t.assets.youtube_script.slice(0, 500) : '',
          theme: t.title,
          theme_id: t.theme_id
        });
      }
      
      if (selectedPlatforms.includes('carousel') && t.assets.carousel) {
        posts.push({
          platform: "Carousel",
          content: typeof t.assets.carousel === 'string' ? t.assets.carousel.slice(0, 500) : '',
          theme: t.title,
          theme_id: t.theme_id
        });
      }
      
      return posts;
    }).filter(post => post.content && post.content.length > 10);

    let ranked = [];
    if (allPosts.length > 0) {
      try {
        const rankPrompt = PROMPTS.rankAssets.replace("{n}", String(allPosts.length)) + "\n\nPosts:\n" + JSON.stringify(allPosts.slice(0, 10));
        
        const rankResponse = await callOpenAIWithJSON(
          rankPrompt,
          "You are a content performance analyst. Rank content by viral potential and return ONLY valid JSON."
        );
        
        // Ensure ranked is always an array and clean the data
        if (Array.isArray(rankResponse)) {
          ranked = rankResponse.map(item => ({
            ...item,
            preview: decodeHtmlEntities(item.preview || ''),
            reason: decodeHtmlEntities(item.reason || '')
          }));
        } else if (rankResponse && Array.isArray(rankResponse.ranked)) {
          ranked = rankResponse.ranked.map((item: any) => ({
            ...item,
            preview: decodeHtmlEntities(item.preview || ''),
            reason: decodeHtmlEntities(item.reason || '')
          }));
        } else {
          throw new Error('Invalid ranking response format');
        }
        
        console.log('Assets ranked successfully');
      } catch (error) {
        console.error('Ranking error:', error);
        // Fallback: simple ranking by content length
        ranked = allPosts.map((post, index) => ({
          rank: index + 1,
          platform: post.platform,
          score: 80 - index * 5,
          reason: "Quality content with good engagement potential",
          preview: decodeHtmlEntities(post.content.slice(0, 120) + '...')
        }));
        console.log('Using fallback ranking');
      }
    }

    // Ensure ranked is always an array
    if (!Array.isArray(ranked)) {
      console.warn('Ranked is not an array, converting to empty array');
      ranked = [];
    }

    // Create a consolidated JSON response with all platforms in a single structure
    const consolidatedJSON = {
      input: {
        files: files.map(f => ({
          name: f.name,
          type: f.type,
          size: f.size
        })),
        url: url || null,
        selectedPlatforms: selectedPlatforms,
        wordCount: cleanedText.split(/\s+/).length
      },
      output: {
        themes: themesWithAssets.map((theme: any) => ({
          theme_id: theme.theme_id,
          title: theme.title,
          summary: theme.summary,
          platforms: selectedPlatforms.reduce((acc: any, platformId: string) => {
            const platformMapping: { [key: string]: string } = {
              'linkedin': 'linkedin_post',
              'twitter': 'x_thread',
              'instagram': 'instagram_post',
              'blog': 'short_blog',
              'newsletter': 'email',
              'youtube': 'youtube_script',
              'carousel': 'carousel'
            };
            const assetKey = platformMapping[platformId];
            if (assetKey && theme.assets[assetKey]) {
              acc[platformId] = theme.assets[assetKey];
            }
            return acc;
          }, {})
        })),
        ranked: ranked,
        processedAt: new Date().toISOString()
      },
      settings: {
        creationMode,
        postCount,
        tone
      }
    };

    const result = {
      ...consolidatedJSON,
      // Keep legacy format for backward compatibility
      themes: themesWithAssets,
      ranked,
      wordCount: cleanedText.split(/\s+/).length,
      processedAt: new Date().toISOString(),
      originalInput: combinedText, // Store original input for chatbot reference
      settings: {
        creationMode,
        postCount,
        tone
      }
    };

    console.log('Processing completed successfully');
    return NextResponse.json(result);

  } catch (error) {
    console.error('Processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error during content processing: ' + (error instanceof Error ? error.message : 'Unknown error') }, 
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}