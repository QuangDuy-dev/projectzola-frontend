import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, CheckCircle2, DollarSign, PackageCheck, RefreshCw, Truck, User } from 'lucide-react';
import { shipperService } from '../../services/api/services';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { OrderStatusBadge } from '../../components/common/OrderStatusBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { formatCurrencyVnd, formatDateTime } from '../../utils/formatters';

export const ShipperDashboardPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'available' | 'my-deliveries' | 'profile' | 'revenue'>('available');

  // Revenue date filters
  const [revenueFrom, setRevenueFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [revenueTo, setRevenueTo] = useState(() => new Date().toISOString().slice(0, 10));

  // Queries
  const { data: availableOrders, isLoading: isAvailableLoading, refetch: refetchAvailable } = useQuery({
    queryKey: ['shipper', 'available-orders'],
    queryFn: () => shipperService.getAvailableOrders({ page: 1, pageSize: 30 }),
  });

  const { data: myOrders, isLoading: isMyOrdersLoading } = useQuery({
    queryKey: ['shipper', 'my-orders'],
    queryFn: () => shipperService.getMyOrders(undefined, { page: 1, pageSize: 30 }),
  });

  const { data: profile, refetch: refetchProfile } = useQuery({
    queryKey: ['shipper', 'profile'],
    queryFn: shipperService.getProfile,
  });

  const { data: revenueData, isLoading: isRevenueLoading, refetch: refetchRevenue } = useQuery({
    queryKey: ['shipper', 'revenue', revenueFrom, revenueTo],
    queryFn: () => shipperService.getShipperRevenue(new Date(revenueFrom).toISOString(), new Date(revenueTo).toISOString()),
    enabled: activeTab === 'revenue',
  });

  // Claim Mutation with Concurrency conflict handling
  const claimMutation = useMutation({
    mutationFn: (id: string) => shipperService.claimOrder(id),
    onSuccess: () => {
      alert('Nhận giao đơn hàng thành công!');
      queryClient.invalidateQueries({ queryKey: ['shipper', 'available-orders'] });
      queryClient.invalidateQueries({ queryKey: ['shipper', 'my-orders'] });
    },
    onError: (err: any) => {
      // 409 Conflict handling
      if (err.statusCode === 409 || err.message?.includes('đã có người nhận')) {
        alert('Rất tiếc! Đơn hàng này vừa được một shipper khác nhận trước đó.');
      } else {
        alert(err.message || 'Lỗi nhận đơn hàng.');
      }
      queryClient.invalidateQueries({ queryKey: ['shipper', 'available-orders'] });
    },
  });

  // Pickup mutation
  const pickupMutation = useMutation({
    mutationFn: (id: string) => shipperService.pickupOrder(id),
    onSuccess: () => {
      alert('Đã xác nhận lấy hàng từ shop. Bắt đầu giao hàng!');
      queryClient.invalidateQueries({ queryKey: ['shipper', 'my-orders'] });
    },
    onError: (err: any) => alert(err.message || 'Lỗi nhận hàng.'),
  });

  // Deliver mutation
  const deliverMutation = useMutation({
    mutationFn: (id: string) => shipperService.deliverOrder(id),
    onSuccess: () => {
      alert('Đã xác nhận giao hàng thành công đến người nhận! Phí vận chuyển đã được ghi nhận.');
      queryClient.invalidateQueries({ queryKey: ['shipper', 'my-orders'] });
      queryClient.invalidateQueries({ queryKey: ['shipper', 'revenue'] });
    },
    onError: (err: any) => alert(err.message || 'Lỗi xác nhận giao hàng.'),
  });

  // Profile Form state
  const [phone, setPhone] = useState('');
  const [vehicleType, setVehicleType] = useState('Xe máy');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  React.useEffect(() => {
    if (profile) {
      setPhone(profile.phone || '');
      setVehicleType(profile.vehicleType || 'Xe máy');
      setVehiclePlate(profile.vehiclePlate || '');
    }
  }, [profile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      await shipperService.updateProfile({ phone, vehicleType, vehiclePlate });
      alert('Cập nhật hồ sơ Shipper thành công!');
      refetchProfile();
    } catch (err: any) {
      alert(err.message || 'Lỗi cập nhật hồ sơ.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Truck size={24} color="var(--color-primary)" />
            Bảng Điều Khiển Giao Hàng (Shipper)
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            Nhận đơn sẵn sàng giao, cập nhật lộ trình vận chuyển và nhận phí giao hàng
          </p>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Button
            variant={activeTab === 'available' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('available')}
          >
            Đơn chờ nhận ({availableOrders?.items.length ?? 0})
          </Button>

          <Button
            variant={activeTab === 'my-deliveries' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('my-deliveries')}
          >
            Đơn của tôi ({myOrders?.items.length ?? 0})
          </Button>

          <Button
            variant={activeTab === 'revenue' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('revenue')}
          >
            <DollarSign size={16} /> Thu nhập phí ship
          </Button>

          <Button
            variant={activeTab === 'profile' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('profile')}
          >
            <User size={16} /> Hồ sơ phương tiện
          </Button>
        </div>
      </div>

      {/* TAB 1: AVAILABLE ORDERS */}
      {activeTab === 'available' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Đơn hàng đang chờ lấy (WaitingForPickup)</h3>
            <Button variant="outline" size="sm" onClick={() => refetchAvailable()}>
              <RefreshCw size={14} /> Làm mới
            </Button>
          </div>

          {isAvailableLoading && <LoadingState message="Đang tìm đơn chờ giao..." />}

          {!isAvailableLoading && availableOrders?.items.length === 0 && (
            <EmptyState title="Không có đơn hàng nào đang chờ lấy" message="Khi các shop chuẩn bị xong đơn hàng, đơn sẽ xuất hiện tại đây để bạn nhận." />
          )}

          {!isAvailableLoading &&
            availableOrders?.items.map((order) => (
              <Card key={order.id} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>Lấy từ: {order.shopName}</h4>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                      Giao đến: <strong>{order.shippingAddress}</strong> (Khách: {order.buyerName})
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-success)' }}>
                      + {formatCurrencyVnd(order.shippingFee)}
                    </div>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>Phí giao nhận</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem' }}>
                  <Button
                    variant="primary"
                    size="sm"
                    isLoading={claimMutation.isPending}
                    onClick={() => claimMutation.mutate(order.id)}
                  >
                    <PackageCheck size={16} /> Nhận giao đơn này (Claim)
                  </Button>
                </div>
              </Card>
            ))}
        </div>
      )}

      {/* TAB 2: MY DELIVERIES */}
      {activeTab === 'my-deliveries' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {isMyOrdersLoading && <LoadingState message="Đang tải các đơn đã nhận..." />}

          {!isMyOrdersLoading && myOrders?.items.length === 0 && (
            <EmptyState title="Bạn chưa nhận đơn giao nào" message="Chuyển sang tab 'Đơn chờ nhận' để nhận đơn giao mới!" />
          )}

          {!isMyOrdersLoading &&
            myOrders?.items.map((order) => (
              <Card key={order.id} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Mã đơn: #{order.id.slice(0, 8)}</span>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>Lấy tại: {order.shopName}</h4>
                    <p style={{ fontSize: '0.8125rem' }}>Giao đến: <strong>{order.shippingAddress}</strong></p>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </div>

                {/* Transition Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem' }}>
                  {order.status === 'WaitingForPickup' && (
                    <Button
                      variant="primary"
                      size="sm"
                      isLoading={pickupMutation.isPending}
                      onClick={() => pickupMutation.mutate(order.id)}
                    >
                      <Check size={14} /> Đã lấy hàng từ Shop (Bắt đầu giao)
                    </Button>
                  )}

                  {order.status === 'Shipping' && (
                    <Button
                      variant="primary"
                      size="sm"
                      isLoading={deliverMutation.isPending}
                      onClick={() => deliverMutation.mutate(order.id)}
                    >
                      <CheckCircle2 size={14} /> Đã giao đến tay khách (Hoàn tất)
                    </Button>
                  )}

                  {order.status === 'Delivered' && (
                    <span style={{ fontSize: '0.8125rem', color: 'var(--color-success)', fontWeight: 600 }}>
                      Giao thành công lúc {formatDateTime(order.deliveredAt)} • +{formatCurrencyVnd(order.shippingFee)}
                    </span>
                  )}
                </div>
              </Card>
            ))}
        </div>
      )}

      {/* TAB 3: SHIPPER REVENUE */}
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
              <RefreshCw size={14} /> Cập nhật
            </Button>
          </Card>

          {isRevenueLoading && <LoadingState message="Đang tính thu nhập..." />}

          {!isRevenueLoading && revenueData && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <Card style={{ padding: '1.25rem', textAlign: 'center' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Tổng phí giao hàng kiếm được:</span>
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
            </div>
          )}
        </div>
      )}

      {/* TAB 4: SHIPPER PROFILE */}
      {activeTab === 'profile' && (
        <Card style={{ maxWidth: '500px', padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Hồ sơ phương tiện vận chuyển</h3>
          <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input label="Số điện thoại" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="090..." required />
            <Input label="Loại phương tiện" value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} placeholder="Xe máy, Xe tải..." required />
            <Input label="Biển số xe" value={vehiclePlate} onChange={(e) => setVehiclePlate(e.target.value)} placeholder="59-X1 12345" required />

            <Button type="submit" variant="primary" isLoading={isUpdatingProfile} style={{ marginTop: '0.5rem' }}>
              Lưu thông tin hồ sơ
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
};
