// ==========================================
// 1. COMMON / API TYPES
// ==========================================

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface CursorPagedResult<T> {
  items: T[];
  nextCursor?: string | null;
  hasMore: boolean;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

// ==========================================
// 2. AUTH & USER TYPES
// ==========================================

export type UserRole = 'User' | 'ShopOwner' | 'Shipper' | 'Admin';

export interface UserInfoDto {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  role: UserRole;
}

export interface AuthResponse {
  accessToken: string;
  expiration: string;
  user: UserInfoDto;
}

export interface UserDto {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  role: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isFollowing?: boolean;
  createdAt?: string;
}

export interface PublicUserProfileDto {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  followerCount: number;
  followingCount: number;
  postCount: number;
  isFollowing: boolean;
  createdAt: string;
}

export interface UpdateUserRequest {
  displayName?: string;
  bio?: string;
}

// ==========================================
// 3. POSTS & FEED
// ==========================================

export interface PostMediaDto {
  id: string;
  url: string;
  mediaType: 'Image' | 'Video' | string;
  displayOrder: number;
  thumbnailUrl?: string | null;
  width?: number | null;
  height?: number | null;
  durationSeconds?: number | null;
}

export interface PostDto {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  userAvatarUrl?: string | null;
  authorName?: string;
  authorAvatarUrl?: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
  media: PostMediaDto[];
  likeCount: number;
  dislikeCount: number;
  commentCount: number;
  currentUserReaction?: string | null; // "Like" | "Dislike" | null
}

export interface FeedAuthorDto {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
}

export interface FeedMediaDto {
  id: string;
  url: string;
  mediaType: string; // "Image" | "Video"
  displayOrder: number;
  thumbnailUrl?: string | null;
  width?: number | null;
  height?: number | null;
  durationSeconds?: number | null;
}

export interface FeedPostDto {
  id: string;
  author: FeedAuthorDto;
  content: string;
  createdAt: string;
  editedAt?: string | null;
  media: FeedMediaDto[];
  likeCount: number;
  dislikeCount: number;
  commentCount: number;
  currentUserReaction?: string | null;
  isFollowingAuthor?: boolean;
  // Backward compatibility convenience aliases
  userId?: string;
  authorName?: string;
  authorAvatarUrl?: string | null;
}

export interface CreatePostRequest {
  content: string;
}

export interface UpdatePostRequest {
  content: string;
}

export interface ReactionRequest {
  type: 'Like' | 'Dislike';
}

// ==========================================
// 4. COMMENTS
// ==========================================

export interface CommentDto {
  id: string;
  postId: string;
  userId: string;
  username: string;
  displayName: string;
  userAvatarUrl?: string | null;
  parentCommentId?: string | null;
  content: string;
  replyCount?: number;
  createdAt: string;
  updatedAt: string;
  // Backward compatibility convenience aliases
  authorName?: string;
  authorAvatarUrl?: string | null;
}

export interface CreateCommentRequest {
  content: string;
}

export interface UpdateCommentRequest {
  content: string;
}

// ==========================================
// 5. SHOPPING, PRODUCTS, SHOPS
// ==========================================

export interface CategoryDto {
  id: string;
  name: string;
  description?: string | null;
  parentCategoryId?: string | null;
  isActive: boolean;
}

export interface ShopDto {
  id: string;
  ownerId: string;
  name: string;
  description?: string | null;
  logoUrl?: string | null;
  isActive: boolean;
  productCount: number;
  createdAt: string;
}

export interface ProductImageDto {
  id: string;
  url: string;
  displayOrder: number;
}

export interface ProductDto {
  id: string;
  shopId: string;
  shopName: string;
  name: string;
  description?: string | null;
  price: number;
  stock: number;
  sku?: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
  isActive: boolean;
  images: ProductImageDto[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductSearchDto {
  id: string;
  shopId: string;
  shopName: string;
  name: string;
  description?: string | null;
  price: number;
  stock: number;
  categoryId?: string | null;
  categoryName?: string | null;
  imageUrl?: string | null;
  createdAt: string;
}

export interface ShopSearchDto {
  id: string;
  name: string;
  description?: string | null;
  logoUrl?: string | null;
  productCount: number;
  createdAt: string;
}

export interface ProductSearchParams {
  q?: string;
  categoryId?: string;
  shopId?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'name_asc' | string;
  page?: number;
  pageSize?: number;
}

export interface CreateShopRequest {
  name: string;
  description?: string;
}

export interface UpdateShopRequest {
  name: string;
  description?: string;
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  price: number;
  stock: number;
  sku?: string;
  categoryId?: string;
}

export interface UpdateProductRequest {
  name: string;
  description?: string;
  price: number;
  stock: number;
  sku?: string;
  categoryId?: string;
}

// ==========================================
// 6. CART
// ==========================================

export interface CartItemDto {
  id: string;
  productId: string;
  productName: string;
  productPrice: number;
  unitPrice: number;
  productImageUrl?: string | null;
  shopId: string;
  shopName: string;
  quantity: number;
  subtotal: number;
  currentStock: number;
  isAvailable: boolean;
}

export interface CartShopGroupDto {
  shopId: string;
  shopName: string;
  items: CartItemDto[];
  shopTotal: number;
}

export interface CartDto {
  id: string;
  items: CartItemDto[];
  totalPrice: number;
  cartTotal: number;
  shopGroups: CartShopGroupDto[];
}

export interface AddCartItemRequest {
  productId: string;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

// ==========================================
// 7. ORDERS & REVENUE
// ==========================================

export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Preparing'
  | 'WaitingForPickup'
  | 'Shipping'
  | 'Delivered'
  | 'Cancelled';

export interface OrderItemDto {
  id: string;
  productId: string;
  productNameSnapshot: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface OrderDto {
  id: string;
  buyerId: string;
  buyerName: string;
  shopId: string;
  shopName: string;
  shipperId?: string | null;
  shipperName?: string | null;
  totalPrice: number;
  shippingFee: number;
  status: OrderStatus;
  shippingAddress: string;
  items: OrderItemDto[];
  createdAt: string;
  updatedAt: string;
  deliveredAt?: string | null;
  cancelledAt?: string | null;
}

export interface CreateOrderRequest {
  shippingAddress: string;
}

export interface RevenueDto {
  totalRevenue: number;
  grossMerchandiseValue: number;
  totalOrders: number;
  deliveredOrderCount: number;
  totalItemsSold: number;
  totalShippingFees: number;
  from: string;
  to: string;
}

// ==========================================
// 8. SHIPPER & ADMIN
// ==========================================

export interface ShipperProfileDto {
  id: string;
  userId: string;
  phone?: string | null;
  vehicleType?: string | null;
  vehiclePlate?: string | null;
  isAvailable: boolean;
  createdAt: string;
}

export interface UpdateShipperProfileRequest {
  phone?: string;
  vehicleType?: string;
  vehiclePlate?: string;
  isAvailable?: boolean;
}

export interface AdminUpdateUserRequest {
  email?: string;
  displayName?: string;
  role?: string;
  isActive?: boolean;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  parentCategoryId?: string;
}

export interface UpdateCategoryRequest {
  name: string;
  description?: string;
  parentCategoryId?: string;
}

// ==========================================
// 9. CHAT & REALTIME
// ==========================================

export interface ConversationMemberDto {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  lastReadAt?: string | null;
}

export interface MessageDto {
  id: string;
  conversationId: string;
  senderId: string;
  senderUsername: string;
  senderDisplayName: string;
  content: string;
  clientMessageId?: string | null;
  isDeleted: boolean;
  createdAt: string;
  editedAt?: string | null;
}

export interface ConversationDto {
  id: string;
  members: ConversationMemberDto[];
  lastMessage?: MessageDto | null;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SendMessageRequest {
  content: string;
  clientMessageId?: string;
}

export interface EditMessageRequest {
  content: string;
}

export interface MarkReadRequest {
  messageId: string;
}

export interface TypingEventDto {
  conversationId: string;
  userId: string;
  username: string;
  isTyping: boolean;
}

export interface MessageDeliveryDto {
  messageId: string;
  conversationId: string;
  userId: string;
  deliveredAt: string;
}

export interface MessageReadDto {
  messageId: string;
  conversationId: string;
  userId: string;
  readAt: string;
}

export interface MessageDeletedDto {
  messageId: string;
  conversationId: string;
  deletedAt: string;
}

export interface UserPresenceDto {
  userId: string;
  isOnline: boolean;
  timestamp: string;
}

// ==========================================
// 10. NOTIFICATIONS
// ==========================================

export interface NotificationDto {
  id: string;
  type: string;
  title: string;
  content: string;
  relatedEntityId?: string | null;
  isRead: boolean;
  createdAt: string;
  readAt?: string | null;
}

export interface NotificationCountDto {
  unreadCount: number;
}

export interface NotificationReadEventDto {
  notificationId: string;
  isRead: boolean;
  readAt?: string | null;
}

// ==========================================
// 11. AI CHATBOT
// ==========================================

export interface ChatbotRequest {
  message: string;
}

export interface ChatbotResponse {
  reply: string;
  category?: string | null;
  durationMs: number;
  timeToFirstTokenMs?: number | null;
  outputTokens?: number | null;
}

export type ChatbotEventType = 'status' | 'token' | 'done' | 'error';

export interface ChatbotStreamEvent {
  event: ChatbotEventType;
  data: {
    state?: string;
    text?: string;
    category?: string;
    durationMs?: number;
    timeToFirstTokenMs?: number;
    totalTokens?: number;
    error?: string;
  };
}
