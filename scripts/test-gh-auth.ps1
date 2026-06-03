pwsh -NoProfile -Command "
  `$log = 'C:\Users\ajeet.k.chouksey\Documents\Code\ajch_platform\gh-debug.txt'
  try {
    `$auth = gh auth status 2>&1
    `$auth | Set-Content `$log
    `$user = gh api user --jq '.login' 2>&1
    `"gh user: `$user`" | Add-Content `$log
  } catch {
    `"ERROR: `$_`" | Set-Content `$log
  }
"
