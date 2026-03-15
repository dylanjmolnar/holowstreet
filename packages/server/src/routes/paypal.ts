import { Router } from 'express';
import db from '../database/db.ts';
import dotenv from 'dotenv';

dotenv.config();

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || '';
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || '';
const PAYPAL_BASE_URL = 'https://api-m.sandbox.paypal.com'; // Use sandbox

const router = Router();

// Get PayPal access token
async function getPayPalAccessToken(): Promise<string> {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  const data = await response.json();
  return data.access_token;
}

// Create a PayPal order
router.post('/create-order', async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const accessToken = await getPayPalAccessToken();

    const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'USD',
            value: amount.toFixed(2),
          },
        }],
      }),
    });

    const data = await response.json();
    res.json({ orderID: data.id });
  } catch (error: any) {
    console.error('PayPal create-order error:', error.message);
    res.status(500).json({ message: 'Failed to create PayPal order', error: error.message });
  }
});

// Capture a PayPal order after approval
router.post('/capture-order', async (req, res) => {
  const { 
    orderID, 
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

  if (!orderID || !customer_name || !customer_email || !total_amount || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    // Capture the payment with PayPal
    const accessToken = await getPayPalAccessToken();
    const captureResponse = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderID}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const captureData = await captureResponse.json();

    if (captureData.status !== 'COMPLETED') {
      return res.status(400).json({ message: 'Payment not completed', status: captureData.status });
    }

    // Payment confirmed — create order in DB
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
    console.error('PayPal capture-order error:', error.message);
    res.status(500).json({ message: 'Failed to capture PayPal order', error: error.message });
  }
});

export default router;
