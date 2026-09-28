import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowRight, Store, CheckCircle } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { SafeImage } from '../../components/common/SafeImage';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { formatCurrencyVnd } from '../../utils/formatters';
import type { OrderDto } from '../../types';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    cart,
    itemCount,
    isLoading,
    updateItem,
    isUpdatingItem,
    removeItem,
    clearCart,
    checkout,
    isCheckingOut,
    checkoutError,
  } = useCart();

  const [shippingAddress, setShippingAddress] = useState('Số 123 Đường Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh');
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [createdOrders, setCreatedOrders] = useState<OrderDto[] | null>(null);

  if (isLoading) return <LoadingState message="Đang tải giỏ hàng..." />;

  if (!cart || cart.items.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBag size={32} />}
        title="Giỏ hàng của bạn đang trống"
        message="Hãy dạo quanh cửa hàng để tìm các sản phẩm bạn yêu thích!"
        action={
          <Button variant="primary" onClick={() => navigate('/shop')}>
            Tiếp tục mua sắm
          </Button>
        }
      />
    );
  }

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingAddress.trim()) return;

    try {
      const orders = await checkout(shippingAddress.trim());
      setCreatedOrders(orders);
    } catch {
      // Error handled via checkoutError
    }
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Giỏ hàng ({itemCount} món)</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            Sản phẩm được tự động phân nhóm theo từng Cửa hàng để tạo đơn hàng tương ứng
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={() => clearCart()}>
          <Trash2 size={14} /> Xóa toàn bộ giỏ
        </Button>
      </div>

      {/* Shop Groups */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {cart.shopGroups.map((group) => (
          <Card key={group.shopId} style={{ padding: '1.25rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                borderBottom: '1px solid var(--color-border)',
                paddingBottom: '0.75rem',
                marginBottom: '0.75rem',
              }}
            >
              <Store size={18} color="var(--color-primary)" />
              <Link to={`/shops/${group.shopId}`} style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--color-text)' }}>
                {group.shopName}
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {group.items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: '240px', flex: 1 }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: 'var(--radius-md)', overflow: 'hidden', backgroundColor: '#f1f5f9' }}>
                      <SafeImage src={item.productImageUrl} alt={item.productName} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>{item.productName}</h4>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                        {formatCurrencyVnd(item.productPrice)}
                      </span>
                    </div>
                  </div>

                  {/* Quantity controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                      <button
                        onClick={() => updateItem({ cartItemId: item.id, quantity: item.quantity - 1 })}
                        disabled={item.quantity <= 1 || isUpdatingItem}
                        style={{ padding: '0.25rem 0.625rem', fontWeight: 600 }}
                      >
                        -
                      </button>
                      <span style={{ minWidth: '32px', textAlign: 'center', fontSize: '0.875rem' }}>{item.quantity}</span>
                      <button
                        onClick={() => updateItem({ cartItemId: item.id, quantity: item.quantity + 1 })}
                        disabled={isUpdatingItem}
                        style={{ padding: '0.25rem 0.625rem', fontWeight: 600 }}
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => removeItem(item.id)}
                      title="Xóa món này"
                      style={{ color: 'var(--color-danger)', padding: '0.375rem' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Subtotal */}
                  <div style={{ minWidth: '110px', textAlign: 'right', fontWeight: 700, fontSize: '0.9375rem' }}>
                    {formatCurrencyVnd(item.subtotal)}
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: '0.5rem',
                borderTop: '1px solid var(--color-border)',
                marginTop: '1rem',
                paddingTop: '0.75rem',
                fontSize: '0.875rem',
              }}
            >
              <span style={{ color: 'var(--color-text-muted)' }}>Tổng tiền shop:</span>
              <strong style={{ color: 'var(--color-primary)', fontSize: '1rem' }}>
                {formatCurrencyVnd(group.shopTotal)}
              </strong>
            </div>
          </Card>
        ))}
      </div>

      {/* Cart Summary & Checkout bar */}
      <Card style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Tổng thanh toán tất cả các shop:</span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-primary)' }}>
            {formatCurrencyVnd(cart.totalPrice)}
          </div>
        </div>

        <Button variant="primary" size="lg" onClick={() => setIsCheckoutModalOpen(true)}>
          Tiến hành đặt hàng (Checkout)
          <ArrowRight size={18} />
        </Button>
      </Card>

      {/* Checkout Modal */}
      <Modal
        isOpen={isCheckoutModalOpen}
        onClose={() => {
          setIsCheckoutModalOpen(false);
          if (createdOrders) {
            navigate('/orders');
          }
        }}
        title={createdOrders ? 'Đặt hàng thành công!' : 'Xác nhận thông tin giao hàng'}
        maxWidth="520px"
      >
        {!createdOrders ? (
          <form onSubmit={handleCheckoutSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
              Đơn hàng sẽ được tách riêng theo từng cửa hàng ({cart.shopGroups.length} đơn). Tồn kho sẽ được trừ tự động và nguyên tử.
            </p>

            <Input
              label="Địa chỉ giao hàng (Bắt buộc)"
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              placeholder="Nhập địa chỉ nhận hàng chi tiết..."
              required
            />

            {checkoutError && (
              <div
                style={{
                  padding: '0.75rem',
                  backgroundColor: 'var(--color-danger-bg)',
                  color: 'var(--color-danger)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.875rem',
                }}
              >
                {checkoutError.message}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
              <Button type="button" variant="outline" onClick={() => setIsCheckoutModalOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" variant="primary" isLoading={isCheckingOut}>
                Xác nhận đặt hàng
              </Button>
            </div>
          </form>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ color: 'var(--color-success)', display: 'flex', justifyContent: 'center' }}>
              <CheckCircle size={48} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Đã tạo {createdOrders.length} đơn hàng!</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
              Giỏ hàng của bạn đã được dọn sạch. Bạn có thể theo dõi tiến độ xử lý và giao hàng của từng đơn ngay bây giờ.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
              {createdOrders.map((ord) => (
                <div
                  key={ord.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '0.75rem',
                    backgroundColor: 'var(--color-surface-hover)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.875rem',
                  }}
                >
                  <span>Cửa hàng: <strong>{ord.shopName}</strong></span>
                  <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{formatCurrencyVnd(ord.totalPrice)}</span>
                </div>
              ))}
            </div>

            <Button
              variant="primary"
              size="md"
              style={{ marginTop: '1rem' }}
              onClick={() => {
                setIsCheckoutModalOpen(false);
                navigate('/orders');
              }}
            >
              Xem danh sách đơn hàng
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};
