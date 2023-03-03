---
layout: post
title: "AWS Cost Optimization - S3"
date: 2023-03-03
excerpt: "Ways to reduce your S3 storage costs"
tag:
    - s3 intelligent-tiering
    - s3 storage classes
    - s3 optimization
    - aws cost optimization
    - reduce s3 cost
    - reduce storage costs aws
    - s3 cost optimization
comments: true
---

## Introduction

We will be looking at ways to reduce your S3 bill by addressing inefficient default practices. 


### S3 Intelligent Tiering

When you have many buckets being shared across teams/projects, as a platform team it will be difficult to come up with lifecycle policies because you will have to interact with various teams for understanding the data access patterns. Sometimes, depending on what stage the project is, even the teams themselves may not have answers for the access patterns.

S3 Intelligent Tiering gives you a hand by doing it's magic where for a small fee it will understand the access patterns and take the decisions for you by moving the objects across the different tiers thereby reducing your storage cost with little to no impact depending on your rules.

Below is a summary of access tiers supported by S3 Intelligent Tiering, transition rules, performance, impacts of enabling them and projected cost savings.

<figure>
    <a href="{{ site.url }}/assets/img/2023/03/s3-intelligent-tiering-access-tiers.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2023/03/s3-intelligent-tiering-access-tiers.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2023/03/s3-intelligent-tiering-access-tiers.png">
            <img src="{{ site.url }}/assets/img/2023/03/s3-intelligent-tiering-access-tiers.png" alt="">
        </picture>
    </a>
</figure>

Transitions up to Archive Instant Access tier is automatic while the archive options need to be enabled explicitly in Intelligent Tiering.

So, based on the above table, the first thing you can do with zero impact is by adding a lifecycle rule to enable objects to be moved to intelligent tiering so that they are automatically transitioned to lower access tiers that reduce your cost while giving the same low latency/high throughput performance.


<figure>
    <a href="{{ site.url }}/assets/img/2023/03/s3-intelligent-tiering-access-tiers-transition-flow.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2023/03/s3-intelligent-tiering-access-tiers-transition-flow.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2023/03/s3-intelligent-tiering-access-tiers-transition-flow.png">
            <img src="{{ site.url }}/assets/img/2023/03/s3-intelligent-tiering-access-tiers-transition-flow.png" alt="">
        </picture>
    </a>
</figure>

As shown above, all objects are in frequent access tier by default. Any objects not accessed for 30 consecutive days are automatically transitioned to Infrequent access tier.

Likewise, if they continue to remain not accessed for 90 consecutive days, they are transitioned to Archive Instant Access tier.

All of these access tiers provide the same low latency and high throughput but the lower access tiers save you costs when the objects aren't frequently accessed. Also, Intelligent Tiering automatically moves the objects to Frequent Access Tier if it becomes accessed more often after it moved to other access tiers.

Objects last accessed date is determined as follows - Downloading or copying an object through AWS management console or running GetObject or CopyObject operations will initiate an access

Caveats:

- Objects which are less than 128 KB in size are not monitored and aren't eligible for intelligent tiering

{% include donate.html %}
{% include advertisement.html %}

#### Lifecycle Rules

To enable this for your bucket, follow below steps:

- Create a new lifecycle rule, and enable that for all objects in your bucket. Also, for actions enable "Moving objects between storage classes" for both current and noncurrent versions.

<figure>
    <a href="{{ site.url }}/assets/img/2023/03/s3-intelligent-tiering-lifecycle-rule-1.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2023/03/s3-intelligent-tiering-lifecycle-rule-1.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2023/03/s3-intelligent-tiering-lifecycle-rule-1.png">
            <img src="{{ site.url }}/assets/img/2023/03/s3-intelligent-tiering-lifecycle-rule-1.png" alt="">
        </picture>
    </a>
</figure>

- Set transition to 'Intelligent-Tiering' for both current and non-current object versions. We would like to leverage intelligent tiering as a defacto option, so you set the "Days after object creation" to 0 so that they are moved faster to Intelligent Tiering class.

- Same for non-current object versions as well and we want all non-cuurent versions including latest to be managed by Intelligent Tiering so we don't set any values for "Number of newer versions to retain" option.

<figure>
    <a href="{{ site.url }}/assets/img/2023/03/s3-intelligent-tiering-lifecycle-rule-2.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2023/03/s3-intelligent-tiering-lifecycle-rule-2.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2023/03/s3-intelligent-tiering-lifecycle-rule-2.png">
            <img src="{{ site.url }}/assets/img/2023/03/s3-intelligent-tiering-lifecycle-rule-2.png" alt="">
        </picture>
    </a>
</figure>

This is how your lifecycle rule will look like -

<figure>
    <a href="{{ site.url }}/assets/img/2023/03/s3-intelligent-tiering-lifecycle-rule-3.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2023/03/s3-intelligent-tiering-lifecycle-rule-3.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2023/03/s3-intelligent-tiering-lifecycle-rule-3.png">
            <img src="{{ site.url }}/assets/img/2023/03/s3-intelligent-tiering-lifecycle-rule-3.png" alt="">
        </picture>
    </a>
</figure>

After applying above lifecycle rule, your objects are managed by intelligent tiering and you start to reap the benefits by not paying the same price for objects sitting idle in your bucket.

{% include donate.html %}
{% include advertisement.html %}

#### Archival Configurations

Next, you can further save costs by enabling archive options but check with your stakeholders before enabling them as these may cause workload impacts.

<figure>
    <a href="{{ site.url }}/assets/img/2023/03/s3-intelligent-tiering-access-tiers-transition-flow-archive-features.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2023/03/s3-intelligent-tiering-access-tiers-transition-flow-archive-features.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2023/03/s3-intelligent-tiering-access-tiers-transition-flow-archive-features.png">
            <img src="{{ site.url }}/assets/img/2023/03/s3-intelligent-tiering-access-tiers-transition-flow-archive-features.png" alt="">
        </picture>
    </a>
</figure>

You enable these in the bucket properties under 'Intelligent-Tiering Archive configurations'. Note that this only applies to objects in Intelligent Tier storage class.

So, you need to first move objects to Intelligent Storage class for archival options to apply. This may be confusing for newbies as the settings are split between lifecycle rules and intelligent tiering configurations.

<figure>
    <a href="{{ site.url }}/assets/img/2023/03/s3-intelligent-tiering-archival-configurations.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2023/03/s3-intelligent-tiering-archival-configurations.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2023/03/s3-intelligent-tiering-archival-configurations.png">
            <img src="{{ site.url }}/assets/img/2023/03/s3-intelligent-tiering-archival-configurations.png" alt="">
        </picture>
    </a>
</figure>

{% include donate.html %}
{% include advertisement.html %}
