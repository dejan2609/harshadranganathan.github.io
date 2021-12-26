---
layout: post
title: "Things I Tried As A Team Lead"
date: 2021-12-25
excerpt: "Opinionated article on the things I tried as a Team Lead - what worked and what didn't work"
tag:
- Team Lead
comments: true
---

## Documentation

Documentation is one of the important things to be done for any team.

Documentation has many benefits:
- Information easily accessible for all team members
- Helps to understand how the system works
- Helps team members on how to run the code & troubleshoot

and many more...

Also, when people face issues executing a code or take more time to troubleshoot an incident etc. following questions are the first to be asked by managers/leadership:

- Is it documented?

- Can we document it so that everyone is aware?

etc. and they don't focus on solving the real problem.

In reality, even if you document things, sometimes teams either don't refer the documentation or still do mistakes etc. for a variety of reasons:

- lack of clarity in the documentation
- quick to blame nature 
- not aware that documentation exists 
- not able to find correct documentation
- not spending time on reading the documentation
etc. 

But nevertheless, it's good to have things documented, so that next time someone raises question around "Is it documented? Maybe we should do that" you could quickly answer that it's already done and show it to them so that they will start to focus on the real problem next.

Also, if you don't document:

- team members struggle and spend more time trying to figure out things (it still happens even if you document - for reasons stated above)
- repeated questions being asked by various teams/members and you end up giving same answers over a period of time

Some challenges that often arise with documentation:

- engineers mention lack of time
- assumptions that certain things are well known
- lack of understanding on what's needed from a user/novice/intermediate perspective
etc.

Things that I implemented in my team:

### Microsite/Sharepoint/Confluence Space

Depending on the documentation platform that your company uses you could leverage it to maintain a centralized documentation.

I prefer Microsites generated with static site generator tools such as mkdocs, docusaurus etc, for reasons being:

- Docs are maintained in a code repo
- Engineers write markdowns anyway with README's for each code repo so it's similar thing they have to do with static site generators
- Enterprises switch tools sometimes e.g. move from Confluence to Sharepoint for pricing, deals etc, and import/export makes things messy. Also, if you were using any vendor specific plugins e.g. draw.io then you might face issues if you can't port your diagrams to the new platform
- Documentation is reviewable through PR's - you can offer suggestions
- Establish general documentation guidelines via PR templates

<figure>
    <a href="{{ site.url }}/assets/img/2021/12/microsite-doc-sections.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2021/12/microsite-doc-sections.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2021/12/microsite-doc-sections.png">
            <img src="{{ site.url }}/assets/img/2021/12/microsite-doc-sections.png" alt="">
        </picture>
    </a>
</figure>

Some general guidelines I established for the team to follow:

1. Use concise headings
2. Use searchable keywords - e.g. for a troubleshooting guide add the exception message in the doc so that team members can simply search for the exception and find out the remediation steps
3. Provide code examples 
4. Leverage code syntax highlighting features
5. Use screenshots along with textual walkthrough - e.g. how to connect to a database using a software tool

   For some folks, walkthrough through screenshots helps to understand things better compared to text. Although this means more maintenance effort since we have to update the screenshots as tools get updated, we need to think it from the end user perspective. Our main aim is to write docs and make it easier for the person reading it to understand things - Not to make it easier for us to write and complete it for namesake - Otherwise, you may still end up having to clarify things via chat.

   Even if you add screenshots, it's good to have it written as text to make it searchable.

   It's a delicate balance between using screenshots and texts. We shouldn't overdo with screenshots - use  it only where necessary - PR reviews help to maintain the balance.

6. Provide as much detail as possible
7. Don't assume people may know something
8. Preview your changes to ensure they are properly formatted - images are loading - styles are rendered etc.
9. Read what you've written before raising the PR

    Check if what you've written makes sense for a new team member/external team member
    
    Check if you've used keywords which would potentially be used for searching the information - if people can't find a document they are going to ping you and take more of your time so it's wise to spend this time upfront


Problems faced:

1. Requires constant practice for engineers to get in the process of writing docs following the guidelines
2. Each have their own style of writing - don't strictly expect members to follow same style as yours
3. Team members who are new to writing meaningful/readable docs require more training - guide them with suggestions in PR on how they could improve

{% include donate.html %}
{% include advertisement.html %}

### Docs Backlog

Create a new backlog for capturing items to be documented. These could be -

- frequently asked questions
- items pending to be documented
- architecture designs
- guideline docs
- existing docs to be updated for more clarity
- runbooks
- troubleshooting guides as new issues encountered
etc.

<figure>
    <a href="{{ site.url }}/assets/img/2021/12/github-issues-doc-backlog.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2021/12/github-issues-doc-backlog.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2021/12/github-issues-doc-backlog.png">
            <img src="{{ site.url }}/assets/img/2021/12/github-issues-doc-backlog.png" alt="">
        </picture>
    </a>
</figure>

Problems faced:
1. Every team member needs to contribute to the backlog - this requires commitment from team members
2. Constant reminder needed for team members in standup that any items they debug and resolve, any individual pings they receive for more clarity needs to be added to the backlog so that we can address them, avoid repeated answers and save time spent on support in future

### Weekly Docs Contribution

We would like team members to contribute docs on a recurring basis - when they find time, working on related tasks etc.

But in reality this doesn't happen as team members are busy with delivery.

So, we have to start enforcing things.

One idea I had implemented is to ask team members to contribute docs on a weekly basis.

We chose `Friday` as the day team members will spend an hour or so for writing docs. Friday is usually when team members wind up on items, bit relaxing day so it made sense to utilize that day and ask members to contribute for docs.

Next is how to enforce it -

1. We added a reminder card to Teams planner tab - e.g. Friday Docs with reminder/due date
2. On Thursday standup, we will bring up the docs backlog list and pick items we think are of quick wins/priority to be documented
3. As a team, we would discuss 

    what each member will be contributing on and assign items<br/>
    check if sufficient details are available for the task<br/>
    clarify any doubts

4. On Friday, team members would spend some time to contribute docs and raise PR

On a recurring basis, this practice worked well.

<figure>
    <a href="{{ site.url }}/assets/img/2021/12/teams-planner-card-friday-docs.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2021/12/teams-planner-card-friday-docs.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2021/12/teams-planner-card-friday-docs.png">
            <img src="{{ site.url }}/assets/img/2021/12/teams-planner-card-friday-docs.png" alt="">
        </picture>
    </a>
</figure>

Problems faced:
1. Requires the standup facilitator to bring up the card on Thursday's
2. Sometimes, team members still end up not delivering on docs so need to remind for next week

{% include donate.html %}
{% include advertisement.html %}

### External Contributors

If you have limited team members/more items to document, it might make sense to bring in external contributors to scale up the activity.

Couple of approaches to bring in external contributors:
- Market that they get a chance to work and learn with your team on the topic they document
- Incentivize external contributions by giving thank you points, thank you emails or callouts in meetings.
- Don't fix hard deadlines for doc delivery

Although this involves spending little bit more time with external contributors on explaining the process, walkthroughs, supporting them by providing required details etc.

### PRs

- If PR's don't have README updated (depends on the change) suggest to have it done before giving approval

- If PR's need to be approved due to urgency of the change, then ask the team member to raise an issue in the repo so that it's tracked as a pending item to be worked upon later

{% include donate.html %}
{% include advertisement.html %}
## Daily Standup

- Assign standup facilitator or rotate it among team members every week/sprint
- Ensure quick round table of updates 
- If any team member derails the standup updates remind them to instead bring it up in the parking lot as every team member needs to first finish providing their updates
- Ensure standup doesn't exceed the alloted time limit
- If any items require more discussion check with the team to see if they wish to continue in the same meeting/provide small break/ask the team member to create a dedicated meeting for further discussion etc.

Also, as a team lead the daily standup is a good place to provide:
- any general updates 
- check status on any specific work items
- any specific items to be briefly discussed

### Standup Cards

Sometimes, people forget what they had planned to raise in the standup.

So, I introduced a process to raise cards in the teams planner tab called `Daily Standup Items` where team members/team lead can quickly add a card with due date for discussion as and when it comes to their mind.

Then, in the daily standup ceremony we go through these cards and the member who raised it provides updates/asks questions. In this way, we don't miss things to be raised in the standup.

<figure>
    <a href="{{ site.url }}/assets/img/2021/12/teams-planner-card-friday-docs.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2021/12/teams-planner-card-friday-docs.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2021/12/teams-planner-card-friday-docs.png">
            <img src="{{ site.url }}/assets/img/2021/12/teams-planner-card-friday-docs.png" alt="">
        </picture>
    </a>
</figure>

Problems faced:
1. Needs to be part of regular ceremony of things done in standup
2. Sometimes, there might be more cards so try to pick cards which are important from team's perspective to be discussed right now and cards which can be delayed
3. Some team members prefer to have their own personal notes

{% include donate.html %}
{% include advertisement.html %}

## Retrospectives

- In a tool of your choice, have different columns such as `Start`, `Stop`, `Continue` and `Action Items`
- Rotate the retro facilitator every sprint
- Start timer for `10-15 mins` and have the team members populate the cards for each section
- Retro facilitator goes through the cards and works with team to see what cards can be merged (as duplicates) and what cards need more clarity
- Start timer for `5 mins` to vote on cards - each team member is given certain number of votes which they use to indicate what is important to be addressed
- Retro facilitator works with the team to generate action items and ownership for the cards

<figure>
    <a href="{{ site.url }}/assets/img/2021/12/retro-board.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2021/12/retro-board.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2021/12/retro-board.png">
            <img src="{{ site.url }}/assets/img/2021/12/retro-board.png" alt="">
        </picture>
    </a>
</figure>

Typically, every team struggles with retrospective action items:
- card is not actionable since it requires more authority
- team lead/member who has the action item assigned is busy so they come up with an excuse of `I was busy/no time/forgot` in the next retrospective
- not all cards have action items assigned - so a team member could feel that their card is ignored

In the end, retrospective becomes more of a place where people can vent their frustrations on a recurring basis and less problems get resolved.

What I did:
- Even if a retro card didn't get the votes if it feels to be an important item to be addressed even for a single team member then spend some time to provide tips/address concerns/generate an action item for it
- Pick only reasonable action items - things that could be solved by the team/by manager - anything that requires more authority raise it as a feedback to manager 
- Add a card to `Daily Standup Items` with a due date set to mid of the sprint to have a `Retro checkpoint` to share any updates on the action items/to remind team members of pending action items etc.

<figure>
    <a href="{{ site.url }}/assets/img/2021/12/teams-planner-card-retro-checkpoint.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2021/12/teams-planner-card-retro-checkpoint.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2021/12/teams-planner-card-retro-checkpoint.png">
            <img src="{{ site.url }}/assets/img/2021/12/teams-planner-card-retro-checkpoint.png" alt="">
        </picture>
    </a>
</figure>

{% include donate.html %}
{% include advertisement.html %}

## Backlog Grooming

- Do frequent groomings instead of one big grooming call e.g. have the grooming meeting every week or break it down to smaller sessions based on team feedback
- Encourage team conversations rather than you just providing all the required details
- Remove any fear within team members by having conversations with them that it is okay to say you don't understand the story or it needs more details
- Do a round table if you notice that any team members are not participating by providing their inputs/raising questions/feedback
- Ensure that the story has enough details for anyone in the team to work on it
- Use any tools to get the story point size from all team members 
- Always try to go with a bigger estimation when in doubt rather than a smaller one
- If any team member gives very high estimation ask them the reason to see if it's justified - split stories to multiple smaller ones if needed
- For any stories that are new to the team check if a spike is needed - if so try to have it in the sprint prior to the work so that feasibility/approach to be used/gotchas are known prior to the implementation. Based on the spike further discussions can happen
- If you have new team members they may not be in a position to know if the story has required details - ask them to go through the story during the week and come up with any questions for the next grooming call

Problems faced:
- Getting team participation is always a difficult task - it requires commitment from every team member
- Some team members end up asking more questions/indicate they have no idea on what needs to be done after picking up the story
- Sometimes team members assume that they may not be working on a particular story so they don't need to worry about if adequate details are present in the story
- More experience/domain knowledge may be needed to assess impacts/risks associated with a work item

{% include donate.html %}
{% include advertisement.html %}

## PI Planning

- Use any whiteboarding tools to plan work items across sprints
- Get inputs from team members to allocate any technical debt/backlog items that they would like to focus on in the upcoming PI and see if it can be accommodated
- Add sections/different areas that the team could focus on - e.g. CI/CD, security etc. so that everything is covered
- Prioritize the backlog to see potential items that could be worked upon to fill any gaps in PI
- Publish the planning to other dependent teams to that they could take a look at raise any items missed out

<figure>
    <a href="{{ site.url }}/assets/img/2021/12/pi-planning-board.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2021/12/pi-planning-board.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2021/12/pi-planning-board.png">
            <img src="{{ site.url }}/assets/img/2021/12/pi-planning-board.png" alt="">
        </picture>
    </a>
</figure>


{% include donate.html %}
{% include advertisement.html %}
## Task Assignment

Ideal state:
- Team members pick tasks to work on as they finish each item
- Team members indicate if they are blocked/need additional support
- Team members are aware of the priority tasks

Reality:
- Team members wait for tasks to be assigned
- Team members take additional time before they reach a conclusion they they need more support/mention it only when asked
- Team members wait for standup to raise that they are blocked - instead they could have quickly mentioned in group chat
- Team members work on low priority items/not aware of priority

What I did:
- To go to the ideal target state, we need to go step by step - so started assingning tasks explicitly to team members while working to develop a culture where members pick tasks themselves based on priorities
- If there is a sense that a team member seems to be struggling or taking more time to deliver, check with them if they need more support or swap tasks as required
- Sort the work items in the sprint board based on priority so team members always pick from the top
- Incase, the priority keeps changing - have a weekly Monday call to clarify the priority items for the week

{% include donate.html %}
{% include advertisement.html %}
## Design Discussions/Spikes

- Sometimes team members jump on a hype train/trending tech/pick something they learnt in a course and decide to use that approach for a story
- Always as part of a spike, ask the team member to come up with the list of approaches they evaluated, pros/cons of each approach, recommendations and schedule a team meeting within an agreed time box
- Share analysis report with the team in advance before the meeting so that they can read through it and come prepared
- In the team meeting, evaluate the approaches and recommendation from the team member, ask questions and decide if further analysis needed based on new inputs/risks/impacts
- Prefer incremental improvements
- Assess if the solution is unnecessarily complicated/over-engineered

<figure>
    <a href="{{ site.url }}/assets/img/2021/12/spike-analysis-template.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2021/12/spike-analysis-template.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2021/12/spike-analysis-template.png">
            <img src="{{ site.url }}/assets/img/2021/12/spike-analysis-templates.png" alt="">
        </picture>
    </a>
</figure>

Problems faced:
- Theoretical vs Practical analysis
- Delivery constraints force options

{% include donate.html %}
{% include advertisement.html %}

## Technical Backlog


## JADs


## Priorities


## Team Communication Model


## PRs


## Mentorship


## Newsletters


## External Support


## Meetings



## Manager Discussions



## General Tips