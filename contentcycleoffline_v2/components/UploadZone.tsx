'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, FileText, Link, AlertCircle, Sparkles, Settings, Plus, X 
} from 'lucide-react';
import { LoadingWave } from './LoadingWave';

export function UploadZone() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const [creationMode, setCreationMode] = useState<'standard' | 'creative'>('standard');
  const [postCount, setPostCount] = useState<string>('3');
  const [tone, setTone] = useState<string>('Professional and engaging');
  const [files, setFiles] = useState<File[]>([]);
  const [url, setUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  // Add this to your existing state declarations
  const [contextWindow, setContextWindow] = useState<string>('');

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (newFiles: File[]) => {
    setError('');
    const validTypes = ['.txt', '.md', '.pdf', '.docx', '.doc', '.ppt', '.pptx'];
    
    const validFiles = newFiles.filter(file => {
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      
      if (!fileExtension || !validTypes.includes(fileExtension)) {
        setError(`Skipped ${file.name}: Please upload valid files (TXT, MD, PDF, DOC, DOCX, PPT, PPTX)`);
        return false;
      }

      if (file.size > 10 * 1024 * 1024) {
        setError(`Skipped ${file.name}: File size must be less than 10MB`);
        return false;
      }

      return true;
    });

    setFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
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

  const submitForm = async () => {
    if (files.length === 0 && !url) {
      setError('Please provide either files or a URL');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      
      // Add all files
      files.forEach(file => {
        formData.append('files', file);
      });

      // Add URL if provided
      if (url) {
        if (!url.startsWith('http')) {
          setError('Please enter a valid URL');
          setLoading(false);
          return;
        }
        formData.append('url', url);
      }

      // Add processing options
      formData.append('creationMode', creationMode);
      formData.append('postCount', postCount);
      formData.append('tone', tone);

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
      router.push('/results');
      
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setLoading(false);
      setProgress(0);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    submitForm();
  };

  if (loading) {
    return <LoadingWave progress={progress} />;
  }

  return (
    <div className="space-y-8">
      {/* Processing Options Card */}
      <Card className="bg-white/50 backdrop-blur-sm border-emerald-100">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Settings className="w-5 h-5 text-emerald-600" />
            <h3 className="font-semibold text-gray-800">Processing Options</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Creation Mode */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">Creation Mode</label>
              <Tabs value={creationMode} onValueChange={(v: any) => setCreationMode(v)} className="w-full">
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger value="standard" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Standard
                  </TabsTrigger>
                  <TabsTrigger value="creative" className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Creative
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <p className="text-xs text-gray-500">
                {creationMode === 'standard' 
                  ? 'Uses only the provided content' 
                  : 'Adds relevant information when appropriate'}
              </p>
            </div>

            {/* Post Count */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">Number of Posts</label>
              <input
                type="number"
                min="1"
                max="10"
                value={postCount}
                onChange={(e) => setPostCount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition"
                placeholder="3"
              />
              <p className="text-xs text-gray-500">
                {postCount === '1' 
                  ? 'All content will be summarized into one comprehensive post'
                  : `Generate ${postCount} distinct content pieces`}
              </p>
            </div>

            {/* Tone Context */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">Context Window (Optional)</label>
              <textarea
                value={contextWindow}
                onChange={(e) => setContextWindow(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition min-h-[80px] resize-y"
                placeholder="Add Text"
                rows={3}
              />
              <p className="text-xs text-gray-500">
                Provide additional context, focus areas, or specific instructions to guide the content generation
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Upload Card */}
      <Card className="border-2 border-dashed border-emerald-200 bg-white/50 backdrop-blur-sm">
        <CardContent className="p-8">
          <div
            className={`relative rounded-lg transition-all duration-200 ${
              dragActive ? 'bg-emerald-50 scale-[1.02]' : 'bg-transparent'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              accept=".txt,.md,.pdf,.doc,.docx,.ppt,.pptx"
              className="hidden"
              multiple
              aria-label="Upload content files"
            />
            
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-emerald-600" />
              </div>
              
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Drag & drop your files
              </h3>
              
              <p className="text-gray-600 mb-4">
                Supports multiple TXT, MD, PDF, DOC, DOCX, PPT, PPTX files (max 10MB each)
              </p>
              
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Choose Files
              </Button>
            </div>
          </div>

          {/* Selected Files List */}
          {files.length > 0 && (
            <div className="mt-6 space-y-3">
              <h4 className="font-medium text-gray-800">Selected Files ({files.length})</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700">{file.name}</span>
                      <span className="text-xs text-gray-500">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="h-8 w-8 p-0 text-gray-500 hover:text-red-600"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* URL Input Card */}
      <Card className="bg-white/50 backdrop-blur-sm border-emerald-100">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <Link className="w-5 h-5 text-emerald-600" />
              <label htmlFor="url-input" className="font-medium text-gray-800">
                Or paste article URL (optional)
              </label>
            </div>
            
            <div className="flex gap-3">
              <input
                id="url-input"
                name="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/article"
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition"
                disabled={loading}
              />
              
              <Button
                type="submit"
                disabled={loading || (files.length === 0 && !url)}
                className="bg-emerald-600 hover:bg-emerald-700 px-8"
              >
                Process Content
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Info Tips */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
          <span>Upload multiple files (PDFs, docs, presentations) for comprehensive analysis</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
          <span>1,000+ words recommended for best results with multiple themes</span>
        </div>
      </div>
    </div>
  );
}