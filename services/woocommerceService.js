const api = require("../config/configWoocommerce");
const { printJson } = require("../utils/utils");
const CoCart = require("../config/configCocart");
const { siigoProductFindByCode } = require("../services/siigoService");

// TRASNFORM PRODUCT STOCK!!! Convertimos la data que viene de Siigo a un formato que Woocommerce entienda
const convertDataToUpdateStockWoocommerce = async (product) => {
  const woocommerceStockProduct = {
    sku: product.code,
    stock_status: (product.stock_control && product.available_quantity > 0) ? 'instock' : 'outofstock',
    manage_stock: product.stock_control,
    stock_quantity: product.stock_control ? product.available_quantity : 0,
  };
  return woocommerceStockProduct;
}

const woocommerceProductFindBySku = async (sku) => {

  let responseRequest = null;
  try {
    responseRequest = await api.get("products", { "sku" : sku})
      .then((response) => {
        return response.data;
      })
      .catch((error) => {
        console.log("Response Status:", error.response.status);
        console.log("Response Headers:", error.response.headers);
        console.log("Response Data:", error.response.data);
        return error.response.data;
      });
    printJson(responseRequest);
  } catch (error) {
    printJson(error.response !== undefined ? error.response.data : error);
    return null;
  }

  if (responseRequest.length === 0) {
    return null;
  }

  //validate product sku and return the product
  const product = responseRequest.filter((product) => product.sku === sku);
  console.log('----------')
  return product;
}

// UPDATE STOCK WOOCOMMERCE
const updateStockProductToWoocommerce = async(woocommerceProductId, stockProductWoocommerce) => {
  let responseRequest;
  try {
    responseRequest = await api.put(`products/${woocommerceProductId}`, stockProductWoocommerce)
      .then((response) => {
        return response.data;
      })
      .catch((error) => {
        console.log("Response Status:", error.response.status);
        console.log("Response Headers:", error.response.headers);
        console.log("Response Data:", error.response.data);
        return error.response.data;
      });
    console.log("### Stock del Producto actualizado en Woocommerce ###");
    printJson(responseRequest);
    return true;
  } catch (error) {
    console.log("### Error al actualizar el stocl del producto en Woocommerce ###");
    printJson(error.response);
  }
}

const findProductOnCart = async (itemKey) => {
  let responseRequest = null;
  try {
    console.log("### Buscando producto en el carrito ###");
    responseRequest = await CoCart.get("cart", {})
      .then((response) => {
        return response.data;
      })
      .catch((error) => {
        return error.response.data;
      });
  } catch (error) {
    printJson(error.response !== undefined ? error.response.data : error);
    return null;
  }
  console.log('----------') 
  const addedProduct = responseRequest.items.find(item => item.item_key === itemKey);
  if (addedProduct) {
    console.log("Devolvemos el producto encontrado en el carrito")
    // devolvemos el producto encontrado
    return addedProduct;
  } else {
    console.log('Producto no encontrado en el carrito');
    return null;
  }
}

const verifyProduct = async (product) => {
  //1. hacer el log de toda la informacion del producto recibida en la bd
  console.log("### Procesando producto...###");
  printJson(product);
  //2. buscar el producto en el carrito de woocommerce
  console.log("### Va a buscar producto en el carrito de woocommerce ###");
  const productFound = await findProductOnCart(product.arg)
  console.log("### productFound ###");
  printJson(productFound);
  if(productFound){
    console.log("### Producto SI existe en el carrito ###");
    const siigoProduct = await siigoProductFindByCode(productFound.meta.sku);
    console.log("### Encontrado en Siigo ###");
    printJson(siigoProduct);
    if (siigoProduct) {
      console.log("### Producto si existe en Siigo ###");
      if(siigoProduct[0].available_quantity > 0) {
        console.log("### Producto con inventario disponible en siigo ###");
      } else {
        console.log("### Producto sin inventario en Siigo ###");
      }
      console.log("### Se actualizará el stock ###");
      const dataStockProduct = await convertDataToUpdateStockWoocommerce(siigoProduct[0]);
      console.log("### producto convertido a Woocommerce ###");
      woocommerceResponse = await updateStockProductToWoocommerce(productFound.id, dataStockProduct);
      console.log("### Stock del Producto actualizado en Woocommerce ###");
    } else {
      console.log('Producto no encontrado en Siigo');
    }
    console.log('#### FIN ####');
    return;
  } else {
    console.log('Producto no encontrado en el carrito');
    console.log('#### FIN ####');
    return;
  }

};

module.exports = { 
  woocommerceProductFindBySku,
  verifyProduct
};
