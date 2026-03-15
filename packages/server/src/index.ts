import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import productsRouter from './routes/products.ts';
import ordersRouter from './routes/orders.ts';
import uploadsRouter from './routes/uploads.ts';
import stripeRouter from './routes/stripe.ts';
import paypalRouter from './routes/paypal.ts';
import path from 'path';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Serve static files from the 'uploads' directory
const uploadDir = process.env.RENDER_DISK_PATH 
  ? path.join(process.env.RENDER_DISK_PATH, 'uploads')
  : path.join(process.cwd(), 'public', 'uploads');
app.use('/uploads', express.static(uploadDir));

app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/upload-images', uploadsRouter);
app.use('/api/stripe', stripeRouter);
app.use('/api/paypal', paypalRouter);

app.get('/', (req, res) => {
  res.send('Hello from the server!');
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
