import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, Store } from 'lucide-react';
import { useCategories, useProductSearch, useShopSearch } from '../../hooks/useShopping';
import { useCart } from '../../hooks/useCart';
import { useDebounce } from '../../hooks/useDebounce';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { SafeImage } from '../../components/common/SafeImage';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { Pagination } from '../../components/common/Pagination';
import { formatCurrencyVnd } from '../../utils/formatters';

export const ShoppingHomePage: React.FC = () => {
  const navigate = useNavigate();
  const { addItem, isAddingItem } = useCart();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [activeTab, setActiveTab] = useState<'products' | 'shops'>('products');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [sortOption, setSortOption] = useState('newest');
  const [page, setPage] = useState(1);

  // Queries
  const { data: categories } = useCategories();
  const { data: productsData, isLoading: isProductsLoading } = useProductSearch({
    q: debouncedSearch || undefined,
    categoryId: selectedCategory,
    sort: sortOption,
    page,
    pageSize: 20,
  });

  const { data: shopsData, isLoading: isShopsLoading } = useShopSearch(
    debouncedSearch || undefined,
    page,
    20
  );

  const handleAddToCart = async (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    try {
      await addItem({ productId, quantity: 1 });
      alert('Đã thêm sản phẩm vào giỏ hàng!');
    } catch (err: any) {
      alert(err.message || 'Lỗi thêm vào giỏ.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Search Header Banner */}
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          padding: '1.25rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.85rem' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.3px' }}>
              Zola Mall <span style={{ color: 'var(--color-primary)', fontSize: '0.9rem', fontWeight: 700 }}>• Mua sắm chính hãng</span>
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
              Khám phá hàng ngàn sản phẩm chất lượng từ các gian hàng uy tín
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button
              variant={activeTab === 'products' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => {
                setActiveTab('products');
                setPage(1);
              }}
            >
              Tìm Sản phẩm
            </Button>
            <Button
              variant={activeTab === 'shops' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => {
                setActiveTab('shops');
                setPage(1);
              }}
            >
              <Store size={14} /> Tìm Cửa hàng
            </Button>
          </div>
        </div>

        {/* Search input with 300ms debounce */}
        <div style={{ position: 'relative' }}>
          <Input
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder={activeTab === 'products' ? 'Tìm theo tên sản phẩm...' : 'Tìm theo tên cửa hàng...'}
            style={{ paddingLeft: '2.5rem' }}
          />
          <Search
            size={18}
            style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}
          />
        </div>

        {/* Categories Pills & Sorters (Only for products) */}
        {activeTab === 'products' && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            {/* Category Filter Pills */}
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  setSelectedCategory(undefined);
                  setPage(1);
                }}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  backgroundColor: !selectedCategory ? 'var(--color-primary)' : 'var(--color-surface-hover)',
                  color: !selectedCategory ? '#ffffff' : 'var(--color-text)',
                  border: '1px solid var(--color-border)',
                  boxShadow: !selectedCategory ? 'var(--shadow-glow)' : 'none',
                  transition: 'all var(--dur-feedback) var(--ease-out)',
                }}
              >
                Tất cả danh mục
              </button>

              {categories?.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setPage(1);
                  }}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: 'var(--radius-pill)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    backgroundColor: selectedCategory === cat.id ? 'var(--color-primary)' : 'var(--color-surface-hover)',
                    color: selectedCategory === cat.id ? '#ffffff' : 'var(--color-text)',
                    border: '1px solid var(--color-border)',
                    boxShadow: selectedCategory === cat.id ? 'var(--shadow-glow)' : 'none',
                    transition: 'all var(--dur-feedback) var(--ease-out)',
                  }}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Sắp xếp:</span>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface)',
                  fontSize: '0.8125rem',
                  color: 'var(--color-text)',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="newest">Mới nhất</option>
                <option value="price_asc">Giá: Thấp đến Cao</option>
                <option value="price_desc">Giá: Cao đến Thấp</option>
                <option value="name_asc">Tên: A-Z</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Products Tab */}
      {activeTab === 'products' && (
        <>
          {isProductsLoading && <LoadingState message="Đang tìm kiếm sản phẩm..." />}

          {!isProductsLoading && productsData?.items.length === 0 && (
            <EmptyState title="Không tìm thấy sản phẩm nào" message="Hãy thử tìm kiếm với từ khóa khác hoặc bỏ chọn danh mục." />
          )}

          {!isProductsLoading && productsData && productsData.items.length > 0 && (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: '1rem',
                }}
              >
                {productsData.items.map((product) => (
                  <Card
                    key={product.id}
                    hoverable
                    onClick={() => navigate(`/products/${product.id}`)}
                    style={{
                      cursor: 'pointer',
                      padding: 0,
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    <div style={{ height: '175px', width: '100%', backgroundColor: '#f1f5f9', position: 'relative' }}>
                      <SafeImage src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>

                    <div style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', flex: 1, gap: '0.4rem' }}>
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/shops/${product.shopId}`);
                        }}
                        style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                      >
                        <Store size={12} /> {product.shopName}
                      </span>

                      <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)', lineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.35 }}>
                        {product.name}
                      </h4>

                      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.5rem' }}>
                        <div>
                          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                            {formatCurrencyVnd(product.price)}
                          </div>
                          <span style={{ fontSize: '0.6875rem', color: product.stock > 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                            {product.stock > 0 ? `Còn ${product.stock} sp` : 'Hết hàng'}
                          </span>
                        </div>

                        <Button
                          variant="primary"
                          size="sm"
                          disabled={product.stock <= 0 || isAddingItem}
                          onClick={(e) => handleAddToCart(e, product.id)}
                          style={{ borderRadius: 'var(--radius-full)', width: '34px', height: '34px', padding: 0 }}
                          title="Thêm vào giỏ"
                        >
                          <ShoppingCart size={15} />
                        </Button>
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
        </>
      )}

      {/* Main Grid: Shops Tab */}
      {activeTab === 'shops' && (
        <>
          {isShopsLoading && <LoadingState message="Đang tìm kiếm cửa hàng..." />}

          {!isShopsLoading && shopsData?.items.length === 0 && (
            <EmptyState title="Không tìm thấy cửa hàng nào" message="Thử tìm kiếm với tên cửa hàng khác." />
          )}

          {!isShopsLoading && shopsData && shopsData.items.length > 0 && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                {shopsData.items.map((shop) => (
                  <Card
                    key={shop.id}
                    hoverable
                    onClick={() => navigate(`/shops/${shop.id}`)}
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}
                  >
                    <div style={{ width: '54px', height: '54px', borderRadius: '50%', overflow: 'hidden', backgroundColor: '#e2e8f0', flexShrink: 0, border: '2px solid var(--color-primary-light)' }}>
                      <SafeImage src={shop.logoUrl} alt={shop.name} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text)' }}>{shop.name}</h4>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>{shop.description || 'Chưa có mô tả'}</p>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 700 }}>
                        {shop.productCount} sản phẩm
                      </span>
                    </div>
                  </Card>
                ))}
              </div>

              <Pagination
                currentPage={shopsData.page}
                totalPages={shopsData.totalPages}
                onPageChange={(p) => setPage(p)}
              />
            </>
          )}
        </>
      )}
    </div>
  );
};
