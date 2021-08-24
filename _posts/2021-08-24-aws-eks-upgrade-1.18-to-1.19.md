---
layout: post
title: "AWS EKS Cluster Upgrade (Self-managed) - 1.18 To 1.19"
date: 2021-08-24
excerpt: "Steps involved in upgrading EKS cluster from Kubernetes version 1.18 to 1.19"
tag:
- aws
- eks
- eks upgrade
- kubernetes upgrade
- eks upgrade 1.18
- eks addons upgrade
comments: true
---

This upgrade guide is for self-managed nodes.

## Note

1. Amazon EKS performs standard infrastructure and readiness health checks for network traffic on these new nodes to verify that they're working as expected. If any of these checks fail, Amazon EKS reverts the infrastructure deployment, and your cluster remains on the prior Kubernetes version. 

2. Running applications aren't affected (only for control plane upgrade), and your cluster is never left in a non-deterministic or unrecoverable state. 

3. Even though Amazon EKS runs a highly available control plane, you might experience minor service interruptions during an update. For example, if you attempt to connect to an API server just before or just after it's terminated and replaced by a new API server running the new version of Kubernetes, you might experience API call errors or connectivity issues. If this happens, retry your API operations until they succeed.

4. The Kubernetes minor version of the nodes in your cluster must be the same as the version of your control plane's current version before you update your control plane to a new Kubernetes version.

5. You can update only one minor version at a time. Therefore, if your current version is 1.18 and you want to update to 1.20, then you must first update your cluster to 1.19 and then update it from 1.19 to 1.20.

## Things To Check

1. Amazon EKS requires two to three free IP addresses from the subnets that were provided when you created the cluster. If these subnets don't have available IP addresses, then the update can fail. 

## Upgrade Steps

[1] Set kubectl context to the cluster that you want to upgrade.

```bash
kubectl config use-context arn:aws:eks:[region]:[account_number]:cluster/[cluster_name]
```

[2] Check the Kubernetes version of your cluster control plane.

```bash
kubectl version --short
```

Sample Output:

```
Client Version: v1.20.2
Server Version: v1.18.20-eks-8c579e
```

[3] Check the Kubernetes version of your nodes.

```bash
kubectl get nodes
```

Sample Output:

```
NAME                          STATUS   ROLES    AGE    VERSION
ip-10-0-xx-xx.ec2.internal    Ready    <none>   283d   v1.18.9-eks-d1db3c
ip-10-0-xx-xx.ec2.internal    Ready    <none>   313d   v1.18.9-eks-d1db3c
ip-10-0-xx-xx.ec2.internal    Ready    <none>   287d   v1.18.9-eks-d1db3c
```

[4] Confirm that the control plane version and node minor versions are matching before you proceed with the upgrade.

[5] Ensure that the eks privileged policy exists and is not showing any error.

```bash
kubectl get psp eks.privileged
```

Example Output:

```
NAME             PRIV   CAPS   SELINUX    RUNASUSER   FSGROUP    SUPGROUP   READONLYROOTFS   VOLUMES
eks.privileged   true   *      RunAsAny   RunAsAny    RunAsAny   RunAsAny   false            *
```

{% include donate.html %}
{% include advertisement.html %}

### Control Plane Upgrade

#### Kube Version

[1] If you are using IaC (Infrastructure As Code) tool, say terraform, you will update the Kubernetes version in that and apply your changes.

Sample terraform vars change:

```terraform
kubernetes_version = "1.19"
```

When you run terraform plan, it should show a change from `1.18` to `1.19` as shown below:

```
 ~ version                   = "1.18" -> "1.19"
```

**Note:** You can only update one minor version at a time. Otherwise, terraform will return this error: `error updating EKS Cluster version: InvalidParameterException: Unsupported Kubernetes minor version update from 1.18 to 1.20`

#### AMI

Also, depending on the terraform module which you are using for EKS cluster management, it will show a new AMI ID in the plan output which is configured for the target kubernetes version.

e.g. 

```
~ image_id                   = "ami-033cb6de8270b4ce7" -> "ami-0535962d400b33de7"
```

Alternatively, if the AMI is hardcoded in terraform, you can get the AMI pertaining to the target kubernetes version from this link - <https://docs.aws.amazon.com/eks/latest/userguide/eks-optimized-ami.html>

Update the AMI ID in the terraform code.

#### Launch Template

Typically, a new launch template version will be created for the AMI change by your terraform module.

There are two important settings that will drive how the upgrade is done.

`default_version` in the launch template needs to be set to the new template version. This will be suggested automatically by your plan output or you need to configure it in case of hardcoded version number.

Your auto scaling group, should have been configured to pick either the `latest` (or) `default` version of the launch template. If that's not the case you need to update your terraform code to pick the new launch template version so that any new nodes launched will use the new AMI image.

```
  ~ resource "aws_launch_template" "default" {
        arn                                  = "arn:aws:ec2:us-east-1::launch-template/lt-"
      ~ default_version                      = 4 -> (known after apply)
        id                                   = "lt-"
      ~ image_id                             = "ami-0c29dd87e87fb4dfd" -> "ami-0535962d400b33de7"
        instance_type                        = "r5a.xlarge"
      ~ latest_version                       = 4 -> (known after apply)
        name                                 = prod-eks-20210217125057781700000004"
        update_default_version               = true
```

Your plan output could be something like above where a new default and latest version is being set. Also, `update_default_version` flag here updates the default version to the latest template.


Review all your plan output and apply the changes.

It takes around 40 mins for the control plane upgrade to complete.


[2] Verify the version of your cluster control plane post the upgrade.

```bash
kubectl version --short
```

Sample Output:

```
Client Version: v1.20.2
Server Version: v1.19.13-eks-8df270
```

{% include donate.html %}
{% include advertisement.html %}

### Node Upgrade

#### Self-Managed Nodes

Below steps are applicable if you are using self-managed nodes.

##### Graceful Migration Approach

In this approach, you will launch new nodes, gracefully migrate your existing applications to the new nodes and then remove the old nodes from your cluster.

[1] If you have `cluster autoscaler` installed, disable it by scaling down the deployment down to zero replicas to avoid conflicting scaling actions.

```bash
kubectl scale deployments/cluster-autoscaler --replicas=0 -n kube-system
```

[2] If you have `Automatic scaling` policies defined based on CPU thresholds, disable them to avoid any conflicts.

Go to `Automatic scaling` tab in auto-scaling section of AWS console  [https://console.aws.amazon.com/ec2autoscaling/home?region=us-east-1#/details/](https://console.aws.amazon.com/ec2autoscaling/home?region=us-east-1#/details/) and set both the `scale-down` and `scale-up` policies to disabled state.

[3] Double the desired capacity of the cluster to launch new nodes which will run on the target kubernetes version (in previous section we had configured the auto scaling group to pick the latest template version which has the new AMI image).

E.g. If the Minimum capacity is set to 4 and the Desired capacity is set to 4, set the new Desired capacity as 8.

In below command, update `<group_name>` to the auto scaling group name of the cluster. This can be got from the AWS console [https://console.aws.amazon.com/ec2autoscaling/home?region=us-east-1#/details/](https://console.aws.amazon.com/ec2autoscaling/home?region=us-east-1#/details/)

```bash
aws autoscaling set-desired-capacity --auto-scaling-group-name <group_name> --desired-capacity <desired_capacity>
```

e.g.
```bash
aws autoscaling set-desired-capacity --auto-scaling-group-name prod-eks-20210504110647253400000007 --desired-capacity 6
```

[4] Wait for the new nodes to spin up and be in `Healthy` status. This can be checked in the `Instance management` tab of the auto-scaling group in AWS console.


[5] Verify that the new nodes are running in the target kubernetes version.

```bash
kubectl get nodes
```

Sample Output:

```
NAME                          STATUS   ROLES    AGE    VERSION
ip-10-0-xx-xx.ec2.internal    Ready    <none>   318d   v1.18.9-eks-d1db3c
ip-10-0-xx-xx.ec2.internal    Ready    <none>   98s    v1.19.13-eks-8df270
ip-10-0-xx-xx.ec2.internal    Ready    <none>   105s   v1.19.13-eks-8df270
ip-10-0-xx-xx.ec2.internal    Ready    <none>   89d    v1.18.9-eks-d1db3c8
ip-10-0-xx-xx.ec2.internal    Ready    <none>   89d    v1.18.9-eks-d1db3c
ip-10-0-xx-xx.ec2.internal    Ready    <none>   102s   v1.19.13-eks-8df270
ip-10-0-xx-xx.ec2.internal    Ready    <none>   105s   v1.19.13-eks-8df270
ip-10-0-xx-xx.ec2.internal    Ready    <none>   318d   v1.18.9-eks-d1db3c
```

[6] Taint all of the old nodes so that no new pods are scheduled there.

```bash
K8S_VERSION="1.18"
nodes=($(kubectl get nodes -o json | jq -r '.items[] | select(.status.nodeInfo.kubeletVersion | contains('\"v$K8S_VERSION\"')) | .metadata.name' | tr '\n' ' '))
for node in ${nodes[@]}
do
    echo "Tainting $node"
    kubectl taint nodes $node key=value:NoSchedule
done
```

`Note: You need to have jq installed in your bash`

Sample Output:

```
Tainting ip-10-0-xx-xx.ec2.internal
node/ip-10-0-xx-xx.ec2.internal tainted
```

[7] Drain the old nodes. This will move all the pods to the new nodes.

```bash
K8S_VERSION="1.18"
nodes=($(kubectl get nodes -o json | jq -r '.items[] | select(.status.nodeInfo.kubeletVersion | contains('\"v$K8S_VERSION\"')) | .metadata.name' | tr '\n' ' '))
for node in ${nodes[@]}
do
    echo "Draining $node"
    kubectl drain $node --ignore-daemonsets --delete-emptydir-data
    echo "Sleeping for 5 mins to allow pod startups in new node"
    sleep 300
done
```

`Note: We sleep for 5 mins after each node drain to give some time for the evicted pods to get into running state`

Sample output:

```bash
Draining ip-10-0-xx-xx.ec2.internal
node/ip-10-0-xx-xx.ec2.internal cordoned
evicting pod test
```

[8] Ensure that all the pods are in a running state.

```bash
kubectl get pods --field-selector=status.phase!=Running --all-namespaces
```

Above command should return `no resources found` if all is looking good.

Investigate any issues where the pods are not in running state.

[9] You can now terminate the old nodes.

```bash
K8S_VERSION="1.18"
nodes=($(kubectl get nodes -o json | jq -r '.items[] | select(.status.nodeInfo.kubeletVersion | contains('\"v$K8S_VERSION\"')) | .spec.providerID' | sed 's/.*\(i-.*\)/\1/' | tr '\n' ' '))
for node in ${nodes[@]}
do
    echo "Terminating $node"
    aws autoscaling terminate-instance-in-auto-scaling-group --instance-id $node --should-decrement-desired-capacity
done
```

[10] Check that the old nodes have been removed completely. 

```bash
kubectl get nodes
```

[11] Enable the `Automatic scaling` policies in the AWS console which we had previously disabled.

Go to `Automatic scaling` tab and set both the `scale-down` and `scale-up` policies to enabled state.

[12] Enable cluster autoscaler by scaling the deployment back to one replica.

```bash
kubectl scale deployments/cluster-autoscaler --replicas=1 -n kube-system
```

{% include donate.html %}
{% include advertisement.html %}

### Plugins Upgrade

#### VPC CNI Plugin

Recommended Amazon VPC CNI plugin version - `1.7.x` (Latest patch)

[1] Check the current VPC CNI version

```bash
kubectl describe daemonset aws-node --namespace kube-system | grep Image | cut -d "/" -f 2
```

[2] Download the VPC CNI manifest file.

```bash
curl -o aws-k8s-cni.yaml https://raw.githubusercontent.com/aws/amazon-vpc-cni-k8s/v1.7.10/config/v1.7/aws-k8s-cni.yaml
```

[3] If necessary, replace \<region-code\> in the following command with the Region that your cluster is in and then run the modified command to replace the Region code in the file (currently us-west-2).

```bash
sed -i.bak -e 's/us-west-2/<region-code>/' aws-k8s-cni.yaml
```

[4] If necessary, replace \<account\> in the following command with the account from Amazon EKS add-on container image addresses <https://docs.aws.amazon.com/eks/latest/userguide/add-ons-images.html> for the Region that your cluster is in and then run the modified command to replace the account in the file (currently 602401143452).

```bash
sed -i.bak -e 's/602401143452/<account>/' aws-k8s-cni.yaml
```

[5] Apply the manifest file to your cluster.

```bash
kubectl apply -f aws-k8s-cni.yaml
```

[6] Verify that the new CNI version is available

```bash
$ kubectl describe daemonset aws-node --namespace kube-system | grep Image | cut -d "/" -f 2

amazon-k8s-cni-init:v1.7.10
amazon-k8s-cni:v1.7.10
```

#### CoreDNS Plugin

Recommended CoreDNS plugin version - `1.8.0-eksbuild.1`

[1] Check the current CoreDNS version

```bash
kubectl describe pod coredns --namespace kube-system | grep Image |grep eksbuild | cut -d "/" -f 3
```

[2] Upgrade the plugin image version

```bash
kubectl set image --namespace kube-system deployment.apps/coredns \
    coredns=602401143452.dkr.ecr.us-east-1.amazonaws.com/eks/coredns:v1.8.0-eksbuild.1
```

#### Kube Proxy Plugin

Recommended kube-proxy version for Kubernetes 1.19 version is `1.19.6-eksbuild.2`

[1] Check the current proxy version

```bash
kubectl get daemonset kube-proxy --namespace kube-system -o=jsonpath='{$.spec.template.spec.containers[:1].image}'
```

[2] Upgrade the kube-proxy plugin image

```bash
kubectl set image daemonset.apps/kube-proxy \
     -n kube-system \
     kube-proxy=602401143452.dkr.ecr.us-east-1.amazonaws.com/eks/kube-proxy:v1.19.6-eksbuild.2
```

That's it, you are done with the upgrade. Now it's time to check that you haven't broken anything :)

{% include donate.html %}
{% include advertisement.html %}