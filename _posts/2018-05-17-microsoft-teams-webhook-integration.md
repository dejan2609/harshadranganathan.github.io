---
layout: post
title: "Microsoft Teams Webhook Integration"
date: 2018-05-17
excerpt: "Publish actionable messages to Teams using webhooks"
tag:
    - microsoft teams
    - webhook
    - jenkins
    - message cards
    - microsoft teams webhook notifications
    - microsoft teams incoming webhook json
    - microsoft teams outgoing webhook
comments: true
---

## Microsoft Teams Webhook

Microsoft Team's `Incoming webhook` connector allows you to publish messages to teams channel.

You can even add actions to the content so that users can complete tasks within the channel.

## Adding Webhook Connector to a Channel

In Microsoft Teams, choose the `More options (⋯)` button next to the channel name in the list of channels and then choose Connectors.

<figure>
	<a href="{{ site.url }}/assets/img/2018/05/webhook-connector.png"><img src="{{ site.url }}/assets/img/2018/05/webhook-connector.png"></a>
</figure>

Add `Incoming webhook` connector to the channel.

Now choose `configure` button next to the `Incoming Webhook` connector.

<figure>
	<a href="{{ site.url }}/assets/img/2018/05/incoming-webhook.png"><img src="{{ site.url }}/assets/img/2018/05/incoming-webhook.png"></a>
</figure>

Provide a name and upload an image for the connector. Now select `Create` button.

Copy the webhook URL for later reference.

We have now set up the webhook for the channel.

## Sending Messages to Webhook

To send a message to the webhook connector we have to send it as a JSON payload. Refer [message card template](https://docs.microsoft.com/en-us/outlook/actionable-messages/message-card-reference) on how the payload needs to be structured.

Note: [Adaptive cards](https://docs.microsoft.com/en-us/outlook/actionable-messages/adaptive-card) are the recommended card type for new Teams development. They are the new cross product specification for cards in Microsoft products including Bots, Cortana, Outlook, and Windows. However, they are not supported yet in teams connectors.

You can experiment your card design at [Card Playground](https://messagecardplayground.azurewebsites.net/).

We will send below sample payload to the connector and check if it works.

<script src="https://gist.github.com/HarshadRanganathan/5c169170e6d883f58d0af109773ea56b.js"></script>

Send this JSON payload as a POST request to the Webhook URL.

You can either use `Send via WebHook` option available in the [Card Playground](https://messagecardplayground.azurewebsites.net/) (or) [Postman](https://docs.microsoft.com/en-us/outlook/actionable-messages/actionable-messages-via-connectors#send-the-message) to send the message to the webhook.

<figure>
	<a href="{{ site.url }}/assets/img/2018/05/webhook-message.png"><img src="{{ site.url }}/assets/img/2018/05/webhook-message.png"></a>
</figure>

There is a python library which you can make use of for building the messages dynamically.

<https://pypi.org/project/ms-teams/>

{% include repo-card.html repo="ms-teams" %}

{% include donate.html %}
{% include advertisement.html %}

## Sending Messages to Webhook from Jenkins Build

You can make use of the [office 365 connector plugin](https://wiki.jenkins.io/display/JENKINS/Office+365+Connector+Plugin) to send build messages to the webhook.

However, if you want to send a custom message as part of your jenkins job then we can't make use of this plugin.

Below is a sample which sends a custom card message to the webhook using `httpRequest` step in [jenkins pipeline code](https://rharshad.com/jenkins-pipeline-as-code/).

<script src="https://gist.github.com/HarshadRanganathan/adfcb576ff8509220a46a398932211bc.js"></script>

This card shows the build parameter values with an action button to view the build job.

{% include donate.html %}
{% include advertisement.html %}

References:

<https://docs.microsoft.com/en-us/microsoftteams/platform/concepts/connectors>

<https://docs.microsoft.com/en-us/outlook/actionable-messages/actionable-messages-via-connectors>
