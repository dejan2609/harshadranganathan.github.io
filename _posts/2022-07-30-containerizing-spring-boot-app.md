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

{% include repo-card.html repo="spring-boot-example" %}

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
- Sets JVM memory requirements and sets them as command line options inside the container
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

{% include donate.html %}
{% include advertisement.html %}
