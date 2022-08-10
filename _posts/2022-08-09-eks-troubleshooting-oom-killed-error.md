---
layout: post
title: "EKS Troubleshooting - OOMKilled Error"
date: 2022-08-09
excerpt: "Troubleshoot OOMKilled error in your EKS cluster"
tag:
- aws
- eks
- OOMKilled Kubernetes error (exit code 137)
- troubleshoot kubernetes OOM error
- memory limits
- kubernetes oom killing pod
- OOM Killer
- kubernetes pod killed reason
- oomkilled kubernetes meaning
- debug oomkilled kubernetes
- kubernetes oomkilled 137
- kubernetes oomkilled
- oomkilled exit code 137
- pod terminated
- pod restarts
comments: true
---

## OOMKilled - Container Memory Limit Reached

A Container is not allowed to use more than its memory limit.

If a Container allocates more memory than its limit, the Container becomes a candidate for termination. 

If the Container continues to consume memory beyond its limit, the Container is terminated.

<figure>
    <a href="{{ site.url }}/assets/img/2022/08/kubernetes-oom-killed-memory-limit.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2022/08/kubernetes-oom-killed-memory-limit.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2022/08/kubernetes-oom-killed-memory-limit.png">
            <img src="{{ site.url }}/assets/img/2022/08/kubernetes-oom-killed-memory-limit.png" alt="">
        </picture>
    </a>
</figure>

Consider this scenario, where a container has configured it's memory limits to 512 MiB.

```yaml
apiVersion: apps/v1
kind: Deployment
spec:
  replicas: 1
  template:
    spec:
      containers:
      - image: localhost:5000/apps/spring-boot-example
        name: k8s-spring-boot-example
        resources:
          limits:
            cpu: 500m
            memory: 512Mi
          requests:
            cpu: 125m
            memory: 512Mi
```

If the container tries to consume more memory than it's configured limit of 512 MiB, it results in below error:

```bash
Last Status
terminated
Reason: OOMKilled - exit code: 137
```

If you are using the default `restartPolicy` which is set to `Always`, then your pod will get restarted automatically on OOM failure.