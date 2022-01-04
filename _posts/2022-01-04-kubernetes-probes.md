---
layout: post
title: "Kubernetes Probes - Liveness, Readiness and Startup Probes"
date: 2022-01-04
excerpt: "How to configure/Best Practices on using Liveness, Readiness and Startup Probes"
tag:
- kubernetes
- liveness probe
- readiness probe
- startup probe
- kubernetes probes
- startup probe kubernetes
- kubernetes probes best practices
- kubernetes liveness probe
- kubernetes readiness probe
- kubernetes readiness probe example
- kubernetes liveness vs readiness
comments: true
---

## Startup Probe

The kubelet uses startup probes to know when a container application has started. 

If such a probe is configured, it disables liveness and readiness checks until it succeeds, making sure those probes don't interfere with the application startup. 

This can be used to adopt liveness checks on slow starting containers, avoiding them getting killed by the kubelet before they are up and running.

```yaml
spec:
  template:
    spec:
      containers:
        - name: {{ .Chart.Name }}
          startupProbe:
            httpGet:
              path: /health
              port: http
              scheme: HTTP
            timeoutSeconds: 10    # number of seconds before marking the probe as timing out (failing the health check)
            periodSeconds: 10     # how often to check the probe
            successThreshold: 1   # minimum number of consecutive successful checks
            failureThreshold: 30  # number of retries before marking the probe as failed
```

In above configuration, the probe checks `/health` endpoint every `10 seconds` until `5 mins (periodSeconds * failureThreshold = 300s)`.

Within that period if the health check endpoint returns success, then it would turn on liveness and readiness probes. Otherwise, it would fail.

### Things To Note

- If the startup probe never succeeds, the container is killed after 300s and subject to the pod's restartPolicy.

- Set up startup probe with a `failureThreshold * periodSeconds` long enough to cover the worse case startup time

{% include donate.html %}
{% include advertisement.html %}

## Readiness Probe

Readiness probes are designed to let Kubernetes know when your app is ready to serve traffic.

For example, an application might need to load large data or configuration files during startup, or depend on external services after startup. 

In such cases, you don't want to kill the application, but you don't want to send it requests either. 

Kubernetes provides readiness probes to detect and mitigate these situations.

```yaml
spec:
  template:
    spec:
      containers:
        - name: {{ .Chart.Name }}
          readinessProbe:
            httpGet:
              path: /health
              port: http
              scheme: HTTP
            timeoutSeconds: 10
            periodSeconds: 10
            successThreshold: 1
            failureThreshold: 3
```

### Things To Note

- Kubernetes makes sure the readiness probe passes before allowing a service to send traffic to the pod. 

- If a readiness probe starts to fail, Kubernetes stops sending traffic to the pod until it passes.

- Readiness probe is useful if your application is serving traffic e.g. API

{% include donate.html %}
{% include advertisement.html %}

## Liveness Probe

Many applications running for long periods of time eventually transition to broken states, and cannot recover except by being restarted. Kubernetes provides liveness probes to detect and remedy such situations.

```yaml
spec:
  template:
    spec:
      containers:
        - name: {{ .Chart.Name }}
          livenessProbe:
            httpGet:
              path: /health
              port: http
              scheme: HTTP
            timeoutSeconds: 10
            periodSeconds: 10
            successThreshold: 1
            failureThreshold: 3
```

In above configuration, the probe checks `/health` endpoint every 10 seconds.

If the handler for the server's `/health` path returns a success code, the kubelet considers the container to be alive and healthy. If the handler returns a failure code on 3 consecutive retries, the kubelet kills the container and restarts it.

Any code greater than or equal to 200 and less than 400 indicates success. Any other code indicates failure.

### Things To Note

- It is recommend to you use a startupProbe along with a liveness probe.

- If your liveness probe fails, it will restart your container.

- Incorrect configuration (e.g. App takes more time to startup than the configured delays) will result in a constant restart loop.

{% include donate.html %}
{% include advertisement.html %}

## References

<https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/>