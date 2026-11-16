import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  DollarSign,
  Edit3,
  Eye,
  FileText,
  Layers,
  Package,
  Plus,
  Power,
  Search,
  Shield,
  ShieldCheck,
  ShoppingBag,
  Store,
  Trash2,
  Truck,
  User as UserIcon,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { adminApi, type AdminUserDetailDto, type AdminUserListItem } from './adminApi';
import type { CategoryDto, OrderStatus, PostDto, ProductDto, UserRole } from '../../types';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { OrderStatusBadge } from '../../components/common/OrderStatusBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { formatCurrencyVnd, formatDateTime } from '../../utils/formatters';
import { resolveMediaUrl } from '../../utils/mediaUrl';

type AdminTab = 'users' | 'posts' | 'shops' | 'orders' | 'catalog' | 'revenue';

const ROLES: UserRole[] = ['User', 'ShopOwner', 'Shipper', 'Admin'];

const ROLE_LABELS: Record<string, string> = {
  User: 'Người dùng',
  ShopOwner: 'Chủ Shop',
  Shipper: 'Shipper',
  Admin: 'Quản trị viên',
};

const ORDER_STATUS_PILLS: { value: 'all' | OrderStatus; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'Pending', label: 'Chờ xác nhận' },
  { value: 'Confirmed', label: 'Đã xác nhận' },
  { value: 'Preparing', label: 'Đang chuẩn bị' },
  { value: 'WaitingForPickup', label: 'Chờ lấy hàng' },
  { value: 'Shipping', label: 'Đang giao' },
  { value: 'Delivered', label: 'Đã giao' },
  { value: 'Cancelled', label: 'Đã hủy' },
];

const selectStyle: React.CSSProperties = {
  padding: '0.5rem 0.75rem',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border-strong)',
  backgroundColor: 'var(--color-surface)',
  color: 'var(--color-text)',
  fontSize: '0.875rem',
  outline: 'none',
};

const searchInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem 0.75rem 0.5rem 2.25rem',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border-strong)',
  backgroundColor: 'var(--color-surface)',
  color: 'var(--color-text)',
  fontSize: '0.875rem',
  outline: 'none',
};

export const AdminDashboardPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<AdminTab>('users');

  // Feedback banner
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  };

  // Users filters
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Posts filters
  const [postSearch, setPostSearch] = useState('');
  const [viewingPost, setViewingPost] = useState<PostDto | null>(null);
  const [deletingPost, setDeletingPost] = useState<PostDto | null>(null);

  // Shops filters
  const [shopSearch, setShopSearch] = useState('');
  const [shopStatusFilter, setShopStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Orders filters
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | OrderStatus>('all');

  // Catalog (Products & Categories) filters
  const [catalogView, setCatalogView] = useState<'categories' | 'products'>('categories');
  const [categorySearch, setCategorySearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('all');

  // Revenue filters
  const [revenueFrom, setRevenueFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [revenueTo, setRevenueTo] = useState(() => new Date().toISOString().slice(0, 10));

  // Queries
  const isActiveParam = userStatusFilter === 'all' ? undefined : userStatusFilter === 'active';
  const roleParam = userRoleFilter === 'all' ? undefined : userRoleFilter;

  const { data: usersData, isLoading: isUsersLoading } = useQuery({
    queryKey: ['admin', 'users', userSearch, roleParam, isActiveParam],
    queryFn: () =>
      adminApi.getUsers({
        q: userSearch.trim() || undefined,
        role: roleParam,
        isActive: isActiveParam,
        page: 1,
        pageSize: 100,
      }),
    enabled: activeTab === 'users',
  });

  const { data: postsData, isLoading: isPostsLoading } = useQuery({
    queryKey: ['admin', 'posts'],
    queryFn: () => adminApi.getPosts({ page: 1, pageSize: 100 }),
    enabled: activeTab === 'posts',
  });

  const { data: shopsData, isLoading: isShopsLoading } = useQuery({
    queryKey: ['admin', 'shops'],
    queryFn: () => adminApi.getShops({ page: 1, pageSize: 100 }),
    enabled: activeTab === 'shops',
  });

  const { data: ordersData, isLoading: isOrdersLoading } = useQuery({
    queryKey: ['admin', 'orders', orderStatusFilter],
    queryFn: () =>
      adminApi.getAllOrders(orderStatusFilter === 'all' ? undefined : orderStatusFilter, { page: 1, pageSize: 100 }),
    enabled: activeTab === 'orders',
  });

  const {
    data: categoriesData = [],
    isLoading: isCategoriesLoading,
    refetch: refetchCategories,
  } = useQuery({
    queryKey: ['categories'],
    queryFn: adminApi.getCategories,
    enabled: activeTab === 'catalog',
  });

  const {
    data: productsData,
    isLoading: isProductsLoading,
    refetch: refetchProducts,
  } = useQuery({
    queryKey: ['admin', 'products', productCategoryFilter],
    queryFn: () =>
      adminApi.getAllProducts(productCategoryFilter === 'all' ? undefined : productCategoryFilter, {
        page: 1,
        pageSize: 100,
      }),
    enabled: activeTab === 'catalog',
  });

  const { data: revenueData, isLoading: isRevenueLoading, refetch: refetchRevenue } = useQuery({
    queryKey: ['admin', 'revenue', revenueFrom, revenueTo],
    queryFn: () => adminApi.getRevenue(new Date(revenueFrom).toISOString(), new Date(revenueTo).toISOString()),
    enabled: activeTab === 'revenue',
  });

  // Client-side filtering (complements server filtering)
  const filteredUsers = useMemo(() => {
    const items = usersData?.items ?? [];
    const q = userSearch.trim().toLowerCase();
    return items.filter((u) => {
      if (userRoleFilter !== 'all' && u.role !== userRoleFilter) return false;
      if (userStatusFilter === 'active' && u.isActive === false) return false;
      if (userStatusFilter === 'inactive' && u.isActive !== false) return false;
      if (!q) return true;
      return (
        u.username.toLowerCase().includes(q) ||
        u.displayName.toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q)
      );
    });
  }, [usersData, userSearch, userRoleFilter, userStatusFilter]);

  const filteredPosts = useMemo(() => {
    const items = postsData?.items ?? [];
    const q = postSearch.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (p) =>
        p.content.toLowerCase().includes(q) ||
        (p.authorName || p.displayName || '').toLowerCase().includes(q) ||
        (p.username || '').toLowerCase().includes(q)
    );
  }, [postsData, postSearch]);

  const filteredShops = useMemo(() => {
    const items = shopsData?.items ?? [];
    const q = shopSearch.trim().toLowerCase();
    return items.filter((s) => {
      if (shopStatusFilter === 'active' && !s.isActive) return false;
      if (shopStatusFilter === 'inactive' && s.isActive) return false;
      if (!q) return true;
      return s.name.toLowerCase().includes(q) || (s.description || '').toLowerCase().includes(q);
    });
  }, [shopsData, shopSearch, shopStatusFilter]);

  const filteredOrders = useMemo(() => {
    const items = ordersData?.items ?? [];
    const q = orderSearch.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (ord) =>
        ord.id.toLowerCase().includes(q) ||
        ord.buyerName.toLowerCase().includes(q) ||
        ord.shopName.toLowerCase().includes(q)
    );
  }, [ordersData, orderSearch]);

  const filteredCategories = useMemo(() => {
    const q = categorySearch.trim().toLowerCase();
    if (!q) return categoriesData;
    return categoriesData.filter(
      (c) => c.name.toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q)
    );
  }, [categoriesData, categorySearch]);

  const filteredProducts = useMemo(() => {
    const items = productsData?.items ?? [];
    const q = productSearch.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.sku || '').toLowerCase().includes(q) ||
        p.shopName.toLowerCase().includes(q)
    );
  }, [productsData, productSearch]);

  // ==========================
  // USER CRUD MODALS & STATE
  // ==========================
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('User');
  const [newBio, setNewBio] = useState('');
  const [newShopName, setNewShopName] = useState('');
  const [newVehicleType, setNewVehicleType] = useState('Xe máy');
  const [newLicensePlate, setNewLicensePlate] = useState('');
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  // User Detail Modal
  const [detailUserId, setDetailUserId] = useState<string | null>(null);
  const {
    data: userDetail,
    isLoading: isDetailLoading,
    error: detailError,
  } = useQuery<AdminUserDetailDto>({
    queryKey: ['admin', 'user-detail', detailUserId],
    queryFn: () => adminApi.getUserDetail(detailUserId!),
    enabled: !!detailUserId,
  });

  // Edit User Modal
  const [editingUser, setEditingUser] = useState<AdminUserListItem | null>(null);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('User');
  const [editIsActive, setEditIsActive] = useState(true);
  const [editNewPassword, setEditNewPassword] = useState('');
  const [isSavingUser, setIsSavingUser] = useState(false);

  // Delete User Confirmation Modal
  const [deletingUser, setDeletingUser] = useState<AdminUserListItem | null>(null);
  const [isPermanentDelete, setIsPermanentDelete] = useState(true);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  const openEditUserModal = (u: AdminUserListItem) => {
    setEditingUser(u);
    setEditDisplayName(u.displayName);
    setEditEmail(u.email || '');
    setEditBio(u.bio || '');
    setEditRole((u.role as UserRole) || 'User');
    setEditIsActive(u.isActive !== false);
    setEditNewPassword('');
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingUser(true);
    try {
      await adminApi.createUser({
        username: newUsername.trim(),
        email: newEmail.trim(),
        displayName: newDisplayName.trim(),
        password: newPassword,
        role: newRole,
        bio: newBio.trim() || undefined,
        shopName: newRole === 'ShopOwner' ? newShopName.trim() || undefined : undefined,
        vehicleType: newRole === 'Shipper' ? newVehicleType.trim() || undefined : undefined,
        licensePlate: newRole === 'Shipper' ? newLicensePlate.trim() || undefined : undefined,
      });
      showFeedback('success', `Đã tạo tài khoản @${newUsername.trim()} thành công.`);
      setIsCreateUserOpen(false);
      setNewUsername('');
      setNewEmail('');
      setNewDisplayName('');
      setNewPassword('');
      setNewRole('User');
      setNewBio('');
      setNewShopName('');
      setNewVehicleType('Xe máy');
      setNewLicensePlate('');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    } catch (err: any) {
      showFeedback('error', err.message || 'Lỗi tạo tài khoản.');
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsSavingUser(true);
    try {
      await adminApi.updateUser(editingUser.id, {
        displayName: editDisplayName.trim(),
        email: editEmail.trim() || undefined,
        bio: editBio.trim(),
        role: editRole,
        isActive: editIsActive,
        newPassword: editNewPassword.trim() || undefined,
      });
      showFeedback('success', `Đã cập nhật tài khoản @${editingUser.username}.`);
      setEditingUser(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    } catch (err: any) {
      showFeedback('error', err.message || 'Lỗi cập nhật tài khoản.');
    } finally {
      setIsSavingUser(false);
    }
  };

  const toggleUserActiveMutation = useMutation({
    mutationFn: (id: string) => adminApi.toggleUserActive(id),
    onSuccess: (updated) => {
      showFeedback(
        'success',
        `Đã ${updated.isActive !== false ? 'kích hoạt' : 'vô hiệu hóa'} tài khoản @${updated.username}.`
      );
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: (err: Error) => showFeedback('error', err.message || 'Lỗi thay đổi trạng thái tài khoản.'),
  });

  const handleConfirmDeleteUser = async () => {
    if (!deletingUser) return;
    setIsDeletingUser(true);
    try {
      await adminApi.deleteUser(deletingUser.id, isPermanentDelete);
      showFeedback(
        'success',
        isPermanentDelete
          ? `Đã xóa vĩnh viễn tài khoản @${deletingUser.username}.`
          : `Đã vô hiệu hóa tài khoản @${deletingUser.username}.`
      );
      setDeletingUser(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    } catch (err: any) {
      showFeedback('error', err.message || 'Lỗi xóa tài khoản.');
    } finally {
      setIsDeletingUser(false);
    }
  };

  // Post delete mutation
  const deletePostMutation = useMutation({
    mutationFn: (id: string) => adminApi.deletePost(id),
    onSuccess: () => {
      showFeedback('success', 'Đã xóa bài viết vi phạm.');
      setDeletingPost(null);
      setViewingPost(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'posts'] });
    },
    onError: (err: Error) => showFeedback('error', err.message || 'Lỗi xóa bài viết.'),
  });

  // Shop toggle active mutation
  const toggleShopMutation = useMutation({
    mutationFn: (id: string) => adminApi.toggleShopActive(id),
    onSuccess: (shop) => {
      showFeedback('success', `Đã ${shop.isActive ? 'kích hoạt' : 'tạm ngưng'} cửa hàng "${shop.name}".`);
      queryClient.invalidateQueries({ queryKey: ['admin', 'shops'] });
    },
    onError: (err: Error) => showFeedback('error', err.message || 'Lỗi cập nhật trạng thái cửa hàng.'),
  });

  // Category CRUD state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryDto | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryDesc, setCategoryDesc] = useState('');
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<CategoryDto | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<ProductDto | null>(null);

  const openCreateCategory = () => {
    setEditingCategory(null);
    setCategoryName('');
    setCategoryDesc('');
    setIsCategoryModalOpen(true);
  };

  const openEditCategory = (cat: CategoryDto) => {
    setEditingCategory(cat);
    setCategoryName(cat.name);
    setCategoryDesc(cat.description || '');
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingCategory(true);
    try {
      if (editingCategory) {
        await adminApi.updateCategory(editingCategory.id, {
          name: categoryName.trim(),
          description: categoryDesc.trim() || undefined,
        });
        showFeedback('success', `Đã cập nhật danh mục "${categoryName.trim()}".`);
      } else {
        await adminApi.createCategory({
          name: categoryName.trim(),
          description: categoryDesc.trim() || undefined,
        });
        showFeedback('success', `Đã tạo danh mục "${categoryName.trim()}".`);
      }
      setIsCategoryModalOpen(false);
      refetchCategories();
    } catch (err: any) {
      showFeedback('error', err.message || 'Lỗi lưu danh mục.');
    } finally {
      setIsSavingCategory(false);
    }
  };

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteCategory(id),
    onSuccess: () => {
      showFeedback('success', 'Đã vô hiệu hóa danh mục.');
      setDeletingCategory(null);
      refetchCategories();
    },
    onError: (err: Error) => showFeedback('error', err.message || 'Lỗi xóa danh mục.'),
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteProduct(id),
    onSuccess: () => {
      showFeedback('success', 'Đã xóa sản phẩm.');
      setDeletingProduct(null);
      refetchProducts();
    },
    onError: (err: Error) => showFeedback('error', err.message || 'Lỗi xóa sản phẩm.'),
  });

  const getRoleBadgeVariant = (role: string) => {
    if (role === 'Admin') return 'danger';
    if (role === 'ShopOwner') return 'primary';
    if (role === 'Shipper') return 'info';
    return 'default';
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldCheck size={26} color="var(--color-primary)" />
          Kênh Quản Trị Hệ Thống (Admin Dashboard)
        </h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
          Quản lý tài khoản theo vai trò, kiểm duyệt bài viết, cửa hàng, đơn hàng, sản phẩm & doanh thu toàn sàn
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <Button variant={activeTab === 'users' ? 'primary' : 'outline'} size="sm" onClick={() => setActiveTab('users')}>
          <Users size={16} /> Người dùng
        </Button>
        <Button variant={activeTab === 'posts' ? 'primary' : 'outline'} size="sm" onClick={() => setActiveTab('posts')}>
          <FileText size={16} /> Bài viết
        </Button>
        <Button variant={activeTab === 'shops' ? 'primary' : 'outline'} size="sm" onClick={() => setActiveTab('shops')}>
          <Store size={16} /> Cửa hàng
        </Button>
        <Button variant={activeTab === 'orders' ? 'primary' : 'outline'} size="sm" onClick={() => setActiveTab('orders')}>
          <Package size={16} /> Đơn hàng
        </Button>
        <Button variant={activeTab === 'catalog' ? 'primary' : 'outline'} size="sm" onClick={() => setActiveTab('catalog')}>
          <Layers size={16} /> Sản phẩm & Danh mục
        </Button>
        <Button variant={activeTab === 'revenue' ? 'primary' : 'outline'} size="sm" onClick={() => setActiveTab('revenue')}>
          <DollarSign size={16} /> Doanh thu toàn sàn
        </Button>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            backgroundColor: feedback.type === 'success' ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
            color: feedback.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)',
            border: `1px solid ${feedback.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)'}`,
            fontSize: '0.875rem',
            fontWeight: 500,
          }}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} style={{ color: 'inherit', display: 'flex' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* TAB 1: USERS */}
      {activeTab === 'users' && (
        <Card style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Quản lý tài khoản ({filteredUsers.length})</h3>
            <Button variant="primary" size="sm" onClick={() => setIsCreateUserOpen(true)}>
              <UserPlus size={16} /> + Thêm tài khoản
            </Button>
          </div>

          {/* Search & Filters */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1 1 240px' }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--color-text-muted)',
                }}
              />
              <input
                type="text"
                placeholder="Tìm theo username, email, tên hiển thị..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                style={searchInputStyle}
              />
            </div>

            <select
              aria-label="Lọc vai trò"
              value={userRoleFilter}
              onChange={(e) => setUserRoleFilter(e.target.value)}
              style={selectStyle}
            >
              <option value="all">Tất cả vai trò</option>
              <option value="User">User</option>
              <option value="ShopOwner">ShopOwner</option>
              <option value="Shipper">Shipper</option>
              <option value="Admin">Admin</option>
            </select>

            <select
              aria-label="Lọc trạng thái"
              value={userStatusFilter}
              onChange={(e) => setUserStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              style={selectStyle}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Đã vô hiệu hóa</option>
            </select>
          </div>

          {isUsersLoading && <LoadingState message="Đang tải danh sách người dùng..." />}

          {!isUsersLoading && filteredUsers.length === 0 && (
            <EmptyState title="Không tìm thấy tài khoản" message="Hãy thử thay đổi từ khóa hoặc bộ lọc vai trò / trạng thái." />
          )}

          {!isUsersLoading && filteredUsers.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {filteredUsers.map((u) => {
                const active = u.isActive !== false;
                const avatarSrc = resolveMediaUrl(u.avatarUrl);
                return (
                  <div
                    key={u.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.75rem',
                      padding: '0.875rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--color-surface-hover)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: '240px', flex: '1 1 280px' }}>
                      {avatarSrc ? (
                        <img
                          src={avatarSrc}
                          alt={u.displayName}
                          style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-full)', objectFit: 'cover' }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: 'var(--radius-full)',
                            backgroundColor: 'var(--color-primary-light)',
                            color: 'var(--color-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                          }}
                        >
                          {u.displayName?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                      )}

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 600 }}>{u.displayName}</span>
                          <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>@{u.username}</span>
                          <Badge variant={getRoleBadgeVariant(u.role)}>{u.role}</Badge>
                          <Badge variant={active ? 'success' : 'danger'}>
                            {active ? 'Đang hoạt động' : 'Đã vô hiệu hóa'}
                          </Badge>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
                          {u.email ? `${u.email} • ` : ''}Bài viết: {u.postCount ?? u.postsCount ?? 0} • Theo dõi: {u.followerCount ?? u.followersCount ?? 0}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <Button variant="outline" size="sm" onClick={() => setDetailUserId(u.id)}>
                        <Eye size={14} /> Xem chi tiết
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => openEditUserModal(u)}>
                        <Edit3 size={14} /> Sửa & Phân quyền
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        isLoading={toggleUserActiveMutation.isPending && toggleUserActiveMutation.variables === u.id}
                        onClick={() => toggleUserActiveMutation.mutate(u.id)}
                      >
                        <Power size={14} /> {active ? 'Vô hiệu hóa' : 'Kích hoạt'}
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => {
                          setDeletingUser(u);
                          setIsPermanentDelete(true);
                        }}
                      >
                        <Trash2 size={14} /> Xóa
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* TAB 2: POSTS */}
      {activeTab === 'posts' && (
        <Card style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Kiểm duyệt bài viết ({filteredPosts.length})</h3>
            <div style={{ position: 'relative', width: '300px', maxWidth: '100%' }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--color-text-muted)',
                }}
              />
              <input
                type="text"
                placeholder="Tìm nội dung hoặc tác giả..."
                value={postSearch}
                onChange={(e) => setPostSearch(e.target.value)}
                style={searchInputStyle}
              />
            </div>
          </div>

          {isPostsLoading && <LoadingState message="Đang tải bài viết..." />}
          {!isPostsLoading && filteredPosts.length === 0 && (
            <EmptyState title="Không có bài viết nào" message="Không tìm thấy bài viết khớp với từ khóa." />
          )}

          {!isPostsLoading && filteredPosts.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {filteredPosts.map((p) => (
                <div
                  key={p.id}
                  style={{
                    padding: '0.875rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-surface-hover)',
                    border: '1px solid var(--color-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '1rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ flex: '1 1 300px' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                      Tác giả: {p.authorName || p.displayName} (@{p.username})
                    </span>
                    <p style={{ fontSize: '0.875rem', marginTop: '0.25rem', whiteSpace: 'pre-wrap' }}>
                      {p.content.length > 200 ? `${p.content.slice(0, 200)}...` : p.content}
                    </p>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      {formatDateTime(p.createdAt)} • {p.media?.length ?? 0} tệp đính kèm • {p.likeCount} thích • {p.commentCount} bình luận
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button variant="outline" size="sm" onClick={() => setViewingPost(p)}>
                      <Eye size={14} /> Xem
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => setDeletingPost(p)}>
                      <Trash2 size={14} /> Xóa bài
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* TAB 3: SHOPS */}
      {activeTab === 'shops' && (
        <Card style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Quản lý cửa hàng ({filteredShops.length})</h3>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', width: '240px' }}>
                <Search
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--color-text-muted)',
                  }}
                />
                <input
                  type="text"
                  placeholder="Tìm tên shop..."
                  value={shopSearch}
                  onChange={(e) => setShopSearch(e.target.value)}
                  style={searchInputStyle}
                />
              </div>

              <select
                aria-label="Lọc trạng thái cửa hàng"
                value={shopStatusFilter}
                onChange={(e) => setShopStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                style={selectStyle}
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Đang hoạt động</option>
                <option value="inactive">Đã tạm ngưng</option>
              </select>
            </div>
          </div>

          {isShopsLoading && <LoadingState message="Đang tải danh sách cửa hàng..." />}
          {!isShopsLoading && filteredShops.length === 0 && (
            <EmptyState title="Không tìm thấy cửa hàng" message="Chưa có cửa hàng nào khớp với bộ lọc." />
          )}

          {!isShopsLoading && filteredShops.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {filteredShops.map((shop) => (
                <div
                  key={shop.id}
                  style={{
                    padding: '0.875rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-surface-hover)',
                    border: '1px solid var(--color-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <h5 style={{ fontSize: '1rem', fontWeight: 600 }}>{shop.name}</h5>
                      <Badge variant={shop.isActive ? 'success' : 'danger'}>
                        {shop.isActive ? 'Đang hoạt động' : 'Đã tạm ngưng'}
                      </Badge>
                    </div>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                      {shop.description || 'Không có mô tả'} • {shop.productCount} sản phẩm • Tạo ngày {formatDateTime(shop.createdAt)}
                    </p>
                  </div>

                  <Button
                    variant={shop.isActive ? 'outline' : 'primary'}
                    size="sm"
                    isLoading={toggleShopMutation.isPending && toggleShopMutation.variables === shop.id}
                    onClick={() => toggleShopMutation.mutate(shop.id)}
                  >
                    <Power size={14} /> {shop.isActive ? 'Tạm ngưng' : 'Kích hoạt'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* TAB 4: ORDERS */}
      {activeTab === 'orders' && (
        <Card style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Tất cả đơn hàng toàn sàn ({filteredOrders.length})</h3>

          <div style={{ position: 'relative' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-text-muted)',
              }}
            />
            <input
              type="text"
              placeholder="Tìm theo mã đơn (#...), tên khách hàng hoặc tên shop..."
              value={orderSearch}
              onChange={(e) => setOrderSearch(e.target.value)}
              style={searchInputStyle}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {ORDER_STATUS_PILLS.map((pill) => {
              const isActive = orderStatusFilter === pill.value;
              return (
                <button
                  key={pill.value}
                  type="button"
                  onClick={() => setOrderStatusFilter(pill.value)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    border: isActive ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                    backgroundColor: isActive ? 'var(--color-primary)' : 'var(--color-surface)',
                    color: isActive ? '#fff' : 'var(--color-text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  {pill.label}
                </button>
              );
            })}
          </div>

          {isOrdersLoading && <LoadingState message="Đang tải toàn bộ đơn hàng..." />}
          {!isOrdersLoading && filteredOrders.length === 0 && (
            <EmptyState title="Không có đơn hàng nào" message="Không tìm thấy đơn hàng khớp với bộ lọc." />
          )}

          {!isOrdersLoading && filteredOrders.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {filteredOrders.map((ord) => (
                <div
                  key={ord.id}
                  style={{
                    padding: '0.875rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-surface-hover)',
                    border: '1px solid var(--color-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>#{ord.id.slice(0, 8)}</span>
                    <h5 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>
                      Khách: {ord.buyerName} ➔ Shop: {ord.shopName}
                    </h5>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      {formatDateTime(ord.createdAt)} • Shipper: {ord.shipperName || 'Chưa gán'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{formatCurrencyVnd(ord.totalPrice)}</span>
                    <OrderStatusBadge status={ord.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* TAB 5: PRODUCTS & CATEGORIES */}
      {activeTab === 'catalog' && (
        <Card style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button
                variant={catalogView === 'categories' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setCatalogView('categories')}
              >
                <Layers size={15} /> Danh mục ({categoriesData.length})
              </Button>
              <Button
                variant={catalogView === 'products' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setCatalogView('products')}
              >
                <ShoppingBag size={15} /> Sản phẩm ({productsData?.items.length ?? 0})
              </Button>
            </div>

            {catalogView === 'categories' && (
              <Button variant="primary" size="sm" onClick={openCreateCategory}>
                <Plus size={15} /> Tạo danh mục mới
              </Button>
            )}
          </div>

          {catalogView === 'categories' && (
            <>
              <div style={{ position: 'relative' }}>
                <Search
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--color-text-muted)',
                  }}
                />
                <input
                  type="text"
                  placeholder="Tìm kiếm danh mục..."
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  style={searchInputStyle}
                />
              </div>

              {isCategoriesLoading && <LoadingState message="Đang tải danh mục..." />}
              {!isCategoriesLoading && filteredCategories.length === 0 && (
                <EmptyState title="Không có danh mục nào" message="Bấm 'Tạo danh mục mới' để thêm danh mục hàng hóa." />
              )}

              {!isCategoriesLoading && filteredCategories.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {filteredCategories.map((cat) => (
                    <div
                      key={cat.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--color-surface-hover)',
                        border: '1px solid var(--color-border)',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <h5 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>{cat.name}</h5>
                          <Badge variant={cat.isActive ? 'success' : 'default'}>{cat.isActive ? 'Hoạt động' : 'Tạm ẩn'}</Badge>
                        </div>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>{cat.description || 'Không có mô tả'}</p>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Button variant="outline" size="sm" onClick={() => openEditCategory(cat)}>
                          <Edit3 size={14} /> Sửa
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => setDeletingCategory(cat)}>
                          <Trash2 size={14} /> Xóa
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {catalogView === 'products' && (
            <>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: '1 1 240px' }}>
                  <Search
                    size={16}
                    style={{
                      position: 'absolute',
                      left: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--color-text-muted)',
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Tìm sản phẩm theo tên, SKU hoặc tên shop..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    style={searchInputStyle}
                  />
                </div>

                <select
                  aria-label="Lọc danh mục sản phẩm"
                  value={productCategoryFilter}
                  onChange={(e) => setProductCategoryFilter(e.target.value)}
                  style={selectStyle}
                >
                  <option value="all">Tất cả danh mục</option>
                  {categoriesData.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {isProductsLoading && <LoadingState message="Đang tải sản phẩm..." />}
              {!isProductsLoading && filteredProducts.length === 0 && (
                <EmptyState title="Không có sản phẩm nào" message="Không tìm thấy sản phẩm khớp với bộ lọc." />
              )}

              {!isProductsLoading && filteredProducts.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {filteredProducts.map((prod) => (
                    <div
                      key={prod.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '0.75rem',
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--color-surface-hover)',
                        border: '1px solid var(--color-border)',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <h5 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>{prod.name}</h5>
                          <Badge variant={prod.isActive ? 'primary' : 'default'}>
                            {prod.isActive ? 'Đang bán' : 'Tạm ẩn'}
                          </Badge>
                          {prod.categoryName && <Badge variant="info">{prod.categoryName}</Badge>}
                        </div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                          Shop: <strong>{prod.shopName}</strong> • SKU: {prod.sku || 'N/A'} • Tồn kho: {prod.stock} • Giá:{' '}
                          <strong style={{ color: 'var(--color-primary)' }}>{formatCurrencyVnd(prod.price)}</strong>
                        </div>
                      </div>
                      <Button variant="danger" size="sm" onClick={() => setDeletingProduct(prod)}>
                        <Trash2 size={14} /> Xóa
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </Card>
      )}

      {/* TAB 6: PLATFORM REVENUE */}
      {activeTab === 'revenue' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <Card style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Khoảng thời gian:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="date"
                value={revenueFrom}
                onChange={(e) => setRevenueFrom(e.target.value)}
                style={{ padding: '0.375rem 0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
              />
              <span>đến</span>
              <input
                type="date"
                value={revenueTo}
                onChange={(e) => setRevenueTo(e.target.value)}
                style={{ padding: '0.375rem 0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
              />
            </div>
            <Button variant="outline" size="sm" onClick={() => refetchRevenue()}>
              Cập nhật
            </Button>
          </Card>

          {isRevenueLoading && <LoadingState message="Đang tải doanh thu..." />}
          {!isRevenueLoading && revenueData && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <Card style={{ padding: '1.25rem', textAlign: 'center' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Tổng GMV (Đơn Delivered):</span>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-success)', marginTop: '0.25rem' }}>
                  {formatCurrencyVnd(revenueData.totalRevenue)}
                </div>
              </Card>

              <Card style={{ padding: '1.25rem', textAlign: 'center' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Tổng đơn giao thành công:</span>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-primary)', marginTop: '0.25rem' }}>
                  {revenueData.totalOrders} đơn
                </div>
              </Card>

              <Card style={{ padding: '1.25rem', textAlign: 'center' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Tổng phí giao hàng luân chuyển:</span>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-accent)', marginTop: '0.25rem' }}>
                  {formatCurrencyVnd(revenueData.totalShippingFees)}
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* =========================================
          MODALS
         ========================================= */}

      {/* 1. Create User Modal */}
      <Modal isOpen={isCreateUserOpen} onClose={() => setIsCreateUserOpen(false)} title="Thêm tài khoản mới" maxWidth="540px">
        <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <Input label="Tên đăng nhập (username)" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} required />
            <Input label="Email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <Input label="Tên hiển thị" value={newDisplayName} onChange={(e) => setNewDisplayName(e.target.value)} required />
            <Input label="Mật khẩu" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Vai trò hệ thống</label>
            <select value={newRole} onChange={(e) => setNewRole(e.target.value as UserRole)} style={selectStyle}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r} ({ROLE_LABELS[r]})
                </option>
              ))}
            </select>
          </div>

          {newRole === 'ShopOwner' && (
            <Input
              label="Tên cửa hàng khởi tạo (ShopName)"
              value={newShopName}
              onChange={(e) => setNewShopName(e.target.value)}
              placeholder="VD: Cửa hàng Thời Trang ABC"
            />
          )}

          {newRole === 'Shipper' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <Input
                label="Loại xe (VehicleType)"
                value={newVehicleType}
                onChange={(e) => setNewVehicleType(e.target.value)}
                placeholder="VD: Xe máy"
              />
              <Input
                label="Biển số xe (LicensePlate)"
                value={newLicensePlate}
                onChange={(e) => setNewLicensePlate(e.target.value)}
                placeholder="VD: 59-X1 123.45"
              />
            </div>
          )}

          <Textarea label="Giới thiệu ngắn (Bio)" value={newBio} onChange={(e) => setNewBio(e.target.value)} />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
            <Button type="button" variant="outline" onClick={() => setIsCreateUserOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" isLoading={isCreatingUser}>
              Tạo tài khoản
            </Button>
          </div>
        </form>
      </Modal>

      {/* 2. View User Detail Modal (Role-specific) */}
      <Modal
        isOpen={!!detailUserId}
        onClose={() => setDetailUserId(null)}
        title="Chi tiết tài khoản theo vai trò"
        maxWidth="660px"
      >
        {isDetailLoading && <LoadingState message="Đang tải thông tin chi tiết..." />}

        {!isDetailLoading && detailError && (
          <div style={{ color: 'var(--color-danger)', fontSize: '0.875rem' }}>
            Không thể tải chi tiết tài khoản: {(detailError as Error).message}
          </div>
        )}

        {!isDetailLoading && userDetail && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Base Info Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-surface-hover)',
              }}
            >
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--color-primary-light)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  fontWeight: 700,
                }}
              >
                {userDetail.displayName?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <h4 style={{ fontSize: '1.125rem', fontWeight: 700 }}>{userDetail.displayName}</h4>
                  <Badge variant={getRoleBadgeVariant(userDetail.role)}>{userDetail.role}</Badge>
                  <Badge variant={userDetail.isActive ? 'success' : 'danger'}>
                    {userDetail.isActive ? 'Đang hoạt động' : 'Đã vô hiệu hóa'}
                  </Badge>
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                  @{userDetail.username} • {userDetail.email} • Tham gia: {formatDateTime(userDetail.createdAt)}
                </div>
                {userDetail.bio && <p style={{ fontSize: '0.8125rem', marginTop: '0.35rem' }}>{userDetail.bio}</p>}
              </div>
            </div>

            {/* ROLE-SPECIFIC SECTION: USER */}
            {userDetail.role === 'User' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <h5 style={{ fontSize: '0.9375rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <UserIcon size={16} color="var(--color-primary)" /> Thống kê Người dùng & Mua sắm
                </h5>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
                  <Card style={{ padding: '0.75rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Bài viết</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{userDetail.postsCount ?? 0}</div>
                  </Card>
                  <Card style={{ padding: '0.75rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Người theo dõi</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{userDetail.followersCount ?? 0}</div>
                  </Card>
                  <Card style={{ padding: '0.75rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Đang theo dõi</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{userDetail.followingCount ?? 0}</div>
                  </Card>
                  <Card style={{ padding: '0.75rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Tổng đơn mua</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{userDetail.buyerOrdersCount ?? 0}</div>
                  </Card>
                  <Card style={{ padding: '0.75rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Tổng chi tiêu</div>
                    <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                      {formatCurrencyVnd(userDetail.totalSpent ?? 0)}
                    </div>
                  </Card>
                </div>

                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Đơn hàng gần đây</div>
                  {userDetail.recentOrders && userDetail.recentOrders.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {userDetail.recentOrders.map((ord) => (
                        <div
                          key={ord.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0.5rem 0.75rem',
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: 'var(--color-surface-hover)',
                            fontSize: '0.8125rem',
                          }}
                        >
                          <div>
                            <strong>#{ord.id.slice(0, 8)}</strong> {ord.shopName ? `• ${ord.shopName}` : ''} •{' '}
                            <span style={{ color: 'var(--color-text-muted)' }}>{formatDateTime(ord.createdAt)}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <strong>{formatCurrencyVnd(ord.totalPrice)}</strong>
                            <OrderStatusBadge status={ord.status as OrderStatus} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Chưa có đơn hàng nào.</p>
                  )}
                </div>
              </div>
            )}

            {/* ROLE-SPECIFIC SECTION: SHOP OWNER */}
            {userDetail.role === 'ShopOwner' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <h5 style={{ fontSize: '0.9375rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Store size={16} color="var(--color-primary)" /> Danh sách Cửa hàng sở hữu ({userDetail.shops?.length ?? 0})
                </h5>

                {userDetail.shops && userDetail.shops.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                    {userDetail.shops.map((shop) => (
                      <Card key={shop.id} style={{ padding: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong>{shop.name}</strong>
                          <Badge variant={shop.isActive ? 'success' : 'danger'}>
                            {shop.isActive ? 'Đang hoạt động' : 'Tạm ngưng'}
                          </Badge>
                        </div>
                        {shop.description && (
                          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>{shop.description}</p>
                        )}
                        <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.8125rem', flexWrap: 'wrap' }}>
                          <span>
                            Sản phẩm: <strong>{shop.productCount}</strong>
                          </span>
                          <span>
                            Đơn hàng: <strong>{shop.orderCount}</strong>
                          </span>
                          <span>
                            Doanh thu: <strong style={{ color: 'var(--color-success)' }}>{formatCurrencyVnd(shop.totalRevenue)}</strong>
                          </span>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Chưa tạo cửa hàng nào.</p>
                )}
              </div>
            )}

            {/* ROLE-SPECIFIC SECTION: SHIPPER */}
            {userDetail.role === 'Shipper' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <h5 style={{ fontSize: '0.9375rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Truck size={16} color="var(--color-primary)" /> Hồ sơ & Hiệu suất Shipper
                </h5>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
                  <Card style={{ padding: '0.75rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Phương tiện</div>
                    <div style={{ fontWeight: 600, marginTop: '0.2rem' }}>
                      {userDetail.shipperProfile?.vehicleType || 'Chưa cập nhật'}
                    </div>
                  </Card>
                  <Card style={{ padding: '0.75rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Biển số xe</div>
                    <div style={{ fontWeight: 600, marginTop: '0.2rem' }}>
                      {userDetail.shipperProfile?.licensePlate || userDetail.shipperProfile?.vehiclePlate || 'Chưa cập nhật'}
                    </div>
                  </Card>
                  <Card style={{ padding: '0.75rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Trạng thái nhận đơn</div>
                    <div style={{ marginTop: '0.2rem' }}>
                      <Badge variant={userDetail.shipperProfile?.isAvailable ? 'success' : 'default'}>
                        {userDetail.shipperProfile?.isAvailable ? 'Đang sẵn sàng' : 'Tạm nghỉ'}
                      </Badge>
                    </div>
                  </Card>
                  <Card style={{ padding: '0.75rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Đơn đã giao / Đang giao</div>
                    <div style={{ fontWeight: 700, marginTop: '0.2rem' }}>
                      {userDetail.shipperProfile?.totalDeliveries ?? 0} đã giao / {userDetail.activeDeliveriesCount ?? 0} đang giao
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {/* ROLE-SPECIFIC SECTION: ADMIN */}
            {userDetail.role === 'Admin' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <h5 style={{ fontSize: '0.9375rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Shield size={16} color="var(--color-danger)" /> Quyền hạn Quản trị hệ thống
                </h5>
                <Card style={{ padding: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ fontSize: '0.875rem' }}>
                    <strong>Phạm vi quyền:</strong>{' '}
                    {Array.isArray(userDetail.adminPermissions) && userDetail.adminPermissions.length > 0
                      ? userDetail.adminPermissions.join(', ')
                      : userDetail.adminPermissionsSummary ||
                        (typeof userDetail.adminPermissions === 'string' && userDetail.adminPermissions) ||
                        'Toàn quyền quản trị hệ thống (Users, Posts, Shops, Orders, Categories, Revenue)'}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                    Trạng thái bảo mật: {userDetail.isActive ? 'Tài khoản quản trị đang kích hoạt' : 'Tài khoản quản trị đang bị khóa'}
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* 3. Edit & Role Modal */}
      <Modal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title={`Sửa & Phân quyền: @${editingUser?.username || ''}`}
        maxWidth="520px"
      >
        <form onSubmit={handleSaveEditUser} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <Input label="Tên hiển thị" value={editDisplayName} onChange={(e) => setEditDisplayName(e.target.value)} required />
          <Input label="Email" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
          <Textarea label="Giới thiệu (Bio)" value={editBio} onChange={(e) => setEditBio(e.target.value)} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Phân quyền (Role)</label>
            <select value={editRole} onChange={(e) => setEditRole(e.target.value as UserRole)} style={selectStyle}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r} ({ROLE_LABELS[r]})
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Đặt lại mật khẩu mới (để trống nếu không đổi)"
            type="password"
            value={editNewPassword}
            onChange={(e) => setEditNewPassword(e.target.value)}
            placeholder="Nhập mật khẩu mới nếu muốn reset..."
          />

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}>
            <input type="checkbox" checked={editIsActive} onChange={(e) => setEditIsActive(e.target.checked)} />
            Tài khoản đang hoạt động (Active)
          </label>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
            <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" isLoading={isSavingUser}>
              Lưu thay đổi
            </Button>
          </div>
        </form>
      </Modal>

      {/* 4. Delete User Confirmation Modal */}
      <Modal isOpen={!!deletingUser} onClose={() => setDeletingUser(null)} title="Xác nhận xóa tài khoản" maxWidth="460px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <AlertTriangle size={24} color="var(--color-danger)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '0.9375rem' }}>
              Bạn đang thao tác xóa tài khoản <strong>@{deletingUser?.username}</strong> ({deletingUser?.displayName}).
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={isPermanentDelete}
              onChange={(e) => setIsPermanentDelete(e.target.checked)}
            />
            Xóa vĩnh viễn khỏi cơ sở dữ liệu (`permanent=true`)
          </label>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <Button type="button" variant="outline" onClick={() => setDeletingUser(null)}>
              Hủy
            </Button>
            <Button type="button" variant="danger" isLoading={isDeletingUser} onClick={handleConfirmDeleteUser}>
              <Trash2 size={14} /> {isPermanentDelete ? 'Xóa vĩnh viễn' : 'Vô hiệu hóa'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 5. View Post Modal */}
      <Modal isOpen={!!viewingPost} onClose={() => setViewingPost(null)} title="Chi tiết bài viết" maxWidth="580px">
        {viewingPost && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
              Tác giả: <strong>{viewingPost.authorName || viewingPost.displayName}</strong> (@{viewingPost.username}) •{' '}
              {formatDateTime(viewingPost.createdAt)}
            </div>
            <p style={{ fontSize: '0.9375rem', whiteSpace: 'pre-wrap' }}>{viewingPost.content}</p>
            {viewingPost.media && viewingPost.media.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.5rem' }}>
                {viewingPost.media.map((m) => {
                  const src = resolveMediaUrl(m.url);
                  if (!src) return null;
                  return m.mediaType === 'Video' ? (
                    <video key={m.id} src={src} controls style={{ width: '100%', borderRadius: 'var(--radius-md)' }} />
                  ) : (
                    <img key={m.id} src={src} alt="Post media" style={{ width: '100%', borderRadius: 'var(--radius-md)', objectFit: 'cover' }} />
                  );
                })}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <Button variant="outline" onClick={() => setViewingPost(null)}>
                Đóng
              </Button>
              <Button variant="danger" onClick={() => setDeletingPost(viewingPost)}>
                <Trash2 size={14} /> Xóa bài viết
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* 6. Delete Post Confirmation Modal */}
      <Modal isOpen={!!deletingPost} onClose={() => setDeletingPost(null)} title="Xác nhận xóa bài viết" maxWidth="440px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.9375rem' }}>
            Bạn có chắc chắn muốn xóa vĩnh viễn bài viết của <strong>@{deletingPost?.username}</strong>?
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <Button variant="outline" onClick={() => setDeletingPost(null)}>
              Hủy
            </Button>
            <Button
              variant="danger"
              isLoading={deletePostMutation.isPending}
              onClick={() => deletingPost && deletePostMutation.mutate(deletingPost.id)}
            >
              <Trash2 size={14} /> Xác nhận xóa
            </Button>
          </div>
        </div>
      </Modal>

      {/* 7. Create/Edit Category Modal */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title={editingCategory ? `Chỉnh sửa danh mục: ${editingCategory.name}` : 'Thêm danh mục hàng mới'}
      >
        <form onSubmit={handleSaveCategory} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input label="Tên danh mục" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} required />
          <Textarea label="Mô tả danh mục" value={categoryDesc} onChange={(e) => setCategoryDesc(e.target.value)} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
            <Button type="button" variant="outline" onClick={() => setIsCategoryModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" isLoading={isSavingCategory}>
              {editingCategory ? 'Cập nhật danh mục' : 'Lưu danh mục'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 8. Delete Category Confirmation Modal */}
      <Modal isOpen={!!deletingCategory} onClose={() => setDeletingCategory(null)} title="Xác nhận xóa danh mục" maxWidth="440px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.9375rem' }}>
            Bạn có chắc chắn muốn xóa/tạm ẩn danh mục <strong>{deletingCategory?.name}</strong>?
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <Button variant="outline" onClick={() => setDeletingCategory(null)}>
              Hủy
            </Button>
            <Button
              variant="danger"
              isLoading={deleteCategoryMutation.isPending}
              onClick={() => deletingCategory && deleteCategoryMutation.mutate(deletingCategory.id)}
            >
              <Trash2 size={14} /> Xác nhận
            </Button>
          </div>
        </div>
      </Modal>

      {/* 9. Delete Product Confirmation Modal */}
      <Modal isOpen={!!deletingProduct} onClose={() => setDeletingProduct(null)} title="Xác nhận xóa sản phẩm" maxWidth="440px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.9375rem' }}>
            Bạn có chắc chắn muốn xóa sản phẩm <strong>{deletingProduct?.name}</strong>?
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <Button variant="outline" onClick={() => setDeletingProduct(null)}>
              Hủy
            </Button>
            <Button
              variant="danger"
              isLoading={deleteProductMutation.isPending}
              onClick={() => deletingProduct && deleteProductMutation.mutate(deletingProduct.id)}
            >
              <Trash2 size={14} /> Xác nhận xóa
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
