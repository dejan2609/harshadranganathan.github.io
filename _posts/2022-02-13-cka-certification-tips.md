---
layout: post
title:  "Certified Kubernetes Administrator (CKA) Preparation And Exam Tips"
date:   2022-02-13
excerpt: "Preparation and exam tips to pass Kubernetes Administrator certification exam"
tag:
- kubernetes certification training
- kodekloud
- linux foundation cka training
- cka results
- kubernetes practice exam
- kubernetes certified administrator practice exam
- cka questions github
- killer sh
- cka preparation time
- cka weekly challenge
- cka exam content
- kubernetes certification
- kubernetes certification administrator
- linux foundation kubernetes certification
- certified kubernetes administrator
- cncf certified kubernetes application administrator (cka) exam
- cka certification
- kubernetes documentation
- cka exam preparation
- cncf kubernetes administrator certification
- cloud native foundation cka
- cka practice questions
comments: true
---

## Preparation

### Curriculum

Go through the exam curriculum at below link to understand the concepts in which you'll be tested:

[https://github.com/cncf/curriculum](https://github.com/cncf/curriculum)

### Documentation

Learn the kubernetes concepts and tasks through below documentation:

[https://kubernetes.io/docs/concepts/](https://kubernetes.io/docs/concepts/)

[https://kubernetes.io/docs/tasks/](https://kubernetes.io/docs/tasks/)

### Practice Questions

[https://github.com/walidshaari/Kubernetes-Certified-Administrator](https://github.com/walidshaari/Kubernetes-Certified-Administrator)

[https://github.com/ahmetb/kubernetes-network-policy-recipes](https://github.com/ahmetb/kubernetes-network-policy-recipes)

[https://www.techiescorner.in/upgrading-kubernetes-with-kubeadm-cka-certification-part3/](https://www.techiescorner.in/upgrading-kubernetes-with-kubeadm-cka-certification-part3/)

### Practice Scenarios

[https://www.katacoda.com/learn?q=kubernetes](https://www.katacoda.com/learn?q=kubernetes)

### Practice Exams

[https://killer.sh/](https://killer.sh/) (You get 2 free attempts as part of your certification registration - activate it from your exam schedule page)

[https://kodekloud.com/courses/certified-kubernetes-administrator-cka/](https://kodekloud.com/courses/certified-kubernetes-administrator-cka/) (Lightning labs and Mock exams)

{% include donate.html %}
{% include advertisement.html %}

## Before Exam

### Bookmarks

You are allowed one additional tab in your browser to refer kubernetes documentation.

Create bookmarks to various concepts/tasks so that you can quickly refer them instead of searching as it'll save you some time.

You can import the bookmarks from here - <https://gist.github.com/HarshadRanganathan/158ac3182cacc4f37364b932a2f05d9c>

<figure>
    <a href="{{ site.url }}/assets/img/2022/02/cka-bookmarks.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2022/02/cka-bookmarks.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2022/02/cka-bookmarks.png">
            <img src="{{ site.url }}/assets/img/2022/02/cka-bookmarks.png" alt="">
        </picture>
    </a>
</figure>

## Exam Tips

### Kubectl Alias Configuration

Your bash is already configured with kubectl autocompletion and `k` alias.

As soon as your exam timer starts, the first step is to configure any needed aliases.

This will save you a lot of time as you attempt your questions.

```bash
# use a shorthand alias for setting namespace
echo "alias kn='k config set-context --current --namespace '" >> ~/.bashrc
```

Finally, activate your configuration by running below command:

```bash
source ~/.bashrc
```

With this you can get auto completion for your kubectl commands and use aliases.

<img src="https://i.imgur.com/7PGBytF.gif" />

To change namespace, use `kn` alias:

```bash
$ kn default
```

To run kubectl commands, use `k` alias:

```bash
$ k create 
```

### Export Arguments

Two of the frequently used argument sets in your kubectl commands will be:

Generate yaml config with dry run command:

```bash
--dry-run=client -o yaml
```

Force kill your pods or deployments (as you might want to re-create them):

```bash
--grace-period=0 --force
```

We can export these as variables to your shell:

```bash
export do="--dry-run=client -o yaml"
export kill="--grace-period=0 --force"
```

You can then simply run your commands as below which will save some time when you use these args repeatedly:

```bash
# to generate yaml file of your deployment
k create deployment nginx --image=nginx $do > nginx.yaml

# to force kill your deployment
k delete deployments.apps nginx $kill
```

{% include donate.html %}
{% include advertisement.html %}

### Vim Yaml Configuration

To have better support for yaml indentation, add below configuration to your `~/.vimrc` file.

```bash
set tabstop=2
set shiftwidth=2
set expandtab
```

### Vim Commands

If you are using vim editor for your yaml files, it's good to know below commands as they will help you to perform your tasks faster.

| Task | Command |
| --- | --- |
| Show line numbers | Press the Esc key if you are currently in insert or append mode<br/>Press : (the colon). The cursor should reappear at the lower left corner of the screen next to a : prompt<br/>Enter command `set number`<br/>Column of sequential line numbers will then appear at the left side of the screen|
| Goto line | Press the Esc key if you are currently in insert or append mode<br/>Press : (the colon). The cursor should reappear at the lower left corner of the screen next to a : prompt<br/>Enter the line number where you need the cursor to go e.g. `22`|
| Copy/Cut lines| Move the cursor to the start of line from where you need to cut/copy<br/>Press the Esc key followed by `V` to go to visual mode<br/>Press `d` to cut the lines (or) `y` to copy them|
| Paste lines | To paste the copied lines in visual mode, go to command mode by pressing ESC key<br/>Press `Shift + p` key combination to paste the content|
| Tab multiple lines| Enter VISUAL LINE mode by holding [SHIFT] and hitting the “v” key.<br/>Use the arrow keys or “j” and “k” to select the lines you want to indent.<br/>Hit the “>” character (hold [SHIFT] and hit the “.” key) to indent.|
{:.table-striped}

<br/>

<img src="https://i.imgur.com/j1aaLlQ.gif" />

### Documentation

You are allowed access to one additional tab to refer documentation. 

For certain tasks, imperative commands may not be sufficient to create resources.

Instead of writing the yaml files from scratch by referring the API reference documentation, try to find code snippets in concepts/tasks documentation, copy and paste them to yaml files.

Below gives a walktrough of creating persistent volume claims by copying documentation code snippets.

<br/>

<img src="https://i.imgur.com/w7084JK.gif" />

{% include donate.html %}
{% include advertisement.html %}

### Question Priority

This is the most important tip. Don't start answering questions from the beginning.

During the exam, you'll have access to web based notepad.

Spend two minutes to quickly go through all the questions and capture their percentage score in notepad.

For example, I ordered the questions by their score. Question 3 is of 1% while question 12 is of 12%.

```text
1% - 3
3% - 5,7,9
5% - 11,15
7% - 19,1,2
12% - 12
```

Then, start working on questions with highest score percentage. You'll notice that some questions with high percentage are relatively simple when compared to questions with low percentage score.

Even if you run out of time during the exam, this approach will help you to score the maximum.

### Cluster And Namespace

This is one area where even if you worked out the question well you might end up with 0 score.

Always, ensure that you perform below tasks when you attempt a question:

[1] Set the correct cluster context. (Command will be available in the question)

[2] Set the correct namespace. If the namespace is not given, then use `default`. 

Make sure when you switch between questions, you reset back to `default` if no namespace is given. Otherwise, you may end up creating resources in the namespace given for previous question

[3] As a safety measure, provide namespace in your imperative commands (or) in your yaml files.

### Use Help Option

You don't need to remember all the options available for a command or the full command itself.

kubectl has a nice feature flag `-h` which displays some useful information -

[1] Examples of how to use the command with options

[2] List of available options

This is handy where you can just copy/paste from examples and edit to your needs.

```bash
$ k create deployment -h
Create a deployment with the specified name.

Aliases:
deployment, deploy

Examples:
  # Create a deployment named my-dep that runs the busybox image.
  kubectl create deployment my-dep --image=busybox

  # Create a deployment with command
  kubectl create deployment my-dep --image=busybox -- date

  # Create a deployment named my-dep that runs the nginx image with 3 replicas.
  kubectl create deployment my-dep --image=nginx --replicas=3

  # Create a deployment named my-dep that runs the busybox image and expose port 5701.
  kubectl create deployment my-dep --image=busybox --port=5701

Options:
      --allow-missing-template-keys=true: If true, ignore any errors in templates when a field or map key is missing in
the template. Only applies to golang and jsonpath output formats.
      --dry-run='none': Must be "none", "server", or "client". If client strategy, only print the object that would be
sent, without sending it. If server strategy, submit server-side request without persisting the resource.
      --field-manager='kubectl-create': Name of the manager used to track field ownership.
      --image=[]: Image names to run.
  -o, --output='': Output format. One of:
json|yaml|name|go-template|go-template-file|template|templatefile|jsonpath|jsonpath-as-json|jsonpath-file.
      --port=-1: The port that this container exposes.
  -r, --replicas=1: Number of replicas to create. Default is 1.
      --save-config=false: If true, the configuration of current object will be saved in its annotation. Otherwise, the
annotation will be unchanged. This flag is useful when you want to perform kubectl apply on this object in the future.
      --template='': Template string or path to template file to use when -o=go-template, -o=go-template-file. The
template format is golang templates [http://golang.org/pkg/text/template/#pkg-overview].
      --validate=true: If true, use a schema to validate the input before sending it

Usage:
  kubectl create deployment NAME --image=image -- [COMMAND] [args...] [options]
```

### Time Tracking

Don't spend too much time on a particular question.

If the solution doesn't work, move on to the next priority question.

At the very end of the exam, when you just have a bunch of low score questions, skip them and come back the high priority ones that didn't work out for you earlier and solve them.


{% include donate.html %}
{% include advertisement.html %}

## References

<https://medium.com/@tuannvm/certified-kubernetes-application-developer-ckad-in-a-nutshell-9540ff58c542>

<https://medium.com/@iizotov/exam-notes-ckad-c1c4f9fb9e73>

<https://medium.com/@kgamanji/how-i-passed-my-ckad-with-97-6b54dcffa72f>

<https://medium.com/backbase/kubernetes-application-developer-certification-tips-1d82f20c0ea7>

<https://medium.com/bb-tutorials-and-thoughts/practice-enough-with-these-questions-for-the-ckad-exam-2f42d1228552>

<https://medium.com/chotot/tips-tricks-to-pass-certified-kubernetes-application-developer-ckad-exam-67c9e1b32e6e>