import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DollarSign, Layers, Package, ShieldCheck, Trash2, Users } from 'lucide-react';
import { adminService, shoppingService } from '../../services/api/services';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { OrderStatusBadge } from '../../components/common/OrderStatusBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { formatCurrencyVnd, formatDateTime } from '../../utils/formatters';

export const AdminDashboardPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'users' | 'posts' | 'orders' | 'categories' | 'revenue'>('users');

  // Revenue filters
  const [revenueFrom, setRevenueFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [revenueTo, setRevenueTo] = useState(() => new Date().toISOString().slice(0, 10));

  // Queries
  const { data: usersData, isLoading: isUsersLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => adminService.getUsers({ page: 1, pageSize: 50 }),
    enabled: activeTab === 'users',
  });

  const { data: postsData, isLoading: isPostsLoading } = useQuery({
    queryKey: ['admin', 'posts'],
    queryFn: () => adminService.getPosts({ page: 1, pageSize: 50 }),
    enabled: activeTab === 'posts',
  });

  const { data: ordersData, isLoading: isOrdersLoading } = useQuery({
    queryKey: ['admin', 'orders'],
    queryFn: () => adminService.getAllOrders(undefined, { page: 1, pageSize: 50 }),
    enabled: activeTab === 'orders',
  });

  const { data: categoriesData, isLoading: isCategoriesLoading, refetch: refetchCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: shoppingService.getCategories,
    enabled: activeTab === 'categories',
  });

  const { data: revenueData, isLoading: isRevenueLoading, refetch: refetchRevenue } = useQuery({
    queryKey: ['admin', 'revenue', revenueFrom, revenueTo],
    queryFn: () => adminService.getRevenue(new Date(revenueFrom).toISOString(), new Date(revenueTo).toISOString()),
    enabled: activeTab === 'revenue',
  });

  // Delete / Deactivate mutations
  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteUser(id),
    onSuccess: () => {
      alert('Đã vô hiệu hóa tài khoản!');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: (id: string) => adminService.deletePost(id),
    onSuccess: () => {
      alert('Đã xóa bài viết vi phạm!');
      queryClient.invalidateQueries({ queryKey: ['admin', 'posts'] });
    },
  });

  // Create Category Modal state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [categoryDesc, setCategoryDesc] = useState('');

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminService.createCategory({ name: categoryName, description: categoryDesc });
      alert('Tạo danh mục thành công!');
      setIsCategoryModalOpen(false);
      setCategoryName('');
      setCategoryDesc('');
      refetchCategories();
    } catch (err: any) {
      alert(err.message || 'Lỗi tạo danh mục.');
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldCheck size={26} color="var(--color-primary)" />
          Kênh Quản Trị Hệ Thống (Admin Dashboard)
        </h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
          Quản lý người dùng, nội dung bài viết, toàn bộ đơn hàng và doanh thu toàn sàn
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <Button variant={activeTab === 'users' ? 'primary' : 'outline'} size="sm" onClick={() => setActiveTab('users')}>
          <Users size={16} /> Người dùng
        </Button>
        <Button variant={activeTab === 'posts' ? 'primary' : 'outline'} size="sm" onClick={() => setActiveTab('posts')}>
          Bài viết
        </Button>
        <Button variant={activeTab === 'orders' ? 'primary' : 'outline'} size="sm" onClick={() => setActiveTab('orders')}>
          <Package size={16} /> Toàn bộ đơn hàng
        </Button>
        <Button variant={activeTab === 'categories' ? 'primary' : 'outline'} size="sm" onClick={() => setActiveTab('categories')}>
          <Layers size={16} /> Danh mục hàng hóa
        </Button>
        <Button variant={activeTab === 'revenue' ? 'primary' : 'outline'} size="sm" onClick={() => setActiveTab('revenue')}>
          <DollarSign size={16} /> Doanh thu toàn sàn
        </Button>
      </div>

      {/* TAB 1: USERS */}
      {activeTab === 'users' && (
        <Card style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Danh sách người dùng</h3>
          {isUsersLoading && <LoadingState message="Đang tải danh sách người dùng..." />}
          {!isUsersLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {usersData?.items.map((u) => (
                <div
                  key={u.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-surface-hover)',
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600 }}>{u.displayName}</span> ({u.username})
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      Vai trò: <strong>{u.role}</strong> • Bài viết: {u.postsCount} • Theo dõi: {u.followersCount}
                    </div>
                  </div>

                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      if (window.confirm(`Vô hiệu hóa tài khoản @${u.username}?`)) {
                        deleteUserMutation.mutate(u.id);
                      }
                    }}
                  >
                    Vô hiệu hóa
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* TAB 2: POSTS */}
      {activeTab === 'posts' && (
        <Card style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Kiểm duyệt bài viết</h3>
          {isPostsLoading && <LoadingState message="Đang tải bài viết..." />}
          {!isPostsLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {postsData?.items.map((p) => (
                <div
                  key={p.id}
                  style={{
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-surface-hover)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '1rem',
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Tác giả: {p.authorName}</span>
                    <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>{p.content}</p>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
                      {formatDateTime(p.createdAt)} • {p.media.length} tệp đính kèm • {p.likeCount} lượt thích
                    </span>
                  </div>

                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      if (window.confirm('Xóa bài viết này vĩnh viễn?')) {
                        deletePostMutation.mutate(p.id);
                      }
                    }}
                  >
                    <Trash2 size={14} /> Xóa bài
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* TAB 3: ORDERS */}
      {activeTab === 'orders' && (
        <Card style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Tất cả đơn hàng toàn sàn</h3>
          {isOrdersLoading && <LoadingState message="Đang tải toàn bộ đơn hàng..." />}
          {!isOrdersLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {ordersData?.items.map((ord) => (
                <div
                  key={ord.id}
                  style={{
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-surface-hover)',
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

      {/* TAB 4: CATEGORIES */}
      {activeTab === 'categories' && (
        <Card style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Danh mục hàng hóa</h3>
            <Button variant="primary" size="sm" onClick={() => setIsCategoryModalOpen(true)}>
              + Tạo danh mục mới
            </Button>
          </div>

          {isCategoriesLoading && <LoadingState message="Đang tải danh mục..." />}
          {!isCategoriesLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {categoriesData?.map((cat) => (
                <div
                  key={cat.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-surface-hover)',
                  }}
                >
                  <div>
                    <h5 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>{cat.name}</h5>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>{cat.description || 'Không có mô tả'}</p>
                  </div>
                  <Badge variant={cat.isActive ? 'success' : 'default'}>{cat.isActive ? 'Hoạt động' : 'Tạm ẩn'}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* TAB 5: PLATFORM REVENUE */}
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

      {/* Modal create category */}
      <Modal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} title="Thêm danh mục hàng mới">
        <form onSubmit={handleCreateCategory} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input label="Tên danh mục" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} required />
          <Input label="Mô tả danh mục" value={categoryDesc} onChange={(e) => setCategoryDesc(e.target.value)} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
            <Button type="button" variant="outline" onClick={() => setIsCategoryModalOpen(false)}>Hủy</Button>
            <Button type="submit" variant="primary">Lưu danh mục</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
