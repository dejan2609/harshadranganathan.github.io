---
layout: post
title:  "Getting started with PySpark on Windows and PyCharm"
date:   2019-05-13
excerpt: "Setting up PySpark on Windows and running the scripts in PyCharm IDE"
tag:
- pyspark 
- windows
- intellij
- pycharm
- winutils
- spark
- setup spark development environment pycharm and python
- working with pyspark in pycharm
- pyspark tutorial
comments: true
---

## Pre-Requisites

Both Java and Python are installed in your system.

## Getting started with Spark on Windows

[Download Apache Spark](http://spark.apache.org/downloads.html) by choosing a Spark release (e.g. 2.2.0) and package type (e.g. Pre-built for Apache Hadoop 2.7 and later).

Extract the Spark tar file to a directory e.g. C:\Spark\spark-2.2.0-bin-hadoop2.7

GIT clone [winutils](https://github.com/steveloughran/winutils) to your system e.g. cloned to directory C:\winutils

Add below system environment variables where `HADOOP_HOME` is set to the winutils hadoop binary location (depending on the version of pre-built chosen earlier)  and `SPARK_HOME` is set to the Spark location which we had extracted in step 2.
{% highlight plaintext %}
HADOOP_HOME=C:\winutils\hadoop-2.7.1
SPARK_HOME=C:\Spark\spark-2.2.0-bin-hadoop2.7
{% endhighlight %}

Create a new folder `tmp/hive` in your C: drive.

Provide permissions for the folder `tmp/hive` using `winutils.exe` by running below command in your command prompt
{% highlight cmd %}
C:>C:\winutils\hadoop-2.7.1\bin\winutils.exe chmod 777 C:\tmp\hive
{% endhighlight %}

Now validate the setup by running `spark-shell` from your `SPARK_HOME` directory in your command prompt
{% highlight cmd %}
C:\Spark\spark-2.2.0-bin-hadoop2.7>bin\spark-shell
{% endhighlight %}

<figure>
    <a href="{{ site.url }}/assets/img/2018/05/spark-shell.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2018/05/spark-shell.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2018/05/spark-shell.png">
            <img src="{{ site.url }}/assets/img/2018/05/spark-shell.png" alt="">
        </picture>
    </a>
</figure>

{% include donate.html %}
{% include advertisement.html %}

## PyCharm Configuration

Configure the python interpreter to support pyspark by following the below steps

1. Create a new virtual environment (File -> Settings -> Project Interpreter -> select `Create Virtual Environment` in the settings option)
2. In the `Project Interpreter` dialog, select `More` in the settings option and then select the new virtual environment. Now select `Show paths for the selected interpreter` option.
2. Add the paths for `Spark Python` and `Spark Py4j` to this virtual environment as shown in the screenshot below.

<figure>
    <a href="{{ site.url }}/assets/img/2018/05/pycharm-interpreter-paths.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2018/05/pycharm-interpreter-paths.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2018/05/pycharm-interpreter-paths.png">
            <img src="{{ site.url }}/assets/img/2018/05/pycharm-interpreter-paths.png" alt="">
        </picture>
    </a>
</figure>

Create a new run configuration for `Python` in the dialog `Run\Debug Configurations`.

In the `Python interpreter` option select the interpreter which we had created in the first step. Also in the Environment variables option make sure `Include parent environment variables` is checked.

You can now add your pyspark script to the project and use this run configuration to execute it in a Spark context.

{% include donate.html %}
{% include advertisement.html %}