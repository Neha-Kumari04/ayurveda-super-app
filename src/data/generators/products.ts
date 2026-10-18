import { buildSearchText } from '@/utils/search';
import { createRng, pick, pickMany, randomFloat, randomInt } from '@/utils/rng';

import type { Product, ProductCategory, ProductForm } from '@/modules/shop/types';

const CATEGORIES: ProductCategory[] = [
  'Ashwagandha', 'Triphala', 'Chyawanprash', 'Turmeric', 'Tulsi',
  'Brahmi', 'Shilajit', 'Aloe Vera', 'Neem', 'Spirulina',
];

const FORMS: ProductForm[] = ['capsule', 'powder', 'oil', 'tablet', 'juice', 'churna'];

const BRANDS = [
  'Himalaya', 'Dabur', 'Baidyanath', 'Zandu', 'Kottakkal', 'Kerala Ayurveda',
  'Organic India', 'Patanjali', 'Sattva', 'Vedic Era', 'Ayush', 'Charak',
  'Zauber Herbs', 'Botanica', 'Narasimha', 'Sri Sri Tattva',
];

const STRENGTHS = ['1000mg', '500mg', '250mg', '60mg', '30ml', '60ml', '100g', '200g', '500g', '1kg'];

const TAG_POOL = [
  'organic', 'sugar-free', 'vegan', 'GMP-certified', 'lab-tested', 'cold-pressed',
  'raw', 'non-GMO', 'ayurvedic', 'immunity', 'stress-relief', 'digestion',
  'energy', 'skin-care', 'hair-care', 'joint-care', 'sleep-aid', 'detox',
];

const INGREDIENTS_POOL = [
  'Ashwagandha', 'Amla', 'Giloy', 'Tulsi', 'Brahmi', 'Shankhpushpi', 'Guggul', 'Guduchi',
  'Haritaki', 'Bibhitaki', 'Amalaki', 'Pippali', 'Safed Musli', 'Shilajit', 'Neem',
  'Kumari', 'Bhringraj', 'Spirulina', 'Curcumin', 'Triphala',
];

export const PRODUCT_COUNT = 20000;
const SEED = 424242;

function productImageUrl(category: string, index: number): string {
  const hue = (index * 37) % 360;
  return `https://picsum.photos/seed/${encodeURIComponent(category)}_${index}/400/400?h=${hue}`;
}

function generateProducts(): Product[] {
  const rng = createRng(SEED);
  const products: Product[] = [];

  for (let i = 0; i < PRODUCT_COUNT; i++) {
    const id = `prod_${i + 1}`;
    const category = pick(rng, CATEGORIES);
    const brand = pick(rng, BRANDS);
    const form = pick(rng, FORMS);
    const strength = pick(rng, STRENGTHS);
    const variant = randomInt(rng, 1, 99);
    const name = `${brand} ${category} ${form.charAt(0).toUpperCase()}${form.slice(1)} ${strength} #${variant}`;
    const mrp = randomInt(rng, 150, 4500);
    const discountPct = randomInt(rng, 0, 45);
    const price = Math.max(99, Math.round(mrp * (1 - discountPct / 100)));
    const rating = randomFloat(rng, 2.8, 5.0, 1);
    const reviewCount = randomInt(rng, 0, 9000);
    const stock = rng() < 0.08 ? 0 : randomInt(rng, 1, 500);
    const tags = pickMany(rng, TAG_POOL, randomInt(rng, 1, 4));
    const ingredients = pickMany(rng, INGREDIENTS_POOL, randomInt(rng, 2, 5));
    const description = `${brand}'s ${category} ${form} is a classical Ayurvedic formulation crafted from ${ingredients.join(', ')}. Standardised extract, free from artificial additives. Supports holistic wellness as part of a balanced routine.`;

    const primaryText = `${name} ${brand}`.toLowerCase();
    const searchText = buildSearchText(name, brand, category, form, tags, ingredients, description);

    products.push({
      id,
      name,
      brand,
      category,
      form,
      price,
      mrp,
      rating,
      reviewCount,
      stock,
      tags,
      ingredients,
      description,
      imageUrl: productImageUrl(category, i),
      inStock: stock > 0,
      searchText: `${primaryText} ${searchText}`,
    });
  }

  return products;
}

let cached: Product[] | null = null;

/** Lazily generated, memoised singleton dataset (generated once per app run). */
export function getProducts(): Product[] {
  if (!cached) cached = generateProducts();
  return cached;
}

let byIdCache: Map<string, Product> | null = null;

export function getProductById(id: string): Product | undefined {
  if (!byIdCache) {
    byIdCache = new Map(getProducts().map((p) => [p.id, p]));
  }
  return byIdCache.get(id);
}
