---
layout: post
title: "AWS Aurora DB Flavors Comparison"
date: 2021-08-09
excerpt: "AWS Aurora DB Flavors Comparison"
tag:
- aws
- aurora
- aurora v2
- aurora provisioned
- aurora serverless
- amazon aurora provisioned vs serverless
- aws aurora serverless
- aws aurora provisioned
comments: true
---


Feature | Aurora Provisioned | Aurora Serverless v1 | Aurora Serverless v2 (Proposed)
-- | -- | -- | --
Use Cases |   | * Infrequently-used applications<br/>* Development and test databases<br/>* Variable Workloads<br/>* Unpredictable Workloads<br/>* Multi-tenant applications |* Variable Workloads<br/>* Unpredictable Workloads<br/>* Provision cluster for each customer (no noisy neighbour)<br/>* Auto scale based on demand<br/>* No DB fleet management<br/>* No separate DB for reads and writes
Scaling |* Storage autoscaling – Max 128 TB<br/>* Replica autoscaling based on CPU/connections | Doubles ACU’s for each scale activity | Instant/Incremental scaling based on demand
Performance Insights | ✅ | ❌ | ❌
Proxy | ✅ | ❌ | ❌
Backtracking (rewind to a specific time) | ✅ | ❌ | ✅
Cloning | ✅ |   | ✅
Global Databases | ✅ | ❌ | ✅
Multi-AZ | ✅ |   | ✅
Multi-Master | ✅ | ❌ | ❌
Read Replicas | ✅ Up to 15 Read replicas (max connections based on instance type) | ❌ | ✅ Up to 15 readers of 256 ACU (6000 connections) each Max connections: 96,000
Mixed configuration (Write in provisioned mode, Read in serverless mode) | ** With serverless v2 | ❌ | ✅
IAM Based DB Authentication | ✅ | ❌ | ❌
Data API | ✅ | ✅ | ❌ (** may be supported)
MySQL Import/Export to S3 | ✅ | ❌ | ❌
Lambda Function Invoke | ✅ | ❌ | ❌
Console Query Editor | ❌ | ✅ | ❌ (** may be supported)
Restoring Snapshots from Aurora Non-Serverless clusters |   | ✅ | ❌ (** may be supported)
CDC | ✅ | ❌ |  
{:.table-striped}

{% include donate.html %}
{% include advertisement.html %}