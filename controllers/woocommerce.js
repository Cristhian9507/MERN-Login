const { getProducts, findProductBySku } = require("../models/woocommerce/products");
const { getOrders, getAllTaxes } = require("../models/woocommerce/orders");


const allProducts = async (req, res) => {
  try {
    const response = await getProducts();
    res.status(200).json(response);
  }
  catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const findProduct = async (req, res) => {
  try {
    const response = await findProductBySku(req.query.sku);
    res.status(200).json(response);
  }
  catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getTaxes = async (req, res) => {
  try {
    const response = await getAllTaxes();
    res.status(200).json(response);
  }
  catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const orders = async (req, res) => {
  try {
    try {
      const response = await getOrders(req.query.status);
      res.status(200).json(response);
    }
    catch (error) {
      res.status(500).json({ error: error.message });
    }
    res.status(200).json('hello');
  }
  catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  allProducts,
  findProduct,
  orders,
  getTaxes
};
