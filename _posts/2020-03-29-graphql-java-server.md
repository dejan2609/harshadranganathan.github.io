---
layout: post
title: "Getting started with GraphQL & Java"
date: 2020-03-29
excerpt: "Development of a custom GraphQL backend with Java and Spring Boot"
tag:
    - graphql-java-kickstart
    - graphql-java-servlet
    - graphql-java documentation
    - graphql-java query example
    - graphql-java
    - graphql-java-spring
    - graphql playground java
    - graphql-java example
    - graphql resolver java
    - graphql-java spring boot example
    - graphql-java example github
    - graphql server
    - graphql-java-spring-boot-starter-webmvc
    - graphql-java-spring-boot-starter-webmvc maven
    - graphql with java spring boot
    - graphql with java example
    - graphql with java tutorial
    - graphql for java developers
    - graphql server with java
    - graphql api with java
    - graphql and java
    - graphql java batch loader
    - graphql java caching
    - graphql java exception handling
    - graphql java enum example
    - graphql java dataloader
    - graphql java datafetcher
    - graphql java documentation
    - graphql java dataloader example
    - graphql java datafetcher example
    - graphql java datafetchingenvironment
    - graphql java directives
    - graphql java getting started
    - graphql java n+1
    - graphql java project example
comments: true
---

## Introduction

GraphQL is a query language for APIs and give clients the power to ask for exactly what they need and nothing more, makes it easier to evolve APIs over time, and enables powerful developer tools.

## Why GraphQL

Let's look at some existing protocols/architectural styles to understand the problems that graphql addresses.

### SOAP

SOAP is a standardized protocol to send messages using HTTP, SMTP and is maintained by W3C.

Pros:

- Single endpoint used for retrieving data
- ACID compliance
- SOAP protocol is supported by a lot of technologies like ws-security etc.

Cons:

- SOAP supports only XML format which must be parsed to be read and consumes more bandwidth.
- More complex
- No caching

### REST

REST is an architectural style that defines a set of recommendations for designing loosely coupled applications that use the HTTP protocol for data transmission.

Pros:

- Better performance
- Deliver data in HTML, XML, JSON, YAML message formats
- API calls can be cached

Cons:

- Data over-fetching/under-fetching (Server driven selection)
- N+1 queries

### GraphQL

Pros:

- Strong data typing (schemas) -> customer knows exactly what is offered

- Single endpoint for retrieving data -> integration simplified

- Client data definition allows fetching exactly the requested data -> reduces network payload and increases application performance

- Search on multiple databases with a single query -> reduce complexity

## Project Code

Example code for this guide is available at Github:

{% include repo-card.html repo="graphql-examples" %}

## Maven Dependency

We add below dependencies to our `pom.xml` to get started with GraphQL and Spring Boot application.

```xml
<!-- Provides default configurations for our spring boot application and a complete dependency tree -->
<parent>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-parent</artifactId>
  <version>2.2.1.RELEASE</version>
  <relativePath/>
</parent>

<properties>
  <java.version>1.8</java.version>
  <graphql.java.version>13.0</graphql.java.version>
  <graphql.java.spring.boot.starter.webmvc.version>1.0</graphql.java.spring.boot.starter.webmvc.version>
</properties>

<dependencies>
  <!-- Spring boot starter for building RESTful application -->
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
  </dependency>

  <!-- GraphQL java dependency -->
  <dependency>
    <groupId>com.graphql-java</groupId>
    <artifactId>graphql-java</artifactId>
    <version>${graphql.java.version}</version>
  </dependency>

  <!-- GrpahQL Java Spring Boot Starter artifact provides a HTTP endpoint on ${graphql.url} with the default value "/graphql" just by being on the classpath -->
  <dependency>
    <groupId>com.graphql-java</groupId>
    <artifactId>graphql-java-spring-boot-starter-webmvc</artifactId>
    <version>${graphql.java.spring.boot.starter.webmvc.version}</version>
  </dependency>
</dependencies>

<build>
  <plugins>
    <plugin>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-maven-plugin</artifactId>
    </plugin>
  </plugins>
</build>
```

## Schema

Schema in GraphQL is the central contract between the client and the server, describing all the types of data and all the operations (queries and mutations) upon those types the server offers.

### SDL

A GraphQL service is created by defining types and fields on those types, then providing functions for each field on each type.

Every GraphQL service defines a set of types which completely describe the set of possible data you can query on that service. Then, when queries come in, they are validated and executed against that schema.

#### Object Types

The most basic components of a GraphQL schema are object types, which just represent a kind of object you can fetch from your service, and what fields it has.

```graphql
type Book {
    title: String
    pageCount: Int
}
```

Here,

-   `Book` is an object type
-   `title` and `pageCount` are fields in the object which can be queried and returned in the response
-   `title` is of type `String` and `pageCount` is of type `Int`

#### Scalar Types

GraphQL comes with a set of default scalar types out of the box:

-   Int: A signed 32‐bit integer
-   Float: A signed double-precision floating-point value
-   String: A UTF‐8 character sequence
-   Boolean: true or false
-   ID: The ID scalar type represents a unique identifier, often used to refetch an object or as the key for a cache

```graphql
type Book {
    title: String
    pageCount: Int
}
```

Here `String` and `Int` are scalar types for the fields.

#### Non-Null

You can apply additional type modifiers (as Non-Null by adding an exclamation mark) that affect validation of those values.

```graphql
type Book {
    title: String!
    pageCount: Int
}
```

This means that our server always expects to return a non-null value for the field `title`, and if it ends up getting a null value that will actually trigger a GraphQL execution error, letting the client know that something has gone wrong.

#### Lists

We can use a type modifier to mark a type as a List, which indicates that this field will return an array of that type. In the schema language, this is denoted by wrapping the type in square brackets, [ and ]

```graphql
type Book {
    title: String!
    pageCount: Int
    bookStores: [BookStores]
}
```

Here, `bookStores` field is of type list and returns an array of `BookStores` object values.

#### Special Types

Most types in your schema will just be normal object types, but there are two types that are special within a schema:

```graphql
schema {
    query: Query
    mutation: Mutation
}
```

Every GraphQL service has a query type which defines the entry point of every GraphQL query.

```graphql
type Query {
    bookById: Book
}
```

Here, `bookById` is an entry point to your query and it returns an object of type `Book`.

#### Arguments

Every field on a GraphQL object type can have zero or more arguments.

All arguments are named. Arguments can be either required or optional.

```graphql
type Query {
    bookById(id: ID!): Book
}
```

Here, `bookById` is expecting a non-null argument `id` to be supplied. If the argument is not supplied in your query then it will result in error.

### Schema-Driven Development

So, far we learnt about the graphql type system and how it's defined. Let's see it in practice for our book details application.

We define a root schema file which defines our `query` operation:

`root.graphqls`

```graphql
schema {
    query: Query
}

type Query {
    """
    Returns book, author and store details for the provided id
    """
    bookById(id: ID!, reason: BookViewReason): Book

    """
    Returns list of books truncated by field argument limit
    """
    listBooks(limit: Int!): [Book]
}
```

We have defined two query operations:

<!-- prettier-ignore-start -->

|      Operation                                           |                                                                                                                                                                                            Description                                         |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| bookById(id: ID!): Book | bookById query operation which returns details about the book, author and book stores which have stock of it. <br/><br/> It accepts one argument: id which is mandatory and returns an object of type Book |
| listBooks(limit: Int!): [Book]                  | listBooks query operation which returns list of available books. <br/><br/> It accepts one argument: limit which is mandatory and returns a list of Book objects                                                                         |
{:.table-striped}

<!-- prettier-ignore-end -->

Let's define our `Book` object.

`book.graphqls`

```graphql
type Book {
  id: ID!
  title: String!
  pageCount: Int
  author: Author,
  bookStores: [BookStores]
}
```

Our `Book` object has fields id, title, pageCount and two objects `Author` and `BookStores`.

`Author` contains details about the book author and `BookStores` is a list which returns details of book stores which have stock of this book.

We define these objects in their respective schema files as follows:

`author.grpahqls`

```graphql
type Author {
  id: ID
  firstName: String
  lastName: String
}
```

`bookStores.graphqls`

```graphql
type BookStores {
  id: ID
  storeName: String
  storeLocation: String
}
```

## DataFetchers



## References

<https://graphql.org/learn/>

<https://www.graphql-java.com/documentation/latest/>
