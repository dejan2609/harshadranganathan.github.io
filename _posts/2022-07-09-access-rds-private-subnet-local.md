---
layout: post
title:  "Access AWS RDS DB in a Private Subnet (Local/Laptop)"
date:   2022-07-09
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
comments: true
---

## IAM

### IAM Policy

Let's create a custom managed IAM policy that provides below permissions to the EC2 instance - 

[1] `kms:Decrypt` to make use of KMS key to encrypt session data

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

### Session Manager

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
