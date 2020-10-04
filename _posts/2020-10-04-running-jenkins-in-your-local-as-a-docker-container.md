---
layout: post
title: "Running Jenkins in your local as a Docker Container"
date: 2020-10-04
excerpt: "Steps to run Jenkins with LDAP and Nexus integration in your local"
tag:
    - how to start jenkins
    - jenkins download
    - jenkins docker
    - jenkins configuration
    - jenkins pipeline docker mount volume
    - persist jenkins data docker
    - local jenkins docker
    - jenkins can be configured to connect to ldap
    - run jenkins pipeline locally
    - run jenkins locally docker
    - jenkins docker localhost
    - jenkins pipeline local repository
    - Installation of Jenkins in a Docker container 
    - Running job on local jenkins with local repository 
    - Local Development Using Jenkins Pipelines
    - jenkins docker compose
    - docker jenkins tutorial
    - jenkins dockerfile
    - dockerfile to create jenkins image
    - jenkins global tool configuration docker
    - migrate jenkins to docker
    - jenkins docker image
    - running jenkins locally
    - Starting Jenkins in Docker Container
    - Local Continuous Delivery Environment With Docker 
comments: true
---

## Project

You can find the project with the required files in below repository.

{% include repo-card.html repo="jenkins-local-container" %}

We'll will be setting up jenkins to run as a docker container along with below services:

| | |
|--|--|
|slapd|stand-alone LDAP daemon|
|phpldapadmin|web-based LDAP client|
|nexus|artifact repository|
|java agent|build agent for running OpenJDK 11 workloads|
{:.table-striped}

<figure>
    <a href="{{ site.url }}/assets/img/2020/10/jenkins-docker-containers.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2020/10/jenkins-docker-containers.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2020/10/jenkins-docker-containers.png">
            <img src="{{ site.url }}/assets/img/2020/10/jenkins-docker-containers.png" alt="">
        </picture>
    </a>
</figure>

## Dockerfile

Let's create the dockerfile with all the commands to assemble the Jenkins image.

`jenkins/Dockerfile`

```text
FROM docker.io/jenkins/jenkins:lts
ARG JAVA_OPTS
ENV JAVA_OPTS "-Djenkins.install.runSetupWizard=false ${JAVA_OPTS:-}"
ENV JENKINS_HOME "/var/jenkins_home"
USER jenkins
```

Commands defined in the dockerfile are as follows:
1. Pull the LTS version of jenkins image and use it as a base image
2. Disable setup wizard on jenkins startup
3. Set `JENKINS_HOME` path
4. Set the username (UID) to use when running the image as `jenkins`    

## Docker Compose

Let's create the docker compose file with the build context, volume mounts and port details.

`docker-compose.yaml`

```yaml
version: '3.7'

services:
  jenkins:
    build:
      context: ./jenkins
    ports:
      - 8080:8080
      - 50000:50000
    environment:
      - TZ=Europe/Oslo
    volumes:
      - jenkins_home:/var/jenkins_home

volumes:
  jenkins_home:
```

{% include donate.html %}
{% include advertisement.html %}

## Makefile

Now, since we have our docker build and compose file we can start up the jenkins container.

You need to run commands to basically first build your image and then to start the container.

Here, we define a `Makefile` with the set of tasks to be executed. So, it's easier to just run the `make` command and it will have the commands to take care of cleaning, building and starting up the containers.

`Makefile`

```text
.PHONY: all
all: compose-down-remove-local compose-up

.PHONY: compose-build
compose-build:
	docker-compose \
		--file docker-compose.yaml \
		build

.PHONY: compose-ps
compose-ps:
	docker-compose \
		--file docker-compose.yaml \
		ps

.PHONY: compose-up
compose-up:
	docker-compose \
		--file docker-compose.yaml \
		up \
		--build \
		--detach

.PHONY: compose-logs
compose-logs:
	docker-compose \
		--file docker-compose.yaml \
		logs \
		--follow \
		--timestamps

.PHONY: compose-up-logs
compose-up-logs:
	$(MAKE) compose-up \
	&& $(MAKE) compose-logs

.PHONY: compose-down-up
compose-down-up:
	$(MAKE) compose-down \
	&& $(MAKE) compose-up

.PHONY: compose-down
compose-down:
	docker-compose \
		--file docker-compose.yaml \
		down

.PHONY: compose-down-remove-local
compose-down-remove-local:
	docker-compose \
		--file docker-compose.yaml \
		down \
		--remove-orphans \
		--rmi local \
		--volumes

.PHONY: compose-down-remove-all
compose-down-remove-all:
	docker-compose \
		--file docker-compose.yaml \
		down \
		--remove-orphans \
		--rmi all \
		--volumes
```

`Note: Ensure that this file is properly tab separated. Otherwise, it will result in errors. Also, make sure that it uses LF line endings.`

## Configuration As Code

Setting up Jenkins is a complex process, as both Jenkins and its plugins require some tuning and configuration, with dozens of parameters to set within the web UI manage section.

The `Configuration as Code plugin` has been designed as an opinionated way to configure Jenkins based on human-readable declarative configuration files. Writing such a file should be feasible without being a Jenkins expert, just translating into code a configuration process one is used to executing in the web UI.

Let's create a `jenkins.yaml` file where we define our jenkins configuration options.

`jenkins/jenkins.yaml`

```yaml
configuration-as-code:
  version: 1
  deprecated: warn
  restricted: reject

jenkins:
  systemMessage: |-
    Welcome to Jenkins!    ٩(◕‿◕)۶
```

Here, we are just defining the version and system message to be displayed in the home page after login. 

You can get the reference documentation for each of the plugins that you need to configure in `jenkins.yaml` file from <http://localhost:8080/configuration-as-code/reference>.

<figure>
    <a href="{{ site.url }}/assets/img/2020/10/configuration-as-code-reference.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2020/10/configuration-as-code-reference.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2020/10/configuration-as-code-reference.png">
            <img src="{{ site.url }}/assets/img/2020/10/configuration-as-code-reference.png" alt="">
        </picture>
    </a>
</figure>

Let's update our `Dockerfile` to add this configuration file to our container.

`jenkins/Dockerfile`

```text
FROM docker.io/jenkins/jenkins:lts
ARG JAVA_OPTS
ENV JAVA_OPTS "-Djenkins.install.runSetupWizard=false ${JAVA_OPTS:-}"
ENV JENKINS_HOME "/var/jenkins_home"
USER jenkins

COPY jenkins.yaml /usr/share/jenkins/ref/jenkins.yaml
```

`Note: This configuration as code approach won't work unless you install the configuration-as-code plugin which we will do in our plugins section`

{% include donate.html %}
{% include advertisement.html %}

## Plugins

You can rely on the `install-plugins.sh` script to pass a set of plugins to download with their dependencies. This script will perform downloads from update centers, and internet access is required for the default update centers.

Let's create a `plugins.txt` file with the list of plugins that we need to be pre-installed.

`jenkins/plugins.txt`

```text
ace-editor:1.1
ant:1.11
antisamy-markup-formatter:2.1
apache-httpcomponents-client-4-api:4.5.10-2.0
bouncycastle-api:2.18
branch-api:2.5.8
build-timeout:1.20
cloudbees-folder:6.14
command-launcher:1.4
configuration-as-code:1.43
credentials:2.3.12
credentials-binding:1.23
display-url-api:2.3.3
durable-task:1.34
echarts-api:4.8.0-2
email-ext:2.73
git:4.3.0
git-client:3.3.2
git-server:1.9
github:1.31.0
github-api:1.115
github-branch-source:2.8.3
gradle:1.36
handlebars:1.1.1
jackson2-api:2.11.2
jdk-tool:1.4
jquery-detached:1.2.1
jquery3-api:3.5.1-1
jsch:0.1.55.2
junit:1.30
ldap:1.24
lockable-resources:2.8
mailer:1.32
mapdb-api:1.0.9.0
matrix-auth:2.6.2
matrix-project:1.17
momentjs:1.1.1
okhttp-api:3.14.9
pam-auth:1.6
pipeline-build-step:2.13
pipeline-github-lib:1.0
pipeline-graph-analysis:1.10
pipeline-input-step:2.11
pipeline-milestone-step:1.3.1
pipeline-model-api:1.7.1
pipeline-model-definition:1.7.1
pipeline-model-extensions:1.7.1
pipeline-rest-api:2.13
pipeline-stage-step:2.5
pipeline-stage-tags-metadata:1.7.1
pipeline-stage-view:2.13
plain-credentials:1.7
plugin-util-api:1.2.2
resource-disposer:0.14
scm-api:2.6.3
script-security:1.74
snakeyaml-api:1.26.4
ssh-credentials:1.18.1
ssh-slaves:1.31.2
structs:1.20
subversion:2.13.1
timestamper:1.11.5
token-macro:2.12
trilead-api:1.0.8
workflow-aggregator:2.6
workflow-api:2.40
workflow-basic-steps:2.20
workflow-cps:2.82
workflow-cps-global-lib:2.17
workflow-durable-task-step:2.35
workflow-job:2.39
workflow-multibranch:2.22
workflow-scm-step:2.11
workflow-step-api:2.22
workflow-support:3.5
ws-cleanup:0.38
```

Next, we need to pass this file to `install-plugins.sh` script to install the plugins.

`Note: Make sure the plugins.txt file has LF line endings otherwise the plugin downloads will fail`

Let's update our dockerfile with the required commands.

`jenkins/Dockerfile`

```text
FROM docker.io/jenkins/jenkins:lts
ARG JAVA_OPTS
ENV JAVA_OPTS "-Djenkins.install.runSetupWizard=false ${JAVA_OPTS:-}"
ENV JENKINS_HOME "/var/jenkins_home"
USER jenkins

COPY plugins.txt /usr/share/jenkins/ref/plugins.txt
RUN xargs /usr/local/bin/install-plugins.sh </usr/share/jenkins/ref/plugins.txt

COPY jenkins.yaml /usr/share/jenkins/ref/jenkins.yaml
```

{% include donate.html %}
{% include advertisement.html %}

## Security

### Access Control

You should lock down the access to Jenkins UI so that users are authenticated and appropriate set of permissions are given to them. This setting is controlled mainly by two axes:

- **Security Realm**, which determines users and their passwords, as well as what groups the users belong to.

- **Authorization Strategy**, which determines who has access to what.

In our `jenkins.yaml` file, we will define the security realm to use default username and password for authentication.

Possible values for security realm:
- legacy
- local
- ldap
- pam
- none

```yaml
jenkins:
  securityRealm:
    local:
      allowsSignup: false
      enableCaptcha: false
      users:
        - id: ${JENKINS_ADMINISTRATOR_USERNAME:-administrator}
          password: ${JENKINS_ADMINISTRATOR_PASSWORD:-changeit}
```

With respect to authorization strategy, we choose the simplest option which is to allow logged in users to perform any actions.

Possible values:
- unsecured
- legacy
- loggedInUsersCanDoAnything
- globalMatrix
- projectMatrix

```yaml
jenkins:
  authorizationStrategy: "loggedInUsersCanDoAnything"
```

Here is the complete `jenkins.yaml` file -

```yaml
configuration-as-code:
  version: 1
  deprecated: warn
  restricted: reject

jenkins:
  systemMessage: |-
    Welcome to Jenkins!    ٩(◕‿◕)۶
  
  authorizationStrategy: "loggedInUsersCanDoAnything"

  securityRealm:
    local:
      allowsSignup: false
      enableCaptcha: false
      users:
        - id: ${JENKINS_ADMINISTRATOR_USERNAME:-administrator}
          password: ${JENKINS_ADMINISTRATOR_PASSWORD:-changeit}
```

{% include donate.html %}
{% include advertisement.html %}

### CrumbIssuer (CSRF Protection)

A CrumbIssuer represents an algorithm to generate a nonce value, known as a crumb, to counter cross site request forgery exploits. 

Crumbs are typically hashes incorporating information that uniquely identifies an agent that sends a request, along with a guarded secret so that the crumb value cannot be forged by a third party.

Let's update `jenkins.yaml` to use the `standard` crumb issuer.

```yaml
jenkins:
  crumbIssuer: "standard"
```

Here is the complete `jenkins.yaml` file -

```yaml
configuration-as-code:
  version: 1
  deprecated: warn
  restricted: reject

jenkins:
  systemMessage: |-
    Welcome to Jenkins!    ٩(◕‿◕)۶
  
  authorizationStrategy: "loggedInUsersCanDoAnything"

  securityRealm:
    local:
      allowsSignup: false
      enableCaptcha: false
      users:
        - id: ${JENKINS_ADMINISTRATOR_USERNAME:-administrator}
          password: ${JENKINS_ADMINISTRATOR_PASSWORD:-changeit}

  crumbIssuer: "standard"
```

{% include donate.html %}
{% include advertisement.html %}

## Location Configuration

We need to configure the location settings to resolve some of the errors shown after jenkins startup.

adminAddress - Notification e-mails from Jenkins to project owners will be sent with this address in the from header. 

url - This value is used to let Jenkins know how to refer to itself

```yaml
unclassified:
  location:
    adminAddress: "Harshad Ranganathan <rharshad93@gmail.com>"
    url: "http://localhost:8080" 
```

Here is the complete `jenkins.yaml` file -

```yaml
configuration-as-code:
  version: 1
  deprecated: warn
  restricted: reject

jenkins:
  systemMessage: |-
    Welcome to Jenkins!    ٩(◕‿◕)۶
  
  authorizationStrategy: "loggedInUsersCanDoAnything"

  securityRealm:
    local:
      allowsSignup: false
      enableCaptcha: false
      users:
        - id: ${JENKINS_ADMINISTRATOR_USERNAME:-administrator}
          password: ${JENKINS_ADMINISTRATOR_PASSWORD:-changeit}

  crumbIssuer: "standard"

unclassified:
  location:
    adminAddress: "Harshad Ranganathan <rharshad93@gmail.com>"
    url: "http://localhost:8080"
```

## Handling Secrets


{% include donate.html %}
{% include advertisement.html %}

## References

<https://github.com/jenkinsci/configuration-as-code-plugin>

<https://github.com/jenkinsci/docker#preinstalling-plugins>

<https://www.jenkins.io/doc/book/system-administration/security/>
