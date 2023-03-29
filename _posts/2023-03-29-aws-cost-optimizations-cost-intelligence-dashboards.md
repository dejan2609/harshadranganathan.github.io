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

CF templates on other hand help for easier and cleaner deletion although some of the resources set up by this framework might still be needed for different usecases so it makes sense to create/re-use existing resources based on your needs.

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