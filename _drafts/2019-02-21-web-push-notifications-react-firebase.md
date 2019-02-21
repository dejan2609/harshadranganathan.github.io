---
layout: post
title:  "Web Push Notifications for your React app using Firebase"
date:   2019-02-21
excerpt: "Implement push notifications for your react application using firebase"
tag:
- push notifications
- web push
- fcm
- react
- express
- firebase
- firestore
comments: true
---

## Push Notifications

Push notifications allow users to get updates and engage with your content. You can send push notifications via browsers (Desktop/Mobile) which support Push & Notification API.

Below browsers support Push & Notification API:

 - Chrome Desktop and Mobile (version 50+)
 - Firefox Desktop and Mobile (version 44+)
 - Opera on Mobile (version 37+)

## Overview

Let's see what's involved in setting up a push notification service for a site.

### Service Worker

Push is based on service workers because service workers operate in the background. A service worker is a "special" JavaScript file. 

The browser can execute this JavaScript without your page being open. This means the only time code is run for a push notification (in other words, the only time the battery is used) is when the user interacts with a notification by clicking it or closing it.

It's inside the service worker's 'push' event that you can perform any background tasks. You can make analytics calls,cache pages offline and show notifications.

You must check if the browser supports service workers.

### Push Manager

The PushManager interface of the Push API provides a way to receive notifications from third-party servers as well as request URLs for push notifications.

You must check if the browser supports push manager.

### Service Worker Registration

Once we know that the browser supports service worker and push manager we register our service worker javascript file.

The browser will then run the file in a service worker environment.

### User Permission

Once we register the service worker we need to get permission from the user to send push notifications.

If the user blocks the permission request then they have to manually unblock the site in the browser settings panel.

### User Subscription

After registering the service worker and getting user permission, we need to subscribe the user.

We need to generate VAPID keys and submit to the push service. These keys are used by the push service to identify the application subscribing the user and ensure that the same application is the one messaging the user.

Once you subscribe you will receive an endpoint, associated with the app's public key and an identifier (push subscription).

Later, when you want to send a push message, you'll need to create an Authorization header which will contain information signed with your application server's private key and submit to that endpoint.

### Subscription Storage

We need to store the push subscription details by sending it to our server so that we can use it to send messages to a user.

### Push Notification

To send a push message we need to do a web push by sending a payload with an Authorization header signed with the private key.

The push service will use the public key to decrypt the authorization header and verify that it is the same application that subscribed the user which is trying to send a message.

It will then send the push message to the user's device when the browser becomes active.

## Firebase Cloud Messaging

Firebase Cloud Messaging (FCM) is a cross-platform messaging solution that lets you reliably deliver messages at no cost.

We'll see how we can use FCM to send notification messages to the client.

## Client Side

Push API relies on a few different pieces of technology, including Web App Manifests and Service Workers. 

Let's see the steps involved in enabling Push API for your react app.

### Add Firebase to your app

To add Firebase to your app, you'll need a Firebase project.

- Create a firebase project in the [Firebase console](https://console.firebase.google.com/).
- Get your app config which we will use to initialize firebase in your react app.

<figure>
	<a href="{{ site.url }}/assets/img/2019/02/firebase-app-config.png"><img src="{{ site.url }}/assets/img/2019/02/firebase-app-config.png"></a>
</figure>

- Install firebase npm module.

{% highlight bash %}
npm install --save firebase
{% endhighlight %}

### Manifest file

Create a `pwa` directory in `src` folder which will contain the `manifest.json` file.

{% highlight json %}
{
    "gcm_sender_id": "103953800507"
} 
{% endhighlight %}

This indicates that FCM is authorized to send messages to this app.

Link the manifest in your index file.

{% highlight html %}
<link rel="manifest" href="manifest.json">
{% endhighlight %}

If you are using webpack to generate your build files then you can use `copy-webpack-plugin` to copy the manifest file to the build directory.

{% highlight bash %}
npm install --save copy-webpack-plugin
{% endhighlight %}

{% highlight javascript %}
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const srcPath = path.join(__dirname, 'src');
const buildPath = path.join(__dirname, 'public');
module.exports = () => {
    plugins: [
        new CopyPlugin([
            { from: path.join(srcPath, 'pwa'), to: buildPath }
        ])
    ]
};
{% endhighlight %}

## References

<https://developers.google.com/web/fundamentals/push-notifications/>

<https://firebase.google.com/docs/cloud-messaging/js/client>
