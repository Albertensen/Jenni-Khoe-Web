export type SkinUndertone = 'warm' | 'neutral' | 'cool';
export type VenueLighting = 'indoor-ballroom' | 'outdoor-sunset' | 'outdoor-garden' | 'studio';

export interface PortfolioItem {
  id: string;
  title: string;
  category: string;
  beforeImg: string;
  afterImgs: {
    studio: string;
    natural: string;
  }[];
  skinUndertone: SkinUndertone;
  venueLighting: VenueLighting;
  description: string;
  brideName?: string;
  date?: string;
}

export interface BrideStory {
  id: string;
  name: string;
  role: string;
  photo: string;
  videoReel?: string;
  quote: string;
  rating: number;
  date: string;
  location: string;
}