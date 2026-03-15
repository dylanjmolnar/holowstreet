import React, { useState } from 'react';
import { Typography, Box, Button, List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, ListItemAvatar, Avatar, FormControl, Select, MenuItem } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useCart } from '../context/CartContext';
import CheckoutDialog from '../components/CheckoutDialog';
import { Link } from 'react-router-dom';
import { resolveImageUrl } from '../utils/imageUtils';

const CartPage: React.FC = () => {
  const { cartItems, updateQuantity, removeItem, clearCart, getCartTotal } = useCart();
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const handleRemoveClick = (e: React.MouseEvent, id: number, variantId?: number) => {
    e.preventDefault();
    e.stopPropagation();
    removeItem(id, variantId);
  };

  const handleQuantityChange = (id: number, variantId: number | undefined, quantity: number) => {
    updateQuantity(id, variantId, quantity);
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Your Shopping Cart
      </Typography>

      {cartItems.length === 0 ? (
        <Typography variant="h6">Your cart is empty.</Typography>
      ) : (
        <List>
          {cartItems.map((item, index) => (
            <ListItem 
              key={`${item.id}-${item.variantId}-${index}`}
              sx={{ 
                py: 2, 
                mb: 2,
                borderRadius: 2,
                border: '1.5px solid rgba(255, 255, 255, 0.15)',
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: 'primary.main',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  transform: 'translateX(4px)'
                },
                textDecoration: 'none',
                color: 'inherit'
              }}
              component={Link}
              to={`/shop?product=${item.id}`}
            >
              <ListItemAvatar sx={{ mr: 2 }}>
                <Avatar 
                  variant="rounded" 
                  src={item.imageUrl ? resolveImageUrl(item.imageUrl) : `https://via.placeholder.com/80?text=${item.name.charAt(0)}`}
                  sx={{ width: 80, height: 80, border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      {item.name}
                    </Typography>
                    {(item.color || item.size) && (
                      <Typography variant="body2" color="primary.main">
                        {item.color && `Color: ${item.color}`} {item.size && ` - Size: ${item.size}`}
                      </Typography>
                    )}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                      <FormControl 
                        size="small" 
                        sx={{ minWidth: 80 }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Select
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(item.id, item.variantId, Number(e.target.value))}
                        >
                          {[...Array(10)].map((_, i) => (
                            <MenuItem key={i + 1} value={i + 1}>{i + 1}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <Typography variant="body2" color="text.secondary">
                        × ${item.price.toFixed(2)}
                      </Typography>
                    </Box>
                  </Box>
                }
                secondary={`Total: $${(item.price * item.quantity).toFixed(2)}`}
                secondaryTypographyProps={{ sx: { mt: 1, fontWeight: 'medium', color: 'text.primary' } }}
              />
              <ListItemSecondaryAction>
                <IconButton 
                  edge="end" 
                  aria-label="delete" 
                  onClick={(e) => handleRemoveClick(e, item.id, item.variantId)}
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
          <ListItem>
            <ListItemText primary={<Typography variant="h6">Total:</Typography>} />
            <Typography variant="h6">${getCartTotal().toFixed(2)}</Typography>
          </ListItem>
        </List>
      )}

      {cartItems.length > 0 && (
        <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setCheckoutOpen(true)}
            size="large"
            sx={{ fontWeight: 'bold', borderRadius: 2, px: 4 }}
          >
            Proceed to Checkout
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={clearCart}
          >
            Clear Cart
          </Button>
        </Box>
      )}

      <CheckoutDialog open={checkoutOpen} onClose={() => setCheckoutOpen(false)} />
    </Box>
  );
};

export default CartPage;
