// components/home/types.ts

export interface Tag {
  id: string;
  name: string;
  slug: string;
  color?: string;
  icon?: string;
  category: string;
  sort_order?: number;
}

export interface Novel {
  id: string;
  title: string;
  author: string;
  description: string;
  category: string;
  cover_image_url: string;
  rating: number;
  total_ratings: number;
  views: number;
  tags?: Tag[];
  reading_progress?: {
    progress_percentage: number;
    current_page: number;
  };
}

export interface UserProfile {
  username?: string;
  avatar_url?: string | null;
  preferred_categories?: string[];
}

// One section rendered on the home screen.
// sectionType drives heading copy.
//   'next_read'  - personalised first section: "Your Next Read"
//   'preferred'  - user's other preferred genres
//   'category'   - remaining major genres
export interface CategorySection {
  category: string;
  books: Novel[];
  sectionType: 'next_read' | 'preferred' | 'category';
  label: string;
}

// Advertisement carousel item
export interface Advertisement {
  id: string;
  image_url: string;
  title: string;
  subtitle?: string;
  link_type: 'book' | 'category';
  link_value: string;
  sort_order: number;
}