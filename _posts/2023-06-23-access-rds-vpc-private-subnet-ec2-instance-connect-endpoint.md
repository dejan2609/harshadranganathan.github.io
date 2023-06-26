---
layout: post
title:  "Connect to RDS in VPC Private Subnet using EC2 Instance Connect Endpoint (Local/Laptop)"
date:   2023-06-26
excerpt: "Steps to Access RDS/Aurora DB running in a private subnet from your local/laptop"
tag:
- rds
- private subnet
- access rds with private ip
- access rds without bastion host
- no bastion host
- access rds from outside
- aws rds access from outside
- how to access aws rds in private subnet
- how to connect to rds instance in private subnet
- how to connect to rds instance in aws vpc
- how to connect to rds instance in private subnet using EC2 Instance Connect Endpoint
- how to connect to rds instance in vpc using EC2 Instance Connect Endpoint
- how to connect to aurora rds running in a private subnet using EC2 Instance Connect Endpoint
- how to connect to aurora rds running in a vpc using EC2 Instance Connect Endpoint
- how to connect to aurora rds mysql running in a private subnet using EC2 Instance Connect Endpoint
- how to connect to aurora rds mysql running in vpc using EC2 Instance Connect Endpoint
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

Next, we create an EC2 Instance Connect Endpoint in your VPC which have the resources you would like to connect to e.g. Aurora RDS

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

## Get Private IP Address of Aurora Proxy Instance

In an Enterprise solution, typically you won't directly interact with your RDS/Aurora instance instead connect via RDS proxy as it does connection pooling and offers other benefits.

We do a `nslookup` for the proxy endpoint (either writer/reader) and get the private ip address of the instances.

e.g.

```bash
$ nslookup db-proxy.proxy-dfsf34.us-east-1.rds.amazonaws.com
Server: 10.12.3.10
Address: 10.12.3.10#12

Non-authoritative answer:
db-proxy.proxy-dfsf34.us-east-1.rds.amazonaws.com canonical name = vpce-345vjkj4g535-hjbjhfg.vpce-svc-243igsdiu77645.us-east-1.vpce.amazonaws.com.
Name: vpce-345vjkj4g535-hjbjhfg.vpce-svc-243igsdiu77645.us-east-1.vpce.amazonaws.com
Address: 10.1.12.2
Name: vpce-345vjkj4g535-hjbjhfg.vpce-svc-243igsdiu77645.us-east-1.vpce.amazonaws.com
Address: 10.1.14.3
```

We can use `10.1.12.2` to open a tunnel to the RDS proxy instance and access your DB.

## RDS Proxy Security Groups

You need to ensure your proxy security group to allow traffic from your EC2 Instance Connect Endpoint.

This can be achieved in following ways:

[1] Add the EC2 Instance Connect Endpoint security group as an Inbound rule to the RDS Proxy security group.

[2] Add VPC CIDR as an inbound rule to the RDS Proxy security group.

## OpenTunnel

Run below command to open a tunnel to your RDS proxy instance:

```bash
aws ec2-instance-connect open-tunnel --private-ip-address 10.1.12.2 --instance-connect-endpoint-id <your-instance-connect-endpoint-id> --remote-port 3306 --local-port 3306
```

| | |
|---|---|
|--private-ip-address |RDS Proxy Instance IP you got before from nslookup |
|--instance-connect-endpoint-id |EC2 Instance Connect Endpoint that you had created e.g. eice-345bjhj345 |
|--remote-port |Port varies based on the variant of your RDS/Aurora DB e.g. MySQL/PostgreSQL |
{:.table-striped}

## Connect to Aurora RDS

You will see below output once you ran OpenTunnel command:

```text
Listening for connections on port 3306
```

You can now connect to the RDS proxy instance from any tool of your choice providing the port, host, username and password details.

| | |
|---|---|
|Server Host |localhost | 
|Port |3306 | 
{:.table-striped}

<figure>
    <a href="{{ site.url }}/assets/img/2023/06/dbeaver-remote-connect.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2023/06/dbeaver-remote-connect.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2023/06/dbeaver-remote-connect.png">
            <img src="{{ site.url }}/assets/img/2023/06/dbeaver-remote-connect.png" alt="">
        </picture>
    </a>
</figure>

<figure>
    <a href="{{ site.url }}/assets/img/2023/06/dbeaver-remote-connect-success.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2023/06/dbeaver-remote-connect-success.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2023/06/dbeaver-remote-connect-success.png">
            <img src="{{ site.url }}/assets/img/2023/06/dbeaver-remote-connect-success.png" alt="">
        </picture>
    </a>
</figure>

{% include donate.html %}
{% include advertisement.html %}