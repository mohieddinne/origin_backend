const { gql } = require("apollo-server-express");

// Define our schema using the GraphQL schema language
const schema = gql`
  type ContentData {
    id: Int
    author: User
    title: String
    content: String
    status: Int
    category: Int
    excerpt: String
    slug: String
    views: Int
    featured_image: String
    publishedAt: String
    createdAt: String
    updatedAt: String
    read: Boolean
  }
  type UnreadArticles {
    articleId: Int
  }
  input ContentInput {
    id: Int
    author_id: Int
    title: String
    content: String
    status: Int
    featured_image: Int
    category: Int
    excerpt: String
    slug: String
    publishedAt: String
    read: Boolean
  }

  extend type Query {
    contents(ids: [Int]): [ContentData]
      @hasAccess(slug: "content", scope: "view")
  }

  extend type Mutation {
    content(content: ContentInput!): Int @isAuthenticated
    deleteContent(ids: [Int]!): Boolean
      @hasAccess(slug: "content", scope: "delete")
    incrementViewsOnContent(id: Int!): Boolean
      @hasAccess(slug: "content", scope: "view")
    uploadImageForContent(file: Upload!, id: Int, type: String): String
      @isAuthenticated
  }
`;

module.exports = schema;
