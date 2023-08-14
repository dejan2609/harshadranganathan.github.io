---
layout: post
title:  "Github Actions - Pull Request Policy Checks"
date:   2023-08-14
excerpt: "Example of writing Github Actions for doing policy checks on PR's"
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


### Run Commands

If the PR contains the files we are interested in, our `Validate Policy` step will be executed.

We can use `run` to execute multiple commands in a shell environment.

Note, that `run` is not the same as say `bash` execution. It's an action construct which does variable substitution first i.e. replaces values for supported contexts specified using placeholders {% raw %}`${{ }}`{% endraw %} and then supplies the commands to shell environment.

```yaml
name: 'Policy Check: EMR Release Label'

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
        run: |
            echo 'Hello'
            echo 'World'
```

### Validate Policy

Let's start writing out the logic for validating the changed files.

Before we do that, there are 3 temporary files that get created by the runner for each workflow execution we need to understand:

| |Description |Example|Limitations|
|--|--|--|--|
|**GITHUB_ENV** |You can make an environment variable available to any subsequent steps in a workflow job by defining or updating the environment variable and writing this to the GITHUB_ENV environment file. | echo "{environment_variable_name}={value}" >> "$GITHUB_ENV"| |
|**GITHUB_OUTPUT** |Sets a step's output parameter. Note that the step will need an id to be defined to later retrieve the output value. |echo "{name}={value}" >> "$GITHUB_OUTPUT" |Outputs are Unicode strings, and can be a maximum of 1 MB. The total of all outputs in a workflow run can be a maximum of 50 MB. |
|**GITHUB_STEP_SUMMARY** |You can set some custom Markdown for each job so that it will be displayed on the summary page of a workflow run and doesn't need to go to logs.  | echo "{markdown content}" >> $GITHUB_STEP_SUMMARY|GITHUB_STEP_SUMMARY is unique for each step in a job. |
{:.table-striped}

We will be using them in our policy validation logic.

Firstly, we want the results of our validation to be shown in Job Summary page (when you open the action execution run) so that the team members don't have to look into the logs as to what happened.

<figure>
    <a href="{{ site.url }}/assets/img/2023/08/github-actions-job-summary.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2023/08/github-actions-job-summary.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2023/08/github-actions-job-summary.png">
            <img src="{{ site.url }}/assets/img/2023/08/github-actions-job-summary.png" alt="">
        </picture>
    </a>
</figure>

We generate such summary statements by continuously appending the markdown content to the `$GITHUB_STEP_SUMMARY` file as shown below. Note that the file will be unique for each step so your content will be lost in the subsequent steps which affects your design.

```yaml
jobs:
  pr_checks:
    name: 'PR Checks'

    - name: Validate Policy
      id: validate-policy 
      if: steps.changed-files.outputs.any_changed == 'true'
      run: |
        {
            echo "|Result |File |Reason |" 
            echo "|--- |--- |--- |" 
        } >> "$GITHUB_STEP_SUMMARY"

```

Also, we need to indicate if the workflow execution was success or not. For that purpose, we store the result in `$GITHUB_OUTPUT` file which can be accessed in later steps.

```yaml
jobs:
  pr_checks:
    name: 'PR Checks'

    - name: Validate Policy
      id: validate-policy 
      if: steps.changed-files.outputs.any_changed == 'true'
      run: |
        {
            echo "|Result |File |Reason |" 
            echo "|--- |--- |--- |" 
        } >> "$GITHUB_STEP_SUMMARY"

        echo "result=pass" >> "$GITHUB_OUTPUT"

```

We then write the execution logic and append the markdown results. In our example usecase, we would like to pass the PR if it uses the expected release label.

So, we grep the file to see if that's the case and write the appropriate result. 

Since, we are executing the commands in `run` we have access to contexts such as `steps, env` etc, which we can use to get workflow values.

```yaml
jobs:
  pr_checks:
    name: 'PR Checks'

    - name: Validate Policy
      id: validate-policy 
      if: steps.changed-files.outputs.any_changed == 'true'
      run: |
        {
            echo "|Result |File |Reason |" 
            echo "|--- |--- |--- |" 
        } >> "$GITHUB_STEP_SUMMARY"

        echo "result=pass" >> "$GITHUB_OUTPUT"

        for file in {% raw %}${{ steps.changed-files.outputs.all_changed_files }};{% endraw %} do
            if [ "${file: -4}" == ".tpl" ]; then
              if ! grep -q emr-$TARGET_RELEASE_LABEL "$file"; then
                echo "|👎 |$file | Not using EMR release label $TARGET_RELEASE_LABEL |" >> $GITHUB_STEP_SUMMARY
                echo "result=fail" >> "$GITHUB_OUTPUT"
              else
                echo "|👍  |$file | Using EMR release label $TARGET_RELEASE_LABEL |" >> $GITHUB_STEP_SUMMARY
              fi
            fi
        done

        echo "" >> $GITHUB_STEP_SUMMARY
        echo "Update your template to use \"ReleaseLabel\": \"emr-$TARGET_RELEASE_LABEL\"" >> $GITHUB_STEP_SUMMARY

```

As you can see above, we iterate the changed files, and then grep based on our condition.

If the changes are compliant we append the success result as markdown table with emoji's and if not otherwise.

Also, note that if the result is a failure, we can override the content of the `$GITHUB_OUTPUT` file which we will be using in later steps to indicate success/failure of the workflow execution.

```bash
echo "result=fail" >> "$GITHUB_OUTPUT"
```


Finally, we also append the `$GITHUB_STEP_SUMMARY` to `$GITHUB_ENV`. Reason for doing so is the Actions UI is badly designed in such a way that the Job Summary is useless.

If any of the actions you use have any warnings, currently you can't suppress them and they pollute the summary page in such a way that your Job Summary goes to the bottom.

Also, clicking on the execution links in PR status checks doesn't take you to the Job Summary but to the logs first.

<figure>
    <a href="{{ site.url }}/assets/img/2023/08/github-actions-annotations.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2023/08/github-actions-annotations.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2023/08/github-actions-annotations.png">
            <img src="{{ site.url }}/assets/img/2023/08/github-actions-annotations.png" alt="">
        </picture>
    </a>
</figure>

```bash
echo "summary<<EOF"  >> $GITHUB_ENV
cat $GITHUB_STEP_SUMMARY >> $GITHUB_ENV
echo "EOF" >> $GITHUB_ENV
```

You will have to use above syntax to pass multi-line string to Github environment file.

{% include donate.html %}
{% include advertisement.html %}

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
        run: |
          {
            echo "|Result |File |Reason |" 
            echo "|--- |--- |--- |" 
          } >> "$GITHUB_STEP_SUMMARY"
          echo "result=pass" >> "$GITHUB_OUTPUT"
          
          for file in {% raw %}${{ steps.changed-files.outputs.all_changed_files }};{% endraw %} do
            if [ "${file: -4}" == ".tpl" ]; then
              if ! grep -q emr-$TARGET_RELEASE_LABEL "$file"; then
                echo "|👎 |$file | Not using EMR release label $TARGET_RELEASE_LABEL |" >> $GITHUB_STEP_SUMMARY
                echo "result=fail" >> "$GITHUB_OUTPUT"
              else
                echo "|👍  |$file | Using EMR release label $TARGET_RELEASE_LABEL |" >> $GITHUB_STEP_SUMMARY
              fi
            fi
          done
          
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "Update your template to use \"ReleaseLabel\": \"emr-$TARGET_RELEASE_LABEL\"" >> $GITHUB_STEP_SUMMARY
          
          echo "summary<<EOF"  >> $GITHUB_ENV
          cat $GITHUB_STEP_SUMMARY >> $GITHUB_ENV
          echo "EOF" >> $GITHUB_ENV
```

### Add PR Comment

We also publish the result to the PR as a comment so that team's don't have to navigate to the actions summary page.

This can be achieved by using `actions/github-script` and `$GITHUB_TOKEN` secret which has token with permissions to add a comment to the PR.

Our summary is available via environment variable to which we set in last step which we can access using `process.env.summary`. 

```yaml
jobs:
  pr_checks:
    name: 'PR Checks'

    steps:
      - name: Update Pull Request
        if: steps.changed-files.outputs.any_changed == 'true'
        uses: actions/github-script@v6
        with:
          github-token: {% raw %}${{ secrets.GITHUB_TOKEN }}{% endraw %}
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: process.env.summary
            })
```

<figure>
    <a href="{{ site.url }}/assets/img/2023/08/github-bot-pr-comments.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2023/08/github-bot-pr-comments.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2023/08/github-bot-pr-comments.png">
            <img src="{{ site.url }}/assets/img/2023/08/github-bot-pr-comments.png" alt="">
        </picture>
    </a>
</figure>

### Action Result

Finally, you need to indicate the action result for the PR status check to pass/fail.

This can be done by accessing the step output and setting exit code.

```yaml
jobs:
  pr_checks:
    name: 'PR Checks'

    steps:
      - name: Result
        if: steps.changed-files.outputs.any_changed == 'true' && steps.validate-policy.outputs.result != 'pass'
        run: exit 1
```

<figure>
    <a href="{{ site.url }}/assets/img/2023/08/github-actions-pr-status-check.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2023/08/github-actions-pr-status-check.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2023/08/github-actions-pr-status-check.png">
            <img src="{{ site.url }}/assets/img/2023/08/github-actions-pr-status-check.png" alt="">
        </picture>
    </a>
</figure>

Complete file:

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
        run: |
          {
            echo "|Result |File |Reason |" 
            echo "|--- |--- |--- |" 
          } >> "$GITHUB_STEP_SUMMARY"
          echo "result=pass" >> "$GITHUB_OUTPUT"
          
          for file in ${{ steps.changed-files.outputs.all_changed_files }}; do
            if [ "${file: -4}" == ".tpl" ]; then
              if ! grep -q emr-$TARGET_RELEASE_LABEL "$file"; then
                echo "|👎 |$file | Not using EMR release label $TARGET_RELEASE_LABEL |" >> $GITHUB_STEP_SUMMARY
                echo "result=fail" >> "$GITHUB_OUTPUT"
              else
                echo "|👍  |$file | Using EMR release label $TARGET_RELEASE_LABEL |" >> $GITHUB_STEP_SUMMARY
              fi
            fi
          done
          
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "Update your template to use \"ReleaseLabel\": \"emr-$TARGET_RELEASE_LABEL\"" >> $GITHUB_STEP_SUMMARY
          
          echo "summary<<EOF"  >> $GITHUB_ENV
          cat $GITHUB_STEP_SUMMARY >> $GITHUB_ENV
          echo "EOF" >> $GITHUB_ENV
          
      - name: Update Pull Request
        if: steps.changed-files.outputs.any_changed == 'true'
        uses: actions/github-script@v6
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: process.env.summary
            })
      
      - name: Result
        if: steps.changed-files.outputs.any_changed == 'true' && steps.validate-policy.outputs.result != 'pass'
        run: exit 1
```

{% include donate.html %}
{% include advertisement.html %}

## PR Status Checks

In order to mandate these PR status checks, ensure all your workflows have same job name so that all of them are executed for every PR.

In your branch protection rules, enable below setting and add the job names which needs to be mandatory to pass.

<figure>
    <a href="{{ site.url }}/assets/img/2023/08/github-pr-required-status-checks.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2023/08/github-pr-required-status-checks.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2023/08/github-pr-required-status-checks.png">
            <img src="{{ site.url }}/assets/img/2023/08/github-pr-required-status-checks.png" alt="">
        </picture>
    </a>
</figure>

{% include donate.html %}
{% include advertisement.html %}