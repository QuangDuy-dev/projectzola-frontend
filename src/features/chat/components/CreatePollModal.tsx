import { useState } from 'react';
import { Plus, Trash2, AlertCircle, BarChart2 } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import type { CreatePollRequest } from '../../../types';

interface CreatePollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePollRequest) => Promise<void>;
}

export const CreatePollModal: React.FC<CreatePollModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [allowMultipleChoices, setAllowMultipleChoices] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [durationPreset, setDurationPreset] = useState<'none' | '1d' | '3d' | '7d'>('none');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setQuestion('');
    setOptions(['', '']);
    setAllowMultipleChoices(false);
    setIsAnonymous(false);
    setDurationPreset('none');
    setError(null);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleAddOption = () => {
    if (options.length >= 10) return;
    setOptions((prev) => [...prev, '']);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleOptionChange = (index: number, value: string) => {
    setOptions((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) {
      setError('Vui lòng nhập câu hỏi bình chọn.');
      return;
    }
    if (trimmedQuestion.length > 300) {
      setError('Câu hỏi không được vượt quá 300 ký tự.');
      return;
    }

    const validOptions = options.map((o) => o.trim()).filter(Boolean);
    if (validOptions.length < 2) {
      setError('Bình chọn phải có ít nhất 2 phương án lựa chọn.');
      return;
    }
    if (validOptions.some((o) => o.length > 200)) {
      setError('Mỗi phương án không được vượt quá 200 ký tự.');
      return;
    }

    let expiresAt: string | undefined = undefined;
    if (durationPreset !== 'none') {
      const now = new Date();
      if (durationPreset === '1d') now.setDate(now.getDate() + 1);
      else if (durationPreset === '3d') now.setDate(now.getDate() + 3);
      else if (durationPreset === '7d') now.setDate(now.getDate() + 7);
      expiresAt = now.toISOString();
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        question: trimmedQuestion,
        options: validOptions,
        allowMultipleChoices,
        isAnonymous,
        expiresAt,
      });
      handleClose();
    } catch (err: any) {
      console.error('Create poll error:', err);
      setError(err?.response?.data?.message || err.message || 'Không thể tạo bình chọn.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Tạo cuộc bình chọn">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.625rem 0.75rem',
              backgroundColor: 'var(--color-error-light, #fee2e2)',
              color: 'var(--color-error, #dc2626)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8125rem',
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Question Input */}
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.375rem' }}>
            Câu hỏi bình chọn <span style={{ color: 'var(--color-error)' }}>*</span>
          </label>
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ví dụ: Cuối tuần này cả nhóm đi đâu?"
            maxLength={300}
            required
            autoFocus
          />
          <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            {question.length}/300
          </div>
        </div>

        {/* Options List */}
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            Các phương án ({options.length}/10) <span style={{ color: 'var(--color-error)' }}>*</span>
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {options.map((opt, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span
                  style={{
                    width: '24px',
                    fontSize: '0.8125rem',
                    color: 'var(--color-text-muted)',
                    textAlign: 'center',
                    fontWeight: 600,
                  }}
                >
                  {idx + 1}.
                </span>
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => handleOptionChange(idx, e.target.value)}
                  placeholder={`Phương án ${idx + 1}`}
                  maxLength={200}
                  required
                  style={{
                    flex: 1,
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    outline: 'none',
                    fontSize: '0.875rem',
                    backgroundColor: 'var(--color-background)',
                    color: 'var(--color-text)',
                  }}
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(idx)}
                    title="Xóa phương án"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-text-muted)',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-error)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {options.length < 10 && (
            <button
              type="button"
              onClick={handleAddOption}
              style={{
                marginTop: '0.5rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                background: 'none',
                border: 'none',
                color: 'var(--color-primary)',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '4px 0',
              }}
            >
              <Plus size={16} />
              <span>Thêm phương án</span>
            </button>
          )}
        </div>

        {/* Poll Settings */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.625rem',
            padding: '0.75rem',
            backgroundColor: 'var(--color-surface-hover)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer', fontSize: '0.875rem' }}>
            <input
              type="checkbox"
              checked={allowMultipleChoices}
              onChange={(e) => setAllowMultipleChoices(e.target.checked)}
              style={{ accentColor: 'var(--color-primary)' }}
            />
            <span>Cho phép chọn nhiều phương án</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer', fontSize: '0.875rem' }}>
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              style={{ accentColor: 'var(--color-primary)' }}
            />
            <span>Bình chọn ẩn danh (không hiện tên người chọn)</span>
          </label>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Thời hạn:</span>
            <select
              value={durationPreset}
              onChange={(e) => setDurationPreset(e.target.value as any)}
              style={{
                padding: '0.25rem 0.5rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text)',
                fontSize: '0.8125rem',
              }}
            >
              <option value="none">Không thời hạn</option>
              <option value="1d">1 ngày</option>
              <option value="3d">3 ngày</option>
              <option value="7d">7 ngày</option>
            </select>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
          <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={isSubmitting}>
            <BarChart2 size={16} />
            <span>Tạo bình chọn</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
};
