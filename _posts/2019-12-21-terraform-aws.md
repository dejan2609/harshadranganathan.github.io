---
layout: post
title: "Terraform - AWS"
date: 2019-12-21
excerpt: "Infrastructure as code tool with multiple cloud providers"
tag:
    - terraform
    - aws
comments: true
---

## Terraform

[Terraform](https://www.terraform.io/) is an infrastructure as code tool that helps to provision and manage any cloud, infrastructure, or service.

It allows you to version your infrastructure and automate provisioning.

You can plan and predict changes, create reproducible infrastructure and create shared modules for common infrastructure patterns.

## Installation

[Download latest terraform](https://releases.hashicorp.com/terraform/) package and extract it to a folder in your system.

Add the location to your system's `PATH`.

Verify your installation by running below command.

```bash
$ terraform -help
Usage: terraform [-version] [-help] <command> [args]

The available commands for execution are listed below.
```

## Configuration

### Version Constraints

You'll probably integrate terraform with your CI/CD pipeline to provision your infrastructure.

So, it's good practice to pin down on the versions of terraform and aws provider to be used so that you don't pick up any latest releases which might have introduced breaking changes.

We'll make use of `terraform` configuration block to specify these settings. Let's create `main.tf` file with these settings.

```terraform
terraform {
  # Terraform CLI version to be used
  required_version = "0.12.8"

  # AWS provider version to be used
  required_providers {
    aws = ">= 2.33.0"
  }
}
```

Constraint operators allowed:

| Operators    | Purpose                                                                                  |
| ------------ | ---------------------------------------------------------------------------------------- |
| =            | exact version equality                                                                   |
| !=           | version not equal to                                                                     |
| >, >=, <, <= | version comparison, where "greater than" is a larger version number                      |
| ~=           | pessimistic constraint operator, constraining both the oldest and newest version allowed |

### Remote State File

Terraform must store state about your managed infrastructure and configuration. This state is used by Terraform to map real world resources to your configuration, keep track of metadata, and to improve performance for large infrastructures. This state is stored by default in a local file named `terraform.tfstate`.

It is good practice to store this file remotely in `S3`. Terraform will make use of this remote file to create plans and make changes to your infrastructure.

Usually, enterprises will set up separate accounts for development and production which makes it easy for them to manage access at account level.

So, your S3 bucket for storing the state files will vary for each of your accounts. You will need some flexibility in providing them.

Let's add a partial backend configuration block to our `main.tf` file.

```terraform
terraform {
  # Terraform CLI version to be used
  required_version = "0.12.8"

  # AWS provider version to be used
  required_providers {
    aws = ">= 2.33.0"
  }

  # Partial backend configuration
  backend "s3" {}
}
```

You can then create multiple `.hcl` files for each of your account to specify the S3 bucket which is to be used for storing state files.

Let's consider we have two AWS accounts named `rharshad-dev` and `rharshad-prod.hcl`. We'll create two files namely `rharshad-dev.hcl` & `rharshad-prod.hcl` with below sample configuration which will mention the respective S3 buckets to be used.

`rharshad-dev.hcl`

```hcl
# s3 bucket to be used for state files
bucket = "rharshad-dev"

key = "test/test.tfstate"

# region of S3 bucket
region = "us-east-1"

# enable server side encryption of state file
encrypt = true
```

`rharshad-prod.hcl`

```hcl
# s3 bucket to be used for state files
bucket = "rharshad-prod"

key = "test/test.tfstate"

# region of S3 bucket
region = "us-east-1"

# enable server side encryption of state file
encrypt = true
```

When you are ready to create your infrastructure, you'll specify the backend configuration file to be used. Terraform will get the S3 bucket and region details and will store the state files there.

### State Locking

There could be other team members who might be working on updates to the same infrastructure code. It could lead to corruption of state.

To prevent multiple writes to the state file, you could lock the state and release it once you are done. Terraform AWS provider plugin uses `DynamoDB` for locking to prevent concurrent operations.

Update the hcl file with the dynamo db table to be used for state locking.

`rharshad-prod.hcl`

```hcl
bucket = "rharshad-prod"

region = "us-east-1"

# name of a DynamoDB table to use for state locking and consistency. The table must have a primary key named LockID
dynamodb_table = "rharshad-prod-locks"

encrypt = true
```

Now, create the dynamo db table with primary key as `LockID`.

<figure>
	<a href="{{ site.url }}/assets/img/2019/12/dynamodb-locks-table.png"><img src="{{ site.url }}/assets/img/2019/12/dynamodb-locks-table.png"></a>
</figure>

{% include donate.html %}
{% include advertisement.html %}

## Providers

Previously, we had defined version constraint for aws provider plugin but we haven't defined the configuration for it.

`provider` block is used to configure `aws` provider which is responsible for creating and managing resources.

AWS providers are region specific and you can define multiple providers.`

Let's create a new file named `providers.tf` and add below configuration.

```terraform
# Default provider configuration
provider "aws" {
  region = "us-east-1"
}

# Additional provider configuration with alias
provider "aws" {
  alias  = "uw2"
  region = "us-west-2"
}

# Additional provider configuration with alias
provider "aws" {
  alias  = "ew1"
  region = "eu-west-1"
}
```

Wherever you want to create the resources, you need to specify the provider to be used. You can make use of the alias to indicate it.

If you don't specify the provider, then the one without the alias is treated as default provider by terraform.

## Resources

`resource` block defines a resource that exists within the infrastructure. Resource can be an EC2 instance, IAM roles, security groups or any such logical resource in AWS.

Let's say we want to create an IAM role with permissions policy for a beanstalk application. We can create an EC2 instance profile using the resource block as follows:

`iam.tf`

```terraform
# create an IAM role with trust policy to ec2 service
resource "aws_iam_role" "ec2_role" {
  name = "beanstalk-ec2-role"

  # Trust policy that allows EC2 to assume role and get temporary credentials for usage in application
  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "Service": "ec2.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
}

# create an IAM policy that allows read and write operations to S3 and attach it to an IAM role
resource "aws_iam_role_policy" "ec2_permissions" {
  name   = "beanstalk-ec2-permissions-policy"
  role   = aws_iam_role.ec2_role.name
  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement":[
    {
      "Sid":"AllowReadWriteOperationsOnS3Buckets",
      "Action":[
        "s3:Get*",
        "s3:List*",
        "s3:PutObject*"
      ],
      "Effect":"Allow",
      "Resource":[
        "arn:aws:s3:::elasticbeanstalk-*",
        "arn:aws:s3:::elasticbeanstalk-*/*",
        "arn:aws:s3:::rharshad-prod-data",
        "arn:aws:s3:::rharshad-prod-data/test/*"
      ]
    }
  ]
}
EOF
}

# create an instance profile and attach it to a role with permissions policy
resource "aws_iam_instance_profile" "ec2_instance_profile" {
  name = "beanstalk-ec2-instance-profile"
  role = aws_iam_role.ec2_role.name
}
```

Notice that we didn't specify the region provider to be used. In this case, terraform will use the default provider which we had configured earlier.

Available resources, examples and supported arguments can be found at:

<https://www.terraform.io/docs/providers/aws/>

### Attributes

Resource instances managed by Terraform each export attributes whose values can be used elsewhere in configuration.

For example, incase of `aws_iam_role`, terraform exports attributes such as `arn, id` which are available only upon resource creation.

Such values which are available only at runtime are exported by terraform and you can use them in other resources which require them for their creation.

Attributes which are exported are mentioned under each resource in terraform doc.

<https://www.terraform.io/docs/providers/aws/>

### Dependencies

Resources might be dependant on other resources. For example, in `iam.tf` file, `aws_iam_role_policy` needs an iam role name to be specified.

Here, it is dependant on `aws_iam_role` resource. `aws_iam_role` exports an attribute `name` which is the name of the role created.

We could use terraform's interpolation syntax to access the attribute exported by the resource `aws_iam_role`.

The syntax to access an attribute from a resource is `<TYPE>.<NAME>.<ATTRIBUTE>`.

Here,

<!-- prettier-ignore-start -->

| Component | Explanation                                                 | Actual Value |
| --------- | ----------------------------------------------------------- | ------------ |
| TYPE      | Resource type                                               | aws_iam_role |
| NAME      | Name given for the resource                                 | ec2_role     |
| ATTRIBUTE | Attribute exported by the resource which you want to access | name         |
{:.table-striped}

<!-- prettier-ignore-end -->

Example,

```terraform
resource "aws_iam_instance_profile" "ec2_instance_profile" {
  name = "beanstalk-ec2-instance-profile"
  # role name is given by accessing the attribute exported from another resource
  role = aws_iam_role.ec2_role.name
}
```

Terraform interprets these implicit dependencies and decides on the resource creation order. It will decide that `aws_iam_role` needs to be created first, followed by `aws_iam_instance_profile` as it is dependant on the role name.

{% include donate.html %}
{% include advertisement.html %}

## Variables

We had specified names like `beanstalk-ec2-instance-profile`, `beanstalk-ec2-role` etc. for the resources. AWS requires each resource to have unique names.

To make this code truly shareable we can make use of `variables` feature offered by terraform. It allows you to parameterize the configurations.

For example, we could define a variable block as:

`variables.tf`

```terraform
variable "name" {
  type        = string
  description = "Unique name for the resources"
}
```

Refer [https://www.terraform.io/docs/configuration/variables.html](https://www.terraform.io/docs/configuration/variables.html) for full list of variables.

When you run your terraform command to create the infrastructure, you will have to provide values for these variables.

### Variable Definitions File

In case, you have lot of variables and they vary based on the account/environment, you can create a variables file and provide the file to be used to terraform.

`rharshad-prod.vars`

```properties
name=test
```

### Accessing Variable Values

We can update our `iam.tf` to make use of the variable with the help of interpolation syntax `var. prefix followed by the variable name`.

Note: Interpolation syntax varies based on the variable type.

```terraform
resource "aws_iam_instance_profile" "ec2_instance_profile" {
  name = "${var.name}-ec2-instance-profile"
  # role name is given by accessing the attribute exported from another resource
  role = aws_iam_role.ec2_role.name
}
```

{% include donate.html %}
{% include advertisement.html %}

## Locals

A local value assigns a name to an expression, allowing it to be used multiple times within a module without repeating it.

One use case for using locals would be `tags`. We might want to tag all of our AWS resources so that we can have cost reports for each application.

We could define the common tags in `locals` block and refer it in all the resources thereby avoiding duplication.

```terraform
locals {
  common_tags = {
    Application        = var.name
    Environment        = var.env
    CostCenter         = "4357902130"
    Owner              = "test@example.com"
  }
}

resource "aws_elastic_beanstalk_environment" "default" {
  ...
  tags = local.common_tags
}
```

## Data Sources

Data sources allow data to be fetched or computed for use elsewhere in Terraform configuration. Use of data sources allows a Terraform configuration to make use of information defined outside of Terraform.

Let's say we need to create a beanstalk app. The resource requires `solution_stack_name` to be specified.

AWS retires platform versions and introduces new versions from time to time. It is not desirable to hardcode the stack name as it might get retired.

Ideally, we might want to get the latest stack which is supported by AWS and create our resource based on it while sticking to our app requirements.

You could use `aws_elastic_beanstalk_solution_stack` data source provided by terraform to get information on stacks available based on your app requirements.

```terraform
data "aws_elastic_beanstalk_solution_stack" "java_with_tomcat" {
  most_recent = true

  # Regex to return stacks which are based on Java with Tomcat where the Java version needs to be 8 with any minor release updates
  name_regex = "^64bit Amazon Linux (.*) Tomcat (.*) Java 8.(.*)$"
}
```

### Remote State

Another use case of data sources is that you can use it to read remote state files.

Let's say you have a vpc named `045fsfdsf` in your AWS account. It is bad practice to hard code the VPC to be used in all your app's terraform configuration files.

Instead, you could create your VPC using terraform and export the value as a output (refer modules section) in your state file stored in S3.

Your state file will be as below when you export output values.

```json
{
    "version": 1,
    "terraform_version": "0.12.8",
    "outputs": {
        "vpc_id": "045fsfdsf"
    }
}
```

You could then in your respective applications, access this state file to get the vpc name.

```terraform
# configure vpc remote state file as a data source
data "terraform_remote_state" "vpc" {
  backend = "s3"
  config =  {
    bucket = "rharshad-vpc"
    key    = "vpc.tfstate"
    region = "us-east-1"
  }
}

# pseudocode to access vpc id from remote state file using interpolation syntax data.<TYPE>.<NAME>.outputs.<OUTPUT_NAME>
vpc_id = "${data.terraform_remote_state.vpc.outputs.vpc_id}"
```

When you create a new VPC and want all of your apps to start using it, all you have to do is publish your state file with the change.

You could then apply the changes to your apps by running terraform commands which will download the remote state files again and detect this change thereby re-creating the resources in the new VPC.

## If statements, Loops, Expressions

Refer below article which extensively covers using statements, loops in terraform.

<https://blog.gruntwork.io/terraform-tips-tricks-loops-if-statements-and-gotchas-f739bbae55f9>

{% include donate.html %}
{% include advertisement.html %}

## Modules

Let's say we need to create a beanstalk application in multiple regions. We could simply write a resource block for it.

There are two problems with this approach.

1. Terraform requires us to specify the region provider to be used for creating a resource. So, we will end up writing the resource block multiple times for each region thereby duplicating the code.

2. Your organization might have multiple apps. Each of these apps might want to create beanstalk resource. You will end up writing resource blocks in each of these apps.

There is lack of organization & reusability and this is where terraform `modules` comes to the rescue.

Modules in Terraform are self-contained packages of Terraform configurations that are managed as a group. Modules are used to create reusable components, improve organization, and to treat pieces of infrastructure as a black box.

### Remote Module

You can have your module defined in it's own git repo. At a basic level, it will have below files.

<figure class="half">
	<a href="{{ site.url }}/assets/img/2019/12/terraform-module-structure.png"><img src="{{ site.url }}/assets/img/2019/12/terraform-module-structure.png"></a>
</figure>

<!-- prettier-ignore-start -->

| File         | Purpose                                                                                                             |
| ------------ | ------------------------------------------------------------------------------------------------------------------- |
| data.tf      | Defines data to be fetched or computed by terraform.                                                                |
| main.tf      | Defines your resource blocks. It could be split into multiple terraform files as well.                              |
| outputs.tf   | Defines return values of your module. Here, you will define return values which might be needed by other resources. |
| variables.tf | Defines parameters needed for the module.                                                                           |
{:.table-striped}

<!-- prettier-ignore-end -->

Let's create a reusable beanstalk module which we can refer in all our apps.

`main.tf`

```terraform
resource "aws_elastic_beanstalk_environment" "default" {
  name                    = var.env_name
  application             = var.app_name
  description             = var.description
  solution_stack_name     = var.solution_stack
  ### ENVIRONMENT SETTINGS  ###
  dynamic setting {
    for_each = var.env_settings
    content {
      namespace = setting.value[0]
      name      = setting.value[1]
      value     = setting.value[2]
      resource = ""
    }
  }
  tags = var.tags
}
```

`variables.tf`

```terraform
variable "app_name" {
  description = "The name of the application in which the environment needs to be created"
}

variable "env_name" {
  description = "Name for elastic beanstalk environment"
}

...
```

Outputs file for example could export the ELB name of the created beanstalk resource.

`outputs.tf`

```terraform
output "elb" {
  value = aws_elastic_beanstalk_environment.default.load_balancers[0] : ""
}
```

Once you are done release your changes by tagging them. We will use the tag to version the module.

{% include donate.html %}
{% include advertisement.html %}

#### Import & Usage of Remote Module

Now, let's say our app needs beanstalk to be set up in two AWS regions. We could use the module which we had created before to pass the input values and have the beanstalks created.

To import the module, we use the `source` argument inside the `module` block by specifying the Git url of the repo and the tag.

Other arguments specified within the `module` block are treated as input variables for the module.

`beanstalk.tf`

```terraform
# uses default provider to create beanstalk in us-east-1 region
module "beanstalk_us_east_1" {
  source = "git::ssh://git@github.com:HarshadRanganathan/beanstalk-module.git?ref=v0.1"
  # module arguments
  app_name              = local.app_name
  env_name              = local.env_name
  description           = local.env_description
  solution_stack        = data.aws_elastic_beanstalk_solution_stack.java_with_tomcat.name
  env_settings          = local.beanstalk_settings
  tags                  = local.beanstalk_tags
}

# uses provider with alias uw2 to create beanstalk in us-west-2 region
module "beanstalk_us_west_2" {
  source = "git::ssh://git@github.com:HarshadRanganathan/beanstalk-module.git?ref=v0.1"
  # module arguments
  app_name              = local.app_name
  env_name              = local.env_name
  description           = local.env_description
  solution_stack        = data.aws_elastic_beanstalk_solution_stack.java_with_tomcat.name
  env_settings          = local.beanstalk_settings
  tags                  = local.beanstalk_tags

  providers = {
    aws = aws.uw2
  }
}
```

When you run this terraform file, terraform will download the remote modules into `.terraform` folder.

You would have noticed that we are specifying the GIT url twice in the file.

This is because terraform doesn't support interpolation in the source argument. So, you couldn't do something like this `source = local.beanstalk_module_repo` as it will result in error.

Specifying the same module source in multiple places is error prone when you want to update the tag version.

A opinionated workaround is to make use of `override.tf` file (override specific portions of an existing configuration object in a separate file).

`override.tf`

```terraform
module "beanstalk_us_east_1" {
  source = "git::ssh://git@github.com:HarshadRanganathan/beanstalk-module.git?ref=v0.1"
}

module "beanstalk_us_west_2" {
  source = "git::ssh://git@github.com:HarshadRanganathan/beanstalk-module.git?ref=v0.1"
}
```

`beanstalk.tf`

```terraform
# uses default provider to create beanstalk in us-east-1 region
module "beanstalk_us_east_1" {
  # overridden by value given in override.tf file
  source = ""
  # module arguments
  app_name              = local.app_name
  env_name              = local.env_name
  description           = local.env_description
  solution_stack        = data.aws_elastic_beanstalk_solution_stack.java_with_tomcat.name
  env_settings          = local.beanstalk_settings
  tags                  = local.beanstalk_tags
}

# uses provider with alias uw2 to create beanstalk in us-west-2 region
module "beanstalk_us_west_2" {
  # overridden by value given in override.tf file
  source = ""
  # module arguments
  app_name              = local.app_name
  env_name              = local.env_name
  description           = local.env_description
  solution_stack        = data.aws_elastic_beanstalk_solution_stack.java_with_tomcat.name
  env_settings          = local.beanstalk_settings
  tags                  = local.beanstalk_tags

  providers = {
    aws = aws.uw2
  }
}
```

We are still specifying the git url twice in the override file. But, it allows us to maintain all the source url's in a separate file so that it is maintainable.

{% include donate.html %}
{% include advertisement.html %}

## Building Infrastructure

### Initialization

`terraform init` initializes various local settings and data that will be used by subsequent commands.

As part of initilization, we provide the backend config to be used.

```bash
terraform init -backend-config=rharshad-prod.hcl
```

### Generate Plan

We generate the terraform plan by supplying the variables file.

```bash
terraform plan -var-file="config/prod.tfvars" -out=.terraform/tplan
```

Incase we want to generate the plan for destroying the infrastructure, specify the `-destroy` flag.

```bash
terraform plan -destroy -var-file="config/prod.tfvars" -out=.terraform/tplan
```

### Apply Changes

Once we are happy with the plan that is generated, apply the changes to create/update/delete the infrastructure.

```bash
terraform apply .terraform/tplan
```

{% include donate.html %}
{% include advertisement.html %}

## References

<https://www.terraform.io>
