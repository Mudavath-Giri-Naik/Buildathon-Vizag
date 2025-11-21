export interface RankedPost {
  rank?: number;
  platform: string;
  score?: number;
  reason?: string;
  preview?: string;
  content?: string;
  full_content?: string | string[];
  theme?: string;
  theme_id?: string;
}

export interface ThemeAssets {
  linkedin_post: string;
  x_thread: string[];
  short_blog: string;
  email?: string;
  carousel: string;
}

export interface Theme {
  theme_id: string;
  title: string;
  summary: string;
  importance_score: number;
  why_it_spreads: string;
  key_insights: string[];
  assets?: ThemeAssets;
}

export interface ProcessedResult {
  themes: Theme[];
  ranked: RankedPost[];
  wordCount: number;
  processedAt: string;
  settings: {
    creationMode: string;
    postCount: string;
    tone: string;
  };
}