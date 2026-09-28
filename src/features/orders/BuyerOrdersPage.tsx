import React, { useState } from 'react';
import { Package, XCircle } from 'lucide-react';
import { useMyOrders } from '../../hooks/useOrders';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { OrderStatusBadge, OrderStatusTimeline } from '../../components/common/OrderStatusBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { Pagination } from '../../components/common/Pagination';
import { formatCurrencyVnd, formatDateTime } from '../../utils/formatters';

export const BuyerOrdersPage: React.FC = () => {
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [page, setPage] = useState(1);
  const { ordersData, orders, isLoading, cancelOrder, isCancelling } = useMyOrders(selectedStatus, page, 10);

  const statuses: { key: string; label: string }[] = [
    { key: '', label: 'Tất cả' },
    { key: 'Pending', label: 'Chờ duyệt' },
    { key: 'Confirmed', label: 'Đã nhận' },
    { key: 'Preparing', label: 'Đang chuẩn bị' },
    { key: 'WaitingForPickup', label: 'Chờ lấy hàng' },
    { key: 'Shipping', label: 'Đang giao' },
    { key: 'Delivered', label: 'Đã giao' },
    { key: 'Cancelled', label: 'Đã hủy' },
  ];

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này? Tồn kho sẽ được hoàn trả.')) return;
    try {
      await cancelOrder(orderId);
      alert('Hủy đơn hàng thành công!');
    } catch (err: any) {
      alert(err.message || 'Lỗi khi hủy đơn hàng.');
    }
  };

  return (
    <div style={{ maxWidth: '880px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Đơn hàng của tôi</h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
          Theo dõi trạng thái giao vận và lịch sử mua sắm của bạn
        </p>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
        {statuses.map((st) => (
          <button
            key={st.key}
            onClick={() => {
              setSelectedStatus(st.key);
              setPage(1);
            }}
            style={{
              padding: '0.375rem 0.875rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.8125rem',
              fontWeight: 500,
              backgroundColor: selectedStatus === st.key ? 'var(--color-primary)' : 'var(--color-surface)',
              color: selectedStatus === st.key ? '#ffffff' : 'var(--color-text)',
              border: '1px solid var(--color-border)',
              whiteSpace: 'nowrap',
            }}
          >
            {st.label}
          </button>
        ))}
      </div>

      {isLoading && <LoadingState message="Đang tải danh sách đơn hàng..." />}

      {!isLoading && orders.length === 0 && (
        <EmptyState
          icon={<Package size={32} />}
          title="Không tìm thấy đơn hàng nào"
          message={selectedStatus ? `Không có đơn hàng ở trạng thái "${selectedStatus}".` : 'Bạn chưa có đơn hàng nào.'}
        />
      )}

      {/* Orders List */}
      {!isLoading &&
        orders.map((order) => (
          <Card key={order.id} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Header: Shop & Status */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Mã đơn: #{order.id.slice(0, 8)}</span>
                <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>Cửa hàng: {order.shopName}</h4>
              </div>
              <OrderStatusBadge status={order.status} />
            </div>

            {/* Timeline progression */}
            <OrderStatusTimeline currentStatus={order.status} />

            {/* Items List */}
            <div
              style={{
                backgroundColor: 'var(--color-surface-hover)',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem 1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              {order.items.map((it) => (
                <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span>
                    {it.productNameSnapshot} x <strong>{it.quantity}</strong>
                  </span>
                  <span style={{ fontWeight: 600 }}>{formatCurrencyVnd(it.subtotal)}</span>
                </div>
              ))}
            </div>

            {/* Timestamps & Shipper metadata */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: 'var(--color-text-muted)', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <div>Đặt lúc: {formatDateTime(order.createdAt)}</div>
                {order.deliveredAt && <div style={{ color: 'var(--color-success)' }}>Giao lúc: {formatDateTime(order.deliveredAt)}</div>}
                {order.cancelledAt && <div style={{ color: 'var(--color-danger)' }}>Hủy lúc: {formatDateTime(order.cancelledAt)}</div>}
              </div>

              <div>
                {order.shipperName ? (
                  <span>Người giao: <strong>{order.shipperName}</strong></span>
                ) : (
                  <span>Chưa có người nhận giao</span>
                )}
                <div>Phí ship: {formatCurrencyVnd(order.shippingFee)}</div>
              </div>
            </div>

            {/* Total & Action footer */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px solid var(--color-border)',
                paddingTop: '0.75rem',
              }}
            >
              <div>
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Tổng thanh toán: </span>
                <strong style={{ fontSize: '1.125rem', color: 'var(--color-primary)' }}>
                  {formatCurrencyVnd(order.totalPrice)}
                </strong>
              </div>

              {/* Cancellation button (only when Pending) */}
              {order.status === 'Pending' && (
                <Button
                  variant="danger"
                  size="sm"
                  isLoading={isCancelling}
                  onClick={() => handleCancelOrder(order.id)}
                >
                  <XCircle size={14} />
                  Hủy đơn hàng
                </Button>
              )}
            </div>
          </Card>
        ))}

      {ordersData && (
        <Pagination
          currentPage={ordersData.page}
          totalPages={ordersData.totalPages}
          onPageChange={(p) => setPage(p)}
        />
      )}
    </div>
  );
};
