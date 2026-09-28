import React from 'react';
import { Badge } from '../ui/Badge';
import type { OrderStatus } from '../../types';

export interface OrderStatusBadgeProps {
  status: OrderStatus | string;
}

export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ status }) => {
  const getBadgeConfig = (st: string) => {
    switch (st) {
      case 'Pending':
        return { variant: 'warning' as const, label: 'Chờ xác nhận' };
      case 'Confirmed':
        return { variant: 'info' as const, label: 'Đã xác nhận' };
      case 'Preparing':
        return { variant: 'primary' as const, label: 'Đang chuẩn bị' };
      case 'WaitingForPickup':
        return { variant: 'warning' as const, label: 'Chờ lấy hàng' };
      case 'Shipping':
        return { variant: 'info' as const, label: 'Đang giao' };
      case 'Delivered':
        return { variant: 'success' as const, label: 'Đã giao thành công' };
      case 'Cancelled':
        return { variant: 'danger' as const, label: 'Đã hủy' };
      default:
        return { variant: 'default' as const, label: st };
    }
  };

  const { variant, label } = getBadgeConfig(status);

  return <Badge variant={variant}>{label}</Badge>;
};

export const OrderStatusTimeline: React.FC<{ currentStatus: OrderStatus | string }> = ({
  currentStatus,
}) => {
  const steps: OrderStatus[] = [
    'Pending',
    'Confirmed',
    'Preparing',
    'WaitingForPickup',
    'Shipping',
    'Delivered',
  ];

  const labels: Record<string, string> = {
    Pending: 'Chờ duyệt',
    Confirmed: 'Đã nhận',
    Preparing: 'Chuẩn bị',
    WaitingForPickup: 'Chờ lấy',
    Shipping: 'Đang giao',
    Delivered: 'Hoàn thành',
  };

  const isCancelled = currentStatus === 'Cancelled';
  const currentIndex = steps.indexOf(currentStatus as OrderStatus);

  if (isCancelled) {
    return (
      <div
        style={{
          padding: '0.75rem 1rem',
          backgroundColor: 'var(--color-danger-bg)',
          color: 'var(--color-danger)',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.875rem',
          fontWeight: 500,
        }}
      >
        Đơn hàng này đã bị hủy.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', width: '100%', overflowX: 'auto', padding: '0.5rem 0' }}>
      {steps.map((step, idx) => {
        const isCompleted = currentIndex >= idx;
        const isCurrent = currentIndex === idx;

        return (
          <React.Fragment key={step}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '60px' }}>
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: isCompleted ? 'var(--color-primary)' : '#e2e8f0',
                  color: isCompleted ? '#ffffff' : '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  outline: isCurrent ? '3px solid var(--color-primary-light)' : 'none',
                }}
              >
                {idx + 1}
              </div>
              <span
                style={{
                  fontSize: '0.6875rem',
                  marginTop: '0.25rem',
                  color: isCompleted ? 'var(--color-text)' : 'var(--color-text-muted)',
                  fontWeight: isCurrent ? 600 : 400,
                  textAlign: 'center',
                }}
              >
                {labels[step]}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: '2px',
                  backgroundColor: currentIndex > idx ? 'var(--color-primary)' : '#e2e8f0',
                  marginBottom: '1rem',
                  minWidth: '20px',
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
