---
layout: post
title:  "Setting up Kubernetes on Windows with Minikube"
date:   2020-05-16
excerpt: "Run Kubernetes locally with Minikube on Windows"
tag:
- Kubernetes
- Minikube
- Windows
- install minikube on windows 10
- minikube hyperv
- install kubernetes on windows 10
- minikube tutorial
- minikube vm-driver none
- kubernetes local development
- install kubernetes on hyper-v
- minikube start vm-driver
- minikube windows containers
- install minikube on windows 10 virtualbox
- use hyper-v as a driver
- how to install minikube on windows 10
comments: true
---

## Minikube

[Minikube](https://github.com/kubernetes/minikube) is a tool that makes it easy to run Kubernetes locally. Minikube runs a single-node Kubernetes cluster inside a VM on your laptop for users looking to try out Kubernetes or develop with it day-to-day.

Minikube can be installed in multiple operating systems (Linux, MacOS & Windows) and supports multiple drivers ([VirtualBox](https://www.virtualbox.org/), [Hyper-V](https://docs.microsoft.com/en-us/virtualization/hyper-v-on-windows/about/), [Docker](https://www.docker.com/) in case of Windows).

We are going to look at Windows setup of Minikube using both VirtualBox & Hyper-V drivers.

## Install Chocolatey

[Chocolatey](https://chocolatey.org/) is a package manager for Windows similar to how homebrew is for MacOS. It simplifies our installation process so we will use it here.

Open `PowerShell` as an administrator and run below commands.

{% highlight powershell %}
# Check the execution policy and ensure that it is not restricted
Get-ExecutionPolicy

# If execution policy is restricted then set the policy to All-Signed
Set-ExecutionPolicy AllSigned

# Install chocolatey
iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))
{% endhighlight %}

## Install Minikube

Once chocolately is installed, we run below command to install Minikube

{% highlight powershell %}
choco install minikube -y
{% endhighlight %}

You can specify to install a particular version using **--version** flag.

{% highlight powershell %}
choco install minikube --version 1.10.1 -y
{% endhighlight %}

Running above commands will install **minikube** and **kubernetes-cli** tools in your system.

```text
Chocolatey v0.10.15
Installing the following packages:
minikube
By installing you accept licenses for the packages.
Progress: Downloading kubernetes-cli 1.18.2... 100%
Progress: Downloading Minikube 1.10.1... 100%

kubernetes-cli v1.18.2 [Approved]
```

{% include donate.html %}
{% include advertisement.html %}

## Running Kubernetes Cluster in Default Mode

Minikube can be deployed as a VM, a container, or bare-metal.

For windows, Minikube supports below drivers:

- Hyper-V - VM (preferred)
- Docker - VM + Container (preferred)
- VirtualBox - VM

You can choose to use any of the above supported drivers. Some drivers will require hypervisors to be installed.

Before you can run minikube in default mode, you need to have any of the hypervisors set up in your system. If you already have them configured then proceed to next steps. Otherwise, check these sections for respective driver installations.

- [Hyper-V](#enable-hyper-v)

- [VirtualBox](#install-virtualbox)

***In my system, I have Hyper-V, VirtualBox and Docker installed. Both VirtualBox and Docker are not running.***

If you start minikube in default mode, it will try to determine the driver to use based on the hypervisors available in your system, their current health (whether running/offline) and assigned priorities for tie breaking.

For example, if you run below command:

```bash
minikube start --alsologtostderr
```

You can observe below from the logs.

1) Minikube first checks for installed drivers based on environment settings in PATH variable.

```text
I0516 11:05:32.171260    8048 global.go:102] Querying for installed drivers using PATH=
````

2) If you have docker installed but not running, then it will have status **Installed:true Healthy:false**.

```text
W0516 11:05:32.632042    8048 docker.go:99] docker returned error: exit status 1
I0516 11:05:32.632042    8048 global.go:110] docker priority: 6, state: {Installed:true Healthy:false Error:"docker vers
ion --format {{.Server.Os}}-{{.Server.Version}}" exit status 1: error during connect: Get http://%2F%2F.%2Fpipe%2Fdocker
_engine/v1.40/version: open //./pipe/docker_engine: 
```

3) If you have hyper-v enabled, then it will have status **Installed:true Healthy:true**.

```text
I0516 11:05:34.225130    8048 global.go:110] hyperv priority: 7, state: {Installed:true Healthy:true Error:<nil> Fix: Doc:}
```

4) If you have virtualbox but it is not currently running, then it will have status **Installed:true Healthy:false**.

```text
I0516 11:05:36.271280    8048 global.go:110] virtualbox priority: 5, state: {Installed:true Healthy:false Error:C:\Program Files\Oracle\VirtualBox\VBoxManage.exe list hostinfo failed:
Fix:Install the latest version of VirtualBox Doc:https://minikube.sigs.k8s.io/docs/reference/drivers/virtualbox/}
```

5) Finally, minikube makes a decision to pick **hyperv** as it is the only healthy driver available although we had other drivers installed in our system. If you have multiple drivers in a healthy state, then it will pick one based on assigned priorities.

```text
I0516 11:05:36.310251    8048 driver.go:201] not recommending "docker" due to health: "docker version --format {{.Server.Os}}-{{.Server.Version}}" exit status 1: error during connect: Get http://%2F%2F.%2Fpipe%2Fdocker_engine/v1.40/version: open //./pipe/docker_engine: The system cannot find the file specified. In the default daemon configuration on Windows, the docker client must be run elevated to connect. This error may also indicate that the docker daemon is not running.
I0516 11:05:36.311273    8048 driver.go:201] not recommending "virtualbox" due to health: C:\Program Files\Oracle\VirtualBox\VBoxManage.exe list hostinfo failed:
I0516 11:05:36.312255    8048 driver.go:235] Picked: hyperv
I0516 11:05:36.312255    8048 driver.go:237] Rejects: [docker podman virtualbox vmware]
* Automatically selected the hyperv driver
I0516 11:05:36.315250    8048 start.go:215] selected driver: hyperv
```

## Running Kubernetes Cluster in Hyper-V

### Enable Hyper-V

To enable Hyper-V, run powershell as administrator and execute below command:

```powershell
Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V -All
```

When the installation has completed, reboot your system.

### Start Minikube

Run this command in PowerShell as an administrator.

{% highlight powershell %}
minikube start --driver=hyperv --disk-size=10g --memory=4096 --alsologtostderr
{% endhighlight %}

Minikube will perform below steps
 - Downloads MinikubeISO and places it in .minikube folder in your user directory
 - Connects to Hyper-V and runs a `minikube` virtual machine
 - Downloads the necessary files and moves them to the cluster
 - Runs a single-node Kubernetes cluster inside the VM

You will see below logs if everything went fine.

{% highlight text %}
I0516 11:10:57.839268    9364 ssh_runner.go:148] Run: sudo KUBECONFIG=/var/lib/minikube/kubeconfig \
/var/lib/minikube/binaries/v1.18.2/kubectl apply -f /etc/kubernetes/addons/storageclass.yaml
* Enabled addons: default-storageclass, storage-provisioner
I0516 11:10:57.971439    9364 addons.go:322] enableAddons completed in 12.866012s
* Done! kubectl is now configured to use "minikube"
I0516 11:10:58.172457    9364 start.go:378] kubectl: 1.18.2, cluster: 1.18.2 (minor skew: 0)
{% endhighlight %}

To make hyperv the default driver:

```bash
minikube config set driver hyperv
```

### Troubleshooting

If you face any issues during the setup process perform below steps:

Delete the minikube VM
{% highlight powershell %}
minikube delete
{% endhighlight %}

Delete .minikube and .kube folders in your home directory

Run minikube start command with appropriate options.

{% include donate.html %}
{% include advertisement.html %}

## Running Kubernetes Cluster in VirtualBox 

### Install VirtualBox

We install VirtualBox using chocolatey with below command:

{% highlight powershell %}
choco install virtualbox -y
{% endhighlight %}

### Start Minikube

Run this command in PowerShell as an administrator.

{% highlight powershell %}
minikube start --driver=virtualbox --alsologtostderr
{% endhighlight %}

Minikube will perform below steps
 - Downloads MinikubeISO and places it in .minikube folder in your user directory
 - Connects to VirtualBox and runs a `minikube` virtual machine
 - Downloads the necessary files and moves them to the cluster
 - Runs a single-node Kubernetes cluster inside the VM

To make VirtualBox the default driver:

```bash
minikube config set driver virtualbox
```

### Troubleshooting

If you face any issues during the setup process perform below steps:

Delete the minikube VM
{% highlight powershell %}
minikube delete
{% endhighlight %}

Delete .minikube and .kube folders in your home directory

Run minikube start command with appropriate options.

{% include donate.html %}
{% include advertisement.html %}

## Interacting With Your Cluster

To check if minikube is running use below command:

```bash
minikube status
```

which outputs
{% highlight text %}
type: Control Plane
host: Running
kubelet: Running
apiserver: Running
kubeconfig: Configured
{% endhighlight %}

To ensure all the cluster components are running we use below command

{% highlight bash %}
$ kubectl get pods -n kube-system
NAME                               READY   STATUS    RESTARTS   AGE
coredns-66bff467f8-h7z4r           1/1     Running   0          6m25s
coredns-66bff467f8-mrqnm           1/1     Running   0          6m25s
etcd-minikube                      1/1     Running   0          6m24s
kube-apiserver-minikube            1/1     Running   0          6m24s
kube-controller-manager-minikube   1/1     Running   0          6m24s
kube-proxy-7zl29                   1/1     Running   0          6m25s
kube-scheduler-minikube            1/1     Running   0          6m24s
storage-provisioner                1/1     Running   0          6m22s
{% endhighlight %}

If any of the above pods are in failed status you can get it's logs as follows for debugging

{% highlight powershell %}
kubectl logs kube-apiserver-minikube -n kube-system
{% endhighlight %}

If you notice any of the pods in `CrashLoopBackOff` status then perform the steps as mentioned in the troubleshooting guide earlier.

To access the Kubernetes dashboard run below command
{% highlight powershell %}
minikube dashboard
{% endhighlight %}

<figure>
    <a href="{{ site.url }}/assets/img/2020/05/kubernetes-dashboard.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2020/05/kubernetes-dashboard.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2020/05/kubernetes-dashboard.png">
            <img src="{{ site.url }}/assets/img/2020/05/kubernetes-dashboard.png" alt="">
        </picture>
    </a>
</figure>

{% include donate.html %}
{% include advertisement.html %}