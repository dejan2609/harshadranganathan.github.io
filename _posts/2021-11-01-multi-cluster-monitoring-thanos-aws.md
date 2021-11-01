---
layout: post
title: "Multi Cluster Monitoring With Thanos In AWS"
date: 2021-11-01
excerpt: "Steps involved in Multi Cluster Kubernetes Monitoring with Thanos in AWS"
tag:
- aws
- eks
- thanos
- prometheus
- grafana
- thanos prometheus
- monitoring multiple kubernetes clusters
- monitoring multiple kubernetes clusters using prometheus
- thanos sidecar ingress
- thanos vs prometheus
- thanos monitoring
- grafana thanos datasource
- prometheus thanos setup
- kubernetes multi-cluster monitoring using prometheus and thanos
- prometheus cluster monitoring
- deploy prometheus and grafana on kubernetes
- monitor kubernetes with external prometheus
- prometheus federation example
- thanos kubernetes
- kubernetes multi cluster dashboard
- kubernetes cluster monitoring
comments: true
---

## Introduction

Thanos is an open source, highly available Prometheus setup with long term storage and querying capabilities.

Let's look at how we can set it up for multi-cluster monitoring in AWS.

## Architecture

Consider we have multiple kubernetes clusters (e.g. Cluster A, Cluster B etc.) that we would like to monitor (node, pod metrics etc.) from a central Observer cluster.

Below is a reference architecture in AWS showcasing how we could achieve it with Thanos: 

<figure>
    <a href="{{ site.url }}/assets/img/2021/11/multi-cluster-monitoring-thanos-aws.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2021/11/multi-cluster-monitoring-thanos-aws.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2021/11/multi-cluster-monitoring-thanos-aws.png">
            <img src="{{ site.url }}/assets/img/2021/11/multi-cluster-monitoring-thanos-aws.png" alt="">
        </picture>
    </a>
</figure>

{% include donate.html %}
{% include advertisement.html %}

## Repositories

{% include repo-card.html repo="helm-aws-prometheus-stack" %}

{% include repo-card.html repo="helm-thanos" %}

## Kube Prometheus Stack

[Kube Prometheus](https://github.com/prometheus-operator/kube-prometheus) is an open source project that provides easy to operate end-to-end Kubernetes cluster monitoring with Prometheus using the Prometheus Operator.

It packages below components:

- Prometheus Operator
- Highly available Prometheus
- Prometheus Node Exporter
- Kube State Metrics

as well other components such as grafana, alert manager etc.

For our setup, we will install Kube Prometheus Stack in each our clusters that we would like to monitor.

Since we are planning for monitoring from a central observer cluster, we do not want to install some tools e.g. grafana in each of the clusters.

We make use of the helm chart repo [https://github.com/prometheus-operator/kube-prometheus] and override the values for easy installation.

Let's see what's involved in setting up below components in a single cluster:

<figure>
    <a href="{{ site.url }}/assets/img/2021/11/multi-cluster-monitoring-thanos-aws-single-cluster-setup.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2021/11/multi-cluster-monitoring-thanos-aws-single-cluster-setup.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2021/11/multi-cluster-monitoring-thanos-aws-single-cluster-setup.png">
            <img src="{{ site.url }}/assets/img/2021/11/multi-cluster-monitoring-thanos-aws-single-cluster-setup.png" alt="">
        </picture>
    </a>
</figure>

Clone the open source repo and create a new `shared-values.yaml`.

[1] We would want to give the stack a shorter name so let's override few helm variables in the chart to achieve that.

`shared-values.yaml`

```yaml
nameOverride: prometheus
fullnameOverride: prometheus
```

[2] Let's disable components that we don't want to be installed in our cluster.

`shared-values.yaml`

```yaml
grafana:
  enabled: false

# disable prometheus service monitors for below components
kubelet:
  enabled: false
kubeControllerManager:
  enabled: false
coreDns:
  enabled: false
kubeApiServer:
  enabled: false
kubeEtcd:
  enabled: false
kubeScheduler:
  enabled: false
kubeProxy:
  enabled: false
```

[3] We need `node exporter` and `kube-state-metrics` to be installed as they provide metrics related to the node, deployment, pods etc.

`shared-values.yaml`

```yaml
kubeStateMetrics:
  enabled: true
nodeExporter:
  enabled: true
```

{% include donate.html %}
{% include advertisement.html %}

### Prometheus Operator

[4] Now it's time to configure the Prometheus Operator.

The Prometheus Operator provides Kubernetes native deployment and management of Prometheus and related monitoring components.

`shared-values.yaml`

```yaml
prometheusOperator:
  kubeletService:
    enabled: false
  resources:
    requests:
      cpu: 500m
      memory: 100Mi
    limits:
      cpu: 700m
      memory: 200Mi
```

Here, we define the resource limits for the prometheus operator instance.

### Prometheus

[5] Continuing further, we define the prometheus settings.

`shared-values.yaml`

```yaml
prometheus:
  serviceAccount:
    create: false
    name: prometheus
  prometheusSpec:
    scrapeInterval: "1m"
    scrapeTimeout: "60s"
    evaluationInterval: "1m"
    retention: 7d
    resources:
      requests:
        cpu: 200m
        memory: 1000Mi
      limits:
        cpu: 2500m
        memory: 20000Mi
    storageSpec:
      volumeClaimTemplate:
        metadata:
          name: prometheus
        spec:
          storageClassName: gp2
          accessModes: ["ReadWriteOnce"]
          resources:
            requests:
              storage: 30Gi
```

Here, we had defined couple of things. Let's go one-by-one.

First, we instruct the prometheus instance to use a service account named `prometheus`. This service account will be linked to an IAM role which has permissions to write the metric data to S3.

Secondly, we define the scrape settings and retention period. Define these based on your needs (avoid setting these to low values unless needed).

```
    scrapeInterval: "1m"
    scrapeTimeout: "60s"
    evaluationInterval: "1m"
    retention: 7d
```

Next, we define the resource requests. Prometheus instance consumes lot of CPU and memory depending on how much metric it scrapes. 

So, make sure to fine tune these based on usage.

```
    resources:
      requests:
        cpu: 200m
        memory: 1000Mi
      limits:
        cpu: 2500m
        memory: 20000Mi
```

Finally, we define a Persistent Volume which in AWS is backed by EBS to store the metrics data. 

Prometheus instance will scrape metrics from the sources defined such as pods, node exporter etc and will store them in EBS for the retention period defined. So, make sure to give adequate storage for it.

```
    storageSpec:
      volumeClaimTemplate:
        metadata:
          name: prometheus
        spec:
          storageClassName: gp2
          accessModes: ["ReadWriteOnce"]
          resources:
            requests:
              storage: 30Gi
```

Here, we request for `30 Gb` storage from our persistent volume.

{% include donate.html %}
{% include advertisement.html %}

### Thanos Sidecar

Thanos Sidecar is a component which performs following actions:

- Serves as a sidecar container alongside Prometheus
- Uploads Prometheus chunks to an object storage
- Serves as an entry point for PromQL queries


Let's configure the thanos sidecar.

`shared-values.yaml`

```yaml
    thanos:
      baseImage: quay.io/thanos/thanos
      version: v0.18.0
      objectStorageConfig:
        name: thanos-objstore-config
        key: thanos.yaml
```

Here, we define the baseImage and version of thanos that we would like to use.

Also, we specify to use a secret named `thanos-objstore-config` with key as `thanos.yml` which will contain the object store configuration details.

Let's create a new file named `thanos-config.yaml` which will contain our object store configuration details.

`thanos-config.yaml`

```yaml
type: s3
config:
  bucket: prod-metrics-storage
  endpoint: s3.us-east-1.amazonaws.com
  sse_config:
    type: "SSE-S3"
```

Here, we have defined that our object store is `S3`, the bucket to be used is named `prod-metrics-storage` and that it uses `SSE-S3` encryption.

You then create the secret so that when you install the kube-prometheus-chart the thanos sidecar will get the object configuration details from this secret.

```bash
kubectl -n platform create secret generic thanos-objstore-config --from-file=thanos.yaml=thanos-config.yaml
```

{% include donate.html %}
{% include advertisement.html %}

### Ingress

Finally, it's time to expose our thanos sidecar so that it can be accessed from the observer cluster for running queries.

For this purpose, we make use of an ALB with gRPC support since thanos communicates using gRPC protocol.

To have this set up running, you need to have an ALB controller and External DNS in your kubernetes cluster. Steps to configure them is beyond the scope of this article.

Once you have the dependent software components in your cluster you can add some annotations which will be used to configure the ALB and Route53 records so that the observer cluster can communicate with the thanos sidecar in a different cluster which is the basis for multi-cluster monitoring.

<figure>
    <a href="{{ site.url }}/assets/img/2021/11/multi-cluster-monitoring-thanos-aws-single-cluster-setup.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2021/11/multi-cluster-monitoring-thanos-aws-single-cluster-setup.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2021/11/multi-cluster-monitoring-thanos-aws-single-cluster-setup.png">
            <img src="{{ site.url }}/assets/img/2021/11/multi-cluster-monitoring-thanos-aws-single-cluster-setup.png" alt="">
        </picture>
    </a>
</figure>

To configure an ALB ingress with DNS, add below in your `shared-values.yaml` since they won't change for each cluster:

```yaml
  service:
    type: NodePort
  thanosIngress:
    enabled: true
    paths:
    - /*
    annotations:
      external-dns/zone: private
      kubernetes.io/ingress.class: alb
      alb.ingress.kubernetes.io/scheme: internal
      alb.ingress.kubernetes.io/backend-protocol-version: GRPC
      alb.ingress.kubernetes.io/listen-ports: '[{"HTTPS":443}]'
      alb.ingress.kubernetes.io/ssl-policy: ELBSecurityPolicy-TLS-1-2-Ext-2018-06
```

Let's see what we have defined here.

We instruct kubernetes that the service is of type `NodePort`.

We then define the ingress to allow all traffic matching path `/` (Note: ALB needs the path to be suffixed with wildcard `/*`) to be routed to the service.

Since, we need the DNS to be resolvable only within AWS, we define the `external-dns/zone` as `private`.

To provision a gRPC based ALB, you define these annotations:

```
      kubernetes.io/ingress.class: alb
      alb.ingress.kubernetes.io/scheme: internal
      alb.ingress.kubernetes.io/backend-protocol-version: GRPC
      alb.ingress.kubernetes.io/listen-ports: '[{"HTTPS":443}]'
      alb.ingress.kubernetes.io/ssl-policy: ELBSecurityPolicy-TLS-1-2-Ext-2018-06 
```

which specifies the below:

- ALB ingress class to be used
- Internal load balancer to be provisioned
- ALB protocol is gRPC
- Listening port is HTTPS
- SSL policy version to be used


For each cluster environment, your dns name and HTTPS certificate is going to vary.

For that purpose, create an env/cluster specific file e.g. `cluster-a-prod-values.yaml` to provide cluster/env specific values.

```yaml
prometheus:
  thanosIngress:
    hosts:
    - clusterA.prometheus.example.net
    annotations:
      external-dns.alpha.kubernetes.io/hostname: clusterA.prometheus.example.net
      alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:us-east-1::certificate/<arn>
      alb.ingress.kubernetes.io/load-balancer-attributes: access_logs.s3.enabled=true,access_logs.s3.bucket=,access_logs.s3.prefix=awselasticloadbalancing/clusterA
```

Here, you define the hostname for your ALB using annotation `external-dns.alpha.kubernetes.io/hostname` which your External DNS will configure in private hosted zone of Route53.

Your ALB ACM certificate ARN and access log locations using respective annotations.

Also, you restrict your Ingress to accept traffic only from the specified hostname.

{% include donate.html %}
{% include advertisement.html %}

### External Labels

Now we have prometheus, thanos, ALB configured, how do we distinguish that our metrics are coming from clusterA?

For this purpose, prometheus provides External labels which can used to define labels that you want to be exported as part of each metric.

Without external labels, your cluster metric could be like this:

```
node_cpu_seconds{container="node-exporter",cpu="0",endpoint="metrics"
,job="node-exporter",namespace="platform",pod="prometheus-prometheus-node-exporter-z6ncr,
prometheus_replica="prometheus-prometheus-prometheus-0",service="prometheus-prometheus-node-exporter"}
```

Within the cluster this makes sense, but when you want to view it from a centralized place e.g. grafana you would want to know which cluster this is part of and your dashboards to show metrics only from a specific cluster instead of metrics from all clusters.

Let's define some labels that will help us in filtering the metrics later.

`cluster-a-prod-values.yaml`

```yaml
  prometheusSpec:
    externalLabels:
      cluster: clusterA
      stage: prod
      region: us-east-1
```

Here, we define labels such as cluster name, environment it's part of and the AWS region.

Once configured, the metrics exported should have these labels:


```
node_cpu_seconds{container="node-exporter",cpu="0",endpoint="metrics",
job="node-exporter",namespace="platform",pod="prometheus-prometheus-node-exporter-z6ncr,
prometheus_replica="prometheus-prometheus-prometheus-0",service="prometheus-prometheus-node-exporter",
cluster="clusterA",region="us-east-1",stage="prod"}
```

{% include donate.html %}
{% include advertisement.html %}

### Installation

Now it's time to install our chart.

```
helm upgrade -i prometheus . -n platform --values=shared-values.yaml --values=cluster-a-prod-values.yaml
```

This will install the helm chart in the cluster which performs the following actions:

[1] Install the prometheus operator

[2] Configure the prometheus and thanos configuration details in configmap/secrets

[3] Prometheus operator will start up a new prometheus instance with thanos sidecar along with node exporter and kube state metrics

[4] Configure service and Ingress objects

[5] ALB controller will spin up a new gRPC based ALB

[6] External DNS will configure the Route53 record in private hosted zone for DNS resolution

Post which prometheus will start scraping the metrics from all pods, objects for which service monitors are configured for scrapping e.g. node exporter.

Storage:

[1] Prometheus will store the metrics in the EBS backed volume

[2] Thanos sidecar will export the metrics to S3 bucket for every 2 hours

[3] Metrics in EBS will remain until the configured retention period

Query:

[1] You can now send queries to the cluster via the ALB to the Thanos sidecar which will respond with the metrics available in the local node realtime.

{% include donate.html %}
{% include advertisement.html %}