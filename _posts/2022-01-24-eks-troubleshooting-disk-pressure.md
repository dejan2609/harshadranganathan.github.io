---
layout: post
title: "EKS Troubleshooting - Disk Pressure"
date: 2022-01-24
excerpt: "Troubleshoot node disk pressure error in your EKS cluster"
tag:
- aws
- eks
- kubernetes node disk pressure
- kubernetes disk pressure evicted
- k8s node disk pressure
- kubelet disk pressure threshold
- kubernetes disk pressure 85
- kubelet has disk pressure
- how to resolve disk pressure
- pods evicted
- pod eviction
comments: true
---

## Introduction

Are you noticing any of the below things:

[1] Node has `DiskPressure` label

[2] Node has `disk-pressure=undefined:NoSchedule` taint

[3] Node is crashing and a new node has spun up

[4] Pods have `Evicted` state

[5] Cluster has events like

  `The node had condition: [DiskPressure]`

  `The node was low on resource: ephemeral-storage. Container was using xxxKi, which exceeds its request of xx`

  `failed to garbage collect required amount of images. Wanted to free xx bytes, but freed 0 bytes`

Then you have come to the right place.

We will look at the steps to troubleshoot this issue and how to recover from it.

## Storage Layout

EKS uses `overlay2` as the Docker storage driver and you can find below layout in `/var/lib/docker` directory.

<figure>
    <a href="{{ site.url }}/assets/img/2022/01/eks-disk-storage-layout.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2022/01/eks-disk-storage-layout.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2022/01/eks-disk-storage-layout.png">
            <img src="{{ site.url }}/assets/img/2022/01/eks-disk-storage-layout.png" alt="">
        </picture>
    </a>
</figure>

So, basically all your container's log output from STDOUT goes to the `containers` directory.

All image layers content goes to `overlay2` directory i.e. let's say you have built your app with JDK image, all the jdk libs, custom files you add in your Dockerfile etc. you can find it here.

{% include donate.html %}
{% include advertisement.html %}

## Finding Container ID

You can easily find out the container ID of a pod using below command:

```bash
kubectl get pods <pod-name> -o jsonpath="{..containerID}"
```

which will return something like `docker://fe5a5f6c294`

You can use the container ID to find out the logs/container contents in the various sub-directories.

## Find TopStorage Layers

To find out the layers in `overlay2` occupying most storage, you can run below command:

```bash
TOP_STORAGE=$(du -hs /var/lib/docker/overlay2/* | grep -Ee '^[0-9]{3}[M]+|[0-9]G' | sort -h |tail -n 10 |tee -a /dev/stderr |awk '{print $2}'|xargs|sed 's/ /|/g')

636M    /var/lib/docker/overlay2/dd170e9606b38b
659M    /var/lib/docker/overlay2/d7d87a0fa163ef
660M    /var/lib/docker/overlay2/1e5a623895093d
680M    /var/lib/docker/overlay2/a80c426824258d
```

You can see that we have many layers occupying 600Mb+ of storage.

Let's see what containers they belong to:

```bash
docker inspect $(docker ps -q) | jq '.[]|.Config.Hostname,.Config.Labels."io.kubernetes.pod.name",.GraphDriver.Data.MergedDir,.hovno' | egrep -B2 "$TOP_STORAGE"

"web-app4tllp"
"/var/lib/docker/overlay2/1e5a623895093d/merged"
--
"web-app4tllp"
"/var/lib/docker/overlay2/b6ede2479b7569/merged"
--
```

Above command returned the pod name and corresponding overlay2 merged view location.

You can now explore the directories to find out what is occupying the storage.

For example, we go inside one of the overlay2 directories and run below disk usage command:

```bash
du -h --max-depth=1 . |sort -n

3.9M    ./sbin
3.9M    ./tmp
5.4M    ./bin
8.9M    ./var
9.4M    ./lib
12K     ./root
32K     ./resources
97M     ./app
497M    ./usr
626M    .
952K    ./etc
```

You can see that `usr` directory is occupying 497Mb and this is could be from your base image e.g. JDK libs etc.

{% include donate.html %}
{% include advertisement.html %}