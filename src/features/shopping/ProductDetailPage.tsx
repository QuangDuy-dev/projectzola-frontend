import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Store, Package } from 'lucide-react';
import { useProductDetail } from '../../hooks/useShopping';
import { useCart } from '../../hooks/useCart';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { SafeImage } from '../../components/common/SafeImage';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { formatCurrencyVnd } from '../../utils/formatters';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: product, isLoading, error, refetch } = useProductDetail(id);
  const { addItem, isAddingItem } = useCart();

  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  if (isLoading) return <LoadingState message="Đang tải thông tin sản phẩm..." />;
  if (error || !product) return <ErrorState title="Lỗi tải sản phẩm" message="Sản phẩm không tồn tại hoặc đã bị gỡ." onRetry={() => refetch()} />;

  const handleAddToCart = async () => {
    try {
      await addItem({ productId: product.id, quantity });
      alert(`Đã thêm ${quantity} sản phẩm vào giỏ hàng!`);
    } catch (err: any) {
      alert(err.message || 'Lỗi thêm vào giỏ hàng.');
    }
  };

  const images = product.images.length > 0 ? product.images : [{ id: 'default', url: '', displayOrder: 0 }];
  const currentImage = images[selectedImageIndex]?.url;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} style={{ alignSelf: 'flex-start' }}>
        <ArrowLeft size={16} /> Quay lại
      </Button>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
        {/* Left: Images Gallery */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div
            style={{
              height: '380px',
              backgroundColor: '#f1f5f9',
              borderRadius: 'var(--radius-xl)',
              overflow: 'hidden',
              border: '1px solid var(--color-border)',
            }}
          >
            <SafeImage src={currentImage} alt={product.name} style={{ width: '100%', height: '100%' }} />
          </div>

          {images.length > 1 && (
            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto' }}>
              {images.map((img, idx) => (
                <div
                  key={img.id}
                  onClick={() => setSelectedImageIndex(idx)}
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: `2px solid ${selectedImageIndex === idx ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  }}
                >
                  <SafeImage src={img.url} alt="thumbnail" style={{ width: '100%', height: '100%' }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Details & Purchase Form */}
        <Card style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <span
              onClick={() => navigate(`/shops/${product.shopId}`)}
              style={{
                fontSize: '0.875rem',
                color: 'var(--color-primary)',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                cursor: 'pointer',
                marginBottom: '0.5rem',
              }}
            >
              <Store size={16} /> Cửa hàng: {product.shopName}
            </span>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)' }}>{product.name}</h1>
            {product.categoryName && (
              <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                Danh mục: {product.categoryName}
              </span>
            )}
          </div>

          <div
            style={{
              fontSize: '1.875rem',
              fontWeight: 800,
              color: 'var(--color-primary)',
              backgroundColor: 'var(--color-primary-light)',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            {formatCurrencyVnd(product.price)}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            <Package size={16} />
            <span>
              Tình trạng tồn kho:{' '}
              <strong style={{ color: product.stock > 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                {product.stock > 0 ? `Còn ${product.stock} sản phẩm` : 'Đã hết hàng'}
              </strong>
            </span>
          </div>

          {product.description && (
            <div>
              <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '0.25rem' }}>Mô tả sản phẩm:</h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', whiteSpace: 'pre-line' }}>
                {product.description}
              </p>
            </div>
          )}

          {/* Quantity selector & Add to Cart */}
          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Số lượng:</span>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  style={{ padding: '0.375rem 0.75rem', fontSize: '1rem', fontWeight: 600 }}
                >
                  -
                </button>
                <span style={{ minWidth: '40px', textAlign: 'center', fontSize: '0.9375rem', fontWeight: 600 }}>{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  disabled={quantity >= product.stock}
                  style={{ padding: '0.375rem 0.75rem', fontSize: '1rem', fontWeight: 600 }}
                >
                  +
                </button>
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              disabled={product.stock <= 0 || isAddingItem}
              isLoading={isAddingItem}
              onClick={handleAddToCart}
            >
              <ShoppingCart size={18} />
              Thêm vào giỏ hàng
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
