require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const path = require("path");
const stripeLib = require("stripe");

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";
const allowedOrigins = [
  "http://127.0.0.1:5501",
  "http://localhost:5501",
  "http://127.0.0.1",
  "http://localhost"
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Credentials", "true");
  }
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "..")));

const databaseUrl = process.env.DATABASE_URL || process.env.DB_URL || process.env.MYSQL_URL;
let db = null;
let dbConfigured = false;

if (databaseUrl) {
  dbConfigured = true;
  db = mysql.createConnection(databaseUrl);
} else {
  const hasDbCreds = process.env.DB_HOST && process.env.DB_USER && process.env.DB_PASSWORD && process.env.DB_NAME;
  if (hasDbCreds) {
    dbConfigured = true;
    db = mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
  }
}

if (dbConfigured) {
  db.connect((err) => {
    if (err) {
      console.warn("⚠️ Database connection failed, continuing in checkout-only mode:", err.message || err);
      dbConfigured = false;
      return;
    }
    console.log("✅ Connected to MySQL database");
  });
} else {
  console.warn("⚠️ Database not configured. Continuing in checkout-only mode.");
}

const stripe = process.env.STRIPE_SECRET_KEY ? stripeLib(process.env.STRIPE_SECRET_KEY) : null;

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "index.html"));
});

app.get("/products", (req, res) => {
  if (!dbConfigured || !db) {
    return res.json([]);
  }

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

app.get("/products/:id", (req, res) => {
  if (!dbConfigured || !db) {
    return res.status(503).json({ error: "Database is not configured." });
  }

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

app.post("/products", (req, res) => {
  if (!dbConfigured || !db) {
    return res.status(503).json({ error: "Database is not configured." });
  }

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

    res.json({ message: "Product added!", id: result.insertId });
  });
});

app.put("/products/:id", (req, res) => {
  if (!dbConfigured || !db) {
    return res.status(503).json({ error: "Database is not configured." });
  }

  const { id } = req.params;
  const { name, price, description, image_url, stock, is_active } = req.body;
  const sql = `
    UPDATE products
    SET name = ?, price = ?, description = ?, image_url = ?, stock = ?, is_active = ?
    WHERE id = ?
  `;

  db.query(sql, [name, price, description, image_url, stock, is_active, id], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error updating product");
    }

    res.json({ message: "Product updated!" });
  });
});

app.delete("/products/:id", (req, res) => {
  if (!dbConfigured || !db) {
    return res.status(503).json({ error: "Database is not configured." });
  }

  const { id } = req.params;
  const sql = "UPDATE products SET is_active = FALSE WHERE id = ?";

  db.query(sql, [id], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error deleting product");
    }

    res.json({ message: "Product hidden (soft deleted)" });
  });
});

app.post("/create-checkout-session", async (req, res) => {
  const cartItems = req.body.cartItems || req.body.items || [];
  const customerDetails = req.body.customerDetails || {};

  if (!cartItems.length) {
    return res.status(400).json({ error: "Your cart is empty." });
  }

  if (!stripe) {
    return res.status(503).json({ error: "Stripe is not configured. Set STRIPE_SECRET_KEY to enable payments." });
  }

  const line_items = cartItems.map((item) => {
    const quantity = Number(item.quantity || 1);
    const unitPrice = Number(item.pricePerUnit ?? item.price ?? 0);
    const unitAmount = Math.round(unitPrice * 100);

    return {
      quantity,
      price_data: {
        currency: "usd",
        unit_amount: unitAmount,
        product_data: {
          name: item.name || "Kash Infusions Product"
        }
      }
    };
  });

  try {
    const origin = req.get("origin") || `${req.protocol}://${req.get("host") || `localhost:${PORT}`}`;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items,
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/cancel`,
      customer_email: customerDetails.email || undefined,
      metadata: {
        customerName: customerDetails.name || "",
        customerPhone: customerDetails.phone || ""
      }
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    res.status(500).json({ error: error.message || "Unable to start checkout." });
  }
});

app.get("/checkout/success", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "checkout-success.html"));
});

app.get("/checkout/cancel", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "checkout-cancel.html"));
});

function startServer() {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Environment: ${NODE_ENV}`);
    if (NODE_ENV === "development") {
      console.log(`🌐 Local URL: http://localhost:${PORT}`);
    }
  });
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };