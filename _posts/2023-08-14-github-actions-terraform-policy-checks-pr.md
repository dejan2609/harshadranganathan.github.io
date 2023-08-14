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

## Workflow Permissions

## Workflow Steps

{% include donate.html %}
{% include advertisement.html %}