---
layout: post
title:  "Windows Subsytem for Linux (WSL) on Windows 10"
date:   2019-03-26
excerpt: "Install Windows Subsytem for Linux (WSL) on Windows 10"
tag:
- wsl
- windows subsystem for linux
- run linux on windows
- windows 10
comments: true
---

WSL was introduced with Windows 10 Fall Creators Update and later (Windows build 16215 or later).

## Pre-requisites

Ensure that "Windows Subsystem for Linux" feature is enabled by running below command in `PowerShell` as an administrator.

{% highlight powershell %}
Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux
{% endhighlight %}

You can also enable it via `Turn Windows features on or off` control panel option by checking `Windows Subsystem for Linux`.

## Install Linux Distribution

1. Open the Microsoft Store and choose your favorite Linux distribution.
2. From the distro's page, select "Get" to install the distribution.

<figure>
	<a href="{{ site.url }}/assets/img/2019/03/ubuntu-windows-store.png"><img src="{{ site.url }}/assets/img/2019/03/ubuntu-windows-store.png"></a>
</figure>

You might get below error if incase your corporate policies prevent install from Microsoft store.

In that case, [download](https://docs.microsoft.com/en-us/windows/wsl/install-manual) the distros and manually install them.

<figure>
	<a href="{{ site.url }}/assets/img/2019/03/ubuntu-windows-store-install-error.png"><img src="{{ site.url }}/assets/img/2019/03/ubuntu-windows-store-install-error.png"></a>
</figure>

Running the .appx file will still fail due to the corporate policy. To overcome the issue follow below steps:
1. Rename the extension of the .appx file to .zip.
2. Extract all the contents.
3. Run the .exe file inside the extracted folder.

Once the installation is complete, you will be asked to create a new user account with password.

When you launch your distro, you won't be asked for a password unless you elevate your access using `sudo`.


## Upgrade Distro

Windows does not automatically update or upgrade your Linux distro(s). On Debian/Ubuntu, you can use apt to upgrade the packages:

{% highlight bash %}
sudo apt update && sudo apt upgrade
{% endhighlight %}

## Launch Distro

You can launch the distribution in multiple ways:

1. Launch from windows store
2. Running wsl command from command prompt `wsl [command]`
3. Running wsl.exe which allows you to manage your distributions, set default distribution and uninstalling distributions.

## Re-install Distro

You will get an error `0x80070003` if you manually delete the ubuntu folder and start WSL. It occurs when the path where you had installed your distro is not present/deleted/removed. E.g. when you move your distro folder to your C: drive.

In that case, you will have to unregister the distro and re-install it.

List the distros available to WSL:

{% highlight bash %}
C:\Users\harshad>wslconfig.exe /l
Windows Subsystem for Linux Distributions:
Ubuntu-18.04 (Default)
{% endhighlight %}

Unregister the distro with the distribution name:

{% highlight bash %}
C:\Users\harshad>wslconfig.exe /u Ubuntu-18.04
{% endhighlight %}

Re-install the distro again.

## Change Mount Path

WSL mounts your machine's fixed drives under the `/mnt/<drive>` folder in your Linux distros. 

To change the mount path to `/` so that you don't have to change directory to your drive everytime you run wsl, create a `wsl.conf` file.

{% highlight bash %}
sudo nano /etc/wsl.conf
{% endhighlight %}

Paste below contents and save it. On your next restart, the changes should get reflected.

{% highlight text %}
[automount]
root = /
options = "metadata"
{% endhighlight %}

{% include donate.html %}

## Install Docker

To install docker and docker compose in WSL run below script:

{% highlight bash %}
set -e

# Update package lists
echo "# Updating package lists"
sudo apt-add-repository -y ppa:git-core/ppa
sudo apt-get update

# Ensure that CA certificates are installed
sudo apt-get -y install apt-transport-https ca-certificates

# Add Docker repository key to APT keychain
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -

# Update where APT will search for Docker Packages
echo "deb [arch=amd64] https://download.docker.com/linux/ubuntu ${CODENAME} stable" | \
    sudo tee /etc/apt/sources.list.d/docker.list

# Update package lists
sudo apt-get update

# Verifies APT is pulling from the correct Repository
sudo apt-cache policy docker-ce

# Install Docker
echo "# Installing Docker"
sudo apt-get -y install docker-ce

# Add user account to the docker group
sudo usermod -aG docker $(whoami)

# Install docker compose
echo "# Installing Docker-Compose"
sudo curl -L "https://github.com/docker/compose/releases/download/1.13.0/docker-compose-$(uname -s)-$(uname -m)" \
    -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Print installation details for user
echo ''
echo 'Installation completed, versions installed are:'
echo ''
echo -n 'Docker:         '
docker --version
echo -n 'Docker Compose: '
docker-compose --version

# Print reminder of need to logout in order for these changes to take effect!
echo ''
echo "Please logout then login before continuing."
{% endhighlight %}

Enable `Expose daemon on tcp://localhost:2375 without TLS` in your `Docker for Windows` settings.

We then configure WSL to connect to the remote docker daemon running in `Docker for Windows`.

{% highlight bash %}
echo "export DOCKER_HOST=tcp://localhost:2375" >> ~/.bashrc && source ~/.bashrc
{% endhighlight %}

We then run docker commands in WSL.

## Install Git, Node & Python

{% highlight bash %}
# Exit on any failure
set -e

# Update package lists
echo "# Updating package lists"
sudo apt-add-repository -y ppa:git-core/ppa
sudo apt-get update

# Install Git
echo "# Installing Git"
sudo apt-get install -y git

# Install nvm dependencies
echo "# Installing nvm dependencies"
sudo apt-get -y install build-essential libssl-dev

# Execute nvm installation script
echo "# Executing nvm installation script"
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.2/install.sh | bash

# Set up nvm environment without restarting the shell
export NVM_DIR="${HOME}/.nvm"
[ -s "${NVM_DIR}/nvm.sh" ] && . "${NVM_DIR}/nvm.sh"
[ -s "${NVM_DIR}/bash_completion" ] && . "${NVM_DIR}/bash_completion"

# Install node
echo "# Installing nodeJS"
nvm install 8
nvm use 8

# Ensure that CA certificates are installed
sudo apt-get -y install apt-transport-https ca-certificates

# Install python v2 if required
set +e
COUNT="$(python -V 2>&1 | grep -c 2.)"
if [ ${COUNT} -ne 1 ]
then
   sudo apt-get install -y python-minimal
fi

# Print installation details for user
echo ''
echo 'Installation completed, versions installed are:'
echo ''
echo -n 'Node:           '
node --version
echo -n 'npm:            '
npm --version
echo -n 'Python:         '
python -V

# Print reminder of need to logout in order for these changes to take effect!
echo ''
echo "Please logout then login before continuing."

{% endhighlight %}

{% include donate.html %}

## References

<https://docs.microsoft.com/en-us/windows/wsl/about>