'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ArrowLeft, 
  RefreshCw, 
  Linkedin, 
  Twitter,
  Scissors,
  Maximize2,
  Sparkles,
  FileText,
  MessageSquare,
  Plus,
  Target,
  Eye,
  Zap,
  Instagram,
  Mail,
  Youtube,
  Image as Images
} from 'lucide-react';
import { AIEditorPanel } from '@/components/AIEditorPanel';
import { RankedPost } from '@/lib/types';

interface ProcessedResult {
  themes: any[];
  ranked: RankedPost[];
  wordCount: number;
}

export default function ResultsPage() {
  const [result, setResult] = useState<ProcessedResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePlatform, setActivePlatform] = useState<string>('twitter');
  const [activeContent, setActiveContent] = useState<string>('');
  const [editingContent, setEditingContent] = useState<string>('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [showJSON, setShowJSON] = useState(false);
  const [originalInput, setOriginalInput] = useState<string>('');
  const [selectedRecommendations, setSelectedRecommendations] = useState<string[]>([]);
  const [isProcessingRecommendations, setIsProcessingRecommendations] = useState(false);
  const router = useRouter();

  const platforms = [
    { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'bg-blue-600' },
    { id: 'twitter', name: 'Twitter/X', icon: Twitter, color: 'bg-black' },
    { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'bg-pink-600' },
    { id: 'blog', name: 'Blog Post', icon: FileText, color: 'bg-green-600' },
    { id: 'newsletter', name: 'Newsletter', icon: Mail, color: 'bg-purple-600' },
    { id: 'youtube', name: 'YouTube', icon: Youtube, color: 'bg-red-600' },
    { id: 'carousel', name: 'Carousel', icon: Images, color: 'bg-orange-600' },
  ];

  useEffect(() => {
    const stored = sessionStorage.getItem('result');
    const storedPlatforms = sessionStorage.getItem('selectedPlatforms');
    const storedOriginalInput = sessionStorage.getItem('originalInput');
    
    if (storedOriginalInput) {
      setOriginalInput(storedOriginalInput);
    }
    
    let platformsList: string[] = [];
    if (storedPlatforms) {
      try {
        platformsList = JSON.parse(storedPlatforms);
        setSelectedPlatforms(platformsList);
      } catch (e) {
        console.error('Error parsing selected platforms:', e);
      }
    }
    
    if (stored) {
      const parsed = JSON.parse(stored);
      setResult(parsed);
      
      // Store original input if available
      if (parsed.originalInput || parsed.input?.wordCount) {
        const storedOriginal = sessionStorage.getItem('originalInput');
        if (storedOriginal) {
          setOriginalInput(storedOriginal);
        } else if (parsed.originalInput) {
          setOriginalInput(parsed.originalInput);
          sessionStorage.setItem('originalInput', parsed.originalInput);
        }
      }
      
      // Helper function to get content for a platform
      const getContentForPlatform = (platformId: string) => {
        const platformPosts = parsed.ranked.filter((post: RankedPost) => {
          const postPlatform = post.platform?.toLowerCase();
          const platform = platformId.toLowerCase();
          
          if (platform === 'twitter' || platform === 'x') {
            return postPlatform?.includes('twitter') || postPlatform?.includes('x');
          } else if (platform === 'linkedin') {
            return postPlatform?.includes('linkedin');
          } else if (platform === 'instagram') {
            return postPlatform?.includes('instagram');
          } else if (platform === 'blog') {
            return postPlatform?.includes('blog');
          } else if (platform === 'newsletter' || platform === 'email') {
            return postPlatform?.includes('email') || postPlatform?.includes('newsletter');
          } else if (platform === 'youtube') {
            return postPlatform?.includes('youtube');
          } else if (platform === 'carousel') {
            return postPlatform?.includes('carousel');
          }
          return false;
        });

        if (platformPosts.length > 0) {
          const sortedPosts = [...platformPosts].sort((a: RankedPost, b: RankedPost) => (b.score || 0) - (a.score || 0));
          const bestPost = sortedPosts[0];
          if (bestPost.full_content) {
            return typeof bestPost.full_content === 'string' 
              ? bestPost.full_content 
              : Array.isArray(bestPost.full_content)
                ? bestPost.full_content.join('\n\n')
                : '';
          } else if (bestPost.content) {
            return typeof bestPost.content === 'string' ? bestPost.content : '';
          } else if (bestPost.preview) {
            return bestPost.preview;
          }
        }
        return '';
      };
      
      // Set initial content based on first ranked post or first selected platform
      if (parsed.ranked && parsed.ranked.length > 0) {
        let initialPlatform = 'twitter';
        let initialContent = '';
        
        // Try to find Twitter/X first
        const twitterPost = parsed.ranked.find((post: RankedPost) => {
          const platform = post.platform?.toLowerCase();
          return platform?.includes('twitter') || platform?.includes('x');
        });
        
        if (twitterPost) {
          initialPlatform = 'twitter';
          if (twitterPost.full_content) {
            initialContent = typeof twitterPost.full_content === 'string' 
              ? twitterPost.full_content 
              : Array.isArray(twitterPost.full_content)
                ? twitterPost.full_content.join('\n\n')
                : '';
          } else if (twitterPost.content) {
            initialContent = typeof twitterPost.content === 'string' ? twitterPost.content : '';
          } else if (twitterPost.preview) {
            initialContent = twitterPost.preview;
          }
        } else if (platformsList.length > 0) {
          // Use first selected platform
          initialPlatform = platformsList[0];
          initialContent = getContentForPlatform(initialPlatform);
        } else {
          // Fallback to first post
          const postToUse = parsed.ranked[0];
          if (postToUse.full_content) {
            initialContent = typeof postToUse.full_content === 'string' 
              ? postToUse.full_content 
              : Array.isArray(postToUse.full_content)
                ? postToUse.full_content.join('\n\n')
                : '';
          } else if (postToUse.content) {
            initialContent = typeof postToUse.content === 'string' ? postToUse.content : '';
          } else if (postToUse.preview) {
            initialContent = postToUse.preview;
          }
          
          const platform = postToUse.platform?.toLowerCase();
          if (platform?.includes('linkedin')) {
            initialPlatform = 'linkedin';
          }
        }
        
        setActivePlatform(initialPlatform);
        setActiveContent(initialContent);
        setEditingContent(initialContent);
      }
    }
    setLoading(false);
  }, []);


  const getPlatformContent = (platformId: string) => {
    if (!result?.ranked) return '';
    
    const platformPosts = result.ranked.filter(post => {
      const postPlatform = post.platform?.toLowerCase();
      const platform = platformId.toLowerCase();
      
      // Map platform IDs to search terms
      if (platform === 'twitter' || platform === 'x') {
        return postPlatform?.includes('twitter') || postPlatform?.includes('x');
      } else if (platform === 'linkedin') {
        return postPlatform?.includes('linkedin');
      } else if (platform === 'instagram') {
        return postPlatform?.includes('instagram');
      } else if (platform === 'blog') {
        return postPlatform?.includes('blog');
      } else if (platform === 'newsletter' || platform === 'email') {
        return postPlatform?.includes('email') || postPlatform?.includes('newsletter');
      } else if (platform === 'youtube') {
        return postPlatform?.includes('youtube');
      } else if (platform === 'carousel') {
        return postPlatform?.includes('carousel');
      }
      return false;
    });

    if (platformPosts.length > 0) {
      // Sort by score and get the best one
      const sortedPosts = [...platformPosts].sort((a, b) => (b.score || 0) - (a.score || 0));
      const post = sortedPosts[0];
      
      // Get content from full_content, content, or preview
      let content = '';
      if (post.full_content) {
        content = typeof post.full_content === 'string' 
          ? post.full_content 
          : Array.isArray(post.full_content)
            ? post.full_content.join('\n\n')
            : '';
      } else if (post.content) {
        content = typeof post.content === 'string' ? post.content : '';
      } else if (post.preview) {
        content = post.preview;
      }
      
      return content;
    }
    return '';
  };

  const handlePlatformChange = (platformId: string) => {
    setActivePlatform(platformId);
    const content = getPlatformContent(platformId);
    setActiveContent(content);
    setEditingContent(content);
    // Clear selected recommendations when platform changes
    setSelectedRecommendations([]);
  };

  const handleRegenerate = () => {
    // Navigate back to home to regenerate
    router.push('/');
  };

  const handlePostToPlatform = () => {
    if (!editingContent.trim()) {
      alert('Please add some content before posting');
      return;
    }

    let url = '';
    const encodedContent = encodeURIComponent(editingContent);

    if (activePlatform === 'twitter') {
      // Twitter/X post composer
      url = `https://twitter.com/intent/tweet?text=${encodedContent}`;
    } else if (activePlatform === 'linkedin') {
      // LinkedIn post composer
      url = `https://www.linkedin.com/post/new?text=${encodedContent}`;
    }

    if (url) {
      window.open(url, '_blank');
    }
  };

  // Platform-specific recommendations based on metrics - updates when platform changes
  const getPlatformRecommendations = (platform: string) => {
    const recommendations: { [key: string]: Array<{ id: string; label: string; icon: any; prompt: string }> } = {
      'linkedin': [
        { id: 'engagement', label: 'Boost Engagement', icon: Sparkles, prompt: 'Make this LinkedIn post more engaging with questions and calls for discussion' },
        { id: 'professional', label: 'More Professional', icon: FileText, prompt: 'Rewrite this in a more professional and authoritative tone suitable for LinkedIn' },
        { id: 'hook', label: 'Stronger Hook', icon: Target, prompt: 'Rewrite the opening line to be more attention-grabbing and hook LinkedIn professionals immediately' },
        { id: 'cta', label: 'Add CTA', icon: Plus, prompt: 'Add a compelling call-to-action at the end for LinkedIn engagement' },
        { id: 'hashtags', label: 'Optimize Hashtags', icon: Zap, prompt: 'Add relevant LinkedIn hashtags and optimize the content for LinkedIn algorithm' },
        { id: 'length', label: 'Optimal Length', icon: Scissors, prompt: 'Optimize the length for LinkedIn (1300 chars) while maintaining all key points' },
      ],
      'twitter': [
        { id: 'thread', label: 'Create Thread', icon: MessageSquare, prompt: 'Convert this into a Twitter/X thread format with numbered tweets (1/5, 2/5, etc.)' },
        { id: 'hook', label: 'Viral Hook', icon: Sparkles, prompt: 'Create a compelling opening hook that makes people stop scrolling' },
        { id: 'shorten', label: '280 Chars', icon: Scissors, prompt: 'Condense this to exactly 280 characters while keeping the core message' },
        { id: 'engagement', label: 'Max Engagement', icon: Target, prompt: 'Optimize for maximum engagement with questions and engagement hooks' },
        { id: 'casual', label: 'More Casual', icon: MessageSquare, prompt: 'Make this more casual and conversational for Twitter/X audience' },
        { id: 'trending', label: 'Trending Topics', icon: Zap, prompt: 'Add relevant trending topics and hashtags while keeping it natural' },
      ],
      'instagram': [
        { id: 'visual', label: 'Visual Appeal', icon: Images, prompt: 'Add emojis and visual elements to make this more Instagram-friendly' },
        { id: 'story', label: 'Story Format', icon: Sparkles, prompt: 'Format this as an Instagram story with slide breaks and visual cues' },
        { id: 'hashtags', label: '30 Hashtags', icon: Zap, prompt: 'Add 30 relevant Instagram hashtags and optimize for discoverability' },
        { id: 'caption', label: 'Perfect Caption', icon: FileText, prompt: 'Optimize this as an Instagram caption with proper formatting and spacing' },
        { id: 'hook', label: 'First Line Hook', icon: Target, prompt: 'Make the first line irresistible so people tap "more" on Instagram' },
        { id: 'engage', label: 'Max Likes', icon: Eye, prompt: 'Add engagement-driving elements like questions and calls to double-tap' },
      ],
      'blog': [
        { id: 'seo', label: 'SEO Optimize', icon: Target, prompt: 'Optimize this blog post for SEO with better headings and keyword integration' },
        { id: 'structure', label: 'Better Structure', icon: FileText, prompt: 'Improve the structure with clear headings, subheadings, and sections' },
        { id: 'intro', label: 'Stronger Intro', icon: Sparkles, prompt: 'Rewrite the introduction to be more compelling and hook readers' },
        { id: 'length', label: 'Expand Content', icon: Maximize2, prompt: 'Expand this blog post with more details, examples, and value' },
        { id: 'readable', label: 'Improve Readability', icon: Eye, prompt: 'Improve readability with shorter paragraphs, bullet points, and clear language' },
        { id: 'conclusion', label: 'Better Conclusion', icon: Zap, prompt: 'Strengthen the conclusion with a clear summary and call-to-action' },
      ],
      'newsletter': [
        { id: 'subject', label: 'Killer Subject', icon: Target, prompt: 'Create a compelling email subject line that increases open rates' },
        { id: 'preheader', label: 'Preheader Text', icon: FileText, prompt: 'Add engaging preheader text that complements the subject line' },
        { id: 'personal', label: 'More Personal', icon: MessageSquare, prompt: 'Make this email more personal and conversational' },
        { id: 'cta', label: 'Clear CTA', icon: Plus, prompt: 'Add a clear, compelling call-to-action button with urgency' },
        { id: 'length', label: 'Optimal Length', icon: Scissors, prompt: 'Optimize the email length for maximum engagement and readability' },
        { id: 'format', label: 'Email Format', icon: FileText, prompt: 'Format this properly for email with proper spacing and structure' },
      ],
      'youtube': [
        { id: 'hook', label: 'Video Hook', icon: Sparkles, prompt: 'Create a compelling hook for the first 15 seconds to reduce drop-off' },
        { id: 'script', label: 'Full Script', icon: FileText, prompt: 'Expand this into a full YouTube video script with intro, body, and outro' },
        { id: 'engaging', label: 'More Engaging', icon: Eye, prompt: 'Add engagement elements like questions and calls to subscribe' },
        { id: 'structure', label: 'Better Structure', icon: FileText, prompt: 'Structure this with clear sections and transitions for video' },
        { id: 'cta', label: 'Multiple CTAs', icon: Target, prompt: 'Add strategic calls-to-action throughout (subscribe, like, comment)' },
        { id: 'description', label: 'Description', icon: FileText, prompt: 'Create a YouTube description with timestamps and links' },
      ],
      'carousel': [
        { id: 'slides', label: 'Slide Format', icon: Images, prompt: 'Format this as carousel slides with clear slide breaks and visual structure' },
        { id: 'hook', label: 'Slide 1 Hook', icon: Sparkles, prompt: 'Make the first slide irresistible to stop scrolling' },
        { id: 'visual', label: 'Visual Elements', icon: Images, prompt: 'Add visual cues, emojis, and formatting for carousel posts' },
        { id: 'flow', label: 'Better Flow', icon: FileText, prompt: 'Improve the flow between slides with smooth transitions' },
        { id: 'length', label: 'Slide Count', icon: Scissors, prompt: 'Optimize the number of slides for maximum engagement (4-10 slides)' },
        { id: 'cta', label: 'Final CTA Slide', icon: Target, prompt: 'Add a compelling final slide with clear call-to-action' },
      ],
    };
    
    return recommendations[platform] || recommendations['linkedin'];
  };

  const aiActions = getPlatformRecommendations(activePlatform);

  const toggleRecommendation = (id: string) => {
    setSelectedRecommendations(prev => 
      prev.includes(id) 
        ? prev.filter(r => r !== id)
        : [...prev, id]
    );
  };

  const handleRunRecommendations = async () => {
    if (selectedRecommendations.length === 0 || !editingContent.trim()) {
      alert('Please select at least one recommendation to apply.');
      return;
    }

    setIsProcessingRecommendations(true);
    
    try {
      // Get all selected recommendation prompts
      const selectedActions = aiActions.filter(action => 
        selectedRecommendations.includes(action.id)
      );
      
      // Combine all prompts into one request
      const combinedPrompt = selectedActions.map(action => action.prompt).join('\n\nAlso: ');
      const finalPrompt = `Apply the following modifications:\n\n${combinedPrompt}\n\nMake all changes while maintaining consistency with the original input content.`;

      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: finalPrompt,
          currentContent: editingContent,
          platform: activePlatform,
          originalInput: originalInput,
          conversationHistory: []
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process request');
      }

      if (data.modifiedContent) {
        setEditingContent(data.modifiedContent);
        setActiveContent(data.modifiedContent);
        setSelectedRecommendations([]); // Clear selections after applying
      }
    } catch (error: any) {
      console.error('Error applying recommendations:', error);
      alert(`Failed to apply recommendations: ${error.message}`);
    } finally {
      setIsProcessingRecommendations(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your results...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">No Results Found</h2>
          <p className="text-gray-600 mb-6">Please upload some content first</p>
          <Button onClick={() => router.push('/')} className="bg-blue-600 hover:bg-blue-700">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // Format content for display (handle thread format)
  const formatContent = (content: string) => {
    // If content looks like a thread (numbered items), format it nicely
    const lines = content.split('\n');
    const formatted = lines.map(line => {
      // Check if line starts with number pattern like "1/", "2/", etc.
      if (/^\d+\//.test(line.trim())) {
        return line;
      }
      return line;
    });
    return formatted.join('\n');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4">
          {/* Mobile: Stacked layout */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
            {/* Back Button - Mobile top, Desktop left */}
            <div className="flex items-center justify-between sm:justify-start">
              <Button
                variant="ghost"
                onClick={() => router.push('/')}
                className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3"
              >
                <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Back to Input</span>
                <span className="xs:hidden">Back</span>
              </Button>
              
              {/* Regenerate Button - Mobile top right */}
              <Button
                variant="outline"
                onClick={handleRegenerate}
                className="flex items-center gap-1.5 sm:hidden text-xs px-2 sm:px-3"
              >
                <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="xs:hidden">Regen</span>
                <span className="hidden xs:inline">Regenerate</span>
              </Button>
            </div>
            
            {/* Selected Platforms in Center */}
            <div className="flex-1 flex items-center justify-center gap-2 px-2 sm:px-4 overflow-x-auto">
              {selectedPlatforms.length > 0 ? (
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-center min-w-0">
                  {selectedPlatforms.map((platformId) => {
                    const platform = platforms.find(p => p.id === platformId);
                    if (!platform) return null;
                    const Icon = platform.icon;
                    const isActive = activePlatform === platformId;
                    return (
                      <button
                        key={platformId}
                        onClick={() => handlePlatformChange(platformId)}
                        className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg transition-all cursor-pointer bg-white whitespace-nowrap flex-shrink-0 ${
                          isActive
                            ? 'border-2 border-blue-500 shadow-md'
                            : 'border border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded flex items-center justify-center flex-shrink-0 ${
                          isActive ? platform.color : 'bg-gray-100'
                        }`}>
                          <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isActive ? 'text-white' : 'text-gray-600'}`} />
                        </div>
                        <span className={`text-xs sm:text-sm font-medium hidden sm:inline lg:inline ${
                          isActive ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {platform.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center gap-2 sm:gap-3">
                  <button
                    onClick={() => handlePlatformChange('twitter')}
                    className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-all text-xs sm:text-sm ${
                      activePlatform === 'twitter'
                        ? 'bg-black text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center ${
                      activePlatform === 'twitter' ? 'bg-black' : 'bg-gray-200'
                    }`}>
                      <Twitter className={`w-3.5 h-3.5 sm:w-5 sm:h-5 ${activePlatform === 'twitter' ? 'text-white' : 'text-gray-600'}`} />
                    </div>
                    <span className="text-sm sm:text-lg font-semibold hidden xs:inline">Twitter</span>
                  </button>
                  <button
                    onClick={() => handlePlatformChange('linkedin')}
                    className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-all text-xs sm:text-sm ${
                      activePlatform === 'linkedin'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center ${
                      activePlatform === 'linkedin' ? 'bg-blue-600' : 'bg-gray-200'
                    }`}>
                      <Linkedin className={`w-3.5 h-3.5 sm:w-5 sm:h-5 ${activePlatform === 'linkedin' ? 'text-white' : 'text-gray-600'}`} />
                    </div>
                    <span className="text-sm sm:text-lg font-semibold hidden xs:inline">LinkedIn</span>
                  </button>
                </div>
              )}
            </div>
            
            {/* Regenerate Button - Desktop */}
            <Button
              variant="outline"
              onClick={handleRegenerate}
              className="hidden sm:flex items-center gap-2 text-xs sm:text-sm px-3 sm:px-4"
            >
              <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden md:inline">Regenerate</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Platform-Specific AI Recommendations */}
      <div className="bg-white border-b border-gray-200 overflow-x-auto">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              <h3 className="text-xs sm:text-sm font-semibold text-gray-900">
                {activePlatform.charAt(0).toUpperCase() + activePlatform.slice(1)} Optimizations
              </h3>
              {selectedRecommendations.length > 0 && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                  {selectedRecommendations.length} selected
                </span>
              )}
            </div>
            {selectedRecommendations.length > 0 && (
              <Button
                onClick={handleRunRecommendations}
                disabled={isProcessingRecommendations}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2"
              >
                {isProcessingRecommendations ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />
                    Run ({selectedRecommendations.length})
                  </>
                )}
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 sm:gap-2 min-w-max sm:min-w-0">
            {aiActions.map((action) => {
              const Icon = action.icon;
              const isSelected = selectedRecommendations.includes(action.id);
              return (
                <button
                  key={action.id}
                  onClick={() => toggleRecommendation(action.id)}
                  className={`flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="hidden xs:inline">{action.label}</span>
                  <span className="xs:hidden">{action.label.split(' ')[0]}</span>
                  {isSelected && (
                    <span className="ml-1 text-blue-600">✓</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* JSON View Toggle */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-2">
        <Button
          variant="outline"
          onClick={() => setShowJSON(!showJSON)}
          className="text-xs sm:text-sm"
        >
          {showJSON ? 'Hide' : 'Show'} JSON Response
        </Button>
      </div>

      {/* JSON Response Display */}
      {showJSON && result && (
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4">
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-semibold text-sm sm:text-base">📄 Complete JSON Response from GPT</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
                  }}
                  className="text-white hover:bg-gray-800 text-xs"
                >
                  Copy JSON
                </Button>
              </div>
              <pre className="text-xs sm:text-sm text-green-400 overflow-auto max-h-[400px] bg-black p-4 rounded border border-gray-700">
                {JSON.stringify(result, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Content Editor (Left - 2/3 width) */}
          <div className="lg:col-span-2">
            <Card className="h-full bg-white border border-gray-200 relative">
              <CardContent className="p-3 sm:p-4 md:p-6">
                <textarea
                  value={editingContent}
                  onChange={(e) => setEditingContent(e.target.value)}
                  className="w-full h-[300px] sm:h-[400px] md:h-[500px] px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-none text-gray-900 font-mono text-xs sm:text-sm leading-relaxed whitespace-pre-wrap"
                  placeholder="Your content will appear here..."
                />
                <div className="absolute bottom-3 sm:bottom-4 md:bottom-6 right-3 sm:right-4 md:right-6">
                  <Button
                    onClick={handlePostToPlatform}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2"
                  >
                    Post
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Editor Panel (Right - 1/3 width) */}
          <div className="lg:col-span-1">
            <AIEditorPanel 
              clarity={85}
              tone={90}
              structure={88}
              length={75}
              currentContent={editingContent}
              platform={activePlatform}
              originalInput={originalInput}
              onContentChange={(newContent) => {
                setEditingContent(newContent);
                setActiveContent(newContent);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
