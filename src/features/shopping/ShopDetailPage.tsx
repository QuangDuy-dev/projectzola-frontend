import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { useShopDetail, useShopProducts } from '../../hooks/useShopping';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { SafeImage } from '../../components/common/SafeImage';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';
import { Pagination } from '../../components/common/Pagination';
import { formatCurrencyVnd } from '../../utils/formatters';

export const ShopDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [sortOption, setSortOption] = useState('newest');

  const { data: shop, isLoading: isShopLoading, error: shopError, refetch: refetchShop } = useShopDetail(id);
  const { data: productsData, isLoading: isProductsLoading, error: productsError } = useShopProducts(
    id,
    undefined,
    sortOption,
    page,
    20
  );

  if (isShopLoading) return <LoadingState message="Đang tải thông tin cửa hàng..." />;
  if (shopError || !shop) return <ErrorState title="Lỗi tải cửa hàng" message="Cửa hàng không tồn tại." onRetry={() => refetchShop()} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} style={{ alignSelf: 'flex-start' }}>
        <ArrowLeft size={16} /> Quay lại
      </Button>

      {/* Shop Info Card */}
      <Card style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', backgroundColor: '#f1f5f9', flexShrink: 0 }}>
          <SafeImage src={shop.logoUrl} alt={shop.name} />
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{shop.name}</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            {shop.description || 'Cửa hàng chất lượng cao trên MySocialApp'}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem', fontSize: '0.8125rem' }}>
            <span style={{ color: 'var(--color-primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              <ShoppingBag size={14} /> {shop.productCount} sản phẩm đang bán
            </span>
          </div>
        </div>
      </Card>

      {/* Shop Products Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Sản phẩm của cửa hàng</h3>
        <select
          value={sortOption}
          onChange={(e) => {
            setSortOption(e.target.value);
            setPage(1);
          }}
          style={{
            padding: '0.375rem 0.75rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface)',
            fontSize: '0.8125rem',
            outline: 'none',
          }}
        >
          <option value="newest">Mới nhất</option>
          <option value="price_asc">Giá: Thấp đến Cao</option>
          <option value="price_desc">Giá: Cao đến Thấp</option>
          <option value="name_asc">Tên: A-Z</option>
        </select>
      </div>

      {isProductsLoading && <LoadingState message="Đang tải sản phẩm của shop..." />}
      {productsError && <ErrorState title="Lỗi" message="Không thể tải danh sách sản phẩm." />}

      {!isProductsLoading && productsData?.items.length === 0 && (
        <EmptyState title="Cửa hàng chưa có sản phẩm nào" message="Hãy quay lại sau khi chủ shop cập nhật thêm mặt hàng." />
      )}

      {!isProductsLoading && productsData && productsData.items.length > 0 && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
            {productsData.items.map((prod) => (
              <Card
                key={prod.id}
                hoverable
                onClick={() => navigate(`/products/${prod.id}`)}
                style={{ cursor: 'pointer', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
              >
                <div style={{ height: '180px', width: '100%', backgroundColor: '#f1f5f9' }}>
                  <SafeImage src={prod.images[0]?.url} alt={prod.name} style={{ width: '100%', height: '100%' }} />
                </div>
                <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', flex: 1, gap: '0.5rem' }}>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, lineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {prod.name}
                  </h4>
                  <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
                    <div style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                      {formatCurrencyVnd(prod.price)}
                    </div>
                    <span style={{ fontSize: '0.6875rem', color: prod.stock > 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                      {prod.stock > 0 ? `Còn ${prod.stock} cái` : 'Hết hàng'}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Pagination
            currentPage={productsData.page}
            totalPages={productsData.totalPages}
            onPageChange={(p) => setPage(p)}
          />
        </>
      )}
    </div>
  );
};
