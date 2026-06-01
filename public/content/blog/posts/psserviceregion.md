---
title: "PowerShell to find service availability across the regions"
excerpt: "PowerShell to find service availability across the regions"
author: "Ajeet Chouksey"
date: "2017-07-30"
tags: ["powershell"]
category: "Azure"
readingTime: 1
featured: false
draft: false
---It's always good to have pre-flight validation check. Many time we have face the problem where end customer is deploying service/s which is not available to desired region. Output of the below script return the regions where the particular service.

<!--more-->

{% highlight powershell %}
$resources = Get-AzureRmResourceProvider -ProviderNamespace Microsoft.Compute
$resources.ResourceTypes.Where{($_.ResourceTypeName -eq 'virtualMachines')}.Locations
{% endhighlight %}

```mermaid
graph LR
  SCRIPT["PowerShell"] --> CMD["Get-AzureRmResourceProvider\n-ProviderNamespace Microsoft.Compute"]
  CMD --> FILTER[".ResourceTypes.Where ResourceTypeName -eq virtualMachines\n.Locations"]
  FILTER --> REGIONS["Available Regions:\nEast Asia, Southeast Asia\nAustralia East, Australia Southeast\nBrazil South, Canada Central, Canada East\nNorth Europe, West Europe\nEast US, East US 2, West US, West US 2\nJapan East, Japan West\nIndia Central, India South, India West"]
```

---
Please do let me know your thoughts/ suggestions/ question in ***disqus*** section.

---