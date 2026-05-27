---
title: "Azure VNET provisioning using CLI"
excerpt: "Azure VNET provisioning using CLI"
author: "Ajeet Chouksey"
date: "2017-07-04"
tags: ["vnet", "cli", "70-533"]
category: "Azure"
readingTime: 1
featured: false
draft: false
---
The Azure CLI 2.0 is Azure's new command-line experience for managing Azure resources. You can use it in your browser with Azure Cloud Shell, or you can install it on macOS, Linux, and Windows and run it from the command line.

<!--more-->

   *     --vnet. Name of the VNet to be created. 
   *     -e or --address-space. VNet address space.
   *    -i or -cidr. Network mask in CIDR format.
   *   -n or --subnet-name. Name of the first subnet.
   *   -p or --subnet-start-ip. Starting IP address for subnet, or subnet address space.
   *   -r or --subnet-cidr. Network mask in CIDR format for subnet.
   *   -l or --location. Azure region where the VNet will be created.

```PowerShell
# Create a resource group
            az group create   --name $myResourceGroup   --location $location
# Create a VNET with single subnet
            azure network vnet create --vnet TestVNet -e 192.168.0.0 -i 16 -n FrontEnd -p 192.168.1.0 -r 24 -l "Central US"
# Create an additional subnet
            azure network vnet subnet create -t TestVNet -n BackEnd -a 192.168.2.0/24
# List VNET
            azure network vnet show
# Cleanup the deployment
            az group delete --name myResourceGroup
```
