---
layout: post
title: "Alibaba Cloud Certified Associate (ACA) Exam Study Notes"
date: 2020-07-04
excerpt: "Notes for Alibaba Cloud Certified Associate - Cloud Computing"
tag:
    - alibaba cloud certification
    - alibaba cloud certification course cloud computing
    - alibaba certificates
    - alibaba aca exam
    - alibaba aca exam questions
    - alibaba cloud certification course - cloud computing
    - alibaba university
    - alibaba cloud
comments: true
---

## Preparation

- Course - [https://edu.alibabacloud.com/certification/clouder_acacloudcomputing](https://edu.alibabacloud.com/certification/clouder_acacloudcomputing)

- Practice Tests - [https://www.udemy.com/course/alibaba-cloud-associate-cloud-computing-practice-tests/](https://www.udemy.com/course/alibaba-cloud-associate-cloud-computing-practice-tests/)

## Elastic Compute Service (ECS)

<figure>
    <a href="{{ site.url }}/assets/img/2020/07/alibaba-ecs-overview.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2020/07/alibaba-ecs-overview.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2020/07/alibaba-ecs-overview.png">
            <img src="{{ site.url }}/assets/img/2020/07/alibaba-ecs-overview.png" alt="">
        </picture>
    </a>
</figure>

- Virtualized using XEN/KVM

- Uses Apsara distributed file system Pangu for storage

- For example, `ecs.sn1.3xlarge` sn is the instance family, 1 is the generation and 3xlarge is the instance size

- ECS Bare Metal Instances are a compute service that combines the elasticity of virtual machines and the performance and features of physical machines

- If you stop an instance, then you won't be billed. However, you will be charged for the underlying disk storage.

- If you want to reset the password for an instance, then you need to restart the ECS instance.

- Once you assign an EIP (Elastic IP Address) to your instance, you can't assign an internet IP back to the instance. You can only detach the EIP and use the private IP of the instance.

- For a disk rollback, ECS must be in a stopped state.

- If you had created a custom image from a snapshot, then you need to delete the image first before being allowed to delete the snapshot.

- You need to stop an instance if you want to perform these operations - instance upgrade, disk replace, IP change.

- When you replace a system disk, a new disk ID is assigned and the old one is removed. You can then change the disk size, image and key pair.

- Instance metadata can be retrieved at [http://100.100.100.200/latest/meta-data](http://100.100.100.200/latest/meta-data) 

- User metadata can be retrieved at [http://100.100.100.200/latest/user-data](http://100.100.100.200/latest/user-data)

### Block Storage

- ECS instance can utilize two types of disks - System disk and Data disk

| Disk Type | Properties                                                  |
| -----     | ----------------------------------------------------------- |
| System    | Maximum number of disks per instance: 1<br/> A system disk must be created with an instance and shares the same lifecycle as the instance<br/>Shared access to a system disk is not allowed<br/>The minimum size of a system disk depends on the image|
| Data | Maximum number of disks per instance: 16<br/> It can be created separately or together with an ECS instance.<br/>Data disk size is up to 32 TB|
{:.table-striped}

- Disk categories - Ultra disk, Standard SSD & Enhanced SSD (ESSD)

| Disk Category | Properties                                                  |
| -----     | ----------------------------------------------------------- |
| Ultra disk    | Ultra disks feature high cost-effectiveness, medium random IOPS performance, and high data reliability|
| Standard SSD | Standard SSDs are high-performance disks that feature consistent and high random IOPS performance and high data reliability|
|Enhanced SSD (ESSD) | ESSDs are based on the next-generation distributed block storage architecture and the 25 Gigabit Ethernet (25GE) and remote direct memory access (RDMA) technologies.<br/> Each ESSD can deliver up to one million random IOPS and has low latency.
{:.table-striped}

- Snapshots of storage are incremental

- 3 redundant copies of the data are made

- ECS instance must be within the same zone as the cloud disk

{% include donate.html %}
{% include advertisement.html %}

## VPC

- vswitch → subnet

- vrouter → route table

- Use VPC to manage different zones within same region

- 1 User can create up to 100 security groups

- 1 security group can be added up to 1000 instances

- 1 security group can have up to 100 rules

- 1 instance can have up to 5 security groups

- 1 → 100 rule priority

- default security group → allows port 80 access

## RDS

- RDS comes in three flavors - Basic, HA, Finance (Enterprise)

- HA → 1 master 1 slave configuration

- Finance → 1 master 2 slave configuration

- 1 instance can have up to 2 TB storage

- RDS instance can be created in single/multiple zones

- Data recovery options - Master node rollback/Slave node repair/Temporary instance with backup

- Temporary instance with backup is valid for 48 hours

- You can create Read-Only instance to reduce read pressure

- Security options - IP whitelisting, DDos, SQL Injection prevention

- DTS used for Structural migration (tables, views etc.), full migration or incremental migration


{% include donate.html %}
{% include advertisement.html %}

## OSS

- OSS is a PAAS service

- Up to 50 PB data can be stored in a single bucket

- Data is replicated with three copies in AZs

- With a PUT request, you can upload up to 5 GB of data

- With a Multi-part request, you can upload up to 48.8 TB of data

- You cannot delete a non-empty bucket

- Use x-oss-process parameter for img processing

- Image processing supports parameter mode (image/\<action\>) and style mode: (style/\<style_name\>)

- Anti-leech (Hotlink) supports wildcard * & ? or empty referer

## SLB

- L4 - TCP & UDP, limited routing based on packets

- L7 - HTTP & HTTPS, headers can be modified, X-Forwarded-For header

- Listeners - round robin, weighted round robin, weighted least connections

- No cross region but multi zone support available


{% include donate.html %}
{% include advertisement.html %}

## Auto Scaling

- Supports scheduled and dynamic scaling

- During a cool down, only scaling requests from cloud monitor alarm are rejected, manual scaling is still allowed

- No rollback of scaling activities incase of an ecs failure

- SLB & RDS defined in the scaling group cannot be modified

- Deleting a scaling group does not delete RDS/SLB

- Scheduled task is retried if any scaling activity was running on previous attempt

- Alarm tasks name must be unique

{% include donate.html %}
{% include advertisement.html %}