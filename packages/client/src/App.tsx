import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import Badge from '@mui/material/Badge';
import { ThemeProvider, createTheme, CssBaseline, Popover, List, ListItem, ListItemText, Divider, ListItemAvatar, Avatar } from '@mui/material';
import { resolveImageUrl } from './utils/imageUtils';
import type { Theme } from '@mui/material';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import Home from './pages/Home';
import Shop from './pages/Shop';
import About from './pages/About';
import Privacy from './pages/Privacy';
import { useCart } from './context/CartContext';

import Admin from './pages/Admin';
import CartPage from './pages/CartPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#ffffff',
    },
    background: {
      default: '#000000',
      paper: '#121212',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
});

const paypalOptions = {
  clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID || 'sb',
  currency: 'USD',
  intent: 'capture' as const,
};

function App() {
  const { cartItems, getCartItemCount, getCartTotal } = useCart();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const timerRef = React.useRef<any>(null);

  const handlePopoverOpen = (event: React.MouseEvent<HTMLElement>) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => {
    timerRef.current = setTimeout(() => {
      setAnchorEl(null);
    }, 200);
  };

  const open = Boolean(anchorEl);

  return (
    <PayPalScriptProvider options={paypalOptions}>
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <ScrollToTop />
          <AppBar position="fixed">
            <Toolbar>
              <Typography
                variant="h6"
                sx={{
                  textDecoration: 'none',
                  color: 'inherit',
                  fontWeight: 'bold'
                }}
              >
                <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                  HolowStreet
                </Link>
              </Typography>
              <Box sx={{ flexGrow: 1 }} />
              <Button color="inherit" component={Link} to="/">Home</Button>
              <Button color="inherit" component={Link} to="/shop">Shop</Button>
              <Button color="inherit" component={Link} to="/admin">Admin</Button>
              <Button
                color="inherit"
                component={Link}
                to="/cart"
                onMouseEnter={handlePopoverOpen}
                onMouseLeave={handlePopoverClose}
              >
                <Badge badgeContent={getCartItemCount()} color="secondary">
                  <ShoppingCartIcon />
                </Badge>
              </Button>
              <Popover
                id="mouse-over-popover"
                disableRestoreFocus
                open={open}
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                onClose={handlePopoverClose}
                sx={{
                  pointerEvents: 'none',
                }}
                slotProps={{
                  paper: {
                    onMouseEnter: () => {
                      if (timerRef.current) clearTimeout(timerRef.current);
                    },
                    onMouseLeave: handlePopoverClose,
                    sx: {
                      pointerEvents: 'auto',
                      borderRadius: 2,
                      boxShadow: 10,
                      overflow: 'hidden'
                    }
                  }
                }}
              >
                <Box sx={{ p: 2, minWidth: 220, maxWidth: 300 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: 'primary.main' }}>Cart Preview</Typography>
                  {cartItems.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">Your cart is empty.</Typography>
                  ) : (
                    <>
                      <List dense disablePadding>
                        {cartItems.slice(0, 5).map((item, index) => (
                          <ListItem
                            key={index}
                            sx={{
                              px: 1,
                              py: 1,
                              mb: 1.5,
                              borderRadius: 2,
                              border: '2px solid rgba(255, 255, 255, 0.15)',
                              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                              cursor: 'pointer',
                              '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                borderColor: 'primary.main',
                                transform: 'scale(1.02)'
                              },
                              textDecoration: 'none',
                              color: 'inherit'
                            }}
                            component={Link}
                            to={`/shop?product=${item.id}`}
                            onClick={handlePopoverClose}
                          >
                            <ListItemAvatar>
                              <Avatar
                                variant="rounded"
                                src={item.imageUrl ? resolveImageUrl(item.imageUrl) : `https://via.placeholder.com/44?text=${item.name.charAt(0)}`}
                                sx={{ width: 44, height: 44, mr: 1, borderRadius: 1 }}
                              />
                            </ListItemAvatar>
                            <ListItemText
                              primary={item.name}
                              secondary={`${item.quantity} × $${item.price.toFixed(2)}`}
                              primaryTypographyProps={{ variant: 'body2', noWrap: true, fontWeight: '500' }}
                              secondaryTypographyProps={{ variant: 'caption' }}
                            />
                          </ListItem>
                        ))}
                      </List>
                      {cartItems.length > 5 && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                          + {cartItems.length - 5} more items
                        </Typography>
                      )}
                      <Divider sx={{ my: 1 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle2">Total:</Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>${getCartTotal().toFixed(2)}</Typography>
                      </Box>
                    </>
                  )}
                </Box>
              </Popover>
            </Toolbar>
          </AppBar>
          <Container sx={{ mt: 12, mb: 8 }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/order-confirmation" element={<OrderConfirmationPage />} />
              <Route path="/about" element={<About />} />
              <Route path="/privacy" element={<Privacy />} />
            </Routes>
          </Container>
          <Box
            component="footer"
            sx={{
              py: .5,
              px: 2,
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 1000,
              backgroundColor: (theme: Theme) => theme.palette.background.paper,
              borderTop: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Container maxWidth="lg">
              <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 3
              }}>
                <Button
                  component={Link}
                  to="/about"
                  color="inherit"
                  size="small"
                  sx={{ opacity: 0.7, '&:hover': { opacity: 1 }, fontSize: '0.75rem' }}
                >
                  About
                </Button>
                <Typography variant="caption" color="text.secondary">
                  {'© Billy Pickles 2026'}
                </Typography>
                <Button
                  component={Link}
                  to="/privacy"
                  color="inherit"
                  size="small"
                  sx={{ opacity: 0.7, '&:hover': { opacity: 1 }, fontSize: '0.75rem' }}
                >
                  Privacy
                </Button>
              </Box>
            </Container>
          </Box>
        </Router>
      </ThemeProvider>
    </PayPalScriptProvider>
  );
}

export default App;
