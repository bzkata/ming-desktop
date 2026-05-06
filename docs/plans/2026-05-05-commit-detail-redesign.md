# Commit Detail Redesign

## Overview
Redesign the commit detail Sheet to show structured git diff --stat style output, add author info, and add a "only mine" filter.

## Changes

### 1. Python script: structured JSON output mode
- `scripts/generate_daily_report.py`: When env `OUTPUT_FORMAT=json`, output parsed commits as JSON instead of markdown
- JSON structure: `{ commits: [...], stats: { totalCommits, totalRepos, workHours } }`
- Each commit: `{ hash, date, author, message, repo, filesChanged, additions, deletions, branches }`

### 2. PluginManager: parse JSON commits
- `src/main/plugins/PluginManager.ts`: When format is json, read the JSON file from output dir, parse and return commits array in `data.commits`
- Fall back to markdown if JSON parsing fails

### 3. Dashboard: structured commit detail UI
- `src/renderer/components/Dashboard.tsx`:
  - Store commits as array instead of raw markdown string
  - Render each commit as a card: hash, message, **author**, date, branch, +/- stats
  - File change list per commit in diff-stat style (filename + bar + numbers)
  - Add "只看我" Switch filter in Sheet header, passes `filterByAuthor: "zhangbing"` to backend
