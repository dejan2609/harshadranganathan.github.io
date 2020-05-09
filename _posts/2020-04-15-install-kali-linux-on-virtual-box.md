---
layout: post
title: "Install Kali Linux on VirtualBox"
date: 2020-04-15
excerpt: "Step by Step Guide to install Kali Linux on VirtualBox for Windows users"
tag:
    - how to install kali linux on virtualbox windows 10
    - kali linux virtualbox download
    - kali linux virtualbox image
    - how to install kali linux on windows 10
    - kali linux for windows 10
    - kali linux not working in virtualbox
    - kali linux virtualbox
    - kali linux download for windows 10
    - how to install kali linux
    - installing kali linux on virtualbox
    - install kali linux virtualbox guest additions
    - how to download and install kali linux on virtualbox
    - how to install kali linux on virtualbox
    - install kali linux on virtualbox step by step
    - install kali linux 64 bit on virtualbox
    - how to install kali linux on virtualbox step by step
    - how to install kali linux on virtualbox windows 10 64 bit
    - i can't install kali linux on virtualbox
    - can't install kali linux on virtualbox
    - cannot install kali linux on virtualbox
    - not able to install kali linux on virtualbox
    - unable to install kali linux on virtualbox
    - error while installing kali linux on virtualbox
    - problems installing kali linux on virtualbox
    - install kali linux iso on virtualbox
    - how to install kali linux ova file on virtualbox
comments: true
---

## Download Virtual Box Image

Offensive Security has made available Virtual box images for Kali Linux.

Download `Kali Linux VirtualBox 64-Bit` image from their site <https://www.offensive-security.com/kali-linux-vm-vmware-virtualbox-image-download/>

## Import Virtual Appliance

Once you have the `OVF (Open Virtualization Format)` file downloaded, import it to your VirtualBox by using the `Import` button.

<figure>
    <a href="{{ site.url }}/assets/img/2020/04/import-virtual-appliance-kali-ovf.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2020/04/import-virtual-appliance-kali-ovf.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2020/04/import-virtual-appliance-kali-ovf.png">
            <img src="{{ site.url }}/assets/img/2020/04/import-virtual-appliance-kali-ovf.png" alt="">
        </picture>
    </a>
</figure>

VirtualBox will import the OVF to create VDI disk image.

<figure>
    <a href="{{ site.url }}/assets/img/2020/04/kali-linux-vbox.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2020/04/kali-linux-vbox.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2020/04/kali-linux-vbox.png">
            <img src="{{ site.url }}/assets/img/2020/04/kali-linux-vbox.png" alt="">
        </picture>
    </a>
</figure>

## Disable USB Controller

If you start your VM you might get this error:

```text
Implementation of the USB 2.0 controller not found!
Because the USB 2.0 controller state is part of the saved VM state,
the VM cannot be started.
To fix this problem, either install the 'Oracle VM VirtualBox Extension Pack' or disable USB 2.0 support in the VM settings
```

Select the Kali-Linux Image, go to `Settings -> USB` and then disable `Enable USB Controller` option.

{% include donate.html %}
{% include advertisement.html %}

## Start VM

You can use the `Start` button to start the VM image.

When prompted for username and password, provide below credentials:

```text
Username: kali
Password: kali
```

<figure>
    <a href="{{ site.url }}/assets/img/2020/04/kali-linux-login-screen.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2020/04/kali-linux-login-screen.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2020/04/kali-linux-login-screen.png">
            <img src="{{ site.url }}/assets/img/2020/04/kali-linux-login-screen.png" alt="">
        </picture>
    </a>
</figure>

## Install Updates

Run below command in Kali Linux terminal to install package updates.

```terminal
# retrieve current package indexes and upgrade all packages to the latest version
kali@kali:~$ sudo sh -c "apt-get update; apt-get -y full-upgrade"
```

You might get couple of errors during the upgrade process. If any, follow these steps in a repeated fashion to fix them. It might take couple of tries to fix everything.

Sample error:

```text
dpkg-deb (subprocess): decompressing archive member: lzma error: compressed data is corrupt
dpkg-deb: error: <decompress> subprocess returned error exit status 2
dpkg: error processing archive /tmp/apt-dpkg-install-1LUTeW/21-python3.7-dev_3.7.7-1+b1_amd64.deb (--unpack):

Errors were encountered while processing:
 /tmp/apt-dpkg-install-XLxiip/20-libgl1-mesa-dri_19.3.3-1_amd64.deb
E: Sub-process /usr/bin/dpkg returned an error code (1)
```

Action:

```shell
# Remove the corrupted package
kali@kali:~$ sudo rm /var/cache/apt/archives/python3.7-dev_3.7.7-1+b1_amd64.deb

# Attempt to correct a system with broken dependencies in place
kali@kali:~$ sudo apt --fix-broken install

# Re-run the upgrade
kali@kali:~$ sudo sh -c "apt-get update && apt-get -y full-upgrade"
```

Sample Error:

```text
Sub-process /usr/bin/dpkg received a segmentation fault
```

Action:

```shell
# force dpkg to reconfigure any broken or partially configured packages
kali@kali:~$ sudo dpkg --configure -a
```

{% include donate.html %}
{% include advertisement.html %}

Sample Error:

```text
dpkg: error processing package python3-twisted (--configure):
 dependency problems - leaving unconfigured
Errors were encountered while processing:
 python3-zope.interface
 python3-twisted
E: Sub-process /usr/bin/dpkg returned an error code (1)
```

Action:

```shell
# Try to remove the package
kali@kali:~$ sudo dpkg -r python3-zope.interface
```

If it fails with error `dpkg: dependency problems prevent removal of python3-zope.interface:`, then try this approach (last resort and not recommended):

```shell
# remove the package e.g. location /var/lib/dpkg/info/[PACKAGE_NAME].*
kali@kali:~$ sudo rm /var/lib/dpkg/info/faraday.*

# Re-run upgrade
kali@kali:~$ sudo sh -c "apt-get update; apt-get -y full-upgrade"
```

You might notice below errors:

```text
dpkg: warning: files list file for package 'python3-zope.interface' missing; assuming package has no files currently installed
dpkg: warning: files list file for package 'python3-twisted' missing; assuming package has no files currently installed
dpkg: warning: files list file for package 'faraday' missing; assuming package has no files currently installed
(Reading database ... 282752 files and directories cu
```

Fix them by running below command:

```shell
# Re-install all the missing packages which you had deleted earlier
kali@kali:~$ sudo apt-get install --reinstall python3-zope.interface
```

Other commands which you can try to resolve errors:

```shell
# Clears out the local repository of retrieved package files & remove packages that were automatically installed to satisfy dependencies for some package and that are no more needed
kali@kali:~$ sudo apt-get autoclean && sudo apt-get autoremove

# update missing package lists
kali@kali:~$ sudo apt --fix-missing install
```

## Install VirtualBox Guest Additions

Currently, your VM lacks full screen, copy-paste capabilities etc.

By installing the VirtualBox Guest Additions, the virtual machine should have better video support (including hardware-accelerated graphics), shared clipboard, drag and drop support between the guest and host machines, and shared folders, among others.

Install VirtualBox Guest Additions by running below command:

```shell
kali@kali:~$ sudo apt-get -y install virtualbox-guest-x11
```

You might get below error which can be ignored:

```text
Job for virtualbox.service failed because a timeout was exceeded.
See "systemctl status virtualbox.service" and "journalctl -xe" for details.
```

Reboot your VM to apply the changes.

```shell
kali@kali:~$ sudo reboot
```

Alternatively, you can also install the guest additions via `Devices -> Insert Guest Additions CD Image...` option.

{% include donate.html %}
{% include advertisement.html %}

This will mount VBox guest additions ISO to your linux VM.

Open terminal in that folder.

<figure>
    <a href="{{ site.url }}/assets/img/2020/04/vbox-guest-additions-kali-linux.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2020/04/vbox-guest-additions-kali-linux.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2020/04/vbox-guest-additions-kali-linux.png">
            <img src="{{ site.url }}/assets/img/2020/04/vbox-guest-additions-kali-linux.png" alt="">
        </picture>
    </a>
</figure>

Run below commands in the terminal which will install the guest additions.

```shell
kali@kali:/media/cdrom0$ sudo sh ./VBoxLinuxAdditions.run
[sudo] password for kali:
Verifying archive integrity... All good.
Uncompressing VirtualBox 6.1.4 Guest Additions for Linux........
VirtualBox Guest Additions installer
```

## Additional Tools

Some additional tools which you can install for your system.

```bash
# preload monitors applications that users run, and by analyzing this
# data, predicts what applications users might run, and fetches those
# binaries and their dependencies into memory for faster startup times.
kali@kali:~$ sudo apt-get install preload

# BleachBit deletes unnecessary files to free valuable disk space, maintain
# privacy, and remove junk. It removes cache, Internet history, temporary files,
# cookies, and broken shortcuts.
kali@kali:~$ sudo apt-get install bleachbit

# apt-file is a command line tool for searching files contained in packages
kali@kali:~$ sudo apt-get install apt-file

# writes patterns on magnetic media to thwart data recovery
kali@kali:~$ sudo apt-get install scrub

# Make large character ASCII banners out of ordinary text
kali@kali:~$ sudo apt-get install figlet

# chkrootkit is a tool to locally check for signs of a rootkit.
kali@kali:~$ sudo apt-get install chkrootkit
```

{% include donate.html %}
{% include advertisement.html %}

## Configure SSH

Kali comes with default SSH keys. So, we generate new SSH keys.

```shell
# change directory to ssh
kali@kali:~$ cd /etc/ssh

# make new backup folder
kali@kali:~$ sudo mkdir ssh_backup

# move existing SSH keys to backup folder
kali@kali:~$ sudo mv ssh_host_* ssh_backup/

# generate new SSH keys
kali@kali:~$ sudo dpkg-reconfigure openssh-server

# start SSH server
kali@kali:~$ sudo service ssh start

# Check if SSH is working
kali@kali:~$ netstat -antp

# stop SSH server
kali@kali:~$ sudo service ssh stop
```

## Install Tor

Tor is a connection-based low-latency anonymous communication system.

```shell
# get tor package
kali@kali:~$ sudo apt-get install tor

# update proxychains file to enable dynamic_chain, disable strict_chain and add SOCKS5 protocol port (socks5 127.0.0.1 9050)
kali@kali:~$ sudo vi /etc/proxychains.conf

# start tor service
kali@kali:~$ sudo service tor start

# check tor status
kali@kali:~$ sudo service tor status

# force TCP connection made through firefox browser to follow SOCKS5 tor proxy
kali@kali:~$ proxychains firefox-esr www.whatismyip.com
```

{% include donate.html %}
{% include advertisement.html %}

## Scan System for Rootkits

```bash
kali@kali:~$ sudo chkrootkit

Checking `amd'...                                           not found
Checking `basename'...                                      not infected
Checking `biff'...                                          not found
Checking `chfn'...                                          not infected
Checking `chsh'...                                          not infected
Checking `cron'...                                          not infected
Checking `crontab'...                                       not infected
```

{% include donate.html %}
{% include advertisement.html %}

## References

Penetration Testing and Ethical Hacking with Kali Linux
