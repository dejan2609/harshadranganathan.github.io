---
layout: post
title:  "Containerizing your Spring Boot App"
date:   2022-07-30
excerpt: "Approaches to containerize your Spring Boot code"
tag:
- dockerize spring boot application maven
- spring-boot:build-image
- dockerfile spring boot java 11
- spring boot microservices with docker example
- docker-compose spring boot
- dockerize spring boot application
- spring boot with docker
comments: true
---

## Introduction

We will look at various ways to containerize a Spring Boot application.

You can refer below sample project for the complete setup.

{% include repo-card.html repo="spring-boot-example" %}

{% include donate.html %}
{% include advertisement.html %}

## Spring Boot Maven Plugin

You can use the Spring Boot build plugin for Maven to create container images.

The plugin creates an OCI image (the same format as one created by docker build) by using Cloud Native Buildpacks.

You do not need a Dockerfile, but you do need a Docker daemon running in your local or remote.

To use Spring Boot Maven plugin, include below XML in your `pom.xml`:

```xml
<project>
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.springboot.example</groupId>
  <artifactId>spring-boot-example</artifactId>
  <version>1.0-SNAPSHOT</version>

  <properties>
    <spring.boot.version>2.7.2</spring.boot.version>
  </properties>

  <build>
    <plugins>
      <plugin>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-maven-plugin</artifactId>
        <version>${spring.boot.version}</version>
      </plugin>
    </plugins>
  </build>
</project>
```

Above plugin has `spring-boot:build-image` goal, which packages an application into an OCI image using buildpack.

For example, you can build an image using below command:

```bash
./mvnw spring-boot:build-image
```

You can also specify the image name using `spring-boot.build-image.imageName` parameter:

```bash
./mvnw spring-boot:build-image -Dspring-boot.build-image.imageName=spring-boot-example
```

Spring Boot `build-image` goal uses `Paketo Buildpacks` to build the OCI compliant image.

Above command performs the following actions:

- Pulls Paketo Base Builder image
- Pulls JRE Runtime image, Executable Jar image & Spring Boot image
- Sets JVM memory requirements as command line options inside the container
- Builds your App image

```text
 
[INFO] --- spring-boot-maven-plugin:2.7.2:build-image (default-cli) @ spring-boot-example ---
[INFO] Building image 'docker.io/library/spring-boot-example:latest'
[INFO]
[INFO]  > Pulling builder image 'docker.io/paketobuildpacks/builder:base' 0%
[INFO]  > Pulling builder image 'docker.io/paketobuildpacks/builder:base' 4%
[INFO]     [creator]         $BPL_JVM_THREAD_COUNT        250                                                          the number of threads in memory calculation
[INFO]     [creator]         $JAVA_TOOL_OPTIONS                                                                        the JVM launch flags
[INFO]     [creator]         Using Java version 11 from BP_JVM_VERSION
[INFO]     [creator]       BellSoft Liberica JRE 11.0.16: Contributing to layer
[INFO]     [creator]     Paketo Executable JAR Buildpack 6.2.5
[INFO]     [creator]       https://github.com/paketo-buildpacks/executable-jar
[INFO]     [creator]     Paketo Spring Boot Buildpack 5.15.0
[INFO]     [creator]       https://github.com/paketo-buildpacks/spring-boot
[INFO] Successfully built image 'docker.io/library/spring-boot-example:latest'
```

### Specify JVM version

Since the buildpack only ships a single version of each supported line, updates to the buildpack can change the exact version of the JDK or JRE.

i.e. If you are running the buildpack today it might download JDK 11 assets but if the buildpack is updated to use JDK 17 then that's what will get downloaded. 

In order to lock the JVM version, you can set `BP_JVM_VERSION` environment variable.

For example, you can update the Spring Boot Maven plugin with the environment variable as follows:

```xml
<project>
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.springboot.example</groupId>
  <artifactId>spring-boot-example</artifactId>
  <version>1.0-SNAPSHOT</version>

  <properties>
    <spring.boot.version>2.7.2</spring.boot.version>
    <java.version>11</java.version>
  </properties>

  <build>
    <plugins>
      <plugin>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-maven-plugin</artifactId>
        <version>${spring.boot.version}</version>
        <configuration>
          <image>
            <env>
              <!-- Used by Paketo Buildpacks to choose correct runtime version -->
              <BP_JVM_VERSION>${java.version}</BP_JVM_VERSION>
            </env>
          </image>
        </configuration>
      </plugin>
    </plugins>
  </build>
</project>
```

{% include donate.html %}
{% include advertisement.html %}

## Jib Maven Plugin

Jib is an open source tool by Google which doesn't need docker for building images.

Jib builds the image by using the same standard output as you get from docker build but does not use docker.

You also do not need a Dockerfile.

Jib separates local application resources from dependencies, but it goes a step further and also puts snapshot dependencies into a separate layer, since they are more likely to change. 

To use Jib, add below to your `pom.xml` -

```xml
<project>
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.springboot.example</groupId>
  <artifactId>spring-boot-example</artifactId>
  <version>1.0-SNAPSHOT</version>

  <properties>
    <spring-boot.build-image.imageName>spring-boot-example</spring-boot.build-image.imageName>
  </properties>

  <build>
    <plugin>
      <groupId>com.google.cloud.tools</groupId>
      <artifactId>jib-maven-plugin</artifactId>
      <version>3.2.1</version>
      <configuration>
        <to>
          <image>${spring-boot.build-image.imageName}</image>
        </to>
      </configuration>
    </plugin>
  </build>
</project>
```

### Build Image without using Docker Daemon

To generate container image without using docker daemon, run below maven command:

```bash
./mvnw compile jib:build
```

Note - 

You need to be authenticated to a container registry of your choice. In our example, we didn't specify any particular container registry so it will use DockerHub registry as default (docker login).

Jib has multiple ways to configure authentication depending on the registry of your choice. Please refer below guides as it is beyond the scope of this article -

<https://github.com/GoogleContainerTools/jib/tree/master/jib-maven-plugin#authentication-methods>

<https://github.com/GoogleContainerTools/jib/blob/master/docs/faq.md#what-should-i-do-when-the-registry-responds-with-unauthorized>



You will get below sample output -

```text
[INFO] --- jib-maven-plugin:3.2.1:build (default-cli) @ spring-boot-example ---
[INFO]
[INFO] Containerizing application to spring-boot-example...
[INFO] Using base image with digest: sha256:
[INFO]
[INFO] Container entrypoint set to [java, -cp, @/app/jib-classpath-file, com.springboot.example.Example]
[INFO] Executing tasks:
[INFO] [==============================] 100.0% complete
```

### Build Image using Docker Daemon

To build image directly to Docker daemon, run below command -

```bash
./mvnw compile jib:dockerBuild
```

Note - This uses the docker command line tool and requires that you have docker available on your PATH.

```text
[INFO] --- jib-maven-plugin:3.2.1:build (default-cli) @ spring-boot-example ---
[INFO]
[INFO] Containerizing application to Docker daemon as spring-boot-example...
[INFO] Using base image with digest: sha256:
[INFO]
[INFO] Container entrypoint set to [java, -cp, @/app/jib-classpath-file, com.springboot.example.Example]
[INFO] Built image to Docker daemon as spring-boot-example
[INFO] Executing tasks:
[INFO] [==============================] 100.0% complete
```

{% include donate.html %}
{% include advertisement.html %}