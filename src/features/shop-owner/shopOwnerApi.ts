import { apiClient } from '../../services/api/apiClient';
import type {
  ApiResponse,
  CategoryDto,
  CreateProductRequest,
  OrderDto,
  PagedResult,
  PaginationParams,
  ProductDto,
  ProductImageDto,
  RevenueDto,
  ShopDto,
} from '../../types';
import { resolveMediaUrl } from '../../utils/mediaUrl';

export interface ShopOwnerUpdateProductPayload {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  sku?: string;
  categoryId?: string | null;
  isActive?: boolean;
}

export function getProductImageSrc(img: ProductImageDto | { imageUrl?: string; url?: string }): string | null {
  const raw = (img as { imageUrl?: string; url?: string }).imageUrl || (img as { url?: string }).url;
  return resolveMediaUrl(raw);
}

export const shopOwnerApi = {
  async getAllShops(pagination?: PaginationParams): Promise<PagedResult<ShopDto>> {
    const res = await apiClient.get<ApiResponse<PagedResult<ShopDto>>>('/api/shops', {
      params: pagination,
    });
    return res.data.data!;
  },

  async getCategories(): Promise<CategoryDto[]> {
    const res = await apiClient.get<ApiResponse<CategoryDto[]>>('/api/categories');
    return res.data.data ?? [];
  },

  async getShopProducts(
    shopId: string,
    params?: { categoryId?: string; sort?: string; page?: number; pageSize?: number }
  ): Promise<PagedResult<ProductDto>> {
    const res = await apiClient.get<ApiResponse<PagedResult<ProductDto>>>(`/api/shops/${shopId}/products`, {
      params,
    });
    return res.data.data!;
  },

  async createProduct(shopId: string, data: CreateProductRequest): Promise<ProductDto> {
    const res = await apiClient.post<ApiResponse<ProductDto>>(`/api/shops/${shopId}/products`, data);
    return res.data.data!;
  },

  async updateProduct(id: string, data: ShopOwnerUpdateProductPayload): Promise<ProductDto> {
    const res = await apiClient.put<ApiResponse<ProductDto>>(`/api/products/${id}`, data);
    return res.data.data!;
  },

  async deleteProduct(id: string): Promise<void> {
    await apiClient.delete(`/api/products/${id}`);
  },

  async addProductImage(id: string, file: File): Promise<ProductImageDto> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post<ApiResponse<ProductImageDto>>(`/api/products/${id}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data!;
  },

  async deleteProductImage(id: string, imageId: string): Promise<void> {
    await apiClient.delete(`/api/products/${id}/images/${imageId}`);
  },

  async getShopOrders(status?: string, pagination?: PaginationParams): Promise<PagedResult<OrderDto>> {
    const res = await apiClient.get<ApiResponse<PagedResult<OrderDto>>>('/api/shop/orders', {
      params: { status: status || undefined, ...pagination },
    });
    return res.data.data!;
  },

  async confirmOrder(id: string): Promise<void> {
    await apiClient.post(`/api/orders/${id}/confirm`);
  },

  async prepareOrder(id: string): Promise<void> {
    await apiClient.post(`/api/orders/${id}/prepare`);
  },

  async readyOrder(id: string): Promise<void> {
    await apiClient.post(`/api/orders/${id}/ready`);
  },

  async getShopRevenue(from: string, to: string): Promise<RevenueDto> {
    const res = await apiClient.get<ApiResponse<RevenueDto>>('/api/shop/revenue', {
      params: { from, to },
    });
    return res.data.data!;
  },
};
