import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';

export const RegisterPage: React.FC = () => {
  const { register, isRegistering, registerError } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email || !displayName || !password) return;
    try {
      await register({ username, email, displayName, password });
    } catch {
      // Handled by hook error state
    }
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
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Tạo tài khoản mới</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Tham gia cộng đồng MySocialApp
          </p>
        </div>

        {registerError && (
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
            {registerError.message}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input
            label="Tên đăng nhập"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Từ 3-50 ký tự"
            required
          />

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            required
          />

          <Input
            label="Tên hiển thị"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Họ và tên của bạn"
            required
          />

          <Input
            label="Mật khẩu"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Ít nhất 6 ký tự"
            required
          />

          <Button type="submit" variant="primary" size="lg" isLoading={isRegistering} style={{ marginTop: '0.5rem' }}>
            <UserPlus size={18} />
            Đăng ký tài khoản
          </Button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
          Đã có tài khoản?{' '}
          <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
            Đăng nhập
          </Link>
        </div>
      </Card>
    </div>
  );
};
