import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, CheckCircle2, DollarSign, Image, Package, Plus, RefreshCw, ShoppingBag, Store } from 'lucide-react';
import { shopOwnerService, shoppingService } from '../../services/api/services';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Modal } from '../../components/ui/Modal';
import { OrderStatusBadge } from '../../components/common/OrderStatusBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { formatCurrencyVnd, formatDateTime } from '../../utils/formatters';

export const ShopOwnerDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'revenue'>('orders');

  // Revenue date filters (default last 30 days)
  const [revenueFrom, setRevenueFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [revenueTo, setRevenueTo] = useState(() => new Date().toISOString().slice(0, 10));

  // Shop Info & Orders Queries
  const { data: shopsData } = useQuery({
    queryKey: ['shops', 'all'],
    queryFn: () => shoppingService.getAllShops({ page: 1, pageSize: 50 }),
  });

  const myShop = shopsData?.items.find((s) => s.ownerId === user?.id) || shopsData?.items[0];

  const { data: shopOrders, isLoading: isOrdersLoading } = useQuery({
    queryKey: ['shop', 'orders'],
    queryFn: () => shopOwnerService.getShopOrders(undefined, { page: 1, pageSize: 50 }),
  });

  const { data: shopProducts, isLoading: isProductsLoading, refetch: refetchProducts } = useQuery({
    queryKey: ['shop', myShop?.id, 'products'],
    queryFn: () => (myShop ? shoppingService.getShopProducts(myShop.id, undefined, undefined, { page: 1, pageSize: 50 }) : Promise.reject('No shop')),
    enabled: !!myShop,
  });

  const { data: revenueData, isLoading: isRevenueLoading, refetch: refetchRevenue } = useQuery({
    queryKey: ['shop', 'revenue', revenueFrom, revenueTo],
    queryFn: () => shopOwnerService.getShopRevenue(new Date(revenueFrom).toISOString(), new Date(revenueTo).toISOString()),
    enabled: activeTab === 'revenue',
  });

  // State Transition Mutations
  const confirmMutation = useMutation({
    mutationFn: (id: string) => shopOwnerService.confirmOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop', 'orders'] });
    },
  });

  const prepareMutation = useMutation({
    mutationFn: (id: string) => shopOwnerService.prepareOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop', 'orders'] });
    },
  });

  const readyMutation = useMutation({
    mutationFn: (id: string) => shopOwnerService.readyOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop', 'orders'] });
    },
  });

  // Create Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductDesc, setNewProductDesc] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('50000');
  const [newProductStock, setNewProductStock] = useState('20');
  const [newProductSku, setNewProductSku] = useState('SKU-001');

  // Add Product Image Modal State
  const [selectedProductForImage, setSelectedProductForImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myShop) {
      alert('Không tìm thấy cửa hàng để thêm sản phẩm.');
      return;
    }

    try {
      await shopOwnerService.createProduct(myShop.id, {
        name: newProductName,
        description: newProductDesc,
        price: parseFloat(newProductPrice),
        stock: parseInt(newProductStock, 10),
        sku: newProductSku,
      });
      alert('Tạo sản phẩm thành công!');
      setIsProductModalOpen(false);
      setNewProductName('');
      refetchProducts();
    } catch (err: any) {
      alert(err.message || 'Lỗi tạo sản phẩm.');
    }
  };

  const handleUploadImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForImage || !imageFile) return;

    setIsUploadingImage(true);
    try {
      await shopOwnerService.addProductImage(selectedProductForImage, imageFile);
      alert('Tải ảnh sản phẩm thành công!');
      setSelectedProductForImage(null);
      setImageFile(null);
      refetchProducts();
    } catch (err: any) {
      alert(err.message || 'Lỗi tải ảnh.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Store size={24} color="var(--color-primary)" />
            Kênh Quản Trị Chủ Shop {myShop && `— ${myShop.name}`}
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            Quản lý quy trình đơn hàng, sản phẩm và theo dõi doanh thu thực tế
          </p>
        </div>

        {/* Dashboard Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
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

      {/* TAB 1: ORDERS WORKFLOW */}
      {activeTab === 'orders' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {isOrdersLoading && <LoadingState message="Đang tải đơn hàng..." />}

          {!isOrdersLoading && shopOrders?.items.length === 0 && (
            <EmptyState title="Cửa hàng chưa có đơn hàng nào" message="Các đơn hàng mới khi khách checkout sẽ hiển thị tại đây." />
          )}

          {!isOrdersLoading &&
            shopOrders?.items.map((order) => (
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
                      <span>{it.productNameSnapshot} x {it.quantity}</span>
                      <span>{formatCurrencyVnd(it.subtotal)}</span>
                    </div>
                  ))}
                  <div style={{ textAlign: 'right', marginTop: '0.5rem', fontWeight: 700, fontSize: '0.9375rem', color: 'var(--color-primary)' }}>
                    Tổng: {formatCurrencyVnd(order.totalPrice)}
                  </div>
                </div>

                {/* Workflow Buttons according to backend state machine */}
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Danh mục sản phẩm của Shop</h3>
            <Button variant="primary" size="sm" onClick={() => setIsProductModalOpen(true)}>
              <Plus size={16} /> Thêm sản phẩm mới
            </Button>
          </div>

          {isProductsLoading && <LoadingState message="Đang tải sản phẩm..." />}

          {!isProductsLoading && shopProducts?.items.length === 0 && (
            <EmptyState title="Shop chưa có sản phẩm nào" message="Bấm vào 'Thêm sản phẩm mới' để bắt đầu bán hàng!" />
          )}

          {!isProductsLoading &&
            shopProducts?.items.map((prod) => (
              <Card key={prod.id} style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>{prod.name}</h4>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                    Mã SKU: {prod.sku || 'N/A'} • Tồn kho: <strong>{prod.stock}</strong> • Giá: <strong>{formatCurrencyVnd(prod.price)}</strong>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)' }}>
                    {prod.images.length} ảnh đã tải lên
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Button variant="outline" size="sm" onClick={() => setSelectedProductForImage(prod.id)}>
                    <Image size={14} /> Thêm ảnh
                  </Button>
                </div>
              </Card>
            ))}
        </div>
      )}

      {/* TAB 3: REVENUE */}
      {activeTab === 'revenue' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Date range picker */}
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
      <Modal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} title="Thêm sản phẩm mới" maxWidth="500px">
        <form onSubmit={handleCreateProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input label="Tên sản phẩm" value={newProductName} onChange={(e) => setNewProductName(e.target.value)} required />
          <Textarea label="Mô tả sản phẩm" value={newProductDesc} onChange={(e) => setNewProductDesc(e.target.value)} />
          <Input label="Giá bán (VND)" type="number" value={newProductPrice} onChange={(e) => setNewProductPrice(e.target.value)} required />
          <Input label="Số lượng tồn kho" type="number" value={newProductStock} onChange={(e) => setNewProductStock(e.target.value)} required />
          <Input label="Mã SKU" value={newProductSku} onChange={(e) => setNewProductSku(e.target.value)} />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
            <Button type="button" variant="outline" onClick={() => setIsProductModalOpen(false)}>Hủy</Button>
            <Button type="submit" variant="primary">Tạo sản phẩm</Button>
          </div>
        </form>
      </Modal>

      {/* Upload Product Image Modal */}
      <Modal isOpen={!!selectedProductForImage} onClose={() => setSelectedProductForImage(null)} title="Tải ảnh cho sản phẩm">
        <form onSubmit={handleUploadImage} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            required
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
            <Button type="button" variant="outline" onClick={() => setSelectedProductForImage(null)}>Hủy</Button>
            <Button type="submit" variant="primary" isLoading={isUploadingImage}>Tải lên</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
