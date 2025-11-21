'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Check, TrendingUp, Eye, Share2, Linkedin, Twitter, FileText, Mail, ExternalLink } from 'lucide-react';
import { RankedPost } from '@/lib/types';
import { truncateText } from '@/lib/utils';

interface TopRankedPostsProps {
  ranked: RankedPost[] | null | undefined;
}

export function TopRankedPosts({ ranked }: TopRankedPostsProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [activePlatform, setActivePlatform] = useState('linkedin');

  const copyToClipboard = async (text: string, index: number) => {
    if (!text) return;
    
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const openPlatformWithContent = (platform: string, content: any, index: number) => {
    let url = '';
    let encodedContent = '';
    
    if (typeof content === 'string') {
      encodedContent = encodeURIComponent(content);
    } else if (Array.isArray(content)) {
      encodedContent = encodeURIComponent(content.join('\n\n'));
    }

    switch (platform.toLowerCase()) {
      case 'linkedin':
        // LinkedIn post composer
        url = `https://www.linkedin.com/post/new?text=${encodedContent}`;
        break;
      case 'x':
      case 'twitter':
        // Twitter tweet composer
        const tweetText = Array.isArray(content) ? content.join('\n\n') : content;
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
        break;
      case 'email':
        // Gmail compose
        const emailParts = typeof content === 'string' ? content.split('\n') : [];
        const subject = emailParts[0]?.replace('Subject: ', '') || 'Check this out';
        const body = emailParts.slice(2).join('\n');
        url = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        break;
      default:
        // For blog and other platforms, just copy to clipboard
        copyToClipboard(content, index);
        return;
    }

    window.open(url, '_blank');
  };

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'linkedin': return 'bg-blue-100 text-blue-800';
      case 'x': 
      case 'twitter': return 'bg-black text-white';
      case 'blog': return 'bg-green-100 text-green-800';
      case 'email': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'linkedin': return <Linkedin className="w-4 h-4" />;
      case 'x':
      case 'twitter': return <Twitter className="w-4 h-4" />;
      case 'blog': return <FileText className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  // Safe handling of ranked data
  const safeRanked = Array.isArray(ranked) ? ranked : [];
  
  // Group by platform and get top 3 for each
  const postsByPlatform = {
    linkedin: safeRanked
      .filter(post => post.platform?.toLowerCase().includes('linkedin'))
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 3),
    twitter: safeRanked
      .filter(post => post.platform?.toLowerCase().includes('twitter') || post.platform?.toLowerCase().includes('x'))
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 3),
    blog: safeRanked
      .filter(post => post.platform?.toLowerCase().includes('blog'))
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 3),
    email: safeRanked
      .filter(post => post.platform?.toLowerCase().includes('email'))
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 3)
  };

  // Get all posts for the active platform (including beyond top 3)
  const allPlatformPosts = safeRanked.filter(post => {
    const platform = post.platform?.toLowerCase();
    switch (activePlatform) {
      case 'linkedin': return platform?.includes('linkedin');
      case 'twitter': return platform?.includes('twitter') || platform?.includes('x');
      case 'blog': return platform?.includes('blog');
      case 'email': return platform?.includes('email');
      default: return false;
    }
  });

  const topPosts = postsByPlatform[activePlatform as keyof typeof postsByPlatform] || [];

  // If no ranked posts, show a message
  if (safeRanked.length === 0) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-emerald-100">
        <CardContent className="p-8 text-center">
          <div className="text-gray-500 mb-4">
            <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            No Content Rankings Available
          </h3>
          <p className="text-gray-600">
            Content ranking will appear here once processing is complete.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Platform Tabs */}
      <Tabs value={activePlatform} onValueChange={setActivePlatform} className="w-full">
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="linkedin" className="flex items-center gap-2">
            <Linkedin className="w-4 h-4" />
            LinkedIn
          </TabsTrigger>
          <TabsTrigger value="twitter" className="flex items-center gap-2">
            <Twitter className="w-4 h-4" />
            Twitter
          </TabsTrigger>
          <TabsTrigger value="blog" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Blog
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Email
          </TabsTrigger>
        </TabsList>

        {(['linkedin', 'twitter', 'blog', 'email'] as const).map(platform => (
          <TabsContent key={platform} value={platform} className="space-y-6">
            {/* Top 3 Ranked Posts */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                Top 3 {platform.charAt(0).toUpperCase() + platform.slice(1)} Posts
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {postsByPlatform[platform].map((post, index) => (
                  <Card key={index} className="bg-white/80 backdrop-blur-sm border-emerald-100 hover:shadow-lg transition-shadow duration-200">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center justify-center w-6 h-6 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
                            {index + 1}
                          </div>
                          <Badge className={getPlatformColor(post.platform)}>
                            {getPlatformIcon(post.platform)} {post.platform}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-1 text-sm font-semibold text-emerald-700">
                          <TrendingUp className="w-4 h-4" />
                          {post.score || 50}
                        </div>
                      </div>
                      
                      <CardTitle className="text-base leading-tight text-gray-800">
                        {truncateText(post.preview || 'No preview available', 80)}
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="pt-0 space-y-4">
                      {/* Score Progress */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>Viral Potential</span>
                          <span>{(post.score || 50)}/100</span>
                        </div>
                        <Progress 
                          value={post.score || 50} 
                          className="h-2 bg-gray-200"
                          indicatorClassName="bg-emerald-500"
                        />
                      </div>

                      {/* Reason */}
                      <div>
                        <h4 className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          Why it works:
                        </h4>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          {post.reason || "Engaging content with good potential"}
                        </p>
                      </div>

                      {/* Full Preview */}
                      <div>
                        <h4 className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                          <Share2 className="w-3 h-3" />
                          Content Preview:
                        </h4>
                        <div className="bg-gray-50 rounded-lg p-3 max-h-20 overflow-y-auto">
                          <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
                            {post.preview || 'No content preview available'}
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs"
                          onClick={() => copyToClipboard(
                            typeof post.full_content === 'string' 
                              ? post.full_content 
                              : Array.isArray(post.full_content)
                                ? post.full_content.join('\n\n')
                                : post.content || '',
                            index
                          )}
                        >
                          {copiedIndex === index ? (
                            <Check className="w-3 h-3 mr-1 text-green-600" />
                          ) : (
                            <Copy className="w-3 h-3 mr-1" />
                          )}
                          {copiedIndex === index ? 'Copied!' : 'Copy'}
                        </Button>
                        
                        <Button
                          variant="default"
                          size="sm"
                          className="flex-1 text-xs bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => openPlatformWithContent(
                            platform, 
                            post.full_content || post.content, 
                            index
                          )}
                        >
                          {platform === 'blog' ? (
                            <Copy className="w-3 h-3 mr-1" />
                          ) : (
                            <ExternalLink className="w-3 h-3 mr-1" />
                          )}
                          {platform === 'blog' ? 'Copy' : 'Use This'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* All Posts for this Platform */}
            {allPlatformPosts.length > 3 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  All {platform.charAt(0).toUpperCase() + platform.slice(1)} Posts
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {allPlatformPosts.map((post, index) => (
                    <Card key={index} className="bg-white/60 backdrop-blur-sm border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <Badge variant="outline" className="text-xs">
                            Rank #{index + 1}
                          </Badge>
                          <div className="text-sm font-semibold text-emerald-700">
                            Score: {post.score || 50}
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 mb-3 line-clamp-3">
                          {post.preview || 'No preview available'}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-xs"
                            onClick={() => copyToClipboard(
                              typeof post.full_content === 'string' 
                                ? post.full_content 
                                : Array.isArray(post.full_content)
                                  ? post.full_content.join('\n\n')
                                  : post.content || '',
                              index + 100
                            )}
                          >
                            {copiedIndex === index + 100 ? (
                              <Check className="w-3 h-3 mr-1 text-green-600" />
                            ) : (
                              <Copy className="w-3 h-3 mr-1" />
                            )}
                            Copy
                          </Button>
                          {platform !== 'blog' && (
                            <Button
                              variant="default"
                              size="sm"
                              className="flex-1 text-xs bg-emerald-600 hover:bg-emerald-700"
                              onClick={() => openPlatformWithContent(
                                platform, 
                                post.full_content || post.content, 
                                index + 100
                              )}
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Use
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}