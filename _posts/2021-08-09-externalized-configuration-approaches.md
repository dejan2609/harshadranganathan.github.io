---
layout: post
title: "Externalized Configuration Approaches"
date: 2021-08-09
excerpt: "Compare different approaches for externalizing app config"
tag:
- spring boot external properties file
- spring cloud config server
- kubernetes configmaps
- aws app config
- external configuration files
- externalize configuration
- twelve factor
- kubernetes configmap watcher
- configmaps
- aws app config
comments: true
---

We compare three approaches to externalize application configuration.

[1] Spring Cloud Config Server - provides server-side and client-side support for externalized configuration in a distributed system

[2] Kubernetes ConfigMaps - API object that lets you store configuration for other objects to use

[3] AWS App Config - supports controlled deployments to applications of any size and includes built-in validation checks and monitoring


| |Spring Cloud Config Server |Kubernetes ConfigMaps |AWS App Config|
|---|---|---|---|
|Config Format |	Plain text, yml, properties, json |	Configuration files, property keys |* YAML, JSON, or text documents in the AWS AppConfig hosted configuration store<br/><br/>* Objects in an Amazon Simple Storage Service (Amazon S3) bucket<br/><br/>* Documents in the Systems Manager document store<br/><br/>* Parameters in Parameter Store |
|Config Size Limit | NA| 1MB| * 4 to 8KB - Parameter Store<br/><br/>* 64KB - Document/AppConfig store<br/><br/>* 1MB - S3|
|Config Source| Git, Local, S3, JDBC database, Redis, Vault with Proxy Support| Cluster ConfigMaps| AppConfig Store, SSM Document Store, Parameter Store, S3|
|Immutable Config|For spring apps, using immutable configuration properties would prevent bean recreation |* v1.19 beta support<br/><br/>* ConfigMap and Pods need to be re-created |For spring apps, using immutable configuration properties would prevent bean recreation|
| Config Refresh|* Push/Poll Model<br/><br/>* Push Model - Github Webhooks, Spring Cloud Bus| * Approach 1: Use events api to watch for changes and reload beans/context (supported by spring-cloud-kubernetes) <br/><br/>* Approach 2: Restart the pods as part of deployment on config changes (Helm using sha256 checksum)<br/><br/>* Approach 3: Mounted ConfigMaps are automatically refreshed by Kubernetes. So, we need reload capability in our app upon change.| Poll model|
| Deployment Strategy|NA | * Possible to use rolling update strategy of deployments e.g. https://github.com/fabric8io/configmapcontroller<br/><br/>* Also, we can achieve config deployment rollout using Helm by checking for sha256 checksum| Linear, Exponential, AllAtOnce, Linear50PercentEvery30Seconds, Canary10Percent20Minutes|
| Sharing Config Across Apps| | | |
| Encryption & Decryption for Passwords||Need to use Secrets/Vault(supported by spring-cloud-kubernetes) |Secrets need to be stored in parameter store. No encryption/decryption feature available as part of config files |
| High Availability| * Multiple load balanced cloud config servers<br/><br/>* (Optional) Discovery Client - e.g. Eureka| EKS resiliency - Three etcd nodes that run across three Availability Zones within a Region| AWS managed|
|Advantages | REST API can be used by non-Spring apps| * Kubernetes native solution<br/><br/>* For Spring apps, spring-cloud-kubernetes helps to run spring apps in Kubernetes using native services| Validation checks, deployment strategy and rollbacks|
|Disadvantages |* Single point of failure without HA<br/><br/>* Additionally, we might need Discovery Client & Cloud Bus depending on the design | ConfigMaps consumed as environment variables are not updated automatically and require a pod restart| AWS managed service|
{:.table-striped}

{% include donate.html %}
{% include advertisement.html %}

Here we will compare the different configuration stores available with AWS AppConfig.

| |AWS AppConfig hosted configuration store| S3|Parameter Store| Document store| 
|---|---|---|---|---|
|Configuration size limit | 64 KB|* 1 MB<br/><br/>* Enforced by AWS AppConfig, not S3| 4 KB (free tier) / 8 KB (advanced parameters)| 64 KB|
|Resource storage limit | 	1 GB| Unlimited| 10,000 parameters (free tier) / 100,000 parameters (advanced parameters)| 500 documents|
|Server-side encryption | Yes| No| No| No|
|AWS CloudFormation support |Yes |Not for creating or updating data |Yes |No |
|Validate create or update API actions| Not supported| Not supported|Regex supported | JSON Schema required for all put and update API actions|
|Pricing | Free|See Amazon S3 pricing| See AWS Systems Manager pricing|Free|
{:.table-striped}

{% include donate.html %}
{% include advertisement.html %}

