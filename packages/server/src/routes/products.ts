import { Router } from 'express';
import db from '../database/db.ts';
import fs from 'fs';
import path from 'path';

const router = Router();

// Helper function to parse imageUrls
const parseImageUrls = (product: any) => {
  if (product && product.imageUrls && typeof product.imageUrls === 'string') {
    try {
      product.imageUrls = JSON.parse(product.imageUrls);
    } catch (e) {
      console.error('Failed to parse imageUrls for product:', product.id, e);
      product.imageUrls = []; // Default to empty array on parse error
    }
  } else if (product && !product.imageUrls) {
      product.imageUrls = [];
  }
  return product;
};

// Helper function to delete image files from disk
const deleteImageFiles = (imageUrls: string[]) => {
  imageUrls.forEach(url => {
    if (url.startsWith('/uploads/')) {
      const fileName = url.replace('/uploads/', '');
      const filePath = path.join(process.cwd(), 'public', 'uploads', fileName);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log(`Deleted image file: ${filePath}`);
        } catch (err) {
          console.error(`Error deleting image file ${filePath}:`, err);
        }
      }
    }
  });
};

// GET all products
router.get('/', (req, res) => {
  const products = db.prepare('SELECT * FROM products').all().map(parseImageUrls);
  
  // Attach variants to each product
  const productsWithVariants = products.map(product => {
    const variants = db.prepare('SELECT * FROM product_variants WHERE product_id = ?').all(product.id);
    return { ...product, variants };
  });

  res.json(productsWithVariants);
});

// GET a single product by id
router.get('/:id', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (product) {
    const parsedProduct = parseImageUrls(product);
    const variants = db.prepare('SELECT * FROM product_variants WHERE product_id = ?').all(req.params.id);
    res.json({ ...parsedProduct, variants });
  } else {
    res.status(404).json({ message: 'Product not found' });
  }
});

// POST a new product
router.post('/', (req, res) => {
  const { name, description, price, category, quantity, imageUrls, variants } = req.body;
  if (!name || !price || !category) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const imageUrlsString = JSON.stringify(imageUrls || []);

  const productStmt = db.prepare('INSERT INTO products (name, description, price, category, quantity, imageUrls) VALUES (?, ?, ?, ?, ?, ?)');
  const productResult = productStmt.run(name, description, price, category, quantity || 0, imageUrlsString);
  const productId = productResult.lastInsertRowid;

  const inventoryStmt = db.prepare('INSERT INTO inventory (product_id, quantity) VALUES (?, ?)');
  inventoryStmt.run(productId, quantity || 0);

  // Add variants
  if (variants && Array.isArray(variants)) {
    const variantStmt = db.prepare('INSERT INTO product_variants (product_id, color, size, quantity) VALUES (?, ?, ?, ?)');
    for (const v of variants) {
      variantStmt.run(productId, v.color, v.size, v.quantity);
    }
  }

  res.status(201).json({ id: productId });
});

// PUT to update a product
router.put('/:id', (req, res) => {
    const { name, description, price, category, quantity, imageUrls, variants } = req.body;
    if (!name || !price || !category) {
        return res.status(400).json({ message: 'Missing required fields' });
    }
    
    const imageUrlsString = JSON.stringify(imageUrls || []);

    // Handle image cleanup for removed images
    const currentProduct = db.prepare('SELECT imageUrls FROM products WHERE id = ?').get(req.params.id) as any;
    if (currentProduct) {
        const currentUrls = currentProduct.imageUrls ? JSON.parse(currentProduct.imageUrls) : [];
        const removedUrls = currentUrls.filter((url: string) => !imageUrls.includes(url));
        deleteImageFiles(removedUrls);
    }

    const productStmt = db.prepare('UPDATE products SET name = ?, description = ?, price = ?, category = ?, quantity = ?, imageUrls = ? WHERE id = ?');
    const productResult = productStmt.run(name, description, price, category, quantity || 0, imageUrlsString, req.params.id);
    
    if (productResult.changes === 0) {
        return res.status(404).json({ message: 'Product not found' });
    }
    
    const inventoryStmt = db.prepare('UPDATE inventory SET quantity = ? WHERE product_id = ?');
    inventoryStmt.run(quantity || 0, req.params.id);

    // Update variants: simplicity over optimization, delete and re-insert
    db.prepare('DELETE FROM product_variants WHERE product_id = ?').run(req.params.id);
    if (variants && Array.isArray(variants)) {
      const variantStmt = db.prepare('INSERT INTO product_variants (product_id, color, size, quantity) VALUES (?, ?, ?, ?)');
      for (const v of variants) {
        variantStmt.run(req.params.id, v.color, v.size, v.quantity);
      }
    }
    
    res.json({ message: 'Product updated successfully' });
});


// DELETE a product
router.delete('/:id', (req, res) => {
  try {
    const productId = req.params.id;

    // Handle image cleanup before deletion
    const currentProduct = db.prepare('SELECT imageUrls FROM products WHERE id = ?').get(productId) as any;
    if (currentProduct) {
        const currentUrls = currentProduct.imageUrls ? JSON.parse(currentProduct.imageUrls) : [];
        deleteImageFiles(currentUrls);
    }

    // Use a transaction for safe multi-table deletion
    const deleteTransaction = db.transaction(() => {
      // 1. Delete associated variants
      db.prepare('DELETE FROM product_variants WHERE product_id = ?').run(productId);
      
      // 2. Delete inventory record
      db.prepare('DELETE FROM inventory WHERE product_id = ?').run(productId);
      
      // 3. Delete associated order items
      db.prepare('DELETE FROM order_items WHERE product_id = ?').run(productId);
      
      // 4. Finally delete the product itself
      const result = db.prepare('DELETE FROM products WHERE id = ?').run(productId);
      return result;
    });

    const productResult = deleteTransaction();

    if (productResult.changes === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: 'Internal server error while deleting product' });
  }
});

export default router;
