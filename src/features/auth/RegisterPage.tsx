import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ShieldCheck, UserPlus } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/api/services';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';

export const RegisterPage: React.FC = () => {
  const { register, isRegistering, registerError } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');

  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSuccessMsg, setOtpSuccessMsg] = useState<string | null>(null);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  const handleSendOtp = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setOtpError('Vui lòng nhập địa chỉ Gmail hợp lệ trước khi gửi mã OTP.');
      return;
    }

    setSendingOtp(true);
    setOtpError(null);
    setOtpSuccessMsg(null);
    try {
      const res = await authService.sendOtp({
        email: cleanEmail,
        purpose: 'Register',
      });
      setOtpSent(true);
      setResendCooldown(60);
      setDevOtpHint(res?.devOtpHint || null);
      setOtpSuccessMsg(`Mã OTP 6 chữ số đã được gửi tới ${cleanEmail}.`);
    } catch (err: any) {
      setOtpError(err?.message || 'Không thể gửi mã OTP. Vui lòng thử lại.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError(null);

    if (!username.trim() || !email.trim() || !displayName.trim() || !password) {
      return;
    }
    if (!/^\d{6}$/.test(otpCode.trim())) {
      setOtpError('Vui lòng nhập đủ 6 chữ số mã OTP xác thực Gmail.');
      return;
    }

    try {
      await register({
        username: username.trim(),
        email: email.trim(),
        displayName: displayName.trim(),
        password,
        otpCode: otpCode.trim(),
      });
    } catch {
      // Handled by hook error state
    }
  };

  const displayError = otpError || registerError?.message;

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
      <Card style={{ width: '100%', maxWidth: '460px', padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
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
            Xác thực Gmail bằng OTP để tham gia cộng đồng MySocialApp
          </p>
        </div>

        {displayError && (
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
            {displayError}
          </div>
        )}

        {otpSuccessMsg && (
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              color: 'var(--color-success)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8125rem',
              marginBottom: '1rem',
            }}
          >
            {otpSuccessMsg}
          </div>
        )}

        {devOtpHint && (
          <div
            style={{
              padding: '0.65rem 0.85rem',
              backgroundColor: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              color: '#b45309',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8125rem',
              marginBottom: '1rem',
            }}
          >
            <strong>Chế độ thử nghiệm (SMTP chưa cấu hình):</strong> Mã OTP là{' '}
            <code style={{ fontWeight: 700, fontSize: '0.9rem' }}>{devOtpHint}</code>
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label
              htmlFor="register-email"
              style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text)' }}
            >
              Email (Gmail)
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'stretch' }}>
              <div style={{ flex: 1 }}>
                <Input
                  id="register-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (otpSent) {
                      setOtpSent(false);
                      setOtpSuccessMsg(null);
                    }
                  }}
                  placeholder="name@gmail.com"
                  required
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleSendOtp}
                isLoading={sendingOtp}
                disabled={resendCooldown > 0 || sendingOtp}
                style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                <Mail size={15} />
                {resendCooldown > 0 ? `Gửi lại (${resendCooldown}s)` : otpSent ? 'Gửi lại OTP' : 'Gửi mã OTP'}
              </Button>
            </div>
          </div>

          <Input
            label="Mã xác thực OTP (6 chữ số)"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="Nhập 6 chữ số nhận được qua Gmail"
            inputMode="numeric"
            maxLength={6}
            helperText="Nhấn 'Gửi mã OTP' để nhận mã xác thực qua email"
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
            {otpSent ? <ShieldCheck size={18} /> : <UserPlus size={18} />}
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
