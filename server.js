// CodeAlpha E-commerce Store
// Backend Server
// Uses Express + JSON files + Sessions

const express = require("express");
const path = require("path");
const bcrypt = require("bcryptjs");
const session = require("express-session");

const db = require("./db");

const app = express();
const PORT = 3001;

// --------------------------------------------------
// MIDDLEWARE
// --------------------------------------------------

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
    session({
        secret: "codealpha-ecommerce-secret",
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 24 * 60 * 60 * 1000
        }
    })
);

// Serve frontend files
app.use(express.static(path.join(__dirname, "public")));

// --------------------------------------------------
// HOME PAGE
// --------------------------------------------------

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// --------------------------------------------------
// PRODUCT APIs
// --------------------------------------------------

// Get all products
app.get("/api/products", (req, res) => {
    try {
        const products = db.getProducts();
        res.json(products);
    } catch (error) {
        console.error("Products error:", error);
        res.status(500).json({
            error: "Unable to load products"
        });
    }
});

// Get single product
app.get("/api/products/:id", (req, res) => {
    try {
        const products = db.getProducts();

        const product = products.find(
            (p) => String(p.id) === String(req.params.id)
        );

        if (!product) {
            return res.status(404).json({
                error: "Product not found"
            });
        }

        res.json(product);
    } catch (error) {
        console.error("Product detail error:", error);

        res.status(500).json({
            error: "Unable to load product"
        });
    }
});

// Search products
app.get("/api/search", (req, res) => {
    try {
        const query = String(req.query.q || "")
            .trim()
            .toLowerCase();

        const products = db.getProducts();

        if (!query) {
            return res.json(products);
        }

        const results = products.filter((product) => {
            return (
                String(product.name || "")
                    .toLowerCase()
                    .includes(query) ||
                String(product.description || "")
                    .toLowerCase()
                    .includes(query) ||
                String(product.category || "")
                    .toLowerCase()
                    .includes(query)
            );
        });

        res.json(results);
    } catch (error) {
        console.error("Search error:", error);

        res.status(500).json({
            error: "Search failed"
        });
    }
});

// --------------------------------------------------
// AUTHENTICATION
// --------------------------------------------------

// Register
app.post("/api/register", async (req, res) => {
    try {
        const {
            name,
            email,
            password
        } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                error: "Name, email and password are required"
            });
        }

        const existingUser = db.getUserByEmail(email);

        if (existingUser) {
            return res.status(409).json({
                error: "Email already registered"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = {
            id: Date.now().toString(),
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password: hashedPassword,
            createdAt: new Date().toISOString()
        };

        db.createUser(user);

        req.session.userId = user.id;

        res.status(201).json({
            message: "Registration successful",
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error("Registration error:", error);

        res.status(500).json({
            error: "Registration failed"
        });
    }
});

// Login
app.post("/api/login", async (req, res) => {
    try {
        const {
            email,
            password
        } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                error: "Email and password are required"
            });
        }

        const user = db.getUserByEmail(email);

        if (!user) {
            return res.status(401).json({
                error: "Invalid email or password"
            });
        }

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                error: "Invalid email or password"
            });
        }

        req.session.userId = user.id;

        res.json({
            message: "Login successful",
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error("Login error:", error);

        res.status(500).json({
            error: "Login failed"
        });
    }
});

// Logout
app.post("/api/logout", (req, res) => {
    req.session.destroy((error) => {
        if (error) {
            return res.status(500).json({
                error: "Logout failed"
            });
        }

        res.json({
            message: "Logged out successfully"
        });
    });
});

// Current user
app.get("/api/me", (req, res) => {
    if (!req.session.userId) {
        return res.json({
            loggedIn: false
        });
    }

    const user = db.getUserById(req.session.userId);

    if (!user) {
        return res.json({
            loggedIn: false
        });
    }

    res.json({
        loggedIn: true,
        user: {
            id: user.id,
            name: user.name,
            email: user.email
        }
    });
});

// --------------------------------------------------
// CART
// --------------------------------------------------

// Each browser session gets its own cart
function getCart(req) {
    if (!req.session.cart) {
        req.session.cart = [];
    }

    return req.session.cart;
}

// Get cart
app.get("/api/cart", (req, res) => {
    try {
        const cart = getCart(req);
        const products = db.getProducts();

        const detailedCart = cart
            .map((item) => {
                const product = products.find(
                    (p) => String(p.id) === String(item.productId)
                );

                if (!product) {
                    return null;
                }

                return {
                    productId: product.id,
                    name: product.name,
                    price: Number(product.price) || 0,
                    image: product.image || "",
                    quantity: item.quantity,
                    stock: product.stock
                };
            })
            .filter(Boolean);

        const total = detailedCart.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
        );

        res.json({
            items: detailedCart,
            total: Number(total.toFixed(2))
        });
    } catch (error) {
        console.error("Cart error:", error);

        res.status(500).json({
            error: "Unable to load cart"
        });
    }
});

// Add product to cart
app.post("/api/cart/add", (req, res) => {
    try {
        const {
            productId,
            quantity = 1
        } = req.body;

        const products = db.getProducts();

        const product = products.find(
            (p) => String(p.id) === String(productId)
        );

        if (!product) {
            return res.status(404).json({
                error: "Product not found"
            });
        }

        const qty = Math.max(1, Number(quantity));

        if (product.stock !== undefined && qty > Number(product.stock)) {
            return res.status(400).json({
                error: "Not enough stock available"
            });
        }

        const cart = getCart(req);

        const existingItem = cart.find(
            (item) =>
                String(item.productId) === String(productId)
        );

        if (existingItem) {
            const newQuantity = existingItem.quantity + qty;

            if (
                product.stock !== undefined &&
                newQuantity > Number(product.stock)
            ) {
                return res.status(400).json({
                    error: "Not enough stock available"
                });
            }

            existingItem.quantity = newQuantity;
        } else {
            cart.push({
                productId: product.id,
                quantity: qty
            });
        }

        res.json({
            message: "Product added to cart",
            cart
        });
    } catch (error) {
        console.error("Add cart error:", error);

        res.status(500).json({
            error: "Unable to add product to cart"
        });
    }
});

// Update cart quantity
app.put("/api/cart/update", (req, res) => {
    try {
        const {
            productId,
            quantity
        } = req.body;

        const cart = getCart(req);

        const item = cart.find(
            (x) => String(x.productId) === String(productId)
        );

        if (!item) {
            return res.status(404).json({
                error: "Cart item not found"
            });
        }

        const qty = Number(quantity);

        if (!Number.isInteger(qty) || qty < 1) {
            return res.status(400).json({
                error: "Quantity must be at least 1"
            });
        }

        const product = db
            .getProducts()
            .find(
                (p) => String(p.id) === String(productId)
            );

        if (!product) {
            return res.status(404).json({
                error: "Product not found"
            });
        }

        if (
            product.stock !== undefined &&
            qty > Number(product.stock)
        ) {
            return res.status(400).json({
                error: "Not enough stock available"
            });
        }

        item.quantity = qty;

        res.json({
            message: "Cart updated",
            cart
        });
    } catch (error) {
        console.error("Update cart error:", error);

        res.status(500).json({
            error: "Unable to update cart"
        });
    }
});

// Remove from cart
app.delete("/api/cart/remove/:productId", (req, res) => {
    try {
        const cart = getCart(req);

        req.session.cart = cart.filter(
            (item) =>
                String(item.productId) !==
                String(req.params.productId)
        );

        res.json({
            message: "Product removed from cart",
            cart: req.session.cart
        });
    } catch (error) {
        console.error("Remove cart error:", error);

        res.status(500).json({
            error: "Unable to remove product"
        });
    }
});

// Clear cart
app.delete("/api/cart/clear", (req, res) => {
    req.session.cart = [];

    res.json({
        message: "Cart cleared"
    });
});

// --------------------------------------------------
// ORDERS
// --------------------------------------------------

// Get orders
app.get("/api/orders", (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({
                error: "Please login first"
            });
        }

        const orders = db.getOrdersByUser(
            req.session.userId
        );

        res.json(orders);
    } catch (error) {
        console.error("Orders error:", error);

        res.status(500).json({
            error: "Unable to load orders"
        });
    }
});

// Checkout
app.post("/api/checkout", (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({
                error: "Please login before checkout"
            });
        }

        const cart = getCart(req);

        if (cart.length === 0) {
            return res.status(400).json({
                error: "Your cart is empty"
            });
        }

        const products = db.getProducts();

        const orderItems = [];

        let total = 0;

        for (const item of cart) {
            const product = products.find(
                (p) =>
                    String(p.id) ===
                    String(item.productId)
            );

            if (!product) {
                return res.status(400).json({
                    error: "A product in your cart no longer exists"
                });
            }

            if (
                product.stock !== undefined &&
                item.quantity > Number(product.stock)
            ) {
                return res.status(400).json({
                    error:
                        product.name +
                        " does not have enough stock"
                });
            }

            const price = Number(product.price) || 0;

            orderItems.push({
                productId: product.id,
                name: product.name,
                price: price,
                quantity: item.quantity
            });

            total += price * item.quantity;
        }

        // Reduce stock
        for (const item of cart) {
            const product = products.find(
                (p) =>
                    String(p.id) ===
                    String(item.productId)
            );

            if (product && product.stock !== undefined) {
                const newStock =
                    Number(product.stock) -
                    Number(item.quantity);

                db.updateProductStock(
                    product.id,
                    newStock
                );
            }
        }

        const order = {
            id: "ORD-" + Date.now(),
            userId: req.session.userId,
            items: orderItems,
            total: Number(total.toFixed(2)),
            status: "Confirmed",
            createdAt: new Date().toISOString()
        };

        db.createOrder(order);

        req.session.cart = [];

        res.status(201).json({
            message: "Order placed successfully",
            order
        });
    } catch (error) {
        console.error("Checkout error:", error);

        res.status(500).json({
            error: "Checkout failed"
        });
    }
});

// --------------------------------------------------
// 404 API HANDLER
// --------------------------------------------------

app.use("/api", (req, res) => {
    res.status(404).json({
        error: "API endpoint not found"
    });
});

// --------------------------------------------------
// START SERVER
// --------------------------------------------------

app.listen(PORT, () => {
    console.log(
        `Server running on http://localhost:${PORT}`
    );
});