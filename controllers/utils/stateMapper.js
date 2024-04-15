// Objeto para mapear códigos de WooCommerce a códigos numéricos de departamento
const codigoDepartamentoMapper = {
  "CO-005": "005",
  "CO-054": "054",
  "CO-050": "050",
  "CO-027": "027",
  "CO-041": "041",
  "CO-013": "013",
  "CO-025": "025",
  "CO-020": "020",
  "CO-068": "068",
  "CO-017": "017",
  "CO-085": "085",
  "CO-052": "052",
  "CO-018": "018",
  "CO-044": "044",
  "CO-076": "076",
  "CO-047": "047",
  "CO-019": "019",
  "CO-015": "015",
  "CO-073": "073",
  "CO-066": "066",
  "CO-081": "081",
  "CO-063": "063",
  "CO-023": "023",
  "CO-008": "008",
  "CO-094": "094",
  "CO-011": "011",
  "CO-070": "070",
  "CO-095": "095",
  "CO-097": "097",
  "CO-086": "086",
  "CO-099": "099",
  "CO-091": "091",
  "CO-088": "088"
};

// Función para obtener el código numérico del departamento dado un código de WooCommerce
function getSiigoStateCode(codigo) {
  return codigoDepartamentoMapper[codigo] || null;
}

module.exports = { getSiigoStateCode };
