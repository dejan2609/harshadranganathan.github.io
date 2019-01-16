---
layout: post
project: true
title:  "mean-nw-app"
date:   2019-01-16
excerpt: "MEAN Stack Node Webkit Application"
tag:
- mean-stack 
- mean
- nwjs
- expressjs
- angular
- mongoosejs
- socket-io
comments: true
---

To develop a lightweight desktop application which can be used by Managers, Team Lead and Team Members to create and assign tasks. 

As people work in multiple projects it becomes difficult to keep track of the tasks and do an efficient planning. To track the time spent on each task and provide a way for Managers, Team leads to track the tasks currently being done by each team member. 

The application  also allows managers and team lead to specify task priorities. On task assignment, the team member receives desktop notification.

GIT Repo - <a href="https://github.com/HarshadRanganathan/mean-nw-app">https://github.com/HarshadRanganathan/mean-nw-app</a>

This is a client server application with below components:

Client side:
  - [Angular 1.3](http://devdocs.io/angularjs~1.3/)
  - [Node WebKit](https://github.com/nwjs/nw.js/) (Build desktop applications)
  - [Socket](https://socket.io/) (Event messaging)
  - [LDAP](http://ldapjs.org/) (User authentication)
  - [nw-notify](https://github.com/cgrossde/nw-notify) (Desktop Notification)

Server side:
  - [Express](https://expressjs.com/) (Node.js web framework)
  - [Socket](https://socket.io/) (Event messaging)
  - [JWT](https://jwt.io/) (Token authentication)
  - [Mongoose ODM](http://mongoosejs.com/)