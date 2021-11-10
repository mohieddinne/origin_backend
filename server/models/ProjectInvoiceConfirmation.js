"use strict";
module.exports = (sequelize, DataTypes) => {
  const ProjectInvoiceConfirmation = sequelize.define(
    "ProjectInvoiceConfirmation",
    {
      id: {
        type: DataTypes.INTEGER(11).UNSIGNED,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      invoiceId: {
        field: "invoice_id",
        type: DataTypes.STRING(15),
        allowNull: false,
      },
      employeeId: {
        field: "employee_id",
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      canConfirm: {
        field: "can_confirm",
        type: DataTypes.BOOLEAN,
      },
      confirmed: {
        defaultValue: null,
        type: DataTypes.BOOLEAN,
      },
    },
    {
      tableName: "tbl_project_invoice_confirmation",
    }
  );

  ProjectInvoiceConfirmation.associate = function (models) {
    ProjectInvoiceConfirmation.belongsTo(models.tblFacture, {
      foreignKey: "invoice_id",
      targetKey: "NumeroFacture",
      as: "invoices",
    });

    ProjectInvoiceConfirmation.belongsTo(models.tblEmployes, {
      foreignKey: "employee_id",
      targetKey: "id_Emp",
      as: "user",
    });
  };
  return ProjectInvoiceConfirmation;
};
