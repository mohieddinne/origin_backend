const { gql } = require("apollo-server-express");

const schema = gql`
  type EmailTemplate {
    id: ID
    name: String
    slug: String
    active: Boolean
    """
    Template avaible in-core variables
    """
    variables: [EmailTemplateVariable]
    category: EmailTemplateCategory
    contents: [EmailTemplateContent]
  }
  type EmailTemplateContent {
    id: ID
    """
    Foramated as i18n, ex. fr_CA
    """
    language: Languages
    subject: String
    message: String
    fromName: String
    """
    If true, the email will not support HTML
    """
    plaintext: Boolean
  }
  type EmailTemplateCategory {
    id: ID
    name: String
  }
  type EmailTemplateVariable {
    id: ID
    name: String
    description: String
  }

  input TemplateContentInput {
    id: ID
    emailTemplateId: Int!
    subject: String
    message: String
    fromName: String
    plaintext: Boolean
  }

  extend type Query {
    emailTemplates(ids: [ID], categoryId: ID): [EmailTemplate]

    emailTemplatesCategories(ids: [ID]): [EmailTemplateCategory]
      @access(slug: "email-templates")
      @isAuthenticated
  }

  extend type Mutation {
    activeEmailTemplate(id: ID): Boolean @isAuthenticated
    emailTemplateContent(data: TemplateContentInput): Boolean @isAuthenticated
  }
`;

module.exports = schema;
