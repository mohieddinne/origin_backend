const { gql } = require("apollo-server-express");

// Define our schema using the GraphQL schema language
const schema = gql`
  type ChatMessage {
    id: ID!
    user: User!
    type: Int
    content: String!
    room: ChatRoom
    createdAt: String
    updatedAt: String
  }

  type ChatRoom {
    id: ID!
    name: String!
    users: [User]
    lastMessage: String
    unreadMessages: Int
    messages: [ChatMessage]
  }

  extend type Query {
    chatRooms: [ChatRoom] @hasAccess(slug: "chat", scope: "view")
    chatMessages(room: ID!): [ChatMessage!]
      @hasAccess(slug: "chat", scope: "view")
    chatContacts: [User] @hasAccess(slug: "chat", scope: "view")
  }

  extend type Mutation {
    createChatRoom(usersId: [Int]!, name: String): ID!
      @hasAccess(slug: "chat", scope: "view")
    leaveChatRoom(id: ID!): Boolean @hasAccess(slug: "chat", scope: "view")
    inviteUserToJoinChatRoom(roomId: ID!, usersId: [Int]!): Boolean
      @hasAccess(slug: "chat", scope: "view")
    postMessageInNewRoom(content: String!, usersId: [Int]!, name: String): ID!
      @hasAccess(slug: "chat", scope: "view")
    postMessage(roomId: ID!, content: String!): ID!
      @hasAccess(slug: "chat", scope: "view")
    marckMessage(roomId: ID): Int
  }

  extend type Subscription {
    chatRoom: ChatRoom! @hasAccess(slug: "chat", scope: "view")
    chatMessage: ChatMessage! @hasAccess(slug: "chat", scope: "view")
    unreadMessage: Int
  }
`;

module.exports = schema;
