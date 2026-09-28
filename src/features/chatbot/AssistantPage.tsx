import React, { useEffect, useRef, useState } from 'react';
import { Bot, RefreshCw, Send, Sparkles, User, Zap } from 'lucide-react';
import { streamChatbotPost } from '../../services/sse/sseParser';
import { chatbotService } from '../../services/api/services';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

interface UiMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
  statusText?: string;
  metrics?: {
    category?: string;
    durationMs?: number;
    timeToFirstTokenMs?: number;
    totalTokens?: number;
  };
}

export const AssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<UiMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Xin chào! Tôi là trợ lý AI thông minh của MySocialApp. Tôi có thể hỗ trợ bạn tìm kiếm sản phẩm, giải đáp quy trình mua hàng, đăng bài viết, hoặc quy trình giao vận cho Shipper và Chủ Shop. Hãy hỏi tôi bất cứ điều gì!',
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isGenerating) return;

    const userText = inputMessage.trim();
    setInputMessage('');

    const userMsgId = `user-${Date.now()}`;
    const assistantMsgId = `assistant-${Date.now()}`;

    // Append user message and blank assistant message with thinking status
    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: 'user', content: userText },
      {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        isStreaming: true,
        statusText: 'Đang suy nghĩ câu trả lời...',
      },
    ]);

    setIsGenerating(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      await streamChatbotPost(
        userText,
        {
          onStatus: (state) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId ? { ...m, statusText: state === 'thinking' ? 'Đang soạn phản hồi...' : state } : m
              )
            );
          },
          onToken: (token) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId ? { ...m, content: m.content + token, statusText: undefined } : m
              )
            );
          },
          onDone: (metrics) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId ? { ...m, isStreaming: false, metrics } : m
              )
            );
          },
          onError: (err) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId ? { ...m, content: m.content ? m.content + `\n\n[Lỗi: ${err}]` : err, isStreaming: false } : m
              )
            );
          },
        },
        controller.signal
      );
    } catch {
      // Error handled in callback
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleClearSession = async () => {
    if (window.confirm('Bạn có muốn xóa lịch sử ngữ cảnh hội thoại hiện tại?')) {
      try {
        await chatbotService.clearSession();
        setMessages([
          {
            id: 'welcome-reset',
            role: 'assistant',
            content: 'Đã làm mới phiên trò chuyện. Tôi có thể giúp gì tiếp cho bạn?',
          },
        ]);
      } catch (err: any) {
        alert('Lỗi làm mới: ' + err.message);
      }
    }
  };

  const sampleQuestions = [
    'Làm sao tìm sản phẩm và thêm vào giỏ hàng?',
    'Quy trình giao hàng của Shipper thế nào?',
    'Làm sao để hủy đơn hàng đã đặt?',
    'Shop đăng bán sản phẩm cần những gì?',
  ];

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: 'calc(100vh - var(--header-height) - 3rem)' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--color-surface)',
          padding: '1rem 1.25rem',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--color-border)',
          marginBottom: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Bot size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Trợ lý AI MySocialApp
              <span style={{ fontSize: '0.6875rem', padding: '0.125rem 0.375rem', borderRadius: '4px', backgroundColor: '#e0f2fe', color: '#0369a1', fontWeight: 600 }}>
                Ollama • qwen3.5:4b
              </span>
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              Phản hồi siêu nhanh (TTFT ~250ms) • Trực tiếp từ ASP.NET Core SSE Stream
            </span>
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={handleClearSession} title="Làm mới hội thoại">
          <RefreshCw size={14} /> Làm mới phiên
        </Button>
      </div>

      {/* Messages Feed */}
      <Card
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          backgroundColor: 'var(--color-background)',
        }}
      >
        {messages.map((msg) => {
          const isAssistant = msg.role === 'assistant';

          return (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'flex-start',
                flexDirection: isAssistant ? 'row' : 'row-reverse',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: isAssistant ? 'var(--color-primary-light)' : 'var(--color-primary)',
                  color: isAssistant ? 'var(--color-primary)' : '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                {isAssistant ? <Bot size={18} /> : <User size={18} />}
              </div>

              <div style={{ maxWidth: '80%', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <div
                  style={{
                    padding: '0.875rem 1.125rem',
                    borderRadius: isAssistant
                      ? 'var(--radius-xl) var(--radius-xl) var(--radius-xl) 4px'
                      : 'var(--radius-xl) var(--radius-xl) 4px var(--radius-xl)',
                    backgroundColor: isAssistant ? 'var(--color-surface)' : 'var(--color-primary)',
                    color: isAssistant ? 'var(--color-text)' : '#ffffff',
                    boxShadow: 'var(--shadow-sm)',
                    border: isAssistant ? '1px solid var(--color-border)' : 'none',
                    fontSize: '0.9375rem',
                    whiteSpace: 'pre-line',
                    wordBreak: 'break-word',
                  }}
                >
                  {msg.statusText && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)', fontSize: '0.875rem' }}>
                      <Sparkles size={16} className="animate-spin" />
                      <span>{msg.statusText}</span>
                    </div>
                  )}
                  {msg.content}
                </div>

                {/* Metrics footer when done */}
                {msg.metrics && (
                  <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', display: 'flex', gap: '0.75rem', padding: '0 0.5rem' }}>
                    {msg.metrics.category && <span>Phân loại: <strong>{msg.metrics.category}</strong></span>}
                    {msg.metrics.timeToFirstTokenMs != null && (
                      <span style={{ color: 'var(--color-success)', display: 'inline-flex', alignItems: 'center', gap: '0.125rem' }}>
                        <Zap size={10} /> TTFT: {msg.metrics.timeToFirstTokenMs}ms
                      </span>
                    )}
                    {msg.metrics.durationMs != null && <span>Tổng: {msg.metrics.durationMs}ms</span>}
                    {msg.metrics.totalTokens != null && <span>{msg.metrics.totalTokens} tokens</span>}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </Card>

      {/* Suggested Quick Prompts */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', padding: '0.5rem 0' }}>
        {sampleQuestions.map((q, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setInputMessage(q)}
            style={{
              padding: '0.375rem 0.75rem',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-muted)',
              fontSize: '0.75rem',
              whiteSpace: 'nowrap',
            }}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Composer */}
      <form
        onSubmit={handleSendMessage}
        style={{
          display: 'flex',
          gap: '0.5rem',
          backgroundColor: 'var(--color-surface)',
          padding: '0.75rem',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--color-border)',
        }}
      >
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Nhập câu hỏi bằng tiếng Việt (Ví dụ: Làm sao đặt hàng?)..."
          disabled={isGenerating}
          style={{
            flex: 1,
            padding: '0.5rem 1rem',
            border: 'none',
            outline: 'none',
            fontSize: '0.9375rem',
            backgroundColor: 'transparent',
          }}
        />
        <Button
          type="submit"
          variant="primary"
          disabled={!inputMessage.trim() || isGenerating}
          style={{ borderRadius: 'var(--radius-full)', width: '40px', height: '40px', padding: 0 }}
        >
          <Send size={18} />
        </Button>
      </form>
    </div>
  );
};
