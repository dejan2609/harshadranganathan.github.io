---
layout: post
title: "AWS EKS Cluster Setup with Terraform - Part 1"
date: 2020-12-05
excerpt: "Here, we will set up VPC infrastructure needed for EKS"
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

Before we set up our EKS cluster, we need to work on setting up the network infrastructure.

Throughout this article we will be referring to the terraform snippets from [VPC Terraform module](https://github.com/terraform-aws-modules/terraform-aws-vpc/) to describe the network set up process.

You can find the sample code that uses the module in below repo:

{% include repo-card.html repo="terraform-aws-vpc" %}

## AWS Network Diagram

You can zoom on the network diagram here - 

https://raw.githubusercontent.com/HarshadRanganathan/aws-diagrams/main/network/aws-network-diagram.png

We'll explore the various components and how to set them up using terraform.

<figure>
    <a href="{{ site.url }}/assets/img/2020/12/aws-network-diagram.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2020/12/aws-network-diagram.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2020/12/aws-network-diagram.png">
            <img src="{{ site.url }}/assets/img/2020/12/aws-network-diagram.png" alt="">
        </picture>
    </a>
</figure>

## VPC

Amazon Virtual Private Cloud (Amazon VPC) lets you provision a logically isolated section of the AWS Cloud where you can launch AWS resources in a virtual network that you define. 

You have complete control over your virtual networking environment, including selection of your own IP address range, creation of subnets, and configuration of route tables and network gateways. 

Below is a sample terraform snippet where you pass in variable values to create the VPC in a specific region. 

```terraform
resource "aws_vpc" "this" {
  count = var.create_vpc ? 1 : 0

  cidr_block                       = var.cidr
  instance_tenancy                 = var.instance_tenancy
  enable_dns_hostnames             = var.enable_dns_hostnames
  enable_dns_support               = var.enable_dns_support
  enable_classiclink               = var.enable_classiclink
  enable_classiclink_dns_support   = var.enable_classiclink_dns_support
  assign_generated_ipv6_cidr_block = var.enable_ipv6

  tags = merge(
    {
      "Name" = format("%s", var.name)
    },
    var.tags,
    var.vpc_tags,
  )
}
```

|Variable|Values|
|---|---|
|cidr_block |10.0.0.0/16 |
|enable_dns_hostnames|true |
|enable_dns_support|true |
{:.table-striped} 

**It's important to note that your VPC must have  DNS hostname and DNS resolution support enabled. Otherwise, your nodes cannot register with the EKS cluster**

References:

<https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/vpc>

### DNS

|Attribute |Description |
|---|---|
|enableDnsHostnames |Indicates whether instances with public IP addresses get corresponding public DNS hostnames. |
|enableDnsSupport |Indicates whether the DNS resolution is supported. |
{:.table-striped} 

References:

<https://docs.aws.amazon.com/vpc/latest/userguide/vpc-dns.html>


{% include donate.html %}
{% include advertisement.html %}

## Public Subnets

A public subnet is a subnet that's associated with a route table that has a route to an Internet gateway.

Instances in the public subnet with Elastic IPv4 addresses (example: 198.51.100.1), which are public IPv4 addresses enable them to be reached from the Internet. Also, the instances in the public subnet can send outbound traffic directly to the Internet.

To add a new public subnet to your VPC, you must specify an IPv4 CIDR block for the subnet from the range of your VPC.

```terraform
resource "aws_subnet" "public" {
  count = var.create_vpc && length(var.public_subnets) > 0 && (false == var.one_nat_gateway_per_az || length(var.public_subnets) >= length(var.azs)) ? length(var.public_subnets) : 0

  vpc_id                          = local.vpc_id
  cidr_block                      = element(concat(var.public_subnets, [""]), count.index)
  availability_zone               = length(regexall("^[a-z]{2}-", element(var.azs, count.index))) > 0 ? element(var.azs, count.index) : null
  availability_zone_id            = length(regexall("^[a-z]{2}-", element(var.azs, count.index))) == 0 ? element(var.azs, count.index) : null
  map_public_ip_on_launch         = var.map_public_ip_on_launch
  assign_ipv6_address_on_creation = var.public_subnet_assign_ipv6_address_on_creation == null ? var.assign_ipv6_address_on_creation : var.public_subnet_assign_ipv6_address_on_creation

  ipv6_cidr_block = var.enable_ipv6 && length(var.public_subnet_ipv6_prefixes) > 0 ? cidrsubnet(aws_vpc.this[0].ipv6_cidr_block, 8, var.public_subnet_ipv6_prefixes[count.index]) : null

  tags = merge(
    {
      "Name" = format(
        "%s-${var.public_subnet_suffix}-%s",
        var.name,
        element(var.azs, count.index),
      )
    },
    var.tags,
    var.public_subnet_tags,
  )
}
```

|Variable|Values|
|---|---|
|public_subnets |["10.0.48.0/20", "10.0.64.0./20", "10.0.80.0/20"] |
|azs|["us-east-1a", "us-east-1b", "us-east-1c"] |
{:.table-striped} 

Here, we provide the public subnet range and instruct terraform to create 3 subnets across 3 availability zones in the US East region.

## Private Subnets

 Instances in the private subnet are back-end servers that don't need to accept incoming traffic from the Internet and therefore do not have public IP addresses; however, they can send requests to the Internet using the NAT gateway.

 For example, the database servers can connect to the Internet for software updates using the NAT gateway, but the Internet cannot establish connections to the database servers.

 ```terraform
 resource "aws_subnet" "private" {
  count = var.create_vpc && length(var.private_subnets) > 0 ? length(var.private_subnets) : 0

  vpc_id                          = local.vpc_id
  cidr_block                      = var.private_subnets[count.index]
  availability_zone               = length(regexall("^[a-z]{2}-", element(var.azs, count.index))) > 0 ? element(var.azs, count.index) : null
  availability_zone_id            = length(regexall("^[a-z]{2}-", element(var.azs, count.index))) == 0 ? element(var.azs, count.index) : null
  assign_ipv6_address_on_creation = var.private_subnet_assign_ipv6_address_on_creation == null ? var.assign_ipv6_address_on_creation : var.private_subnet_assign_ipv6_address_on_creation

  ipv6_cidr_block = var.enable_ipv6 && length(var.private_subnet_ipv6_prefixes) > 0 ? cidrsubnet(aws_vpc.this[0].ipv6_cidr_block, 8, var.private_subnet_ipv6_prefixes[count.index]) : null

  tags = merge(
    {
      "Name" = format(
        "%s-${var.private_subnet_suffix}-%s",
        var.name,
        element(var.azs, count.index),
      )
    },
    var.tags,
    var.private_subnet_tags,
  )
}
```

|Variable|Values|
|---|---|
|private_subnets |["10.0.0.0/20", "10.0.16.0./20", "10.0.32.0/20"] |
|azs|["us-east-1a", "us-east-1b", "us-east-1c"] |
{:.table-striped} 

## Custom Route Tables

We create custom route tables for both public and private subnets.

One way to protect your VPC is to leave the main route table in its original default state. 

Then, explicitly associate each new subnet that you create with one of the custom route tables you've created. 

This ensures that you explicitly control how each subnet routes traffic.

```terraform
resource "aws_route_table" "public" {
  count = var.create_vpc && length(var.public_subnets) > 0 ? 1 : 0

  vpc_id = local.vpc_id

  tags = merge(
    {
      "Name" = format("%s-${var.public_subnet_suffix}", var.name)
    },
    var.tags,
    var.public_route_table_tags,
  )
}

resource "aws_route_table_association" "public" {
  count = var.create_vpc && length(var.public_subnets) > 0 ? length(var.public_subnets) : 0

  subnet_id      = element(aws_subnet.public.*.id, count.index)
  route_table_id = aws_route_table.public[0].id
}

resource "aws_route_table" "private" {
  count = var.create_vpc && local.max_subnet_length > 0 ? local.nat_gateway_count : 0

  vpc_id = local.vpc_id

  tags = merge(
    {
      "Name" = var.single_nat_gateway ? "${var.name}-${var.private_subnet_suffix}" : format(
        "%s-${var.private_subnet_suffix}-%s",
        var.name,
        element(var.azs, count.index),
      )
    },
    var.tags,
    var.private_route_table_tags,
  )
}

resource "aws_route_table_association" "private" {
  count = var.create_vpc && length(var.private_subnets) > 0 ? length(var.private_subnets) : 0

  subnet_id = element(aws_subnet.private.*.id, count.index)
  route_table_id = element(
    aws_route_table.private.*.id,
    var.single_nat_gateway ? 0 : count.index,
  )
}
```

{% include donate.html %}
{% include advertisement.html %}

## NAT Gateway

You can use a network address translation (NAT) gateway to enable instances in a private subnet to connect to the internet or other AWS services, but prevent the internet from initiating a connection with those instances. 

To create a NAT gateway, you must specify the public subnet in which the NAT gateway should reside. 

```terraform
resource "aws_nat_gateway" "this" {
  count = var.create_vpc && var. ? local.nat_gateway_count : 0

  allocation_id = element(
    local.nat_gateway_ips,
    var.single_nat_gateway ? 0 : count.index,
  )
  subnet_id = element(
    aws_subnet.public.*.id,
    var.single_nat_gateway ? 0 : count.index,
  )

  tags = merge(
    {
      "Name" = format(
        "%s-%s",
        var.name,
        element(var.azs, var.single_nat_gateway ? 0 : count.index),
      )
    },
    var.tags,
    var.nat_gateway_tags,
  )

  depends_on = [aws_internet_gateway.this]
}
```

|Variable|Values|
|---|---|
|enable_nat_gateway  |true |
|one_nat_gateway_per_az   |true |
{:.table-striped} 

AWS well architected framework recommends to have one NAT gateway per AZ for HA and bandwidth reasons.

### EIP

 You must also specify an Elastic IP address to associate with the NAT gateway when you create it.

 So, you create the EIP and pass the IP to the NAT gateway setup above using `allocation_id` attribute.

 ```terraform
 resource "aws_eip" "nat" {
  count = var.create_vpc && var.enable_nat_gateway && false == var.reuse_nat_ips ? local.nat_gateway_count : 0

  vpc = true

  tags = merge(
    {
      "Name" = format(
        "%s-%s",
        var.name,
        element(var.azs, var.single_nat_gateway ? 0 : count.index),
      )
    },
    var.tags,
    var.nat_eip_tags,
  )
}
```

### Route Table

After you've created a NAT gateway, you must update the route table associated with one or more of your private subnets to point internet-bound traffic to the NAT gateway. 

This enables instances in your private subnets to communicate with the internet.

```terraform
resource "aws_route" "private_nat_gateway" {
  count = var.create_vpc && var.enable_nat_gateway ? local.nat_gateway_count : 0

  route_table_id         = element(aws_route_table.private.*.id, count.index)
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = element(aws_nat_gateway.this.*.id, count.index)

  timeouts {
    create = "5m"
  }
}
```

{% include donate.html %}
{% include advertisement.html %}

## Internet Gateway

An internet gateway is a horizontally scaled, redundant, and highly available VPC component that allows communication between your VPC and the internet.

An internet gateway serves two purposes: to provide a target in your VPC route tables for internet-routable traffic, and to perform network address translation (NAT) for instances that have been assigned public IPv4 addresses. 

Here, we create the Internet Gateway and attach it to the VPC.

```terraform
resource "aws_internet_gateway" "this" {
  count = var.create_vpc && var.create_igw && length(var.public_subnets) > 0 ? 1 : 0

  vpc_id = local.vpc_id

  tags = merge(
    {
      "Name" = format("%s", var.name)
    },
    var.tags,
    var.igw_tags,
  )
}
```

### Route Table

Add a route to your subnet's route table that directs internet-bound traffic to the internet gateway.

Here, the entry is added to the public subnet route table.

```terraform
resource "aws_route" "public_internet_gateway" {
  count = var.create_vpc && var.create_igw && length(var.public_subnets) > 0 ? 1 : 0

  route_table_id         = aws_route_table.public[0].id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.this[0].id

  timeouts {
    create = "5m"
  }
}
```

{% include donate.html %}
{% include advertisement.html %}

## Custom Network ACLs

A network access control list (ACL) is an optional layer of security for your VPC that acts as a firewall for controlling traffic in and out of one or more subnets.

You might set up network ACLs with rules similar to your security groups in order to add an additional layer of security to your VPC.

### Public Network ACL

By default, a network ACL that you create blocks all inbound and outbound traffic until you add rules, and is not associated with a subnet until you explicitly associate it with one.

We associate this ACL with public subnet with default inbound and outbound rules.

```terraform
resource "aws_network_acl" "public" {
  count = var.create_vpc && var.public_dedicated_network_acl && length(var.public_subnets) > 0 ? 1 : 0

  vpc_id     = element(concat(aws_vpc.this.*.id, [""]), 0)
  subnet_ids = aws_subnet.public.*.id

  tags = merge(
    {
      "Name" = format("%s-${var.public_subnet_suffix}", var.name)
    },
    var.tags,
    var.public_acl_tags,
  )
}

resource "aws_network_acl_rule" "public_inbound" {
  count = var.create_vpc && var.public_dedicated_network_acl && length(var.public_subnets) > 0 ? length(var.public_inbound_acl_rules) : 0

  network_acl_id = aws_network_acl.public[0].id

  egress          = false
  rule_number     = var.public_inbound_acl_rules[count.index]["rule_number"]
  rule_action     = var.public_inbound_acl_rules[count.index]["rule_action"]
  from_port       = lookup(var.public_inbound_acl_rules[count.index], "from_port", null)
  to_port         = lookup(var.public_inbound_acl_rules[count.index], "to_port", null)
  icmp_code       = lookup(var.public_inbound_acl_rules[count.index], "icmp_code", null)
  icmp_type       = lookup(var.public_inbound_acl_rules[count.index], "icmp_type", null)
  protocol        = var.public_inbound_acl_rules[count.index]["protocol"]
  cidr_block      = lookup(var.public_inbound_acl_rules[count.index], "cidr_block", null)
  ipv6_cidr_block = lookup(var.public_inbound_acl_rules[count.index], "ipv6_cidr_block", null)
}

resource "aws_network_acl_rule" "public_outbound" {
  count = var.create_vpc && var.public_dedicated_network_acl && length(var.public_subnets) > 0 ? length(var.public_outbound_acl_rules) : 0

  network_acl_id = aws_network_acl.public[0].id

  egress          = true
  rule_number     = var.public_outbound_acl_rules[count.index]["rule_number"]
  rule_action     = var.public_outbound_acl_rules[count.index]["rule_action"]
  from_port       = lookup(var.public_outbound_acl_rules[count.index], "from_port", null)
  to_port         = lookup(var.public_outbound_acl_rules[count.index], "to_port", null)
  icmp_code       = lookup(var.[count.index], "icmp_code", null)
  icmp_type       = lookup(var.public_outbound_acl_rules[count.index], "icmp_type", null)
  protocol        = var.public_outbound_acl_rules[count.index]["protocol"]
  cidr_block      = lookup(var.public_outbound_acl_rules[count.index], "cidr_block", null)
  ipv6_cidr_block = lookup(var.public_outbound_acl_rules[count.index], "ipv6_cidr_block", null)
}
```

|Variable|Values|
|---|---|
|public_dedicated_network_acl  |true |
{:.table-striped} 

You can define locals with public inbound and outbound rules for the variables `public_inbound_acl_rules` & `public_outbound_acl_rules`.

```terraform
locals {
  network_acls = {
    default_inbound = [
      {
        rule_number = 100
        rule_action = "allow"
        from_port = -1
        protocol = "all"
        to_port = -1
        cidr_block = "0.0.0.0/0"
      }
    ]

    default_outbound = [
      {
        rule_number = 100
        rule_action = "allow"
        from_port = -1
        protocol = "all"
        to_port = -1
        cidr_block = "0.0.0.0/0"
      }
    ]

    public_inbound = [
      {
        rule_number = 100
        rule_action = "allow"
        from_port = -1
        protocol = "all"
        to_port = -1
        cidr_block = "0.0.0.0/0"
      }
    ]

    public_outbound = [
      {
        rule_number = 100
        rule_action = "allow"
        from_port = -1
        protocol = "all"
        to_port = -1
        cidr_block = "0.0.0.0/0"
      }
    ]
  }
}
```

### Private Network ACL

We associate this ACL with private subnet with default inbound and outbound rules.

```terraform
resource "aws_network_acl" "private" {
  count = var.create_vpc && var.private_dedicated_network_acl && length(var.private_subnets) > 0 ? 1 : 0

  vpc_id     = element(concat(aws_vpc.this.*.id, [""]), 0)
  subnet_ids = aws_subnet.private.*.id

  tags = merge(
    {
      "Name" = format("%s-${var.private_subnet_suffix}", var.name)
    },
    var.tags,
    var.private_acl_tags,
  )
}

resource "aws_network_acl_rule" "private_inbound" {
  count = var.create_vpc && var.private_dedicated_network_acl && length(var.private_subnets) > 0 ? length(var.private_inbound_acl_rules) : 0

  network_acl_id = aws_network_acl.private[0].id

  egress          = false
  rule_number     = var.private_inbound_acl_rules[count.index]["rule_number"]
  rule_action     = var.private_inbound_acl_rules[count.index]["rule_action"]
  from_port       = lookup(var.private_inbound_acl_rules[count.index], "from_port", null)
  to_port         = lookup(var.private_inbound_acl_rules[count.index], "to_port", null)
  icmp_code       = lookup(var.private_inbound_acl_rules[count.index], "icmp_code", null)
  icmp_type       = lookup(var.private_inbound_acl_rules[count.index], "icmp_type", null)
  protocol        = var.private_inbound_acl_rules[count.index]["protocol"]
  cidr_block      = lookup(var.private_inbound_acl_rules[count.index], "cidr_block", null)
  ipv6_cidr_block = lookup(var.private_inbound_acl_rules[count.index], "ipv6_cidr_block", null)
}

resource "aws_network_acl_rule" "private_outbound" {
  count = var.create_vpc && var.private_dedicated_network_acl && length(var.private_subnets) > 0 ? length(var.private_outbound_acl_rules) : 0

  network_acl_id = aws_network_acl.private[0].id

  egress          = true
  rule_number     = var.private_outbound_acl_rules[count.index]["rule_number"]
  rule_action     = var.private_outbound_acl_rules[count.index]["rule_action"]
  from_port       = lookup(var.private_outbound_acl_rules[count.index], "from_port", null)
  to_port         = lookup(var.private_outbound_acl_rules[count.index], "to_port", null)
  icmp_code       = lookup(var.private_outbound_acl_rules[count.index], "icmp_code", null)
  icmp_type       = lookup(var.private_outbound_acl_rules[count.index], "icmp_type", null)
  protocol        = var.private_outbound_acl_rules[count.index]["protocol"]
  cidr_block      = lookup(var.private_outbound_acl_rules[count.index], "cidr_block", null)
  ipv6_cidr_block = lookup(var.private_outbound_acl_rules[count.index], "ipv6_cidr_block", null)
}
```

|Variable|Values|
|---|---|
|private_dedicated_network_acl  |true |
{:.table-striped} 

{% include donate.html %}
{% include advertisement.html %}

## VPC Endpoints

A VPC endpoint enables private connections between your VPC and supported AWS services.

A VPC endpoint does not require an internet gateway, virtual private gateway, NAT device, VPN connection, or AWS Direct Connect connection. Instances in your VPC do not require public IP addresses to communicate with resources in the service.

### Interface Endpoints

An interface endpoint is an elastic network interface with a private IP address from the IP address range of your subnet. It serves as an entry point for traffic destined to a supported AWS service or a VPC endpoint service. Interface endpoints are powered by AWS PrivateLink.

For example, we require interface endpoints for ECR so that our images are downloaded privately rather than going through the Internet.

We create VPC endpoint for ECR and associate it with private subnets.

```terraform
data "aws_vpc_endpoint_service" "ecr_api" {
  count = var.create_vpc && var.enable_ecr_api_endpoint ? 1 : 0

  service = "ecr.api"
}

resource "aws_vpc_endpoint" "ecr_api" {
  count = var.create_vpc && var.enable_ecr_api_endpoint ? 1 : 0

  vpc_id            = local.vpc_id
  service_name      = data.aws_vpc_endpoint_service.ecr_api[0].service_name
  vpc_endpoint_type = "Interface"

  security_group_ids  = var.ecr_api_endpoint_security_group_ids
  subnet_ids          = coalescelist(var.ecr_api_endpoint_subnet_ids, aws_subnet.private.*.id)
  private_dns_enabled = var.ecr_api_endpoint_private_dns_enabled
  tags                = local.vpce_tags
}
```

|Variable|Values|
|---|---|
|enable_ecr_api_endpoint  |true |
|ecr_api_endpoint_private_dns_enabled  |true |
{:.table-striped} 

#### Security Groups

If you do not specify a security group, the default security group for your VPC is automatically associated with the endpoint network interface. 

You must ensure that the rules for the security group allow communication between the endpoint network interface and the resources in your VPC that communicate with the service.

We create a new security group and associate it with the VPC endpoints with below rules:
1. Allow inbound traffic from VPC CIDR
2. Add this security group itself as an ingress

Pass in the newly created security group to variable `ecr_api_endpoint_security_group_ids`.

We use below block in our terraform module which calls VPC terraform module block.

```terraform
resource "aws_security_group" "vpce_security_group" {
  name = "vpce-security-group"
  description = "Allows to communicate with vpce interface endpoints"
  vpc_id = local.vpc_id
  tags = local.vpce_tags
}

resource "aws_security_group_rule" "ingress_self" {
  description = "Self Ingress"
  from_port = 0
  to_port = 65535
  protocol = "-1"
  security_group_id = aws_security_group.vpce_security_group.id
  source_security_group_id = aws_security_group.vpce_security_group.id
  type = "ingress"
}

resource "aws_security_group_rule" "ingress_vpc" {
  description = "VPC CIDR"
  from_port = 0
  to_port = 65535
  protocol = "-1"
  security_group_id = aws_security_group.vpce_security_group.id
  source_security_group_id = [var.cidr]
  type = "ingress"
}
```

{% include donate.html %}
{% include advertisement.html %}