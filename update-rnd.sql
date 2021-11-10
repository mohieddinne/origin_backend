INSERT INTO
  GdsdataDev.dbo.tbl_email_templates_contents (
    [email_template_id],
    [language],
    [subject],
    [message],
    [from_name],
    [plaintext],
    [createdAt],
    [updatedAt]
  )
VALUES
  (
    2,
    'fr_CA',
    'Mot de passe oublié',
    '{{> header }}<span class="preheader">{{{translate ''FORGET_EMAIL_PREHEADER''}}}</span><h1>{{{greetingByGender name sexe}}}</h1><p>{{{translate ''FORGET_EMAIL_L1''}}} <strong>{{{translate ''FORGET_EMAIL_TIMING''}}}</strong></p><table class="body-action" align="center" width="100%" cellpadding="0" cellspacing="0" role="presentation"> <tr> <td align="center"> <table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation"> <tr> <td align="center"> <a href="{{action_url}}" class="f-fallback button button--green" target="_blank">{{{translate ''RESET_YOUR_PASSWORD''}}}</a> </td> </tr> </table> </td> </tr></table><p>{{{translate ''FORGET_EMAIL_L2''}}}</p><p><em>{{{translate ''EMAIL_SIGNATURE''}}}</em></p><!-- Sub copy --><table class="body-sub" role="presentation"> <tr> <td> <p class="f-fallback sub">{{{translate ''ERROR_WITH_LINK''}}}</p> <p class="f-fallback sub">{{action_url}}</p> </td> </tr></table>{{> footer }}',
    NULL,
    0,
    GETDATE(),
    GETDATE(),
  ),
  (
    3,
    'fr_CA',
    'Mot de passe modifié',
    '{{> header }}<span class="preheader">{{{translate ''PWD_RESET_EMAIL_PREHEADER''}}}</span><h1>{{{greetingByGender name sexe}}}</h1><p>{{{translate ''PWD_RESET_EMAIL_L1''}}}</p><p>{{{translate ''PWD_RESET_EMAIL_L2''}}}</p><p><em>{{{translate ''EMAIL_SIGNATURE''}}}</em></p>{{> footer }}',
    NULL,
    0,
    GETDATE(),
    GETDATE()
  )
GO
;

INSERT INTO
  GdsdataDev.dbo.tbl_email_templates_variables (
    [email_template_id],
    [name],
    [description],
    [createdAt],
    [updatedAt]
  )
VALUES
  (
    2,
    '{{{greetingByGender name sexe}}}',
    'Cher(e) NOM selon le sexe',
    GETDATE(),
    GETDATE()
  ),
  (
    2,
    '{{name}}',
    'Le prénom de l''utilisateur',
    GETDATE(),
    GETDATE()
  ),
  (
    2,
    '{{action_url}}',
    'Lien du mot de passe oublié',
    GETDATE(),
    GETDATE()
  ),
  (
    3,
    '{{{greetingByGender name sexe}}}',
    'Cher(e) NOM selon le sexe',
    GETDATE(),
    GETDATE()
  ),
  (
    3,
    '{{name}}',
    'Le prénom de l''utilisateur',
    GETDATE(),
    GETDATE()
  )
GO
;