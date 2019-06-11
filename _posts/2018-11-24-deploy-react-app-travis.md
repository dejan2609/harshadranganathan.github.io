---
layout: post
title:  "Deploy React App to your server with Travis CI"
date:   2018-11-24
excerpt: "Test and deploy your React App with Travis CI"
tag:
- React App
- Github
- Travis
- CI/CD
comments: true
---

[Travis CI](https://travis-ci.com) is a hosted, distributed continuous integration service used to build and test software projects hosted at [GitHub](https://github.com).

We can test and deploy react projects hosted at Github using Travis CI. 

## Pre-Requisites

 - Setup a [Travis CI account](https://travis-ci.com)
 - [Register your repositories](https://docs.travis-ci.com/user/tutorial/) with Travis CI

Once you have your react project hosted at Github registered with Travis CI, we can proceed to the next steps of running the tests and deploying it to your server using Travis CI. 

## Install Travis CLI

We need to allow travis to SSH into your server so that it can deploy the build artifacts. 

However, we can't store the private key as such in the github repo as anyone can use it to log into the server.

Every repository that's registered with Travis CI has it's own keypair where the private key is known only to Travis CI and the public key is available to anyone.

We can use this public key to encrypt your SSH key and commit it to github. So, only travis will be able to decrypt it and use the decrypted SSH private key to login to your server.

This feature is provided through travis cli. Hence, we will be installing the same by running below commands.

{% highlight plaintext %}
# travis cli is ruby based so we need to install ruby and other dev libraries
sudo yum install ruby -y

sudo yum install gcc g++ make automake autoconf curl-devel openssl-devel \
zlib-devel httpd-devel apr-devel apr-util-devel sqlite-devel -y

sudo yum install ruby-rdoc ruby-devel -y

# install travis cli
gem install travis
{% endhighlight %}

If you're setting up Travis CLI in your windows system using git bash beware of these issues -

 - [Hanging github login from command line](https://github.com/travis-ci/travis-ci/issues/8250)
 - [File decryption fails (wrong final block length) on Windows](https://github.com/travis-ci/travis-ci/issues/4746)

## Generate And Encrypt Private Key 

Now we are going to generate a SSH key and encrypt it using travis cli by running below commands.

{% highlight plaintext %}
# travis login by providing your gihub username and password
travis login --com

# clone your react project and change directory to it
cd react-app

# create .travis.yml file
touch .travis.yml

# generate new key called "travis_rsa"
ssh-keygen -t rsa -N "" -C "React App" -f travis_rsa

# encrypt the file using your repo's public key and add it to your .travis.yml file
# must be run within your project directory
travis encrypt-file travis_rsa --add --com

# remove the key
rm travis_rsa

# stage .travis.yml and travis_rsa.enc files
git add .travis.yml
git add travis_rsa.enc

{% endhighlight %}

If incase, when you are running the `encrypt-file` command in your project directory and your repo isn't auto-detected, you can pass the repo name as follows

{% highlight plaintext %}
# use -r flag e.g. -r owner/project
travis encrypt-file travis_rsa --add --com -r HarshadRanganathan/react-app
{% endhighlight %}

Your .travis.yml file will look as follows
{% highlight plaintext %}
before_install:
- openssl aes-256-cbc -K $encrypted_xxxxxx_key -iv $encrypted_xxxxxx_iv
  -in travis_rsa.enc -out travis_rsa -d
{% endhighlight %}

You can find `encrypted_xxxxxx_key` and `encrypted_xxxxxx_iv` stored as `Environment Variables` under your project settings in Travis CI.

Copy the public key in the file `travis_rsa.pub` which we will be using next.

## Create a new user for Travis in your server

Now that we have stored your encrypted private key in the repo, we need to create a new user in your server for Travis to deploy the build artifacts.

We will be adding the public key generated previously to this user so that travis can SSH into the server using the decrypted private key.

For example, we can use below commands to create a new user in Cent OS.

{% highlight plaintext %}
# create a new travis user
sudo adduser travis

# delete the password for the user
sudo passwd -d travis

# change to travis user
su - travis

# create a new directory called .ssh and restrict its permissions
mkdir .ssh
chmod 700 .ssh

# open a file in .ssh called authorized_keys 
# copy the public key which we had previously generated
# enter :x then ENTER to save and exit the file
vi .ssh/authorized_keys

# restrict the permissions of the authorized_keys file
chmod 600 .ssh/authorized_keys

exit
{% endhighlight %}

## Setup .travis.yml

We are going to tell travis CI what to do with the `.travis.yml` file. We update the file with below contents.

{% highlight yaml %}

sudo: true
language: node_js
node_js:
- node
git:
  quiet: true
cache: npm
before_install:
- openssl aes-256-cbc -K $encrypted_xxxxxx_key -iv $encrypted_xxxxxx_iv
  -in travis_rsa.enc -out travis_rsa -d
- chmod 600 travis_rsa
- mv travis_rsa ~/.ssh/id_rsa
- cat server.pub >> $HOME/.ssh/known_hosts
after_success:
- bash ./deploy.sh

{% endhighlight %}

Here's the explanation of the file contents -

 - `sudo: true` we ask travis to run the build in a virtualized machine with `root` access
 - `language: node_js` since our project requires Node.js we tell travis ci to run the build on an infrastructure having Node.js installed
 - `node_js: - node` specifies to use the latest stable Node.js release
 - `cache: npm` specifies to cache the `node_modules` directory 
 - `before_install` any commands that we want to be run before the install process
 - `mv travis_rsa ~/.ssh/id_rsa` move the decrypted key to the default keys location
 - `after_success: - bash ./deploy.sh` once the tests pass and the build completes successfully, we ask travis to run our deploy script.

When we specified `language: node_js` travis will run `npm install` during install lifecycle and `npm test` during the script lifecycle.

Read [Node.js](https://docs.travis-ci.com/user/languages/javascript-with-nodejs/) language guide and [Job Lifecycle](https://docs.travis-ci.com/user/job-lifecycle/) for more details.

### Adding to SSH Known Hosts

Travis CI can add entries to ~/.ssh/known_hosts prior to cloning your git repository, which is necessary if there are git submodules from domains other than github.com, gist.github.com, or ssh.github.com.

Get your server's public key by running this command

{% highlight plaintext %}
ssh-keyscan (domain/ip_address)
{% endhighlight %}

Add the public key to file named `server.pub` and push to your repo.

In .travis.yml file, we had specified this command `cat server.pub >> $HOME/.ssh/known_hosts` which will add your server's public key to the known hosts file in the virtualized machine created by travis ci.

{% include donate.html %}
{% include advertisement.html %}

## Deploy Script

Now add below deploy script to your project repo which does the following
 - execute the script only if the build is for master branch or PR
 - `eval "$(ssh-agent -s)"` start an ssh-agent session
 - `ssh-add` adds the default keys ~/.ssh/id_rsa into the SSH authentication agent for implementing single sign-on with SSH
 - `npm run build` generates production build of JS, index.html files
 - `rsync` remote sync the build artifacts. We delete any files if already present and make the parent directories if absent. 

Here `$TRAVIS_BUILD_DIR/public` denotes the location where your build artifacts (JS, index.html files) are generated.

{% highlight bash %}
#!/bin/bash
set -xe

if [ $TRAVIS_BRANCH == 'master' ] ; then
  eval "$(ssh-agent -s)"
  ssh-add
  npm run build
  rsync -rq --delete --rsync-path="mkdir -p react-app && rsync" \
  $TRAVIS_BUILD_DIR/public travis@<ip>:react-app
else
  echo "Not deploying, since this branch isn't master."
fi
{% endhighlight %}

### Safelist Travis IP Addresses

If incase, you have setup SSH restriction in your firewall rules, you will have to safelist travis ip addresses so that travis would be able to SSH and deploy the artifacts in your server.

Refer [Travis IP Addresses](https://docs.travis-ci.com/user/ip-addresses/) list.

Since we had specified `sudo: true` in our .travis.yml file, we have to safelist `Sudo-enabled Linux` IP addresses.

Also it is recommended to subscribe yourself to the notification as these IP adderesses will change periodically.

Now we have everything in place. Whenever you update `master` branch, Travis CI will generate the production build artifacts and deploy them to your server provided the tests pass.

{% include donate.html %}
{% include advertisement.html %}