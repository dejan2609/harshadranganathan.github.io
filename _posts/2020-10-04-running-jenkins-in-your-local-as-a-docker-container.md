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

#### Security Realm

In our `jenkins.yaml` file, we will define the security realm to use default username and password for authentication.

If we don't define the security realm, then there will be no login required.

Possible values:
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

Here, we had utilized variable substitution feature available in configuration file to define the username and password. 

For example, `id: "${JENKINS_ADMINISTRATOR_USERNAME:-administrator}"` will evaluate to `administrator` if `$JENKINS_ADMINISTRATOR_USERNAME` is unset in the environment variables. 

#### Authorization Strategy

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

### Environment Variables

Environment variables can be directly read by JCasC when loading configurations. 

Secrets can be also be injected using environment variables.

In our configuration file, we had previously defined variables for username/password.

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

Let's create a new file `secrets.env` which will contain all our secrets which needs to be injected as environment variables.

`jenkins/secrets.env`

```text
JENKINS_ADMINISTRATOR_USERNAME=admin
JENKINS_ADMINISTRATOR_PASSWORD=admin123
```

Then in our docker compose file, we must configure to use this env file.

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
    
    env_file: ./jenkins/secrets.env

volumes:
  jenkins_home:
```


{% include donate.html %}
{% include advertisement.html %}

## LDAP

Previously, we had configured the login to use default username/password. 

We will change it to use LDAP with users and groups configured in the active directory.

### slapd 

Slapd is a stand-alone LDAP daemon. It listens for LDAP connections on any number of ports (default 389), responding to the LDAP operations it receives over these connections

#### LDIF Configuration

We can define the data for LDAP database in a LDIF file.

Let's define some sample organization, users and groups in three LDIF files.

`slapd/configurations/ou.ldif`

```text
dn: ou=Users,dc=acme,dc=local
objectClass: organizationalUnit
objectClass: top
ou: Users

dn: ou=Groups,dc=acme,dc=local
objectClass: organizationalUnit
ou: Groups
```

`slapd/configurations/users.ldif`

```text
dn: cn=user,ou=Users,dc=acme,dc=local
objectClass: inetOrgPerson
objectClass: posixAccount
objectClass: shadowAccount
uid: user
sn: Lastname
givenName: Firstname
cn: Acme User
displayName: Acme User
uidNumber: 10003
gidNumber: 8000
userPassword: changeit
homeDirectory: /home/user
mail: user@acme.local

dn: cn=manager,ou=Users,dc=acme,dc=local
objectClass: inetOrgPerson
objectClass: posixAccount
objectClass: shadowAccount
uid: manager
sn: Lastname
givenName: Firstname
cn: Acme Manager
displayName: Acme Manager
uidNumber: 10002
gidNumber: 8000
userPassword: changeit
homeDirectory: /home/manager
mail: manager@acme.local

dn: cn=service,ou=Users,dc=acme,dc=local
cn: service
displayName: Acme Service
gidnumber: 8000
givenName: Firstname
homedirectory: /home/service
loginshell: /bin/bash
objectclass: inetOrgPerson
objectclass: posixAccount
objectclass: simpleSecurityObject
sn: Lastname
uid: service
uidnumber: 10001
userPassword: changeit
mail: service@acme.local

dn: cn=superuser,ou=Users,dc=acme,dc=local
objectClass: inetOrgPerson
objectClass: posixAccount
objectClass: shadowAccount
objectclass: simpleSecurityObject
uid: superuser
sn: Lastname
givenName: Firstname
cn: Acme Superuser
displayName: Acme Superuser
uidNumber: 10000
gidNumber: 8000
userPassword: changeit
homeDirectory: /home/superuser
mail: superuser@acme.local
```

`slapd/configurations/groups.ldif`

```text
dn: cn=Acme Superusers,ou=Groups,dc=acme,dc=local
objectClass: posixGroup
cn: Acme Superusers
gidNumber: 5000
memberUid: superuser

dn: cn=Acme Servicers,ou=Groups,dc=acme,dc=local
objectclass: posixGroup
cn: Acme Servicers
gidnumber: 5001
memberUid: service

dn: cn=Acme Managers,ou=Groups,dc=acme,dc=local
objectClass: posixGroup
cn: Acme Managers
gidNumber: 5002
memberUid: manager

dn: cn=Acme Users,ou=Groups,dc=acme,dc=local
objectClass: posixGroup
cn: Acme Users
gidNumber: 5003
memberUid: user
```

#### Dockerfile

Let's define the dockerfile which will have the commands to install slapd daemon, required utilities and copy the ldif data files.

`slapd/Dockerfile`

```text
FROM docker.io/library/debian:10-slim

# References
# https://github.com/rackerlabs/dockerstack/blob/master/keystone/openldap/Dockerfile
# https://github.com/acme/docker-openldap/blob/master/memberUid/Dockerfile
# https://github.com/larrycai/docker-openldap/blob/master/Dockerfile

# https://github.com/hadolint/hadolint/wiki/DL4006#correct-code
SHELL ["/bin/bash", "-o", "pipefail", "-c"]

# install slapd in noninteractive mode
RUN apt-get update \
    && echo "slapd slapd/root_password password changeit" | debconf-set-selections \
    && echo "slapd slapd/root_password_again password changeit" | debconf-set-selections \
    && echo "slapd slapd/internal/adminpw password changeit" | debconf-set-selections \
    && echo "slapd slapd/internal/generated_adminpw password changeit" | debconf-set-selections \
    && echo "slapd slapd/password2 password changeit" | debconf-set-selections \
    && echo "slapd slapd/password1 password changeit" | debconf-set-selections \
    && echo "slapd slapd/domain string acme.local" | debconf-set-selections \
    && echo "slapd shared/organization string Acme" | debconf-set-selections \
    && echo "slapd slapd/backend string HDB" | debconf-set-selections \
    && echo "slapd slapd/purge_database boolean true" | debconf-set-selections \
    && echo "slapd slapd/move_old_database boolean true" | debconf-set-selections \
    && echo "slapd slapd/allow_ldap_v2 boolean false" | debconf-set-selections \
    && echo "slapd slapd/no_configuration boolean false" | debconf-set-selections \
    && DEBIAN_FRONTEND=noninteractive apt-get install \
        --assume-yes \
        --no-install-recommends \
        ldap-utils \
        slapd \
    && rm --force --recursive /var/lib/apt/lists/*

# ca-certificates is already the newest version (20190110).
# openssl is already the newest version (1.1.1c-1).

COPY configurations/*.ldif /tmp/

# TODO: Use initialization scripts if available.
# TODO: Deprecate this Dockerfile when initialization scripts are used.
# https://github.com/osixia/docker-openldap/issues/20

# Workaround DL3001 for `service slapd start` Command
# https://github.com/hadolint/hadolint/wiki/DL3001

RUN mkdir -p /var/ldap/acme \
    && chown --recursive openldap /var/ldap \
    && /etc/init.d/slapd start \
    && ldapadd -H ldapi:/// -f /tmp/ou.ldif -x -D "cn=admin,dc=acme,dc=local" -w changeit -v \
    && ldapadd -H ldapi:/// -f /tmp/groups.ldif -x -D "cn=admin,dc=acme,dc=local" -w changeit -v \
    && ldapadd -H ldapi:/// -f /tmp/users.ldif -x -D "cn=admin,dc=acme,dc=local" -w changeit -v \
    && rm --verbose /tmp/*.ldif

EXPOSE 389

CMD ["slapd", "-h", "ldap:///" ,"-g", "openldap", "-u", "openldap", "-d", "256"]
```

#### Docker Compose

Let's update our root docker compose file to create the slapd container first before the jenkins container.

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
    env_file: ./jenkins/secrets.env
    depends_on:
      - slapd

  slapd:
    build:
      context: ./slapd
    ports:
      - 389:389
      - 636:636

volumes:
  jenkins_home:
```


{% include donate.html %}
{% include advertisement.html %}

### phpLDAPadmin 

phpLDAPadmin (also known as PLA) is a web-based LDAP client. It provides easy, anywhere-accessible, multi-language administration for your LDAP server.

Its hierarchical tree-viewer and advanced search functionality make it intuitive to browse and administer your LDAP directory.

Let's update the docker compose file to run phpLDAPadmin container.

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
    env_file: ./jenkins/secrets.env
    depends_on:
      - slapd

  slapd:
    build:
      context: ./slapd
    ports:
      - 389:389
      - 636:636

  phpldapadmin:
    image: docker.io/osixia/phpldapadmin:0.9.0
    environment:
      PHPLDAPADMIN_LDAP_HOSTS: slapd
      PHPLDAPADMIN_HTTPS: 'false'
    ports:
      - 8090:80
    depends_on:
      - slapd

volumes:
  jenkins_home:
```

If you run the docker compose file then you should be able to access the LDAP web client at <http://localhost:8090/>.

You can login using below credentials which we had earlier configured in our slapd docker file.

```text
Login DN: cn=admin,dc=acme,dc=local
Password: changeit
```

<figure>
    <a href="{{ site.url }}/assets/img/2020/10/phpLDAPadmin.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2020/10/phpLDAPadmin.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2020/10/phpLDAPadmin.png">
            <img src="{{ site.url }}/assets/img/2020/10/phpLDAPadmin.png" alt="">
        </picture>
    </a>
</figure>

{% include donate.html %}
{% include advertisement.html %}

### Access Control

#### Security Realm

We had earlier configured to use `local` security realm. Since, now we have ldap set up we can update our jenkins configuration to use LDAP for authentication.

`jenkins/jenkins.yaml`

```yaml
jenkins:
  securityRealm:
    # local:
    #   allowsSignup: false
    #   enableCaptcha: false
    #   users:
    #     - id: ${JENKINS_ADMINISTRATOR_USERNAME:-administrator}
    #       password: ${JENKINS_ADMINISTRATOR_PASSWORD:-changeit}
    ldap:
      configurations:
      - groupSearchFilter: "(& (cn={0}) (objectclass=posixGroup) )"
        inhibitInferRootDN: false
        managerDN: "cn=service,ou=Users,dc=acme,dc=local"
        managerPasswordSecret: ${LDAP_SERVICE_PASSWORD}
        rootDN: "dc=acme,dc=local"
        server: "ldap://slapd:389"
      disableMailAddressResolver: false
      disableRolePrefixing: true
      groupIdStrategy: "caseInsensitive"
      userIdStrategy: "caseInsensitive"
```

Update `secrets.env` file specifying the LDAP password which will be substituted for variable `${LDAP_SERVICE_PASSWORD}` in the jenkins configuration file.

`jenkins/secrets.env`

```text
JENKINS_ADMINISTRATOR_USERNAME=admin
JENKINS_ADMINISTRATOR_PASSWORD=admin123
LDAP_SERVICE_USERNAME=
LDAP_SERVICE_PASSWORD=changeit
```

#### Authorization Strategy

Earlier, we had used `loggedInUsersCanDoAnything` authorization strategy.

Now, we can use `globalMatrix` strategy to define different authorization levels for the users/groups configured in LDAP.

```yaml
jenkins:
  #authorizationStrategy: "loggedInUsersCanDoAnything"
  authorizationStrategy: 
    globalMatrix:
      grantedPermissions:
        - "Job/Build:authenticated"
        - "Job/Cancel:authenticated"
        - "Job/Read:authenticated"
        - "Overall/Administer:Acme Superusers"
        - "Overall/Read:authenticated"
        - "View/Read:authenticated"
```

Here, we have defined that only `Acme Superusers` can create new jobs and manage jenkins configurations. 

Other authenticated users can view, build and cancel jobs.

### Login

You can now login into Jenkins using any of the users/password configured previously in LDIF files.

e.g.

```text
username: superuser
password: changeit
```

<figure>
    <a href="{{ site.url }}/assets/img/2020/10/jenkins-login.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2020/10/jenkins-login.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2020/10/jenkins-login.png">
            <img src="{{ site.url }}/assets/img/2020/10/jenkins-login.png" alt="">
        </picture>
    </a>
</figure>

{% include donate.html %}
{% include advertisement.html %}

## References

<https://github.com/jenkinsci/configuration-as-code-plugin>

<https://github.com/jenkinsci/docker#preinstalling-plugins>

<https://www.jenkins.io/doc/book/system-administration/security/>

<https://github.com/jenkinsci/configuration-as-code-plugin/blob/master/docs/features/secrets.adoc>
