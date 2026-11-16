import { apiClient } from '../../services/api/apiClient';
import type {
  ApiResponse,
  CategoryDto,
  CreateCategoryRequest,
  OrderDto,
  PagedResult,
  PaginationParams,
  PostDto,
  ProductDto,
  RevenueDto,
  ShopDto,
  UpdateCategoryRequest,
  UserDto,
  UserRole,
} from '../../types';

export interface AdminUserListItem extends UserDto {
  email?: string;
  isActive?: boolean;
  createdAt?: string;
  postCount?: number;
  followerCount?: number;
}

export interface AdminUsersQueryParams extends PaginationParams {
  q?: string;
  role?: string;
  isActive?: boolean;
}

export interface AdminCreateUserPayload {
  username: string;
  email: string;
  displayName: string;
  password: string;
  role: UserRole;
  bio?: string;
  shopName?: string;
  vehicleType?: string;
  licensePlate?: string;
}

export interface AdminUpdateUserPayload {
  displayName?: string;
  email?: string;
  bio?: string;
  role?: UserRole;
  isActive?: boolean;
  newPassword?: string;
}

export interface AdminUserRecentOrderDto {
  id: string;
  shopName?: string;
  totalPrice: number;
  status: string;
  createdAt: string;
}

export interface AdminUserShopSummaryDto {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  productCount: number;
  orderCount: number;
  totalRevenue: number;
}

export interface AdminUserShipperSummaryDto {
  vehicleType?: string | null;
  licensePlate?: string | null;
  vehiclePlate?: string | null;
  isAvailable: boolean;
  totalDeliveries: number;
}

export interface AdminUserDetailDto {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  role: UserRole | string;
  isActive: boolean;
  createdAt: string;
  // User role stats
  postsCount?: number;
  followersCount?: number;
  followingCount?: number;
  buyerOrdersCount?: number;
  totalSpent?: number;
  recentOrders?: AdminUserRecentOrderDto[];
  // ShopOwner role stats
  shops?: AdminUserShopSummaryDto[];
  // Shipper role stats
  shipperProfile?: AdminUserShipperSummaryDto | null;
  activeDeliveriesCount?: number;
  // Admin role stats
  adminPermissions?: string | string[] | null;
  adminPermissionsSummary?: string | null;
}

export const adminApi = {
  async getUsers(params?: AdminUsersQueryParams): Promise<PagedResult<AdminUserListItem>> {
    const res = await apiClient.get<ApiResponse<PagedResult<AdminUserListItem>>>('/api/admin/users', {
      params: {
        q: params?.q || undefined,
        role: params?.role || undefined,
        isActive: params?.isActive,
        page: params?.page,
        pageSize: params?.pageSize,
      },
    });
    return res.data.data!;
  },

  async getUserDetail(id: string): Promise<AdminUserDetailDto> {
    const res = await apiClient.get<ApiResponse<AdminUserDetailDto>>(`/api/admin/users/${id}/detail`);
    return res.data.data!;
  },

  async createUser(data: AdminCreateUserPayload): Promise<AdminUserListItem> {
    const res = await apiClient.post<ApiResponse<AdminUserListItem>>('/api/admin/users', data);
    return res.data.data!;
  },

  async updateUser(id: string, data: AdminUpdateUserPayload): Promise<AdminUserListItem> {
    const res = await apiClient.put<ApiResponse<AdminUserListItem>>(`/api/admin/users/${id}`, data);
    return res.data.data!;
  },

  async toggleUserActive(id: string): Promise<AdminUserListItem> {
    const res = await apiClient.patch<ApiResponse<AdminUserListItem>>(`/api/admin/users/${id}/toggle-active`);
    return res.data.data!;
  },

  async deleteUser(id: string, permanent = false): Promise<void> {
    await apiClient.delete(`/api/admin/users/${id}`, {
      params: { permanent },
    });
  },

  async getPosts(pagination?: PaginationParams): Promise<PagedResult<PostDto>> {
    const res = await apiClient.get<ApiResponse<PagedResult<PostDto>>>('/api/admin/posts', {
      params: pagination,
    });
    return res.data.data!;
  },

  async deletePost(id: string): Promise<void> {
    await apiClient.delete(`/api/admin/posts/${id}`);
  },

  async getShops(pagination?: PaginationParams): Promise<PagedResult<ShopDto>> {
    const res = await apiClient.get<ApiResponse<PagedResult<ShopDto>>>('/api/admin/shops', {
      params: pagination,
    });
    return res.data.data!;
  },

  async toggleShopActive(id: string): Promise<ShopDto> {
    const res = await apiClient.put<ApiResponse<ShopDto>>(`/api/admin/shops/${id}/toggle-active`);
    return res.data.data!;
  },

  async getAllOrders(status?: string, pagination?: PaginationParams): Promise<PagedResult<OrderDto>> {
    const res = await apiClient.get<ApiResponse<PagedResult<OrderDto>>>('/api/admin/orders', {
      params: { status: status || undefined, ...pagination },
    });
    return res.data.data!;
  },

  async getAllProducts(categoryId?: string, pagination?: PaginationParams): Promise<PagedResult<ProductDto>> {
    const res = await apiClient.get<ApiResponse<PagedResult<ProductDto>>>('/api/products', {
      params: { categoryId: categoryId || undefined, ...pagination },
    });
    return res.data.data!;
  },

  async deleteProduct(id: string): Promise<void> {
    await apiClient.delete(`/api/products/${id}`);
  },

  async getCategories(): Promise<CategoryDto[]> {
    const res = await apiClient.get<ApiResponse<CategoryDto[]>>('/api/categories');
    return res.data.data ?? [];
  },

  async createCategory(data: CreateCategoryRequest): Promise<CategoryDto> {
    const res = await apiClient.post<ApiResponse<CategoryDto>>('/api/admin/categories', data);
    return res.data.data!;
  },

  async updateCategory(id: string, data: UpdateCategoryRequest): Promise<CategoryDto> {
    const res = await apiClient.put<ApiResponse<CategoryDto>>(`/api/admin/categories/${id}`, data);
    return res.data.data!;
  },

  async deleteCategory(id: string): Promise<void> {
    await apiClient.delete(`/api/admin/categories/${id}`);
  },

  async getRevenue(from: string, to: string): Promise<RevenueDto> {
    const res = await apiClient.get<ApiResponse<RevenueDto>>('/api/admin/revenue', {
      params: { from, to },
    });
    return res.data.data!;
  },
};
