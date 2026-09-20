// Simple JSON-file database layer

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "data");

// Make sure data folder exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Read JSON file
function readJSON(file) {
    const filePath = path.join(DATA_DIR, file);

    if (!fs.existsSync(filePath)) {
        return [];
    }

    const raw = fs.readFileSync(filePath, "utf8").trim();

    if (!raw) {
        return [];
    }

    try {
        return JSON.parse(raw);
    } catch (error) {
        console.error(`Error reading ${file}:`, error);
        return [];
    }
}

// Write JSON file
function writeJSON(file, data) {
    const filePath = path.join(DATA_DIR, file);

    fs.writeFileSync(
        filePath,
        JSON.stringify(data, null, 2),
        "utf8"
    );
}

// --------------------------------------------------
// DATABASE FUNCTIONS
// --------------------------------------------------

module.exports = {

    // ---------------- PRODUCTS ----------------

    getProducts() {
        return readJSON("products.json");
    },

    getProductById(id) {
        const products = readJSON("products.json");

        return (
            products.find(
                (p) => String(p.id) === String(id)
            ) || null
        );
    },

    updateProductStock(id, newStock) {
        const products = readJSON("products.json");

        const product = products.find(
            (p) => String(p.id) === String(id)
        );

        if (product) {
            product.stock = newStock;

            writeJSON(
                "products.json",
                products
            );
        }

        return product || null;
    },

    // ---------------- USERS ----------------

    getUsers() {
        return readJSON("users.json");
    },

    getUserByEmail(email) {
        const users = readJSON("users.json");

        return (
            users.find(
                (u) =>
                    String(u.email).toLowerCase() ===
                    String(email).toLowerCase()
            ) || null
        );
    },

    getUserById(id) {
        const users = readJSON("users.json");

        return (
            users.find(
                (u) => String(u.id) === String(id)
            ) || null
        );
    },

    createUser(user) {
        const users = readJSON("users.json");

        users.push(user);

        writeJSON(
            "users.json",
            users
        );

        return user;
    },

    // ---------------- ORDERS ----------------

    getOrders() {
        return readJSON("orders.json");
    },

    getOrdersByUser(userId) {
        const orders = readJSON("orders.json");

        return orders.filter(
            (order) =>
                String(order.userId) ===
                String(userId)
        );
    },

    createOrder(order) {
        const orders = readJSON("orders.json");

        orders.push(order);

        writeJSON(
            "orders.json",
            orders
        );

        return order;
    }
};