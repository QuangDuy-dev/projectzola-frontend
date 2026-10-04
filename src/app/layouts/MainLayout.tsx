import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
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
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setSidebarOpen]);

  // Close mobile drawer on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname, setSidebarOpen]);

  const navItems = [
    { to: '/feed', label: 'Bảng tin', icon: <Home size={19} /> },
    { to: '/shorts', label: 'Video ngắn (Shorts)', icon: <Flame size={19} />, badge: 'HOT' },
    { to: '/shop', label: 'Cửa hàng (Shopping)', icon: <ShoppingBag size={19} /> },
    {
      to: '/cart',
      label: 'Giỏ hàng',
      icon: <ShoppingCart size={19} />,
      badge: itemCount > 0 ? itemCount : null,
    },
    { to: '/orders', label: 'Đơn hàng của tôi', icon: <Package size={19} /> },
    {
      to: '/chat',
      label: 'Trò chuyện (Realtime)',
      icon: <MessageSquare size={19} />,
    },
    {
      to: '/notifications',
      label: 'Thông báo',
      icon: <Bell size={19} />,
      badge: unreadCount > 0 ? unreadCount : null,
    },
    { to: '/assistant', label: 'Trợ lý AI (Ollama)', icon: <Bot size={19} /> },
    { to: '/profile', label: 'Tài khoản', icon: <UserIcon size={19} /> },
  ];

  // Mobile Bottom Navigation Tabs (5 core tabs)
  const mobileBottomTabs = [
    { to: '/feed', label: 'Bảng tin', icon: <Home size={20} /> },
    { to: '/shorts', label: 'Shorts', icon: <Flame size={20} /> },
    { to: '/shop', label: 'Mua sắm', icon: <ShoppingBag size={20} /> },
    {
      to: '/chat',
      label: 'Tin nhắn',
      icon: <MessageSquare size={20} />,
      badge: null,
    },
    { to: '/profile', label: 'Cá nhân', icon: <UserIcon size={20} /> },
  ];

  const role = user?.role;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-background)' }}>
      {/* Header */}
      <header
        style={{
          height: 'var(--header-height)',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--color-border)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          {/* Mobile menu toggle */}
          <button
            onClick={toggleSidebar}
            style={{
              display: isMobile ? 'flex' : 'none',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text)',
              padding: '0.4rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
            }}
            aria-label="Toggle menu"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Logo Brand */}
          <div
            onClick={() => navigate('/feed')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
          >
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: 'var(--radius-sm)',
                background: 'linear-gradient(135deg, var(--color-primary) 0%, #ff7824 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.2rem',
                boxShadow: 'var(--shadow-glow)',
              }}
            >
              Z
            </div>
            <span style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--color-text)', letterSpacing: '-0.5px' }}>
              Zola<span style={{ color: 'var(--color-primary)' }}>.vn</span>
            </span>
          </div>
        </div>

        {/* User profile & Quick actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {/* Quick Cart Icon (always visible) */}
          <button
            onClick={() => navigate('/cart')}
            title="Giỏ hàng"
            style={{
              position: 'relative',
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all var(--dur-feedback) var(--ease-out)',
            }}
          >
            <ShoppingCart size={18} />
            {itemCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  backgroundColor: 'var(--color-primary)',
                  color: '#ffffff',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  padding: '1px 5px',
                  borderRadius: 'var(--radius-pill)',
                  border: '2px solid var(--color-surface)',
                }}
              >
                {itemCount}
              </span>
            )}
          </button>

          {/* Quick Notifications Icon */}
          <button
            onClick={() => navigate('/notifications')}
            title="Thông báo"
            style={{
              position: 'relative',
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all var(--dur-feedback) var(--ease-out)',
            }}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  backgroundColor: 'var(--color-accent)',
                  color: '#ffffff',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  padding: '1px 5px',
                  borderRadius: 'var(--radius-pill)',
                  border: '2px solid var(--color-surface)',
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div
                onClick={() => navigate('/profile')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  padding: '0.2rem 0.4rem',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <div style={{ width: '34px', height: '34px', borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--color-primary-light)' }}>
                  <SafeImage src={user?.avatarUrl} alt={user?.displayName || 'User'} />
                </div>
                {!isMobile && (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user?.displayName}
                    </span>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--color-primary)', fontWeight: 700 }}>
                      {user?.role}
                    </span>
                  </div>
                )}
              </div>

              {!isMobile && (
                <button
                  onClick={logout}
                  title="Đăng xuất"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.4rem 0.65rem',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--color-text-muted)',
                    border: '1px solid var(--color-border)',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                  }}
                >
                  <LogOut size={16} />
                  <span>Đăng xuất</span>
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => navigate('/login')}
              style={{
                padding: '0.45rem 1rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--color-primary)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.85rem',
                boxShadow: 'var(--shadow-glow)',
              }}
            >
              Đăng nhập
            </button>
          )}
        </div>
      </header>

      {/* Main Area */}
      <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
        
        {/* Desktop Sidebar Navigation */}
        {!isMobile && (
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
              flexShrink: 0,
            }}
          >
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--color-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '0.5rem 0.75rem 0.25rem' }}>
                Menu Chính
              </span>
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.625rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? 'var(--color-primary)' : 'var(--color-text)',
                    backgroundColor: isActive ? 'var(--color-primary-light)' : 'transparent',
                    transition: 'all var(--dur-feedback) var(--ease-out)',
                  })}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.badge != null && (
                    <Badge variant={item.badge === 'HOT' ? 'danger' : 'primary'}>{item.badge}</Badge>
                  )}
                </NavLink>
              ))}

              {/* Role-Specific Workflows */}
              {(role === 'ShopOwner' || role === 'Admin') && (
                <>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--color-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '1rem 0.75rem 0.25rem' }}>
                    Quản Trị Bán Hàng
                  </span>
                  <NavLink
                    to="/shop-owner"
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.625rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.875rem',
                      fontWeight: isActive ? 700 : 500,
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
                  <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--color-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '1rem 0.75rem 0.25rem' }}>
                    Giao Vận
                  </span>
                  <NavLink
                    to="/shipper"
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.625rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.875rem',
                      fontWeight: isActive ? 700 : 500,
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
                  <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--color-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '1rem 0.75rem 0.25rem' }}>
                    Quản Trị Hệ Thống
                  </span>
                  <NavLink
                    to="/admin"
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.625rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.875rem',
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? 'var(--color-primary)' : 'var(--color-text)',
                      backgroundColor: isActive ? 'var(--color-primary-light)' : 'transparent',
                    })}
                  >
                    <ShieldCheck size={18} />
                    <span>Admin Dashboard</span>
                  </NavLink>
                </>
              )}

              <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--color-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '1rem 0.75rem 0.25rem' }}>
                Hệ Thống
              </span>
              <NavLink
                to="/dev/api"
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.625rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? 'var(--color-primary)' : 'var(--color-text)',
                  backgroundColor: isActive ? 'var(--color-primary-light)' : 'transparent',
                })}
              >
                <Terminal size={18} />
                <span>Chẩn Đoán API</span>
              </NavLink>
            </nav>
          </aside>
        )}

        {/* Mobile Slide-in Drawer with Backdrop */}
        {isMobile && (
          <>
            <div
              onClick={() => setSidebarOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(15, 23, 42, 0.5)',
                backdropFilter: 'blur(4px)',
                zIndex: 190,
                opacity: sidebarOpen ? 1 : 0,
                pointerEvents: sidebarOpen ? 'auto' : 'none',
                transition: 'opacity var(--dur-modal) var(--ease-out)',
              }}
            />
            <aside
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                bottom: 0,
                width: '280px',
                maxWidth: '80%',
                backgroundColor: 'var(--color-surface)',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 200,
                padding: '1.25rem 1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                overflowY: 'auto',
                transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
                transition: 'transform var(--dur-drawer) var(--ease-drawer)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--color-border)', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'linear-gradient(135deg, var(--color-primary), #ff7824)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                    }}
                  >
                    Z
                  </div>
                  <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>Zola Navigation</span>
                </div>
                <button onClick={() => setSidebarOpen(false)} style={{ padding: '0.25rem' }}>
                  <X size={20} />
                </button>
              </div>

              <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
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
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.875rem',
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? 'var(--color-primary)' : 'var(--color-text)',
                      backgroundColor: isActive ? 'var(--color-primary-light)' : 'transparent',
                    })}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                    {item.badge != null && (
                      <Badge variant={item.badge === 'HOT' ? 'danger' : 'primary'}>{item.badge}</Badge>
                    )}
                  </NavLink>
                ))}

                {(role === 'ShopOwner' || role === 'Admin') && (
                  <NavLink
                    to="/shop-owner"
                    onClick={() => setSidebarOpen(false)}
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.625rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.875rem',
                      color: isActive ? 'var(--color-primary)' : 'var(--color-text)',
                    })}
                  >
                    <Store size={18} />
                    <span>Kênh Chủ Shop</span>
                  </NavLink>
                )}

                {(role === 'Shipper' || role === 'Admin') && (
                  <NavLink
                    to="/shipper"
                    onClick={() => setSidebarOpen(false)}
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.625rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.875rem',
                      color: isActive ? 'var(--color-primary)' : 'var(--color-text)',
                    })}
                  >
                    <Truck size={18} />
                    <span>Bảng Tin Shipper</span>
                  </NavLink>
                )}

                {role === 'Admin' && (
                  <NavLink
                    to="/admin"
                    onClick={() => setSidebarOpen(false)}
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.625rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.875rem',
                      color: isActive ? 'var(--color-primary)' : 'var(--color-text)',
                    })}
                  >
                    <ShieldCheck size={18} />
                    <span>Admin Dashboard</span>
                  </NavLink>
                )}

                <NavLink
                  to="/dev/api"
                  onClick={() => setSidebarOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.625rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.875rem',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  <Terminal size={18} />
                  <span>Chẩn Đoán API</span>
                </NavLink>

                {isAuthenticated && (
                  <button
                    onClick={() => {
                      logout();
                      setSidebarOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.625rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.875rem',
                      color: 'var(--color-danger)',
                      marginTop: '0.5rem',
                      textAlign: 'left',
                    }}
                  >
                    <LogOut size={18} />
                    <span>Đăng xuất</span>
                  </button>
                )}
              </nav>
            </aside>
          </>
        )}

        {/* Content Outlet */}
        <main
          style={{
            flex: 1,
            padding: isMobile ? '1rem 0.85rem calc(var(--bottom-nav-height) + 1.25rem)' : '1.5rem',
            maxWidth: '1200px',
            width: '100%',
            margin: '0 auto',
            minHeight: 'calc(100vh - var(--header-height))',
          }}
        >
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Fixed Native-Feel) */}
      {isMobile && (
        <nav
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: 'var(--bottom-nav-height)',
            backgroundColor: 'rgba(255, 255, 255, 0.96)',
            backdropFilter: 'blur(16px)',
            borderTop: '1px solid var(--color-border)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            padding: '0 0.5rem',
            boxShadow: '0 -4px 16px rgba(15, 23, 42, 0.05)',
          }}
        >
          {mobileBottomTabs.map((tab) => {
            const isActive = location.pathname.startsWith(tab.to);
            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '2px',
                  color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  fontSize: '0.6875rem',
                  fontWeight: isActive ? 800 : 500,
                  textDecoration: 'none',
                  padding: '6px 12px',
                  transition: 'color var(--dur-feedback) var(--ease-out), transform var(--dur-feedback) var(--ease-out)',
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </NavLink>
            );
          })}
        </nav>
      )}
    </div>
  );
};
