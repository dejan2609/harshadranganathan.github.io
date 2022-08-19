---
layout: post
title: "Load Balancing in EKS"
date: 2022-08-19
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

- AWS LoadBalancer Controller >= v2.3.0
- Kubernetes >= v1.20 or EKS >= 1.16 or the following patch releases for Service type LoadBalancer 1.18.18+ for 1.18 or 1.19.10+ for 1.19

- Pods have native AWS VPC networking configured

{% include repo-card.html repo="helm-aws-load-balancer-controller" %}

## Network Load Balancer

<figure>
    <a href="{{ site.url }}/assets/img/2022/01/eks-nlb-flow-instance-mode.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2022/01/eks-nlb-flow-instance-mode.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2022/01/eks-nlb-flow-instance-mode.png">
            <img src="{{ site.url }}/assets/img/2022/01/eks-nlb-flow-instance-mode.png" alt="">
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

### Instance Mode

Instance target mode supports pods running on AWS EC2 instances. In this mode, AWS NLB sends traffic to the instances and the kube-proxy on the individual worker nodes forward it to the pods through one or more worker nodes in the Kubernetes cluster.

### IP Mode

IP target mode supports pods running on AWS EC2 instances and AWS Fargate. In this mode, the AWS NLB targets traffic directly to the Kubernetes pods behind the service, eliminating the need for an extra network hop through the worker nodes in the Kubernetes cluster.

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
|service.beta.kubernetes.io/aws-load-balancer-additional-resource-tags: 'Stage=prod,App=web-app' |comma-separated list of key-value pairs which will be recorded as additional tags in the ELB |
|service.beta.kubernetes.io/aws-load-balancer-attributes: access_logs.s3.enabled=true,access_logs.s3.bucket=prod-bucket,access_logs.s3.prefix=loadbalancing/web-app |Enable access logs<br/><br/>Name of the Amazon S3 bucket where load balancer access logs are stored<br/><br/>Specify the logical hierarchy you created for your Amazon S3 bucket |
|service.beta.kubernetes.io/aws-load-balancer-attributes: load_balancing.cross_zone.enabled=true |Specifies whether cross-zone load balancing is enabled for the load balancer |
{:.table-striped}

### Security Groups

Network Load Balancers do not have associated security groups. 

However, you can add any CIDR rules to the security group of your worker nodes.

This is achieved by making use of `spec.loadBalancerSourceRanges` property.

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
  loadBalancerSourceRanges:
    - 10.1.0.0/16
```

Here, CIDR `10.1.0.0/16` is added to the worker nodes security group.

It's critical to understand the importance of `loadBalancerSourceRanges`.

|NLB Type |Worker Node|loadBalancerSourceRanges|Behavior|
|--|--|--|--|
|Internal |Private |Not set |If you didn't set the value for loadBalancerSourceRanges, the default is 0.0.0.0/0<br/>Since the worker node and NLB is private, 0.0.0.0/0 wouldn't cause impact since it won't be reachable directly from public internet |
|Internal |Private |VPC CIDR e.g. 10.0.0.0/16 (or) ENI private IP |You can either grant access to the entire VPC CIDR or the private IP of the load balancer's network interface to allow traffic from NLB |
|Internet-facing |Private |Not set |If you didn't set the value for loadBalancerSourceRanges, the default is 0.0.0.0/0<br/>This will open traffic for the entire internet |
|Internet-facing |Private |Client CIDR |This will allow traffic only from the Client CIDR ranges since NLB by default has client IP preservation enabled |
{:.table-striped}

#### Gotchas

When you create a NLB for an application it adds below rules to the security group of the worker nodes:

|Purpose |Rule |Number of Rules|
|--|--|--|
|Health Check |TCP;Node Port;Source - Subnet Range CIDR;Description - kubernetes.io/rule/nlb/health= |One per subnet CIDR|
|Client |TCP;Node Port;Source - Source Range CIDR;Description - kubernetes.io/rule/nlb/client= |One per CIDR Range|
{:.table-striped}

Consider this setup - EKS having worker nodes across 3 AZ's and you add one loadBalancerSourceRange.

This will result in 4 rules added to the worker node security group - 3 health check rules (1 per subnet) and 1 loadBalancerSourceRange rule.

So, for one NLB you end up with 4 rules.

Security groups have a default limit of 60 rules that can be added.

As you create many NLB's/add more source ranges for your apps running in the same cluster, you will soon hit this limit and you can't create any more NLB's.

You can increase the quota but that multiplied by the quota for security groups per network interface cannot exceed 1,000.


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
    service.beta.kubernetes.io/aws-load-balancer-scheme: "internal"
    service.beta.kubernetes.io/aws-load-balancer-additional-resource-tags: 'Stage=prod,App=web-app'
    service.beta.kubernetes.io/aws-load-balancer-attributes: access_logs.s3.enabled=true,access_logs.s3.bucket=prod-bucket,access_logs.s3.prefix=loadbalancing/web-app,load_balancing.cross_zone.enabled=true
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

Above file results in below configuration:

1. Uses AWS Load Balancer Controller instead of the in-tree kubernetes controller

2. Provisions an internal NLB with instance mode

3. Sets the tags provided

4. Enables access logs to the provided S3 path

5. Enables Cross Zone load balancing

{% include donate.html %}
{% include advertisement.html %}

### Traffic Flow

#### Instance Mode

<figure>
    <a href="{{ site.url }}/assets/img/2022/01/eks-nlb-flow-instance-mode.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2022/01/eks-nlb-flow-instance-mode.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2022/01/eks-nlb-flow-instance-mode.png">
            <img src="{{ site.url }}/assets/img/2022/01/eks-nlb-flow-instance-mode-instance-mode.png" alt="">
        </picture>
    </a>
</figure>

When a request is sent, it reaches the NLB which will load balance the traffic to the target backends (worker nodes).

In instance mode, the traffic gets sent to the NodePort of the instance resulting in an additional hop.

After which the kube-proxy running in the node, sends the request to the desired pod.

EKS by default runs in `iptables proxy` mode, which means that the kube-proxy will make use of iptables to route traffic to the pods. iptables mode chooses a backend at random.

Another factor is `externalTrafficPolicy` which is by default set to `Cluster` mode. Here, the traffic may randomly be routed to a pod on another host to ensure equal distribution.


{% include donate.html %}
{% include advertisement.html %}

### Integration Patterns

#### API Gateway

<figure>
    <a href="{{ site.url }}/assets/img/2022/01/eks-api-gateway-private-integration.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2022/01/eks-api-gateway-private-integration.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2022/01/eks-api-gateway-private-integration.png">
            <img src="{{ site.url }}/assets/img/2022/01/eks-api-gateway-private-integration.png" alt="">
        </picture>
    </a>
</figure>

## Classic Load Balancer

<figure>
    <a href="{{ site.url }}/assets/img/2022/08/eks-elb-flow.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2022/08/eks-elb-flow.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2022/08/eks-elb-flow.png">
            <img src="{{ site.url }}/assets/img/2022/08/eks-elb-flow.png" alt="">
        </picture>
    </a>
</figure>

{% include donate.html %}
{% include advertisement.html %}

### How To Provision

To provision a Classic Load Balancer, you need to create a service of type `LoadBalancer`.

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

Following actions are performed by the In-Tree Legacy Cloud Provider in Kubernetes, when it sees a service object of type `LoadBalancer`:

1. ELB is created in AWS for the service. Depending on the annotations it's either internal or external.

2. Listeners are created for each port detailed in the service definition.

3. Health checks are configured.

### Subnet Discovery

In-Tree Legacy Cloud Provider auto discovers network subnets by default.

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
|service.beta.kubernetes.io/aws-load-balancer-internal: 'true' |Indicate that we want an internal ELB. Default: External ELB|
|service.beta.kubernetes.io/aws-load-balancer-access-log-emit-interval: '60' |Specify access log emit interval|
|service.beta.kubernetes.io/aws-load-balancer-access-log-enabled: 'true' |Service to enable or disable access logs |
|service.beta.kubernetes.io/aws-load-balancer-access-log-s3-bucket-name: prod-bucket |Specify access log s3 bucket name |
|service.beta.kubernetes.io/aws-load-balancer-access-log-s3-bucket-prefix: loadbalancing/web-app |Specify access log s3 bucket prefix |
|service.beta.kubernetes.io/aws-load-balancer-cross-zone-load-balancing-enabled: 'true' |Used on the service to enable or disable cross-zone load balancing |
|service.beta.kubernetes.io/aws-load-balancer-additional-resource-tags: Stage=prod,App=web-app  |Additional tags in the ELB |
{:.table-striped}

### Load Balancer Security Group

You can configure the security groups to be attached to an ELB for restricting traffic.

|Annotation Example |Purpose |
|--|--|
|service.beta.kubernetes.io/aws-load-balancer-security-groups: "sg-53fae93f" |A list of existing security groups to be configured on the ELB created.<br/><br/>This replaces all other security groups previously assigned to the ELB and also overrides the creation of a uniquely generated security group for this ELB.<br/><br/>The first security group ID on this list is used as a source to permit incoming traffic to target worker nodes (service traffic and health checks).<br/><br/>If multiple ELBs are configured with the same security group ID, only a single permit line will be added to the worker node security groups, that means if you delete any of those ELBs it will remove the single permit line and block access for all ELBs that shared the same security group ID. This can cause a cross-service outage if not used properly|
|service.beta.kubernetes.io/aws-load-balancer-extra-security-groups: "sg-53fae93f" |A list of additional security groups to be added to the created ELB, this leaves the uniquely generated security group in place, this ensures that every ELB has a unique security group ID and a matching permit line to allow traffic to the target worker nodes (service traffic and health checks). <br/><br/> Security groups defined here can be shared between services.|
|.spec.loadBalancerSourceRanges |Add CIDR to the uniquely generated security group for this ELB (defaults to 0.0.0.0/0) |
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
    service.beta.kubernetes.io/aws-load-balancer-access-log-emit-interval: '60'
    service.beta.kubernetes.io/aws-load-balancer-access-log-enabled: 'true'
    service.beta.kubernetes.io/aws-load-balancer-access-log-s3-bucket-name: prod-bucket
    service.beta.kubernetes.io/aws-load-balancer-access-log-s3-bucket-prefix: loadbalancing/web-app
    service.beta.kubernetes.io/aws-load-balancer-additional-resource-tags: Stage=prod,App=web-app
    service.beta.kubernetes.io/aws-load-balancer-connection-draining-enabled: 'true'
    service.beta.kubernetes.io/aws-load-balancer-connection-draining-timeout: '300'
    service.beta.kubernetes.io/aws-load-balancer-cross-zone-load-balancing-enabled: 'true'
    service.beta.kubernetes.io/aws-load-balancer-extra-security-groups: sg-53fae93f
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

Above file results in below configuration:

1. Provisions an ELB in the desired subnet

2. Sets the tags provided

3. Enables access logs to the provided S3 path

4. Enables Cross Zone load balancing

5. Adds `.spec.loadBalancerSourceRanges` to the uniquely generated security group for this ELB

6. Adds `sg-53fae93f` as an additional security group to the ELB

7. Adds a matching permit line to allow traffic from the ELB to the target worker nodes

{% include donate.html %}
{% include advertisement.html %}

## References

<https://kubernetes.io/docs/concepts/services-networking/service/>

<https://kubernetes-sigs.github.io/aws-load-balancer-controller/>

<https://docs.aws.amazon.com/elasticloadbalancing/latest/network/load-balancer-target-groups.html#client-ip-preservation>

<https://docs.aws.amazon.com/elasticloadbalancing/latest/network/target-group-register-targets.html#target-security-groups>

<https://kubernetes.io/docs/concepts/services-networking/_print/#pg-374e5c954990aec58a0797adc70a5039>

<https://github.com/kubernetes/legacy-cloud-providers/blob/master/aws/aws.go>