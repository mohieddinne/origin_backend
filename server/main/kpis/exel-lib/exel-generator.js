const xl = require("excel4node");

const minW = 20;
const maxW = 60;

const datatoexel = async function (data) {
  if (!Array.isArray(data)) {
    throw Error("data is not an array");
  }

  // Creat a workbook
  const wb = new xl.Workbook({
    dateFormat: "yyyy/mm/dd",
  });

  const options = {
    margins: {
      left: 150,
      right: 150,
    },
    sheetFormat: {
      // defaultColWidth :
    },
  };

  // Creat a work sheet
  const ws = wb.addWorksheet("data", options);

  const cellStyle = wb.createStyle({
    font: {
      bold: false,
      underline: false,
    },
    alignment: {
      wrapText: true,
      horizontal: "left",
    },
  });
  const headerStyle = wb.createStyle({
    font: {
      bold: true,
      charset: 100,
      color: "#000000",
      condense: true,

      outline: true,

      size: 12,
      vertAlign: 50,
    },

    numberFormat: "#,##0",
    alignment: {
      wrapText: true,
      horizontal: "left",
    },
  });

  // Defining columns
  const cols = [];
  const mainObj = !!data[0] ? data[0] : {};
  const keys = Object.keys(mainObj);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const label = labels(key);
    cols.push(label);
    ws.cell(1, i + 1)
      .string(label)
      .style(headerStyle);
  }

  // Write data in excel file
  const width = new Array(cols.length || 1).fill(minW);

  for (let y = 0; y < data.length; y++) {
    const record = data[y] || {};
    const keys = Object.keys(record);

    for (let x = 0; x < keys.length; x++) {
      const key = keys[x];
      let cell = record[key];
      if (cell instanceof Date) {
      }
      // Detect the cell type
      let op = "string";
      switch (typeof cell) {
        case "number":
          op = "number";
          break;
        case "object":
          if (cell instanceof Date) {
            cell = new Intl.DateTimeFormat("CAD").format(cell);
            op = "date";
          }
          break;
      }

      // Set / reset column width
      const cWidth = `${cell}`.length;
      if (cWidth >= minW && cWidth > width[x - 1]) {
        width[x] = cWidth < maxW ? cWidth : maxW;
      }

      // Write the cell
      ws.cell(y + 2, x + 1)
        [op](cell)
        .style(cellStyle);
    }
  }

  for (let i = 0; i < width.length; i++) {
    ws.column(i + 1).setWidth(width[i]);
  }

  return wb.writeToBuffer();
};

module.exports = datatoexel;

function labels(item) {
  let label;
  switch (item) {
    case "Bureau":
      label = "Bureau";
      break;
    case "folders":
      label = "Dossiers";
      break;
    case "income":
      label = "Chiffre d'affaire";
    case "TypeDePerte":
      label = " Type de perte";
      break;
    case "name":
      label = "Nom de Groupe ";
      break;
    case "NomAssure":
      label = "Nom d'Assure ";
      break;

    default:
      label = item.split(/(?=[A-Z-_])/).join(" de ");
  }
  return label;
}
