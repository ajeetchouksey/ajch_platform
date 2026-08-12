param(
  [string]$Repo      = "ajeetchouksey/ajch_platform",
  [string]$Assignee  = "ajeetchouksey",
  [int]   $Milestone = 8
)

# Week plan — balanced ~5-6 per week, high-value verticals first
# Week 1 (Aug 10-16): Banking — highest MVP/financial domain signal
# Week 2 (Aug 17-23): HR — ops crossover, existing employee-onboarding base
# Week 3 (Aug 24-30): Manufacturing — safety-ops-chatbot already exists
# Week 4 (Aug 31-Sep 7): Retail + Technology — net-new verticals
$weekPlan = @{
  1 = @(356, 357, 358, 359, 365)         # Banking x4, HR x1
  2 = @(366, 367, 368, 352, 353)         # HR x3, Manufacturing x2
  3 = @(354, 355, 360, 361, 362)         # Manufacturing x2, Retail x3
  4 = @(363, 364, 369, 370, 371, 372, 373) # Retail x2, Technology x5
}

Write-Host "Assigning, setting milestone, and adding week labels..."

foreach ($week in $weekPlan.Keys | Sort-Object) {
  foreach ($n in $weekPlan[$week]) {
    # Assign + milestone
    $r = gh api --method PATCH "repos/$Repo/issues/$n" `
      --field "assignees[]=$Assignee" `
      --field "milestone=$Milestone" `
      --jq '"\(.number) assigned=\(.assignees[0].login // "none") milestone=\(.milestone.number // "none")"' 2>&1
    # Add week label
    gh api --method POST "repos/$Repo/issues/$n/labels" `
      --field "labels[]=week-$week" | Out-Null
    Write-Host "  #$n  week-$week  $r"
  }
}

Write-Host ""
Write-Host "Done. Milestone: https://github.com/$Repo/milestone/$Milestone"
