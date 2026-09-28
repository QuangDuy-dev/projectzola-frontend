import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  Copy,
  Database,
  Key,
  Radio,
  RefreshCw,
  Server,
  User,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { chatbotService, shoppingService } from '../../services/api/services';
import { chatHubClient } from '../../services/signalr/chatHubClient';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { APP_CONFIG } from '../../app/config';

export const ApiDebugPanel: React.FC = () => {
  const { user, token, isAuthenticated, login, logout } = useAuth();
  const [copiedToken, setCopiedToken] = useState(false);
  const [sampleMediaInput, setSampleMediaInput] = useState('/media/posts/sample.webp');
  const [testApiResult, setTestApiResult] = useState<string | null>(null);

  // Chatbot Ollama health check query
  const {
    data: chatbotHealth,
    isLoading: isCheckingChatbot,
    refetch: refetchChatbotHealth,
    error: chatbotError,
  } = useQuery({
    queryKey: ['chatbot-health'],
    queryFn: () => chatbotService.checkHealth(),
    retry: 1,
  });

  const handleCopyToken = () => {
    if (token) {
      navigator.clipboard.writeText(token);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  const handleQuickLogin = async (username: string, role: string) => {
    try {
      await login({ username, password: `${role}@123` });
    } catch (err) {
      console.error('Quick login failed:', err);
    }
  };

  const handleTestCategoriesApi = async () => {
    try {
      const cats = await shoppingService.getCategories();
      setTestApiResult(`Thành công! Đã lấy ${cats.length} danh mục: ${cats.map((c) => c.name).join(', ')}`);
    } catch (err: any) {
      setTestApiResult(`Lỗi: ${err?.message || 'Không thể kết nối API'}`);
    }
  };

  // Decode JWT payload for diagnostic preview
  const getJwtPayload = () => {
    if (!token) return null;
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        return JSON.parse(atob(parts[1]));
      }
    } catch {
      return { error: 'Invalid JWT' };
    }
    return null;
  };

  const jwtPayload = getJwtPayload();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Server size={24} color="var(--color-primary)" />
          Bảng Điều Khiển Kiểm Thử Backend (API Diagnostic Panel)
        </h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          Kiểm tra trạng thái kết nối trực tiếp đến backend ASP.NET Core Web API, SignalR Hub, Ollama AI và Media Storage.
        </p>
      </div>

      {/* Grid of System Status Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        {/* API Server Card */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
              <Database size={18} color="var(--color-primary)" />
              <span>ASP.NET Core API</span>
            </div>
            <Badge variant="success">Active</Badge>
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            Base URL: <code style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{APP_CONFIG.apiBaseUrl}</code>
          </div>
          <div style={{ marginTop: '1rem' }}>
            <Button size="sm" variant="outline" onClick={handleTestCategoriesApi}>
              <RefreshCw size={14} />
              <span>Thử gọi /api/categories</span>
            </Button>
            {testApiResult && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', padding: '0.5rem', backgroundColor: 'var(--color-surface-hover)', borderRadius: 'var(--radius-sm)' }}>
                {testApiResult}
              </div>
            )}
          </div>
        </Card>

        {/* SignalR ChatHub Card */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
              <Radio size={18} color="var(--color-accent)" />
              <span>SignalR ChatHub</span>
            </div>
            {chatHubClient.isConnected() ? (
              <Badge variant="success">Connected</Badge>
            ) : (
              <Badge variant="warning">Disconnected</Badge>
            )}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            Endpoint: <code>/hubs/chat</code>
          </div>
          <div style={{ fontSize: '0.8125rem', marginTop: '0.5rem', color: 'var(--color-text-muted)' }}>
            Hỗ trợ tin nhắn realtime, sự kiện gõ phím, thông báo đơn hàng & thông báo xã hội.
          </div>
        </Card>

        {/* Ollama Local AI Chatbot Card */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
              <Activity size={18} color="var(--color-info)" />
              <span>Ollama AI (qwen3.5:4b)</span>
            </div>
            {isCheckingChatbot ? (
              <Badge variant="default">Checking...</Badge>
            ) : chatbotHealth?.available ? (
              <Badge variant="success">Healthy</Badge>
            ) : (
              <Badge variant="danger">Unavailable</Badge>
            )}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            Dịch vụ: <b>{chatbotHealth?.service || (chatbotError ? 'Offline' : 'Unknown')}</b>
          </div>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
            <Button size="sm" variant="outline" onClick={() => refetchChatbotHealth()}>
              <RefreshCw size={14} />
              <span>Kiểm tra lại</span>
            </Button>
          </div>
        </Card>
      </div>

      {/* Authentication & Current Session Details */}
      <Card>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Key size={18} color="var(--color-primary)" />
          Phiên Đăng Nhập & Phân Quyền Hiện Tại
        </h3>

        {isAuthenticated && user ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  User ID
                </span>
                <p style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>{user.id}</p>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Tên hiển thị & Username
                </span>
                <p style={{ fontWeight: 600 }}>{user.displayName} (@{user.username})</p>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Vai trò (Role)
                </span>
                <div>
                  <Badge variant="primary">{user.role}</Badge>
                </div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  JWT Token (Bearer)
                </span>
                <Button size="sm" variant="ghost" onClick={handleCopyToken}>
                  <Copy size={14} />
                  <span>{copiedToken ? 'Đã sao chép!' : 'Sao chép token'}</span>
                </Button>
              </div>
              <textarea
                readOnly
                rows={2}
                value={token || ''}
                style={{
                  width: '100%',
                  fontSize: '0.75rem',
                  fontFamily: 'monospace',
                  padding: '0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface-hover)',
                  color: 'var(--color-text)',
                  resize: 'none',
                }}
              />
            </div>

            {jwtPayload && (
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Decoded JWT Claims
                </span>
                <pre
                  style={{
                    backgroundColor: 'var(--color-surface-hover)',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.75rem',
                    overflowX: 'auto',
                  }}
                >
                  {JSON.stringify(jwtPayload, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--color-text-muted)' }}>
            <p>Chưa đăng nhập. Vui lòng chọn một tài khoản mẫu bên dưới để kiểm thử ngay lập tức:</p>
          </div>
        )}

        {/* Quick Account Switcher */}
        <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--color-border)' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text)', display: 'block', marginBottom: '0.75rem' }}>
            Chuyển nhanh tài khoản Demo (Seed Users):
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <Button size="sm" variant="outline" onClick={() => handleQuickLogin('user1', 'User')}>
              <User size={14} />
              <span>User: user1 (User@123)</span>
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleQuickLogin('shopowner1', 'Shop')}>
              <User size={14} />
              <span>Shop: shopowner1 (Shop@123)</span>
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleQuickLogin('shipper1', 'Shipper')}>
              <User size={14} />
              <span>Shipper: shipper1 (Shipper@123)</span>
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleQuickLogin('admin', 'Admin')}>
              <User size={14} />
              <span>Admin: admin (Admin@123)</span>
            </Button>
            {isAuthenticated && (
              <Button size="sm" variant="danger" onClick={logout}>
                Đăng xuất
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Media URL Resolver Tester */}
      <Card>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.75rem' }}>
          Kiểm Tra Bộ Phân Giải Đường Dẫn Media (Safe Media URL Resolver)
        </h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
          Đảm bảo không bao giờ rò rỉ đường dẫn Windows cục bộ (`D:\Projectzola\...`) và chuẩn hóa mọi đường dẫn tương đối thành URL HTTP hoàn chỉnh.
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input
            type="text"
            value={sampleMediaInput}
            onChange={(e) => setSampleMediaInput(e.target.value)}
            style={{
              flex: 1,
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text)',
              fontSize: '0.875rem',
            }}
          />
        </div>
        <div style={{ marginTop: '0.75rem', fontSize: '0.875rem' }}>
          Kết quả phân giải:{' '}
          <code style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
            {resolveMediaUrl(sampleMediaInput)}
          </code>
        </div>
      </Card>
    </div>
  );
};
