import { apiClient } from './apiClient';
import type {
  AdminUpdateUserRequest,
  ApiResponse,
  AuthResponse,
  CartDto,
  CategoryDto,
  ChatbotResponse,
  CommentDto,
  ConversationDto,
  CreateCategoryRequest,
  CreateCommentRequest,
  CreatePostRequest,
  CreateProductRequest,
  CreateShopRequest,
  CursorPagedResult,
  EditMessageRequest,
  FeedPostDto,
  MarkReadRequest,
  MessageDeletedDto,
  MessageDto,
  MessageReadDto,
  NotificationCountDto,
  NotificationDto,
  OrderDto,
  PagedResult,
  PaginationParams,
  PostDto,
  PostMediaDto,
  ProductDto,
  ProductImageDto,
  ProductSearchDto,
  ProductSearchParams,
  PublicUserProfileDto,
  ReactionRequest,
  RevenueDto,
  SendMessageRequest,
  ShipperProfileDto,
  ShopDto,
  ShopSearchDto,
  UpdateCategoryRequest,
  UpdateCommentRequest,
  UpdatePostRequest,
  UpdateProductRequest,
  UpdateShipperProfileRequest,
  UpdateShopRequest,
  UpdateUserRequest,
  UserDto,
  UserInfoDto,
} from '../../types';

// ==========================================
// 1. AUTH SERVICE
// ==========================================
export const authService = {
  async register(data: { username: string; email: string; password: string; displayName: string }): Promise<AuthResponse> {
    const res = await apiClient.post<ApiResponse<AuthResponse>>('/api/auth/register', data);
    return res.data.data!;
  },

  async login(data: { username: string; password: string }): Promise<AuthResponse> {
    const res = await apiClient.post<ApiResponse<AuthResponse>>('/api/auth/login', data);
    return res.data.data!;
  },

  async getMe(): Promise<UserInfoDto> {
    const res = await apiClient.get<ApiResponse<UserInfoDto>>('/api/auth/me');
    return res.data.data!;
  },
};

// ==========================================
// 2. USER SERVICE
// ==========================================
export const userService = {
  async getById(id: string): Promise<UserDto> {
    const res = await apiClient.get<ApiResponse<UserDto>>(`/api/users/${id}`);
    return res.data.data!;
  },

  async getPublicProfile(id: string): Promise<PublicUserProfileDto> {
    const res = await apiClient.get<ApiResponse<PublicUserProfileDto>>(`/api/users/${id}/profile`);
    return res.data.data!;
  },

  async updateProfile(data: UpdateUserRequest): Promise<UserDto> {
    const res = await apiClient.put<ApiResponse<UserDto>>('/api/users/me', data);
    return res.data.data!;
  },

  async updateAvatar(file: File): Promise<UserDto> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post<ApiResponse<UserDto>>('/api/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data!;
  },

  async follow(id: string): Promise<void> {
    await apiClient.post(`/api/users/${id}/follow`);
  },

  async unfollow(id: string): Promise<void> {
    await apiClient.delete(`/api/users/${id}/follow`);
  },

  async getFollowers(id: string, pagination?: PaginationParams): Promise<PagedResult<UserDto>> {
    const res = await apiClient.get<ApiResponse<PagedResult<UserDto>>>(`/api/users/${id}/followers`, {
      params: pagination,
    });
    return res.data.data!;
  },

  async getFollowing(id: string, pagination?: PaginationParams): Promise<PagedResult<UserDto>> {
    const res = await apiClient.get<ApiResponse<PagedResult<UserDto>>>(`/api/users/${id}/following`, {
      params: pagination,
    });
    return res.data.data!;
  },

  async getUserPosts(id: string, pagination?: PaginationParams): Promise<PagedResult<PostDto>> {
    const res = await apiClient.get<ApiResponse<PagedResult<PostDto>>>(`/api/users/${id}/posts`, {
      params: pagination,
    });
    return res.data.data!;
  },

  async getByUsername(username: string): Promise<PublicUserProfileDto> {
    const clean = username.trim().replace(/^@/, '');
    const res = await apiClient.get<ApiResponse<PublicUserProfileDto>>(`/api/users/by-username/${encodeURIComponent(clean)}`);
    return res.data.data!;
  },

  async searchUsers(query: string): Promise<PublicUserProfileDto[]> {
    const clean = query.trim().replace(/^@/, '');
    const res = await apiClient.get<ApiResponse<PublicUserProfileDto[]>>('/api/users/search', {
      params: { q: clean },
    });
    return res.data.data!;
  },
};

// ==========================================
// 3. FEED SERVICE
// ==========================================
export const feedService = {
  async getSocialFeed(limit = 20, cursor?: string | null): Promise<CursorPagedResult<FeedPostDto>> {
    const res = await apiClient.get<ApiResponse<CursorPagedResult<FeedPostDto>>>('/api/feed', {
      params: { limit, cursor: cursor || undefined },
    });
    return res.data.data!;
  },

  async getVideoFeed(limit = 10, cursor?: string | null): Promise<CursorPagedResult<FeedPostDto>> {
    const res = await apiClient.get<ApiResponse<CursorPagedResult<FeedPostDto>>>('/api/feed/videos', {
      params: { limit, cursor: cursor || undefined },
    });
    return res.data.data!;
  },
};

// ==========================================
// 4. POST SERVICE
// ==========================================
export const postService = {
  async getAll(pagination?: PaginationParams): Promise<PagedResult<PostDto>> {
    const res = await apiClient.get<ApiResponse<PagedResult<PostDto>>>('/api/posts', {
      params: pagination,
    });
    return res.data.data!;
  },

  async getById(id: string): Promise<PostDto> {
    const res = await apiClient.get<ApiResponse<PostDto>>(`/api/posts/${id}`);
    return res.data.data!;
  },

  async create(data: CreatePostRequest): Promise<PostDto> {
    const res = await apiClient.post<ApiResponse<PostDto>>('/api/posts', data);
    return res.data.data!;
  },

  async update(id: string, data: UpdatePostRequest): Promise<PostDto> {
    const res = await apiClient.put<ApiResponse<PostDto>>(`/api/posts/${id}`, data);
    return res.data.data!;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/api/posts/${id}`);
  },

  async addMedia(id: string, file: File): Promise<PostMediaDto> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post<ApiResponse<PostMediaDto>>(`/api/posts/${id}/media`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data!;
  },

  async deleteMedia(id: string, mediaId: string): Promise<void> {
    await apiClient.delete(`/api/posts/${id}/media/${mediaId}`);
  },

  async toggleReaction(id: string, request: ReactionRequest): Promise<string | null> {
    const res = await apiClient.post<ApiResponse<{ reaction: string | null }>>(`/api/posts/${id}/reaction`, request);
    return res.data.data?.reaction ?? null;
  },

  async removeReaction(id: string): Promise<void> {
    await apiClient.delete(`/api/posts/${id}/reaction`);
  },
};

// ==========================================
// 5. COMMENT SERVICE
// ==========================================
export const commentService = {
  async getByPost(postId: string, pagination?: PaginationParams): Promise<PagedResult<CommentDto>> {
    const res = await apiClient.get<ApiResponse<PagedResult<CommentDto>>>(`/api/posts/${postId}/comments`, {
      params: pagination,
    });
    return res.data.data!;
  },

  async create(postId: string, data: CreateCommentRequest): Promise<CommentDto> {
    const res = await apiClient.post<ApiResponse<CommentDto>>(`/api/posts/${postId}/comments`, data);
    return res.data.data!;
  },

  async update(id: string, data: UpdateCommentRequest): Promise<CommentDto> {
    const res = await apiClient.put<ApiResponse<CommentDto>>(`/api/comments/${id}`, data);
    return res.data.data!;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/api/comments/${id}`);
  },
};

// ==========================================
// 6. SHOPPING & PRODUCTS SERVICE
// ==========================================
export const shoppingService = {
  async getCategories(): Promise<CategoryDto[]> {
    const res = await apiClient.get<ApiResponse<CategoryDto[]>>('/api/categories');
    return res.data.data!;
  },

  async searchProducts(params: ProductSearchParams): Promise<PagedResult<ProductSearchDto>> {
    const res = await apiClient.get<ApiResponse<PagedResult<ProductSearchDto>>>('/api/search/products', {
      params,
    });
    return res.data.data!;
  },

  async searchShops(q?: string, pagination?: PaginationParams): Promise<PagedResult<ShopSearchDto>> {
    const res = await apiClient.get<ApiResponse<PagedResult<ShopSearchDto>>>('/api/search/shops', {
      params: { q, ...pagination },
    });
    return res.data.data!;
  },

  async getAllProducts(categoryId?: string, pagination?: PaginationParams): Promise<PagedResult<ProductDto>> {
    const res = await apiClient.get<ApiResponse<PagedResult<ProductDto>>>('/api/products', {
      params: { categoryId, ...pagination },
    });
    return res.data.data!;
  },

  async getProductById(id: string): Promise<ProductDto> {
    const res = await apiClient.get<ApiResponse<ProductDto>>(`/api/products/${id}`);
    return res.data.data!;
  },

  async getAllShops(pagination?: PaginationParams): Promise<PagedResult<ShopDto>> {
    const res = await apiClient.get<ApiResponse<PagedResult<ShopDto>>>('/api/shops', {
      params: pagination,
    });
    return res.data.data!;
  },

  async getShopById(id: string): Promise<ShopDto> {
    const res = await apiClient.get<ApiResponse<ShopDto>>(`/api/shops/${id}`);
    return res.data.data!;
  },

  async getShopProducts(shopId: string, categoryId?: string, sort?: string, pagination?: PaginationParams): Promise<PagedResult<ProductDto>> {
    const res = await apiClient.get<ApiResponse<PagedResult<ProductDto>>>(`/api/shops/${shopId}/products`, {
      params: { categoryId, sort, ...pagination },
    });
    return res.data.data!;
  },
};

// ==========================================
// 7. CART SERVICE
// ==========================================
export const cartService = {
  async getCart(): Promise<CartDto> {
    const res = await apiClient.get<ApiResponse<CartDto>>('/api/cart');
    return res.data.data!;
  },

  async addItem(productId: string, quantity = 1): Promise<CartDto> {
    const res = await apiClient.post<ApiResponse<CartDto>>('/api/cart/items', { productId, quantity });
    return res.data.data!;
  },

  async updateItem(cartItemId: string, quantity: number): Promise<CartDto> {
    const res = await apiClient.put<ApiResponse<CartDto>>(`/api/cart/items/${cartItemId}`, { quantity });
    return res.data.data!;
  },

  async removeItem(cartItemId: string): Promise<void> {
    await apiClient.delete(`/api/cart/items/${cartItemId}`);
  },

  async clearCart(): Promise<void> {
    await apiClient.delete('/api/cart');
  },
};

// ==========================================
// 8. ORDER SERVICE
// ==========================================
export const orderService = {
  async checkout(shippingAddress: string): Promise<OrderDto[]> {
    const res = await apiClient.post<ApiResponse<OrderDto[]>>('/api/orders/checkout', { shippingAddress });
    return res.data.data!;
  },

  async getMyOrders(status?: string, pagination?: PaginationParams): Promise<PagedResult<OrderDto>> {
    const res = await apiClient.get<ApiResponse<PagedResult<OrderDto>>>('/api/orders/my', {
      params: { status, ...pagination },
    });
    return res.data.data!;
  },

  async getById(id: string): Promise<OrderDto> {
    const res = await apiClient.get<ApiResponse<OrderDto>>(`/api/orders/${id}`);
    return res.data.data!;
  },

  async cancelOrder(id: string): Promise<void> {
    await apiClient.post(`/api/orders/${id}/cancel`);
  },
};

// ==========================================
// 9. SHOP OWNER SERVICE
// ==========================================
export const shopOwnerService = {
  async createShop(data: CreateShopRequest): Promise<ShopDto> {
    const res = await apiClient.post<ApiResponse<ShopDto>>('/api/shops', data);
    return res.data.data!;
  },

  async updateShop(id: string, data: UpdateShopRequest): Promise<ShopDto> {
    const res = await apiClient.put<ApiResponse<ShopDto>>(`/api/shops/${id}`, data);
    return res.data.data!;
  },

  async createProduct(shopId: string, data: CreateProductRequest): Promise<ProductDto> {
    const res = await apiClient.post<ApiResponse<ProductDto>>(`/api/shops/${shopId}/products`, data);
    return res.data.data!;
  },

  async updateProduct(id: string, data: UpdateProductRequest): Promise<ProductDto> {
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
      params: { status, ...pagination },
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

// ==========================================
// 10. SHIPPER SERVICE
// ==========================================
export const shipperService = {
  async getProfile(): Promise<ShipperProfileDto | null> {
    const res = await apiClient.get<ApiResponse<ShipperProfileDto>>('/api/shipper/profile');
    return res.data.data ?? null;
  },

  async updateProfile(data: UpdateShipperProfileRequest): Promise<ShipperProfileDto> {
    const res = await apiClient.put<ApiResponse<ShipperProfileDto>>('/api/shipper/profile', data);
    return res.data.data!;
  },

  async getAvailableOrders(pagination?: PaginationParams): Promise<PagedResult<OrderDto>> {
    const res = await apiClient.get<ApiResponse<PagedResult<OrderDto>>>('/api/shipper/orders/available', {
      params: pagination,
    });
    return res.data.data!;
  },

  async getMyOrders(status?: string, pagination?: PaginationParams): Promise<PagedResult<OrderDto>> {
    const res = await apiClient.get<ApiResponse<PagedResult<OrderDto>>>('/api/shipper/orders/my', {
      params: { status, ...pagination },
    });
    return res.data.data!;
  },

  async claimOrder(id: string): Promise<void> {
    await apiClient.post(`/api/shipper/orders/${id}/claim`);
  },

  async pickupOrder(id: string): Promise<void> {
    await apiClient.post(`/api/shipper/orders/${id}/pickup`);
  },

  async deliverOrder(id: string): Promise<void> {
    await apiClient.post(`/api/shipper/orders/${id}/deliver`);
  },

  async getShipperRevenue(from: string, to: string): Promise<RevenueDto> {
    const res = await apiClient.get<ApiResponse<RevenueDto>>('/api/shipper/revenue', {
      params: { from, to },
    });
    return res.data.data!;
  },
};

// ==========================================
// 11. ADMIN SERVICE
// ==========================================
export const adminService = {
  async getUsers(pagination?: PaginationParams): Promise<PagedResult<UserDto>> {
    const res = await apiClient.get<ApiResponse<PagedResult<UserDto>>>('/api/admin/users', {
      params: pagination,
    });
    return res.data.data!;
  },

  async getUser(id: string): Promise<UserDto> {
    const res = await apiClient.get<ApiResponse<UserDto>>(`/api/admin/users/${id}`);
    return res.data.data!;
  },

  async updateUser(id: string, data: AdminUpdateUserRequest): Promise<UserDto> {
    const res = await apiClient.put<ApiResponse<UserDto>>(`/api/admin/users/${id}`, data);
    return res.data.data!;
  },

  async deleteUser(id: string): Promise<void> {
    await apiClient.delete(`/api/admin/users/${id}`);
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

  async getAllOrders(status?: string, pagination?: PaginationParams): Promise<PagedResult<OrderDto>> {
    const res = await apiClient.get<ApiResponse<PagedResult<OrderDto>>>('/api/admin/orders', {
      params: { status, ...pagination },
    });
    return res.data.data!;
  },

  async getRevenue(from: string, to: string): Promise<RevenueDto> {
    const res = await apiClient.get<ApiResponse<RevenueDto>>('/api/admin/revenue', {
      params: { from, to },
    });
    return res.data.data!;
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
};

// ==========================================
// 12. CHAT SERVICE
// ==========================================
export const chatService = {
  async getConversations(pagination?: PaginationParams): Promise<PagedResult<ConversationDto>> {
    const res = await apiClient.get<ApiResponse<PagedResult<ConversationDto>>>('/api/conversations', {
      params: pagination,
    });
    return res.data.data!;
  },

  async getOrCreateConversation(participantIdOrUsername: string): Promise<ConversationDto> {
    const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(participantIdOrUsername.trim());
    const payload = isGuid
      ? { participantId: participantIdOrUsername.trim() }
      : { username: participantIdOrUsername.trim().replace(/^@/, '') };
    const res = await apiClient.post<ApiResponse<ConversationDto>>('/api/conversations', payload);
    return res.data.data!;
  },

  async getMessages(conversationId: string, pagination?: PaginationParams): Promise<PagedResult<MessageDto>> {
    const res = await apiClient.get<ApiResponse<PagedResult<MessageDto>>>(`/api/conversations/${conversationId}/messages`, {
      params: pagination,
    });
    return res.data.data!;
  },

  async sendMessage(conversationId: string, data: SendMessageRequest): Promise<MessageDto> {
    const res = await apiClient.post<ApiResponse<MessageDto>>(`/api/conversations/${conversationId}/messages`, data);
    return res.data.data!;
  },

  async editMessage(conversationId: string, messageId: string, data: EditMessageRequest): Promise<MessageDto> {
    const res = await apiClient.put<ApiResponse<MessageDto>>(`/api/conversations/${conversationId}/messages/${messageId}`, data);
    return res.data.data!;
  },

  async deleteMessage(conversationId: string, messageId: string): Promise<MessageDeletedDto> {
    const res = await apiClient.delete<ApiResponse<MessageDeletedDto>>(`/api/conversations/${conversationId}/messages/${messageId}`);
    return res.data.data!;
  },

  async markRead(conversationId: string, data: MarkReadRequest): Promise<MessageReadDto> {
    const res = await apiClient.post<ApiResponse<MessageReadDto>>(`/api/conversations/${conversationId}/read`, data);
    return res.data.data!;
  },
};

// ==========================================
// 13. NOTIFICATIONS SERVICE
// ==========================================
export const notificationService = {
  async getAll(pagination?: PaginationParams): Promise<PagedResult<NotificationDto>> {
    const res = await apiClient.get<ApiResponse<PagedResult<NotificationDto>>>('/api/notifications', {
      params: pagination,
    });
    return res.data.data!;
  },

  async getUnreadCount(): Promise<number> {
    const res = await apiClient.get<ApiResponse<NotificationCountDto>>('/api/notifications/unread-count');
    return res.data.data?.unreadCount ?? 0;
  },

  async markAsRead(id: string): Promise<NotificationDto> {
    const res = await apiClient.post<ApiResponse<NotificationDto>>(`/api/notifications/${id}/read`);
    return res.data.data!;
  },

  async markAllAsRead(): Promise<void> {
    await apiClient.post('/api/notifications/read-all');
  },
};

// ==========================================
// 14. CHATBOT SERVICE
// ==========================================
export const chatbotService = {
  async chat(message: string): Promise<ChatbotResponse> {
    const res = await apiClient.post<ApiResponse<ChatbotResponse>>('/api/chatbot/chat', { message });
    return res.data.data!;
  },

  async clearSession(): Promise<void> {
    await apiClient.delete('/api/chatbot/session');
  },

  async checkHealth(): Promise<{ available: boolean; service: string }> {
    const res = await apiClient.get<ApiResponse<{ available: boolean; service: string }>>('/api/chatbot/health');
    return res.data.data!;
  },
};
