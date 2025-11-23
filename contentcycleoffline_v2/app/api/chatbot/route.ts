import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
let openai: OpenAI;

try {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || '',
  });
} catch (error) {
  console.error('Failed to initialize OpenAI client:', error);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, currentContent, platform, originalInput, conversationHistory = [] } = body;

    if (!message || !currentContent) {
      return NextResponse.json(
        { error: 'Message and current content are required' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'API configuration error: OPENAI_API_KEY not set' },
        { status: 500 }
      );
    }

    // Build conversation context with reference to original input
    const systemPrompt = `You are an expert content editor specialized in ${platform || 'social media'} content. 
Your job is to modify the provided content based on user requests while maintaining the core message and value from the ORIGINAL INPUT.

${originalInput ? `ORIGINAL INPUT CONTENT (for reference):
---
${originalInput.substring(0, 2000)}
${originalInput.length > 2000 ? '... [truncated]' : ''}
---

CRITICAL: Always refer back to the original input content when making modifications. Ensure your changes align with the original message, tone, and intent while applying the requested modifications.` : ''}

Always return your response in JSON format with two fields:
1. "reply": A conversational response explaining what changes you made, referencing the original input when relevant
2. "modifiedContent": The updated content with the requested changes applied

IMPORTANT:
- Reference the original input content to maintain consistency with the source material
- Maintain the original intent and key messages from the original input
- Apply the requested changes naturally while staying true to the original content
- Keep the content appropriate for ${platform || 'the platform'}
- If the user asks for clarification, ask follow-up questions in the reply
- Always return valid JSON`;

    const messages: any[] = [
      {
        role: "system",
        content: systemPrompt
      }
    ];

    // Add conversation history
    conversationHistory.forEach((msg: any) => {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.role === 'assistant' 
          ? `Previously I said: "${msg.content}". Here's the modified content: "${msg.modifiedContent || ''}"`
          : msg.content
      });
    });

    // Add current request with reference to original
    let userPrompt = `Current generated content to modify:\n\n${currentContent}\n\n`;
    if (originalInput) {
      userPrompt += `Remember: The original input content serves as your reference for maintaining consistency with the source material.\n\n`;
    }
    userPrompt += `User request: ${message}\n\nPlease modify the content according to the request, keeping in mind the original input content and maintaining its core message and intent. Return the result in JSON format with "reply" and "modifiedContent" fields.`;
    
    messages.push({
      role: "user",
      content: userPrompt
    });

    console.log('Calling OpenAI for content modification...');

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: messages,
      response_format: { type: "json_object" },
      max_tokens: 2000,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(content);
    } catch (e) {
      // If response is not valid JSON, wrap it
      parsedResponse = {
        reply: content,
        modifiedContent: currentContent
      };
    }

    // Ensure we have both fields
    const result = {
      reply: parsedResponse.reply || parsedResponse.response || "I've made the requested changes to your content.",
      modifiedContent: parsedResponse.modifiedContent || parsedResponse.updatedContent || currentContent
    };

    console.log('Content modification completed');
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Chatbot API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process your request: ' + (error.message || 'Unknown error'),
        reply: "I apologize, but I encountered an error processing your request. Please try again.",
        modifiedContent: null
      },
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

