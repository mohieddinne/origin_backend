const xl = require("excel4node");

const minW = 20;
const maxW = 60;
const wb = new xl.Workbook({});
async function dataToExel(data, labelsFn) {
  // Security on the labels function
  let labels = (label) => label;
  if (typeof labelsFn === "function") {
    labels = labelsFn;
  }

  let headercolumnName = [];

  if (data.length > 0) {
    Object.keys(data[0]).map((item) => {
      headercolumnName.push(labels(item));
    });
  } else {
    headercolumnName.push({});
  }

  // Creat a workbook

  const wb = new xl.Workbook({});
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
      const cell = `${record[key] || ""}`;

      // Set / reset column width
      let cWidth = cell.length;
      if (record[key] instanceof Date) cWidth = 12;
      if (cWidth >= minW && cWidth > width[x - 1]) {
        width[x] = cWidth < maxW ? cWidth : maxW;
      }
      // Write the cell
      if (record[key] instanceof Date)
        ws.cell(y + 2, x + 1)
          .date(new Date(record[key]))
          .style({ ...cellStyle, numberFormat: "yyyy-mm-dd" });
      else
        ws.cell(y + 2, x + 1)
          .string(cell)
          .style(cellStyle);
    }
  }

  for (let i = 0; i < width.length; i++) {
    ws.column(i + 1).setWidth(width[i]);
  }

  return wb.writeToBuffer();
}

module.exports = dataToExel;
