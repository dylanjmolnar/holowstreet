import React, { useState, useEffect } from 'react';
import { TextField, Button, Box, Typography, MenuItem, Select, FormControl, InputLabel, Grid, InputAdornment, IconButton, Tooltip } from '@mui/material';
import axios from 'axios';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloseIcon from '@mui/icons-material/Close';
import { resolveImageUrl } from '../utils/imageUtils';

interface ProductFormProps {
  product?: {
    id: number;
    name: string;
    description: string;
    price: number;
    category: string;
    quantity: number;
    imageUrls?: string[];
  };
  onSuccess: () => void;
}

const AddEditProductForm: React.FC<ProductFormProps> = ({ product, onSuccess }) => {
  const [name, setName] = useState(product?.name || '');
  const [description, setDescription] = useState(product?.description || '');
  const [price, setPrice] = useState(product?.price ? product.price.toFixed(2) : '');
  const [category, setCategory] = useState(product?.category || 'shirts');
  
  // Track colors and sizes as arrays
  const [colors, setColors] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  
  // Variants mapping: key is "color-size", value is quantity
  const [variantQuantities, setVariantQuantities] = useState<Record<string, string>>({});
  const [generalQuantity, setGeneralQuantity] = useState(product?.quantity ? product.quantity.toString() : '0');
  
  const [error, setError] = useState<string | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>(product?.imageUrls || []);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (product) {
      setName(product.name);
      setDescription(product.description || '');
      setPrice(product.price.toFixed(2));
      setCategory(product.category);
      setExistingImageUrls(product.imageUrls || []);
      setGeneralQuantity(product.quantity.toString());
      
      // Load variants if they exist
      if ((product as any).variants) {
        const productVariants = (product as any).variants;
        const uniqueColors = Array.from(new Set(productVariants.map((v: any) => v.color))) as string[];
        const uniqueSizes = Array.from(new Set(productVariants.map((v: any) => v.size))) as string[];
        const quantities: Record<string, string> = {};
        
        productVariants.forEach((v: any) => {
          quantities[`${v.color}-${v.size}`] = v.quantity.toString();
        });
        
        setColors(uniqueColors);
        setSizes(uniqueSizes);
        setVariantQuantities(quantities);
      }
    }
  }, [product]);

  const handleAddColor = () => setColors([...colors, '']);
  const handleRemoveColor = (index: number) => {
    const newColors = colors.filter((_, i) => i !== index);
    setColors(newColors);
  };
  const handleColorChange = (index: number, value: string) => {
    const newColors = [...colors];
    newColors[index] = value;
    setColors(newColors);
  };

  const handleAddSize = () => setSizes([...sizes, '']);
  const handleRemoveSize = (index: number) => {
    const newSizes = sizes.filter((_, i) => i !== index);
    setSizes(newSizes);
  };
  const handleSizeChange = (index: number, value: string) => {
    const newSizes = [...sizes];
    newSizes[index] = value;
    setSizes(newSizes);
  };

  const handleQtyChange = (color: string, size: string, value: string) => {
    setVariantQuantities({
      ...variantQuantities,
      [`${color}-${size}`]: value
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      validateAndAddFiles(event.target.files);
    }
  };

  const validateAndAddFiles = (files: FileList | null) => {
    if (!files) return;
    const filesArray = Array.from(files);
    const validImages = filesArray.filter(file => file.type.startsWith('image/'));
    
    if (validImages.length < filesArray.length) {
      setError('Only image files are allowed. Some files were ignored.');
    }
    
    setImageFiles(prev => [...prev, ...validImages]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    validateAndAddFiles(e.dataTransfer.files);
  };

  const removeImageFile = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setExistingImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handlePriceBlur = () => {
    if (price && !isNaN(parseFloat(price))) {
      setPrice(parseFloat(price).toFixed(2));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    let uploadedImageUrls: string[] = [];
    if (imageFiles.length > 0) {
      const formData = new FormData();
      imageFiles.forEach(file => formData.append('images', file));
      try {
        const uploadResponse = await axios.post('http://localhost:3001/api/upload-images', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        uploadedImageUrls = uploadResponse.data.imageUrls;
      } catch (err) {
        setError('Failed to upload images.');
        return;
      }
    }

    const finalImageUrls = [...existingImageUrls, ...uploadedImageUrls];

    // Prepare variants array
    const variantsToSubmit: any[] = [];
    let totalQty = 0;

    if (colors.length > 0 && sizes.length > 0) {
      colors.forEach(color => {
        sizes.forEach(size => {
          const qtyStr = variantQuantities[`${color}-${size}`] || '0';
          const qty = parseInt(qtyStr) || 0;
          if (color && size) {
            variantsToSubmit.push({ color, size, quantity: qty });
            totalQty += qty;
          }
        });
      });
    } else {
      totalQty = parseInt(generalQuantity) || 0;
    }

    const productData = {
      name,
      description,
      price: parseFloat(price),
      category,
      quantity: totalQty,
      imageUrls: finalImageUrls,
      variants: variantsToSubmit
    };

    try {
      if (product) {
        await axios.put(`http://localhost:3001/api/products/${product.id}`, productData);
      } else {
        await axios.post('http://localhost:3001/api/products', productData);
      }
      onSuccess();
    } catch (err) {
      setError('Failed to save product.');
    }
  };

  const handleDelete = async () => {
    if (!product) return;
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await axios.delete(`http://localhost:3001/api/products/${product.id}`);
        onSuccess();
      } catch (err) {
        setError('Failed to delete product.');
      }
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3, pb: 4 }}>
      {error && <Typography color="error">{error}</Typography>}
      
      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
          <TextField label="Product Name" value={name} onChange={(e) => setName(e.target.value)} fullWidth required />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} fullWidth multiline rows={2} />
        </Grid>
        <Grid size={{ xs: 6 }}>
          <TextField 
            label="Price" 
            value={price} 
            onChange={(e) => setPrice(e.target.value)} 
            onBlur={handlePriceBlur}
            fullWidth 
            type="number" 
            inputProps={{ step: '0.01' }} 
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
            required 
          />
        </Grid>
        <Grid size={{ xs: 6 }}>
          <FormControl fullWidth required>
            <InputLabel>Category</InputLabel>
            <Select value={category} label="Category" onChange={(e) => setCategory(e.target.value)}>
              <MenuItem value="shirts">Shirts</MenuItem>
              <MenuItem value="crewnecks">Crewnecks</MenuItem>
              <MenuItem value="hoodies">Hoodies</MenuItem>
              <MenuItem value="pants">Pants</MenuItem>
              <MenuItem value="hats">Hats</MenuItem>
              <MenuItem value="stickers">Stickers</MenuItem>
              <MenuItem value="wall art">Wall Art</MenuItem>
              <MenuItem value="accessories">Accessories</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        {colors.length === 0 && sizes.length === 0 && (
          <Grid size={{ xs: 12 }}>
            <TextField 
              label="Quantity" 
              value={generalQuantity} 
              onChange={(e) => setGeneralQuantity(e.target.value)} 
              fullWidth 
              type="number" 
              required 
            />
          </Grid>
        )}
      </Grid>

      {/* Variant Management */}
      <Box sx={{ mt: 4, mb: 2, p: 2, border: '1px solid #444', borderRadius: 2 }}>
        <Typography variant="subtitle1" sx={{ color: 'primary.main', fontWeight: 'bold' }}>Manage Variants</Typography>
        
        <Grid container spacing={4} sx={{ mt: 1 }}>
          <Grid size={{ xs: 6 }}>
            <Typography variant="subtitle2" gutterBottom>Colors</Typography>
            {colors.map((color, index) => (
              <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField size="small" value={color} onChange={(e) => handleColorChange(index, e.target.value)} placeholder="e.g. Black" fullWidth />
                <Button size="small" color="error" onClick={() => handleRemoveColor(index)}>Remove</Button>
              </Box>
            ))}
            <Button size="small" variant="outlined" onClick={handleAddColor} sx={{ mt: 1 }}>Add Color</Button>
          </Grid>
          
          <Grid size={{ xs: 6 }}>
            <Typography variant="subtitle2" gutterBottom>Sizes</Typography>
            {sizes.map((size, index) => (
              <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField size="small" value={size} onChange={(e) => handleSizeChange(index, e.target.value)} placeholder="e.g. M" fullWidth />
                <Button size="small" color="error" onClick={() => handleRemoveSize(index)}>Remove</Button>
              </Box>
            ))}
            <Button size="small" variant="outlined" onClick={handleAddSize} sx={{ mt: 1 }}>Add Size</Button>
          </Grid>
        </Grid>

        {colors.length > 0 && sizes.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>Stock Matrix</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${sizes.length + 1}, 1fr)`, gap: 1 }}>
              <Box></Box>
              {sizes.map(s => <Box key={s} sx={{ fontWeight: 'bold' }}>{s || '?'}</Box>)}
              {colors.map(c => (
                <React.Fragment key={c}>
                  <Box sx={{ fontWeight: 'bold' }}>{c || '?'}</Box>
                  {sizes.map(s => (
                    <TextField 
                      key={`${c}-${s}`} 
                      size="small" 
                      type="number" 
                      value={variantQuantities[`${c}-${s}`] || '0'} 
                      onChange={(e) => handleQtyChange(c, s, e.target.value)} 
                    />
                  ))}
                </React.Fragment>
              ))}
            </Box>
          </Box>
        )}
      </Box>

      {/* Image Upload */}
      <Box sx={{ mt: 4, mb: 2 }}>
        <Typography variant="subtitle1" sx={{ color: 'primary.main', fontWeight: 'bold', mb: 1 }}>Product Images</Typography>
        
        <Box
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          sx={{
            border: '2px dashed',
            borderColor: isDragging ? 'primary.main' : 'rgba(255, 255, 255, 0.2)',
            borderRadius: 3,
            p: 4,
            textAlign: 'center',
            backgroundColor: isDragging ? 'rgba(33, 150, 243, 0.05)' : 'rgba(255, 255, 255, 0.02)',
            transition: 'all 0.2s ease-in-out',
            cursor: 'pointer',
            position: 'relative',
            '&:hover': {
              borderColor: 'primary.main',
              backgroundColor: 'rgba(33, 150, 243, 0.03)',
            }
          }}
          onClick={() => document.getElementById('image-upload-input')?.click()}
        >
          <input
            type="file"
            id="image-upload-input"
            multiple
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <CloudUploadIcon sx={{ fontSize: 48, color: isDragging ? 'primary.main' : 'rgba(255, 255, 255, 0.4)', mb: 2 }} />
          <Typography variant="h6" sx={{ fontWeight: '500', mb: 0.5 }}>
            {isDragging ? 'Drop images here' : 'Click or drag images to upload'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Supports PNG, JPG, JPEG, WEBP
          </Typography>
        </Box>

        {/* Preview Section */}
        {(existingImageUrls.length > 0 || imageFiles.length > 0) && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', mt: 3, gap: 2 }}>
            {existingImageUrls.map((url, index) => (
              <Box key={`existing-${index}`} sx={{ position: 'relative' }}>
                <Box 
                  component="img" 
                  src={resolveImageUrl(url)} 
                  sx={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 2, border: '1px solid rgba(255, 255, 255, 0.1)' }} 
                />
                <Tooltip title="Remove Image">
                  <IconButton 
                    size="small" 
                    onClick={(e) => { e.stopPropagation(); removeExistingImage(index); }}
                    sx={{ position: 'absolute', top: -10, right: -10, bgcolor: 'error.main', color: 'white', '&:hover': { bgcolor: '#d32f2f' } }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            ))}
            {imageFiles.map((file, index) => (
              <Box key={`new-${index}`} sx={{ position: 'relative' }}>
                <Box 
                  component="img" 
                  src={URL.createObjectURL(file)} 
                  sx={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 2, border: '1px solid rgba(255, 255, 255, 0.1)' }} 
                />
                <Tooltip title="Remove Image">
                  <IconButton 
                    size="small" 
                    onClick={(e) => { e.stopPropagation(); removeImageFile(index); }}
                    sx={{ position: 'absolute', top: -10, right: -10, bgcolor: 'error.main', color: 'white', '&:hover': { bgcolor: '#d32f2f' } }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      <Button type="submit" variant="contained" size="large" fullWidth sx={{ mt: 2 }}>
        {product ? 'Update Product' : 'Add Product'}
      </Button>

      {product && (
        <Button 
          variant="outlined" 
          color="error" 
          size="medium" 
          fullWidth 
          onClick={handleDelete}
          sx={{ mt: 2 }}
        >
          Delete Product
        </Button>
      )}
    </Box>
  );
};

export default AddEditProductForm;
