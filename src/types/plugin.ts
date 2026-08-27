export interface PluginPrice {
  amount: number;
  currency: string;
}

export interface PluginRating {
  label: string;
  score: number;
  count: number;
}

export interface PluginSize {
  raw: string;
  bytes: number;
}

export interface Plugin {
  id: string;
  name: string;
  author: string;
  description: string;
  descriptionHtml?: string;
  category: string;
  version: string;
  uploadDate: string;
  previewImage: string;
  url: string;
  price: PluginPrice;
  rating: PluginRating;
  size: PluginSize;
  downloads: number;
  platforms: string[];
  minVersion: string;
  certified: boolean;
}

export interface PluginMetadata {
  scrapeDate: string;
  totalPlugins: number;
  totalDownloads: number;
  certifiedCreators: number;
  categoryStats: Record<string, number>;
}
