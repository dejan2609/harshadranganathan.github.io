---
layout: post
title: "Load Balancing in EKS"
date: 2022-01-27
excerpt: "Steps to expose services through a load balancer in EKS"
tag:
- aws
- eks
- aws load balancer controller example
- aws load balancer controller ingress example
- eksaws load balancer controller helm chart
- aws load balancer ingress controller
- eks internal load balancer
- eks load balancer annotations
- kubernetes aws load balancer annotations
- eks ingress
- aws load balancer controller
- network load balancing on amazon eks
- application load balancing on amazon eks
- provide external access to kubernetes services
comments: true
---

## Introduction

AWS Load Balancer Controller is a controller to help manage Elastic Load Balancers for a Kubernetes cluster.

- It satisfies Kubernetes Ingress resources by provisioning Application Load Balancers.

- It satisfies Kubernetes Service resources by provisioning Network Load Balancers.

## Installation

You can install aws load balancer controller by following the instructions in below repo:

Pre-requisites -

- AWS LoadBalancer Controller >= v2.2.0
- Kubernetes >= v1.20 or EKS >= 1.16 or the following patch releases for Service type LoadBalancer 1.18.18+ for 1.18 or 1.19.10+ for 1.19

- Pods have native AWS VPC networking configured

{% include repo-card.html repo="helm-aws-load-balancer-controller" %}

## Network Load Balancer

<figure>
    <a href="{{ site.url }}/assets/img/2022/01/eks-nlb-flow.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2022/01/eks-nlb-flow.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2022/01/eks-nlb-flow.png">
            <img src="{{ site.url }}/assets/img/2022/01/eks-nlb-flow.png" alt="">
        </picture>
    </a>
</figure>

{% include donate.html %}
{% include advertisement.html %}

### How To Provision

To provision a Network Load Balancer, you need to create a service of type `LoadBalancer`.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: web-app
  namespace: platform
  labels:
    app: web-app
spec:
  ports:
    - name: https
      protocol: TCP
      port: 443
      targetPort: 443
  selector:
    app: web-app
type: LoadBalancer
```

Following actions are performed by the AWS Load balancer controller, when it sees a service object of type `LoadBalancer`:

1. NLB is created in AWS for the service. Depending on the annotations it's either internal or external.

2. Target groups are created in either instance or ip mode depending on the annotations.

3. Listeners are created for each port detailed in the service definition.

4. Health checks are configured.

### Subnet Discovery

AWS Load Balancer Controller auto discovers network subnets by default.

To be able to successfully do that you need to tag your subnets as follows:

|Tag Key |Tag Value |Purpose|
|--|--|--|
|kubernetes.io/role/elb |1 |Indicates that the subnet is public. Will be used if NLB is internet-facing |
|kubernetes.io/role/internal-elb |1 |Indicates that the subnet is private. Will be used if NLB is internal |
{:.table-striped}

{% include donate.html %}
{% include advertisement.html %}

### Annotations

Let's look at some of the annotations that you can configure and their behaviors.

|Annotation Example |Purpose |
|--|--|
|service.beta.kubernetes.io/aws-load-balancer-type: "external" |Indicate to use the external AWS Load balancer controller instead of the in-tree controller available in kubernetes |
|service.beta.kubernetes.io/aws-load-balancer-nlb-target-type: "instance" |Provision NLB in Instance mode |
|service.beta.kubernetes.io/aws-load-balancer-nlb-target-type: "ip" |Provision NLB in IP mode |
|service.beta.kubernetes.io/aws-load-balancer-scheme: "internal" |Provision internal NLB|
|service.beta.kubernetes.io/aws-load-balancer-scheme: "internet-facing" |Provision internet-facing NLB |
|service.beta.kubernetes.io/aws-load-balancer-access-log-enabled: 'true' |Enable access logs |
|service.beta.kubernetes.io/aws-load-balancer-access-log-s3-bucket-name: 'prod-bucket' |Name of the Amazon S3 bucket where load balancer access logs are stored |
|service.beta.kubernetes.io/aws-load-balancer-access-log-s3-bucket-prefix: 'loadbalancing/web-app' |specifies the logical hierarchy you created for your Amazon S3 bucket |
|service.beta.kubernetes.io/aws-load-balancer-additional-resource-tags: 'Stage=prod,App=web-app' |comma-separated list of key-value pairs which will be recorded as additional tags in the ELB |
|service.beta.kubernetes.io/aws-load-balancer-cross-zone-load-balancing-enabled: 'true' |Specifies whether cross-zone load balancing is enabled for the load balancer |
{:.table-striped}

{% include donate.html %}
{% include advertisement.html %}

Complete service file with the annotations will look as follows:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: web-app
  namespace: platform
  labels:
    app: web-app
  annotations:
    service.beta.kubernetes.io/aws-load-balancer-type: "external"
    service.beta.kubernetes.io/aws-load-balancer-nlb-target-type: "instance"
    service.beta.kubernetes.io/aws-load-balancer-scheme: "internet-facing"
    service.beta.kubernetes.io/aws-load-balancer-access-log-enabled: 'true'
    service.beta.kubernetes.io/aws-load-balancer-access-log-s3-bucket-name: 'prod-bucket'
    service.beta.kubernetes.io/aws-load-balancer-access-log-s3-bucket-prefix: 'loadbalancing/web-app'
    service.beta.kubernetes.io/aws-load-balancer-additional-resource-tags: 'Stage=prod,App=web-app'
    service.beta.kubernetes.io/aws-load-balancer-cross-zone-load-balancing-enabled: 'true'
spec:
  ports:
    - name: https
      protocol: TCP
      port: 443
      targetPort: 443
  selector:
    app: web-app
  type: LoadBalancer
  loadBalancerSourceRanges:
    - 10.1.0.0/16
```


{% include donate.html %}
{% include advertisement.html %}
