---
layout: post
title: "AWS Lambda Layers for Python"
date: 2020-02-29
excerpt: "Use libraries in your lambda function without needing to include them in your deployment package"
tag:
    - aws lambda layers example
    - aws lambda layers python
    - aws lambda layers python example
    - aws lambda layer python pip
    - aws lambda layer python package
    - aws lambda layer for python
    - aws lambda layers python dependencies
    - getting started with aws lambda layers for python
    - aws lambda python import layer
    - create lambda layer python
    - aws lambda layers
comments: true
---

## Lambda Layers

A layer is a ZIP archive that contains libraries, a custom runtime, or other dependencies.

## Need for Lambda Layers

-   With layers, you can use libraries in your function without needing to include them in your deployment package.

-   Layers let you keep your deployment package small, which makes development easier.

## Creating Lambda Layer

Main use case for lambda layers is to include the runtime dependencies for your function code by placing them in a layer, so that your deployment package will be small and you can avoid any packaging errors.

Let's consider we have a lambda function code which is used to trigger EMR jobs based on some input criteria.

We could extract the code to trigger EMR job as a dependency and place it in a layer, so, that all your lambda functions in your accounts which need to trigger EMR jobs can just import the layer and call the required functions without having to bundle the dependencies every time with your function code.

Consider below python dependency which is used for triggering EMR jobs. Let's convert this into a lambda layer.

{% include repo-card.html repo="aws-emr-launcher" %}

### Packaging With Dependencies

This project uses Pipfile for dependency management.

Let's install the dependencies required for this project and then package it so that we could place it in a layer.

Below is a sample script which performs these actions:

```bash
#!/bin/bash

PACKAGE_NAME="aws-emr-launcher-$(python setup.py --version).zip"

function cleanup()  {
    # remove target folder
    rm -rf target
}

function install_dependencies() {
    mkdir target
    # install pipenv as it is used by the project for dependency management
    pip3 install pipenv
    # generate requirements file from Pipfile.lock
    pipenv lock --requirements > requirements.txt
    # install the project dependencies inside target/python folder
    pip3 install --target=target/python -r requirements.txt
}

function copy_source_files() {
    # recursively copy all the source files to target/python folder
    cp -R emrlauncher/ target/python
}

function package() {
    # recursively zip contents inside target folder
    cd target/ && zip -r ${PACKAGE_NAME} .
}

cleanup
install_dependencies
copy_source_files
package
```

When you run this bash script, it will perform below actions inside the `target/python` folder.

1. Install the dependencies specified in `Pipfile.lock`.

2. Copy the module contents.

Finally, it will generate zip package with all these files inside `target` folder.

<figure class="half">
    <a href="{{ site.url }}/assets/img/2020/02/lambda-layers-target-folder-contents.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2020/02/lambda-layers-target-folder-contents.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2020/02/lambda-layers-target-folder-contents.png">
            <img src="{{ site.url }}/assets/img/2020/02/lambda-layers-target-folder-contents.png" alt="">
        </picture>
    </a>
</figure>

Important thing to note here is that the source files and dependencies are placed inside `python` folder in the zip package. This ensures that your function code will have access to the library included as a layer.

<figure class="half">
    <a href="{{ site.url }}/assets/img/2020/02/lambda-layers-package-contents.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2020/02/lambda-layers-package-contents.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2020/02/lambda-layers-package-contents.png">
            <img src="{{ site.url }}/assets/img/2020/02/lambda-layers-package-contents.png" alt="">
        </picture>
    </a>
</figure>

{% include donate.html %}
{% include advertisement.html %}

### Publish Lambda Layer

Next step is to publish this package as a lambda layer to AWS.

Below is the AWS CLI command which performs this functionality:

```bash
echo $(aws lambda publish-layer-version --layer-name "aws-emr-launcher" \
--description "Library that enables to provision emr clusters with yaml config files. Tag version: $(python setup.py --version)" \
--compatible-runtime "python3.6" \
--zip-file fileb://target/aws-emr-launcher-$(python setup.py --version).zip)
```

Every time you run this command it publishes a new layer version.

You also specify the compatible runtimes for this layer so that only lambda function codes which use these runtimes would be able to import the layer.

Alternatively, you could also place the package in S3 and publish it as a layer:

```bash
echo $(aws lambda publish-layer-version --layer-name "aws-emr-launcher" \
--description "Library that enables to provision emr clusters with yaml config files. Tag version: $(python setup.py --version)" \
--compatible-runtime "python3.6" \
--content S3Bucket=artifacts,S3Key=aws-emr-launcher-0.1.0.zip
```

You can see the published lambda layer in the AWS console.

<figure>
    <a href="{{ site.url }}/assets/img/2020/02/published-lambda-layers.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2020/02/published-lambda-layers.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2020/02/published-lambda-layers.png">
            <img src="{{ site.url }}/assets/img/2020/02/published-lambda-layers.png" alt="">
        </picture>
    </a>
</figure>

{% include donate.html %}
{% include advertisement.html %}

## Configure Lambda Function to Use Layer

We now update our lambda function configuration with the required lambda layer version.

```bash
aws lambda update-function-configuration \
  --function-name <value> \
  --layers "arn:aws:lambda:us-east-1::layer:aws-emr-launcher:1"
```

Once we link the layer to our function code, we can then just import the library in our function code as follows:

```python
from emrlauncher.data_loader import trigger_data_load

def start(event, context):
  trigger_data_load(...)
```

Lambda runtimes include paths in the `/opt` directory to ensure that your function code has access to libraries that are included in layers.

Let's list the contents of dir `/opt/python` (earlier we had copied our library into python folder when we packaged it). You can see that our library source files and dependencies are available at runtime for our function code.

<figure>
    <a href="{{ site.url }}/assets/img/2020/02/lambda-runtime-directory-output.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2020/02/lambda-runtime-directory-output.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2020/02/lambda-runtime-directory-output.png">
            <img src="{{ site.url }}/assets/img/2020/02/lambda-runtime-directory-output.png" alt="">
        </picture>
    </a>
</figure>

## Limits

-   A function can use up to 5 layers at a time.

-   The total unzipped size of the function and all layers can't exceed the unzipped deployment package size limit of 250 MB.

{% include donate.html %}
{% include advertisement.html %}

## References

<https://docs.aws.amazon.com/lambda/latest/dg/configuration-layers.html>
