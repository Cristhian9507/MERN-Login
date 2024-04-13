
const printJson = (json) => {
  console.log(JSON.stringify(json, null, 2));
}

const printJsonShort = (json) => {
  console.log(JSON.stringify(json, null, 2).length > 250 ? JSON.stringify(json).slice(0, 250) + '...' : JSON.stringify(json));
}

module.exports = { printJson, printJsonShort };
