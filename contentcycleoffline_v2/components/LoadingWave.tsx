// components/LoadingWave.tsx (update the logo section)
'use client';

import { Progress } from '@/components/ui/progress';
import Image from 'next/image';

interface LoadingWaveProps {
  progress: number;
}

export function LoadingWave({ progress }: LoadingWaveProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full text-center">
        {/* Logo */}
        <div className="mb-6 sm:mb-8">
          <div className="w-16 h-16 sm:w-20 sm:h-20 relative mx-auto mb-3 sm:mb-4">
            <Image
              src="/logo.png"
              alt="ContentCycle Logo"
              fill
              className="object-contain"
            />
          </div>
        </div>

        {/* Rest of the component remains the same */}
        <div className="flex justify-center items-end space-x-0.5 sm:space-x-1 mb-6 sm:mb-8 h-10 sm:h-12">
          <div className="w-1.5 sm:w-2 bg-emerald-500 rounded-t-lg animate-wave h-3 sm:h-4 wave-delay-0" />
          <div className="w-1.5 sm:w-2 bg-emerald-500 rounded-t-lg animate-wave h-6 sm:h-8 wave-delay-1" />
          <div className="w-1.5 sm:w-2 bg-emerald-500 rounded-t-lg animate-wave h-9 sm:h-12 wave-delay-2" />
          <div className="w-1.5 sm:w-2 bg-emerald-500 rounded-t-lg animate-wave h-12 sm:h-16 wave-delay-3" />
          <div className="w-1.5 sm:w-2 bg-emerald-500 rounded-t-lg animate-wave h-16 sm:h-20 wave-delay-4" />
          <div className="w-1.5 sm:w-2 bg-emerald-500 rounded-t-lg animate-wave h-12 sm:h-16 wave-delay-5" />
          <div className="w-1.5 sm:w-2 bg-emerald-500 rounded-t-lg animate-wave h-9 sm:h-12 wave-delay-6" />
          <div className="w-1.5 sm:w-2 bg-emerald-500 rounded-t-lg animate-wave h-6 sm:h-8 wave-delay-7" />
        </div>

        {/* Progress */}
        <div className="space-y-3 sm:space-y-4">
          <Progress value={progress} className="h-1.5 sm:h-2 bg-emerald-100" />
          <div className="space-y-1.5 sm:space-y-2">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 px-2">
              {progress < 30 && "Reading your content..."}
              {progress >= 30 && progress < 60 && "Extracting key themes..."}
              {progress >= 60 && progress < 90 && "Generating content..."}
              {progress >= 90 && "Finalizing your content cycle..."}
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 px-2">
              This usually takes 30-60 seconds depending on content length
            </p>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-white/50 rounded-lg border border-emerald-100">
          <p className="text-xs sm:text-sm text-gray-600">
            💡 <strong>Pro tip:</strong> Longer content (2,000+ words) produces better theme extraction and more diverse outputs
          </p>
        </div>
      </div>
    </div>
  );
}