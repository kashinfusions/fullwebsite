require('dotenv').config();

const express = require("express");
const mysql = require("mysql2");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware (VERY IMPORTANT for POST/PUT)
app.use(express.json());

// Serve static files from parent directory
app.use(express.static(path.join(__dirname, "..")));

// 🔗 MySQL connection
const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "sylkyla",
  password: process.env.DB_PASSWORD || "Gu!doM!sta5466!",
  database: process.env.DB_NAME || "kashinfusions"
});

// Connect to DB
db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err);
    return;
  }
  console.log("✅ Connected to MySQL database");
});


// =======================
// 🏠 ROOT ROUTE
// =======================

// Serve index.html at root
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "index.html"));
});


// =======================
// 📦 PRODUCT ROUTES
// =======================

// ✅ GET all active products
app.get("/products", (req, res) => {
  const sql = `
    SELECT id, name, price, description, image_url, stock
    FROM products
    WHERE is_active = TRUE
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error fetching products");
    }

    res.json(results);
  });
});


// ✅ GET single product
app.get("/products/:id", (req, res) => {
  const { id } = req.params;

  const sql = "SELECT * FROM products WHERE id = ?";

  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error fetching product");
    }

    res.json(results[0]);
  });
});


// ✅ CREATE product
app.post("/products", (req, res) => {
  const { name, price, description, image_url, stock } = req.body;

  const sql = `
    INSERT INTO products (name, price, description, image_url, stock)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(sql, [name, price, description, image_url, stock], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error adding product");
    }

    res.json({
      message: "Product added!",
      id: result.insertId
    });
  });
});


// ✅ UPDATE product
app.put("/products/:id", (req, res) => {
  const { id } = req.params;
  const { name, price, description, image_url, stock, is_active } = req.body;

  const sql = `
    UPDATE products
    SET name = ?, price = ?, description = ?, image_url = ?, stock = ?, is_active = ?
    WHERE id = ?
  `;

  db.query(
    sql,
    [name, price, description, image_url, stock, is_active, id],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Error updating product");
      }

      res.json({ message: "Product updated!" });
    }
  );
});


// ✅ DELETE (soft delete)
app.delete("/products/:id", (req, res) => {
  const { id } = req.params;

  const sql = "UPDATE products SET is_active = FALSE WHERE id = ?";

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error deleting product");
    }

    res.json({ message: "Product hidden (soft deleted)" });
  });
});


// =======================
// 🚀 START SERVER
// =======================

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${NODE_ENV}`);
  if (NODE_ENV === 'development') {
    console.log(`🌐 Local URL: http://localhost:${PORT}`);
  }
});