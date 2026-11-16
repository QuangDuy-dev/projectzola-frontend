import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileText,
  Film,
  Heart,
  LayoutGrid,
  MessageCircle,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Store,
  Users,
} from 'lucide-react';
import { searchService } from '../../services/api/services';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { UserAvatar } from '../../components/common/UserAvatar';
import { SafeImage } from '../../components/common/SafeImage';
import { SafeVideo } from '../../components/common/SafeVideo';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';
import { formatCurrencyVnd, formatRelativeTime } from '../../utils/formatters';
import type {
  PostDto,
  ProductSearchDto,
  SearchDateRange,
  SearchSort,
  SearchType,
  ShopSearchDto,
  UserSearchDto,
} from '../../types';

const CATEGORY_OPTIONS: { value: SearchType; label: string; icon: React.ReactNode }[] = [
  { value: 'all', label: 'Tất cả', icon: <LayoutGrid size={17} /> },
  { value: 'posts', label: 'Bài viết', icon: <FileText size={17} /> },
  { value: 'users', label: 'Mọi người', icon: <Users size={17} /> },
  { value: 'shorts', label: 'Thước phim', icon: <Film size={17} /> },
  { value: 'products', label: 'Sản phẩm', icon: <ShoppingBag size={17} /> },
  { value: 'shops', label: 'Cửa hàng', icon: <Store size={17} /> },
];

const SORT_OPTIONS: { value: SearchSort; label: string }[] = [
  { value: 'relevance', label: 'Liên quan nhất' },
  { value: 'recent', label: 'Mới nhất' },
];

const DATE_OPTIONS: { value: SearchDateRange; label: string }[] = [
  { value: 'all', label: 'Mọi lúc' },
  { value: 'today', label: 'Hôm nay' },
  { value: 'week', label: 'Tuần này' },
  { value: 'month', label: 'Tháng này' },
];

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const q = searchParams.get('q') || '';
  const type = (searchParams.get('type') as SearchType) || 'all';
  const sort = (searchParams.get('sort') as SearchSort) || 'relevance';
  const dateRange = (searchParams.get('dateRange') as SearchDateRange) || 'all';
  const page = Math.max(1, Number(searchParams.get('page') || '1'));
  const pageSize = 10;

  const [localQuery, setLocalQuery] = useState(q);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 860);

  useEffect(() => {
    setLocalQuery(q);
  }, [q]);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 860);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const updateParams = (updates: Record<string, string | number | undefined>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([k, v]) => {
      if (v === undefined || v === '') {
        next.delete(k);
      } else {
        next.set(k, String(v));
      }
    });
    setSearchParams(next);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams({ q: localQuery.trim(), page: 1 });
  };

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['unified-search', q, type, sort, dateRange, page],
    queryFn: () =>
      searchService.unifiedSearch({
        q: q.trim(),
        type,
        sort,
        dateRange,
        page,
        pageSize: type === 'all' ? 5 : pageSize,
      }),
    enabled: q.trim().length > 0,
  });

  const renderUserCard = (u: UserSearchDto) => (
    <div
      key={u.id}
      onClick={() => navigate(`/profile/${u.id}`)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.85rem',
        padding: '0.85rem 1rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-surface)',
        cursor: 'pointer',
        transition: 'border-color var(--dur-feedback) var(--ease-out), box-shadow var(--dur-feedback) var(--ease-out)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-primary)';
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-border)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0 }}>
        <UserAvatar
          avatarUrl={u.avatarUrl}
          displayName={u.displayName || u.username}
          size={48}
          clickable={false}
        />
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text)' }}>
              {u.displayName}
            </span>
            <Badge variant="default">{u.role}</Badge>
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
            @{u.username} • {u.followersCount ?? 0} người theo dõi
          </div>
          {u.bio && (
            <div
              style={{
                fontSize: '0.8125rem',
                color: 'var(--color-text-subtle)',
                marginTop: '0.2rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {u.bio}
            </div>
          )}
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/profile/${u.id}`);
        }}
      >
        Xem trang
      </Button>
    </div>
  );

  const renderProductCard = (p: ProductSearchDto) => (
    <div
      key={p.id}
      onClick={() => navigate(`/products/${p.id}`)}
      style={{
        display: 'flex',
        gap: '0.85rem',
        padding: '0.75rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-surface)',
        cursor: 'pointer',
        transition: 'border-color var(--dur-feedback) var(--ease-out), box-shadow var(--dur-feedback) var(--ease-out)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-primary)';
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-border)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div
        style={{
          width: '80px',
          height: '80px',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          backgroundColor: 'var(--color-surface-hover)',
          flexShrink: 0,
        }}
      >
        <SafeImage src={p.thumbnailUrl} alt={p.name} />
      </div>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {p.name}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
            {p.shop?.name} {p.category?.name ? `• ${p.category.name}` : ''}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.4rem' }}>
          <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--color-primary)' }}>
            {formatCurrencyVnd(p.price)}
          </span>
          <span style={{ fontSize: '0.75rem', color: p.stock > 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
            {p.stock > 0 ? `Còn ${p.stock}` : 'Hết hàng'}
          </span>
        </div>
      </div>
    </div>
  );

  const renderShopCard = (s: ShopSearchDto) => (
    <div
      key={s.id}
      onClick={() => navigate(`/shops/${s.id}`)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.85rem',
        padding: '0.85rem 1rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-surface)',
        cursor: 'pointer',
        transition: 'border-color var(--dur-feedback) var(--ease-out), box-shadow var(--dur-feedback) var(--ease-out)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-primary)';
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-border)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0 }}>
        <div
          style={{
            width: '50px',
            height: '50px',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            backgroundColor: 'var(--color-primary-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {s.logoUrl ? <SafeImage src={s.logoUrl} alt={s.name} /> : <Store size={22} color="var(--color-primary)" />}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text)' }}>{s.name}</div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
            {s.productCount} sản phẩm
          </div>
          {s.description && (
            <div
              style={{
                fontSize: '0.8125rem',
                color: 'var(--color-text-subtle)',
                marginTop: '0.15rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {s.description}
            </div>
          )}
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/shops/${s.id}`);
        }}
      >
        Ghé thăm
      </Button>
    </div>
  );

  const renderPostCard = (post: PostDto, isShort = false) => {
    const firstMedia = post.media?.[0];
    const authorName = post.displayName || post.authorName || post.username;
    const authorAvatar = post.userAvatarUrl || post.authorAvatarUrl;

    return (
      <Card key={post.id} style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
          <div
            onClick={() => navigate(`/profile/${post.userId}`)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer' }}
          >
            <UserAvatar avatarUrl={authorAvatar} displayName={authorName} size={38} clickable={false} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text)' }}>
                {authorName}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                @{post.username} • {formatRelativeTime(post.createdAt)}
              </div>
            </div>
          </div>
          {isShort && <Badge variant="danger">Thước phim</Badge>}
        </div>

        {post.content && (
          <p style={{ fontSize: '0.925rem', color: 'var(--color-text)', lineHeight: 1.55, marginBottom: firstMedia ? '0.75rem' : '0.5rem', whiteSpace: 'pre-wrap' }}>
            {post.content}
          </p>
        )}

        {firstMedia && (
          <div
            style={{
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              maxHeight: '340px',
              backgroundColor: '#000',
              marginBottom: '0.65rem',
            }}
          >
            {firstMedia.mediaType === 'Video' || isShort ? (
              <SafeVideo src={firstMedia.url} style={{ width: '100%', maxHeight: '340px', objectFit: 'contain' }} />
            ) : (
              <SafeImage src={firstMedia.url} alt="Post media" style={{ width: '100%', maxHeight: '340px', objectFit: 'cover' }} />
            )}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)', paddingTop: '0.5rem', borderTop: '1px solid var(--color-border)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <Heart size={15} /> {post.likeCount ?? 0} lượt thích
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <MessageCircle size={15} /> {post.commentCount ?? 0} bình luận
          </span>
        </div>
      </Card>
    );
  };

  const renderPagination = (totalPages: number, currentPage: number, totalCount: number) => {
    if (totalPages <= 1) return null;
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '1rem',
          paddingTop: '1rem',
          borderTop: '1px solid var(--color-border)',
        }}
      >
        <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
          Trang {currentPage} / {totalPages} ({totalCount} kết quả)
        </span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => updateParams({ page: currentPage - 1 })}
          >
            <ChevronLeft size={16} /> Trước
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => updateParams({ page: currentPage + 1 })}
          >
            Sau <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    );
  };

  const renderAllResults = () => {
    if (!data) return null;

    const hasUsers = (data.users?.items?.length ?? 0) > 0;
    const hasProducts = (data.products?.items?.length ?? 0) > 0;
    const hasPosts = (data.posts?.items?.length ?? 0) > 0;
    const hasShorts = (data.shorts?.items?.length ?? 0) > 0;
    const hasShops = (data.shops?.items?.length ?? 0) > 0;

    if (!hasUsers && !hasProducts && !hasPosts && !hasShorts && !hasShops) {
      return (
        <EmptyState
          title="Không tìm thấy kết quả"
          description={`Không có nội dung nào khớp với từ khóa "${q}". Hãy thử từ khóa khác hoặc thay đổi bộ lọc.`}
        />
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {hasUsers && (
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={18} color="var(--color-primary)" /> Mọi người ({data.users.totalCount})
              </h3>
              <Button variant="ghost" size="sm" onClick={() => updateParams({ type: 'users', page: 1 })}>
                Xem tất cả
              </Button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {data.users.items.map(renderUserCard)}
            </div>
          </Card>
        )}

        {hasProducts && (
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShoppingBag size={18} color="var(--color-primary)" /> Sản phẩm ({data.products.totalCount})
              </h3>
              <Button variant="ghost" size="sm" onClick={() => updateParams({ type: 'products', page: 1 })}>
                Xem tất cả
              </Button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0.75rem' }}>
              {data.products.items.map(renderProductCard)}
            </div>
          </Card>
        )}

        {hasShops && (
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Store size={18} color="var(--color-primary)" /> Cửa hàng ({data.shops.totalCount})
              </h3>
              <Button variant="ghost" size="sm" onClick={() => updateParams({ type: 'shops', page: 1 })}>
                Xem tất cả
              </Button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {data.shops.items.map(renderShopCard)}
            </div>
          </Card>
        )}

        {hasPosts && (
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={18} color="var(--color-primary)" /> Bài viết ({data.posts.totalCount})
              </h3>
              <Button variant="ghost" size="sm" onClick={() => updateParams({ type: 'posts', page: 1 })}>
                Xem tất cả
              </Button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {data.posts.items.map((p) => renderPostCard(p, false))}
            </div>
          </Card>
        )}

        {hasShorts && (
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Film size={18} color="var(--color-primary)" /> Thước phim ({data.shorts.totalCount})
              </h3>
              <Button variant="ghost" size="sm" onClick={() => updateParams({ type: 'shorts', page: 1 })}>
                Xem tất cả
              </Button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {data.shorts.items.map((p) => renderPostCard(p, true))}
            </div>
          </Card>
        )}
      </div>
    );
  };

  const renderCategoryResults = () => {
    if (!data) return null;

    if (type === 'users') {
      const res = data.users;
      if (!res?.items?.length) {
        return <EmptyState title="Không có người dùng nào" description={`Không tìm thấy người dùng nào cho "${q}".`} />;
      }
      return (
        <Card>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem' }}>
            Mọi người ({res.totalCount})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {res.items.map(renderUserCard)}
          </div>
          {renderPagination(res.totalPages, res.page, res.totalCount)}
        </Card>
      );
    }

    if (type === 'products') {
      const res = data.products;
      if (!res?.items?.length) {
        return <EmptyState title="Không có sản phẩm nào" description={`Không tìm thấy sản phẩm nào cho "${q}".`} />;
      }
      return (
        <Card>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem' }}>
            Sản phẩm ({res.totalCount})
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0.75rem' }}>
            {res.items.map(renderProductCard)}
          </div>
          {renderPagination(res.totalPages, res.page, res.totalCount)}
        </Card>
      );
    }

    if (type === 'shops') {
      const res = data.shops;
      if (!res?.items?.length) {
        return <EmptyState title="Không có cửa hàng nào" description={`Không tìm thấy cửa hàng nào cho "${q}".`} />;
      }
      return (
        <Card>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem' }}>
            Cửa hàng ({res.totalCount})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {res.items.map(renderShopCard)}
          </div>
          {renderPagination(res.totalPages, res.page, res.totalCount)}
        </Card>
      );
    }

    if (type === 'posts') {
      const res = data.posts;
      if (!res?.items?.length) {
        return <EmptyState title="Không có bài viết nào" description={`Không tìm thấy bài viết nào cho "${q}".`} />;
      }
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
            Bài viết ({res.totalCount})
          </h3>
          {res.items.map((p) => renderPostCard(p, false))}
          {renderPagination(res.totalPages, res.page, res.totalCount)}
        </div>
      );
    }

    if (type === 'shorts') {
      const res = data.shorts;
      if (!res?.items?.length) {
        return <EmptyState title="Không có thước phim nào" description={`Không tìm thấy thước phim nào cho "${q}".`} />;
      }
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
            Thước phim ({res.totalCount})
          </h3>
          {res.items.map((p) => renderPostCard(p, true))}
          {renderPagination(res.totalPages, res.page, res.totalCount)}
        </div>
      );
    }

    return null;
  };

  return (
    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1.5rem', alignItems: 'flex-start' }}>
      {/* Left Sidebar: Kết quả tìm kiếm & Bộ lọc */}
      <aside
        style={{
          width: isMobile ? '100%' : '280px',
          flexShrink: 0,
          position: isMobile ? 'static' : 'sticky',
          top: 'calc(var(--header-height) + 1.25rem)',
        }}
      >
        <Card style={{ padding: '1rem' }}>
          <div style={{ paddingBottom: '0.75rem', borderBottom: '1px solid var(--color-border)', marginBottom: '0.75rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-text)' }}>
              Kết quả tìm kiếm
            </h2>
            {q && (
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '0.2rem', wordBreak: 'break-word' }}>
                Từ khóa: <strong>"{q}"</strong>
              </p>
            )}
          </div>

          {/* Category Filters */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <SlidersHorizontal size={13} /> Bộ lọc
            </div>
            <div
              style={{
                display: isMobile ? 'flex' : 'flex',
                flexDirection: isMobile ? 'row' : 'column',
                flexWrap: isMobile ? 'wrap' : 'nowrap',
                gap: '0.25rem',
              }}
            >
              {CATEGORY_OPTIONS.map((opt) => {
                const isActive = type === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => updateParams({ type: opt.value, page: 1 })}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      padding: '0.55rem 0.75rem',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.875rem',
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? 'var(--color-primary)' : 'var(--color-text)',
                      backgroundColor: isActive ? 'var(--color-primary-light)' : 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    {opt.icon}
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sort & Date Filters */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '0.3rem' }}>
                Sắp xếp
              </label>
              <select
                value={sort}
                onChange={(e) => updateParams({ sort: e.target.value, page: 1 })}
                style={{
                  width: '100%',
                  padding: '0.45rem 0.65rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border-strong)',
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text)',
                  fontSize: '0.85rem',
                }}
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '0.3rem' }}>
                <Calendar size={13} /> Ngày đăng
              </label>
              <select
                value={dateRange}
                onChange={(e) => updateParams({ dateRange: e.target.value, page: 1 })}
                style={{
                  width: '100%',
                  padding: '0.45rem 0.65rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border-strong)',
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text)',
                  fontSize: '0.85rem',
                }}
              >
                {DATE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>
      </aside>

      {/* Right Main Area */}
      <div style={{ flex: 1, minWidth: 0, width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Inline Search Form (great for mobile & quick refinement) */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
          <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={16} color="var(--color-text-muted)" style={{ position: 'absolute', left: '0.85rem' }} />
            <input
              type="text"
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              placeholder="Tìm kiếm bài viết, mọi người, thước phim, sản phẩm, cửa hàng..."
              style={{
                width: '100%',
                height: '42px',
                padding: '0 0.9rem 0 2.4rem',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--color-border-strong)',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text)',
                fontSize: '0.875rem',
                outline: 'none',
              }}
            />
          </div>
          <Button type="submit" variant="primary">
            Tìm kiếm
          </Button>
        </form>

        {!q.trim() ? (
          <EmptyState
            title="Tìm kiếm trên Zola"
            description="Nhập từ khóa để tìm bài viết, mọi người, thước phim, sản phẩm hoặc cửa hàng."
          />
        ) : isLoading ? (
          <LoadingState message="Đang tìm kiếm..." />
        ) : error ? (
          <ErrorState message="Không thể tải kết quả tìm kiếm." onRetry={() => refetch()} />
        ) : type === 'all' ? (
          renderAllResults()
        ) : (
          renderCategoryResults()
        )}
      </div>
    </div>
  );
};
