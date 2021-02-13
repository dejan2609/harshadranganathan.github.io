---
layout: post
title: "AWS EKS Cluster Setup with Terraform and Helm Charts - Part 2"
date: 2021-02-13
excerpt: "Guide to provisioning Kubernetes cluster in AWS EKS using Terraform and Helm Charts"
tag:
- terraform aws eks node group
- terraform kubernetes provider eks
- terraform eks autoscaling
- terraform eks example
- eks node group vs worker group
- worker_groups_launch_template
- aws_eks_cluster_auth
- eks getting started
- aws_eks_cluster terraform
- eks production
- upgrading eks with terraform
- terraform eks node group
- terraform-aws-modules/eks/aws
- terraform eks node group example
- terraform eks module
- eks cluster autoscaler
- kubernetes terraform aws
- aws-auth configmap terraform
- aws eks cluster setup using terraform
- aws eks setup using terraform
comments: true
---

## Introduction

In this part, we will focus on setting up the control plane of our EKS cluster.

Throughout this article we will be referring to the terraform snippets from [EKS Terraform Module](https://github.com/cloudposse/terraform-aws-eks-cluster) to describe the control plane set up process.

The Amazon EKS control plane consists of control plane nodes that run the Kubernetes software, such as etcd and the Kubernetes API server. 

The control plane runs in an account managed by AWS, and the Kubernetes API is exposed via the Amazon EKS endpoint associated with your cluster.

<figure>
    <a href="{{ site.url }}/assets/img/2021/02/eks-control-plane.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2021/02/eks-control-plane.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2021/02/eks-control-plane.png">
            <img src="{{ site.url }}/assets/img/2021/02/eks-control-plane.png" alt="">
        </picture>
    </a>
</figure>

## VPC

We require the VPC details so that we can provision our EKS cluster of master nodes in the desired network.

In our previous post, we had set up a VPC with private/public subnets. 

You could save the state file in S3 so that you could refer it in your EKS terraform code as shown below.

`data.tf`

```terraform
data "terraform_remote_state" "vpc" {
  backend = "s3"
  config = {
    region = var.region
    bucket = format("%s-%s-terraform-state", var.namespace, var.stage)
    key    = format("%s/vpc/terraform.tfstate", var.stage)
  }
}
```

## EKS Cluster

```terraform
module "eks_cluster" {
  source                    = "git::https://github.com/cloudposse/terraform-aws-eks-cluster.git?ref=master"
  namespace                 = var.namespace
  stage                     = var.stage
  name                      = var.name
  attributes                = var.attributes
  tags                      = var.tags
  region                    = var.region
  vpc_id                    = data.terraform_remote_state.vpc.outputs.vpc_id
  subnet_ids                = data.terraform_remote_state.vpc.outputs.private_subnets
  kubernetes_version        = var.kubernetes_version
  enabled_cluster_log_types = var.enabled_cluster_log_types
  endpoint_private_access   = var.cluster_endpoint_private_access
  endpoint_public_access    = var.cluster_endpoint_public_access
  public_access_cidrs       = var.public_access_cidrs
  oidc_provider_enabled     = var.oidc_provider_enabled
  map_additional_iam_roles  = var.map_additional_iam_roles
}
```

|Variable|Values|
|---|---|
|kubernetes_version |1.18 |
|enabled_cluster_log_types | ["api", "audit", "authenticator", "controllerManager", "scheduler"] |
|cluster_endpoint_private_access | true |
|cluster_endpoint_public_access | true |
|public_access_cidrs |Your corporate network CIDRs |
|oidc_provider_enabled |true |
|map_additional_iam_roles |[{<br/>rolearn = "arn:aws:iam::\<account_id\>:role/\<role_name\>"<br/>username = "Contributor"<br/>groups = ["system:masters"]<br/>}] |
{:.table-striped} 

{% include donate.html %}
{% include advertisement.html %}

### Cluster Endpoint Access

When you create a new cluster, Amazon EKS creates an endpoint for the managed Kubernetes API server that you use to communicate with your cluster.

There are three options to secure this API server endpoint.

|Endpoint Public Access|Endpoint Private Access|Behavior|
|--|--|--|
|Enabled |Enabled|* This is the most common access pattern<br/>* Kubernetes API requests within your cluster's VPC (such as node to control plane communication) use the private VPC endpoint.<br/>* Your cluster API server is accessible from the internet.<br/><br/>Tools like kubectl, eksctl etc. can access the API server endpoint from your local<br/>CI/CD tools can also access the API server endpoint<br/>To restrict access to the public server endpoint we configure the CIDR ranges, typically this will be your corporate network range, CI/CD machine's address range etc. |
|Enabled|Disabled|* Kubernetes API requests that originate from within your cluster's VPC (such as node to control plane communication) leave the VPC but not Amazon's network.<br/>* Your cluster API server is accessible from the internet.<br/><br/>If you limit access to specific CIDR blocks, then it is recommended that you also enable the private endpoint, or ensure that the CIDR blocks that you specify include the addresses that nodes and Fargate pods (if you use them) access the public endpoint from.<br/>For example, if you have a node in a private subnet that communicates to the internet through a NAT Gateway, you will need to add the outbound IP address of the NAT gateway as part of an allowed CIDR block on your public endpoint.|
|Disabled|Enabled|* There is no public access to your API server from the internet.<br/>* Tools like kubectl, eksctl need to be used from within the VPC using bastion host or connected network<br/>* The cluster's API server endpoint is resolved by public DNS servers to a private IP address from the VPC<br/><br/> When you do a dns query for your EKS API URL (ie 9FF86DB0668DC670F27F426024E7CDBD.sk1.us-east-1.eks.amazonaws.com) it will return private IP of EKS Endpoint(ie 10.100.125.20) . It means everyone who knows AWS EKS API server endpoint DNS record can learn your VPC subnet and AWS EKS API Server Endpoint internal IP address but they will not be able to access it.|
{:.table-striped} 


Reference - <https://docs.aws.amazon.com/eks/latest/userguide/cluster-endpoint.html>

### Control Plane Logs

Amazon EKS control plane logging provides audit and diagnostic logs directly from the Amazon EKS control plane to CloudWatch Logs in your account.

You can select the exact log types you need, and logs are sent as log streams to a group for each Amazon EKS cluster in CloudWatch.

|Log Types|Purpose|
|--|--|
|api |Cluster's API server logs |
|audit |  Kubernetes audit logs provide a record of the individual users, administrators, or system components that have affected your cluster. |
|authenticator |  These logs represent the control plane component that Amazon EKS uses for Kubernetes Role Based Access Control (RBAC) authentication using IAM credentials. |
|controllerManager| Logs for the Controller Manager that ships with Kubernetes |
|scheduler | Scheduler logs provide information on the decision made for when and where to run pods in your cluster|
{:.table-striped} 

Reference - <https://docs.aws.amazon.com/eks/latest/userguide/control-plane-logs.html>