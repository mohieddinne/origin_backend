const { gql } = require("apollo-server-express");

// Define our schema using the GraphQL schema language
const schema = gql`
  type MenuItem {
    id: Int
    type: Int
    name: String
    icon: String
    color: String
    order: Int
    link: String
    external: Boolean
    data: [MenuCategoryData]
    access: AccessValue
    accessSlug: String
    roles: [Role]
    children: [MenuItem]
  }

  input MenuItemInput {
    id: Int
    type: Int
    order: Int
    name: String
    icon: String
    color: String
    link: String
    external: Boolean
    accessId: Int
    accessSlug: String
    roles: [RoleInput]
    parentId: Int
    data: [MenuCategoryInput]
  }

  type MenuCategoryData {
    id: Int
    menuItemId: Int
    title: String
    image: String
    color_text: String
    color_background: String
    link: String
    external: Boolean
    order: Int
  }

  input MenuCategoryInput {
    id: Int
    menuItemId: Int
    title: String
    image: String
    color_text: String
    color_background: String
    link: String
    external: Boolean
    order: Int
  }

  extend type Query {
    menuItems: [MenuItem] @isAuthenticated
    menuItemsAdmin: [MenuItem] @hasAccess(slug: "platform-admin", scope: "edit")
  }

  extend type Mutation {
    """
    Bulk update the menu
    This function will update, insert and delete the data
    """
    menuItems(items: [MenuItemInput], deletedItems: [Int]): [MenuItem]
      @hasAccess(slug: "platform-admin", scope: "edit")
  }
`;

module.exports = schema;
