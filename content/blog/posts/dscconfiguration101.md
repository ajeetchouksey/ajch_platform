---
title: "PowerShell Desired State Configuration - Part 2"
excerpt: "DSC Configuration 101"
author: "Ajeet Chouksey"
date: "2016-12-01"
tags: ["dsc", "configuration-management", "devops"]
category: "DevOps"
readingTime: 1
featured: false
draft: false
---
## PowerShell Desired State Configuration (DSC)

{% highlight powershell %}
#DSC Configuration
  [DSCResource()]
  Configuration LCMSetUp
  {
      param()
        LocalConfigurationManager
        {        
           ActionAfterReboot = 'ContinueConfiguration'
           RebootNodeIfNeeded = $True
           ConfigurationMode = 'ApplyAndAutoCorrect'
           ConfigurationModeFrequencyMins = 240
           RefreshMode = 'PUSH'
        }   
  }

  #Generate MOF File
  LCMSetUp -Outputpath "c:\DSC\LCMSetUp"

  #Update LCM Properties
  Set-DscLocalConfigurationManager -path "c:\DSC\LCMSetUp"  -force -verbose

  #GET DSC Local Configuration Manager
  Get-DSCLocalConfigurationManager 

#---------DSC Configuration to Install Windows Feature---------#

  #DSC Configuration
  [DSCResource()]
  Configuration WindowFeatureInstall
  {
      param()

      Node localhost
      {
          WindowsFeature IISInstall
          {
               Name="Web-Server"
               Ensure="Present"
              IncludeAllSubfeature = $true
          }
        WindowsFeature SMTP
         {
            Name = "SMTP-Server"          
            Ensure = "Present"
            IncludeAllSubFeature = $true
            DependsOn = "[WindowsFeature]IISInstall"
         }
         LocalConfigurationManager
         {        
           ActionAfterReboot = 'ContinueConfiguration'
           RebootNodeIfNeeded = $True
         }
       }
  }

   #Generate MOF File
   WindowFeatureInstall -Outputpath "c:\DSC\WFInstall"

   #Intall Configuration
   Start-DSCConfiguration -path "c:\DSC\WFInstall" -ComputerName localhost -force -verbose -wait
{% endhighlight %}

---
Please do let me know your thoughts/ suggestions/ question in ***disqus*** section.

---