---
title: "Include Pester Test as part of VSTS Build"
excerpt: "IaC Unit Test using Pester Test"
author: "Ajeet Chouksey"
date: "2018-03-29"
tags: ["devops", "iac", "pestertest"]
category: "DevOps"
readingTime: 1
featured: false
draft: false
---
In this post, I will walk you through how to include pester test as part of your CI pipeline in VSTS.

Read more about [IaC Unit Test using Pester Test](http://www.azure365.co.in/devops/IaCUnitTestPester)

<!--more-->

**1. Add Pester Test Runner task from VSTS market place**

```mermaid
flowchart TD
  BUILD["VSTS Build Pipeline"] --> MKT["Extensions Marketplace\nSearch: Pester"]
  MKT --> TASK["Pester Test Runner\nby Pester"]
  TASK --> INSTALL["Install free extension"]
  INSTALL --> ADD["Task available in Add Task panel"]
```

**2.  Mention the script folder and script file**

```mermaid
graph TD
  PTASK["Pester Test Runner Task"] --> SF["Script Folder: \$(Build.SourcesDirectory)"]
  PTASK --> FP["Script File Pattern: *.Tests.ps1"]
  PTASK --> OUT["Results File: pester_test_results.xml"]
  PTASK --> NJ["NUnit XML Output: enabled"]
```

**3.Pester support out put as NUnit. Configure Publish test result task to display test report in VSTS build dashboard.**

```mermaid
graph TD
  PUB["Publish Test Results Task"] --> FMT["Format: NUnit"]
  PUB --> FILE["Results File: pester_test_results.xml"]
  PUB --> COND["Run even if previous task fails: true"]
  PUB --> DASH["Displays on Build Summary\nTest Results tab"]
```

**4. Execute the build**

```mermaid
flowchart LR
  QUEUE["Queue Build"] --> AGENT["Hosted VS2017 Agent"]
  AGENT --> P1["Phase 1: Run Pester Tests"]
  P1 --> P2["Publish Test Results"]
  P2 --> DONE["Build Completes\nTests reported"]
```

**5.  Test result in Build summary.**

```mermaid
graph LR
  SUMMARY["Build Summary"] --> TESTS["Test Results\nX passed, Y failed\nPester test run"]
  TESTS --> RATE["Pass Rate: 100%\nTest duration shown"]
```

**5.  More details about test results.**

```mermaid
graph TD
  DETAIL["Test Results Details"] --> TC1["Test: Should have valid schema\nResult: Passed"]
  DETAIL --> TC2["Test: Should deploy to correct RG\nResult: Passed"]
  DETAIL --> TC3["Test: Should have required params\nResult: Passed"]
  DETAIL --> META["Duration, Error message if failed"]
```