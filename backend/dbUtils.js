const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'ecommerce.db');

// Sample products data used across all database operations
const sampleProducts = [
  { name: 'Smartphone XYZ', description: 'Latest smartphone with advanced features', price: 799.99, imageUrl: '/images/smartphone.jpg', category: 'Electronics', stock: 15 },
  { name: 'Laptop Pro', description: 'High-performance laptop for professionals', price: 1299.99, imageUrl: '/images/laptop.jpg', category: 'Electronics', stock: 10 },
  { name: 'Wireless Headphones', description: 'Premium sound quality with noise cancellation', price: 199.99, imageUrl: '/images/headphones.jpg', category: 'Electronics', stock: 20 },
  { name: 'Running Shoes', description: 'Comfortable shoes for daily running', price: 99.99, imageUrl: '/images/shoes.jpg', category: 'Footwear', stock: 30 },
  { name: 'Coffee Machine', description: 'Premium coffee machine with multiple brewing options', price: 149.99, imageUrl: '/images/coffeemachine.jpg', category: 'Home Appliances', stock: 12 },
  { name: 'Backpack', description: 'Durable backpack with multiple compartments', price: 59.99, imageUrl: '/images/backpack.jpg', category: 'Accessories', stock: 25 },
  { name: 'Smart Watch', description: 'Track your fitness and notifications', price: 249.99, imageUrl: '/images/smartwatch.jpg', category: 'Wearables', stock: 18 }
];

// Function to initialize database tables
function initializeDatabase(db) {
  console.log('Initializing database tables...');
  
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Products table
      db.run(`CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        imageUrl TEXT,
        category TEXT,
        stock INTEGER DEFAULT 0
      )`);

      // Comments table
      db.run(`CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        productId INTEGER NOT NULL,
        username TEXT NOT NULL,
        comment TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (productId) REFERENCES products (id)
      )`);

      // Comment replies table
      db.run(`CREATE TABLE IF NOT EXISTS comment_replies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        commentId INTEGER NOT NULL,
        isSystem INTEGER DEFAULT 0,
        reply TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (commentId) REFERENCES comments (id)
      )`);

      // Orders table
      db.run(`CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customerName TEXT NOT NULL,
        email TEXT NOT NULL,
        address TEXT NOT NULL,
        phone TEXT,
        totalAmount REAL NOT NULL,
        status TEXT DEFAULT 'pending',
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Order items table
      db.run(`CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        orderId INTEGER NOT NULL,
        productId INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL,
        FOREIGN KEY (orderId) REFERENCES orders (id),
        FOREIGN KEY (productId) REFERENCES products (id)
      )`);
      
      resolve();
    });
  });
}

// Function to populate the database with sample data
function populateDatabase(db) {
  console.log('Populating database with sample data...');

  return new Promise((resolve, reject) => {
    // Clear existing products
    db.run("DELETE FROM products", (err) => {
      if (err) {
        console.error('Error deleting products:', err.message);
        reject(err);
        return;
      }
      
      console.log('Existing products deleted');
      
      // Reset the autoincrement counter
      db.run("DELETE FROM sqlite_sequence WHERE name='products'", (err) => {
        if (err) {
          console.error('Error resetting product ID sequence:', err.message);
        }
      });
      
      // Insert sample products
      const stmt = db.prepare("INSERT INTO products (name, description, price, imageUrl, category, stock) VALUES (?, ?, ?, ?, ?, ?)");
      sampleProducts.forEach(product => {
        stmt.run(product.name, product.description, product.price, product.imageUrl, product.category, product.stock);
      });
      stmt.finalize();
      console.log('Sample products added to database');
      
      // Add sample comment
      db.get("SELECT COUNT(*) as count FROM comments", (err, row) => {
        if (err) {
          console.error('Error checking comments:', err.message);
          reject(err);
          return;
        }
        
        if (row.count === 0) {
          db.run(
            "INSERT INTO comments (productId, username, comment) VALUES (1, 'TestUser', 'Great smartphone! I love the camera quality.')",
            function(err) {
              if (err) {
                console.error('Error adding sample comment:', err.message);
                reject(err);
                return;
              }
              
              const commentId = this.lastID;
              
              // Add sample reply
              db.run(
                "INSERT INTO comment_replies (commentId, isSystem, reply) VALUES (?, 1, ?)",
                [commentId, "Thank you for your comment! Our team appreciates your feedback."],
                function(err) {
                  if (err) {
                    console.error('Error adding sample reply:', err.message);
                    reject(err);
                  } else {
                    console.log('Sample comment and reply added');
                    resolve();
                  }
                }
              );
            }
          );
        } else {
          resolve();
        }
      });
    });
  });
}

// Reset and recreate the database
async function resetDatabase() {
  console.log('Resetting database...');
  
  // Delete existing database if it exists
  if (fs.existsSync(dbPath)) {
    try {
      fs.unlinkSync(dbPath);
      console.log('Existing database deleted');
    } catch (error) {
      console.error('Error deleting database:', error.message);
      console.log('Will try to connect to existing database instead');
    }
  }
  
  // Create new database
  const db = new sqlite3.Database(dbPath);
  
  try {
    // Initialize tables
    await initializeDatabase(db);
    
    // Populate with sample data
    await populateDatabase(db);
    
    console.log('Database reset and initialized successfully');
  } catch (error) {
    console.error('Error during database reset:', error);
  } finally {
    // Close database
    db.close();
  }
}

// Update existing database
async function updateDatabase() {
  console.log('Updating existing database...');
  
  const db = new sqlite3.Database(dbPath);
  
  try {
    // Initialize tables in case they don't exist
    await initializeDatabase(db);
    
    // Update with fresh data
    await populateDatabase(db);
    
    console.log('Database updated successfully');
  } catch (error) {
    console.error('Error during database update:', error);
  } finally {
    // Close database
    db.close();
  }
}

// Update a specific product (e.g., Coffee Machine)
function updateProduct(productName, newData) {
  console.log(`Updating product: ${productName}...`);
  
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);
    
    const query = `UPDATE products SET 
      name = ?, 
      description = ?, 
      imageUrl = ?
      WHERE name LIKE ?`;
    
    db.run(
      query,
      [newData.name, newData.description, newData.imageUrl, `%${productName}%`],
      function(err) {
        if (err) {
          console.error('Error updating product:', err.message);
          reject(err);
        } else {
          console.log(`Updated ${productName}. Rows affected: ${this.changes}`);
          resolve(this.changes);
        }
      }
    );
    
    // Close database
    db.close();
  });
}

// Export the functions for command-line use
module.exports = {
  resetDatabase,
  updateDatabase,
  updateProduct
};

// If this file is being run directly, check for command line arguments
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'reset':
      resetDatabase();
      break;
    case 'update':
      updateDatabase();
      break;
    case 'update-product':
      if (args.length < 4) {
        console.error('Usage: node dbUtils.js update-product <oldName> <newName> <description> <imageUrl>');
        process.exit(1);
      }
      
      updateProduct(args[1], {
        name: args[2],
        description: args[3],
        imageUrl: args[4]
      }).then(() => console.log('Product updated successfully'))
        .catch(err => console.error('Failed to update product:', err));
      break;
    default:
      console.log('Available commands:');
      console.log('  reset - Reset and recreate the database');
      console.log('  update - Update existing database with sample data');
      console.log('  update-product <oldName> <newName> <description> <imageUrl> - Update a specific product');
      break;
  }
} 