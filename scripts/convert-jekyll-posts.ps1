$ErrorActionPreference = 'Stop'

$sourceDir = "C:\Users\ajeet.k.chouksey\OneDrive - Avanade\blog\_posts"
$targetDir = "C:\Users\ajeet.k.chouksey\Documents\Code\ajch_platform\public\content\blog\posts"
$indexPath = "C:\Users\ajeet.k.chouksey\Documents\Code\ajch_platform\public\content\blog\index.json"

# These already exist in the platform - do not overwrite
$skipSlugs = @('agents-are-a-new-execution-layer','github-governance-best-practices','guardrails-are-not-constraints')

function Get-WordCount([string]$text) {
    $clean = $text -replace '(?s)\{%\s*highlight.*?%\}.*?\{%\s*endhighlight\s*%\}', ' '
    $clean = $clean -replace '(?s)```.*?```', ' '
    $clean = $clean -replace '!\[.*?\]\(.*?\)', ' '
    $clean = $clean -replace '\[.*?\]\(.*?\)', ' '
    $clean = $clean -replace '[<>|#*_`~]', ' '
    $words = ($clean -split '\s+' | Where-Object { $_.Length -gt 0 }).Count
    return $words
}

function Get-YamlScalar([string]$fm, [string]$key) {
    if ($fm -match "(?m)^${key}:\s*(.+)$") {
        $v = $Matches[1].Trim()
        $v = $v -replace '^"(.*)"$','$1'
        $v = $v -replace "^'(.*)'$",'$1'
        return $v.Trim()
    }
    return $null
}

function Get-YamlArray([string]$fm, [string]$key) {
    if ($fm -match "(?m)^${key}:\s*\[(.+)\]") {
        return ($Matches[1] -split ',') | ForEach-Object { $_.Trim().Trim('"').Trim("'") } | Where-Object { $_ -ne '' }
    }
    return @()
}

function Normalize-Tag([string]$t) {
    return ($t.ToLower().Trim() -replace '\s+','-')
}

function Get-Slug([string]$baseName) {
    $part = $baseName -replace '^\d{4}-\d{1,2}-\d{1,2}-',''
    $part = $part -replace '\.','-'
    return $part.ToLower()
}

function Normalize-Date([string]$raw) {
    if ($raw -match '^(\d{4})-(\d{1,2})-(\d{1,2})$') {
        return '{0}-{1:D2}-{2:D2}' -f [int]$Matches[1],[int]$Matches[2],[int]$Matches[3]
    }
    return $raw
}

# Read existing index — keep only the 3 original platform posts (not previously converted Jekyll posts)
$existingIndex = Get-Content $indexPath -Raw | ConvertFrom-Json
$existingPosts = @($existingIndex.posts | Where-Object { $skipSlugs -contains $_.slug })

$newEntries = [System.Collections.Generic.List[hashtable]]::new()
$converted = 0
$skipped = 0

foreach ($file in (Get-ChildItem $sourceDir -Filter '*.md' | Sort-Object Name)) {
    $raw = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)

    # Normalize line endings to LF for regex
    $raw = $raw -replace '\r\n',"`n"

    # Split frontmatter from body (allow trailing whitespace on --- delimiters)
    if ($raw -notmatch '(?s)^---[ \t]*\n(.*?)\n---[ \t]*\n(.*)') {
        Write-Warning "Cannot parse frontmatter: $($file.Name)"
        continue
    }
    $fmText = $Matches[1]
    $body   = $Matches[2]

    $title       = Get-YamlScalar $fmText 'title'
    $description = Get-YamlScalar $fmText 'description'
    $modified    = Get-YamlScalar $fmText 'modified'
    $tagsArr     = @(Get-YamlArray $fmText 'tags')
    $catsArr     = @(Get-YamlArray $fmText 'categories')

    $slug = Get-Slug $file.BaseName

    if ($skipSlugs -contains $slug) {
        Write-Host "SKIP (existing): $slug"
        $skipped++
        continue
    }

    # Date: prefer modified, else filename
    if ($modified) {
        $date = Normalize-Date $modified
    } elseif ($file.BaseName -match '^(\d{4})-(\d{1,2})-(\d{1,2})-') {
        $date = '{0}-{1:D2}-{2:D2}' -f [int]$Matches[1],[int]$Matches[2],[int]$Matches[3]
    } else {
        $date = '2020-01-01'
    }

    # Excerpt: prefer description, else first 150 chars of body text
    $excerpt = $description
    if (-not $excerpt -or $excerpt.Trim() -eq '') {
        $bt = $body -replace '<!--more-->',''
        $bt = ($bt -split '\n' | Where-Object { $_ -match '\S' -and $_ -notmatch '^[-#!*]' -and $_ -notmatch '^\s*---' } | Select-Object -First 2) -join ' '
        $bt = $bt.Trim()
        $excerpt = if ($bt.Length -gt 150) { $bt.Substring(0,150) } else { $bt }
    }
    $excerpt = $excerpt.Trim()

    # Category
    $category = if ($catsArr.Count -gt 0) { $catsArr[0].Trim() } elseif ($tagsArr.Count -gt 0) { $tagsArr[0].Trim() } else { 'DevOps' }
    if ($category -eq 'Azures') { $category = 'Azure' }

    # Tags (lowercase, hyphenated)
    $normTags = @($tagsArr | ForEach-Object { Normalize-Tag $_ })

    # Reading time
    $wc = Get-WordCount $body
    $rt = [Math]::Max(1, [Math]::Ceiling($wc / 200))

    # Escape for YAML double-quoted strings
    $titleYaml   = $title   -replace '"',"'"
    $excerptYaml = $excerpt -replace '"',"'"

    $tagsLine = ($normTags | ForEach-Object { "`"$_`"" }) -join ', '

    $newFM = @"
---
title: "$titleYaml"
excerpt: "$excerptYaml"
author: "Ajeet Chouksey"
date: "$date"
tags: [$tagsLine]
category: "$category"
readingTime: $rt
featured: false
draft: false
---
"@

    $outContent = $newFM + $body
    $outPath = Join-Path $targetDir "$slug.md"
    [System.IO.File]::WriteAllText($outPath, $outContent, [System.Text.UTF8Encoding]::new($false))

    $entry = [ordered]@{
        slug        = $slug
        title       = $title
        excerpt     = $excerpt
        author      = 'Ajeet Chouksey'
        date        = $date
        updated     = $null
        tags        = $normTags
        category    = $category
        readingTime = $rt
        featured    = $false
        draft       = $false
    }
    $newEntries.Add($entry)
    $converted++
    Write-Host "OK  $slug  ($date)  [$rt min]"
}

Write-Host "`nConverted: $converted  |  Skipped: $skipped"

# Merge: existing posts + new entries, sort by date desc
$allPosts = [System.Collections.Generic.List[object]]::new()

foreach ($p in $existingPosts) {
    $allPosts.Add($p)
}
foreach ($e in $newEntries) {
    $allPosts.Add([PSCustomObject]$e)
}

$sorted = $allPosts | Sort-Object { [DateTime]::ParseExact($_.date,'yyyy-MM-dd',$null) } -Descending

# Build JSON
$indexObj = [ordered]@{ posts = @($sorted) }
$json = $indexObj | ConvertTo-Json -Depth 10
# Fix null values (PowerShell may emit "null" string incorrectly in some versions)
Set-Content -Path $indexPath -Value $json -Encoding UTF8 -NoNewline

Write-Host "index.json updated — total posts: $($sorted.Count)"
