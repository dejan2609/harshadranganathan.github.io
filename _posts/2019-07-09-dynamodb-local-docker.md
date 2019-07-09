---
layout: post
title:  "DynamoDB Local in Docker"
date:   2019-07-09
excerpt: "Getting started with DynamoDB Local as a docker image"
tag:
- DynamoDB
- Docker
comments: true
---

## Introduction

DynamoDB local Docker image enables you to get started with DynamoDB local quickly by using a docker image with all the DynamoDB local dependencies and necessary configuration built in. The new Docker image also enables you to include DynamoDB local in your containerized builds and as part of your continuous integration testing.

Image is available at: <https://hub.docker.com/r/amazon/dynamodb-local>

## Docker Compose

We'll create a docker compose file to launch dynamo db local as a container which can then be accessed by other containers.

{% highlight yaml %}
version: '2'
services:
  dynamodb:
    image: amazon/dynamodb-local:latest
    ports:
      - "8000:8000"
    command: ["-jar", "DynamoDBLocal.jar", "-sharedDb", "-inMemory"]
{% endhighlight %}

Here,

image - 

We pull the latest version of amazon/dynamodb-local image


ports -

Expose the container port 8000 to local port 8000 as the local dynamo db runs on this port

command -

By default the local dynamo db starts with inMemory setting. We override the command here with an additional argument -sharedDb. This is to ensure that the dynamo db uses a single database file instead of separate files for each credential and region. If you didn't enable this setting then if in case your app container and local CLI use different AWS creds then they won't be accessing the same dynamo db state. Table created via your CLI won't be visible to your app container.

Run docker compose and access your local dynamo db by using the endpoint url option in your CLI commands.

{% highlight bash %}
docker-compose up

aws dynamodb list-tables --endpoint-url http://localhost:8000
{% endhighlight %}

If you're not using the default network mode and instead using bridge network mode, this is how your docker compose will look like:

{% highlight yaml %}
version: '2'
services:
  dynamodb:
    image: amazon/dynamodb-local:latest
    ports:
      - "8000:8000"
    command: ["-jar", "DynamoDBLocal.jar", "-sharedDb", "-inMemory"]
    networks:
      test-network:
        ipv4_address: 172.16.231.1
networks:
  test-network:
    driver: bridge
    driver_opts:
      com.docker.network.enable_ipv6: "false"
    ipam:
      driver: default
      config:
        - subnet: 172.16.231.0/24
          gateway: 172.16.231.1
{% endhighlight %}

## Accessing DynamoDB Local Container From Another Container

Let's say you have a webapp written in Java running in a tomcat container and you want to access the local dynamo db container for your integration tests.

You can make use of the hostname identical to the container name to access the local dynamodb from your webapp container, in this case, the endpoint url will be http://dynamodb:8000.

In your webapp, when you want to access the local dynamo db container, construct the client by setting the endpoint url to http://dynamodb:8000:

{% highlight java %}
public AmazonDynamoDB dynamoDbClient(final String region) {
  return AmazonDynamoDBClientBuilder.standard()
      .withClientConfiguration(defaultClientConfiguration)
      .withCredentials(new DefaultAWSCredentialsProviderChain)
      .withRegion(region)
      .build();
}

/**
 * Returns Dynamo DB client to access local copy
 * where serviceEndpoint is http://dynamodb:8000 and region can be acceptable region names e.g. us-east-1
*/
public AmazonDynamoDB dynamoDbClient(final String region, final String serviceEndpoint) {
  return AmazonDynamoDBClientBuilder.standard()
      .withClientConfiguration(defaultClientConfiguration)
      .withCredentials(new DefaultAWSCredentialsProviderChain)
      .withRegion(region)
      .withEndpointConfiguration(new EndpointConfiguration(serviceEndpoint, region))
      .build();
}
{% endhighlight %}

Then in your docker compose file, you need to set the AWS creds and region for your webapp container.

{% highlight yaml %}
version: '2'
services:
  dynamodb:
    image: amazon/dynamodb-local:latest
    ports:
      - "8000:8000"
    command: ["-jar", "DynamoDBLocal.jar", "-sharedDb", "-inMemory"]
  tomcat:
    image: webapp:latest
    environment:
      - AWS_ACCESS_KEY_ID=dummy
      - AWS_SECRET_ACCESS_KEY=dummy
      - AWS_REGION=us-east-1
    ports:
      - "80:8080"
{% endhighlight %}

Here,

image -

Docker image of your web app running in tomcat

environment -

Set AWS_ACCESS_KEY_ID & AWS_SECRET_ACCESS_KEY to any dummy value otherwise the credential chain will fail mentioning that it couldn't detect any credentials.

## Creating Tables

Before your application can read/write any data to the local dynamodb, you would have to create the required tables.

Either you can create the tables as part of your webapp code (or) you can bundle a script to your web app image which will create the tables using AWS CLI and start up your application.

Your webapp docker build file can be something like below:

{% highlight docker %}
FROM openjdk:8-jre-alpine

ENV TOMCAT_VERSION 8.0.36
RUN \
    wget https://archive.apache.org/dist/tomcat/tomcat-8/v${TOMCAT_VERSION}/bin/apache-tomcat-${TOMCAT_VERSION}.tar.gz && \
    tar xvzf apache-tomcat-${TOMCAT_VERSION}.tar.gz && \
    mv apache-tomcat-${TOMCAT_VERSION} tomcat && \
    rm -f apache-tomcat-${TOMCAT_VERSION}.tar.gz

RUN pip install awscli --upgrade --user
ENV PATH="$PATH:/root/.local/bin"

COPY start.sh .

ENV JPDA_ADDRESS 8000
ENV JPDA_TRANSPORT dt_socket
ENV JDPA_OPTS -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=8000

EXPOSE 8080 8000 8009

ENTRYPOINT [ "start.sh" ]
{% endhighlight %}

And in your start up script, create the tables and run catalina.

{% highlight bash %}
#!/usr/bin/env bash
aws dynamodb create-table --table-name <table_name> --attribute-definitions  <attribute_definitions> \
--key-schema <key_schema> --billing-mode <billing_mode>  --endpoint-url http://dynamodb:8000 --region <region>

./tomcat/bin/catalina.sh jpda run
{% endhighlight %}