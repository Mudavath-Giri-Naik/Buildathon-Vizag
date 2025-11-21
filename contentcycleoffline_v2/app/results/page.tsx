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
  Images
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

  const aiActions = [
    { id: 'shorten', label: 'Shorten', icon: Scissors },
    { id: 'lengthen', label: 'Lengthen', icon: Maximize2 },
    { id: 'hooked', label: 'Make Hooked', icon: Sparkles },
    { id: 'professional', label: 'Rewrite Professionally', icon: FileText },
    { id: 'casual', label: 'Rewrite Casually', icon: MessageSquare },
    { id: 'cta', label: 'Add CTA', icon: Target },
    { id: 'clarity', label: 'Improve Clarity', icon: Eye },
    { id: 'threadify', label: 'Threadify', icon: Zap },
  ];

  const handleAIAction = (actionId: string) => {
    // Placeholder for AI actions - these would call an API endpoint
    console.log(`AI Action: ${actionId}`, editingContent);
    // For now, just show an alert
    alert(`AI Action "${actionId}" would be processed here. This feature can be connected to your backend.`);
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

      {/* AI Editing Actions */}
      <div className="bg-white border-b border-gray-200 overflow-x-auto">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-2 sm:py-3">
          <div className="flex flex-wrap gap-1.5 sm:gap-2 min-w-max sm:min-w-0">
            {aiActions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleAIAction(action.id)}
                  className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap"
                >
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="hidden xs:inline">{action.label}</span>
                  <span className="xs:hidden">{action.label.split(' ')[0]}</span>
                </Button>
              );
            })}
          </div>
        </div>
      </div>

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
            />
          </div>
        </div>
      </div>
    </div>
  );
}
