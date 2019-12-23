---
layout: post
title: "Connecting to Github with SSH (Windows)"
date: 2019-09-22
excerpt: "Connect to Github with SSH keys avoiding username/password"
tag:
    - github
    - ssh
    - git bash
    - git ssh key windows
    - git config ssh key
    - github ssh clone
    - github ssh config
    - ssh github configure
comments: true
---

## Pre-requisites

-   Git Bash

## When to use SSH keys instead of HTTPS

-   Your corporate firewall blocks port 22, then even if you have set the remote origin to use HTTPS url, the authentication will fail as it is done via SSH.

Remedy is to set up SSH keys and use SSH over HTTPS port 443.

Below are some of the errors different applications throw when the port is blocked and HTTPS remote url is used.

### Git Bash

When you try to push your changes, both `Github Login` and `OpenSSH` prompt asking for your username and password will fail with error `remote no anonymous write access. fatal authentication failed for github`.

### Github Desktop Application

You will be able to login to your github desktop application as the authentication is done via HTTPS. However, when you try to push your changes it will result in authentication failure.

Below is the logs captured by the desktop application showing that the git push is trying to authenticate via SSH.

```text
2019-09-22T13:16:46.927Z - info: [ui] Executing push: git -c credential.helper= -c protocol.version=2 push origin master:master --progress (took 21.740s)
2019-09-22T13:16:46.927Z - error: [ui] `git -c credential.helper= -c protocol.version=2 push origin master:master --progress` exited with an unexpected code: 128.
stderr:
ssh: connect to host github.com port 22: Connection timed out
fatal: Could not read from remote repository.

Please make sure you have the correct access rights
and the repository exists.

(The error was parsed as 2: Authentication failed. Some common reasons include:

- You are not logged in to your account: see File > Options.
- You may need to log out and log back in to refresh your token.
- You do not have permission to access this repository.
- The repository is archived on GitHub. Check the repository settings to confirm you are still permitted to push commits.
- If you use SSH authentication, check that your key is added to the ssh-agent and associated with your account.)
```

## Generate new SSH key

-   Run Git Bash.

-   Generate SSH key with your email id as comment.

```bash
$ ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
```

-   When you're prompted to "Enter a file in which to save the key," press Enter to save the key in the default location (/c/Users/username/.ssh/id_rsa). Your public key will also get saved here.

-   Copy the public key to clipboard.

```bash
$ clip < ~/.ssh/id_rsa.pub
```

## Add public SSH key to your GitHub account

Go to `Settings` in your Github account to add the SSH public key.

Under `SSH keys` tab, select `New SSH key`.

Give a title and paste the key in the text area.

<figure>
	<a href="{{ site.url }}/assets/img/2019/09/github-ssh-keys.png"><img src="{{ site.url }}/assets/img/2019/09/github-ssh-keys.png"></a>
</figure>

{% include donate.html %}
{% include advertisement.html %}

## Add private SSH key to the ssh-agent

Git bash tool comes with a ssh-agent.

Create a new `~/.profile` (or) `~/.bashrc` file by running below command in git bash.

```bash
$ vi ~/.profile
```

Paste below script into your `~/.profile` (or) `~/.bashrc` file to auto launch the ssh-agent whenever you run your git bash shell.

```bash
env=~/.ssh/agent.env

agent_load_env () { test -f "$env" && . "$env" >| /dev/null ; }

agent_start () {
    (umask 077; ssh-agent >| "$env")
    . "$env" >| /dev/null ; }

agent_load_env

# agent_run_state: 0=agent running w/ key; 1=agent w/o key; 2= agent not running
agent_run_state=$(ssh-add -l >| /dev/null 2>&1; echo $?)

if [ ! "$SSH_AUTH_SOCK" ] || [ $agent_run_state = 2 ]; then
    agent_start
    ssh-add
elif [ "$SSH_AUTH_SOCK" ] && [ $agent_run_state = 1 ]; then
    ssh-add
fi

unset env
```

This script will load the identities in the ssh agent from your default location `~/.ssh/id_rsa`.

```bash
Identity added: /c/Users/username/.ssh/id_rsa (your_email@example.com)
```

## Use SSH over HTTPS

This step is required only if your corporate firewall is blocking port 22.

Create a new config file in your `.ssh` directory i.e. /c/Users/username/.ssh/config

Paste below contents in the file to use port 443 for SSH connections to host `ssh.github.com`.

```text
Host github.com
  Hostname ssh.github.com
  Port 443
```

Run below command in git bash to verify that the configuration is working. Ignore any authentication failures.

```bash
$ ssh -vT git@github.com

OpenSSH_8.0p1, OpenSSL 1.1.1c  28 May 2019
debug1: Reading configuration data /c/Users/username/.ssh/config
debug1: /c/Users/username/.ssh/config line 1: Applying options for github.com
debug1: Connecting to ssh.github.com [192.30.253.122] port 443.
debug1: Connection established.
```

You can see that the SSH connection is now established via port 443.

## Verification

To check if everything works as expected perform below steps:

-   Run new git bash shell.

-   Check if the identity has been added to the ssh agent.

```bash
$ ssh-add -l
```

-   Check that the key is being used by trying to connect to git@github.com.

```bash
$ ssh -vT git@github.com

OpenSSH_8.0p1, OpenSSL 1.1.1c  28 May 2019
debug1: Reading configuration data
debug1: Offering public key
debug1: Server accepts key
debug1: Authentication succeeded (publickey).
Authenticated to ssh.github.com
```

-   Clone the repo using the SSH url.

Going forward, every push/pull will use the SSH keys to authenticate with Github.

{% include donate.html %}
{% include advertisement.html %}

## References

<https://help.github.com/en/articles/connecting-to-github-with-ssh>

<https://help.github.com/en/articles/using-ssh-over-the-https-port>
