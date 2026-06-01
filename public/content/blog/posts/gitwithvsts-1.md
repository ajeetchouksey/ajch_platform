---
title: "Git with VSTS - Part 2- Git Repo"
excerpt: "Git and VSTS"
author: "Ajeet Chouksey"
date: "2017-08-02"
tags: ["vsts", "git", "devops"]
category: "DevOps"
readingTime: 1
featured: false
draft: false
---
Depending upon the requirement you can have one or more repo inside your project. You can create repos by using
	
	1. 	Web (VSTS)
	2.	CLI
	3.	Visual Studio
	4.	IntelliJ
	5. 	Xcode
	6.	Eclipse	
	
<!--more-->

## Create repo using Web

Navigate to code section -> click on project  -> New repository

```mermaid
graph LR
  CODE["Code Section\ngitdemo"] --> DROP["Repo dropdown"]
  DROP --> NR["+ New repository"]
  DROP --> IR["Import repository"]
  DROP --> MR["Manage repositories"]
```

Add a .gitignore file

```mermaid
flowchart TD
  NR["New Repository"] --> NAME["Repository Name"]
  NAME --> TYPE["Type: Git"]
  TYPE --> README["Add a README"]
  README --> GITIGNORE["Add a .gitignore\nTemplate: VisualStudio / Node / Python"]
  GITIGNORE --> CREATE["Create"]
```

```mermaid
graph LR
  REPO["Repository Created"] --> FILES["Files: README.md, .gitignore"]
  REPO --> COMMITS["Commits: Initial commit"]
  REPO --> BRANCHES["Branches: master"]
  REPO --> CLONE["Clone button → remote URL"]
```

A new empty git repo is now created in your team project. 

## Create local repo using CLI

1.	 [Download git for Windows] (https://git-scm.com/download/win)
2.	Open git bash or git cmd. Navigate to path where you would like to create repo.

```PowerShell
	git init .
```
## Cloning Repo

Get remote repo URL

```mermaid
flowchart LR
  CODE["Code Section"] --> CLONE["Clone button"]
  CLONE --> URL["HTTPS URL\nhttps://org.visualstudio.com/project/_git/repo"]
  CLONE --> IDE["Open in IDE\nVisual Studio / IntelliJ"]
```

Use following cmd to clone remote repo

```PowerShell
git remote add origin  <<URL>>
```

```mermaid
flowchart LR
  CMD["git remote add origin URL"] --> VERIFY["git remote -v"]
  VERIFY --> OUT["origin  https://org.visualstudio.com/project/_git/repo (fetch)\norigin  https://org.visualstudio.com/project/_git/repo (push)"]
```


*See git related post for  workflow, branches, authentication and pull request.*

---
Please do let me know your thoughts/ suggestions/ question in ***disqus*** section.

---