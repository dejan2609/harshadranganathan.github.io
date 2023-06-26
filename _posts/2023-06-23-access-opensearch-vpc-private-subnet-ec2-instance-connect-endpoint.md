---
layout: post
title:  "Connect to AWS OpenSearch in VPC Private Subnet using EC2 Instance Connect Endpoint (Local/Laptop)"
date:   2023-06-26
excerpt: "Steps to Access OpenSearch service running in a private subnet from your local/laptop"
tag:
- opensearch
- private subnet
- access opensearch with private ip
- access opensearch without bastion host
- no bastion host
- access opensearch from outside
- aws opensearch access from outside
- how to access aws opensearch in private subnet
- how to connect to aws opensearch cluster in private subnet
- how to connect to aws opensearch cluster in aws vpc
- how to connect to aws opensearch cluster in private subnet using EC2 Instance Connect Endpoint
- how to connect to aws opensearch cluster in vpc using EC2 Instance Connect Endpoint
- how to connect to aws opensearch cluster running in a private subnet using EC2 Instance Connect Endpoint
- how to connect to aws opensearch cluster running in a vpc using EC2 Instance Connect Endpoint
comments: true
---

## Introduction

EC2 Instance Connect Endpoint allows you to connect to an instance without requiring the instance to have a public IPv4 address.

<figure>
    <a href="{{ site.url }}/assets/img/2023/06/rds-ec2-instance-connect-endpoint.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2023/06/rds-ec2-instance-connect-endpoint.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2023/06/rds-ec2-instance-connect-endpoint.png">
            <img src="{{ site.url }}/assets/img/2023/06/rds-ec2-instance-connect-endpoint.png" alt="">
        </picture>
    </a>
</figure>

## Upgrade AWS CLI

You need a minimum of AWS CLI v2.12+ installed in your local to be able to use EC2 Instance Connect Endpoint Service.

You can find the upgrade instructions for your CLI installation here - [https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)

## Create EC2 Instance Connect Endpoint

Next, we create an EC2 Instance Connect Endpoint in your VPC which have the resources you would like to connect to e.g. AWS OpenSearch Domain

EC2 Instance Connect Endpoint has following limitations:

- 5 EC2 Instance Connect Endpoints per AWS account

- 1 EC2 Instance Connect Endpoint per VPC

- 1 EC2 Instance Connect Endpoint per subnet

Also, you will be charged for cross-AZ traffic if your EC2 Instance Endpoint connects to a resource running in another AZ.

Finally, AWS will throttle any high volume data transfers done through this service.

You can create the EC2 Instance Connect Endpoint through the VPC service `VPC -> Endpoints -> Create endpoint`

<figure>
    <a href="{{ site.url }}/assets/img/2023/06/create-ec2-instance-connect-endpoint.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2023/06/create-ec2-instance-connect-endpoint.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2023/06/create-ec2-instance-connect-endpoint.png">
            <img src="{{ site.url }}/assets/img/2023/06/create-ec2-instance-connect-endpoint.png" alt="">
        </picture>
    </a>
</figure>

Provide a VPC, Subnet & a security group to be used for the endpoint service.

For example, you can choose your VPC default security group here or create a custom security group.

{% include donate.html %}
{% include advertisement.html %}

## Get Private IP Address of AWS OpenSearch Service

Get the VPC URL of the OpenSearch domain and do `nslookup` on the same to get the private IP addresses of the cluster.

e.g.

```bash
$ nslookup vpc-test-dgseryegg3hnujihusfg.us-east-1.es.amazonaws.com
Server: 10.12.3.10
Address: 10.12.3.10#12

Non-authoritative answer:
Name: vpc-test-dgseryegg3hnujihusfg.us-east-1.es.amazonaws.com
Address: 10.1.12.2
Name: vpc-test-dgseryegg3hnujihusfg.us-east-1.es.amazonaws.com
Address: 10.1.14.3
```

We can use any of the IP's above e.g. `10.1.12.2` to open a tunnel to the OpenSearch cluster.

## OpenSearch Security Groups

You need to ensure your OpenSearch security group allows traffic from your EC2 Instance Connect Endpoint.

This can be achieved in the following ways:

[1] Add the EC2 Instance Connect Endpoint security group as an Inbound rule to your OpenSearch security group.

[2] Add VPC CIDR as an inbound rule to the OpenSearch security group.

## OpenTunnel

Run below command to open a tunnel to your OpenSearch domain:

```bash
aws ec2-instance-connect open-tunnel --private-ip-address 10.1.12.2 --instance-connect-endpoint-id <your-instance-connect-endpoint-id> --remote-port 443 --local-port 9200
```

| | |
|---|---|
|--private-ip-address |OpenSearch domain private IP you got from nslookup |
|--instance-connect-endpoint-id |EC2 Instance Connect Endpoint that you had created e.g. eice-345bjhj345 |
|--remote-port |Default port for the VPC URL of OpenSearch service is 443 |
{:.table-striped}

## Connect to AWS OpenSearch Cluster

You will see below output once you ran OpenTunnel command:

```text
Listening for connections on port 9200
```

You can now connect to the OpenSearch domain from your local using your tool of your choice e.g. Postman.

Open Postman and ensure the following:

[1] Choose `GET` as the request type.

[2] Enter list indices API in the URL `https://localhost:9200/_cat/indices` - you need to use https here otherwise you will get `400 The plain HTTP request was sent to HTTPS port` error

[3] Turn off `SSL certificate verification`.

[4] If your domain has fine grained access control enabled, then you will have to pass the credentials for the API requests. So, set `Basic Auth` in the request and configure `Username & Password`.

Execute the request which will list the indices in your domain.

<figure>
    <a href="{{ site.url }}/assets/img/2023/06/opensearch-postman-request.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2023/06/opensearch-postman-request.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2023/06/opensearch-postman-request.png">
            <img src="{{ site.url }}/assets/img/2023/06/opensearch-postman-request.png" alt="">
        </picture>
    </a>
</figure>

{% include donate.html %}
{% include advertisement.html %}