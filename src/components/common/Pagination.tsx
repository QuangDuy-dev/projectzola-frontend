import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/Button';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  disabled = false,
}) => {
  if (totalPages <= 1) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem 0' }}>
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage <= 1 || disabled}
        onClick={() => onPageChange(currentPage - 1)}
      >
        <ChevronLeft size={16} />
        Trước
      </Button>

      <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', padding: '0 0.5rem' }}>
        Trang {currentPage} / {totalPages}
      </span>

      <Button
        variant="outline"
        size="sm"
        disabled={currentPage >= totalPages || disabled}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Sau
        <ChevronRight size={16} />
      </Button>
    </div>
  );
};
