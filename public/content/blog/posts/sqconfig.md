---
title: "Deploy and Configure SonarQube"
excerpt: "Deploy and Configure Sonarqube"
author: "Ajeet Chouksey"
date: "2020-07-15"
tags: ["sonarqube"]
category: "Azure"
readingTime: 2
featured: false
draft: false
---
In this post, I will walk you through some of the best practices that helps you to complete post deployment configuration of SonarQube.

<!--more-->

### Change Admin Password

> ***First Thing First***

Post-deployment login into SonarQube using following default credentials for SonarQube.
  
- user:  **admin**
- password: **admin**

After login, go to the administration and select security - users

```mermaid
flowchart TD
  LOGIN["Login\nuser: admin / password: admin"] --> ADMIN["Administration → Security → Users"]
  ADMIN --> ICON["Click password icon for admin user"]
  ICON --> DLG["Change Password\nOld password: admin\nNew password: strong password\nConfirm password: same"]
  DLG --> SAVE["Save → Password changed"]
```

#### Force authentication

```mermaid
graph LR
  SEC["Administration → Configuration → Security"] --> FA["Force user authentication: ON\nUsers must be logged in to view any project"]
```

After enabling the force security option no one able to see the project's analysis summary without login.

#### Configure Server base URL

```mermaid
graph LR
  GEN["Administration → Configuration → General Settings"] --> URL["Server base URL\nhttps://yourserver:9000\nUsed for email notifications and webhooks"]
```

### Create Project

SonarQube provides 2 ways to create a project.

```mermaid
flowchart TD
  HOME["SonarQube Projects Page"] --> BTN["Create new project"]
  BTN --> KEY["Project Key: my-project-key\nno spaces, unique identifier\nrequired for CI/CD integration"]
  KEY --> NAME["Display Name: My Project"]
  NAME --> SETUP["Setup options:\nLocally or with CI/CD Azure DevOps"]
```

### Configure Tokens

> **Recommanded**

If you want to enforce security by not providing credentials of a real SonarQube user to run your code scan or to invoke web services, you can provide a User Token as a replacement of the user login. This will increase the security of your installation by not letting your analysis user's password going through your network.

These tokens are used to create Service endpoint with Azure DevOps.

Administrator - My Account - Security

```mermaid
flowchart TD
  MYACC["My Account → Security → Generate Tokens"] --> GEN["Token Name: azure-devops-token"]
  GEN --> TYPE{"Token type"}
  TYPE --> U["User Token\nworks across all projects"]
  TYPE --> P["Project Analysis Token\nsingle project scope"]
  U & P --> VALUE["Token value shown once only\nCopy and store securely"]
  VALUE --> USE["Used in Azure DevOps\nService Endpoint configuration"]
```

### Create and Add Users

#### Create User

SonarQube allows creating local users

```mermaid
flowchart TD
  USERS["Administration → Security → Users"] --> CREATE["+ Create User\nLogin, Name, Email, Password"]
  CREATE --> ACTIVE["User active in users list"]
  ACTIVE --> PRJ["Project → Project Settings → Permissions"]
  PRJ --> ADD["Add User → search by login"]
  ADD --> PERMS["Assign permissions:\nBrowse\nExecute Analysis\nAdminister Project\nAdminister Issues"]
  PERMS --> NOTE["Without Execute Analysis:\nlimited menu options visible"]
```

*Menu options are limited now*.

## Configure with AAD

Refer [sonar-auth-aad](https://github.com/hkamel/sonar-auth-aad/wiki/Setup) document to configure AAD authentication for SonarQube.

## Work with Azure DevOps Pipeline

Refer [MS Documentation](https://docs.sonarqube.org/latest/analysis/scan/sonarscanner-for-azure-devops/) to configure SonarQube server with Azure DevOps pipeline.

## Other Readings

* [SonarQube Tool Assessment- 1 (understand reporting)](http://www.azure365.co.in/devops/3PDevOps-4)
* [SonarQube Tool Assessment- 2 (understand plan and pricing)](http://www.azure365.co.in/devops/3PDevOps-5)
