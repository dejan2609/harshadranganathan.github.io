---
layout: post
title: "AWS Certified Developer - Associate Exam Study Notes"
date: 2020-01-04
excerpt: "Notes for AWS Certified Developer - Associate Exam"
tag:
    - aws certified developer associate 2020
    - aws developer associate certification
    - aws certified developer associate guide
    - aws certified developer associate guide 2020
    - aws developer associate notes
    - aws developer training
    - aws certification
    - aws certification for java developers
    - aws certified developer associate study notes
    - aws certified developer associate exam notes
    - aws certified developer associate exam guide
    - aws certified developer associate study guide
    - aws certified developer associate study material
comments: true
---

## EC2

### SSH: Unprotected Private Key File

Your private key file must be protected from read and write operations from any other users. If your private key can be read or written to by anyone but you, then SSH ignores your key and returns error message "UNPROTECTED PRIVATE KEY FILE!".

To fix the error, execute the following command, substituting the path for your private key file.

```bash
[ec2-user ~]$ chmod 0400 .ssh/my_private_key.pem
```

### Instance Connect

-   To connect using the Amazon EC2 console, the instance must have a `public IP address`.

-   If the instance has only `private IP address`, then you have to connect using Instance Connect CLI.

-   Instance Connect CLI generates a one-time-use SSH public key, pushes the key to the instance where it remains for 60 seconds, and connects the user to the instance.

-   Linux distributions supported - Amazon Linux 2 (or) Ubuntu 16.04 or later.

### Instances

-   _Burstable Performance Instances_ -

    Are designed to provide a baseline level of CPU performance with the ability to burst to a higher level when required by your workload.

    Examples include microservices, low-latency interactive applications, small and medium databases.

    Burstable performance instances are the only instance types that use credits for CPU usage.

-   _Unlimited Mode for Burstable Performance Instances_ -

    A burstable performance instance configured as unlimited can sustain high CPU performance for any period of time whenever required.

    If the instance runs at higher CPU utilization for a prolonged period, it can do so for a flat additional rate per vCPU-hour.

### Instance Metadata

-   Instance metadata is data about your instance that you can use to configure or manage the running instance.

-   You can access the local IP address of your instance from instance metadata to manage a connection to an external application.

-   It is available at URI - `http://169.254.169.254/latest/meta-data/`

-   The IP address 169.254.169.254 is a link-local address and is valid only from the instance.

### AMI

-   AMI are `restricted to a region`. i.e. A AMI in eu-west-1 is not available in eu-central-1.

### Security Groups

-   Security groups are `restricted to a region`. i.e. A security group in eu-west-1 is not available in eu-central-1.

### EBS

-   EBS volumes are highly available and reliable storage volumes that can be attached to any running instance that is in the `same Availability Zone`.

Process to modify size, performance, and volume type of your Amazon EBS volumes without detaching them:

1. Create a snapshot of the volume in case you need to roll back your changes.

2. Request the volume modification via console or cli.

3. Monitor the progress.

4. If the size of the volume was modified, extend the volume's file system.

Process to encrypt an existing unencrypted volume:

1. Create a snapshot of the volume.

2. Copy the snapshot by setting the `Encrypted` parameter and, optionally, the `KmsKeyId` parameter.

3. Resulting snapshot is encrypted.

4. Create a new volume from the encrypted snapshot. Resulting volume is encrypted.

### Billing

-   When you stop an instance, we shut it down. We don't charge usage for a stopped instance, or data transfer fees.

{% include donate.html %}
{% include advertisement.html %}

## S3

<!-- prettier-ignore-start -->

|                                                    |             |
| -------------------------------------------------- | ----------- |
| Maximum object size                                | 5 TB        |
| Maximum object size supported by PUT operation     | 5 GB        |
| Multipart upload mandatory for objects of size     | 5 GB - 5 TB |
| Size above which multipart uploads are recommended | 100 MB      |
{:.table-striped}

<!-- prettier-ignore-end -->

Advantages of multipart upload:

-   Improved throughput
-   Quick recovery from any network issues
-   Pause and resume object uploads
-   Begin an upload before you know the final object size

## Lambda

<!-- prettier-ignore-start -->

|                            |                                                                           |
| -------------------------- | ------------------------------------------------------------------------- |
| /tmp directory storage     | 512 MB                                                                    |
| Concurrent executions      | 1,000                                                                     |
| Function timeout           | 15 minutes                                                                |
| Deployment package size    | 50 MB (zipped, for direct upload)<br/>250 MB (unzipped, including layers) |
| Environment variables size | 4 KB                                                                      |
{:.table-striped}

<!-- prettier-ignore-end -->

{% include donate.html %}
{% include advertisement.html %}

## DynamoDB

## SQS

## KMS

-   KMS can be used to decrypt/encrypt up to `4KB of data`.

<!-- prettier-ignore-start -->

|                          |                                                                                                                                                                                                                            |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AWS managed CMK          | You cannot manage key rotation for AWS managed CMKs. <br/>AWS KMS automatically rotates AWS managed CMKs every three years.                                                                                                   |
| Customer aws managed CMK | Automatic key rotation is disabled by default on customer managed CMKs. <br/>When you enable (or re-enable) key rotation, AWS KMS automatically rotates the CMK 365 days after the enable date and every 365 days thereafter. |
{:.table-striped}

<!-- prettier-ignore-end -->

### Envelope Encryption

If you need to encrypt more than 4 KB of data ,then you have to encrypt data locally in your application making use of envelope encryption.

1. Use the `GenerateDataKey` operation to get a data encryption key.

2. Use the plaintext data key (returned in the Plaintext field of the response) to encrypt data locally, then erase the plaintext data key from memory.

3. Store the encrypted data key (returned in the CiphertextBlob field of the response) alongside the locally encrypted data.

## IAM

### Policy Evaluation Logic

-   By default, all requests are implicitly denied.

-   An explicit deny in any policy overrides any allows and the final decision will be `deny`.

-   Organizations service control policies, Resource-based policies, IAM permissions boundaries, Session policies, Identity-based policies are then evaluated to determine whether to allow or deny the requests. If there are no statements that allow the requested action then the final decision will be `deny`.

## Kinesis

{% include donate.html %}
{% include advertisement.html %}

## API Gateway

### Lambda Authorizers for API

-   A Lambda authorizer (formerly known as a custom authorizer) is an API Gateway feature that uses a Lambda function to control access to your API.

-   A Lambda authorizer is useful if you want to implement a `custom authorization scheme` that uses a bearer token authentication strategy such as OAuth or SAML, or that uses request parameters to determine the caller's identity.

### IAM authentication for API

To enable IAM authentication for your API:

1. Under Settings, for Authorization, choose `AWS_IAM`.

2. Grant API authorization to a group of IAM users i.e. add users to an IAM group and attach policies with required permissions to the group.

3. Authenticate requests that are sent to API Gateway using `Signature Version 4` signing process.

### Caching

-   To invalidate API gateway cache entry and reload it from the integration endpoint, the client must send a request that contains `Cache-Control: max-age=0` header

<!-- prettier-ignore-start -->

|                                   |                   |
| --------------------------------- | ----------------- |
| Default TTL value for API caching | 300 seconds       |
| Maximum TTL value for API caching | 3600 seconds      |
| Supported Cache size              | 0.5GB up to 237GB |
{:.table-striped}

<!-- prettier-ignore-end -->

## Cloudwatch

## Cloudformation

## Cognito

<!-- prettier-ignore-start -->

|                                               |                                                                                                                                                                                                                                                                   |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cognito User Pool                             | User pools are for authentication (identify verification). <br/>User Pools provide a user directory for your application like sign-up, sign-in, group management, etc. (or) use identity providers, such as Facebook or Google.                                                                                                   |
| Cognito Federated Identities or Identity Pool | Identity pools are for authorization (access control).<br/>With a federated identity, you can obtain temporary, limited-privilege AWS credentials to securely access other AWS services such as Amazon DynamoDB, Amazon S3, and Amazon API Gateway. <br/>Identity Pools map a user from an Identity Provider to an IAM role. |
{:.table-striped}

<!-- prettier-ignore-end -->

## X-RAY

## Step Functions

-   Maximum execution time -> `1 year`

{% include donate.html %}
{% include advertisement.html %}

## SAM

-   The AWS Serverless Application Model (SAM) is an open-source framework for building serverless applications.

-   You use the AWS SAM specification to define your serverless application.

-   The declaration `Transform: AWS::Serverless-2016-10-31` is required for AWS SAM templates.

-   `Resources` section is required for AWS SAM templates.

-   Some of the supported SAM resource and property types - `AWS::Serverless::Api, AWS::Serverless::Function, AWS::Serverless::SimpleTable`.

-   After you develop and test your serverless application locally, you can deploy your application by using the `sam package` and `sam deploy` commands.

-   sam package and sam deploy commands described in this section are identical to their AWS CLI equivalent commands `aws cloudformation package` and `aws cloudformation deploy`, respectively.

## CodeCommit

## CodeBuild

## CodeDeploy

## CodePipeline

## CodeStar

{% include donate.html %}
{% include advertisement.html %}

## References

<https://docs.aws.amazon.com/>
