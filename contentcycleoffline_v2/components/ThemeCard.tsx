'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Copy, Check, Twitter, Linkedin, FileText, Image, Mail, ExternalLink } from 'lucide-react';
import { Theme } from '@/lib/types';
import { truncateText } from '@/lib/utils';

interface ThemeCardProps {
  theme: Theme;
  index: number;
}

export function ThemeCard({ theme, index }: ThemeCardProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('linkedin');

  const copyToClipboard = async (text: string, field: string) => {
    if (!text || text === 'No content generated') {
      console.warn('No content to copy');
      return;
    }
    
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
      } catch (fallbackError) {
        console.error('Fallback copy failed:', fallbackError);
      }
      document.body.removeChild(textArea);
    }
  };

  const openPlatformWithContent = (platform: string, content: string) => {
    let url = '';
    const encodedContent = encodeURIComponent(content);
    
    switch (platform) {
      case 'linkedin':
        url = `https://www.linkedin.com/post/new?text=${encodedContent}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodedContent}`;
        break;
      case 'email':
        const emailParts = content.split('\n');
        const subject = emailParts[0]?.replace('Subject: ', '') || 'Check this out';
        const body = emailParts.slice(2).join('\n');
        url = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        break;
      default:
        return; // For blog and carousel, just copy
    }

    window.open(url, '_blank');
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'linkedin': return <Linkedin className="w-4 h-4" />;
      case 'twitter': return <Twitter className="w-4 h-4" />;
      case 'blog': return <FileText className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      case 'carousel': return <Image className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  // Safe access to assets with better fallbacks
  const assets = theme.assets || {
    linkedin_post: 'No content generated',
    x_thread: ['No content generated'],
    short_blog: 'No content generated',
    email: 'No content generated',
    carousel: 'No content generated'
  };

  // Ensure x_thread is always an array
  const xThread = Array.isArray(assets.x_thread) ? assets.x_thread : [assets.x_thread || 'No content generated'];
  // Safe email access
  const emailContent = assets.email || 'No content generated';

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-emerald-100 hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start mb-2">
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
            Theme {index + 1}
          </Badge>
          <Badge className="bg-blue-100 text-blue-800">
            Score: {theme.importance_score}/10
          </Badge>
        </div>
        
        <CardTitle className="text-lg leading-tight text-gray-800">
          {theme.title}
        </CardTitle>
        
        <p className="text-sm text-gray-600 mt-2 leading-relaxed">
          {theme.summary}
        </p>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Why it spreads */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-1">Why this spreads:</h4>
          <p className="text-sm text-gray-600">{theme.why_it_spreads}</p>
        </div>

        {/* Key Insights */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Key Insights:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            {theme.key_insights?.slice(0, 3).map((insight: string, i: number) => (
              <li key={i} className="flex items-start">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></div>
                {truncateText(insight, 120)}
              </li>
            ))}
          </ul>
        </div>

        <Separator className="my-4" />

        {/* Content Assets */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-5 mb-4">
            <TabsTrigger value="linkedin" className="text-xs">
              <Linkedin className="w-3 h-3 mr-1" />
              LinkedIn
            </TabsTrigger>
            <TabsTrigger value="twitter" className="text-xs">
              <Twitter className="w-3 h-3 mr-1" />
              Twitter
            </TabsTrigger>
            <TabsTrigger value="blog" className="text-xs">
              <FileText className="w-3 h-3 mr-1" />
              Blog
            </TabsTrigger>
            <TabsTrigger value="email" className="text-xs">
              <Mail className="w-3 h-3 mr-1" />
              Email
            </TabsTrigger>
            <TabsTrigger value="carousel" className="text-xs">
              <Image className="w-3 h-3 mr-1" />
              Carousel
            </TabsTrigger>
          </TabsList>

          {/* LinkedIn Content */}
          <TabsContent value="linkedin" className="space-y-3">
            <div className="flex justify-between items-start">
              <h4 className="font-medium text-gray-800">LinkedIn Post</h4>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(assets.linkedin_post, 'linkedin')}
                  className="h-8"
                  disabled={!assets.linkedin_post || assets.linkedin_post === 'No content generated'}
                >
                  {copiedField === 'linkedin' ? (
                    <Check className="w-3 h-3 text-green-600" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openPlatformWithContent('linkedin', assets.linkedin_post)}
                  className="h-8"
                  disabled={!assets.linkedin_post || assets.linkedin_post === 'No content generated'}
                >
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {truncateText(assets.linkedin_post, 300)}
              </p>
            </div>
            <div className="text-xs text-gray-500">
              {assets.linkedin_post?.length || 0} characters
            </div>
          </TabsContent>

          {/* Twitter Thread */}
          <TabsContent value="twitter" className="space-y-3">
            <div className="flex justify-between items-start">
              <h4 className="font-medium text-gray-800">Twitter Thread</h4>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(xThread.join('\n\n'), 'twitter')}
                  className="h-8"
                  disabled={!xThread.length || xThread[0] === 'No content generated'}
                >
                  {copiedField === 'twitter' ? (
                    <Check className="w-3 h-3 text-green-600" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openPlatformWithContent('twitter', xThread.join('\n\n'))}
                  className="h-8"
                  disabled={!xThread.length || xThread[0] === 'No content generated'}
                >
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto space-y-2">
              {xThread.map((tweet: string, index: number) => (
                <div key={index} className="text-sm text-gray-700">
                  <span className="text-xs text-gray-500 font-mono">
                    {index + 1}/{xThread.length}
                  </span>
                  <p className="mt-1">{tweet}</p>
                </div>
              ))}
            </div>
            <div className="text-xs text-gray-500">
              {xThread.length} tweets
            </div>
          </TabsContent>

          {/* Blog Post */}
          <TabsContent value="blog" className="space-y-3">
            <div className="flex justify-between items-start">
              <h4 className="font-medium text-gray-800">Blog Post</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(assets.short_blog, 'blog')}
                className="h-8"
                disabled={!assets.short_blog || assets.short_blog === 'No content generated'}
              >
                {copiedField === 'blog' ? (
                  <Check className="w-3 h-3 text-green-600" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </Button>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {truncateText(assets.short_blog, 300)}
              </p>
            </div>
            <div className="text-xs text-gray-500">
              {assets.short_blog?.length || 0} characters
            </div>
          </TabsContent>

          {/* Email Content */}
          <TabsContent value="email" className="space-y-3">
            <div className="flex justify-between items-start">
              <h4 className="font-medium text-gray-800">Email Template</h4>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(emailContent, 'email')}
                  className="h-8"
                  disabled={!emailContent || emailContent === 'No content generated'}
                >
                  {copiedField === 'email' ? (
                    <Check className="w-3 h-3 text-green-600" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openPlatformWithContent('email', emailContent)}
                  className="h-8"
                  disabled={!emailContent || emailContent === 'No content generated'}
                >
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {emailContent}
              </p>
            </div>
            <div className="text-xs text-gray-500">
              {emailContent?.length || 0} characters
            </div>
          </TabsContent>

          {/* Carousel */}
          <TabsContent value="carousel" className="space-y-3">
            <div className="flex justify-between items-start">
              <h4 className="font-medium text-gray-800">Carousel Script</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(assets.carousel, 'carousel')}
                className="h-8"
                disabled={!assets.carousel || assets.carousel === 'No content generated'}
              >
                {copiedField === 'carousel' ? (
                  <Check className="w-3 h-3 text-green-600" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </Button>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {assets.carousel}
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}