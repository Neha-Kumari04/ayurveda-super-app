import { api } from '@/core/api/client';

import type { Product, ProductSearchParams } from './types';
import type { Paginated, QueryParams } from '@/types';

export function toProductQueryParams(params: ProductSearchParams & { page?: number; pageSize?: number }): QueryParams {
  const query: QueryParams = { page: params.page, pageSize: params.pageSize };
  if (params.q) query.q = params.q;
  if (params.sort) query.sort = params.sort;
  if (params.categories?.length) query.categories = params.categories;
  if (params.forms?.length) query.forms = params.forms;
  if (params.tags?.length) query.tags = params.tags;
  if (params.minPrice !== undefined) query.minPrice = params.minPrice;
  if (params.maxPrice !== undefined) query.maxPrice = params.maxPrice;
  if (params.minRating) query.minRating = params.minRating;
  if (params.inStockOnly) query.inStockOnly = true;
  return query;
}

export const shopApi = {
  listProducts(params: ProductSearchParams & { page?: number; pageSize?: number }): Promise<Paginated<Product>> {
    return api.get<Paginated<Product>>('/products', toProductQueryParams(params), { cacheTtlMs: 5 * 60 * 1000 });
  },

  getProduct(id: string): Promise<Product> {
    return api.get<Product>(`/products/${id}`, undefined, { cacheTtlMs: 30 * 60 * 1000 });
  },
};
