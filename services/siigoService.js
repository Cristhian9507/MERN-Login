const siigoConnect = require("../config/configSiigo");
const { printJson } = require("../utils/utils");
const { documentsType } = require("../models/siigo/index");

const siigoProductFindByCode = async (code) => {
  console.log("##### Request code ####");
  printJson(code);
  let responseRequest = null;
  try {
    responseRequest = await siigoConnect.get(`/products?code=${code}`);
  } catch (error) {
    printJson(error.response.data);
    return null;
  }
  console.log("##### Response Siigo Product By Code #####")
  printJson(responseRequest.data);
  if (responseRequest.data.results.length === 0) {
    return null;
  }

  //validate product code and return the product
  const product = responseRequest.data.results.filter((product) => product.code === code);
  return product;
}

/**
 * Creates a credit note in Siigo.
 * @param {Object} order - The order object.
 * @returns {boolean|null} - Returns true if the credit note was created successfully, null if there was an error.
 */
const createCreditNoteToSiigo = async (order) => {
  const documentType = await documentsType("NC");
  console.log("### Document type credit note ###");
  printJson(documentType);
  const documentTypeCreditNote = documentType.find(doc => doc.electronic_type === "ElectronicCreditNote");
  console.log("### Tipo de documento nota credito si electrónico ###");
  const items = [];
  order.items.forEach((item) => {
    const newItem = {
      code: item.code,
      description: item.description,
      quantity: item.quantity,
      price: item.price,
      discount: item.discount ? item.discount : 0,
      taxes: item.taxes ? item.taxes : null,
      transport: item.transport ? item.transport : null
    };
    items.push(newItem);
  });
  const payments = [];
  order.payments.forEach((payment) => {
    const newPayment = {
      id: payment.id,
      value: payment.value,
      due_date: order.date
    };
    payments.push(newPayment);
  });
  const bodyCreditNote = {
    "document": {
      "id": documentTypeCreditNote.id,
    },
    "number": order.number,
    "date": order.date,
    "invoice": order.id,
    "cost_center": order.cost_center ? order.cost_center : null,
    "retentions": order.retentions  ? order.retentions : null,
    "reason": 1,
    "observations": order.observations,
    "items": items,
    "payments": payments
  };
  console.log("### Body de la nota credito ###");
  printJson(bodyCreditNote);
  let responseRequest = null;
  try {
    responseRequest = await siigoConnect.post('/credit-notes', bodyCreditNote);
    console.log("### Respuesta de la creación de la nota crédito en Siigo ###");
    printJson(responseRequest.data);
    return responseRequest.statusCode === 201;
  } catch (error) {
    printJson(error.response.data);
    // console.log(error.response.data)
    return null;
  }
}

const anulInvoiceToSiigo = async (order) => {
  console.log("### Tipo de documento nota credito no electronica ###");
  const dataType = typeof order.id;
  console.log("Data type:", dataType);
  const bodyAnul = {
    "id": order.id,
    "Annul": true
  };
  let responseRequest = null;
  try {
    responseRequest = await siigoConnect.post('/invoices/id_/annul', bodyAnul);
    console.log("### Respuesta de la anulación de la factura en Siigo ###");
    printJson(responseRequest.data);
    return responseRequest.statusCode === 200;
  } catch (error) {
    // printJson(error);
    printJson(error.response.data);
    return null;
  }
}


module.exports = { 
  siigoProductFindByCode,
  createCreditNoteToSiigo,
  anulInvoiceToSiigo
};
