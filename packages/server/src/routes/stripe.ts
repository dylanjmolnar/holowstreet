import { Router } from 'express';
import Stripe from 'stripe';
import db from '../database/db.ts';
import dotenv from 'dotenv';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

const router = Router();

// Create a PaymentIntent
router.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount } = req.body; // amount in dollars

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe uses cents
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error: any) {
    console.error('Stripe create-payment-intent error:', error.message);
    res.status(500).json({ message: 'Failed to create payment intent', error: error.message });
  }
});

// Confirm order after successful Stripe payment
router.post('/confirm-order', (req, res) => {
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
    items, 
    payment_intent_id 
  } = req.body;

  if (!customer_name || !customer_email || !total_amount || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const transaction = db.transaction(() => {
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
      const orderId = orderResult.lastInsertRowid;

      const insertItemStmt = db.prepare(
        'INSERT INTO order_items (order_id, product_id, variant_id, quantity, price, selected_color, selected_size) VALUES (?, ?, ?, ?, ?, ?, ?)'
      );

      for (const item of items) {
        const { product_id, variant_id, quantity, price, color, size } = item;
        if (!product_id || !quantity || !price) {
          throw new Error('Invalid item in order');
        }
        insertItemStmt.run(orderId, product_id, variant_id || null, quantity, price, color || null, size || null);

        if (variant_id) {
          db.prepare('UPDATE product_variants SET quantity = quantity - ? WHERE id = ?').run(quantity, variant_id);
        }
        db.prepare('UPDATE inventory SET quantity = quantity - ? WHERE product_id = ?').run(quantity, product_id);
        db.prepare('UPDATE products SET quantity = quantity - ? WHERE id = ?').run(quantity, product_id);
      }

      const newOrder: any = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
      return { orderId, orderTimestamp: newOrder?.orderTimestamp };
    });

    const result = transaction();
    res.status(201).json(result);
  } catch (error: any) {
    console.error('Stripe confirm-order error:', error.message);
    res.status(500).json({ message: 'Failed to create order', error: error.message });
  }
});

export default router;
