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

const createCreditNoteToSiigo = async (order) => {
  const documentsTypeFound = await documentsType("NC");
  console.log("### Tipo de documento nota credito si electrónico ###");
  const documentTypeNC = documentsTypeFound.find((document) => document.electronic_type === "ElectronicCreditNote");
  if(documentTypeNC.id != undefined) {
    console.log("### Tipo de documento encontrado en Siigo ###");
    printJson(documentTypeNC);
    const bodyCreditNote = {
      "document": {
        "id": documentTypeNC.id
      },
      "number": order.number,
      "date": order.date,
      "invoice": order.id,
      "cost_center": order.cost_center ? order.cost_center : null,
      "retentions": order.retentions  ? order.retentions : null,
      "observations": order.observations,
      "items": order.items,
      "payments": order.payments
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
      printJson(error);
      return null;
    }
  }
}

const anulInvoiceToSiigo = async (order) => {
  const documentsTypeFound = await documentsType("NC");
  console.log("### Tipo de documento nota credito no electronica ###");
  const documentTypeInvoice = documentsTypeFound.find((document) => document.electronic_type === "NoElectronic");
  if(documentTypeInvoice.id != undefined) {
    console.log("### Tipo de documento NC no electrónico encontrado en Siigo ###");
    printJson(documentTypeInvoice);
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
      printJson(error);
      return null;
    }
  }
}


module.exports = { 
  siigoProductFindByCode,
  createCreditNoteToSiigo,
  anulInvoiceToSiigo
};
