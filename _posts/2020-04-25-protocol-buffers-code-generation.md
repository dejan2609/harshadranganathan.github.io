---
layout: post
title: "Generate Code for Protocol Buffers Using ProtoC"
date: 2020-04-25
excerpt: "Using protocol buffer compiler to generate code for any given protocol definition"
tag:
    - protobuf
    - protoc
    - protobuf java
    - protobuf go
    - protobuf python
    - protobuf tutorial
    - proto3
comments: true
---

## Introduction

Protocol buffers are Google's language-neutral, platform-neutral, extensible mechanism for serializing structured data – think XML, but smaller, faster, and simpler.

You define how you want your data to be structured once, then you can use special generated source code to easily write and read your structured data to and from a variety of data streams and using a variety of languages.

Protocol buffers currently support generated code in Java, Python, Go and many more languages.

Here, we will explore on the approaches to generate code for protocol buffers for various languages using protoc compiler.

Sample project with protoc configurations for various languages is available in below repo:

{% include repo-card.html repo="protobuf-examples" %}

## Install Protocol Buffer Compiler

First step is to download and install protocol buffer compiler for your system.

Download the **protoc** archive from below release page:

<https://github.com/protocolbuffers/protobuf/releases>

Extract the files and add the path to **bin** directory in your system environment variables.

e.g. 

```text
C:\protoc-3.11.4-win64\bin
```

Check if **protoc** command works:

```bash
$ protoc --version
libprotoc 3.11.4
```

{% include donate.html %}
{% include advertisement.html %}

## Java

### protobuf-gradle-plugin

There is a handy Gradle plugin that compiles Protocol Buffer (aka. Protobuf) definition files (*.proto) in your project. There are two pieces of its job:

1. It assembles the Protobuf Compiler (protoc) command line and use it to generate Java source files out of your proto files.

2. It adds the generated Java source files to the input of the corresponding Java compilation unit (sourceSet in a Java project; variant in an Android project), so that they can be compiled along with your Java sources.

Add **protobuf-gradle-plugin** as a dependency to your **build.gradle** file:

```gradle
/*
 Gradle plugin that compiles Protocol Buffer (aka. Protobuf) definition files (*.proto) in your project
 Adds the generated Java source files to the input of the corresponding Java compilation unit (sourceSet in a Java project; variant in an Android project), so that they can be compiled along with your Java sources.
*/
buildscript {
    repositories {
        mavenCentral()
    }
    dependencies {
        classpath 'com.google.protobuf:protobuf-gradle-plugin:0.8.12'
    }
}
```

Apply the plugins to your project (order is important):

```gradle
apply plugin: 'java'
apply plugin: 'com.google.protobuf'
// integrates with the idea plugin and automatically registers the proto files and generated Java code as sources
apply plugin: 'idea'
```

Configure protoc executable:

By default the plugin will search for the protoc executable in the system search path. We recommend you to take the advantage of pre-compiled protoc that we have published on Maven Central.

```gradle
protobuf {
    // Configure the protoc executable
    protoc {
        // Download from repositories
        artifact = 'com.google.protobuf:protoc:3.11.4'
    }
}
```

Add below runtime libraries as dependencies:

```gradle
dependencies {
    compile 'com.google.protobuf:protobuf-java:3.11.4'
    compile 'com.google.protobuf:protobuf-java-util:3.11.4'
}
```

Complete sample **build.gradle** file is as follows:

```gradle
group 'com.examples.protobuf'
version '1.0-SNAPSHOT'

apply plugin: 'java'
apply plugin: 'com.google.protobuf'
// integrates with the idea plugin and automatically registers the proto files and generated Java code as sources
apply plugin: 'idea'

sourceCompatibility = 1.8

repositories {
    mavenCentral()
}

/*
 Gradle plugin that compiles Protocol Buffer (aka. Protobuf) definition files (*.proto) in your project
 Adds the generated Java source files to the input of the corresponding Java compilation unit (sourceSet in a Java project; variant in an Android project), so that they can be compiled along with your Java sources.
*/
buildscript {
    repositories {
        mavenCentral()
    }
    dependencies {
        classpath 'com.google.protobuf:protobuf-gradle-plugin:0.8.12'
    }
}

dependencies {
    compile 'com.google.protobuf:protobuf-java:3.11.4'
    compile 'com.google.protobuf:protobuf-java-util:3.11.4'
}

protobuf {
    // Configure the protoc executable
    protoc {
        artifact = 'com.google.protobuf:protoc:3.11.4'
    }
}
```

Once you install these dependencies, run **Build Project** in your IDE to generate the java source files based on the proto files available inside **src/main/proto** directory.  The plugin will automatically add these files to your classpath.

The generated source files will then be available at **build/generated/source/proto/main/java** directory.

{% include donate.html %}
{% include advertisement.html %}

## Python

### protoc

You can generate python code for proto files using below sample command:

```bash
protoc -I=PATH  --python_out=OUT_DIR  FILENAME
```

where,

-I - Specify the directory in which to search for imports

--python_out - Directory in which to generate Python source file

FILENAME - Relative file path from current working directory

Let's consider we have a package named **simple** which contains the **proto** file, then the protoc command would be:

```bash
protoc -I=simple/ --python_out=simple/ simple/simple.proto
```

This will generate the python code for the given protocol definition, however, an additional package is required for the code to run.

### protobuf

Install **protobuf** dependency to your project.

```bash
# command for pip
$ pip install protobuf

# command for pipenv
$ pipenv install protobuf
```

Sample Pipfile:

```ini
[[source]]
name = "pypi"
url = "https://pypi.org/simple"
verify_ssl = true

[dev-packages]

[packages]
protobuf = "*"

[requires]
python_version = "3.7"
```

{% include donate.html %}
{% include advertisement.html %}

## Go

### protoc

You can generate python code for proto files using below sample command:

```bash
protoc -I=PATH  --go_out=OUT_DIR  FILENAME
```

where,

-I - Specify the directory in which to search for imports

--go_out - Directory in which to generate GO source file

FILENAME - Relative file path from current working directory

Sample protoc command:

```bash
protoc -I src/ --go_out=src/ src/simple/simple.proto
```

This will generate the go code for the given protocol definition, however, an additional package is required for the code to run.

### protobuf

Create a **go.mod** file and add below dependencies:

```text
module github.com/simple

go 1.14

require (
	github.com/golang/protobuf v1.4.0
	google.golang.org/protobuf v1.21.0
)
```

**Note: github.com/golang/protobuf module is the first major version Go protocol buffer API which has now been superseded by the google.golang.org/protobuf module, which contains an updated and simplified API, support for protobuf reflection, and many other improvements.**

**Code generated by google.golang.org/protobuf is still dependent on github.com/golang/protobuf module. Hence we add both dependencies.**

To install the module dependencies, run any of the below commands:

```bash
$ go mod tidy

$ go mod build
```

{% include donate.html %}
{% include advertisement.html %}

## References

<https://developers.google.com/protocol-buffers>

<https://github.com/google/protobuf-gradle-plugin>