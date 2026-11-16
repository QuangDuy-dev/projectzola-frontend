import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  DollarSign,
  Edit3,
  Image as ImageIcon,
  Package,
  Plus,
  RefreshCw,
  Search,
  ShoppingBag,
  Store,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { getProductImageSrc, shopOwnerApi } from './shopOwnerApi';
import { useAuth } from '../../hooks/useAuth';
import type { OrderStatus, ProductDto, ProductImageDto } from '../../types';
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

type StockFilter = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
type OrderFilter = 'all' | OrderStatus;

const ORDER_STATUS_PILLS: { value: OrderFilter; label: string }[] = [
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

export const ShopOwnerDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'revenue'>('orders');

  // Create shop modal state (when ShopOwner has no shop yet)
  const [isCreateShopOpen, setIsCreateShopOpen] = useState(false);
  const [newShopName, setNewShopName] = useState('');
  const [newShopDescription, setNewShopDescription] = useState('');
  const [createShopError, setCreateShopError] = useState<string | null>(null);

  const createShopMutation = useMutation({
    mutationFn: shopOwnerApi.createShop,
    onSuccess: () => {
      setIsCreateShopOpen(false);
      setNewShopName('');
      setNewShopDescription('');
      setCreateShopError(null);
      queryClient.invalidateQueries({ queryKey: ['shops', 'all'] });
      showFeedback('success', 'Đã tạo cửa hàng mới thành công!');
    },
    onError: (err: Error) => {
      setCreateShopError(err.message || 'Không thể tạo cửa hàng. Vui lòng thử lại.');
    },
  });

  const handleCreateShopSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newShopName.trim();
    if (!cleanName) {
      setCreateShopError('Vui lòng nhập tên cửa hàng.');
      return;
    }
    setCreateShopError(null);
    createShopMutation.mutate({
      name: cleanName,
      description: newShopDescription.trim() || undefined,
    });
  };

  // Feedback banner
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  };

  // Orders search & filter
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<OrderFilter>('all');

  // Products search & filters
  const [productSearch, setProductSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');

  // Revenue date filters (default last 30 days)
  const [revenueFrom, setRevenueFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [revenueTo, setRevenueTo] = useState(() => new Date().toISOString().slice(0, 10));

  // Queries
  const { data: shopsData, isLoading: isShopsLoading } = useQuery({
    queryKey: ['shops', 'all'],
    queryFn: () => shopOwnerApi.getAllShops({ page: 1, pageSize: 50 }),
  });

  const myShop = shopsData?.items.find((s) => s.ownerId === user?.id);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: shopOwnerApi.getCategories,
  });

  const { data: shopOrders, isLoading: isOrdersLoading } = useQuery({
    queryKey: ['shop', 'orders'],
    queryFn: () => shopOwnerApi.getShopOrders(undefined, { page: 1, pageSize: 100 }),
  });

  const { data: shopProducts, isLoading: isProductsLoading, refetch: refetchProducts } = useQuery({
    queryKey: ['shop', myShop?.id, 'products'],
    queryFn: () => (myShop ? shopOwnerApi.getShopProducts(myShop.id, { page: 1, pageSize: 100 }) : Promise.reject('No shop')),
    enabled: !!myShop,
  });

  const { data: revenueData, isLoading: isRevenueLoading, refetch: refetchRevenue } = useQuery({
    queryKey: ['shop', 'revenue', revenueFrom, revenueTo],
    queryFn: () => shopOwnerApi.getShopRevenue(new Date(revenueFrom).toISOString(), new Date(revenueTo).toISOString()),
    enabled: activeTab === 'revenue',
  });

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    const items = shopOrders?.items ?? [];
    const q = orderSearch.trim().toLowerCase();
    return items.filter((order) => {
      if (orderStatusFilter !== 'all' && order.status !== orderStatusFilter) return false;
      if (!q) return true;
      const code = order.id.toLowerCase();
      const shortCode = order.id.slice(0, 8).toLowerCase();
      const buyer = (order.buyerName || '').toLowerCase();
      return code.includes(q) || shortCode.includes(q) || buyer.includes(q);
    });
  }, [shopOrders, orderSearch, orderStatusFilter]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    const items = shopProducts?.items ?? [];
    const q = productSearch.trim().toLowerCase();
    return items.filter((prod) => {
      if (q) {
        const nameMatch = prod.name.toLowerCase().includes(q);
        const skuMatch = (prod.sku || '').toLowerCase().includes(q);
        if (!nameMatch && !skuMatch) return false;
      }
      if (categoryFilter !== 'all' && prod.categoryId !== categoryFilter) {
        return false;
      }
      if (stockFilter === 'in_stock' && prod.stock <= 10) return false;
      if (stockFilter === 'low_stock' && (prod.stock <= 0 || prod.stock > 10)) return false;
      if (stockFilter === 'out_of_stock' && prod.stock > 0) return false;
      return true;
    });
  }, [shopProducts, productSearch, categoryFilter, stockFilter]);

  // Order State Transition Mutations
  const confirmMutation = useMutation({
    mutationFn: (id: string) => shopOwnerApi.confirmOrder(id),
    onSuccess: () => {
      showFeedback('success', 'Đã xác nhận đơn hàng.');
      queryClient.invalidateQueries({ queryKey: ['shop', 'orders'] });
    },
    onError: (err: Error) => showFeedback('error', err.message || 'Lỗi xác nhận đơn hàng.'),
  });

  const prepareMutation = useMutation({
    mutationFn: (id: string) => shopOwnerApi.prepareOrder(id),
    onSuccess: () => {
      showFeedback('success', 'Đã chuyển đơn hàng sang trạng thái Đang chuẩn bị.');
      queryClient.invalidateQueries({ queryKey: ['shop', 'orders'] });
    },
    onError: (err: Error) => showFeedback('error', err.message || 'Lỗi cập nhật trạng thái đơn.'),
  });

  const readyMutation = useMutation({
    mutationFn: (id: string) => shopOwnerApi.readyOrder(id),
    onSuccess: () => {
      showFeedback('success', 'Đơn hàng đã sẵn sàng chờ Shipper lấy.');
      queryClient.invalidateQueries({ queryKey: ['shop', 'orders'] });
    },
    onError: (err: Error) => showFeedback('error', err.message || 'Lỗi cập nhật trạng thái đơn.'),
  });

  // Create Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductDesc, setNewProductDesc] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('50000');
  const [newProductStock, setNewProductStock] = useState('20');
  const [newProductSku, setNewProductSku] = useState('');
  const [newProductCategoryId, setNewProductCategoryId] = useState('');
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);

  // Edit Product Modal State
  const [editingProduct, setEditingProduct] = useState<ProductDto | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editStock, setEditStock] = useState('');
  const [editSku, setEditSku] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [editImages, setEditImages] = useState<ProductImageDto[]>([]);
  const [editNewImageFile, setEditNewImageFile] = useState<File | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isUploadingEditImage, setIsUploadingEditImage] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);

  // Delete Product Confirmation Modal State
  const [deletingProduct, setDeletingProduct] = useState<ProductDto | null>(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);

  // Quick Add Product Image Modal State
  const [selectedProductForImage, setSelectedProductForImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const openEditModal = (prod: ProductDto) => {
    setEditingProduct(prod);
    setEditName(prod.name);
    setEditDesc(prod.description || '');
    setEditPrice(String(prod.price));
    setEditStock(String(prod.stock));
    setEditSku(prod.sku || '');
    setEditCategoryId(prod.categoryId || '');
    setEditIsActive(prod.isActive ?? true);
    setEditImages(prod.images || []);
    setEditNewImageFile(null);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myShop) {
      showFeedback('error', 'Không tìm thấy cửa hàng để thêm sản phẩm.');
      return;
    }

    setIsCreatingProduct(true);
    try {
      await shopOwnerApi.createProduct(myShop.id, {
        name: newProductName.trim(),
        description: newProductDesc.trim() || undefined,
        price: parseFloat(newProductPrice),
        stock: parseInt(newProductStock, 10),
        sku: newProductSku.trim() || undefined,
        categoryId: newProductCategoryId || undefined,
      });
      showFeedback('success', 'Tạo sản phẩm mới thành công!');
      setIsProductModalOpen(false);
      setNewProductName('');
      setNewProductDesc('');
      setNewProductPrice('50000');
      setNewProductStock('20');
      setNewProductSku('');
      setNewProductCategoryId('');
      refetchProducts();
    } catch (err: any) {
      showFeedback('error', err.message || 'Lỗi tạo sản phẩm.');
    } finally {
      setIsCreatingProduct(false);
    }
  };

  const handleSaveEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    setIsSavingEdit(true);
    try {
      await shopOwnerApi.updateProduct(editingProduct.id, {
        name: editName.trim(),
        description: editDesc.trim(),
        price: parseFloat(editPrice),
        stock: parseInt(editStock, 10),
        sku: editSku.trim() || undefined,
        categoryId: editCategoryId || null,
        isActive: editIsActive,
      });
      showFeedback('success', `Đã cập nhật sản phẩm "${editName.trim()}".`);
      setEditingProduct(null);
      refetchProducts();
    } catch (err: any) {
      showFeedback('error', err.message || 'Lỗi cập nhật sản phẩm.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteExistingImage = async (imageId: string) => {
    if (!editingProduct) return;
    setDeletingImageId(imageId);
    try {
      await shopOwnerApi.deleteProductImage(editingProduct.id, imageId);
      setEditImages((prev) => prev.filter((img) => img.id !== imageId));
      showFeedback('success', 'Đã xóa ảnh sản phẩm.');
      refetchProducts();
    } catch (err: any) {
      showFeedback('error', err.message || 'Không thể xóa ảnh sản phẩm.');
    } finally {
      setDeletingImageId(null);
    }
  };

  const handleUploadImageInEdit = async () => {
    if (!editingProduct || !editNewImageFile) return;
    setIsUploadingEditImage(true);
    try {
      const uploaded = await shopOwnerApi.addProductImage(editingProduct.id, editNewImageFile);
      setEditImages((prev) => [...prev, uploaded]);
      setEditNewImageFile(null);
      showFeedback('success', 'Đã tải thêm ảnh mới cho sản phẩm.');
      refetchProducts();
    } catch (err: any) {
      showFeedback('error', err.message || 'Lỗi tải ảnh sản phẩm.');
    } finally {
      setIsUploadingEditImage(false);
    }
  };

  const handleConfirmDeleteProduct = async () => {
    if (!deletingProduct) return;
    setIsDeletingProduct(true);
    try {
      await shopOwnerApi.deleteProduct(deletingProduct.id);
      showFeedback('success', `Đã xóa sản phẩm "${deletingProduct.name}".`);
      setDeletingProduct(null);
      refetchProducts();
    } catch (err: any) {
      showFeedback('error', err.message || 'Lỗi xóa sản phẩm.');
    } finally {
      setIsDeletingProduct(false);
    }
  };

  const handleUploadImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForImage || !imageFile) return;

    setIsUploadingImage(true);
    try {
      await shopOwnerApi.addProductImage(selectedProductForImage, imageFile);
      showFeedback('success', 'Tải ảnh sản phẩm thành công!');
      setSelectedProductForImage(null);
      setImageFile(null);
      refetchProducts();
    } catch (err: any) {
      showFeedback('error', err.message || 'Lỗi tải ảnh.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const renderStockBadge = (stock: number) => {
    if (stock <= 0) return <Badge variant="danger">Hết hàng (0)</Badge>;
    if (stock <= 10) return <Badge variant="warning">Sắp hết ({stock})</Badge>;
    return <Badge variant="success">Còn hàng ({stock})</Badge>;
  };

  if (isShopsLoading) {
    return <LoadingState message="Đang tải thông tin cửa hàng..." />;
  }

  if (!myShop) {
    const isAdmin = user?.role === 'Admin';
    return (
      <div style={{ maxWidth: '720px', margin: '2rem auto' }}>
        <EmptyState
          icon={<Store size={48} />}
          title={isAdmin ? 'Tài khoản Admin không sở hữu cửa hàng riêng' : 'Bạn chưa có cửa hàng nào'}
          description={
            isAdmin
              ? 'Để quản lý tất cả cửa hàng, đơn hàng, sản phẩm và doanh thu toàn sàn, vui lòng truy cập Admin Dashboard.'
              : 'Hãy tạo cửa hàng đầu tiên của bạn để bắt đầu đăng sản phẩm và quản lý đơn hàng.'
          }
          action={
            isAdmin ? (
              <Button variant="primary" onClick={() => navigate('/admin')}>
                Đi tới Admin Dashboard
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={() => {
                  setNewShopName(user?.displayName ? `Shop của ${user.displayName}` : '');
                  setCreateShopError(null);
                  setIsCreateShopOpen(true);
                }}
              >
                <Plus size={16} /> Tạo cửa hàng mới
              </Button>
            )
          }
        />

        <Modal
          isOpen={isCreateShopOpen}
          onClose={() => setIsCreateShopOpen(false)}
          title="Tạo cửa hàng mới"
        >
          <form onSubmit={handleCreateShopSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {createShopError && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-danger-bg)',
                  color: 'var(--color-danger)',
                  fontSize: '0.875rem',
                }}
              >
                {createShopError}
              </div>
            )}
            <Input
              label="Tên cửa hàng"
              value={newShopName}
              onChange={(e) => setNewShopName(e.target.value)}
              placeholder="Ví dụ: Cửa hàng Thời Trang"
              required
            />
            <Textarea
              label="Mô tả cửa hàng (tùy chọn)"
              value={newShopDescription}
              onChange={(e) => setNewShopDescription(e.target.value)}
              placeholder="Giới thiệu ngắn gọn về cửa hàng và sản phẩm của bạn..."
              rows={3}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <Button type="button" variant="outline" onClick={() => setIsCreateShopOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" variant="primary" isLoading={createShopMutation.isPending}>
                <Plus size={16} /> Tạo cửa hàng
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1040px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Store size={24} color="var(--color-primary)" />
            Kênh Quản Trị Chủ Shop {myShop && `— ${myShop.name}`}
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            Quản lý quy trình đơn hàng, kho sản phẩm và theo dõi doanh thu thực tế
          </p>
        </div>

        {/* Dashboard Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Button
            variant={activeTab === 'orders' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('orders')}
          >
            <Package size={16} /> Đơn hàng ({shopOrders?.items.length ?? 0})
          </Button>

          <Button
            variant={activeTab === 'products' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('products')}
          >
            <ShoppingBag size={16} /> Sản phẩm ({shopProducts?.items.length ?? 0})
          </Button>

          <Button
            variant={activeTab === 'revenue' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('revenue')}
          >
            <DollarSign size={16} /> Doanh thu
          </Button>
        </div>
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

      {/* TAB 1: ORDERS WORKFLOW */}
      {activeTab === 'orders' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Search & Status Filter Pills */}
          <Card style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
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
                placeholder="Tìm theo mã đơn (#...) hoặc tên người mua..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem 0.5rem 2.25rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border-strong)',
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text)',
                  fontSize: '0.875rem',
                  outline: 'none',
                }}
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
          </Card>

          {isOrdersLoading && <LoadingState message="Đang tải đơn hàng..." />}

          {!isOrdersLoading && filteredOrders.length === 0 && (
            <EmptyState
              title="Không tìm thấy đơn hàng phù hợp"
              message={
                shopOrders?.items.length
                  ? 'Hãy thử thay đổi từ khóa tìm kiếm hoặc bộ lọc trạng thái.'
                  : 'Các đơn hàng mới khi khách checkout sẽ hiển thị tại đây.'
              }
            />
          )}

          {!isOrdersLoading &&
            filteredOrders.map((order) => (
              <Card key={order.id} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Mã đơn: #{order.id.slice(0, 8)}</span>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>Người mua: {order.buyerName}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      Địa chỉ: {order.shippingAddress} • Đặt lúc {formatDateTime(order.createdAt)}
                    </span>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </div>

                <div style={{ backgroundColor: 'var(--color-surface-hover)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                  {order.items.map((it) => (
                    <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                      <span>
                        {it.productNameSnapshot} x {it.quantity}
                      </span>
                      <span>{formatCurrencyVnd(it.subtotal)}</span>
                    </div>
                  ))}
                  <div style={{ textAlign: 'right', marginTop: '0.5rem', fontWeight: 700, fontSize: '0.9375rem', color: 'var(--color-primary)' }}>
                    Tổng: {formatCurrencyVnd(order.totalPrice)}
                  </div>
                </div>

                {/* Workflow Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem' }}>
                  {order.status === 'Pending' && (
                    <Button
                      variant="primary"
                      size="sm"
                      isLoading={confirmMutation.isPending}
                      onClick={() => confirmMutation.mutate(order.id)}
                    >
                      <Check size={14} /> Xác nhận đơn (Confirm)
                    </Button>
                  )}

                  {order.status === 'Confirmed' && (
                    <Button
                      variant="primary"
                      size="sm"
                      isLoading={prepareMutation.isPending}
                      onClick={() => prepareMutation.mutate(order.id)}
                    >
                      <Package size={14} /> Bắt đầu chuẩn bị hàng (Prepare)
                    </Button>
                  )}

                  {order.status === 'Preparing' && (
                    <Button
                      variant="primary"
                      size="sm"
                      isLoading={readyMutation.isPending}
                      onClick={() => readyMutation.mutate(order.id)}
                    >
                      <CheckCircle2 size={14} /> Sẵn sàng giao (WaitingForPickup)
                    </Button>
                  )}

                  {order.status === 'WaitingForPickup' && (
                    <span style={{ fontSize: '0.8125rem', color: 'var(--color-warning)', fontWeight: 500 }}>
                      Đang đợi Shipper nhận đơn giao...
                    </span>
                  )}

                  {order.status === 'Shipping' && (
                    <span style={{ fontSize: '0.8125rem', color: 'var(--color-info)', fontWeight: 500 }}>
                      Shipper ({order.shipperName || 'Shipper'}) đang giao hàng đến khách...
                    </span>
                  )}

                  {order.status === 'Delivered' && (
                    <span style={{ fontSize: '0.8125rem', color: 'var(--color-success)', fontWeight: 600 }}>
                      Đã giao thành công lúc {formatDateTime(order.deliveredAt)} (Đã ghi nhận doanh thu)
                    </span>
                  )}

                  {order.status === 'Cancelled' && (
                    <span style={{ fontSize: '0.8125rem', color: 'var(--color-danger)' }}>
                      Đơn hàng đã bị hủy (Tồn kho đã hoàn trả)
                    </span>
                  )}
                </div>
              </Card>
            ))}
        </div>
      )}

      {/* TAB 2: PRODUCTS MANAGEMENT */}
      {activeTab === 'products' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Danh mục sản phẩm của Shop</h3>
            <Button variant="primary" size="sm" onClick={() => setIsProductModalOpen(true)}>
              <Plus size={16} /> Thêm sản phẩm mới
            </Button>
          </div>

          {/* Search & Filter Toolbar */}
          <Card style={{ padding: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
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
                placeholder="Tìm theo tên sản phẩm hoặc mã SKU..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem 0.5rem 2.25rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border-strong)',
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text)',
                  fontSize: '0.875rem',
                  outline: 'none',
                }}
              />
            </div>

            <select
              aria-label="Lọc theo danh mục"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={selectStyle}
            >
              <option value="all">Tất cả danh mục</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>

            <select
              aria-label="Lọc theo tồn kho"
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as StockFilter)}
              style={selectStyle}
            >
              <option value="all">Tất cả tồn kho</option>
              <option value="in_stock">Còn hàng (&gt; 10)</option>
              <option value="low_stock">Sắp hết (&le; 10)</option>
              <option value="out_of_stock">Hết hàng (0)</option>
            </select>
          </Card>

          {isProductsLoading && <LoadingState message="Đang tải sản phẩm..." />}

          {!isProductsLoading && filteredProducts.length === 0 && (
            <EmptyState
              title="Không có sản phẩm nào"
              message={
                shopProducts?.items.length
                  ? 'Không tìm thấy sản phẩm khớp với bộ lọc hiện tại.'
                  : "Bấm vào 'Thêm sản phẩm mới' để bắt đầu bán hàng!"
              }
            />
          )}

          {!isProductsLoading &&
            filteredProducts.map((prod) => {
              const firstImg = prod.images?.[0] ? getProductImageSrc(prod.images[0]) : null;
              return (
                <Card
                  key={prod.id}
                  style={{
                    padding: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: '1 1 320px' }}>
                    {firstImg ? (
                      <img
                        src={firstImg}
                        alt={prod.name}
                        style={{
                          width: '64px',
                          height: '64px',
                          objectFit: 'cover',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--color-border)',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '64px',
                          height: '64px',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: 'var(--color-surface-hover)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--color-text-muted)',
                        }}
                      >
                        <ImageIcon size={24} />
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>{prod.name}</h4>
                        <Badge variant={prod.isActive ? 'primary' : 'default'}>
                          {prod.isActive ? 'Đang bán' : 'Tạm ẩn'}
                        </Badge>
                        {prod.categoryName && <Badge variant="info">{prod.categoryName}</Badge>}
                        {renderStockBadge(prod.stock)}
                      </div>

                      <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                        SKU: <strong>{prod.sku || 'N/A'}</strong> • Giá:{' '}
                        <strong style={{ color: 'var(--color-primary)' }}>{formatCurrencyVnd(prod.price)}</strong> •{' '}
                        {prod.images?.length ?? 0} ảnh
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <Button variant="outline" size="sm" onClick={() => setSelectedProductForImage(prod.id)}>
                      <ImageIcon size={14} /> Thêm ảnh
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => openEditModal(prod)}>
                      <Edit3 size={14} /> Chỉnh sửa
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => setDeletingProduct(prod)}>
                      <Trash2 size={14} /> Xóa
                    </Button>
                  </div>
                </Card>
              );
            })}
        </div>
      )}

      {/* TAB 3: REVENUE */}
      {activeTab === 'revenue' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <Card style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Khoảng thời gian (Tính theo ngày giao DeliveredAt):</span>
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
              <RefreshCw size={14} /> Cập nhật
            </Button>
          </Card>

          {isRevenueLoading && <LoadingState message="Đang tính toán doanh thu..." />}

          {!isRevenueLoading && revenueData && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <Card style={{ padding: '1.25rem', textAlign: 'center' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Tổng doanh thu (Delivered):</span>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-success)', marginTop: '0.25rem' }}>
                  {formatCurrencyVnd(revenueData.totalRevenue)}
                </div>
              </Card>

              <Card style={{ padding: '1.25rem', textAlign: 'center' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Số đơn giao thành công:</span>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-primary)', marginTop: '0.25rem' }}>
                  {revenueData.totalOrders} đơn
                </div>
              </Card>

              <Card style={{ padding: '1.25rem', textAlign: 'center' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Số sản phẩm đã bán:</span>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-accent)', marginTop: '0.25rem' }}>
                  {revenueData.totalItemsSold} cái
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Create Product Modal */}
      <Modal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} title="Thêm sản phẩm mới" maxWidth="520px">
        <form onSubmit={handleCreateProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input label="Tên sản phẩm" value={newProductName} onChange={(e) => setNewProductName(e.target.value)} required />
          <Textarea label="Mô tả sản phẩm" value={newProductDesc} onChange={(e) => setNewProductDesc(e.target.value)} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <Input label="Giá bán (VND)" type="number" min="0" value={newProductPrice} onChange={(e) => setNewProductPrice(e.target.value)} required />
            <Input label="Số lượng tồn kho" type="number" min="0" value={newProductStock} onChange={(e) => setNewProductStock(e.target.value)} required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <Input label="Mã SKU" value={newProductSku} onChange={(e) => setNewProductSku(e.target.value)} placeholder="VD: SKU-001" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Danh mục</label>
              <select value={newProductCategoryId} onChange={(e) => setNewProductCategoryId(e.target.value)} style={selectStyle}>
                <option value="">-- Chọn danh mục --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
            <Button type="button" variant="outline" onClick={() => setIsProductModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" isLoading={isCreatingProduct}>
              Tạo sản phẩm
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Product Modal */}
      <Modal
        isOpen={!!editingProduct}
        onClose={() => setEditingProduct(null)}
        title={`Chỉnh sửa sản phẩm${editingProduct ? `: ${editingProduct.name}` : ''}`}
        maxWidth="620px"
      >
        <form onSubmit={handleSaveEditProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input label="Tên sản phẩm" value={editName} onChange={(e) => setEditName(e.target.value)} required />
          <Textarea label="Mô tả sản phẩm" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <Input label="Giá bán (VND)" type="number" min="0" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} required />
            <Input label="Số lượng tồn kho" type="number" min="0" value={editStock} onChange={(e) => setEditStock(e.target.value)} required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <Input label="Mã SKU" value={editSku} onChange={(e) => setEditSku(e.target.value)} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Danh mục</label>
              <select value={editCategoryId} onChange={(e) => setEditCategoryId(e.target.value)} style={selectStyle}>
                <option value="">-- Không chọn danh mục --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}>
            <input type="checkbox" checked={editIsActive} onChange={(e) => setEditIsActive(e.target.checked)} />
            Hiển thị sản phẩm đang bán (Active)
          </label>

          {/* Product Images Management */}
          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>Hình ảnh sản phẩm ({editImages.length})</div>

            {editImages.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: '0.75rem' }}>
                {editImages.map((img) => {
                  const src = getProductImageSrc(img);
                  return (
                    <div
                      key={img.id}
                      style={{
                        position: 'relative',
                        borderRadius: 'var(--radius-md)',
                        overflow: 'hidden',
                        border: '1px solid var(--color-border)',
                        aspectRatio: '1',
                        backgroundColor: 'var(--color-surface-hover)',
                      }}
                    >
                      {src && <img src={src} alt="Product" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                      <button
                        type="button"
                        title="Xóa ảnh này"
                        disabled={deletingImageId === img.id}
                        onClick={() => handleDeleteExistingImage(img.id)}
                        style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          backgroundColor: 'rgba(239, 68, 68, 0.9)',
                          color: '#fff',
                          borderRadius: 'var(--radius-full)',
                          width: '24px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Chưa có ảnh nào cho sản phẩm này.</p>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setEditNewImageFile(e.target.files?.[0] || null)}
                style={{ fontSize: '0.8125rem' }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!editNewImageFile}
                isLoading={isUploadingEditImage}
                onClick={handleUploadImageInEdit}
              >
                <Upload size={14} /> Tải ảnh lên
              </Button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
            <Button type="button" variant="outline" onClick={() => setEditingProduct(null)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" isLoading={isSavingEdit}>
              Lưu thay đổi
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Product Confirmation Modal */}
      <Modal
        isOpen={!!deletingProduct}
        onClose={() => setDeletingProduct(null)}
        title="Xác nhận xóa sản phẩm"
        maxWidth="440px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', color: 'var(--color-danger)' }}>
            <AlertTriangle size={24} style={{ flexShrink: 0, marginTop: '2px' }} />
            <p style={{ fontSize: '0.9375rem', color: 'var(--color-text)' }}>
              Bạn có chắc chắn muốn xóa sản phẩm <strong>{deletingProduct?.name}</strong>? Hành động này không thể hoàn tác.
            </p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <Button type="button" variant="outline" onClick={() => setDeletingProduct(null)}>
              Hủy
            </Button>
            <Button type="button" variant="danger" isLoading={isDeletingProduct} onClick={handleConfirmDeleteProduct}>
              <Trash2 size={14} /> Xác nhận xóa
            </Button>
          </div>
        </div>
      </Modal>

      {/* Quick Upload Product Image Modal */}
      <Modal isOpen={!!selectedProductForImage} onClose={() => setSelectedProductForImage(null)} title="Tải ảnh cho sản phẩm">
        <form onSubmit={handleUploadImage} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} required />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
            <Button type="button" variant="outline" onClick={() => setSelectedProductForImage(null)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" isLoading={isUploadingImage}>
              Tải lên
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
