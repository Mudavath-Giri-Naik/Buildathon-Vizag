'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, Copy, Check } from 'lucide-react';

interface ExportButtonsProps {
  result: any;
}

export function ExportButtons({ result }: ExportButtonsProps) {
  const [exporting, setExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  const exportAsZip = async () => {
    setExporting(true);
    
    try {
      let exportContent = `# ContentCycle Export\n\n`;
      exportContent += `Generated: ${new Date(result.processedAt).toLocaleString()}\n`;
      exportContent += `Total Themes: ${result.themes.length}\n`;
      exportContent += `Total Words Processed: ${result.wordCount.toLocaleString()}\n\n`;

      result.themes.forEach((theme: any, index: number) => {
        exportContent += `## Theme ${index + 1}: ${theme.title}\n\n`;
        exportContent += `Summary: ${theme.summary}\n\n`;
        
        if (theme.assets?.linkedin_post) {
          exportContent += `### LinkedIn Post\n${theme.assets.linkedin_post}\n\n`;
        }
        
        if (theme.assets?.x_thread) {
          exportContent += `### Twitter Thread\n${theme.assets.x_thread.join('\n\n')}\n\n`;
        }
        
        if (theme.assets?.short_blog) {
          exportContent += `### Blog Post\n${theme.assets.short_blog.slice(0, 500)}...\n\n`;
        }
        
        exportContent += `---\n\n`;
      });

      const blob = new Blob([exportContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `contentcycle-export-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export files. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const exportAsJSON = () => {
    const dataStr = JSON.stringify(result, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `contentcycle-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const copyAllToClipboard = async () => {
    const allContent = result.themes.map((theme: any) => `
=== ${theme.title} ===

LinkedIn:
${theme.assets?.linkedin_post || 'N/A'}

Twitter Thread:
${theme.assets?.x_thread?.join('\n\n') || 'N/A'}

Blog:
${theme.assets?.short_blog?.slice(0, 500) || 'N/A'}

Carousel:
${theme.assets?.carousel || 'N/A'}
    `.trim()).join('\n\n---\n\n');
    
    await navigator.clipboard.writeText(allContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex gap-3">
      <Button
        onClick={exportAsZip}
        disabled={exporting}
        className="bg-emerald-600 hover:bg-emerald-700"
      >
        {exporting ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
        ) : (
          <Download className="w-4 h-4 mr-2" />
        )}
        {exporting ? 'Exporting...' : 'Export TXT'}
      </Button>
      
      <Button
        onClick={exportAsJSON}
        variant="outline"
        className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
      >
        <FileText className="w-4 h-4 mr-2" />
        JSON
      </Button>
      
      <Button
        onClick={copyAllToClipboard}
        variant="outline"
        className="border-gray-200 text-gray-700 hover:bg-gray-50"
      >
        {copied ? (
          <Check className="w-4 h-4 mr-2 text-green-600" />
        ) : (
          <Copy className="w-4 h-4 mr-2" />
        )}
        {copied ? 'Copied!' : 'Copy All'}
      </Button>
    </div>
  );
}