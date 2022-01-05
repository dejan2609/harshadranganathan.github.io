---
layout: post
title: "ECR Best Practices"
date: 2022-01-05
excerpt: "AWS ECR Best Practices Guide"
tag:
- ecr lifecycle policy
- aws ecr security best practices
- ecr versioning
- ecr repository
- ecr
comments: true
---

## Namespaces

Namespaces are a way to group similar repositories together.

It also helps to scope IAM policies in a way that you can restrict pods running in a certain cluster/namespace to be able to pull images only from specific namespaced repositories.

### Guidance

Group repositories by using Team/Project names as namespace -

e.g. team-blue/\<repository_name\>

monitoring/\<repository_name\>

## Image Scanning

Amazon ECR Image Scanning helps in identifying software vulnerabilities in your container images.

It is free of cost.

You can scan on-demand or on image push.

### Guidance

Enable scanning as we can leverage below capabilities:

[1] Get event notifications on critical vulnerabilities in images

[2] Set up periodic scans

[3] Reject images having critical vulnerabilities from being pulled in EKS

Note: If you are already performing any image scans as part of your CI/CD e.g. twistlock, contrast etc. discuss with your team to see what suits best - maybe both

{% include donate.html %}
{% include advertisement.html %}

## Lifecycle Policies

Allows the automation of cleaning up unused images, for example, expiring images based on age or count.

You can have multiple lifecycle policy rules with priority.

### Guidance

Agree with teams on what suits best.

ECR lifecycle policy rules has some limitations 

e.g.

- Only one rule is allowed to select untagged images.

- tagPrefixList is mandatory for tagged images.

- tagPrefixList uses AND logic and not OR

Sample policy you could go with -

Untagged images -> delete after 7 days

Tagged images -> Up to 10 recent images to be maintained

```json
{
  "rules": [
    {
      "rulePriority": 1,
      "description": "Untagged images policy",
      "selection": {
        "tagStatus": "untagged",
        "countType": "sinceImagePushed",
        "countUnit": "days",
        "countNumber": 7
      },
      "action": {
        "type": "expire"
      }
    },
    {
      "rulePriority": 2,
      "description": "Any image policy",
      "selection": {
        "tagStatus": "any",
        "countType": "imageCountMoreThan",
        "countNumber": 10
      },
      "action": {
        "type": "expire"
      }
    }
  ]
}
```

Lifecycle policy works as follows - if any image fits rule 1 then rule 2 will be ignored. So, if any team frequently pushes untagged images only rule 1 applies and this won't remove any tagged images to maintain the count as per rule 2.

Also, teams may follow different tagging conventions e.g. SemVer, commit hash etc. so we can't configure the lifecycle policy with pre-determined values. Hence, we use the `any` policy.

## Image Tagging

There are different tagging approaches

- Git Commit Hash
- Semantic Version
- Date Timestamp
- Digest
- Build id
- Environment name e.g. alpha/stage/prod
- Stable tags e.g. latest
- Untagged images

### Guidance

There are pros/cons for each approach.

Follow elimination strategy and discuss with your team to see what suits best.

e.g. Using a build id won't be helpful if you aren't maintaining all the build details/logs

{% include donate.html %}
{% include advertisement.html %}

## Tag Immutability

You can configure your repository to be immutable to prevent image tags from being overwritten.

This can thwart an attacker from overwriting an image with a malicious version without changing the image tags.

Additionally, it gives you a way to easily and uniquely identify an image.

### Guidance

Tag immutability will mean that all your images have unique tags otherwise the image push will fail.

Some teams may feel this is an overhead when they do frequent deployments to test directly in the cluster while others might feel security is more important.

Discuss with your team and see what's best.

## CI/CD

Consider you have different AWS accounts for each of your stages e.g. alpha, stage, prod etc.

Do you use a centralized ECR or have images in each account?

Depending on your organization policies, using an ECR in a centralized account may not be possible.

### Option 1

Have your images in one account and provide access for other accounts to pull the image

e.g. Allow your production account to be able to pull images from your non-prod account

Pros:

- Reduced Cost

Cons:

- ECR doesn't have global policy settings - you will have to give cross account permission for each repository

{% include donate.html %}
{% include advertisement.html %}

### Option 2

Cross account replication of ECR images

Pros:

- Simple setup - no cross account access required

Cons:

- Image duplication

- Minor cost addition - $0.10 per GB-month

- No control over the images being replicated i.e. all the images (untagged/tagged) will be replicated in your prod account

### Option 3

Tag and push images using a promotion flow in your CI/CD for each account when needed

Pros:

- Control over what images get pushed e.g. push only production certified images to production account

Cons:

- Additional build time for promotion - in your CI/CD you will have to pull and push images from lower account ECR to higher account ECR

{% include donate.html %}
{% include advertisement.html %}