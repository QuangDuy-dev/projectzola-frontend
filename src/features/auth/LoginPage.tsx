import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';

export const LoginPage: React.FC = () => {
  const { login, isLoggingIn, loginError } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    try {
      await login({ username, password });
    } catch {
      // Handled by hook error state
    }
  };

  const handleQuickLogin = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        backgroundColor: 'var(--color-background)',
      }}
    >
      <Card style={{ width: '100%', maxWidth: '440px', padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--color-primary)',
              color: '#ffffff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '1.5rem',
              marginBottom: '0.75rem',
            }}
          >
            Z
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Đăng nhập MySocialApp</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Nền tảng mạng xã hội và thương mại điện tử
          </p>
        </div>

        {loginError && (
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--color-danger-bg)',
              color: 'var(--color-danger)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
              marginBottom: '1.25rem',
            }}
          >
            {loginError.message}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input
            label="Tên đăng nhập"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Nhập tên đăng nhập"
            required
          />

          <Input
            label="Mật khẩu"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Nhập mật khẩu"
            required
          />

          <Button type="submit" variant="primary" size="lg" isLoading={isLoggingIn} style={{ marginTop: '0.5rem' }}>
            <Lock size={18} />
            Đăng nhập
          </Button>
        </form>

        {/* Demo Quick Account Picker */}
        <div style={{ marginTop: '2rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
            Tài Khoản Dùng Thử (Demo Seed)
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.5rem' }}>
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => handleQuickLogin('user1', 'User@123')}
            >
              <User size={14} /> user1 (Khách)
            </Button>
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => handleQuickLogin('shopowner1', 'Shop@123')}
            >
              <User size={14} /> shopowner1 (Shop)
            </Button>
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => handleQuickLogin('shipper1', 'Shipper@123')}
            >
              <User size={14} /> shipper1 (Shipper)
            </Button>
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => handleQuickLogin('admin', 'Admin@123')}
            >
              <User size={14} /> admin (Quản trị)
            </Button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
          Chưa có tài khoản?{' '}
          <Link to="/register" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
            Đăng ký ngay
          </Link>
        </div>
      </Card>
    </div>
  );
};
