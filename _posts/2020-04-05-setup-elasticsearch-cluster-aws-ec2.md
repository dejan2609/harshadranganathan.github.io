---
layout: post
title: "Setup Elasticsearch Cluster on AWS EC2"
date: 2020-04-05
excerpt: "Steps to setup an elasticsearch cluster on AWS EC2"
tag:
    - install elasticsearch on ec2
    - install elasticsearch amazon linux 2
    - aws elasticsearch tutorial
    - elasticsearch ec2 discovery
    - cluster initial_master_nodes aws
    - elasticsearch server
    - aws elasticsearch endpoint
    - aws elasticsearch security group ports
    - discovery.seed_providers
    - elasticsearch discovery.ec2.availability zones
    - elasticsearch+discovery plugin
    - discovery seed_hosts ec2
    - cluster.initial_master_nodes must be configured
    - cluster.initial_master_nodes must be configured
comments: true
---

## Pre-requisites

This guide is for setting up Elasticsearch 7 cluster in Amazon Linux 2 AMI.

  - You need to have a VPC set up with subnets spanning multiple availability zones in the same AWS region. In this guide, we create resources primarily in us-east-1 region.

## Why run your own Elasticsearch cluster on AWS EC2 instead of hosted services

There are two notable alternatives to running Elasticsearch in AWS:

-   Elastic Cloud
-   AWS Elasticsearch Service

Running your own Elasticsearch cluster on AWS EC2 instead of hosted services provides below advantages:

-   Cheaper
-   Full Control, visibility and accessability
-   Choose any instance type
-   Install plugins
-   Access elasticsearch logs
-   Perform any configuration changes

## Launch EC2 Instance

We won't go in depth on how to launch an EC2 instance as it is beyond the scope of this guide.

Launch an EC2 instance of below configuration for this guide (you will be charged):

<!-- prettier-ignore-start -->

|  Setting                |  Value                                                                                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| AMI              | Amazon Linux 2 AMI                                                                                                                                |
| Instance Type    | t3.medium                                                                                                                                         |
| Network & Subnet | Choose existing VPC & subnet (or) create new ones. It is recommended to run your Elasticsearch instance in a private subnet for security reasons. |
| Storage | 30 GB gp2 EBS volume |
| Security Group | Security group must allow access to below ports:<br/><br/>Type: SSH<br/>Protocol: TCP<br/>Port Range: 22<br/>Source: Give your IP<br/><br/>Type: Custom TCP<br/>Protocol: TCP<br/>Port Range: 9200<br/>Source: Multi AZ Subnet IPv4 CIDR (This is required for ES node in one AZ to discover node running in another AZ)<br/><br/>Type: Custom TCP<br/>Protocol: TCP<br/>Port Range: 9300<br/>Source: Multi AZ Subnet IPv4 CIDR (This is required for ES node in one AZ to discover node running in another AZ) |
| Key Pair | Create/use an existing key pair as we need to SSH later |
| IAM | Create an IAM role with ec2:DescribeInstances permission as it required for EC2 discovery plugin to work |
{:.table-striped}

<!-- prettier-ignore-end -->

{% include donate.html %}
{% include advertisement.html %}

## Elasticsearch Setup

### Single Node

Let's set up a single instance of Elasticsearch where you will have a cluster of one node.

Once you have the instance up and running, SSH into the instance by using the private IP and the key pair. If you are using Windows, you can use [Putty](https://www.putty.org/) software.

#### Switch to Root User

After you have successfully SSH'ed to the new instance, we switch to the root user.

```bash
$ sudo su
```

#### Import Elasticsearch PGP Key

Download and install the public signing key:

```bash
rpm --import https://artifacts.elastic.co/GPG-KEY-elasticsearch
```

#### Configure RPM Repository for Elasticsearch

Go to directory `/etc/yum.repos.d/`

```bash
$ cd /etc/yum.repos.d/
```

Create a new file named `elasticsearch.repo` with below content to define the repository details:

```bash
$ vi elasticsearch.repo
```

```ini
[elasticsearch]
name=Elasticsearch repository for 7.x packages
baseurl=https://artifacts.elastic.co/packages/7.x/yum
gpgcheck=1
gpgkey=https://artifacts.elastic.co/GPG-KEY-elasticsearch
enabled=0
autorefresh=1
type=rpm-md
```

#### Install Elasticsearch from RPM Repository

```bash
$ yum install --enablerepo=elasticsearch elasticsearch
```

Note:
The configured repository is disabled by default. This eliminates the possibility of accidentally upgrading elasticsearch when upgrading the rest of the system.

{% include donate.html %}
{% include advertisement.html %}

#### Configure Elasticsearch to run on bootup

To configure Elasticsearch to start automatically when the system boots up, run the following commands:

```bash
$ /bin/systemctl daemon-reload
$ /bin/systemctl enable elasticsearch.service
```

#### Start Elasticsearch

We will now start Elasticsearch by running below command:

```bash
$ systemctl start elasticsearch.service
```

Let's check the logs to see if the Elasticsearch process started without any issues:

```bash
$ cd /var/log/elasticsearch
$ view elasticsearch.log
```

`Note: Log file is named after cluster name`

Inside the log file you will notice below lines which tells us that the service started without any issues:

```text
[2020-04-04T20:06:09,328][INFO ][o.e.h.AbstractHttpServerTransport] [ip-.ec2.internal] publish_address {127.0.0.1:9200}, bound_addresses {[::1]:9200}, {127.0.0.1:9200}
[2020-04-04T20:06:09,329][INFO ][o.e.n.Node               ] [ip-.ec2.internal] started
```

Additionally, let's send a request to localhost and see if we get the cluster details.

```bash
[root@ip- elasticsearch]# curl -X GET "localhost:9200/?pretty"
{
  "name" : "ip-.ec2.internal",
  "cluster_name" : "elasticsearch",
  "cluster_uuid" : "FbbWN2VpS9-7ph-WrRwriA",
  "version" : {
    "number" : "7.6.2",
    "build_flavor" : "default",
    "build_type" : "rpm",
    "build_hash" : "ef48eb35cf30adf4db14086e8aabd07ef6fb113f",
    "build_date" : "2020-03-26T06:34:37.794943Z",
    "build_snapshot" : false,
    "lucene_version" : "8.4.0",
    "minimum_wire_compatibility_version" : "6.8.0",
    "minimum_index_compatibility_version" : "6.0.0-beta1"
  },
  "tagline" : "You Know, for Search"
}
```

Now, we have our elasticsearch single node instance up and running. But, in it's current form it is running in development mode.

We need to update certain configurations to run it in production mode.

{% include donate.html %}
{% include advertisement.html %}

#### Configuring Elasticsearch

##### Heap Size

When moving to production, it is important to configure heap size to ensure that Elasticsearch has enough heap available.

The more heap available to Elasticsearch, the more memory it can use for its internal caches, but the less memory it leaves available for the operating system to use for the filesystem cache.

Important things to note when updating the heap size:

-   Initial and max heap size should be equal. Bootstrap check would fail if you have configured unequal initial and max heap size.
-   Set Xmx and Xms to no more than 50% of your physical RAM.
-   Set Xmx and Xms to no more than the threshold that the JVM uses for compressed object pointers (threshold is near 32 GB)
-   Ideally set Xmx and Xms to no more than the threshold for zero-based compressed oops (threshold is 26 GB)

Based on above recommendations, let's update the heap size.

Remember we had launched a t3.medium instance type with 4 GB of RAM. So, let's update the heap size to be 50% of the RAM which is 2 GB in this case.

Edit `jvm.options` file.

```bash
$ vi /etc/elasticsearch/jvm.options
```

Update the heap size in the file and save it.

```text
-Xms2g
-Xmx2g
```

##### cluster.name

A node can only join a cluster when it shares its cluster.name with all the other nodes in the cluster. The default name is elasticsearch, but you should change it to an appropriate name which describes the purpose of the cluster.

Edit `/etc/elasticsearch/elasticsearch.yml` file to update the cluster name.

Uncomment `cluster.name` and give a unique name.

```yaml
cluster.name: production
```

##### network.host

By default, Elasticsearch binds to loopback addresses only — e.g. 127.0.0.1 and [::1].

In order to form a cluster with nodes on other servers, your node will need to bind to a non-loopback address.

Edit `/etc/elasticsearch/elasticsearch.yml` file to update the network.host details.

Uncomment `network.host` and update it with below settings.

```yaml
network.host: [_local_,_site_]
```

where `_local_` refers to Any loopback addresses on the system and `_site_` refers to Any site-local addresses on the system e.g. IP address of the server.

{% include donate.html %}
{% include advertisement.html %}

##### Discovery Settings

By default, when Elasticsearch first starts up it will try and discover other nodes running on the same host.

It is useful to be able to form this cluster without any extra configuration in development mode, but this is unsuitable for production because it’s possible to form multiple clusters and lose data as a result.

Bootstrap check requires any one of below properties to be set:

<!-- prettier-ignore-start -->

|                              |                                                                                                                                                               |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| discovery.seed_hosts         | Setting to provide a list of other nodes in the cluster that are master-eligible and likely to be live and contactable in order to seed the discovery process |
| discovery.seed_providers     | Configure the list of seed nodes: a settings-based, a file-based or cloud based seed hosts provider                                                                                                                                                              |
| cluster.initial_master_nodes | Explicitly list the master-eligible nodes whose votes should be counted in the very first election                                                                                                                                                         |
{:.table-striped}

<!-- prettier-ignore-end -->

Let's make use of EC2 discovery plugin adds a hosts provider that uses the AWS API to find a list of seed nodes.

To install EC2 discovery plugin run below command:

```bash

[root@ip- ec2-user]# /usr/share/elasticsearch/bin/elasticsearch-plugin install discovery-ec2
-> Installing discovery-ec2
-> Downloading discovery-ec2 from elastic
[=================================================] 100%  
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@     WARNING: plugin requires additional permissions     @
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
* java.lang.RuntimePermission accessDeclaredMembers
* java.lang.RuntimePermission getClassLoader
* java.lang.reflect.ReflectPermission suppressAccessChecks
* java.net.SocketPermission * connect,resolve
See http://docs.oracle.com/javase/8/docs/technotes/guides/security/permissions.html
for descriptions of what these permissions allow and the associated risks.

Continue with installation? [y/N]y
-> Installed discovery-ec2
```

Once we have the plugin installed, we update the `elasticsearch.yml` file to use EC2 seed provider.

Edit `/etc/elasticsearch/elasticsearch.yml` file to add discovery.seed_providers setting.

```yaml
discovery.seed_providers: ec2
discovery.ec2.endpoint: ec2.us-east-1.amazonaws.com
```

Depending on the region in which you had launched your EC2 instance, update the region in `discovery.ec2.endpoint` setting appropriately.

##### Restart to apply configuration updates

We now restart the Elasticsearch service to apply all the configuration updates. Note that ES bootstrap will start the service in production mode since we had applied network settings in configuration file.

```bash
$ systemctl restart elasticsearch.service
```

Remember we had given `_site_` setting to `network.host`. This binds Elasticsearch service to the private IP of the running instance.

In your browser, you can now hit below endpoint with the IP to get cluster info.

```bash
<ec2_private_ip>:9200/?pretty
```

{% include donate.html %}
{% include advertisement.html %}

#### Configuring System

##### File Descriptors

Elasticsearch by default sets the number of open files descriptors for the user running Elasticsearch to 65,536.

You can check this setting by using node stats API:

```bash
$ curl -X GET "localhost:9200/_nodes/stats/process?filter_path=**.max_file_descriptors"
```

##### Disable Swapping

Most operating systems try to use as much memory as possible for file system caches and eagerly swap out unused application memory. This can result in parts of the JVM heap or even its executable pages being swapped out to disk.

Swapping is very bad for performance, for node stability, and should be avoided at all costs.

To disable swapping, uncomment `bootstrap.memory_lock` setting in `/etc/elasticsearch/elasticsearch.yml`.

```yaml
bootstrap.memory_lock: true
```

Create a new override file `/etc/systemd/system/elasticsearch.service.d/override.conf` with below setting:

**Note: Create elasticsearch.service.d directory first if it doesn't exist**

```ini
[Service]
LimitMEMLOCK=infinity
```

Reload the units:

```bash
$ systemctl daemon-reload
$ systemctl restart elasticsearch.service
```

You can check whether this setting got applied by using node API:

```bash
$ curl -X GET "localhost:9200/_nodes?filter_path=**.mlockall"
```

##### Virtual Memory & Threads

AWS Linux 2 AMI should already have max_map_count set to `262144` and number of threads that can be created to be at least `4096`.

These can be verified by running below commands:

```bash
# check max_map_count value
$ sysctl vm.max_map_count

# check -u value
$ ulimit -a
```

{% include donate.html %}
{% include advertisement.html %}

#### Complete Configuration

`/etc/elasticsearch/jvm.options`

```text
-Xms2g
-Xmx2g
```

`/etc/elasticsearch/elasticsearch.yml`

```yaml
cluster.name: production
bootstrap.memory_lock: true
network.host: [_local_,_site_]
discovery.seed_providers: ec2
discovery.ec2.endpoint: ec2.us-east-1.amazonaws.com
```

`/etc/systemd/system/elasticsearch.service.d/override.conf`

```ini
[Service]
LimitMEMLOCK=infinity
```

{% include donate.html %}
{% include advertisement.html %}

### Multi Node, Multi AZ

Let's assume our single node ES instance is running in us-east-1b zone. To create a ES cluster spanning multiple AZ, let's create another instance in us-east-1c zone.

You will follow all the steps which we had done before for single node ES instance set up, with one caveat, do not start the elasticsearch instance yet as we need to do some additional configuration.

*Note: If you had started the new node before applying certain configurations then it will end up in it's own separate cluster. Check the Errors section at the end on the steps to resolve this issue*

#### Configuring Elasticsearch

##### cluster.initial_master_nodes

In our earlier, single node set up we didn't have this setting. 

To form a multi node cluster this setting is required. If you start some Elasticsearch nodes on different hosts without this setting then by default they will not discover each other and will form a different cluster on each host. 

Elasticsearch will not merge separate clusters together after they have formed, even if you subsequently try and configure all the nodes into a single cluster. 

So, in both of your instances in us-east-1b & us-east-1c update `/etc/elasticsearch/elashticsearch.yml` with this setting.

```yml
cluster.initial_master_nodes: [private_ip_of_instance_in_us_east_1b,private_ip_of_instance_in_us_east_1c]
```

List of private IP addresses of instances need to be provided at bootstrap time, so that Elasticsearch can form a cluster of nodes. All of the nodes whose IP addresses are provided here are master eligible.

**Note: Although we are using EC2 discovery plugin which auto discovers the Elasticsearch nodes and configures discovery.seed_hosts setting, it has a shortcoming. We still need to explicitly define cluster.initial_master_nodes setting otherwise the nodes will form individual clusters of their own.**

##### dicovery.ec2.tag

We might have multiple Elasticsearch instances running in our account, for example, one for development, one for staging and other for production.

We don't want all of these nodes to be discovered and added as seed nodes. So, we use `dicovery.ec2.tag` setting provided as part of ec2 discovery plugin to discover only instances that are tagged with one of the given values.

As a first step, tag both your instances running in different AZ, with below tag.

```
Key: cluster_name
Value: production
```

Here, we are using the tags to indicate that these nodes should be part of `production` cluster.

Next, add this setting to `/etc/elasticsearch/elashticsearch.yml`

```yml
dicovery.ec2.tag.cluster_name: production
```

##### Automatic Node Attributes

The discovery-ec2 plugin can automatically set the `aws_availability_zone` node attribute to the availability zone of each node. This node attribute allows you to ensure that each shard has copies allocated redundantly across multiple availability zones by using the Allocation Awareness feature.

In order to enable the automatic definition of the aws_availability_zone attribute, set cloud.node.auto_attributes to true.

```yml
cloud.node.auto_attributes: true
cluster.routing.allocation.awareness.attributes: aws_availability_zone
```

##### Logging

Since we are setting up the cluster for the first time, let's enable TRACE logging for discovery package to make sure that the EC2 discovery is working as expected.

Update `/etc/elasticsearch/elashticsearch.yml` with below setting:

```yml
logger.org.elasticsearch.discovery.ec2: "TRACE"
```

{% include donate.html %}
{% include advertisement.html %}

#### Complete Configuration

`/etc/elasticsearch/elasticsearch.yml`

```yaml
cluster.name: production
cluster.initial_master_nodes: [private_ip_of_instance_in_us_east_1b,private_ip_of_instance_in_us_east_1c]
bootstrap.memory_lock: true
network.host: [_local_,_site_]
discovery.seed_providers: ec2
discovery.ec2.endpoint: ec2.us-east-1.amazonaws.com
dicovery.ec2.tag.cluster_name: production
cloud.node.auto_attributes: true
cluster.routing.allocation.awareness.attributes: aws_availability_zone
logger.org.elasticsearch.discovery.ec2: "TRACE"
```

#### Start Elasticsearch service to apply configuration updates

Now, we have wired up both our instances running in different AZ, it's time to apply these configuration updates so that these nodes discover each other and form a cluster.

Let's stop any running Elasticsearch service in both the nodes.

```bash
$ systemctl stop elasticsearch.service
```

Start Elasticsearch service in both the nodes now.

```bash
$ systemctl start elasticsearch.service
```

Check the logs available at `/var/log/elasticsearch/production.log`

```text
[2020-04-05T21:43:33,718][INFO ][o.e.d.DiscoveryModule    ] [ip-.ec2.internal] using discovery type [zen] and seed hosts providers [settings, ec2]
[2020-04-05T21:43:34,795][INFO ][o.e.n.Node               ] [ip-.ec2.internal] starting ...
[2020-04-05T21:43:36,252][TRACE][o.e.d.e.AwsEc2SeedHostsProvider] [ip-.ec2.internal] finding seed nodes...
[2020-04-05T21:43:36,253][TRACE][o.e.d.e.AwsEc2SeedHostsProvider] [ip-.ec2.internal] adding i-0d1a09e8a, address 10., transport_address 10.:9300
[2020-04-05T21:43:36,253][TRACE][o.e.d.e.AwsEc2SeedHostsProvider] [ip-.ec2.internal] adding i-0d3fab50, address 10., transport_address 10.:9300
[2020-04-05T21:43:36,929][INFO ][o.e.c.s.ClusterApplierService] [ip-10-246-39-210.ec2.internal] master node changed
```

You can see from the logs that the EC2 discovery plugin added the seed nodes and then the master got elected.

Let's check if the nodes have formed a cluster. In any of the instance run below query.

```bash
$ curl -X GET "localhost:9200/_cat/nodes?v"
```

If you see both the nodes listed then it means that they have successfully formed a cluster.

{% include donate.html %}
{% include advertisement.html %}

##### Errors

###### CoordinationStateRejectedException

```text
[2020-04-05T21:36:22,064][INFO ][o.e.c.c.JoinHelper       ] [ip-10-.ec2.internal] failed to join {ip-10-.ec2.internal}{_CIOVqs5QxKWsL2WCa0bMw}{C0a2vr-2S9y3OzpgzeQZQQ}{10.}{10.:9300}{dilm}{ml.machine_memory=4073398272, ml.max_open_jobs=20, xpack.installed=true} with JoinRequest{sourceNode={ip-10-.ec2.internal}{CI7cx9q_SZmJ8hDOroyilw}{Gg98j6PbROS6YoolW46QSg}{10.}{10.:9300}{dil}{ml.machine_memory=4073398272, xpack.installed=true, ml.max_open_jobs=20}, optionalJoin=Optional.empty}
org.elasticsearch.transport.RemoteTransportException: [ip-10-.ec2.internal][10.:9300][internal:cluster/coordination/join]
Caused by: java.lang.IllegalStateException: failure when sending a validation request to node

Caused by: org.elasticsearch.transport.RemoteTransportException: [ip-10-.ec2.internal][10.:9300][internal:cluster/coordination/join/validate]
Caused by: org.elasticsearch.cluster.coordination.CoordinationStateRejectedException: join validation on cluster state with a different cluster uuid hyxP4qbPQHKOIJcWv63R3Q than local cluster uuid AdEdSP1vTHaveITCW0V3gg, rejecting
```

If you see above errors in your logs, it means that each of the nodes have formed a cluster of their own and so, Elasticsearch prevents them from merging into a single cluster.

To overcome this error, in any one of the nodes, find the `data` path from `/etc/elasticsearch/elasticsearch.yml`.

```yml
path.data: /var/lib/elasticsearch
```

Delete the nodes directory and then restart the Elasticsearch service again. This time it will determine that a master is already available and will join the existing cluster.

```yml
$ rm -rf /var/lib/elasticsearch/nodes/
$ systemctl restart elasticsearch.service
```

{% include donate.html %}
{% include advertisement.html %}

## References

<https://www.elastic.co/guide/en/elasticsearch/reference/current/install-elasticsearch.html>
