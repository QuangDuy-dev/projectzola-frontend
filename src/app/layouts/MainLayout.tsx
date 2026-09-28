import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Bell,
  Bot,
  Flame,
  Home,
  LogOut,
  Menu,
  MessageSquare,
  Package,
  ShoppingBag,
  ShoppingCart,
  Store,
  Truck,
  User as UserIcon,
  ShieldCheck,
  Terminal,
  X,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';
import { useNotifications } from '../../hooks/useNotifications';
import { useUiStore } from '../../stores/uiStore';
import { Badge } from '../../components/ui/Badge';
import { SafeImage } from '../../components/common/SafeImage';

export const MainLayout: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount } = useCart();
  const { unreadCount } = useNotifications();
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useUiStore();
  const navigate = useNavigate();

  const navItems = [
    { to: '/feed', label: 'Bảng tin', icon: <Home size={18} /> },
    { to: '/shorts', label: 'Video ngắn (Shorts)', icon: <Flame size={18} /> },
    { to: '/shop', label: 'Cửa hàng (Shopping)', icon: <ShoppingBag size={18} /> },
    {
      to: '/cart',
      label: 'Giỏ hàng',
      icon: <ShoppingCart size={18} />,
      badge: itemCount > 0 ? itemCount : null,
    },
    { to: '/orders', label: 'Đơn hàng của tôi', icon: <Package size={18} /> },
    { to: '/chat', label: 'Trò chuyện (Realtime)', icon: <MessageSquare size={18} /> },
    {
      to: '/notifications',
      label: 'Thông báo',
      icon: <Bell size={18} />,
      badge: unreadCount > 0 ? unreadCount : null,
    },
    { to: '/assistant', label: 'Trợ lý AI (Ollama)', icon: <Bot size={18} /> },
    { to: '/profile', label: 'Tài khoản', icon: <UserIcon size={18} /> },
  ];

  const role = user?.role;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-background)' }}>
      {/* Header */}
      <header
        style={{
          height: 'var(--header-height)',
          backgroundColor: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={toggleSidebar}
            style={{ display: 'flex', color: 'var(--color-text)', padding: '0.25rem' }}
            aria-label="Toggle menu"
          >
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div
            onClick={() => navigate('/feed')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-primary)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '1.125rem',
              }}
            >
              Z
            </div>
            <span style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--color-text)' }}>
              MySocialApp
            </span>
          </div>
        </div>

        {/* User profile & Quick actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                onClick={() => navigate('/profile')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  padding: '0.25rem 0.5rem',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden' }}>
                  <SafeImage src={user?.avatarUrl} alt={user?.displayName || 'User'} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)' }}>
                    {user?.displayName}
                  </span>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                    {user?.role}
                  </span>
                </div>
              </div>

              <button
                onClick={logout}
                title="Đăng xuất"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.375rem 0.625rem',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-text-muted)',
                  border: '1px solid var(--color-border)',
                  fontSize: '0.8125rem',
                }}
              >
                <LogOut size={16} />
                <span style={{ display: 'none' }}>Đăng xuất</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => navigate('/login')}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-primary)',
                  color: '#ffffff',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                }}
              >
                Đăng nhập
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Area with Sidebar */}
      <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
        {/* Sidebar Navigation */}
        <aside
          style={{
            width: 'var(--sidebar-width)',
            backgroundColor: 'var(--color-surface)',
            borderRight: '1px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            padding: '1.25rem 0.75rem',
            position: 'sticky',
            top: 'var(--header-height)',
            height: 'calc(100vh - var(--header-height))',
            overflowY: 'auto',
            zIndex: 90,
            transition: 'transform 0.2s ease',
          }}
        >
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', padding: '0.5rem 0.75rem' }}>
              Menu Chính
            </span>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.625rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.9375rem',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? 'var(--color-primary)' : 'var(--color-text)',
                  backgroundColor: isActive ? 'var(--color-primary-light)' : 'transparent',
                })}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge != null && (
                  <Badge variant="primary">{item.badge}</Badge>
                )}
              </NavLink>
            ))}

            {/* Role-Specific Workflows */}
            {(role === 'ShopOwner' || role === 'Admin') && (
              <>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', padding: '1rem 0.75rem 0.5rem' }}>
                  Quản Trị Bán Hàng
                </span>
                <NavLink
                  to="/shop-owner"
                  onClick={() => setSidebarOpen(false)}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.625rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.9375rem',
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? 'var(--color-primary)' : 'var(--color-text)',
                    backgroundColor: isActive ? 'var(--color-primary-light)' : 'transparent',
                  })}
                >
                  <Store size={18} />
                  <span>Kênh Chủ Shop</span>
                </NavLink>
              </>
            )}

            {(role === 'Shipper' || role === 'Admin') && (
              <>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', padding: '1rem 0.75rem 0.5rem' }}>
                  Giao Vận
                </span>
                <NavLink
                  to="/shipper"
                  onClick={() => setSidebarOpen(false)}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.625rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.9375rem',
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? 'var(--color-primary)' : 'var(--color-text)',
                    backgroundColor: isActive ? 'var(--color-primary-light)' : 'transparent',
                  })}
                >
                  <Truck size={18} />
                  <span>Bảng Tin Shipper</span>
                </NavLink>
              </>
            )}

            {role === 'Admin' && (
              <>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', padding: '1rem 0.75rem 0.5rem' }}>
                  Quản Trị Hệ Thống
                </span>
                <NavLink
                  to="/admin"
                  onClick={() => setSidebarOpen(false)}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.625rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.9375rem',
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? 'var(--color-primary)' : 'var(--color-text)',
                    backgroundColor: isActive ? 'var(--color-primary-light)' : 'transparent',
                  })}
                >
                  <ShieldCheck size={18} />
                  <span>Admin Dashboard</span>
                </NavLink>
              </>
            )}

            {/* Diagnostic / Dev link */}
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', padding: '1rem 0.75rem 0.5rem' }}>
              Kiểm Thử Backend
            </span>
            <NavLink
              to="/dev/api"
              onClick={() => setSidebarOpen(false)}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.625rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.9375rem',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? 'var(--color-primary)' : 'var(--color-text)',
                backgroundColor: isActive ? 'var(--color-primary-light)' : 'transparent',
              })}
            >
              <Terminal size={18} />
              <span>Chẩn Đoán API (/dev/api)</span>
            </NavLink>
          </nav>
        </aside>

        {/* Content Outlet */}
        <main
          style={{
            flex: 1,
            padding: '1.5rem',
            maxWidth: '1200px',
            width: '100%',
            margin: '0 auto',
            minHeight: 'calc(100vh - var(--header-height))',
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};
