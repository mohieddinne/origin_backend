// update group name La Personnelle to La personnelle

module.exports.up = `
  UPDATE [tblClientGroupes]
    SET name = 'La personnelle'
    WHERE name = 'La Personnelle';

  UPDATE [tblEmployes_Niveaux]
    SET [Description] = 'Adjoint(e)'
    WHERE Description = 'Adjointe';

  UPDATE [tblAccess]
    SET [accessName] = 'Indicateurs de performance'
    WHERE accessName = 'kpis';

  UPDATE [tblAccess]
    SET [accessName] = 'Rapports TEC'
    WHERE accessName = 'Rapport TEC';

  DELETE FROM [tblAccess] WHERE accessName = 'Allié RH';
`;
