---
layout: post
title:  "Setting up Kubernetes on Windows with Minikube"
date:   2018-11-25
excerpt: "Run Kubernetes locally with Minikube on Windows"
tag:
- Kubernetes
- Minikube
- Windows
comments: true
---

[Minikube](https://github.com/kubernetes/minikube) is a tool that makes it easy to run Kubernetes locally. Minikube runs a single-node Kubernetes cluster inside a VM on your laptop for users looking to try out Kubernetes or develop with it day-to-day.

Minikube can be installed in multiple operating systems (Linux, MacOS & Windows) and supports multiple drivers ([VirtualBox](https://www.virtualbox.org/), [Hyper-V](https://docs.microsoft.com/en-us/virtualization/hyper-v-on-windows/about/) in case of Windows).

We are going to look at Windows setup of Minikube using both VirtualBox & Hyper-V drivers.

If you have [Docker](https://www.docker.com/) in your local system then you would have enabled Hyper-V. In that case, it makes sense to make use of Hyper-V driver instead of VirtualBox as the latter doesn't work with Hyper-V enabled.

So, in such a case if you choose VirtualBox as your driver you might end up toggling Hyper-V and restarting your system based on whether you want to use Docker or VirtualBox for Kubernetes.

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
choco install minikube --version 0.27 -y
{% endhighlight %}

Note: Versions above 0.27 have an issue with [shutdown](https://github.com/kubernetes/minikube/issues/2914)

## Install VirtualBox

If you're planning to use VirtualBox as the driver for Minikube then run below command. Otherwise skip this step.

{% highlight powershell %}
choco install virtualbox -y
{% endhighlight %}

We'll look at running Kubernetes cluster in both VirtualBox and Hyper-V next.

## Running Kubernetes Cluster in VirtualBox 

### Start Minikube

Run this command in PowerShell as an administrator.

{% highlight powershell %}
minikube start --alsologtostderr
{% endhighlight %}

Minikube will perform below steps
 - Downloads MinikubeISO and places it in .minikube folder in your user directory
 - Connects to VirtualBox and runs a `minikube` virtual machine
 - Downloads the necessary files and moves them to the cluster
 - Runs a single-node Kubernetes cluster inside the VM

Jump to [Interacting With Your Cluster section](#interacting-with-your-cluster) next.

### Troubleshooting

If you face any issues during the setup process perform below steps:

Delete the minikube VM
{% highlight powershell %}
minikube delete
{% endhighlight %}

Delete .minikube and .kube folders in your home directory

Run minikube start command with appropriate options.

## Running Kubernetes Cluster in Hyper-V

### Create vSwitch

First step is to create a vSwitch in Hyper-V.

Open `Hyper-V Manager` in your windows system. On the right pane, select `Virtual Switch Manager` option.

Select `External` and choose `Create Virtual Switch` option in the `Virtual Switch Manager` window.

Give a name for the virtual switch e.g. Minikube with connection type as `External` and below option enabled
 - Allow management operating system to share this network adapter

Now select `Apply` to create a new vSwitch.

<figure>
	<a href="{{ site.url }}/assets/img/2018/11/hyper-v-manager-vswitch.png"><img src="{{ site.url }}/assets/img/2018/11/hyper-v-manager-vswitch.png"></a>
</figure>

If you see an error message `Failed while adding virtual Ethernet switch connections` it means that you have enabled sharing on your wifi connection which needs to be disabled.

Go to `Network and Sharing Center` and select your Wi-Fi connection. In the `Wi-Fi` status window select `Properties`.

In the `Wi-Fi` properties window under `Sharing` tab uncheck this option
 - Allow other network users to connect through this computer's Internet connection

<figure class="half">
	<a href="{{ site.url }}/assets/img/2018/11/windows-wifi-properties.png"><img src="{{ site.url }}/assets/img/2018/11/windows-wifi-properties.png"></a>
</figure>

### Start Minikube

Run this command in PowerShell as an administrator.

{% highlight powershell %}
minikube start --vm-driver "hyperv" --hyperv-virtual-switch "Minikube" --disk-size 10g --memory 4096 --alsologtostderr
{% endhighlight %}

Minikube will perform below steps
 - Downloads MinikubeISO and places it in .minikube folder in your user directory
 - Connects to Hyper-V and runs a `minikube` virtual machine
 - Downloads the necessary files and moves them to the cluster
 - Runs a single-node Kubernetes cluster inside the VM

You will see below logs if everything went fine.

{% highlight powershell %}
Connecting to cluster...
Setting up kubeconfig...
I1125 23:05:12.192115    4588 config.go:125] Using kubeconfig:  
Starting cluster components...
I1125 23:05:12.196100    4588 ssh_runner.go:80] Run with output:
sudo /usr/bin/kubeadm init --config /var/lib/kubeadm.yaml 
ts --ignore-preflight-errors=DirAvailable--data-minikube 
FileAvailable--etc-kubernetes-manifests-kube-scheduler.yaml 
fests-kube-apiserver.yaml --ignore-preflight-errors=FileAvailable
 --ignore-preflight-errors=FileAvailable--etc-kubernetes-manifests-etcd.yaml
flight-errors=CRI  &&
sudo /usr/bin/kubeadm alpha phase addon kube-dns

Kubectl is now configured to use the cluster.
Loading cached images from config file.
{% endhighlight %}

### Troubleshooting

If you face any issues during the setup process perform below steps:

Delete the minikube VM
{% highlight powershell %}
minikube delete
{% endhighlight %}

Delete .minikube and .kube folders in your home directory

Run minikube start command with appropriate options.

## Interacting With Your Cluster

To check if minikube is running use below command
{% highlight powershell %}
minikube status
{% endhighlight %}

which outputs 
{% highlight powershell %}
PS C:\WINDOWS\system32> minikube status
minikube: Running
cluster: Running
kubectl: Correctly Configured: pointing to minikube-vm at
{% endhighlight %}

To ensure all the cluster components are running we use below command

{% highlight powershell %}
PS C:\WINDOWS\system32> kubectl get pods -n kube-system
NAME                                    READY   STATUS    RESTARTS   AGE
coredns-c4cffd6dc-565mc                 1/1     Running   0          12m
etcd-minikube                           1/1     Running   0          11m
kube-addon-manager-minikube             1/1     Running   0          11m
kube-apiserver-minikube                 1/1     Running   0          11m
kube-controller-manager-minikube        1/1     Running   0          12m
kube-dns-86f4d74b45-vxrr9               3/3     Running   0          12m
kube-proxy-fn5c9                        1/1     Running   0          12m
kube-scheduler-minikube                 1/1     Running   0          11m
kubernetes-dashboard-6f4cfc5d87-hgdnq   1/1     Running   5          12m
storage-provisioner                     1/1     Running   0          12m
{% endhighlight %}

If any of the above pods are in failed status you can get it's logs as follows for debugging

{% highlight powershell %}
kubectl logs kubernetes-dashboard-6f4cfc5d87-hgdnq -n kube-system
{% endhighlight %}

If you notice any of the pods in `CrashLoopBackOff` status then perform the steps as mentioned in the troubleshooting guide earlier.

To access the Kubernetes dashboard run below command
{% highlight powershell %}
minikube dashboard
{% endhighlight %}