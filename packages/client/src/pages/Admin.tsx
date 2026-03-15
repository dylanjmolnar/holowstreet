import React, { useState, useEffect, useMemo } from 'react';
import { Typography, Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, Grid, Card, CardContent, CardActions, Tabs, Tab, FormControl, InputLabel, Select, MenuItem, CardMedia, CardActionArea, Checkbox, FormControlLabel, Divider, TextField, InputAdornment, IconButton } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import AddEditProductForm from '../components/AddEditProductForm';
import { resolveImageUrl } from '../utils/imageUtils';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  quantity: number;
  imageUrls?: string[];
}

interface Order {
  id: number;
  customer_name: string;
  customer_email: string;
  total_amount: number;
  orderTimestamp: string;
  items?: OrderItem[];
  shipping_address?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_zip?: string;
  shipping_country?: string;
  billing_address?: string;
  billing_city?: string;
  billing_state?: string;
  billing_zip?: string;
  billing_country?: string;
}

interface OrderItem {
  product_id: number;
  quantity: number;
  price: number;
  selected_color?: string;
  selected_size?: string;
}

const CATEGORIES = ['shirts', 'crewnecks', 'hoodies', 'pants', 'hats', 'stickers', 'wall art', 'accessories'];

const Admin: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [openProductForm, setOpenProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [openOrderDetail, setOpenOrderDetail] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  // Product Filter & Sort State
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const [sortBy, setSortBy] = useState<string>('category');
  const [showInStock, setShowInStock] = useState<boolean>(false);

  // Order Sort State
  const [orderSortBy, setOrderSortBy] = useState<string>('date-desc');
  const [orderSearchQuery, setOrderSearchQuery] = useState<string>('');

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/products`);
      setProducts(response.data);
    } catch (err: any) {
      setError('Failed to fetch products.');
      console.error('Error fetching products:', err);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/orders`);
      setOrders(response.data);
    } catch (err: any) {
      setError('Failed to fetch orders.');
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchOrders();
  }, []);

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    if (selectedCategory !== 'all') {
      result = result.filter(p => p.category === selectedCategory);
    }


    if (showInStock) {
      result = result.filter(p => p.quantity > 0);
    }

    if (sortBy === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'alpha-az') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'alpha-za') {
      result.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortBy === 'category') {
      result.sort((a, b) => {
        const catComp = a.category.localeCompare(b.category);
        if (catComp !== 0) return catComp;
        return a.name.localeCompare(b.name);
      });
    }

    return result;
  }, [products, selectedCategory, sortBy, showInStock]);

  const sortedOrders = useMemo(() => {
    let result = [...orders];

    if (orderSearchQuery) {
      const query = orderSearchQuery.toLowerCase();
      result = result.filter(order =>
        order.customer_name.toLowerCase().includes(query) ||
        order.customer_email.toLowerCase().includes(query)
      );
    }

    if (orderSortBy === 'date-desc') {
      result.sort((a, b) => new Date(b.orderTimestamp).getTime() - new Date(a.orderTimestamp).getTime());
    } else if (orderSortBy === 'date-asc') {
      result.sort((a, b) => new Date(a.orderTimestamp).getTime() - new Date(b.orderTimestamp).getTime());
    } else if (orderSortBy === 'name-az') {
      result.sort((a, b) => a.customer_name.localeCompare(b.customer_name));
    }
    return result;
  }, [orders, orderSortBy, orderSearchQuery]);

  const handleOpenAddProduct = () => {
    setEditingProduct(undefined);
    setOpenProductForm(true);
  };

  const handleOpenEditProduct = (product: Product) => {
    setEditingProduct(product);
    setOpenProductForm(true);
  };

  const handleCloseProductForm = () => {
    setOpenProductForm(false);
    setEditingProduct(undefined);
    fetchProducts();
  };

  const handleViewOrder = async (orderId: number) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/orders/${orderId}`);
      setSelectedOrder(response.data);
      setOpenOrderDetail(true);
    } catch (err: any) {
      setError('Failed to fetch order details.');
      console.error('Error fetching order details:', err);
    }
  };

  const handleCloseOrderDetail = () => {
    setOpenOrderDetail(false);
    setSelectedOrder(null);
  };

  if (loading) return <Typography>Loading admin data...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;

  const renderProductGrid = (items: Product[]) => (
    <Grid container spacing={2} alignItems="flex-start">
      {items.map((product) => (
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={product.id}>
          <Card
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 }
            }}
          >
            <CardActionArea onClick={() => handleOpenEditProduct(product)} sx={{ height: '100%' }}>
              <CardMedia
                component="img"
                height="180"
                image={product.imageUrls?.[0] ? resolveImageUrl(product.imageUrls[0]) : 'https://placehold.co/400?text=No+Image'}
                alt={product.name}
                sx={{ objectFit: 'cover' }}
              />
              <CardContent sx={{ flexGrow: 1, pt: 1.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 0.5, lineHeight: 1.2 }}>{product.name}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ height: '2.5em', overflow: 'hidden', mb: 1, fontSize: '0.8rem' }}>
                  {product.description}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>${product.price.toFixed(2)}</Typography>
                  <Typography variant="caption" sx={{ color: product.quantity === 0 ? 'error.main' : 'text.secondary' }}>
                    {product.quantity} stock
                  </Typography>
                </Box>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>Admin Panel</Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Product Management" />
          <Tab label="Order Management" />
        </Tabs>
      </Box>

      {/* Product Management */}
      {tabValue === 0 && (
        <Box>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', mb: 3 }}>
            <Box sx={{ mr: 'auto' }}>
              <Button variant="contained" onClick={handleOpenAddProduct}>Add New Product</Button>
            </Box>

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Category</InputLabel>
              <Select value={selectedCategory} label="Category" onChange={(e) => setSelectedCategory(e.target.value)}>
                <MenuItem value="all">All Categories</MenuItem>
                {CATEGORIES.map(cat => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)}
              </Select>
            </FormControl>


            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Sort By</InputLabel>
              <Select value={sortBy} label="Sort By" onChange={(e) => setSortBy(e.target.value)}>

                <MenuItem value="price-asc">Price: Low to High</MenuItem>
                <MenuItem value="price-desc">Price: High to Low</MenuItem>
                <MenuItem value="alpha-az">A-Z</MenuItem>
                <MenuItem value="alpha-za">Z-A</MenuItem>
                <MenuItem value="category">Group by Category</MenuItem>
              </Select>
            </FormControl>

            <FormControlLabel
              control={<Checkbox checked={showInStock} onChange={(e) => setShowInStock(e.target.checked)} />}
              label="In Stock"
            />
          </Box>

          {sortBy === 'category' && selectedCategory === 'all' ? (
            CATEGORIES.map(cat => {
              const catProducts = filteredAndSortedProducts.filter(p => p.category === cat);
              if (catProducts.length === 0) return null;
              return (
                <Box key={cat} sx={{ mb: 4 }}>
                  <Typography variant="h6" sx={{ mb: 2, borderLeft: '4px solid #fff', pl: 2, textTransform: 'capitalize' }}>{cat}</Typography>
                  {renderProductGrid(catProducts)}
                  <Divider sx={{ mt: 3 }} />
                </Box>
              );
            })
          ) : (
            filteredAndSortedProducts.length > 0 ? renderProductGrid(filteredAndSortedProducts) : <Typography>No products found.</Typography>
          )}

          <Dialog open={openProductForm} onClose={handleCloseProductForm}>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            <DialogContent><AddEditProductForm product={editingProduct} onSuccess={handleCloseProductForm} /></DialogContent>
          </Dialog>
        </Box>
      )}

      {/* Order Management */}
      {tabValue === 1 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2 }}>
            <TextField
              size="small"
              placeholder="Search by name or email..."
              value={orderSearchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOrderSearchQuery(e.target.value)}
              sx={{ flexGrow: 1, maxWidth: 400 }}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton edge="end">
                        <SearchIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Sort Orders By</InputLabel>
              <Select value={orderSortBy} label="Sort Orders By" onChange={(e) => setOrderSortBy(e.target.value)}>
                <MenuItem value="date-desc">Date: Newest First</MenuItem>
                <MenuItem value="date-asc">Date: Oldest First</MenuItem>
                <MenuItem value="name-az">Customer Name: A-Z</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Grid container spacing={2}>
            {sortedOrders.map((order) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={order.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" color="primary">Order #{String(order.id).padStart(5, '0')}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{order.customer_name}</Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>{order.customer_email}</Typography>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h6">${order.total_amount.toFixed(2)}</Typography>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="caption" display="block">{new Date(order.orderTimestamp).toLocaleDateString()}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>{new Date(order.orderTimestamp).toLocaleTimeString()}</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button size="small" fullWidth onClick={() => handleViewOrder(order.id)}>View Details</Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Dialog open={openOrderDetail} onClose={handleCloseOrderDetail} maxWidth="md" fullWidth>
            <DialogTitle>Order Detail - #{selectedOrder ? String(selectedOrder.id).padStart(5, '0') : ''}</DialogTitle>
            <DialogContent dividers>
              {selectedOrder && (
                <Box>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary">Customer</Typography>
                    <Typography variant="h6">{selectedOrder.customer_name}</Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>{selectedOrder.customer_email}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Ordered: {new Date(selectedOrder.orderTimestamp).toLocaleString()}
                    </Typography>
                  </Box>

                  <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography variant="subtitle2" color="text.secondary">Shipping Address</Typography>
                      <Typography variant="body2">{selectedOrder.shipping_address}</Typography>
                      <Typography variant="body2">
                        {selectedOrder.shipping_city}, {selectedOrder.shipping_state} {selectedOrder.shipping_zip}
                      </Typography>
                      <Typography variant="body2">{selectedOrder.shipping_country}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography variant="subtitle2" color="text.secondary">Billing Address</Typography>
                      <Typography variant="body2">{selectedOrder.billing_address}</Typography>
                      <Typography variant="body2">
                        {selectedOrder.billing_city}, {selectedOrder.billing_state} {selectedOrder.billing_zip}
                      </Typography>
                      <Typography variant="body2">{selectedOrder.billing_country}</Typography>
                    </Grid>
                  </Grid>

                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Items</Typography>
                  {selectedOrder.items?.map((item, idx) => (
                    <Box key={idx} sx={{ p: 1, mb: 1, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid #333' }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Product ID: {item.product_id}</Typography>
                      {item.selected_color && <Typography variant="caption" sx={{ mr: 1 }}>Color: {item.selected_color}</Typography>}
                      {item.selected_size && <Typography variant="caption">Size: {item.selected_size}</Typography>}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                        <Typography variant="caption">Qty: {item.quantity}</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 'bold' }}>${item.price.toFixed(2)}</Typography>
                      </Box>
                    </Box>
                  ))}
                  <Box sx={{ mt: 3, textAlign: 'right' }}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Total: ${selectedOrder.total_amount.toFixed(2)}</Typography>
                  </Box>
                </Box>
              )}
            </DialogContent>
            <DialogActions><Button onClick={handleCloseOrderDetail}>Close</Button></DialogActions>
          </Dialog>
        </Box>
      )}
    </Box>
  );
};

export default Admin;

