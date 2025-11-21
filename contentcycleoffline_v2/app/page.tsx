// app/page.tsx
'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  Link as LinkIcon, 
  Upload, 
  Sparkles, 
  HelpCircle,
  Linkedin,
  Twitter,
  Instagram,
  FileText,
  Mail,
  Youtube,
  Images
} from 'lucide-react';
import { LoadingWave } from '@/components/LoadingWave';

export default function Home() {
  const [content, setContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [url, setUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId) 
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    );
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };


  const useDemoContent = () => {
    const demoContent = `The Future of Content Creation

In today's digital world, creating content across platforms is essential. But adapting content manually? Time-consuming.

AI-powered transformation changes everything. Automatically adapt long-form content while keeping your message intact.

Benefits:
⏰ Save time
✨ Stay consistent
🎯 Reach your audience everywhere

The future is multi-platform. The tools are here now.`;
    setContent(demoContent);
  };

  const simulateProgress = () => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);
  };

  const handleGenerate = async () => {
    if (!content.trim() && files.length === 0 && !url) {
      setError('Please provide content, upload files, or add a URL');
      return;
    }

    if (selectedPlatforms.length === 0) {
      setError('Please select at least one platform');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      
      // Add text content if provided
      if (content.trim()) {
        // Create a text file from content
        const textBlob = new Blob([content], { type: 'text/plain' });
        const textFile = new File([textBlob], 'content.txt', { type: 'text/plain' });
        formData.append('files', textFile);
      }

      // Add files
      files.forEach(file => {
        formData.append('files', file);
      });

      // Add URL if provided
      if (url && url.startsWith('http')) {
        formData.append('url', url);
      }

      // Add processing options (using defaults that match backend expectations)
      formData.append('creationMode', 'standard');
      formData.append('postCount', '3');
      formData.append('tone', 'Professional and engaging');

      simulateProgress();

      const res = await fetch('/api/process', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Processing failed');
      }

      setProgress(100);
      sessionStorage.setItem('result', JSON.stringify(data));
      sessionStorage.setItem('selectedPlatforms', JSON.stringify(selectedPlatforms));
      router.push('/results');
      
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setLoading(false);
      setProgress(0);
    }
  };

  if (loading) {
    return <LoadingWave progress={progress} />;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-blue-600">RepurposeX</h1>
          </div>
          <Button variant="ghost" size="sm" className="text-xs sm:text-sm">
            <HelpCircle className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
            <span className="hidden sm:inline">Help</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 md:py-12">
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 sm:mb-3">
            Transform Your Content Across Platforms
          </h2>
          <p className="text-base sm:text-lg text-gray-600 px-2">
            Paste your content, select platforms, and watch the magic happen.
          </p>
        </div>

        {/* Content Input Area */}
        <div className="mb-4 sm:mb-6">
          <div className="relative">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste your long-form content here... (blog post, article, newsletter, etc.)"
              className="w-full h-48 sm:h-56 md:h-64 px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-none text-sm sm:text-base text-gray-900 placeholder-gray-400"
            />
            <div className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 text-xs sm:text-sm text-gray-500">
              {content.length} characters
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 sm:gap-3 mb-6 sm:mb-8">
          <Button
            variant="outline"
            onClick={() => {
              const urlInput = prompt('Enter URL:');
              if (urlInput) {
                setUrl(urlInput);
                setError('');
              }
            }}
            className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm px-3 sm:px-4"
          >
            <LinkIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">Add URL</span>
            <span className="xs:hidden">URL</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm px-3 sm:px-4"
          >
            <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">Upload File</span>
            <span className="xs:hidden">Upload</span>
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            accept=".txt,.md,.pdf,.doc,.docx,.ppt,.pptx"
            className="hidden"
            multiple
          />
          <Button
            onClick={useDemoContent}
            className="flex items-center gap-1.5 sm:gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm px-3 sm:px-4"
          >
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">Use Demo Content</span>
            <span className="xs:hidden">Demo</span>
          </Button>
        </div>

        {/* Platform Selection */}
        <div className="mb-6 sm:mb-8">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
            Select Target Platforms
          </h3>
          <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-2 sm:gap-3">
            {platforms.map((platform) => {
              const Icon = platform.icon;
              const isSelected = selectedPlatforms.includes(platform.id);
              return (
                <button
                  key={platform.id}
                  onClick={() => togglePlatform(platform.id)}
                  className={`flex flex-col items-center justify-center gap-1.5 sm:gap-2 p-3 sm:p-4 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center ${
                    isSelected ? platform.color : 'bg-gray-100'
                  }`}>
                    <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${isSelected ? 'text-white' : 'text-gray-600'}`} />
                  </div>
                  <span className={`text-xs sm:text-sm font-medium text-center leading-tight ${
                    isSelected ? 'text-blue-600' : 'text-gray-700'
                  }`}>
                    {platform.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Generate Button */}
        <div className="text-center">
          <Button
            onClick={handleGenerate}
            disabled={selectedPlatforms.length === 0}
            className={`w-full sm:w-auto px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg font-semibold rounded-lg ${
              selectedPlatforms.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
            }`}
          >
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            <span className="hidden sm:inline">Generate Platform Content</span>
            <span className="sm:hidden">Generate</span>
          </Button>
          {selectedPlatforms.length === 0 && (
            <p className="text-xs sm:text-sm text-gray-500 mt-2 px-2">
              Select at least one platform to generate content
            </p>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs sm:text-sm">
            {error}
          </div>
        )}

        {/* Selected Files Display */}
        {files.length > 0 && (
          <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gray-50 rounded-lg">
            <p className="text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Selected Files ({files.length})
            </p>
            <div className="space-y-1">
              {files.map((file, index) => (
                <div key={index} className="text-xs sm:text-sm text-gray-600 truncate">
                  • {file.name}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
