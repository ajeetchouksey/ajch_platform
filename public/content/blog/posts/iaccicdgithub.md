---
title: "IaC Deployment using VSTS Release and GitRepo"
excerpt: "IaC Deployment using VSTS Release and GitRepo"
author: "Ajeet Chouksey"
date: "2018-02-19"
tags: ["iac", "devops", "vsts", "cicd"]
category: "Cloud"
readingTime: 1
featured: false
draft: false
---
In this post we will discuss, how to setup CD for IaC. IaC code is hosted in GitHub repo.

[Before we start please refer](http://www.azure365.co.in/devops/GitwithVSTS)

<!--more-->

*   Go to Build and Release menu, click on Release  in sub menu. Choose the "+" icon to create a new release definition.Create release definition dialog, select the Empty Process.

```mermaid
flowchart TD
  A["Build & Release → Release → +"] --> B["Create Release Definition\nSelect: Empty Process"]
  B --> C["Environment Name: Dev / Prod\nSet owner"]
  C --> D["Add Artifacts\nSource Type: GitHub"]
  D --> E["Create GitHub Service Endpoint\nAuthorize with OAuth or PAT"]
  E --> F["Select Repository and Branch\ne.g. IaCLab / master"]
  F --> G["Configure Trigger\nScheduled or On every artifact change"]
```

Let's add deployment task, search for Azure Deployment.

```mermaid
flowchart TD
  T1["Add Task: Azure Resource Group Deployment"] --> T2["Azure Subscription: service endpoint\nAction: Create or update\nResource Group: RG-Name"]
  T2 --> T3["Variables: adminPassword, vmName\nper-environment overrides"]
  T3 --> T4["Template Source: URL\nhttps://raw.githubusercontent.com/.../azuredeploy.json"]
  T4 --> T5["Override Parameters:\n-adminPassword \$(adminPassword)\n-vmName \$(vmName)"]
  T5 --> T6["Deployment Mode: Incremental"]
  T6 --> T7["Save Definition"]
```

Create release for deployment

```mermaid
flowchart TD
  R["Create Release\nRelease-1"] --> ENV["Select Environments\nDev / Production"]
  ENV --> CREATE["Click Create\nRelease queued"]
  CREATE --> DEPLOY["Click Deploy\nStart deployment"]
  DEPLOY --> AGENT["Waiting for hosted agent\nMicrosoft-hosted VS2017"]
  AGENT --> EXEC["ARM template deployed\nto Azure Resource Group"]
  EXEC --> LOGS["Click Logs\nStep-by-step progress:\nInitialize, Download, ARM deploy, Verify"]
  LOGS --> DONE["Deployment succeeded\nResources created in Azure"]
```