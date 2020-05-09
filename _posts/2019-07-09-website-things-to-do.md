---
layout: post
title:  "Website Things To Do"
date:   2019-07-09
excerpt: "Things to do before and after launching your website"
tag:
- website
- things to do
- checklist
- analytics
- ads
- things to consider when designing and developing a website
- what are the most important things to consider when designing a web page
- website design considerations
- important factors in web design
- things to know when building a website
comments: true
---

## Secure

Make your site secure by enabling HTTPS on your website. 

HTTPS helps prevent intruders from tampering with the communications between your websites and your users’ browsers. Intruders include intentionally malicious attackers, and legitimate but intrusive companies, such as ISPs or hotels that inject ads into pages.

Intruders exploit every unprotected resource that travels between your websites and your users. Images, cookies, scripts, HTML … they’re all exploitable. Intrusions can occur at any point in the network, including a user’s machine, a Wi-Fi hotspot, or a compromised ISP, just to name a few.

### Github Pages

If you have your website on Github, you can enable HTTPS in the Settings section of your repository.

<figure class="half">
    <a href="{{ site.url }}/assets/img/2019/07/github-pages-https.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2019/07/github-pages-https.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2019/07/github-pages-https.png">
            <img src="{{ site.url }}/assets/img/2019/07/github-pages-https.png" alt="">
        </picture>
    </a>
</figure>

### Let's Encrypt

[Let's Encrypt](https://letsencrypt.org/) is a free, automated, and open certificate authority which you can make use of to enable SSL for your website.

You can make use of Certbot client to automate certificate issuance and installation with no downtime.

<script src="https://gist.github.com/HarshadRanganathan/9e6cf316239ccc9d8386999780c03ae4.js"></script>

## Site Audit

It's important to measure how your website performs in terms of performance, accessibility, best practices and SEO.

<https://web.dev/measure> - analyses your website and provides useful guidance

<https://developers.google.com/web/tools/lighthouse/> - performs audits for performance, accessibility, progressive web apps, and more

<https://developers.google.com/speed/pagespeed/insights/> - analyzes the content of a web page, then generates suggestions to make that page faster

All of the above are tools offered by Google and use data from Lighthouse project.

{% include donate.html %}
{% include advertisement.html %}

## Discoverable

### Google Search Console

[Search Console](https://search.google.com/search-console/about) provides tools and reports help you measure your site's Search traffic and performance, fix issues, and make your site shine in Google Search results.

You can submit your [sitemap.xml](https://en.wikipedia.org/wiki/Sitemaps) to google so that it can be crawled and indexed.

<figure>
    <a href="{{ site.url }}/assets/img/2019/07/google-search-console-sitemaps.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2019/07/google-search-console-sitemaps.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2019/07/google-search-console-sitemaps.png">
            <img src="{{ site.url }}/assets/img/2019/07/google-search-console-sitemaps.png" alt="">
        </picture>
    </a>
</figure>

## Analytics

### Google Analytics

[Google Analytics](https://analytics.google.com/analytics/web/) is a web analytics service offered by Google that tracks and reports website traffic.

Inside the console, you need to create new analytics accounts and apps with the option of custom views.

Once you have it set up, you can track your audience and real time views. You can also set include/exclude filters for your website.

<figure>
    <a href="{{ site.url }}/assets/img/2019/07/google-analytics-console.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2019/07/google-analytics-console.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2019/07/google-analytics-console.png">
            <img src="{{ site.url }}/assets/img/2019/07/google-analytics-console.png" alt="">
        </picture>
    </a>
</figure>

To enable analytics for your site, add below script to your webpage with the ID of your google analytics property.

{% highlight javascript %}
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
{% endhighlight %}

## Monetization

### Google AdSense Ads

Google AdSense is a program run by Google through which website publishers in the Google Network of content sites serve text, images, video, or interactive media advertisements that are targeted to the site content and audience.

You need to submit your site for review with Google. It will take few days to weeks to have your account activated.

Once your account is activated, you can either choose enable auto ads or create custom ad units.

I would suggest to create a custom ad unit so that you can place your ads at appropriate places without affecting the user experience.

Auto ads issue: [Adsense auto ads showing on mobile but not on the desktop](https://support.google.com/adsense/thread/3490813?hl=en)

Also make sure to add ads.txt file to your site at root domain level.

{% include donate.html %}
{% include advertisement.html %}

## GDPR

The General Data Protection Regulation (GDPR) and the ePrivacy Directive (ePR) affect how you as a website owner may use cookies and online tracking of visitors from the EU.

One of the most tangible requirements of the GDPR is in the definition of what constitutes a proper cookie consent, meaning, that the consent has to be:

**_Informed: Why, how and where is the personal data used? It must be clear for the user, what the consent is given to, and it must be possible to opt-in and opt-out of the various types of cookies._**

**_Given by means of an affirmative, positive action that cannot be misinterpreted._**

**_Given prior to the initial processing of the personal data._**

**_Withdrawable. It must be easy for the user to change his or her mind and withdraw the consent._**

There are several sites which offer GDPR compliant consent function for websites.

<figure class="half">
    <a href="{{ site.url }}/assets/img/2019/07/cookie-consent-banner.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2019/07/cookie-consent-banner.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2019/07/cookie-consent-banner.png">
            <img src="{{ site.url }}/assets/img/2019/07/cookie-consent-banner.png" alt="">
        </picture>
    </a>
</figure>

## Open Graph Tags

[Open graph](http://ogp.me/) meta tags allow you to control what content shows up when a page is shared on Facebook and Twitter. 

{% highlight html %}
<meta property="og:title" content="The Rock" />
<meta property="og:type" content="video.movie" />
<meta property="og:url" content="http://www.imdb.com/title/tt0117500/" />
<meta property="og:image" content="http://ia.media-imdb.com/images/rock.jpg" />
{% endhighlight %}

## Proxy Filters

Lot of companies use proxy filters to restrict access to websites. Check if your website has been properly categorized to avoid being blocked.

<https://sitereview.bluecoat.com/#/>

## Seo Tools

Knowing how to search for keywords is an essential part of any search engine optimization (SEO) strategy. With the right terms, you can increase your search visibility and drive more traffic from your intended audience.

Below are some of the free tools (limited queries per day) available to find right keywords for your posts:

<https://lsigraph.com/>

<https://answerthepublic.com/>

{% include donate.html %}
{% include advertisement.html %}