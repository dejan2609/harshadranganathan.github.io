---
layout: post
title:  "Access AWS RDS DB in a Private Subnet - Session Manager (Local/Laptop)"
date:   2023-06-26
excerpt: "Steps to Access RDS DB running in a private subnet from your local/laptop"
tag:
- rds
- private subnet
- access rds from ec2
- access rds from bastion host
- bastion host
- use jump host to access RDS database
- access rds from outside
- aws rds access from outside
- how to access aws rds in private subnet
- how to connect to rds instance in private subnet
- how to connect to rds instance in private subnet using AWS Session Manager
comments: true
---

## Approach

We will be using AWS System Manager's port forwarding feature to connect with our RDS database running in a private subnet.

With remote port forwarding, you can now use a managed instance as a “jump host” to securely connect to an application port on remote servers, such as databases and web servers, without exposing those servers to outside network.

Corporate network can be quite restrictive in many ways -

[1] Allowing only HTTPS connections

[2] SSH/RDP ports blocked

[3] Cannot use Direct Connect, Site to Site VPN etc.

[4] Zero trust policy

We can overcome above restrictions and still remain compliant using System Manager's port forwarding approach.

Here are some of the advantages of using Session Manager - 

<figure>
    <a href="{{ site.url }}/assets/img/2022/07/session-manager-features.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2022/07/session-manager-features.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2022/07/session-manager-features.png">
            <img src="{{ site.url }}/assets/img/2022/07/session-manager-features.png" alt="">
        </picture>
    </a>
</figure>

## Architecture

<figure>
    <a href="{{ site.url }}/assets/img/2022/07/private-rds-access-local.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2022/07/private-rds-access-local.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2022/07/private-rds-access-local.png">
            <img src="{{ site.url }}/assets/img/2022/07/private-rds-access-local.png" alt="">
        </picture>
    </a>
</figure>

{% include donate.html %}
{% include advertisement.html %}

## Session Manager

Session Manager is a fully managed AWS Systems Manager capability. 

With Session Manager, you can manage your Amazon Elastic Compute Cloud (Amazon EC2) instances, edge devices, and on-premises servers and virtual machines (VMs). 

### VPC Endpoints

It's recommended to use VPC Endpoints for session manager so that the network traffic between your managed instances, Systems Manager, and Amazon EC2 is restricted to the Amazon network.

Create VPC Endpoints for the following -

Refer this guide on how to create them as it is beyond the scope of this article - <https://docs.aws.amazon.com/vpc/latest/privatelink/create-interface-endpoint.html#create-interface-endpoint>

|VPC Endpoint |Purpose |
|--|--|
|com.amazonaws.region.ssm |The endpoint for the Systems Manager service. |
|com.amazonaws.region.ssmmessages |This endpoint is required only if you're connecting to your instances through a secure data channel using Session Manager. For more information, see AWS Systems Manager Session Manager and Reference: ec2messages, ssmmessages, and other API operations. |
|com.amazonaws.region.ec2messages |Systems Manager uses this endpoint to make calls from SSM Agent to the Systems Manager service. |
|com.amazonaws.region.ec2 | If you're using Systems Manager to create VSS-enabled snapshots, you need to ensure that you have an endpoint to the EC2 service. Without the EC2 endpoint defined, a call to enumerate attached Amazon EBS volumes fails, which causes the Systems Manager command to fail. |
|com.amazonaws.region.kms |This endpoint is optional. However, it can be created if you want to use AWS Key Management Service (AWS KMS) encryption for Session Manager or Parameter Store parameters. |
|com.amazonaws.region.logs | This endpoint is optional. However, it can be created if you want to use Amazon CloudWatch Logs (CloudWatch Logs) for Session Manager, Run Command, or SSM Agent logs. |
|com.amazonaws.region.s3 |Systems Manager uses this endpoint to update SSM Agent and toperform patching operations. Systems Manager also uses this endpoint for tasks like uploading output logs you choose to store in S3 buckets, retrieving scripts or other files you store in buckets, and so on. If the security group associated with your instances restricts outbound traffic, you must add a rule to allow traffic to the prefix list for Amazon S3. |
{:.table-striped}

### Session Encryption (KMS)

KMS key encryption for sessions is accomplished using a key that is created in AWS KMS.

This ensures that the session data transmitted between your managed nodes and the local machines of users in your AWS account is encrypted using KMS key encryption.

In order to turn on KMS encryption for your session data, follow these steps - 

[1] Open the AWS Systems Manager console at <https://console.aws.amazon.com/systems-manager/>.

[2] In the navigation pane, choose `Session Manager`.

[3] Choose the `Preferences` tab, and then choose Edit.

[4] Select the check box next to `Enable KMS encryption`.

[5] Choose the KMS key alias which we had created previously.

<figure>
    <a href="{{ site.url }}/assets/img/2022/07/session-manager-preferences-kms.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2022/07/session-manager-preferences-kms.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2022/07/session-manager-preferences-kms.png">
            <img src="{{ site.url }}/assets/img/2022/07/session-manager-preferences-kms.png" alt="">
        </picture>
    </a>
</figure>

References - <https://docs.aws.amazon.com/systems-manager/latest/userguide/session-preferences-enable-encryption.html>

{% include donate.html %}
{% include advertisement.html %}

## IAM

### IAM Policy

Let's create a custom managed IAM policy that provides below permissions to the EC2 instance - 

[1] `kms:Decrypt` to make use of KMS key to encrypt session data - provide the KMS key arn which we had created earlier for encrypting the sessions

[2] `s3:GetEncryptionConfiguration` to be able to use the encryption specified in the bucket for storing session logs

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "kms:Decrypt"
            ],
            "Resource": "<kms-key-arn>"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetEncryptionConfiguration"
            ],
            "Resource": "*"
        }
    ]
}
```

### IAM Role

Create a new IAM role with EC2 as a trusted entity since we will be using this as the instance profile for the managed node.

Trusted Entity policy -

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

Attach below permissions to the IAM role -

[1] `AmazonSSMManagedInstanceCore` permission - this allows the instance to use Systems Manager service core functionality

[2] Custom managed IAM role which we had previously created

{% include donate.html %}
{% include advertisement.html %}

## EC2

Let's create an Amazon Linux 2 EC2 instance which we will be using to connect to our private RDS database.

In the `Launch Instance` template, configure as below -

|Attribute |Value |
|--|--|
|Name |Instance Name e.g. jump-box |
|OS |Amazon Linux 2 AMI | 
|Instance Type |e.g. t2.medium |
|Key Pair |Proceed without a key pair (Main reason we are using Session Manager is to remove the need for managing SSH keys) |
|VPC |Choose a suitable VPC |
|Subnet |Choose suitable zone in a private subnet (We can keep our instance secure in a private subnet without having to generate public IP, open inbound ports etc. Nice feature of Session Manager since the access is done via AWS API's managed via IAM roles ) |
|Security Group |Create a new security group and remove inbound rules as we don't need them |
|IAM Instance Profile |Add the IAM role which we had created previously that has required permissions for session manager to function |
{:.table-striped}

We are good to launch the instance now.

Wait for the status checks to pass.

### Session Manager Connect

Once the instance is `Running` state with status checks passed, click the `Connect` button after selecting the instance.

In the `Connect to instance`, select `Session Manager` tab.

If all the permissions look good, you should be able to click the `Connect` button again.

It will open a new window and launch session manager. If there are any runtime issues, it will have show up here and you need to fix your IAM permissions.

If everything goes well, you should see your shell.

<figure>
    <a href="{{ site.url }}/assets/img/2022/07/session-manager-shell.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2022/07/session-manager-shell.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2022/07/session-manager-shell.png">
            <img src="{{ site.url }}/assets/img/2022/07/session-manager-shell.png" alt="">
        </picture>
    </a>
</figure>

### SSM Agent

We will be using `Port forwarding to remote hosts` approach available in AWS Systems Manager.

This requires SSM agent version to be `3.1.1374` or higher.

So, let's update the SSM Agent to the latest one by running below command in the Session Manager shell (if you're already on the latest version then you can skip this step)

```bash
sudo yum install -y https://s3.amazonaws.com/ec2-downloads-windows/SSMAgent/latest/linux_amd64/amazon-ssm-agent.rpm

# check the SSM Agent version number post install
yum info amazon-ssm-agent
```

{% include donate.html %}
{% include advertisement.html %}


## Session Manager Plugin (CLI)

If you want to use the AWS Command Line Interface (AWS CLI) to start and end sessions that connect you to your managed nodes, you must first install the Session Manager plugin on your local machine. 

Example, for installing the plugin in Mac below are the commands -

```bash
curl "https://s3.amazonaws.com/session-manager-downloads/plugin/latest/mac/session-manager-plugin.pkg" -o "session-manager-plugin.pkg"

sudo installer -pkg session-manager-plugin.pkg -target /
sudo ln -s /usr/local/sessionmanagerplugin/bin/session-manager-plugin /usr/local/bin/session-manager-plugin
```

To verify that the plugin installed successfully, run below -

```
session-manager-plugin
```

The following message is returned.

```
The Session Manager plugin is installed successfully. Use the AWS CLI to start a session.
```

Reference - <https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-install-plugin.html>

## SSM Port Forwarding Session To Remote Host

Now it's time to connect to our RDS instance running in our private subnet via our managed EC2 instance which is also running in a private subnet.

Get below details for command execution -

[1] Instance ID of the managed EC2 which we created

[2] RDS DNS HostName

[3] RDS port

```bash
aws ssm start-session
--target <instance-id>
--document-name AWS-StartPortForwardingSessionToRemoteHost
--parameters '{"host":["<rds-url>"],"portNumber":["<rds-port>"], "localPortNumber":["<local-port>"]}'
```

Sample Output:

```bash
aws ssm start-session
--target i-xxx
--document-name AWS-StartPortForwardingSessionToRemoteHost
--parameters '{"host":["xxx.us-east-1.rds.amazonaws.com"],"portNumber":["5432"], "localPortNumber":["5432"]}'

Starting session with SessionId: xxx
Port 5432 opened for sessionId
Waiting for connections...
```

That's all, you have a local port forwarding the connections to your RDS in private subnet.

{% include donate.html %}
{% include advertisement.html %}

## DB GUI Connection

Use your favorite DB tools to connect to your database as shown below:

<figure>
    <a href="{{ site.url }}/assets/img/2022/07/dbeaver-postgresql-local-connection.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2022/07/dbeaver-postgresql-local-connection.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2022/07/dbeaver-postgresql-local-connection.png">
            <img src="{{ site.url }}/assets/img/2022/07/dbeaver-postgresql-local-connection.png" alt="">
        </picture>
    </a>
</figure>

{% include donate.html %}
{% include advertisement.html %}
