---
layout: post
title: "AWS Cost Optimization - Cost Intelligence Dashboards"
date: 2023-03-29
excerpt: "Cost Intelligence Dashboards that can be leveraged by Executives, CFOs to understand AWS bills with custom cost reports tailored for your organization"
tag:
    - aws cost intelligence dashboard
    - aws cudos dashboard
    - aws quicksight cost dashboards
    - aws kpi dashboard
    - aws cost dashboard
comments: true
---

## Introduction

Cost Intelligence Dashboard is a framework to show comprehensive cost report of your AWS bills on top of a customized Quicksight dashboard which can be leveraged by Executives, directors, and other individuals within the CIO or CTO line of business or who manage DevOps and IT organizations to answer various questions such as:

- Use the built-in tag explorer to group and filter cost and usage by your tags

- How much we're spending per hour on AWS Lambda?

- Savings Plans coverage

- Percentage of Spot vs. On Demand

- Track KPIs

and many more.

There are multiple approaches to set up the Cost Intelligence Framework such as:

- Cloudformation template

- Combination of CLI and Manual Steps

- Manual Steps


We'll be focusing on the second approach in this article as that gives more flexibility compared to using a CF template as each organization might follow different practices/account setups/might want to re-use existing configurations (buckets etc.) so you don't have to fiddle with CF templates.

CF templates on other hand help for easier (if it works for your set-up) and cleaner deletion, some of the resources set up by this framework might still be needed for different usecases so it makes sense to create/re-use existing resources.

{% include donate.html %}
{% include advertisement.html %}

## Configure CUR

First step is to configure CUR (Cost and Usage Reports).

CUR provides a comprehensive set of cost and usage data that break down costs by the hour, day and also tag with resource IDs.

To generate CUR reports, go to `Billing` and then to `Cost & usage reports`.

Make sure to select `Include resource IDs` which is needed for the dashboards to work properly.

<figure>
    <a href="{{ site.url }}/assets/img/2023/03/cur-report-name.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2023/03/cur-report-name.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2023/03/cur-report-name.png">
            <img src="{{ site.url }}/assets/img/2023/03/cur-report-name.png" alt="">
        </picture>
    </a>
</figure>

In report delivery options, create/use an existing S3 bucket for delivering the reports.

Choose `Hourly` for data time granularity and `Overwrite existing report`.

For Report data integration, choose `Amazon Athena` which will automatically switch to `Parquet` for file format.

<figure>
    <a href="{{ site.url }}/assets/img/2023/03/cur-report-delivery.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2023/03/cur-report-delivery.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2023/03/cur-report-delivery.png">
            <img src="{{ site.url }}/assets/img/2023/03/cur-report-delivery.png" alt="">
        </picture>
    </a>
</figure>

After you create your report, it can take up to 24 hours for AWS to deliver the first report to your Amazon S3 bucket as shown below.

<figure>
    <a href="{{ site.url }}/assets/img/2023/03/cur-report-s3.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2023/03/cur-report-s3.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2023/03/cur-report-s3.png">
            <img src="{{ site.url }}/assets/img/2023/03/cur-report-s3.png" alt="">
        </picture>
    </a>
</figure>

Also, raise a support ticket in `Service=Billing` and `category=Invoices and Reporting`, requesting a backfill of your CUR (name=cid) with 12 months of data as that will help to show cost reports with historic and last 30 days data.

{% include donate.html %}
{% include advertisement.html %}

## Configure Athena

If this is the first time you will be using Athena, then you need to configure an S3 bucket for storing the query results before you can start to make use of Athena service.

Otherwise, please skip this section.

Navigate to Athena service and configure the query result location in S3 as shown in the prompt below:

<figure>
    <a href="{{ site.url }}/assets/img/2023/03/athena-s3-query-results-location.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2023/03/athena-s3-query-results-location.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2023/03/athena-s3-query-results-location.png">
            <img src="{{ site.url }}/assets/img/2023/03/athena-s3-query-results-location.png" alt="">
        </picture>
    </a>
</figure>

Also, navigate to `Workgroups` and configure `Query result location` for your `primary` workgroup which will be used by Quicksight later.

## CUR & Athena Integration

In step 1, when we had specified `Amazon Athena` as the `Report data integration` the CUR extract would automatically generate `crawler-cfn.yml` file in your CUR S3 bucket.

This CF template file can be used load the CUR data to Athena for querying purposes.

<figure>
    <a href="{{ site.url }}/assets/img/2023/03/cur-crawler-cfn.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2023/03/cur-crawler-cfn.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2023/03/cur-crawler-cfn.png">
            <img src="{{ site.url }}/assets/img/2023/03/cur-crawler-cfn.png" alt="">
        </picture>
    </a>
</figure>

Upload `crawler-cfn.yml` to CloudFormation service and create the stack resources.

This creates the following services:

- S3 event notification for the CUR S3 bucket
- Lambda service which kickstarts Glue crawler whenever new CUR data is available
- IAM roles with needed permissions
- Glue database
- Glue crawler to load the data to Athena

Below you can see the CUR crawler lambda function which listens for events from your CUR S3 bucket.

<figure>
    <a href="{{ site.url }}/assets/img/2023/03/cur-crawler-lambda.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2023/03/cur-crawler-lambda.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2023/03/cur-crawler-lambda.png">
            <img src="{{ site.url }}/assets/img/2023/03/cur-crawler-lambda.png" alt="">
        </picture>
    </a>
</figure>

In Glue, you will see a crawler which will be invoked by above lambda and loads the data to Athena.

<figure>
    <a href="{{ site.url }}/assets/img/2023/03/cur-glue-crawler.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2023/03/cur-glue-crawler.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2023/03/cur-glue-crawler.png">
            <img src="{{ site.url }}/assets/img/2023/03/cur-glue-crawler.png" alt="">
        </picture>
    </a>
</figure>

Once your CUR extract is available in S3, the glue crawler loads the data and it will be available for query in Athena.

You can see below the Athena data source, database and the tables.

<figure>
    <a href="{{ site.url }}/assets/img/2023/03/cur-athena-data.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2023/03/cur-athena-data.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2023/03/cur-athena-data.png">
            <img src="{{ site.url }}/assets/img/2023/03/cur-athena-data.png" alt="">
        </picture>
    </a>
</figure>

{% include donate.html %}
{% include advertisement.html %}

## Enable Quicksight

If you haven't used Quicksight before in your account, you need to sign-up for Quicksight first.

Please check for Quicksight pricing and Sign up for Quicksight by navigating to the `Quicksight` service.

As part of the sign-up process, enable `Quicksight to auto-discover your Amazon S3 buckets` option. (Note: This can be done at a later stage as well by navigating to `Security & permissions` section in Quicksight)

Choose two S3 buckets in the integration:

- CUR S3 bucket

- Athena Query Results bucket

Make sure to enable `Write permission for Athena Workgroup` option for the S3 bucket.

<figure>
    <a href="{{ site.url }}/assets/img/2023/03/quicksight-s3-integration.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2023/03/quicksight-s3-integration.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2023/03/quicksight-s3-integration.png">
            <img src="{{ site.url }}/assets/img/2023/03/quicksight-s3-integration.png" alt="">
        </picture>
    </a>
</figure>

{% include donate.html %}
{% include advertisement.html %}