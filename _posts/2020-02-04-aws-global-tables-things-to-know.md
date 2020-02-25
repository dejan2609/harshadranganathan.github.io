---
layout: post
title: "AWS Global Tables - Things To Know"
date: 2020-02-23
excerpt: "Replicate your DynamoDB table in multiple AWS regions"
tag:
    - aws global tables
    - dynamodb global table replication latency
    - dynamodb global tables consistency
    - dynamodb global tables pricing
    - dynamodb on demand pricing
    - aws global tables dynamodb
    - aws dynamodb global tables
    - aws dynamodb global tables regions
comments: true
---

This guide is primarily for Global Table 2019 version although some content might overlap for 2017 version.

## Conditions

Below conditions must be satisfied to create a global table from an existing table and replicate it in other regions.

-   The table must have the same primary key as all of the other replicas.

-   The table must have the same name as all of the other replicas.

-   The table must have DynamoDB Streams enabled, with the stream containing both the new and the old images of the item.

-   None of the replica tables in the global table can contain any data.

## Best Practices & Recommendations

-   Write capacity settings should be set consistently across your replica tables and secondary indexes.

-   If you prefer to manage write capacity settings manually, you should provision equal replicated write capacity units to your replica tables.

-   When using the latest version of global tables, you must either use on-demand capacity or enable autoscaling on the table.

-   DynamoDB strongly recommends enabling auto scaling to manage the write capacity settings for all of your global tables replicas and indexes.

-   When you use the provisioned capacity mode, you manage your auto scaling policy with `UpdateTableReplicaAutoScaling` operation which applies changes to write capacity settings to all replica tables in a global table automatically.

-   If you use the `UpdateTable, RegisterScalableTarget, or PutScalingPolicy` operations, you should apply the change to each replica table and matching secondary index individually.

## Things To Know

-   If you create your replica tables using the AWS Management Console, auto scaling is enabled by default for each replica table, with default auto scaling settings for managing read capacity units and write capacity units.

-   Changes to auto scaling settings for a replica table or secondary index made through the DynamoDB console or using the UpdateGlobalTableSettings call are applied to all of the replica tables. These changes overwrite any existing auto scaling settings.

-   Tags in the source table are not automatically carried over to the newly added replica tables. As soon as the new region gets added, you can use the CLI's `tag-resource` operation to add tags to the replica table while the table is still being created. This will help to determine costs later in the billing service.

## Consistency & Conflict Resolution

-   In a global table, a newly written item is usually propagated to all replica tables within a second.

-   DynamoDB global tables use a last writer wins reconciliation between concurrent updates, in which DynamoDB makes a best effort to determine the last writer. With this conflict resolution mechanism, all the replicas will agree on the latest update and converge toward a state in which they all have identical data.

{% include donate.html %}
{% include advertisement.html %}

## How It Works

-   Suppose that you expect 5 writes per second to your replica table in Ohio and 5 writes per second to your replica table in N. Virginia. In this case, you should expect to consume 10 rWCUs (or 10 replicated write request units, if using on-demand capacity) in both Ohio and N. Virginia.

-   Replication uses DDB streams to read data from global tables and replicate them in other region tables. The read requests are billed as Streams read request unit.

-   Each GetRecords API call to DynamoDB Streams is a streams read request unit. Each streams read request unit can return up to 1 MB of data.

-   The replication to another region makes use of replication Write Capacity Units (rWCU) which are different from the Write Capacity Units (WCU).

## Table Deletion

-   To delete a global table, all replica tables need to be deleted first.

## Limits

If you're planning to replicate a larger table (TB in size) then you will get this error:

```
Failed to create a new replica of table: 'xxxxx' because user is not whitelisted for creating a replica of this size in region: 'ap-southeast-1'.
Please contact AWS support to request whitelisting for adding a replica of this size.
```

Console in some cases allows you to initiate replication for a larger table but the replication will get stuck until the table limits are raised by DynamoDB service team.

Note that these limits aren't available via Service Quotas.

You will have to create a support ticket and share below details to DynamoDB service team:

1. Whether you are planning to use global tables in single or multi master configuration.

2. Whether replication of this size is a once off activity.

3. Estimated WCU post replication.

4. How many replicated regions for the table.

DynamoDB service team will use these details to plan for capacity and then whitelist your table for replication.

## Performance

When you are adding a new region to your global table, AWS performs table restore operation. Consider:

Source Table: Virginia region

Then to restore the table in other regions it takes below times (replication time depends on a number of factors such as replica region, table size, network latency, version of Global Table):

<!-- prettier-ignore-start -->

|   |Oregon |Ireland |Singapore |
|-- |--     |--      |--        |
|Replication Times for a table of size 2 TB| ~3h | ~3h |~5h |
|Replication Times for a table of size 12 TB| ~12h | ~12h |~45h |
{:.table-striped}

<!-- prettier-ignore-end -->

When you add data to an existing global table, AWS documentation mentions that the data should get replicated within a second to your replicated regions.

**Average replication latency (in ms) for replicating updates from a table in Virginia region to other AWS regions:**

<figure>
	<a href="{{ site.url }}/assets/img/2020/02/average-replication-latency.png"><img src="{{ site.url }}/assets/img/2020/02/average-replication-latency.png"></a>
</figure>

**Maximum replication latency (in ms) for replicating updates from a table in Virginia region to other AWS regions:**

<figure>
	<a href="{{ site.url }}/assets/img/2020/02/maximum-replication-latency.png"><img src="{{ site.url }}/assets/img/2020/02/maximum-replication-latency.png"></a>
</figure>

## Using CLI

When creating the replica table from the console, the API call made includes the parameters to set the auto scaling if enabled on the base table. Therefore the settings are carried over to the replica table.

However, when you are executing a CLI command for the same action, you need to to include all the settings from the base table that you wish to pass to the replica table.

## Pricing

Consider the case where you have created a global table in us-east-1 region with a replica in eu-west-1 region. You then add 500 GB data to the global table, below pricing charges apply.

<!-- prettier-ignore-start -->

| Charges                 | Pricing Chart   |Cost Calculation                                                      |
| ----------------------- | ----------------|------------------------------------- |
| Data storage per region | us-east-1: First 25 GB per month free, $0.25 per GB thereafter <br/> eu-west-1: First 25 GB per month free, $0.283 per GB thereafter| us-east-1 storage cost: (0 * 25) + (0.25 * 475) = $118.75 <br/> eu-west-1 storage cost: (0 * 25) + (0.283 * 475) = $134.43|
| rWCU consumed per region   | *On-Demand* <br/> us-east-1: $1.875 per million rWCUs<br/>eu-west-1: $2.12 per million rWCUs| *On-Demand* <br/> 500 GB = 500 * 1024 * 1024 <br/> Total writes = 524288000 <br/>  Cost in us-east-1 region = (524288000/1000000) * 1.875 = $983.04 <br/> Cost in eu-west-1 region = (524288000/1000000) * 2.12 = $1111.49|
| Data transfer to replicated regions | Up to 1 GB/month no charge <br/> $0.09 per GB up to next 9.999 TB/month | $44.91 |
| Stream read request units || No longer billed for stream resources used by global tables for replicating changes from one replica table to all other replicas |
{:.table-striped}

<!-- prettier-ignore-end -->

{% include donate.html %}
{% include advertisement.html %}

Consider the case where you have created a normal table in us-east-1 region and loaded 500 GB of data. Source table was then converted to a global table and a replica in eu-west-1 region was added. Below pricing charges apply for replication.

<!-- prettier-ignore-start -->

| Charges                 | Pricing Chart   |Cost Calculation                                                      |
| ----------------------- | ----------------|------------------------------------- |
| Data storage per region | us-east-1: First 25 GB per month free, $0.25 per GB thereafter <br/> eu-west-1: First 25 GB per month free, $0.283 per GB thereafter| us-east-1 storage cost: (0 * 25) + (0.25 * 475) = $118.75 <br/> eu-west-1 storage cost: (0 * 25) + (0.283 * 475) = $134.43|
| Table restore per region | eu-west-1: $0.17 per GB | eu-west-1 restore cost: ($ 0.17 * 500 GB) = $85|
| Data transfer to replicated regions | Up to 1 GB/month no charge <br/> $0.09 per GB up to next 9.999 TB/month | $44.91 |
| Stream read request units || No longer billed for stream resources used by global tables for replicating changes from one replica table to all other replicas |
{:.table-striped}

<!-- prettier-ignore-end -->

## FAQ

**Can we determine the time it took to replicate a table in a region on an ongoing basis ?**

The overall time of replication depends upon multiple factors like source and replica region, table size, network latency, version of Global Table etc. So calculating total time of replication or even an idea of the same is not possible as many of these factors are dynamic (for example network latency).

**Can we determine the replication status for a table in a region ?**

Global Table "Version 2017.11.29" - There is Cloudwatch metric called "Pending replication count" which indicates the number of item updates that are written to one replica table, but that have not yet been written to another replica in the global table.

Global table "Version 2019.11.21" - Unfortunately, this metric is not yet present in Global table "Version 2019.11.21 (Current)" and ETA for the same cannot be commented/confirmed. For current version, user have to calculate number of items in target table manually to know the difference and progress for the same.

**Can we track rWCU consumed ?**

In DynamoDB Global tables WCU's are replaced by rWCU's as a pricing term. So basically, summing up of WCU's for each replicas (for each region) will provide total rWCU's. WCU's are provided as metric in Cloudwatch.

**Is it possible to increase streams read request unit ?**

Streams read request units are number of GetRecords API used for reading data from DynamoDB Streams and Streams read request units are unique from read requests on your DynamoDB table, so increasing RCU will not increase streams read request unit.

In DynamoDB Global tables context, stream read request units are managed by service internally and values will be according to volume of data with no custom user-control so we cannot increase these streams read request units.

However, for explicit dynamoDB streams used by user application (like custom AWS Lambda function), streams read request units are equivalent to number of GetRecords API performed with no upper limit.

{% include donate.html %}
{% include advertisement.html %}

**Should we increase the throughput limit for DynamoDB Streams in Service Quota to replicate faster ?**

When you enable replication using GT on your DDB table, all you need to ensure is that the replica tables have the same WCU set as the primary table. The DDB streams automatically scale to the limit needed for the replication to take place. Therefore, in your case, you need to ensure that all the regions have the same WCU for the tables. You don't need to change or set write capacity of the streams.

**GetRecords returned bytes metric is showing 795 bytes per min of data being returned from GetRecords API on an ongoing basis. What data is being read even when no new record has been added to replicate ?**

Regarding the 795 bytes per min, would request you to use some client (like AWS Lambda) to process the stream at that particular interval using GetRecords API to check the content of the stream at that particular time (which will explain 795 bytes) because at our end we do not have visibility to check metrics or content of the stream. Please refer the link to use python boto3 to get records from stream.

**Is the WCU set on the source table converted into rWCU for write to the replica table ?**

In DynamoDB Global Tables, rWCU's are taken in account for all tables (including original). So, even on source table, charges are according to rWCU's. (In simple words, global tables use rWCU's instead of WCU's as a pricing term).

{% include donate.html %}
{% include advertisement.html %}
