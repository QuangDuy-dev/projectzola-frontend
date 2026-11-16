import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, KeyRound, Lock, Mail } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/api/services';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';

export const LoginPage: React.FC = () => {
  const { login, isLoggingIn, loginError } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Forgot Password Modal State
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  const openForgotModal = () => {
    setIsForgotOpen(true);
    setForgotStep(1);
    setForgotEmail('');
    setForgotOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setForgotError(null);
    setDevOtpHint(null);
    setResendCooldown(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    try {
      await login({ username, password });
    } catch {
      // Handled by hook error state
    }
  };

  const handleSendForgotOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanEmail = forgotEmail.trim();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setForgotError('Vui lòng nhập địa chỉ Gmail hợp lệ.');
      return;
    }

    setForgotLoading(true);
    setForgotError(null);
    try {
      const res = await authService.sendOtp({
        email: cleanEmail,
        purpose: 'ForgotPassword',
      });
      setDevOtpHint(res?.devOtpHint || null);
      setResendCooldown(60);
      setForgotStep(2);
    } catch (err: any) {
      setForgotError(err?.message || 'Không thể gửi mã OTP. Vui lòng kiểm tra lại email.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOtp = forgotOtp.trim();
    if (!/^\d{6}$/.test(cleanOtp)) {
      setForgotError('Mã OTP phải gồm đúng 6 chữ số.');
      return;
    }
    if (newPassword.length < 6) {
      setForgotError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setForgotError('Xác nhận mật khẩu mới không khớp.');
      return;
    }

    setForgotLoading(true);
    setForgotError(null);
    try {
      await authService.forgotPasswordReset({
        email: forgotEmail.trim(),
        otpCode: cleanOtp,
        newPassword,
      });
      setForgotStep(3);
    } catch (err: any) {
      setForgotError(err?.message || 'Không thể đặt lại mật khẩu. Vui lòng kiểm tra lại mã OTP.');
    } finally {
      setForgotLoading(false);
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

          <div>
            <Input
              label="Mật khẩu"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu"
              required
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.45rem' }}>
              <button
                type="button"
                onClick={openForgotModal}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  color: 'var(--color-primary)',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Quên mật khẩu?
              </button>
            </div>
          </div>

          <Button type="submit" variant="primary" size="lg" isLoading={isLoggingIn} style={{ marginTop: '0.25rem' }}>
            <Lock size={18} />
            Đăng nhập
          </Button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
          Chưa có tài khoản?{' '}
          <Link to="/register" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
            Đăng ký ngay
          </Link>
        </div>
      </Card>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={isForgotOpen}
        onClose={() => setIsForgotOpen(false)}
        title="Khôi phục mật khẩu"
        maxWidth="440px"
      >
        {forgotError && (
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--color-danger-bg)',
              color: 'var(--color-danger)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8125rem',
              marginBottom: '1rem',
            }}
          >
            {forgotError}
          </div>
        )}

        {forgotStep === 1 && (
          <form onSubmit={handleSendForgotOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
              Nhập địa chỉ Gmail đã đăng ký tài khoản. Chúng tôi sẽ gửi mã xác thực OTP gồm 6 chữ số đến hộp thư của bạn.
            </p>
            <Input
              label="Địa chỉ Gmail"
              type="email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              placeholder="example@gmail.com"
              required
              autoFocus
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.25rem' }}>
              <Button type="button" variant="outline" onClick={() => setIsForgotOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" variant="primary" isLoading={forgotLoading}>
                <Mail size={16} />
                Gửi mã OTP
              </Button>
            </div>
          </form>
        )}

        {forgotStep === 2 && (
          <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div
              style={{
                fontSize: '0.8125rem',
                color: 'var(--color-text-muted)',
                backgroundColor: 'var(--color-surface-hover)',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
              }}
            >
              Mã OTP đã được gửi đến <strong style={{ color: 'var(--color-text)' }}>{forgotEmail}</strong>.
            </div>

            {devOtpHint && (
              <div
                style={{
                  fontSize: '0.8125rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  color: '#b45309',
                }}
              >
                <strong>Lưu ý thử nghiệm (SMTP chưa cấu hình):</strong> Mã OTP của bạn là{' '}
                <code style={{ fontWeight: 700, fontSize: '0.9rem' }}>{devOtpHint}</code>
              </div>
            )}

            <div>
              <Input
                label="Mã xác thực OTP (6 chữ số)"
                value={forgotOtp}
                onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Nhập 6 chữ số OTP"
                inputMode="numeric"
                maxLength={6}
                required
                autoFocus
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.4rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setForgotStep(1);
                    setForgotError(null);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: 'var(--color-text-muted)',
                    fontSize: '0.75rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    cursor: 'pointer',
                  }}
                >
                  <ArrowLeft size={13} /> Đổi Gmail khác
                </button>
                <button
                  type="button"
                  disabled={resendCooldown > 0 || forgotLoading}
                  onClick={() => handleSendForgotOtp()}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: resendCooldown > 0 ? 'var(--color-text-subtle)' : 'var(--color-primary)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                  }}
                >
                  {resendCooldown > 0 ? `Gửi lại sau ${resendCooldown}s` : 'Gửi lại mã OTP'}
                </button>
              </div>
            </div>

            <Input
              label="Mật khẩu mới"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Ít nhất 6 ký tự"
              required
            />

            <Input
              label="Xác nhận mật khẩu mới"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu mới"
              required
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.25rem' }}>
              <Button type="button" variant="outline" onClick={() => setIsForgotOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" variant="primary" isLoading={forgotLoading}>
                <KeyRound size={16} />
                Đặt lại mật khẩu
              </Button>
            </div>
          </form>
        )}

        {forgotStep === 3 && (
          <div style={{ textAlign: 'center', padding: '1rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.85rem' }}>
            <CheckCircle2 size={44} color="var(--color-success)" />
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Đặt lại mật khẩu thành công!</h4>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
              Bạn có thể sử dụng mật khẩu mới để đăng nhập ngay bây giờ.
            </p>
            <Button variant="primary" onClick={() => setIsForgotOpen(false)} style={{ marginTop: '0.5rem' }}>
              Quay lại đăng nhập
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};
