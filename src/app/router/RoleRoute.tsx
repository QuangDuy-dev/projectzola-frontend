import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import type { UserRole } from '../../types';

export const RoleRoute: React.FC<{ allowedRoles: UserRole[] }> = ({ allowedRoles }) => {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return (
      <div
        style={{
          padding: '3rem 1rem',
          textAlign: 'center',
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          margin: '2rem auto',
          maxWidth: '500px',
        }}
      >
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-danger)' }}>
          Quyền truy cập bị từ chối (403 Forbidden)
        </h3>
        <p style={{ marginTop: '0.5rem', color: 'var(--color-text-muted)' }}>
          Tài khoản của bạn ({user?.role || 'Khách'}) không có quyền truy cập vào khu vực này.
        </p>
      </div>
    );
  }

  return <Outlet />;
};
