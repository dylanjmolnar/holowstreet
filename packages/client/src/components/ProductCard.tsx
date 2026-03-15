import { useState } from 'react';
import { Card, CardContent, CardMedia, Typography, Box, CardActionArea } from '@mui/material';
import ProductDetail from './ProductDetail';
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

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const [detailOpen, setDetailOpen] = useState(false);
  const imageUrls = product.imageUrls || [];

  return (
    <>
      <Card 
        sx={{ 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column', 
          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: 8
          }
        }}
      >
        <CardActionArea onClick={() => setDetailOpen(true)} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
          <CardMedia
            component="img"
            height="220"
            image={imageUrls.length > 0 ? resolveImageUrl(imageUrls[0]) : `https://via.placeholder.com/150?text=${product.name}`}
            alt={product.name}
            sx={{ objectFit: 'cover' }}
          />
          <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            <Typography gutterBottom variant="h6" component="div" sx={{ fontWeight: 'bold', lineHeight: 1.2, mb: 1 }}>
              {product.name}
            </Typography>
            
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                height: '3em', 
                overflow: 'hidden', 
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                mb: 2
              }}
            >
              {product.description}
            </Typography>

            <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" color="primary.main" sx={{ fontWeight: 'bold' }}>
                ${product.price.toFixed(2)}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: '500' }}>
                View Options →
              </Typography>
            </Box>
          </CardContent>
        </CardActionArea>
      </Card>

      <ProductDetail 
        product={product} 
        open={detailOpen} 
        onClose={() => setDetailOpen(false)} 
      />
    </>
  );
};

export default ProductCard;
