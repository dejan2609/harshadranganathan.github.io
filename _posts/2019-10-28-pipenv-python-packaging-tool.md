---
layout: post
title: "Pipenv: Python Packaging Tool"
date: 2019-10-28
excerpt: "Create and manage virtualenv for your projects"
tag:
    - pipenv
    - python packaging
    - dependency management
    - pipenv install from pipfile
    - pipenv documentation
    - pipenv install windows
    - pipenv install local package
    - how to use pipenv
    - pipenv install dev packages
    - python packaging tools
    - pipenv tutorial
    - pipenv windows
    - install pipenv windows
    - python packaging tutorial
    - packaging python applications for windows
comments: true
---

## Introduction

Pipenv is primarily meant to provide users and developers of applications with an easy method to setup a working environment.

It automatically creates and manages a virtualenv for your projects, as well as adds/removes packages from your Pipfile as you install/uninstall packages. 

It also generates the ever-important Pipfile.lock, which is used to produce deterministic builds.

## Install Pipenv

We install pipenv using pip:

```bash
pip install pipenv
```

## Activate Shell

```bash
pipenv shell
```

This will spawn a new shell subprocess in a virtual environment to isolate the development.

Pipenv creates all your virtual environments in a default location. To know the location of virtual env run below command:

```bash
pipenv --venv
```

## Importing from requirements.txt

If you already have a `requirements.txt` file, running `pipenv install` will automatically import the contents of the file and create a `Pipfile`.

You can also specify `pipenv install -r path/to/requirements.txt` to import a requirements file.

## Specify Python Version

To create a new virtualenv, using a specific version of Python you have installed, use `--python VERSION` flag.

```bash
pipenv --python 3.7
```

If you don’t specify a Python version on the command–line, pipenv will default to the system installation.

## Install Runtime Packages

To install a 3rd party package e.g. boto3 we use below command:

```bash
pipenv install boto3
```

This will create two new files `Pipfile` and `Pipfile.lock` if they don't exist.

| File | Purpose |
| ------ | ------ |
| Pipfile| Manages dependencies |
| Pipfile.lock| Declares all dependencies, sub-dependencies, versions,  current hashes for the downloaded files and ensures repeatable, deterministic builds |

To specify versions of a package:

```bash
pipenv install "boto3~=1.10"
```

| Identifiers | Example Usage |
| ------ | ------ |
|~= | Locks major version of the package and installs any minor updates. Equivalent to `==x*`.|
|>= | will install a version equal or larger than |
|<= | will install a version equal or lower than  |
|== | Installs specific version and prevents minor updates  |
|>  | Installs version greater than |

## Install Dev Packages

To install packages to be used only for development e.g. pytest use `--dev` argument.

```bash
pipenv install pytest --dev
```

## Sample Pipfile

Pipfile uses the TOML Spec. 

You can also create the Pipfile yourself with the required package versions and install them using `pipenv install --dev` command.

```toml
[[source]]
name = "pypi"
url = "https://pypi.org/simple"
verify_ssl = true

[dev-packages]
boto3 = "*"
pytest = "*"

[packages]
pyteams = "==0.1.1"

[requires]
python_version = "3.7"
```

`[dev-packages]` for development-only packages.

`*` tells pipenv to install any version.

`[packages]` for minimally required packages.

`[requires]` specifies target Python version

{% include donate.html %}
{% include advertisement.html %}

## Uninstall Packages

To uninstall a particular package:

```bash
pipenv uninstall boto3
```

To purge all the files from the virtual environment but to keep the Pipfile:

```bash
pipenv uninstall --all
```

To remove all the development packages from the virtual environment and to remove them from Pipfile:

```bash
pipenv uninstall --all-dev
```

## Freeze Requirements

Once you are done installing your packages, you can freeze your `Pipfile.lock` file. 

```bash
pipenv lock
```

## Install from Pipfile.lock

In your production environment, you need to install the packages from your `Pipfile.lock` file to re-create the same environment which you had when you ran `pipenv lock`.

```bash
pipenv install --ignore-pipfile
```

`--ignore-pipfile` tells pipenv to ignore `Pipfile` and install from `Pipfile.lock`.

The lock file enables deterministic builds by taking a snapshot of all the versions of packages in an environment.

## Install from Pipfile

If you already have a `Pipfile` and want to install the packages in your local, run below command in your working directory:

```bash
pipenv install
```

To install both dev and regular packages use `--dev` argument.

```bash
pipenv install --dev
```

## Dependency Graph

You can also show a dependency graph to understand your top-level dependencies and their sub-dependencies.

```bash
pipenv graph
```

This command will print out a tree-like structure showing your dependencies. 

## Security Vulnerabilities

Check for security vulnerabilities in your environment using below command:

```bash
pipenv check
```

## Gotchas

Depending on the package you are trying to install, sometimes locking of pipfile hangs. In those cases, you can skip the lock file with `--skip-lock` flag.

Example usages:

```
pipenv install --skip-lock
pipenv install boto3 --skip-lock
```

<https://github.com/pypa/pipenv/issues/1816>

<https://github.com/pypa/pipenv/issues/2681>

<https://github.com/pypa/pipenv/issues/3827>

{% include donate.html %}
{% include advertisement.html %}

## References

<https://pipenv.kennethreitz.org/en/latest/>

<https://realpython.com/pipenv-guide/>