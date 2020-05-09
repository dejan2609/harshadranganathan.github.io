---
layout: post
title: "AWS Elastic Beanstalk + Fluentd + Kinesis"
date: 2020-03-18
excerpt: "Real time log collection for an Elastic Beanstalk application using Fluentd + Amazon Kinesis to data stores such as S3, Splunk etc."
tag:
    - fluentd to kinesis
    - fluentd log collector
    - aws fluentd
    - fluentd kinesis firehose
    - fluentd example
    - fluent plugin kinesis version
    - fluentd-plugin-kinesis
    - fluentd logs
    - kinesis firehose
    - fluentd demo
    - fluentd plugins
    - fluentd configuration
    - fluentd config
    - fluentd to s3
    - fluentd to splunk

comments: true
---

## Introduction

### Elastic Beanstalk

AWS Elastic Beanstalk is an easy-to-use service for deploying and scaling web applications and services developed with Java, .NET, PHP, Node.js, Python, Ruby, Go, and Docker on familiar servers such as Apache, Nginx, Passenger, and IIS.

You can simply upload your code and Elastic Beanstalk automatically handles the deployment, from capacity provisioning, load balancing, auto-scaling to application health monitoring. At the same time, you retain full control over the AWS resources powering your application and can access the underlying resources at any time.

### Fluentd

Fluentd is an open source data collector for unified logging layer. Fluentd allows you to unify data collection and consumption for a better use and understanding of data.

-   Fluentd can be used to tail access/error logs and transport them reliably to remote systems.
-   Fluentd can "grep" for events and send out alerts.
-   Fluentd can function as middleware to enable asynchronous, scalable logging for user action events.

### Kinesis Streams

Amazon Kinesis Data Streams (KDS) is a massively scalable and durable real-time data streaming service.

KDS can continuously capture gigabytes of data per second from hundreds of thousands of sources such as website clickstreams, database event streams, financial transactions, social media feeds, IT logs, and location-tracking events.

### Kinesis Firehose

Amazon Kinesis Data Firehose is a fully managed service for delivering real-time streaming data to destinations such as Amazon Simple Storage Service (Amazon S3), Amazon Redshift, Amazon Elasticsearch Service (Amazon ES), and Splunk.

You configure your data producers to send data to Kinesis Data Firehose, and it automatically delivers the data to the destination that you specified.

### S3

Amazon Simple Storage Service (Amazon S3) is an object storage service that offers industry-leading scalability, data availability, security, and performance.

This means customers of all sizes and industries can use it to store and protect any amount of data for a range of use cases, such as websites, mobile applications, backup and restore, archive, enterprise applications, IoT devices, and big data analytics.

## Mechanism

Here we will show how to use fluentd installed in elasticbeanstalk to import tomcat logs to kinesis streams and then subsequently output them to S3 using firehose.

<figure>
    <a href="{{ site.url }}/assets/img/2020/03/beanstalk-fluentd-kinesis-integration-flow.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2020/03/beanstalk-fluentd-kinesis-integration-flow.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2020/03/beanstalk-fluentd-kinesis-integration-flow.png">
            <img src="{{ site.url }}/assets/img/2020/03/beanstalk-fluentd-kinesis-integration-flow.png" alt="">
        </picture>
    </a>
</figure>

{% include donate.html %}
{% include advertisement.html %}

## Kinesis Stream

Let's create a new kinesis stream in N.Virginia region which will consume our log events from fluentd with a data retention period of 24 hours.

Kinesis stream name: **aws-eb-fluentd-kinesis-stream**

Number of shards: **3** (to have higher throughput)

<figure>
    <a href="{{ site.url }}/assets/img/2020/03/kinesis-stream-creation-wizard.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2020/03/kinesis-stream-creation-wizard.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2020/03/kinesis-stream-creation-wizard.png">
            <img src="{{ site.url }}/assets/img/2020/03/kinesis-stream-creation-wizard.png" alt="">
        </picture>
    </a>
</figure>

## Fluentd

We will use the stable distribution of fluentd called `td-agent`. At a high level, below are the steps:

### Installation

Install td-agent for Amazon Linux 1:

```bash
curl -L https://toolbelt.treasuredata.com/sh/install-amazon1-td-agent3.sh | sh
```

Install Amazon Kinesis plugin which we will use to publish the logs to kinesis stream:

```bash
sudo td-agent-gem install fluent-plugin-kinesis --no-document --minimal-deps --no-suggestions --conservative
```

### Configuration

Configuration file allows the user to control the input and output behavior of Fluentd by (1) selecting input and output plugins and (2) specifying the plugin parameters. The file is required for Fluentd to operate properly.

Config file needs to be placed at `/etc/td-agent/td-agent.conf`

Let's define a sample configuration file that will publish catalina logs to kinesis stream.

#### Source Directive

Fluentd's input sources are enabled by selecting and configuring the desired input plugins using source directives.

```config
<source>
  @type tail
  tag catalina.errors
  path /var/log/tomcat8/catalina.out
  pos_file /var/log/td-agent/tmp/catalina.out.pos
  <parse>
    @type multiline
    format_firstline /\d{4}-\d{1,2}-\d{1,2}/
    format1 /^(?<time>\d{4}-\d{1,2}-\d{1,2} \d{1,2}:\d{1,2}:\d{1,2}.\d{1,3})[ ]{1,}(?<level>[^\s]+)[ ]{1,}\d{1,}[ ]{1,}---[ ]{1,}\[(?<thread>.*)\] (?<message>(.|\n)*)/
  </parse>
  @log_level error
</source>
```

<!-- prettier-ignore-start -->

|  Params   |   Value  | Description  |
| ----      | ----     | ----         |
|  @type    |  tail    | We make use of `tail` input plugin which allows Fluentd to read events from the tail of text files |
| tag       | catalina.errors | We create a tag `catalina.errors` which will be used as the directions for Fluentd's internal routing engine |
| path | /var/log/tomcat8/catalina.out | paths to read the text files |
| pos_file | /var/log/td-agent/tmp/catalina.out.pos | Fluentd will use this file to record the position it last read into this file.<br/>pos_file handles multiple positions in one file |
| parse (directive) ||Format of the log. in_tail uses parser plugin to parse the log|
{:.table-striped}

<!-- prettier-ignore-end -->

#### Parse Directive

Let's explore the parser directive in more detail here.

```config
<parse>
  @type multiline
  format_firstline /\d{4}-\d{1,2}-\d{1,2}/
  format1 /^(?<time>\d{4}-\d{1,2}-\d{1,2} \d{1,2}:\d{1,2}:\d{1,2}.\d{1,3})[ ]{1,}(?<level>[^\s]+)[ ]{1,}\d{1,}[ ]{1,}---[ ]{1,}\[(?<thread>.*)\] (?<message>(.|\n)*)/
</parse>
```

<!-- prettier-ignore-start -->

| Params | Value | Description |
| ------ | ----- | ----------- |
|  @type    |  multiline    | Multiline parser plugin parses multiline logs |
| format_firstline | regex | Regex for detecting start line of multiline log |
| format1 | regex | Regex for matching multiline log |
{:.table-striped}

<!-- prettier-ignore-end -->

Below is a sample catalina log from the application which we will be deploying to beanstalk later:

```text
2020-03-18 01:21:58.104 ERROR 3660 --- [nio-8080-exec-6] com.eb.RestController                    : Runtime error occurred

java.lang.ArithmeticException: / by zero
	at com.eb.RestController.error(RestController.java:23) ~[classes/:na]
	at sun.reflect.GeneratedMethodAccessor42.invoke(Unknown Source) ~[na:na]
	at sun.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43) ~[na:1.8.0_232]
	at java.lang.reflect.Method.invoke(Method.java:498) ~[na:1.8.0_232]
```

Regex expression will match this multiline log as follows:

<figure>
    <a href="{{ site.url }}/assets/img/2020/03/runtime-error-log-regex-match.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2020/03/runtime-error-log-regex-match.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2020/03/runtime-error-log-regex-match.png">
            <img src="{{ site.url }}/assets/img/2020/03/runtime-error-log-regex-match.png" alt="">
        </picture>
    </a>
</figure>

{% include donate.html %}
{% include advertisement.html %}

#### Match Directive

The "match" directive looks for events with matching tags and processes them. he most common use of the match directive is to output events to other systems (for this reason, the plugins that correspond to the match directive are called "output plugins").

```config
<match catalina.errors>
  @type kinesis_streams
  stream_name aws-eb-fluentd-kinesis-stream
  region us-east-1
  <buffer>
    chunk_limit_size 1m
    flush_interval 10s
    flush_thread_count 2
  </buffer>
</match>
```

Match directive applies to events with a tag matching the pattern `catalina.errors` which will be sent to the output destination.

<!-- prettier-ignore-start -->

| Params | Value | Description |
| ------ | ----- | ----------- |
| @type  | kinesis_streams  | Kinesis plugin to output logs to stream |
| stream_name | aws-eb-fluentd-kinesis-stream | Name of the stream to put data |
| region  | us-east-1 | AWS region of your stream |
| chunk_limit_size  | 1m | max size of each chunks: events will be written into chunks until the size of chunks become this size |
| flush_interval | 10s | flush/write chunks per specified time  |
| flush_thread_count | 2 | number of threads of output plugins, which is used to write chunks in parallel |
{:.table-striped}

<!-- prettier-ignore-end -->

<https://github.com/awslabs/aws-fluent-plugin-kinesis>

<https://docs.fluentd.org/configuration/buffer-section>

#### System Directive

We change the logging level to `trace` for troubleshooting purposes and to understand the activities fluentd performs. It's not recommended to set it to trace in your production environment.

```config
<system>
  log_level trace
</system>
```

#### Complete Configuration

Complete configuration file is as below:

```config
<system>
  log_level trace
</system>
<source>
  @type tail
  tag catalina.errors
  path /var/log/tomcat8/catalina.out
  pos_file /var/log/td-agent/tmp/catalina.out.pos
  <parse>
    @type multiline
    format_firstline /\d{4}-\d{1,2}-\d{1,2}/
    format1 /^(?<time>\d{4}-\d{1,2}-\d{1,2} \d{1,2}:\d{1,2}:\d{1,2}.\d{1,3})[ ]{1,}(?<level>[^\s]+)[ ]{1,}\d{1,}[ ]{1,}---[ ]{1,}\[(?<thread>.*)\] (?<message>(.|\n)*)/
  </parse>
  @log_level error
</source>
<match catalina.errors>
  @type kinesis_streams
  stream_name aws-eb-fluentd-kinesis-stream
  region us-east-1
  <buffer>
    chunk_limit_size 1m
    flush_interval 10s
    flush_thread_count 2
  </buffer>
</match>
```

### Apply Configuration

We then restart the td-agent to apply the configuration changes:

```bash
/etc/init.d/td-agent restart
```

{% include donate.html %}
{% include advertisement.html %}

## Beanstalk

Our intention is to tail the catalina logs and publish them to kinesis stream using fluentd.

For this tutorial we make use of below sample spring boot application that exposes REST API and generates app logs.

{% include repo-card.html repo="aws-eb-fluentd-kinesis-app" %}

### ebextensions

You can add AWS Elastic Beanstalk configuration files (.ebextensions) to your web application's source code to configure your environment and customize the AWS resources that it contains.

We use the ebextensions to define fluentd installation and configuration files.

We create three config files which cover fluentd, kinesis plugin installations and configurations which we had covered earlier.

Configuration files are available in the ebextensions folder of the repo.

<https://github.com/HarshadRanganathan/aws-eb-fluentd-kinesis-app/tree/master/src/main/resources/ebextensions>

`0-td-agent-gen-config.config`

```config
files:
  "/etc/td-agent/td-agent.conf":
    owner: root
    group: root
    content: |
      <system>
        log_level trace
      </system>
      <source>
        @type tail
        tag catalina.errors
        path /var/log/tomcat8/catalina.out
        pos_file /var/log/td-agent/tmp/catalina.out.pos
        <parse>
          @type multiline
          format_firstline /\d{4}-\d{1,2}-\d{1,2}/
          format1 /^(?<time>\d{4}-\d{1,2}-\d{1,2} \d{1,2}:\d{1,2}:\d{1,2}.\d{1,3})[ ]{1,}(?<level>[^\s]+)[ ]{1,}\d{1,}[ ]{1,}---[ ]{1,}\[(?<thread>.*)\] (?<message>(.|\n)*)/
        </parse>
        @log_level error
      </source>
      <match catalina.errors>
        @type kinesis_streams
        stream_name aws-eb-fluentd-kinesis-stream
        region us-east-1
        <buffer>
          chunk_limit_size 1m
          flush_interval 10s
          flush_thread_count 2
        </buffer>
      </match>
```

`1-td-agent-install.config`

```config
# errors get logged to /var/log/cfn-init.log. See Also /var/log/eb-tools.log
commands:
    01-command:
        command: curl -L https://toolbelt.treasuredata.com/sh/install-amazon1-td-agent3.sh | sh
```

`2-td-agent-fluent-kinesis-plugin-install.config`

```config
# errors get logged to /var/log/cfn-init.log. See Also /var/log/eb-tools.log
commands:
    01-command:
        command: sudo /usr/sbin/td-agent-gem install fluent-plugin-kinesis --no-document --minimal-deps --no-suggestions --conservative
    02-command:
        command: /etc/init.d/td-agent restart
```

ebextensions processes keys in the following order:

[1] Files

[2] Commands

<https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/customize-containers-ec2.html>

Following operations are performed when ebextensions configuration files are executed:

[1] Copy fluentd configuration file to `/etc/td-agent/td-agent.conf` with ownership to `root` user.

[2] Install fluentd `td-agent` for Amazon Linux 1

[3] Install fluentd kinesis plugin

[4] Restart `td-agent` to apply the configuration changes

Note: ebextensions config files are executed as `root` user in the EC2 instance

{% include donate.html %}
{% include advertisement.html %}

### Deployment

Now we have a spring boot application which exposes REST API and has ebextentions file which configures fluentd to publish logs to kinesis stream. Let's deploy this application to elastic beanstalk.

[1] Download the war file from github releases <https://github.com/HarshadRanganathan/aws-eb-fluentd-kinesis-app/releases/download/v0.1/aws-eb-fluentd-kinesis-app-0.1.war>

[2] Create a new application in EB console <https://console.aws.amazon.com/elasticbeanstalk/home?region=us-east-1#/createNewApplication> by giving an application name.

[3] We then create a web server environment under the application as follows:

Environment name: **aws-eb-fluentd-kinesis-app**

Preconfigured platform: **Tomcat**

Application code: Upload the war file which you had downloaded and give a version label

Under configure more options - choose High availability preset, configure VPC, subnets, Load balancer, Virtual machine key pair etc. (EB application creation is beyond the scope of this guide)

Important thing to note here is that the IAM instance profile which you configure for your EB app should have permissions to list and write to Kinesis streams.

If in case, you choose to use the default `aws-elasticbeanstalk-ec2-role` it should already have kinesis access.

<figure>
    <a href="{{ site.url }}/assets/img/2020/03/aws-eb-fluentd-kinesis-app.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2020/03/aws-eb-fluentd-kinesis-app.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2020/03/aws-eb-fluentd-kinesis-app.png">
            <img src="{{ site.url }}/assets/img/2020/03/aws-eb-fluentd-kinesis-app.png" alt="">
        </picture>
    </a>
</figure>

### Verification

Let's check if our fluentd configuration is working as expected and pushing logs to Kinesis stream.

#### EC2

First step is to check if the ebextensions configuration updates got applied successfully. SSH into the EB app and perform below checks.

Check for any errors in below log files and that the commands got executed:

```bash
$ view /var/log/cfn-init.log

2020-03-19 19:46:50,762 [INFO] -----------------------Starting build-----------------------
2020-03-19 19:46:50,771 [INFO] Running configSets: Infra-EmbeddedPreBuild
2020-03-19 19:46:50,774 [INFO] Running configSet Infra-EmbeddedPreBuild
2020-03-19 19:46:50,778 [INFO] Running config prebuild_0_test
2020-03-19 19:46:50,783 [INFO] Running config prebuild_1_test
2020-03-19 19:46:53,074 [INFO] Command 01-command succeeded
2020-03-19 19:46:53,078 [INFO] Running config prebuild_2_test
2020-03-19 19:46:53,474 [INFO] Command 01-command succeeded
2020-03-19 19:46:57,641 [INFO] Command 02-command succeeded
2020-03-19 19:46:57,642 [INFO] ConfigSets completed
2020-03-19 19:46:57,643 [INFO] -----------------------Build complete-----------------------

$ view /var/log/eb-tools.log
```

Next we check if the fluentd processes are running:

```bash
$ ps w -C ruby -C td-agent --no-heading

 7673 ?        Sl     0:00 /opt/td-agent/embedded/bin/ruby /usr/sbin/td-agent --log /var/log/td-agent/td-agent.log --use-v1-config --group td-agent --daemon /var/run/td-agent/td-agent.pid
 7678 ?        Sl     0:01 /opt/td-agent/embedded/bin/ruby -Eascii-8bit:ascii-8bit /usr/sbin/td-agent --log /var/log/td-agent/td-agent.log --use-v1-config --group td-agent --daemon /var/run
 8242 ?        Ssl    0:00 puma 2.11.1 (tcp://127.0.0.1:22221) [healthd]
```

Let's check fluentd log file available at `/var/log/td-agent/` to see if things are working as expected:

```bash
$ view td-agent.log

2020-03-18 01:14:59 +0000 [info]: parsing config file is succeeded path="/etc/td-agent/td-agent.conf"
2020-03-18 01:14:59 +0000 [info]: starting fluentd-1.3.3 pid=3347 ruby="2.4.5"
2020-03-18 01:14:59 +0000 [info]: spawn command to main:  cmdline=["/opt/td-agent/embedded/bin/ruby", "-Eascii-8bit:ascii-8bit", "/usr/sbin/td-agent", "--log", "/var/log/td-agent/td-agent.log", "--use-v1-config", "--group", "td-agent", "--daemon", "/var/run/td-agent/td-agent.pid", "--under-supervisor"]
2020-03-18 01:15:01 +0000 [info]: #0 fluentd worker is now running worker=0
2020-03-18 01:15:01 +0000 [debug]: #0 enqueue_thread actually running
2020-03-18 01:15:01 +0000 [trace]: #0 enqueueing all chunks in buffer instance=70262055861420
2020-03-18 01:15:01 +0000 [debug]: #0 flush_thread actually running
2020-03-18 01:15:01 +0000 [debug]: #0 flush_thread actually running
2020-03-18 01:15:02 +0000 [trace]: #0 enqueueing all chunks in buffer instance=70262055861420
2020-03-18 01:15:03 +0000 [trace]: #0 enqueueing all chunks in buffer instance=70262055861420
```

We see that the fluentd worker is running.

Let's generate few app logs and see if those are available in the kinesis stream.

Send couple of requests to the beanstalk rest api (use load balancer DNS/EB URL/localhost) as below to generate success and error logs.

```bash
$ curl --location --request GET 'http://aws-eb-fluentd-kinesis-app.eba-ttuxbwiu.us-east-1.elasticbeanstalk.com/helloworld'

{"message": "Hello World"}
```

```bash
$ curl --location --request GET 'http://aws-eb-fluentd-kinesis-app.eba-ttuxbwiu.us-east-1.elasticbeanstalk.com/err'

{"error": "Runtime Error"}
```

Above request generates `ArithmeticException` errors.

In the fluentd logs it will show that the logs are written to the chunks and are getting flushed periodically.

```text
2020-03-18 00:16:11 +0000 [trace]: #0 enqueueing all chunks in buffer instance=69920775650060
2020-03-18 00:16:11 +0000 [trace]: #0 adding metadata instance=69920775650060 metadata=#<struct Fluent::Plugin::Buffer::Metadata timekey=nil, tag=nil, variables=nil>
2020-03-18 00:16:22 +0000 [trace]: #0 writing events into buffer instance=69920775650060 metadata_size=1
2020-03-18 00:16:24 +0000 [debug]: #0 Finish writing chunk
2020-03-18 00:16:24 +0000 [trace]: #0 write operation done, committing chunk="5a115f5a72697091e7722abaa8815591"
2020-03-18 00:16:24 +0000 [trace]: #0 committing write operation to a chunk chunk="5a115f5a72697091e7722abaa8815591" delayed=false
2020-03-18 00:16:24 +0000 [trace]: #0 purging a chunk instance=69920775650060 chunk_id="5a115f5a72697091e7722abaa8815591" metadata=#<struct Fluent::Plugin::Buffer::Metadata timekey=nil, tag=nil, variables=nil>
2020-03-18 00:16:24 +0000 [trace]: #0 chunk purged instance=69920775650060 chunk_id="5a115f5a72697091e7722abaa8815591" metadata=#<struct Fluent::Plugin::Buffer::Metadata timekey=nil, tag=nil, variables=nil>
2020-03-18 00:16:24 +0000 [trace]: #0 done to commit a chunk chunk="5a115f5a72697091e7722abaa8815591"
2020-03-18 00:16:31 +0000 [trace]: #0 trying flush for a chunk chunk="5a115f6440a601d5529d0fb2b5b50e16"
2020-03-18 00:16:31 +0000 [trace]: #0 adding write count instance=69920770766840
2020-03-18 00:16:31 +0000 [trace]: #0 executing sync write chunk="5a115f6440a601d5529d0fb2b5b50e16"
2020-03-18 00:16:31 +0000 [debug]: #0 Write chunk 5a115f6440a601d5529d0fb2b5b50e16 /   4 records /   31 KB
2020-03-18 00:16:31 +0000 [debug]: #0 Finish writing chunk
```

Now let's check in Kinesis stream to see if our log events are received.

{% include donate.html %}
{% include advertisement.html %}

#### Kinesis Stream

We verify if the log events are available in the kinesis stream by using AWS CLI.

First, get the list of shard id's for the stream:

```bash
$ aws kinesis list-shards --stream-name aws-eb-fluentd-kinesis-stream

{
    "Shards": [
        {
            "ShardId": "shardId-000000000000",
            "HashKeyRange": {
                "StartingHashKey": "0",
                "EndingHashKey": "113427455640312821154458202477256070484"
            },
            "SequenceNumberRange": {
                "StartingSequenceNumber": "49605210697203319534060347009940518023387210197078376450"
            }
        },
        ...
    ]
}

```

We then need to get shard iterator for each of the shards which we had configured.

```bash
$ aws kinesis get-shard-iterator --stream-name aws-eb-fluentd-kinesis-stream --shard-iterator-type TRIM_HORIZON --shard-id shardId-000000000000

{
    "ShardIterator": "AAAAAAAAAAHgjXtAKjm8UpZMMP6XYzk5rThlgKNFRG78/ZeeFu/+muRJvKdez6ZJQ5EmMd2UXt2ikhXrmvLKg5vL32mSrWYEwJWy+wVbM02/UhAkrX1dXToTkIMA7FRn0pyrHtGER791k1CwOJCq+dCAsmo5vJsgbDFslvKMvsE36QxK0zTmWKsSX4qr5w6NUSG09cQkDZlF2Rr8CvIGVn7vF1HVPjP+T0AR60yJVfAmx+OYvi74TA=="
}

```

Once we got the iterator, we get the records from the stream.

```bash
$ aws kinesis get-records --shard-iterator AAAAAAAAAAHgjXtAKjm8UpZMMP6XYzk5rThlgKNFRG78/ZeeFu/+muRJvKdez6ZJQ5EmMd2UXt2ikhXrmvLKg5vL32mSrWYEwJWy+wVbM02/UhAkrX1dXToTkIMA7FRn0pyrHtGER791k1CwOJCq+dCAsmo5vJsgbDFslvKMvsE36QxK0zTmWKsSX4qr5w6NUSG09cQkDZlF2Rr8CvIGVn7vF1HVPjP+T0AR60yJVfAmx+OYvi74TA==

{
            "SequenceNumber": "49605210697203319534060386749927772490963059369909944322",
            "ApproximateArrivalTimestamp": 1584490674.415,
            "Data": "eyJsZXZlbCI6IkVSUk9SIiwidGhyZWFkIjoibmlvLTgwODAtZXhlYy05IiwibWVzc2FnZSI6ImNvbS5lYi5SZXN0Q29udHJvbGxlciAgICAgICAgICAgICAgICAgICAgOiBSdW50aW1lIGVycm9yIG9jY3VycmVkXG5cbmphdmEubGFuZy5Bcml0aG1ldGljRXhjZXB0aW9uOiAvIGJ5IHplcm9cblx0YXQgY29tLmViLlJlc3RDb250cm9sbGVyLmVycm9yKFJlc3RDb250cm9sbGVyLmphdmE6MjMpIH5bY2xhc3Nlcy86bmFdXG5cdGF0IHN1bi5yZWZsZWN0LkdlbmVyYXRlZE1ldGhvZEFjY2Vzc29yNDMuaW52b2tlKFVua25vd24gU291cmNlKSB+W25hOm5hXVxuXHRhdCBzdW4ucmVmbGVjdC5EZWxlZ2F0aW5nTWV0aG9kQWNjZXNzb3JJbXBsLmludm9rZShEZWxlZ2F0aW5nTWV0aG9kQWNjZXNzb3JJbXBsLmphdmE6NDMpIH5bbmE6MS44LjBfMjMyXVxuXHRhdCBqYXZhLmxhbmcucmVmbGVjdC5NZXRob2QuaW52b2tlKE1ldGhvZC5qYXZhOjQ5OCkgfltuYToxLjguMF8yMzJdXG5cdGF0IG9yZy5zcHJpbmdmcmFtZXdvcmsud2ViLm1ldGhvZC5zdXBwb3J0Lkludm9jYWJsZUhhbmRsZXJNZXRob2QuZG9JbnZva2UoSW52b2NhYmxlSGFuZGxlck1ldGhvZC5qYXZhOjE4OSkgW3NwcmluZy13ZWItNS4xLjYuUkVMRUFTRS5qYXI6NS4xLjYuUkVMRUFTRV1cblx0YXQgb3JnLnNwcmluZ2ZyYW1ld29yay53ZWIubWV0aG9kLnN1cHBvcnQuSW52b2NhYmxlSGFuZGxlck1ldGhvZC5pbnZva2VGb3JSZXF1ZXN0KEludm9jYWJsZUhhbmRsZXJNZXRob2QuamF2YToxMzgpIFtzcHJpbmctd2ViLTUuMS42LlJFTEVBU0UuamFyOjUuMS42LlJFTEVBU0VdXG5cdGF0IG9yZy5zcHJpbmdmcmFtZXdvcmsud2ViLnNlcnZsZXQubXZjLm1ldGhvZC5hbm5vdGF0aW9uLlNlcnZsZXRJbnZvY2FibGVIYW5kbGVyTWV0aG9kLmludm9rZUFuZEhhbmRsZShTZXJ2bGV0SW52b2NhYmxlSGFuZGxlck1ldGhvZC5qYXZhOjEwMikgW3NwcmluZy13ZWJtdmMtNS4xLjYuUkVMRUFTRS5qYXI6NS4xLjYuUkVMRUFTRV1cblx0YXQgb3JnLnNwcmluZ2ZyYW1ld29yay53ZWIuc2VydmxldC5tdmMubWV0aG9kLmFubm90YXRpb24uUmVxdWVzdE1hcHBpbmdIYW5kbGVyQWRhcHRlci5pbnZva2VIYW5kbGVyTWV0aG9kKFJlcXVlc3RNYXBwaW5nSGFuZGxlckFkYXB0ZXIuamF2YTo4OTIpIFtzcHJpbmctd2VibXZjLTUuMS42LlJFTEVBU0UuamFyOjUuMS42LlJFTEVBU0VdXG5cdGF0IG9yZy5zcHJpbmdmcmFtZXdvcmsud2ViLnNlcnZsZXQubXZjLm1ldGhvZC5hbm5vdGF0aW9uLlJlcXVlc3RNYXBwaW5nSGFuZGxlckFkYXB0ZXIuaGFuZGxlSW50ZXJuYWwoUmVxdWVzdE1hcHBpbmdIYW5kbGVyQWRhcHRlci5qYXZhOjc5NykgW3NwcmluZy13ZWJtdmMtNS4xLjYuUkVMRUFTRS5qYXI6NS4xLjYuUkVMRUFTRV1cblx0YXQgb3JnLnNwcmluZ2ZyYW1ld29yay53ZWIuc2VydmxldC5tdmMubWV0aG9kLkFic3RyYWN0SGFuZGxlck1ldGhvZEFkYXB0ZXIuaGFuZGxlKEFic3RyYWN0SGFuZGxlck1ldGhvZEFkYXB0ZXIuamF2YTo4NykgW3NwcmluZy13ZWJtdmMtNS4xLjYuUkVMRUFTRS5qYXI6NS4xLjYuUkVMRUFTRV1cblx0YXQgb3JnLnNwcmluZ2ZyYW1ld29yay53ZWIuc2VydmxldC5EaXNwYXRjaGVyU2VydmxldC5kb0Rpc3BhdGNoKERpc3BhdGNoZXJTZXJ2bGV0LmphdmE6MTAzOCkgW3NwcmluZy13ZWJtdmMtNS4xLjYuUkVMRUFTRS5qYXI6NS4xLjYuUkVMRUFTRV1cblx0YXQgb3JnLnNwcmluZ2ZyYW1ld29yay53ZWIuc2VydmxldC5EaXNwYXRjaGVyU2VydmxldC5kb1NlcnZpY2UoRGlzcGF0Y2hlclNlcnZsZXQuamF2YTo5NDIpIFtzcHJpbmctd2VibXZjLTUuMS42LlJFTEVBU0UuamFyOjUuMS42LlJFTEVBU0VdXG5cdGF0IG9yZy5zcHJpbmdmcmFtZXdvcmsud2ViLnNlcnZsZXQuRnJhbWV3b3JrU2VydmxldC5wcm9jZXNzUmVxdWVzdChGcmFtZXdvcmtTZXJ2bGV0LmphdmE6MTAwNSkgW3NwcmluZy13ZWJtdmMtNS4xLjYuUkVMRUFTRS5qYXI6NS4xLjYuUkVMRUFTRV1cblx0YXQgb3JnLnNwcmluZ2ZyYW1ld29yay53ZWIuc2VydmxldC5GcmFtZXdvcmtTZXJ2bGV0LmRvR2V0KEZyYW1ld29ya1NlcnZsZXQuamF2YTo4OTcpIFtzcHJpbmctd2VibXZjLTUuMS42LlJFTEVBU0UuamFyOjUuMS42LlJFTEVBU0VdXG5cdGF0IGphdmF4LnNlcnZsZXQuaHR0cC5IdHRwU2VydmxldC5zZXJ2aWNlKEh0dHBTZXJ2bGV0LmphdmE6NjM0KSBbdG9tY2F0OC1zZXJ2bGV0LTMuMS1hcGkuamFyOm5hXVxuXHRhdCBvcmcuc3ByaW5nZnJhbWV3b3JrLndlYi5zZXJ2bGV0LkZyYW1ld29ya1NlcnZsZXQuc2VydmljZShGcmFtZXdvcmtTZXJ2bGV0LmphdmE6ODgyKSBbc3ByaW5nLXdlYm12Yy01LjEuNi5SRUxFQVNFLmphcjo1LjEuNi5SRUxFQVNFXVxuXHRhdCBqYXZheC5zZXJ2bGV0Lmh0dHAuSHR0cFNlcnZsZXQuc2VydmljZShIdHRwU2VydmxldC5qYXZhOjc0MSkgW3RvbWNhdDgtc2VydmxldC0zLjEtYXBpLmphcjpuYV1cblx0YXQgb3JnLmFwYWNoZS5jYXRhbGluYS5jb3JlLkFwcGxpY2F0aW9uRmlsdGVyQ2hhaW4uaW50ZXJuYWxEb0ZpbHRlcihBcHBsaWNhdGlvbkZpbHRlckNoYWluLmphdmE6MjMxKSBbY2F0YWxpbmEuamFyOjguNS41MF1cblx0YXQgb3JnLmFwYWNoZS5jYXRhbGluYS5jb3JlLkFwcGxpY2F0aW9uRmlsdGVyQ2hhaW4uZG9GaWx0ZXIoQXBwbGljYXRpb25GaWx0ZXJDaGFpbi5qYXZhOjE2NikgW2NhdGFsaW5hLmphcjo4LjUuNTBdXG5cdGF0IG9yZy5hcGFjaGUudG9tY2F0LndlYnNvY2tldC5zZXJ2ZXIuV3NGaWx0ZXIuZG9GaWx0ZXIoV3NGaWx0ZXIuamF2YTo1MikgW3RvbWNhdC13ZWJzb2NrZXQuamFyOjguNS41MF1cblx0YXQgb3JnLmFwYWNoZS5jYXRhbGluYS5jb3JlLkFwcGxpY2F0aW9uRmlsdGVyQ2hhaW4uaW50ZXJuYWxEb0ZpbHRlcihBcHBsaWNhdGlvbkZpbHRlckNoYWluLmphdmE6MTkzKSBbY2F0YWxpbmEuamFyOjguNS41MF1cblx0YXQgb3JnLmFwYWNoZS5jYXRhbGluYS5jb3JlLkFwcGxpY2F0aW9uRmlsdGVyQ2hhaW4uZG9GaWx0ZXIoQXBwbGljYXRpb25GaWx0ZXJDaGFpbi5qYXZhOjE2NikgW2NhdGFsaW5hLmphcjo4LjUuNTBdXG5cdGF0IG9yZy5zcHJpbmdmcmFtZXdvcmsud2ViLmZpbHRlci5SZXF1ZXN0Q29udGV4dEZpbHRlci5kb0ZpbHRlckludGVybmFsKFJlcXVlc3RDb250ZXh0RmlsdGVyLmphdmE6OTkpIFtzcHJpbmctd2ViLTUuMS42LlJFTEVBU0UuamFyOjUuMS42LlJFTEVBU0VdXG5cdGF0IG9yZy5zcHJpbmdmcmFtZXdvcmsud2ViLmZpbHRlci5PbmNlUGVyUmVxdWVzdEZpbHRlci5kb0ZpbHRlcihPbmNlUGVyUmVxdWVzdEZpbHRlci5qYXZhOjEwNykgW3NwcmluZy13ZWItNS4xLjYuUkVMRUFTRS5qYXI6NS4xLjYuUkVMRUFTRV1cblx0YXQgb3JnLmFwYWNoZS5jYXRhbGluYS5jb3JlLkFwcGxpY2F0aW9uRmlsdGVyQ2hhaW4uaW50ZXJuYWxEb0ZpbHRlcihBcHBsaWNhdGlvbkZpbHRlckNoYWluLmphdmE6MTkzKSBbY2F0YWxpbmEuamFyOjguNS41MF1cblx0YXQgb3JnLmFwYWNoZS5jYXRhbGluYS5jb3JlLkFwcGxpY2F0aW9uRmlsdGVyQ2hhaW4uZG9GaWx0ZXIoQXBwbGljYXRpb25GaWx0ZXJDaGFpbi5qYXZhOjE2NikgW2NhdGFsaW5hLmphcjo4LjUuNTBdXG5cdGF0IG9yZy5zcHJpbmdmcmFtZXdvcmsud2ViLmZpbHRlci5Gb3JtQ29udGVudEZpbHRlci5kb0ZpbHRlckludGVybmFsKEZvcm1Db250ZW50RmlsdGVyLmphdmE6OTIpIFtzcHJpbmctd2ViLTUuMS42LlJFTEVBU0UuamFyOjUuMS42LlJFTEVBU0VdXG5cdGF0IG9yZy5zcHJpbmdmcmFtZXdvcmsud2ViLmZpbHRlci5PbmNlUGVyUmVxdWVzdEZpbHRlci5kb0ZpbHRlcihPbmNlUGVyUmVxdWVzdEZpbHRlci5qYXZhOjEwNykgW3NwcmluZy13ZWItNS4xLjYuUkVMRUFTRS5qYXI6NS4xLjYuUkVMRUFTRV1cblx0YXQgb3JnLmFwYWNoZS5jYXRhbGluYS5jb3JlLkFwcGxpY2F0aW9uRmlsdGVyQ2hhaW4uaW50ZXJuYWxEb0ZpbHRlcihBcHBsaWNhdGlvbkZpbHRlckNoYWluLmphdmE6MTkzKSBbY2F0YWxpbmEuamFyOjguNS41MF1cblx0YXQgb3JnLmFwYWNoZS5jYXRhbGluYS5jb3JlLkFwcGxpY2F0aW9uRmlsdGVyQ2hhaW4uZG9GaWx0ZXIoQXBwbGljYXRpb25GaWx0ZXJDaGFpbi5qYXZhOjE2NikgW2NhdGFsaW5hLmphcjo4LjUuNTBdXG5cdGF0IG9yZy5zcHJpbmdmcmFtZXdvcmsud2ViLmZpbHRlci5IaWRkZW5IdHRwTWV0aG9kRmlsdGVyLmRvRmlsdGVySW50ZXJuYWwoSGlkZGVuSHR0cE1ldGhvZEZpbHRlci5qYXZhOjkzKSBbc3ByaW5nLXdlYi01LjEuNi5SRUxFQVNFLmphcjo1LjEuNi5SRUxFQVNFXVxuXHRhdCBvcmcuc3ByaW5nZnJhbWV3b3JrLndlYi5maWx0ZXIuT25jZVBlclJlcXVlc3RGaWx0ZXIuZG9GaWx0ZXIoT25jZVBlclJlcXVlc3RGaWx0ZXIuamF2YToxMDcpIFtzcHJpbmctd2ViLTUuMS42LlJFTEVBU0UuamFyOjUuMS42LlJFTEVBU0VdXG5cdGF0IG9yZy5hcGFjaGUuY2F0YWxpbmEuY29yZS5BcHBsaWNhdGlvbkZpbHRlckNoYWluLmludGVybmFsRG9GaWx0ZXIoQXBwbGljYXRpb25GaWx0ZXJDaGFpbi5qYXZhOjE5MykgW2NhdGFsaW5hLmphcjo4LjUuNTBdXG5cdGF0IG9yZy5hcGFjaGUuY2F0YWxpbmEuY29yZS5BcHBsaWNhdGlvbkZpbHRlckNoYWluLmRvRmlsdGVyKEFwcGxpY2F0aW9uRmlsdGVyQ2hhaW4uamF2YToxNjYpIFtjYXRhbGluYS5qYXI6OC41LjUwXVxuXHRhdCBvcmcuc3ByaW5nZnJhbWV3b3JrLmJvb3Qud2ViLnNlcnZsZXQuc3VwcG9ydC5FcnJvclBhZ2VGaWx0ZXIuZG9GaWx0ZXIoRXJyb3JQYWdlRmlsdGVyLmphdmE6MTMwKSBbc3ByaW5nLWJvb3QtMi4xLjQuUkVMRUFTRS5qYXI6Mi4xLjQuUkVMRUFTRV1cblx0YXQgb3JnLnNwcmluZ2ZyYW1ld29yay5ib290LndlYi5zZXJ2bGV0LnN1cHBvcnQuRXJyb3JQYWdlRmlsdGVyLmFjY2VzcyQwMDAoRXJyb3JQYWdlRmlsdGVyLmphdmE6NjYpIFtzcHJpbmctYm9vdC0yLjEuNC5SRUxFQVNFLmphcjoyLjEuNC5SRUxFQVNFXVxuXHRhdCBvcmcuc3ByaW5nZnJhbWV3b3JrLmJvb3Qud2ViLnNlcnZsZXQuc3VwcG9ydC5FcnJvclBhZ2VGaWx0ZXIkMS5kb0ZpbHRlckludGVybmFsKEVycm9yUGFnZUZpbHRlci5qYXZhOjEwNSkgW3NwcmluZy1ib290LTIuMS40LlJFTEVBU0UuamFyOjIuMS40LlJFTEVBU0VdXG5cdGF0IG9yZy5zcHJpbmdmcmFtZXdvcmsud2ViLmZpbHRlci5PbmNlUGVyUmVxdWVzdEZpbHRlci5kb0ZpbHRlcihPbmNlUGVyUmVxdWVzdEZpbHRlci5qYXZhOjEwNykgW3NwcmluZy13ZWItNS4xLjYuUkVMRUFTRS5qYXI6NS4xLjYuUkVMRUFTRV1cblx0YXQgb3JnLnNwcmluZ2ZyYW1ld29yay5ib290LndlYi5zZXJ2bGV0LnN1cHBvcnQuRXJyb3JQYWdlRmlsdGVyLmRvRmlsdGVyKEVycm9yUGFnZUZpbHRlci5qYXZhOjEyMykgW3NwcmluZy1ib290LTIuMS40LlJFTEVBU0UuamFyOjIuMS40LlJFTEVBU0VdXG5cdGF0IG9yZy5hcGFjaGUuY2F0YWxpbmEuY29yZS5BcHBsaWNhdGlvbkZpbHRlckNoYWluLmludGVybmFsRG9GaWx0ZXIoQXBwbGljYXRpb25GaWx0ZXJDaGFpbi5qYXZhOjE5MykgW2NhdGFsaW5hLmphcjo4LjUuNTBdXG5cdGF0IG9yZy5hcGFjaGUuY2F0YWxpbmEuY29yZS5BcHBsaWNhdGlvbkZpbHRlckNoYWluLmRvRmlsdGVyKEFwcGxpY2F0aW9uRmlsdGVyQ2hhaW4uamF2YToxNjYpIFtjYXRhbGluYS5qYXI6OC41LjUwXVxuXHRhdCBvcmcuc3ByaW5nZnJhbWV3b3JrLndlYi5maWx0ZXIuQ2hhcmFjdGVyRW5jb2RpbmdGaWx0ZXIuZG9GaWx0ZXJJbnRlcm5hbChDaGFyYWN0ZXJFbmNvZGluZ0ZpbHRlci5qYXZhOjIwMCkgW3NwcmluZy13ZWItNS4xLjYuUkVMRUFTRS5qYXI6NS4xLjYuUkVMRUFTRV1cblx0YXQgb3JnLnNwcmluZ2ZyYW1ld29yay53ZWIuZmlsdGVyLk9uY2VQZXJSZXF1ZXN0RmlsdGVyLmRvRmlsdGVyKE9uY2VQZXJSZXF1ZXN0RmlsdGVyLmphdmE6MTA3KSBbc3ByaW5nLXdlYi01LjEuNi5SRUxFQVNFLmphcjo1LjEuNi5SRUxFQVNFXVxuXHRhdCBvcmcuYXBhY2hlLmNhdGFsaW5hLmNvcmUuQXBwbGljYXRpb25GaWx0ZXJDaGFpbi5pbnRlcm5hbERvRmlsdGVyKEFwcGxpY2F0aW9uRmlsdGVyQ2hhaW4uamF2YToxOTMpIFtjYXRhbGluYS5qYXI6OC41LjUwXVxuXHRhdCBvcmcuYXBhY2hlLmNhdGFsaW5hLmNvcmUuQXBwbGljYXRpb25GaWx0ZXJDaGFpbi5kb0ZpbHRlcihBcHBsaWNhdGlvbkZpbHRlckNoYWluLmphdmE6MTY2KSBbY2F0YWxpbmEuamFyOjguNS41MF1cblx0YXQgb3JnLmFwYWNoZS5jYXRhbGluYS5jb3JlLlN0YW5kYXJkV3JhcHBlclZhbHZlLmludm9rZShTdGFuZGFyZFdyYXBwZXJWYWx2ZS5qYXZhOjE5OSkgW2NhdGFsaW5hLmphcjo4LjUuNTBdXG5cdGF0IG9yZy5hcGFjaGUuY2F0YWxpbmEuY29yZS5TdGFuZGFyZENvbnRleHRWYWx2ZS5pbnZva2UoU3RhbmRhcmRDb250ZXh0VmFsdmUuamF2YTo5NikgW2NhdGFsaW5hLmphcjo4LjUuNTBdXG5cdGF0IG9yZy5hcGFjaGUuY2F0YWxpbmEuYXV0aGVudGljYXRvci5BdXRoZW50aWNhdG9yQmFzZS5pbnZva2UoQXV0aGVudGljYXRvckJhc2UuamF2YTo1NDMpIFtjYXRhbGluYS5qYXI6OC41LjUwXVxuXHRhdCBvcmcuYXBhY2hlLmNhdGFsaW5hLmNvcmUuU3RhbmRhcmRIb3N0VmFsdmUuaW52b2tlKFN0YW5kYXJkSG9zdFZhbHZlLmphdmE6MTM5KSBbY2F0YWxpbmEuamFyOjguNS41MF1cblx0YXQgb3JnLmFwYWNoZS5jYXRhbGluYS52YWx2ZXMuRXJyb3JSZXBvcnRWYWx2ZS5pbnZva2UoRXJyb3JSZXBvcnRWYWx2ZS5qYXZhOjgxKSBbY2F0YWxpbmEuamFyOjguNS41MF1cblx0YXQgb3JnLmFwYWNoZS5jYXRhbGluYS52YWx2ZXMuUmVtb3RlSXBWYWx2ZS5pbnZva2UoUmVtb3RlSXBWYWx2ZS5qYXZhOjc0NykgW2NhdGFsaW5hLmphcjo4LjUuNTBdXG5cdGF0IG9yZy5hcGFjaGUuY2F0YWxpbmEudmFsdmVzLkFic3RyYWN0QWNjZXNzTG9nVmFsdmUuaW52b2tlKEFic3RyYWN0QWNjZXNzTG9nVmFsdmUuamF2YTo2NzgpIFtjYXRhbGluYS5qYXI6OC41LjUwXVxuXHRhdCBvcmcuYXBhY2hlLmNhdGFsaW5hLmNvcmUuU3RhbmRhcmRFbmdpbmVWYWx2ZS5pbnZva2UoU3RhbmRhcmRFbmdpbmVWYWx2ZS5qYXZhOjg3KSBbY2F0YWxpbmEuamFyOjguNS41MF1cblx0YXQgb3JnLmFwYWNoZS5jYXRhbGluYS5jb25uZWN0b3IuQ295b3RlQWRhcHRlci5zZXJ2aWNlKENveW90ZUFkYXB0ZXIuamF2YTozNDMpIFtjYXRhbGluYS5qYXI6OC41LjUwXVxuXHRhdCBvcmcuYXBhY2hlLmNveW90ZS5odHRwMTEuSHR0cDExUHJvY2Vzc29yLnNlcnZpY2UoSHR0cDExUHJvY2Vzc29yLmphdmE6NjA5KSBbdG9tY2F0LWNveW90ZS5qYXI6OC41LjUwXVxuXHRhdCBvcmcuYXBhY2hlLmNveW90ZS5BYnN0cmFjdFByb2Nlc3NvckxpZ2h0LnByb2Nlc3MoQWJzdHJhY3RQcm9jZXNzb3JMaWdodC5qYXZhOjY1KSBbdG9tY2F0LWNveW90ZS5qYXI6OC41LjUwXVxuXHRhdCBvcmcuYXBhY2hlLmNveW90ZS5BYnN0cmFjdFByb3RvY29sJENvbm5lY3Rpb25IYW5kbGVyLnByb2Nlc3MoQWJzdHJhY3RQcm90b2NvbC5qYXZhOjgxMCkgW3RvbWNhdC1jb3lvdGUuamFyOjguNS41MF1cblx0YXQgb3JnLmFwYWNoZS50b21jYXQudXRpbC5uZXQuTmlvRW5kcG9pbnQkU29ja2V0UHJvY2Vzc29yLmRvUnVuKE5pb0VuZHBvaW50LmphdmE6MTYyMykgW3RvbWNhdC1jb3lvdGUuamFyOjguNS41MF1cblx0YXQgb3JnLmFwYWNoZS50b21jYXQudXRpbC5uZXQuU29ja2V0UHJvY2Vzc29yQmFzZS5ydW4oU29ja2V0UHJvY2Vzc29yQmFzZS5qYXZhOjQ5KSBbdG9tY2F0LWNveW90ZS5qYXI6OC41LjUwXVxuXHRhdCBqYXZhLnV0aWwuY29uY3VycmVudC5UaHJlYWRQb29sRXhlY3V0b3IucnVuV29ya2VyKFRocmVhZFBvb2xFeGVjdXRvci5qYXZhOjExNDkpIFtuYToxLjguMF8yMzJdXG5cdGF0IGphdmEudXRpbC5jb25jdXJyZW50LlRocmVhZFBvb2xFeGVjdXRvciRXb3JrZXIucnVuKFRocmVhZFBvb2xFeGVjdXRvci5qYXZhOjYyNCkgW25hOjEuOC4wXzIzMl1cblx0YXQgb3JnLmFwYWNoZS50b21jYXQudXRpbC50aHJlYWRzLlRhc2tUaHJlYWQkV3JhcHBpbmdSdW5uYWJsZS5ydW4oVGFza1RocmVhZC5qYXZhOjYxKSBbdG9tY2F0LXV0aWwuamFyOjguNS41MF1cblx0YXQgamF2YS5sYW5nLlRocmVhZC5ydW4oVGhyZWFkLmphdmE6NzQ4KSBbbmE6MS44LjBfMjMyXVxuIn0K",
            "PartitionKey": "b70af396c6b80edc88c33c24451e422d"
}
```

Data returned is `Base64` encoded. So, if you decode the data it will be in JSON format as follows:

```json
{
    "level": "ERROR",
    "thread": "nio-8080-exec-9",
    "message": "com.eb.RestController                    : Runtime error occurred\n\njava.lang.ArithmeticException: / by zero\n\tat com.eb.RestController.error(RestController.java:23) ...."
}
```

Groups which we had defined in the regex are emitted as fields.

We see that the log events are getting published to kinesis streams as expected.

Now, let's configure firehose to write the data to S3.

{% include donate.html %}
{% include advertisement.html %}

## Kinesis Firehose

Next step is to create a delivery stream to S3 and integrate it with the kinesis stream which we had set up previously.

We will accomplish this using firehose.

Delivery stream name: **aws-eb-fluentd-s3-firehose**

Choose a source: **aws-eb-fluentd-kinesis-stream** (we choose kinesis stream as an input source here)

Transform: - (we are not planning to do any data transformations)

Destination: Amazon S3 (we choose amazon s3 as our destination source)

Give an S3 bucket and prefix that's to be used for writing the data files e.g. S3 Bucket - eb-catalina-logs

<figure>
    <a href="{{ site.url }}/assets/img/2020/03/firehose-stream.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2020/03/firehose-stream.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2020/03/firehose-stream.png">
            <img src="{{ site.url }}/assets/img/2020/03/firehose-stream.png" alt="">
        </picture>
    </a>
</figure>

Once you configure, send lot of requests to the beanstalk so that firehose writes the data to S3.

Note that firehose buffers the records until it reaches 1 MB or 60 seconds conditions.

<figure>
    <a href="{{ site.url }}/assets/img/2020/03/firehose-s3-data.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2020/03/firehose-s3-data.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2020/03/firehose-s3-data.png">
            <img src="{{ site.url }}/assets/img/2020/03/firehose-s3-data.png" alt="">
        </picture>
    </a>
</figure>

## Conclusion

We have now seen how we can use fluentd and kinesis to write the log events to S3.

[1] We use Fluentd, since as for inputs, Fluentd has a lot more community contributed plugins and libraries. For outputs, you can send not only Kinesis, but multiple destinations like Amazon S3, local file storage, etc.

[2] We use Kinesis streams to buffer the log events.

[3] We use firehose, since it allows to write data to multiple outputs like S3, Splunk, Elasticsearch, Redshift etc.

{% include donate.html %}
{% include advertisement.html %}

## References

<https://docs.fluentd.org/how-to-guides/kinesis-stream>
