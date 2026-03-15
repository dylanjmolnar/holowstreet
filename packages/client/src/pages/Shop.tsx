import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Grid, Typography, CircularProgress, Box, FormControl, InputLabel, Select, MenuItem, Checkbox, FormControlLabel } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import ProductCard from '../components/ProductCard';
import ProductDetail from '../components/ProductDetail';
import { API_BASE_URL } from '../config';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  quantity: number;
}

const CATEGORIES = ['shirts', 'crewnecks', 'hoodies', 'pants', 'hats', 'stickers', 'wall art', 'accessories'];

const Shop: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  
  // Filter & Sort State
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const [sortBy, setSortBy] = useState<string>('category');
  const [showInStock, setShowInStock] = useState<boolean>(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        // Fetching all products as base, we'll filter client-side for more fluid UX if needed, 
        // but sticking to existing pattern of fetching by category if selected.
        const url = `${API_BASE_URL}/api/products`;
        const response = await axios.get(url);
        setProducts(response.data);
      } catch (err: any) {
        setError('Failed to fetch products. Please try again later.');
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    const productId = searchParams.get('product');
    if (productId && products.length > 0) {
      const product = products.find(p => p.id === parseInt(productId));
      if (product) {
        setSelectedProduct(product);
        setDetailOpen(true);
        // Clean up search params
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('product');
        setSearchParams(newParams, { replace: true });
      }
    }
  }, [searchParams, products]);

  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      if (CATEGORIES.includes(categoryParam) || categoryParam === 'all') {
        setSelectedCategory(categoryParam);
      }
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('category');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleCloseDetail = () => {
    setDetailOpen(false);
    setSelectedProduct(null);
  };

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    // 1. Category Filter
    if (selectedCategory !== 'all') {
      result = result.filter(p => p.category === selectedCategory);
    }


    // 3. Stock Filter
    if (showInStock) {
      result = result.filter(p => p.quantity > 0);
    }

    // 4. Sorting
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

  const handleCategoryChange = (event: SelectChangeEvent) => setSelectedCategory(event.target.value as string);

  const handleSortChange = (event: SelectChangeEvent) => setSortBy(event.target.value as string);
  const handleStockToggle = (event: React.ChangeEvent<HTMLInputElement>) => setShowInStock(event.target.checked);

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">{error}</Typography>;

  const renderProductGrid = (items: Product[]) => (
    <Grid container spacing={4} alignItems="flex-start">
      {items.map((product) => (
        <Grid key={product.id} size={{ xs: 12, sm: 6, md: 4 }}>
          <ProductCard product={product} />
        </Grid>
      ))}
    </Grid>
  );

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" component="h1">Shop</Typography>
        
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end' }}>
          {/* Category Filter */}
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Category</InputLabel>
            <Select value={selectedCategory} label="Category" onChange={handleCategoryChange}>
              <MenuItem value="all">All Categories</MenuItem>
              {CATEGORIES.map(cat => (
                <MenuItem key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</MenuItem>
              ))}
            </Select>
          </FormControl>


          {/* Sort By */}
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Sort By</InputLabel>
            <Select value={sortBy} label="Sort By" onChange={handleSortChange}>

              <MenuItem value="price-asc">Price: Low to High</MenuItem>
              <MenuItem value="price-desc">Price: High to Low</MenuItem>
              <MenuItem value="alpha-az">Alphabetical: A-Z</MenuItem>
              <MenuItem value="alpha-za">Alphabetical: Z-A</MenuItem>
              <MenuItem value="category">Category Grouping</MenuItem>
            </Select>
          </FormControl>

          {/* Stock Toggle */}
          <FormControlLabel
            control={<Checkbox checked={showInStock} onChange={handleStockToggle} />}
            label="In Stock Only"
          />
        </Box>
      </Box>

      {sortBy === 'category' && selectedCategory === 'all' ? (
        CATEGORIES.map(cat => {
          const catProducts = filteredAndSortedProducts.filter(p => p.category === cat);
          if (catProducts.length === 0) return null;
          return (
            <Box key={cat} sx={{ mb: 6 }}>
              <Typography variant="h5" sx={{ mb: 2, borderBottom: '2px solid #333', pb: 1, fontWeight: 'bold', textTransform: 'capitalize' }}>
                {cat}
              </Typography>
              {renderProductGrid(catProducts)}
            </Box>
          );
        })
      ) : (
        <>
          {filteredAndSortedProducts.length > 0 ? (
            renderProductGrid(filteredAndSortedProducts)
          ) : (
            <Typography variant="body1" color="text.secondary">No products match your filters.</Typography>
          )}
        </>
      )}
      {selectedProduct && (
        <ProductDetail 
          product={selectedProduct as any} 
          open={detailOpen} 
          onClose={handleCloseDetail} 
        />
      )}
    </Box>
  );
};

export default Shop;

