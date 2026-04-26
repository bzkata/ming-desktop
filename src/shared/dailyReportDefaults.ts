/** 日报 Markdown 模板占位符：{date} {total_commits} {total_repos} {work_hours} {commit_details} {stats} {generated_at} */
export const DEFAULT_DAILY_REPORT_TEMPLATE = `# 工作日报 - {date}

## 📋 概览
- 提交总数: {total_commits}
- 涉及仓库: {total_repos} 个
- 工作时间: {work_hours} 小时

## 📝 详细内容

{commit_details}

## 📊 统计
{stats}

---
*生成时间: {generated_at}*
`;

/** Daily Reporter Agent 的默认系统提示词（可在设置中覆盖） */
export const DEFAULT_DAILY_REPORTER_SYSTEM_PROMPT = `You are a daily report generator. You help users create professional daily work reports based on their Git commit history.
Focus on:
- Clear, concise descriptions of work done
- Proper categorization by project
- Highlighting important achievements
- Maintaining a professional tone`;
