const siigoConnect = require("../config/configSiigo");
const { printJson, printJsonShort } = require("../utils/utils");
const { documentsType } = require("../models/siigo/index");
const { createCreditNoteToSiigo, anulInvoiceToSiigo } = require("../services/siigoService");

const convertOrderToSiigo = (order) => {
  /**Notas
   * 2372 - factura de venta
   * Verificar el date si es cuando se creo la orden o cuando se pago.
   * customer:
   * - identification es el numero de identificacion del cliente hay que solicitarlo en la orden
   * address:
   * - hacer mappers para  ciudades departamentos y paises
   * cambiar seller por el id del vendendor, debe estar en los users de siigo
   * - pagos:
   * revisar los pagos el codigo cual corresponderia, id el id del metodo de pago debe estar en los metodos de pago de siigo
   * value es el total pagado.
   *
   */

  //sum all items prices
  let subTotalLine = 0;
  order.line_items.forEach((item) => {
    subTotalLine += item.price * item.quantity;
  });

  const date = order.date_created.split("T")[0];

  const siigoOrder = {
    "document": {
      "id": 2372
    },
    "date": date,
    "customer": {
      "person_type": "Person",
      "id_type": "13",
      "identification": "209048401",
      "branch_office": "0",
      "name": [
        order.billing.first_name,
        order.billing.last_name
      ],
      "address": {
        "address": order.billing.address_1,
        "city": {
          "country_code": "Co",
          "state_code": "11",
          "city_code": "11001"
        }
      },
      "phones": [
        {
          "number": order.billing.phone
        }
      ],
      "contacts": [
        {
          "first_name": order.billing.first_name,
          "last_name": order.billing.last_name,
          "email": order.billing.email
        }
      ]
    },
    "seller": 62,
    "payments": [
      {
        "id": "541",
        "value": subTotalLine
      }
    ]
  };

  // add  line items from order
  //NOTA: todos los precios de woocomerce deben ser con impuestos
  siigoOrder.items = order.line_items.map((item) => {
    return {
      code: item.sku,
      description: item.name,
      quantity: item.quantity,
      taxed_price: item.price,
      taxes: [
        {
          id: extractTaxIdFromTaxClass(item.tax_class),
        }
      ]
    }
  });
  return siigoOrder;
}

const extractTaxIdFromTaxClass = (taxClass) => {
  return taxClass.split("_")[0];
}


const sendOrderToSiigo = async (siigoOrder) => {
  try {
    const responseRequest = await siigoConnect.post(`/invoices`, siigoOrder);
    console.log("### Orden enviada a siigo ###");
    printJson(responseRequest.data.id);
  } catch (error) {
    console.log("### Error al enviar la orden a siigo ###");
    printJson(error.response.data);
  }
}


const processOrder = async (order) => {
  //1. hacer el log de toda la informacion de la orden recibida en la bd
  console.log("### Procesando orden...###");
  printJson(order);

  //2. convertir la orden a un formato que siigo entienda
  const siigoOrder = convertOrderToSiigo(order);
  console.log("### Orden convertida a Siigo ###");
  printJson(siigoOrder);

  //3. enviar la orden a siigo
  siigoResponse = await sendOrderToSiigo(siigoOrder);
}

const requestSiigoOrder = async (dateIni, orderId, page = 1) => {
  try {
    const responseRequest = await siigoConnect.get(`/invoices?created_start=${dateIni}&page=${page}`);
    return responseRequest;
  } catch (error) {
    console.log("### Error al buscar la orden en siigo ###");
    printJson(error.response.data);
  }
}

const findSiigoOrder = async (dateIni, orderId, page = 1) => {
  try {
    console.log("#### variables que llegan #####");
    console.log(dateIni, orderId);
    console.log("-----------------");
    const responseRequest = await requestSiigoOrder(dateIni, orderId, page);
    console.log("### respuesta de primera busqueda de orden en siigo ###");
    printJsonShort(responseRequest.data);
    if(responseRequest.data.results.length > 0){
      if(responseRequest.data.pagination.total_results > 0) {
        const orderFound = responseRequest.data.results.find(order => order.observations === orderId);
        if(orderFound) {
          return orderFound;
        } else {
          console.log("### Orden no encontrada en la pagina actual ###");
          const totalPages = (responseRequest.data.pagination.total_results / responseRequest.data.pagination.page_size); 
          if(totalPages > page) {
            page = page + 1;
            console.log("### Buscando en la siguiente pagina " + page + " de " +totalPages+ " ###");
            return findSiigoOrder(dateIni, orderId, page);
          } else {
            console.log("### Orden no encontrada en ninguna pagina ###");
            return null;
          }
        }
      }
    }
    return responseRequest.data;
  } catch (error) {
    console.log("### Error al buscar la orden en siigo ###");
    printJson(error);
  }
}

const updateOrder = async (order) => {
  if(order.id != undefined && (order.status == "cancelled" || order.status == "failed" || order.status == "failed")) {
    //1. hacer el log de toda la informacion de la orden recibida en la bd
    console.log("### Leyendo actualización de orden...###");
    printJson(order);

    //2. Buscar orden como factura de venta
    let formattedDate = new Date(order.date_created).toISOString();
    formattedDate = new Date(formattedDate);
    formattedDate.setHours(formattedDate.getHours() - 5);
    formattedDate = formattedDate.toISOString().split('T')[0];
    const siigoOrder = await findSiigoOrder(formattedDate, order.id.toString());
    console.log("### Respuesta de la busqueda de la orden en Siigo ###");
    printJson(siigoOrder);
    if(siigoOrder.id != undefined) {
      const documentsTypeInvoice = await documentsType("FV");
      if(documentsTypeInvoice.length > 0) {
        // Si existen los tipos de documentos en siigo
        // printJson(documentsTypeInvoice);
        const typeInvoice = documentsTypeInvoice.find(document => document.id === siigoOrder.document.id);
        if(typeInvoice.id != undefined) {
          // Si el tipo de documento existe en siigo
          console.log("### Tipo de documento encontrado en Siigo ###");
          // printJson(typeInvoice);
          let isAnuled = false;
          if(typeInvoice.electronic_type === "ElectronicInvoice") {
            // Es una factura electronica, por ende se debe de realizar una nota credito para anularla
            console.log("### es una factura eletrónica, por ende se debe de crear una nota crédito para anularla ###");
            isAnuled = await createCreditNoteToSiigo(siigoOrder);
          } else {
            // Es una factura no electronica, por ende se puede anular la FV
            console.log("### es una factura no eletrónica, por ende se puede anular la FV ###");
            isAnuled = await anulInvoiceToSiigo(siigoOrder);
          }
          if(isAnuled) {
            console.log("### Orden anulada correctamente ###");
            return;
          } else {
            console.log("### Error al anular la orden o crear nota crédito ###");
            return;
          }
        } else {
          console.log("### Tipo de documento no encontrado en Siigo ###");
          console.log("### FIN ####");
          return;
        }
      } else {
        console.log("### Tipos de documentos no encontrados en Siigo ###");
        console.log("### FIN ####");
        return;
      }
    } else {
      console.log("### Orden no encontrada en Siigo ###");
      console.log("### FIN ####");
      return;
    }
  }
}

module.exports = 
{
  processOrder,
  updateOrder
}
