const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const sqlite3 = require('sqlite3').verbose();
const llmChatbot = require('./llmChatbot'); // Import the LLM chatbot module
const cookieParser = require('cookie-parser');
const auth = require('./auth');
const jwt = require('jsonwebtoken');

// Secret key for JWT token
const JWT_SECRET = process.env.JWT_SECRET || 'eShop-super-secret-key-change-in-production';

// Create Express app
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Connect to SQLite database
const db = new sqlite3.Database('./ecommerce.db', (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

// Initialize database tables
function initializeDatabase() {
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

    // Users table for authentication
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT CHECK(role IN ('customer', 'staff')) NOT NULL DEFAULT 'customer',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Insert sample products if none exist
    db.get("SELECT COUNT(*) as count FROM products", (err, row) => {
      if (err) {
        console.error(err.message);
        return;
      }
      
      if (row.count === 0) {
        const sampleProducts = [
          { name: 'Smartphone XYZ', description: 'Latest smartphone with advanced features', price: 799.99, imageUrl: '/images/smartphone.jpg', category: 'Electronics', stock: 15 },
          { name: 'Laptop Pro', description: 'High-performance laptop for professionals', price: 1299.99, imageUrl: '/images/laptop.jpg', category: 'Electronics', stock: 10 },
          { name: 'Wireless Headphones', description: 'Premium sound quality with noise cancellation', price: 199.99, imageUrl: '/images/headphones.jpg', category: 'Electronics', stock: 20 },
          { name: 'Running Shoes', description: 'Comfortable shoes for daily running', price: 99.99, imageUrl: '/images/shoes.jpg', category: 'Footwear', stock: 30 },
          { name: 'Coffee Machine', description: 'Premium coffee machine with multiple brewing options', price: 149.99, imageUrl: '/images/coffeemachine.jpg', category: 'Home Appliances', stock: 12 },
          { name: 'Backpack', description: 'Durable backpack with multiple compartments', price: 59.99, imageUrl: '/images/backpack.jpg', category: 'Accessories', stock: 25 },
          { name: 'Smart Watch', description: 'Track your fitness and notifications', price: 249.99, imageUrl: '/images/smartwatch.jpg', category: 'Wearables', stock: 18 }
        ];
        
        const stmt = db.prepare("INSERT INTO products (name, description, price, imageUrl, category, stock) VALUES (?, ?, ?, ?, ?, ?)");
        sampleProducts.forEach(product => {
          stmt.run(product.name, product.description, product.price, product.imageUrl, product.category, product.stock);
        });
        stmt.finalize();
        console.log('Sample products added to database');
      }
    });
    
    // Insert sample staff user if none exist
    db.get("SELECT COUNT(*) as count FROM users WHERE role = 'staff'", (err, row) => {
      if (err) {
        console.error(err.message);
        return;
      }
      
      if (row.count === 0) {
        // Insert a default staff user (password: staffpass123)
        db.run(
          "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)",
          ["support_staff", "admin@eshop.com", "$2b$10$GCtkM1X3IuZQq.2edSgYOuKKVy9HfccS/Y3cZMwvgOiA19gxD31JS", "staff"]
        );
        console.log('Default staff user created');
      }
    });
  });
}

// API Routes

// Authentication routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const userData = req.body;
    const user = await auth.registerUser(db, userData);
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { usernameOrEmail, password, rememberMe } = req.body;
    const { user, token, expiresIn } = await auth.loginUser(db, usernameOrEmail, password, rememberMe);
    
    // Set token as HTTP-only cookie with expiration based on rememberMe
    res.cookie('authToken', token, {
      httpOnly: true,
      maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000, // 7 days or 24 hours
      sameSite: 'strict'
    });
    
    res.json({
      success: true,
      message: 'Login successful',
      user
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message
    });
  }
});

app.get('/api/auth/logout', (req, res) => {
  res.clearCookie('authToken');
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

app.get('/api/auth/me', auth.authenticateToken, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role
    }
  });
});

// Password reset request endpoint
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    const { resetToken, username } = await auth.generateResetToken(db, email);
    
    // In a real app, you would send an email with the reset link
    // For this demo, we'll just return the token in the response
    res.status(200).json({
      success: true,
      message: 'Password reset link has been sent to your email',
      // Only for demo purposes - in production, don't return this token
      resetToken,
      username
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Password reset endpoint
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required'
      });
    }
    
    // Validate password
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }
    
    await auth.resetPassword(db, token, newPassword);
    
    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get user profile
app.get('/api/auth/profile', auth.authenticateToken, (req, res) => {
  // Get user details from the database
  db.get('SELECT id, username, email, role, created_at FROM users WHERE id = ?', [req.user.id], (err, user) => {
    if (err) {
      return res.status(500).json({ 
        success: false,
        message: err.message 
      });
    }
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    res.json({
      success: true,
      user
    });
  });
});

// Update user profile
app.put('/api/auth/profile', auth.authenticateToken, async (req, res) => {
  const { username, email } = req.body;
  
  // Validate input
  if (!username || !email) {
    return res.status(400).json({ 
      success: false,
      message: 'Username and email are required' 
    });
  }
  
  // Check if username or email already exists (and is not the current user)
  db.get(
    'SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?',
    [username, email, req.user.id],
    (err, existingUser) => {
      if (err) {
        return res.status(500).json({ 
          success: false,
          message: err.message 
        });
      }
      
      if (existingUser) {
        return res.status(400).json({ 
          success: false,
          message: 'Username or email already in use' 
        });
      }
      
      // Update user profile
      db.run(
        'UPDATE users SET username = ?, email = ? WHERE id = ?',
        [username, email, req.user.id],
        (err) => {
          if (err) {
            return res.status(500).json({ 
              success: false,
              message: err.message 
            });
          }
          
          res.json({
            success: true,
            message: 'Profile updated successfully',
            user: {
              id: req.user.id,
              username,
              email,
              role: req.user.role
            }
          });
        }
      );
    }
  );
});

// Protect staff-only routes
app.get('/api/admin/users', auth.authenticateToken, auth.requireStaffRole, (req, res) => {
  db.all('SELECT id, username, email, role, created_at FROM users', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get all products
app.get('/api/products', (req, res) => {
  db.all("SELECT * FROM products", (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get single product
app.get('/api/products/:id', (req, res) => {
  const id = req.params.id;
  db.get("SELECT * FROM products WHERE id = ?", [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json(row);
  });
});

// Get comments for a product
app.get('/api/products/:id/comments', (req, res) => {
  const productId = req.params.id;
  
  db.all(`
    SELECT c.*, (
      SELECT json_group_array(json_object(
        'id', cr.id, 
        'reply', cr.reply, 
        'isSystem', cr.isSystem, 
        'timestamp', cr.timestamp
      )) 
      FROM comment_replies cr 
      WHERE cr.commentId = c.id
    ) as replies
    FROM comments c
    WHERE c.productId = ?
  `, [productId], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    // Parse the JSON string for replies
    rows.forEach(row => {
      try {
        row.replies = JSON.parse(row.replies);
      } catch (e) {
        row.replies = [];
      }
    });
    
    res.json(rows);
  });
});

// Add a comment to a product
app.post('/api/products/:id/comments', (req, res) => {
  const productId = req.params.id;
  const { username, comment } = req.body;
  
  if (!username || !comment) {
    return res.status(400).json({ error: 'Username and comment are required' });
  }
  
  db.run(
    "INSERT INTO comments (productId, username, comment) VALUES (?, ?, ?)",
    [productId, username, comment],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      // Automatically add a system reply
      const commentId = this.lastID;
      db.run(
        "INSERT INTO comment_replies (commentId, isSystem, reply) VALUES (?, 1, ?)",
        [commentId, "Thank you for your comment! Our team will review it shortly."],
        function(err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          
          res.status(201).json({ 
            id: commentId, 
            message: 'Comment added successfully' 
          });
        }
      );
    }
  );
});

// Reply to a comment
app.post('/api/comments/:id/reply', (req, res) => {
  const commentId = req.params.id;
  const { reply, isSystem = 0 } = req.body;
  
  if (!reply) {
    return res.status(400).json({ error: 'Reply text is required' });
  }
  
  db.run(
    "INSERT INTO comment_replies (commentId, isSystem, reply) VALUES (?, ?, ?)",
    [commentId, isSystem, reply],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      res.status(201).json({ 
        id: this.lastID, 
        message: 'Reply added successfully' 
      });
    }
  );
});

// Create new order
app.post('/api/orders', (req, res) => {
  const { customerName, email, address, phone, items, totalAmount } = req.body;
  
  if (!customerName || !email || !address || !items || !totalAmount) {
    return res.status(400).json({ error: 'Missing required order information' });
  }
  
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    db.run(
      "INSERT INTO orders (customerName, email, address, phone, totalAmount) VALUES (?, ?, ?, ?, ?)",
      [customerName, email, address, phone, totalAmount],
      function(err) {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: err.message });
        }
        
        const orderId = this.lastID;
        const stmt = db.prepare("INSERT INTO order_items (orderId, productId, quantity, price) VALUES (?, ?, ?, ?)");
        
        let hasError = false;
        
        // Insert order items
        items.forEach(item => {
          stmt.run(orderId, item.productId, item.quantity, item.price, (err) => {
            if (err) {
              hasError = true;
              db.run('ROLLBACK');
              return res.status(500).json({ error: err.message });
            }
          });
          
          // Update stock
          if (!hasError) {
            db.run(
              "UPDATE products SET stock = stock - ? WHERE id = ?",
              [item.quantity, item.productId]
            );
          }
        });
        
        stmt.finalize();
        
        if (!hasError) {
          db.run('COMMIT');
          res.status(201).json({ 
            id: orderId, 
            message: 'Order created successfully' 
          });
        }
      }
    );
  });
});

// Socket.IO middleware for authentication
io.use((socket, next) => {
  const token = socket.handshake.auth.token || socket.handshake.headers.cookie?.split('=')[1];
  
  if (!token) {
    return next(new Error("Authentication required"));
  }
  
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return next(new Error("Invalid token"));
    }
    
    // Store user data in socket
    socket.user = decoded;
    next();
  });
});

// Socket.IO for live chat
io.on('connection', (socket) => {
  console.log('User connected:', socket.id, 'as', socket.user.username, 'with role', socket.user.role);
  
  // Store conversation history for this socket
  const conversationHistory = [];
  
  // Join a chat room for a specific user
  socket.on('join_chat', async (userId) => {
    // Only allow customers to join their own chat or staff to join any chat
    if (socket.user.role === 'customer' && socket.user.id !== parseInt(userId)) {
      socket.emit('error', { message: 'Unauthorized access' });
      return;
    }
    
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined chat`);
    
    // Clear any previous context for this user
    llmChatbot.clearUserContext(userId);
    
    // Generate welcome message
    let welcomeMessage = 'Welcome to eShop customer support! How can I help you today?';
    
    try {
      // Try to get a personalized welcome message from the LLM
      welcomeMessage = await llmChatbot.generateLLMResponse("I'm a new customer just browsing the site", userId);
      
      // Clear this initial exchange from context to avoid confusion
      llmChatbot.clearUserContext(userId);
    } catch (error) {
      console.error('Error generating welcome message:', error);
    }
    
    // Send welcome message after a short delay
    setTimeout(() => {
      const welcomeMessageObj = {
        userId,
        message: welcomeMessage,
        isCustomer: false,
        isAutomatic: true,
        timestamp: new Date().toISOString()
      };
      io.to(`user_${userId}`).emit('receive_message', welcomeMessageObj);
      
      // Add to conversation history
      conversationHistory.push(welcomeMessageObj);
    }, 1000);
  });
  
  // Support agent joining a chat
  socket.on('join_chat_as_agent', (data) => {
    // Only allow staff to join as agents
    if (socket.user.role !== 'staff') {
      socket.emit('error', { message: 'Unauthorized: Only support staff can join as agents' });
      return;
    }
    
    const { userId, agentName } = data;
    socket.join(`user_${userId}`);
    console.log(`Agent ${agentName} joined chat for user ${userId}`);
    
    // Store that this agent is handling this customer
    socket.agentFor = userId;
    socket.agentName = agentName;
  });
  
  // Handle human support representative joining the chat
  socket.on('human_joined', (data) => {
    // Only allow staff to send these events
    if (socket.user.role !== 'staff') {
      socket.emit('error', { message: 'Unauthorized: Only support staff can join chats' });
      return;
    }
    
    const { userId, agentName } = data;
    
    // Broadcast to the specific user that human support has joined
    io.to(`user_${userId}`).emit('human_joined', {
      userId,
      agentName: agentName || 'Customer Support'
    });
    
    console.log(`Human support (${agentName}) joined for user ${userId}`);
  });
  
  // Handle chat messages
  socket.on('send_message', async (data) => {
    const { userId, message, isCustomer } = data;
    
    // Validate the sender is authorized
    if (isCustomer) {
      // If message is marked as from customer, verify sender is that customer
      if (socket.user.role === 'customer' && socket.user.id !== parseInt(userId)) {
        socket.emit('error', { message: 'Unauthorized: Cannot send messages on behalf of other users' });
        return;
      }
    } else {
      // If message is from staff, verify sender is staff
      if (socket.user.role !== 'staff') {
        socket.emit('error', { message: 'Unauthorized: Only staff can send support messages' });
        return;
      }
    }
    
    // Add message to conversation history
    const customerMessage = {
      ...data,
      timestamp: new Date().toISOString()
    };
    conversationHistory.push(customerMessage);
    
    // Store message in database if needed
    
    // Send to specific user's room
    if (isCustomer) {
      // Customer message - broadcast to all support staff
      socket.broadcast.emit('receive_message', {
        userId,
        message,
        isCustomer: true,
        timestamp: new Date().toISOString()
      });
      
      // Generate and send automated response if appropriate
      if (llmChatbot.shouldUseLLM(message, userId, conversationHistory)) {
        // "Typing" indicator
        io.to(`user_${userId}`).emit('typing_indicator', { isTyping: true });
        
        try {
          // Generate response using LLM
          const response = await llmChatbot.generateLLMResponse(message, userId);
          
          // Simulate typing delay for more natural interaction
          const typingDelay = Math.min(response.length * 20, 1500); // Max 1.5 seconds
          
          setTimeout(() => {
            // Stop typing indicator
            io.to(`user_${userId}`).emit('typing_indicator', { isTyping: false });
            
            const botResponse = {
              userId,
              message: response,
              isCustomer: false,
              isAutomatic: true,
              timestamp: new Date().toISOString()
            };
            
            // Send to the customer
            io.to(`user_${userId}`).emit('receive_message', botResponse);
            
            // And also to support staff
            socket.broadcast.emit('receive_message', botResponse);
            
            // Add bot response to conversation history
            conversationHistory.push(botResponse);
          }, typingDelay);
        } catch (error) {
          console.error('Error generating LLM response:', error);
          io.to(`user_${userId}`).emit('typing_indicator', { isTyping: false });
        }
      } else {
        // Emotion detection indicates this needs human attention
        // Notify support staff about needed intervention
        socket.broadcast.emit('human_needed', {
          userId,
          message,
          reason: 'Negative emotion detected'
        });
        
        // Notify customer that a human will join shortly
        const handoffMessage = {
          userId,
          message: "I notice you might be experiencing some frustration. I'm connecting you with a customer service representative who will be with you shortly to help resolve your concern.",
          isCustomer: false,
          isAutomatic: true,
          isHandoff: true,
          timestamp: new Date().toISOString()
        };
        
        io.to(`user_${userId}`).emit('receive_message', handoffMessage);
        conversationHistory.push(handoffMessage);
      }
    } else {
      // Support staff message - send only to the specific customer
      io.to(`user_${userId}`).emit('receive_message', {
        message,
        isCustomer: false,
        timestamp: new Date().toISOString()
      });
    }
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // If this was an agent, notify their customers they've left
    if (socket.agentFor) {
      const handoffMessage = {
        userId: socket.agentFor,
        message: `${socket.agentName || 'Customer support'} has left the chat. Another representative will assist you shortly.`,
        isCustomer: false,
        isSystem: true,
        timestamp: new Date().toISOString()
      };
      
      io.to(`user_${socket.agentFor}`).emit('receive_message', handoffMessage);
    }
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});