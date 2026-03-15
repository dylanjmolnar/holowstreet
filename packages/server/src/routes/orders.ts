import { Router } from 'express';
import db from '../database/db.ts';

const router = Router();

// Placeholder for email sending
const sendOrderConfirmationEmail = (order: any, customerEmail: string) => {
  console.log(`Sending order confirmation email to ${customerEmail} for Order ID: ${order.id}`);
  console.log('Order details:', order);
  // In a real application, you would integrate with an email service here (e.g., Nodemailer, SendGrid)
};

// POST to create a new order
router.post('/', (req, res) => {
  const { 
    customer_name, 
    customer_email, 
    shipping_address,
    shipping_city,
    shipping_state,
    shipping_zip,
    shipping_country,
    billing_address,
    billing_city,
    billing_state,
    billing_zip,
    billing_country,
    total_amount, 
    items 
  } = req.body;

  if (!customer_name || !customer_email || !total_amount || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Missing required fields or invalid items' });
  }

  let orderId;
  try {
    const orderStmt = db.prepare(
      `INSERT INTO orders (
        customer_name, customer_email, 
        shipping_address, shipping_city, shipping_state, shipping_zip, shipping_country,
        billing_address, billing_city, billing_state, billing_zip, billing_country,
        total_amount
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const orderResult = orderStmt.run(
      customer_name, customer_email, 
      shipping_address || null, shipping_city || null, shipping_state || null, shipping_zip || null, shipping_country || null,
      billing_address || null, billing_city || null, billing_state || null, billing_zip || null, billing_country || null,
      total_amount
    );
    orderId = orderResult.lastInsertRowid;

    const insertItemStmt = db.prepare('INSERT INTO order_items (order_id, product_id, variant_id, quantity, price, selected_color, selected_size) VALUES (?, ?, ?, ?, ?, ?, ?)');
    for (const item of items) {
      const { product_id, variant_id, quantity, price, color, size } = item;
      if (!product_id || !quantity || !price) {
        throw new Error('Invalid item in order');
      }
      insertItemStmt.run(orderId, product_id, variant_id || null, quantity, price, color || null, size || null);

      if (variant_id) {
        // Decrement specific variant inventory
        const updateVariantStmt = db.prepare('UPDATE product_variants SET quantity = quantity - ? WHERE id = ?');
        updateVariantStmt.run(quantity, variant_id);
      }

      // Decrement total inventory (informative only now)
      const updateInventoryStmt = db.prepare('UPDATE inventory SET quantity = quantity - ? WHERE product_id = ?');
      updateInventoryStmt.run(quantity, product_id);

      // Decrement product directly to reflect frontend immediately
      const updateProductStmt = db.prepare('UPDATE products SET quantity = quantity - ? WHERE id = ?');
      updateProductStmt.run(quantity, product_id);
    }

    // Fetch the newly created order to get its orderTimestamp
    const newOrder: any = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);

    // Send confirmation email
    sendOrderConfirmationEmail({ id: orderId, customer_name, customer_email, total_amount, items, orderTimestamp: newOrder?.orderTimestamp }, customer_email); // Pass orderTimestamp

    res.status(201).json({ orderId, orderTimestamp: newOrder?.orderTimestamp }); // Return orderTimestamp
  } catch (error: any) {
    console.error('Error creating order:', error.message);
    res.status(500).json({ message: 'Failed to create order', error: error.message });
  }
});

// GET all orders
router.get('/', (req, res) => {
  try {
    const orders = db.prepare('SELECT * FROM orders').all();
    res.json(orders);
  } catch (error: any) {
    console.error('Error fetching orders:', error.message);
    res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
  }
});

// GET a single order by id with its items
router.get('/:id', (req, res) => {
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(req.params.id);
    res.json({ ...order, items });
  } catch (error: any) {
    console.error('Error fetching order:', error.message);
    res.status(500).json({ message: 'Failed to fetch order', error: error.message });
  }
});

export default router;
