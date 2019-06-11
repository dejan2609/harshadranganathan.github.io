---
layout: post
title:  "Jenkins Pipeline as Code"
date:   2018-05-12
excerpt: "Define pipelined job processes with code, stored and versioned in a source repository"
tag:
- jenkins 
- pipeline as code
- jenkinsfile
- continuos delivery with pipeline
- pipeline gdsl
- pipeline replay
- snippet generator
comments: true
---

[Jenkins Pipeline](https://jenkins.io/doc/book/pipeline-as-code/) is a suite of plugins which supports implementing and integrating continuous delivery pipelines into Jenkins.

## Need for Jenkins Pipeline as Code

Over time, Jenkins, like most other self-hosted CI/CD tools resulted in:

* Accumulation/tendency to create vast number of jobs
* Hard and costly maintenance
* Heavy reliance on UI
* Lack of powerful ways to specify conditional logic

## Features of Pipeline as Code

* Pipelines are implemented as code and typically checked into source control, serving as a single source of truth enabling the team members to edit, review, and iterate upon their pipeline.

* Pipelines can optionally stop and wait for human input or approval before continuing the Pipeline run.

* Pipelines support complex real-world requirements
    * Conditional executions
    * Chaining jobs
    * Linear/Complex flows

* The Pipeline plugin supports custom extensions to its DSL and multiple options for integration with other plugins.

<img src="https://i.imgur.com/WshehVd.gif" />

## Pipeline Autocompletion in IntelliJ

To enable code completion follow below steps:

1. Download Pipeline GDSL (http://(yourjenkinsurl)/job/(yourpipelinejob)/pipeline-syntax/gdsl) from your jenkins.
2. Add [Groovy SDK support](https://www.bonusbits.com/wiki/HowTo:Add_Groovy_SDK_to_IntelliJ_IDEA)  to Intellij.
3. Place the GDSL file inside `src` directory of your project and mark the `src` folder as `Sources Root`.
4. Open the GDSL file. Now, IntelliJ will show a message `DSL descriptor file has been changed and isn't currently executed.`. Click `Activate`.
5. Now create your `.groovy` jenkins file and write the code, auto completion will work.

##  Snippet Generator

You can also generate snippets of code for the pipeline steps using the `Snippet Generator` feature available in Jenkins (http://(yourjenkinsurl)/job/(yourpipelinejob)/pipeline-syntax/) which you can then make use of in your pipeline.

<figure>
	<a href="{{ site.url }}/assets/img/2018/05/jenkins-snippet-generator.png"><img src="{{ site.url }}/assets/img/2018/05/jenkins-snippet-generator.png"></a>
</figure>

{% include donate.html %}
{% include advertisement.html %}

## Replay

Replay feature allows you to test your pipeline code without having to commit the changes to your Repo. Once you have tested the code you can then push your changes.

<figure>
	<a href="{{ site.url }}/assets/img/2018/05/jenkins-replay.png"><img src="{{ site.url }}/assets/img/2018/05/jenkins-replay.png"></a>
</figure>

## Jenkins Declarative Pipeline Example

<script src="https://gist.github.com/HarshadRanganathan/97feed7f91b7ae542c994393447f3db4.js"></script>

{% include donate.html %}
{% include advertisement.html %}

## References

<https://www.cloudbees.com/blog/need-jenkins-pipeline>


