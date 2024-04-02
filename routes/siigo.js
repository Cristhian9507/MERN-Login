const express = require("express");
const router = express.Router();

const { allProducts } = require("../controllers/siigo");
const authMiddleware = require('../middleware/auth')
const { processProduct, processUpdateProduct, processUpdateStockProduct } = require("../controllers/processSiigoCreatedProduct");

router.route("/get-products").get(authMiddleware, allProducts);
// router.route("/get-orders").get(authMiddleware, orders);

router.route("/create-product-siigo-wh").post((req, res) => {
  processProduct(req.body);
  res.send("Webhook Siigo received");
});

router.route("/update-product-siigo-wh").post((req, res) => {
  processUpdateProduct(req.body);
  res.send("Webhook update product Siigo received");
});

router.route("/update-stock-product-siigo-wh").post((req, res) => {
  processUpdateStockProduct(req.body);
  res.send("Webhook update stock prodct Siigo received");
});


module.exports = router;