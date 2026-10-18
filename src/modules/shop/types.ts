export type ProductCategory =
  | 'Ashwagandha'
  | 'Triphala'
  | 'Chyawanprash'
  | 'Turmeric'
  | 'Tulsi'
  | 'Brahmi'
  | 'Shilajit'
  | 'Aloe Vera'
  | 'Neem'
  | 'Spirulina';

export type ProductForm = 'capsule' | 'powder' | 'oil' | 'tablet' | 'juice' | 'churna';

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: ProductCategory;
  form: ProductForm;
  price: number;
  mrp: number;
  rating: number;
  reviewCount: number;
  stock: number;
  tags: string[];
  ingredients: string[];
  description: string;
  imageUrl: string;
  inStock: boolean;
  searchText: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
  addedAt: number;
}

export interface ProductFilters {
  categories?: ProductCategory[];
  forms?: ProductForm[];
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStockOnly?: boolean;
  tags?: string[];
}

export type ProductSortOption = 'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'newest';

export interface ProductSearchParams extends ProductFilters {
  q?: string;
  sort?: ProductSortOption;
}

export interface CheckoutSummary {
  items: Array<{ product: Product; quantity: number; lineTotal: number }>;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  itemCount: number;
}
