import { useQuery } from '@tanstack/react-query';
import { shoppingService } from '../services/api/services';
import type { ProductSearchParams } from '../types';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: shoppingService.getCategories,
    staleTime: 10 * 60 * 1000,
  });
}

export function useProductSearch(params: ProductSearchParams) {
  return useQuery({
    queryKey: ['search', 'products', params],
    queryFn: () => shoppingService.searchProducts(params),
  });
}

export function useShopSearch(q?: string, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ['search', 'shops', q, page, pageSize],
    queryFn: () => shoppingService.searchShops(q, { page, pageSize }),
  });
}

export function useProductDetail(id?: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => (id ? shoppingService.getProductById(id) : Promise.reject('No ID')),
    enabled: !!id,
  });
}

export function useShopDetail(id?: string) {
  return useQuery({
    queryKey: ['shop', id],
    queryFn: () => (id ? shoppingService.getShopById(id) : Promise.reject('No ID')),
    enabled: !!id,
  });
}

export function useShopProducts(shopId?: string, categoryId?: string, sort?: string, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ['shop', shopId, 'products', categoryId, sort, page, pageSize],
    queryFn: () => (shopId ? shoppingService.getShopProducts(shopId, categoryId, sort, { page, pageSize }) : Promise.reject('No shopId')),
    enabled: !!shopId,
  });
}
