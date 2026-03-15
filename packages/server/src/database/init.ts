import db from './db.ts';

const createTables = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      quantity REAL NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('shirts', 'crewnecks', 'hoodies', 'pants', 'hats', 'stickers', 'wall art', 'accessories')),
      imageUrls TEXT DEFAULT '[]'

    );

    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      FOREIGN KEY (product_id) REFERENCES products (id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      shipping_address TEXT,
      shipping_city TEXT,
      shipping_state TEXT,
      shipping_zip TEXT,
      shipping_country TEXT,
      billing_address TEXT,
      billing_city TEXT,
      billing_state TEXT,
      billing_zip TEXT,
      billing_country TEXT,
      total_amount REAL NOT NULL,
      orderTimestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders (id),
      FOREIGN KEY (product_id) REFERENCES products (id)
    );
  `);
};

createTables();

console.log('Database tables created successfully.');
