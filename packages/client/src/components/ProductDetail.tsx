import { useState } from 'react';
import {
  Dialog, DialogContent, Typography, Button, Box, Select,
  MenuItem, FormControl, InputLabel, IconButton, Grid, Divider
} from '@mui/material';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import CloseIcon from '@mui/icons-material/Close';
import { useCart } from '../context/CartContext';
import { resolveImageUrl } from '../utils/imageUtils';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  quantity: number;
  imageUrls?: string[];
  variants?: { id: number; color: string; size: string; quantity: number }[];
}

interface ProductDetailProps {
  product: Product;
  open: boolean;
  onClose: () => void;
}

const ProductDetail = ({ product, open, onClose }: ProductDetailProps) => {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Variant selection states
  const colors = Array.from(new Set(product.variants?.map(v => v.color) || []));
  const [selectedColor, setSelectedColor] = useState(colors[0] || '');

  const availableSizes = product.variants?.filter(v => v.color === selectedColor).map(v => v.size) || [];
  const [selectedSize, setSelectedSize] = useState(() => {
    if (availableSizes.includes('M')) return 'M';
    if (availableSizes.includes('m')) return 'm';
    return availableSizes[0] || '';
  });

  const imageUrls = product.imageUrls || [];
  const hasMultipleImages = imageUrls.length > 1;

  const selectedVariant = product.variants?.find(v => v.color === selectedColor && v.size === selectedSize);
  const maxStock = selectedVariant ? selectedVariant.quantity : product.quantity;

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      variantId: selectedVariant?.id,
      color: selectedColor,
      size: selectedSize,
      imageUrl: product.imageUrls?.[0]
    } as any, quantity);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}>
      <IconButton
        onClick={onClose}
        sx={{ position: 'absolute', right: 16, top: 16, zIndex: 1, backgroundColor: 'rgba(0,0,0,0.05)', '&:hover': { backgroundColor: 'rgba(0,0,0,0.1)' } }}
      >
        <CloseIcon />
      </IconButton>

      <DialogContent sx={{ p: 0 }}>
        <Grid container>
          {/* Image Section */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ position: 'relative', height: { xs: 300, md: '100%' }, backgroundColor: '#f5f5f5' }}>
              <Box
                component="img"
                src={imageUrls.length > 0 ? resolveImageUrl(imageUrls[currentImageIndex]) : `https://via.placeholder.com/400?text=${product.name}`}
                sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />

              {hasMultipleImages && (
                <>
                  <IconButton
                    onClick={() => setCurrentImageIndex(prev => (prev - 1 + imageUrls.length) % imageUrls.length)}
                    sx={{
                      position: 'absolute',
                      left: 8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      bgcolor: 'rgba(255,255,255,0.8)',
                      color: '#666',
                      '&:hover': { bgcolor: 'white', color: '#333' }
                    }}
                  >
                    <NavigateBeforeIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => setCurrentImageIndex(prev => (prev + 1) % imageUrls.length)}
                    sx={{
                      position: 'absolute',
                      right: 8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      bgcolor: 'rgba(255,255,255,0.8)',
                      color: '#666',
                      '&:hover': { bgcolor: 'white', color: '#333' }
                    }}
                  >
                    <NavigateNextIcon />
                  </IconButton>

                  {/* Pagination Dots */}
                  <Box sx={{
                    position: 'absolute',
                    bottom: 12,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    gap: 1,
                    bgcolor: 'rgba(255,255,255,0.5)',
                    px: 1,
                    py: 0.5,
                    borderRadius: 4
                  }}>
                    {imageUrls.map((_, i) => (
                      <Box
                        key={i}
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: i === currentImageIndex ? '#666' : '#ccc',
                          transition: 'background-color 0.3s'
                        }}
                      />
                    ))}
                  </Box>
                </>
              )}
            </Box>
          </Grid>

          {/* Info Section */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                {product.category}
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                {product.name}
              </Typography>
              <Typography variant="h5" color="primary.main" sx={{ fontWeight: 'bold', mb: 3 }}>
                ${product.price.toFixed(2)}
              </Typography>

              <Divider sx={{ mb: 3 }} />

              <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4, lineHeight: 1.7 }}>
                {product.description}
              </Typography>

              <Box sx={{ mt: 'auto' }}>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid size={{ xs: 6 }}>
                    <FormControl fullWidth size="small" disabled={colors.length <= 1}>
                      <InputLabel>Color</InputLabel>
                      <Select
                        value={selectedColor}
                        label="Color"
                        onChange={(e) => {
                          setSelectedColor(e.target.value);
                          const newSizes = product.variants?.filter(v => v.color === e.target.value).map(v => v.size) || [];
                          setSelectedSize(newSizes[0] || '');
                        }}
                      >
                        {colors.length === 0 ? <MenuItem value="">None</MenuItem> : colors.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <FormControl fullWidth size="small" disabled={availableSizes.length <= 1}>
                      <InputLabel>Size</InputLabel>
                      <Select
                        value={selectedSize}
                        label="Size"
                        onChange={(e) => setSelectedSize(e.target.value)}
                      >
                        {availableSizes.length === 0 ? <MenuItem value="">None</MenuItem> : availableSizes.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <FormControl size="small" sx={{ width: 100 }}>
                    <InputLabel>Qty</InputLabel>
                    <Select
                      value={quantity}
                      label="Qty"
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      disabled={maxStock === 0}
                    >
                      {[...Array(Math.min(10, maxStock))].map((_, i) => (
                        <MenuItem key={i + 1} value={i + 1}>{i + 1}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Typography variant="body2" color={maxStock > 0 ? "success.main" : "error.main"} sx={{ fontWeight: 'bold' }}>
                    {maxStock > 0 ? `${maxStock} in stock` : "Out of stock"}
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  onClick={handleAddToCart}
                  disabled={maxStock === 0}
                  sx={{ borderRadius: 2, py: 1.5, fontWeight: 'bold' }}
                >
                  {maxStock > 0 ? 'Add to Cart' : 'Out of Stock'}
                </Button>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetail;
