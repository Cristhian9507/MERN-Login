const CoCartAPI = require("@cocart/cocart-rest-api").default;

const CoCart = new CoCartAPI({
  url: "https://safarideportesyhobbies.com",
  consumerKey: process.env.API_KEY_WOOCOMMERCE,
  consumerSecret: process.env.SECRET_KEY_WOOCOMMERCE,
  version: 'cocart/v2'
});

module.exports = CoCart;