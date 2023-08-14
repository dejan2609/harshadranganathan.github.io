---
layout: post
title:  "Github Actions - Pull Request Policy Checks for Terraform Repos"
date:   2023-08-14
excerpt: "Example of writing Github Actions for doing policy checks on PR's for Terraform Repos"
tag:
- understanding github actions
- learn github actions
- quickstart for github actions
- creating actions
- github actions tutorial
- github actions example
- github actions steps
- github actions syntax
- how do i create an action in Github
- how will you create Github actions with an example
comments: true
---

We will look into examples of how to write Github actions to do policy checks on PR's and some gotchas with respect to writing those actions.

{% include repo-card.html repo="github-actions-examples" %}

Workflows have to be created inside `.github/workflows` folder.

Workflows can use any names but the file extension should be either `.yml` or `.yaml`.

For our example, let's create a action file named `policy-check-release-label.yml` inside `.github/workflows` folder.

Purpose of this workflow is to check on every PR, the Step Function template (AWS cloud service) uses expected EMR (AWS Cloud Spark job) version and not stale EMR versions which may have security vulnerabilities or be non-compliant for our project needs.

## Workflow Name

We define a name for the workflow: 

```yaml
name: 'Policy Check: EMR Release Label'
```

These are the names that will be displayed in the Actions page and in PR build status checks.

<figure>
    <a href="{{ site.url }}/assets/img/2023/08/github-actions-pr-status-check.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2023/08/github-actions-pr-status-check.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2023/08/github-actions-pr-status-check.png">
            <img src="{{ site.url }}/assets/img/2023/08/github-actions-pr-status-check.png" alt="">
        </picture>
    </a>
</figure>

<figure>
    <a href="{{ site.url }}/assets/img/2023/08/github-actions-all-workflows.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2023/08/github-actions-all-workflows.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2023/08/github-actions-all-workflows.png">
            <img src="{{ site.url }}/assets/img/2023/08/github-actions-all-workflows.png" alt="">
        </picture>
    </a>
</figure>

## Workflow Trigger

Next, we define, how our workflow needs to be triggered.

```yaml
name: 'Policy Check: EMR Release Label'

on: [pull_request]
```

Above, defines that the workflow needs to be triggered on PR's. You can refine this to make it more specific such as run only if PR's raised for specific branches/tags (or) define the action types such as trigger when PR is closed etc,.

All of these are documented at <https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows>

You can also filter to have workflows triggered only when certain files are changed in the PR to avoid getting invoked for every change e.g. ignore for README file updates and save on billing.


```yaml
on:
  pull_request:
    paths:
      - '**.tpl'
```

There is a shortcoming with above approach of using path based filters. Consider, a scenario where you mandate this workflow needs to pass as part of PR status checks to prevent non-compliant changes to be merged.

If a PR gets raised that doesn't have `**.tpl` file changes, we still need the status check to pass however, since we have added this condition as part of workflow trigger, the workflow doesn't get triggered and hence the build check goes to `Pending` state/`Waiting for status to be reported` blocking your PR to be merged.

This is a limitation and hence we recommend not to use path based filters on PR trigger condition and instead use another approach of filtering and status checks to pass with minimal billing.

<https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/collaborating-on-repositories-with-code-quality-features/troubleshooting-required-status-checks#handling-skipped-but-required-checks>

{% include donate.html %}
{% include advertisement.html %}

## Default Values

You can set default settings that will apply to all jobs/steps in a workflow.

We use it to set default shell for our workflow.

```yaml
name: 'Policy Check: EMR Release Label'

on: [pull_request]

defaults:
  run:
    shell: bash
```

## Environment Variables

You can set environment variables to be used in any steps of all jobs in your workflow.

For example, below we set `TARGET_RELEASE_LABEL` as an environment variable so that we can refer it anywhere/change in one place in the workflow.

Note, there are many context variables that Github actions provides but their scope varies i.e. which part of actions they can be accessed.

Check this documentation on context availability: <https://docs.github.com/en/actions/learn-github-actions/contexts#context-availability>

```yaml
name: 'Policy Check: EMR Release Label'

on: [pull_request]

defaults:
  run:
    shell: bash

env:
  TARGET_RELEASE_LABEL: 6.10.0
```

## Workflow Permissions

GitHub provides a token that you can use to authenticate on behalf of GitHub Actions.

This token is available via `GITHUB_TOKEN` secret.

You will have to explicitly defines certain permissions, for example, to use the token to add a comment to a PR.

We define such permissions in the workflow.

```yaml
name: 'Policy Check: EMR Release Label'

on: [pull_request]

defaults:
  run:
    shell: bash

env:
  TARGET_RELEASE_LABEL: 6.10.0

permissions:
  id-token: write
  contents: read 
  pull-requests: write
```

{% include donate.html %}
{% include advertisement.html %}

## Workflow Jobs

Your workflow contains one or more jobs which can run in sequential order or in parallel. Each job will run inside its own virtual machine runner, or inside a container, and has one or more steps that either run a script that you define or run an action, which is a reusable extension that can simplify your workflow.

<figure>
    <a href="{{ site.url }}/assets/img/2023/08/overview-actions-simple.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2023/08/overview-actions-simple.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2023/08/overview-actions-simple.png">
            <img src="{{ site.url }}/assets/img/2023/08/overview-actions-simple.png" alt="">
        </picture>
    </a>
</figure>

```yaml
name: 'Policy Check: Managed Scaling'

on: [pull_request]

defaults:
  run:
    shell: bash
    
permissions:
  id-token: write
  contents: read 
  pull-requests: write
  
jobs:
  pr_checks:
    name: 'PR Checks'
```

We define a job named `PR Checks` which is the name which will show up in the build status checks (Workflow name followed by Job name), also in action summary view.

<figure>
    <a href="{{ site.url }}/assets/img/2023/08/github-actions-pr-status-check.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2023/08/github-actions-pr-status-check.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2023/08/github-actions-pr-status-check.png">
            <img src="{{ site.url }}/assets/img/2023/08/github-actions-pr-status-check.png" alt="">
        </picture>
    </a>
</figure>

<figure>
    <a href="{{ site.url }}/assets/img/2023/08/actions-summary.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2023/08/actions-summary.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2023/08/actions-summary.png">
            <img src="{{ site.url }}/assets/img/2023/08/actions-summary.png" alt="">
        </picture>
    </a>
</figure>

## Workflow Steps

A job contains a sequence of tasks called steps. Steps can run commands, run setup tasks, or run an action in your repository, a public repository, or an action published in a Docker registry. 

### Checkout Repo

Our first step is to checkout the workspace, so we use another action which performs it for us `actions/checkout@v3`.

You can invoke a public action using the version tag, action in same repo or reference it from other container registries.

```yaml
jobs:
  pr_checks:
    name: 'PR Checks'
        
    steps:
      - name: Checkout
        uses: actions/checkout@v3
```

### Changed Files

Previously, we recommended not to use path based filters on workflow triggers as they block PR status checks.

As a workaround, one of the approaches is to use another public action `tj-actions/changed-files` which helps to get list of all changed pull request files (added, copied, modified, deleted, renamed, type changed, unmerged, unknown).

```yaml
jobs:
  pr_checks:
    name: 'PR Checks'
        
    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: Get Changed Files
        id: changed-files
        uses: tj-actions/changed-files@v29.0.7
        with:
          files: '**/*.tpl'
```

We can use `files` input to define patterns to be matched for returning changed files instead of all changed files.

In order to skip execution of other steps if the PR doesn't contain the file we are looking for, we can use the `if` conditional checks on the steps. This helps to break the execution flow and return success if the PR has changes e.g. just README update which we aren't interested on for our policy checks but would require the build checks to pass on.

```yaml
jobs:
  pr_checks:
    name: 'PR Checks'
        
    steps:
        - name: Validate Policy
          id: validate-policy 
          if: steps.changed-files.outputs.any_changed == 'true'
```

For example, in above, the step `Validate Policy` will be skipped based on the if condition i.e. we use the outputs of `changed-files` action based on filters to determine if the PR has any changed files we are interested in using the expression `steps.changed-files.outputs.any_changed == 'true'`.

You can refer the documentation of public actions to see what outputs they produce which can be referenced using the steps context as follows: `steps.<step_id>.outputs.<output_name>`

Complete file is as follows:

```yaml
name: 'Policy Check: EMR Release Label'

on: [pull_request]

defaults:
  run:
    shell: bash
    
env:
  TARGET_RELEASE_LABEL: 6.10.0
  
permissions:
  id-token: write
  contents: read 
  pull-requests: write
  
jobs:
  pr_checks:
    name: 'PR Checks'
        
    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: Get Changed Files
        id: changed-files
        uses: tj-actions/changed-files@v29.0.7
        with:
          files: '**/*.tpl'

      - name: Validate Policy
        id: validate-policy 
        if: steps.changed-files.outputs.any_changed == 'true'
```

{% include donate.html %}
{% include advertisement.html %}