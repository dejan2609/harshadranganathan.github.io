---
layout: post
title: "AWS Cost Optimization - Cost Intelligence Dashboards"
date: 2023-05-11
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

<figure>
    <a href="{{ site.url }}/assets/img/2023/05/cudos-dashboard-overview.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2023/05/cudos-dashboard-overview.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2023/05/cudos-dashboard-overview.png">
            <img src="{{ site.url }}/assets/img/2023/05/cudos-dashboard-overview.png" alt="">
        </picture>
    </a>
</figure>

There are multiple approaches to set up the Cost Intelligence Framework such as:

- Cloudformation template

- Combination of CLI, CF and Manual Steps

- Manual Steps


We'll be focusing on the second approach in this article as that gives more flexibility compared to using a full fledged CF template as each organization might follow different practices/account setups/might want to re-use existing configurations (buckets etc.) so you don't have to fiddle with CF templates.

CF templates on other hand help for easier (if it works for your set-up) and cleaner deletion, however some of the resources set up by this framework might still be needed for different use-cases so it makes sense to create/re-use existing resources.

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

## Deploy CUDOS Dashboard

You can deploy the dashboards either using CF template or through CLI.

If you prefer to use CF template, then create the stack using this template [Cloud Intelligence Dashboards Template](https://console.aws.amazon.com/cloudformation/home#/stacks/create/review?&templateURL=https://aws-managed-cost-intelligence-dashboards.s3.amazonaws.com/cfn/cid-cfn.yml&stackName=Cloud-Intelligence-Dashboards&param_DeployCUDOSDashboard=yes&param_DeployKPIDashboard=yes&param_DeployCostIntelligenceDashboard=yes)

Alternatively, open cloud-shell and run below commands:

```bash
python3 -m ensurepip --upgrade

pip3 install --upgrade cid-cmd

cid-cmd deploy
```

CLI command will now ask for some inputs to deploy the Quicksight dashboards.

```bash
Latest template: arn:aws:quicksight:us-east-1:xxxxx:template/cudos_dashboard_v3/version/191
Dashboard "cudos" is not deployed
Required datasets:
summary_view
ec2_running_cost
compute_savings_plan_eligible_spend
s3_view
customer_all
Looking by DataSetId defined in template...complete
There are still 5 datasets missing: compute_savings_plan_eligible_spend, customer_all, ec2_running_cost, s3_view, summary_view
Creating dataset: compute_savings_plan_eligible_spend
```

Select the Athena database which was created by Glue earlier:

```bash
? [athena-database] Select AWS Athena database to use: athenacurcfn_c_u_r_comprehensive
Detected views:
Missing views: compute_savings_plan_eligible_spend
Checking if CUR is enabled and available...
Athena table: cur_comprehensive
Resource IDs: yes
SavingsPlans: yes
Reserved Instances: yes
```

It will now create the views in Athena based on the CUR database tables.

```bash
Dataset "compute_savings_plan_eligible_spend" created
Creating dataset: customer_all
Detected views: cur_comprehensive
Dataset "customer_all" created
Creating dataset: ec2_running_cost
Detected views:
Missing views: ec2_running_cost
Dataset "ec2_running_cost" created
Creating dataset: s3_view
Detected views:
Missing views: account_map, s3_view
```

We will choose dummy for the CUR account data mapping for the time being.

```bash
Creating account_map...
autodiscovering...account metadata not detected
? [account-map-source] Please select account metadata collection method: Dummy (CUR account data, no names)
Notice: Dummy account mapping will be created
creating view...done
Dataset "s3_view" created
```

If everything is successful, cudos dashboard will be created.

```bash
Creating dataset: summary_view
Detected views:
Missing views: ri_sp_mapping, summary_view
Dataset "summary_view" created
Using dataset summary_view: d01a936f-2b8f-49dd-8f95-d9c7130c5e46
Using dataset ec2_running_cost: 9497cc49-c9b1-4dcd-8bcc-c16396898f29
Using dataset compute_savings_plan_eligible_spend: 3fa0d804-9bf5-4a20-a61d-4bdbb6d543b1
Using dataset s3_view: 826896be-4d0f-4f90-832f-3427f5444016
Using dataset customer_all: 595c66b7-08b6-46ad-87ed-b74fe34dd333
Deploying dashboard cudos
```

{% include donate.html %}
{% include advertisement.html %}

## View CUDOS Dashboard

Go to Quicksight and you can see the deployed CUDOS dashboard.

<figure>
    <a href="{{ site.url }}/assets/img/2023/03/quicksight-dashboards-view.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2023/03/quicksight-dashboards-view.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2023/03/quicksight-dashboards-view.png">
            <img src="{{ site.url }}/assets/img/2023/03/quicksight-dashboards-view.png" alt="">
        </picture>
    </a>
</figure>

Open the CUDOS dashboard and you will see many views, for example, in `Optics Explorer` view you can see the Top 10 resources with the Resource ARNs and categorized by the services.

In Cost Explorer, you can view either the cost at service level or list the resources by cost allocation tags but for leadership it's not quite apparent what resources are costing more money and which AWS services they belong to as the Cost Explorer is very limited in nature on what you can show.

This is where the CUDOS dashboard helps to give a more customized view for the business and leaders using the comprehensive CUR data.

<figure>
    <a href="{{ site.url }}/assets/img/2023/03/quicksight-cudos-dashboard.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2023/03/quicksight-cudos-dashboard.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2023/03/quicksight-cudos-dashboard.png">
            <img src="{{ site.url }}/assets/img/2023/03/quicksight-cudos-dashboard.png" alt="">
        </picture>
    </a>
</figure>

Finally, make sure you share your dashboard for everyone/specific people in your account to view otherwise the dashboard won't be visible for them in the listing.

This can be done by clicking the share icon on the top right of the dashboard.

<figure>
    <a href="{{ site.url }}/assets/img/2023/03/quicksight-dashboard-share.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2023/03/quicksight-dashboard-share.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2023/03/quicksight-dashboard-share.png">
            <img src="{{ site.url }}/assets/img/2023/03/quicksight-dashboard-share.png" alt="">
        </picture>
    </a>
</figure>

{% include donate.html %}
{% include advertisement.html %}
