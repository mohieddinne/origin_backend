module.exports.up = `INSERT INTO
    tblOptions ("name", "value", "createdAt", "updatedAt")
VALUES
    (
        'category_activity_color',
        '[{"category":"Absence","color":"blue"},{"category":"Administration (non facturable)","color":"indigo"},{"category":"Comptabilité","color":"orange"},{"category":"Déplacement","color":"red"},{"category":"Expertise","color":"yellow-700"},{"category":"Formation","color":"gray"},{"category":"Infographie (Charger tarif secrétariat)","color":"yellow-700"},{"category":"Laboratoire","color":"blue"},{"category":"Procès","color":"grey"},{"category":"Projet","color":"green"},{"category":"Promotion","color":"pink"} ]',
        GETDATE(),
        GETDATE()
    )
`;
