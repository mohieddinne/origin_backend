"use strict";
module.exports = (sequelize, DataTypes) => {
  const BillingProjectSettings = sequelize.define(
    "BillingProjectSettings",
    {
      id: {
        type: DataTypes.INTEGER(11).UNSIGNED,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      daysWithoutActivity: {
        field: "days_without_activity",
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
      nbrDaysWithoutActivity: {
        field: "nbr_days_without_activity",
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      budgetBeforeFirstInvoice: {
        field: "budget_before_first_invoice",
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
      minBudgetBeforeFirstInvoice: {
        field: "min_budget_before_first_invoice",
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      budgetVsTec: {
        field: "budget_vs_tec",
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      maxPourcentagesOfBudget: {
        field: "max_pourcentages_of_budget",
        type: DataTypes.STRING,
        allowNull: true,
      },
      maxOfTecAmount: {
        field: "max_tec_amount",
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      submissionProcess: {
        field: "submission_process",
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      isMentor: {
        field: "is_mentor",
        type: DataTypes.BOOLEAN,
      },
      mentor: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      projectId: {
        field: "project_id",
        type: DataTypes.STRING(15),
        allowNull: true,
        references: {
          model: "tblDossier",
          key: "NumeroDossier",
        },
      },
      customerId: {
        field: "customer_id",
        type: DataTypes.STRING(15),
        allowNull: true,
        references: {
          model: "tblClient",
          key: "NumeroClient",
        },
      },
      isDefault: {
        field: "is_default",
        type: DataTypes.BOOLEAN,
        default: false,
      },
      createdAt: DataTypes.DATE,
    },

    {
      tableName: "tbl_billing_project_settings",
    }
  );
  BillingProjectSettings.associate = (models) => {
    BillingProjectSettings.belongsTo(models.tblDossier, {
      as: "settings",
      targetKey: "NumeroDossier",
      foreignKey: "projectId",
    });
  };

  return BillingProjectSettings;
};
