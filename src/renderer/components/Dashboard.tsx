import { useState, useEffect } from 'react';
import { Calendar, Clock, GitBranch, FileText, TrendingUp, Play } from 'lucide-react';

export default function Dashboard() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<string>('');
  const [timeRange, setTimeRange] = useState<'today' | 'yesterday' | 'week'>('today');
  const [stats, setStats] = useState({
    totalCommits: 0,
    totalRepos: 0,
    workHours: 0
  });

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    setReport('');

    try {
      const workPaths = (await window.electronAPI.config.get('workPaths')) as
        | { bzdevBkdev?: string; bzdevExdev?: string }
        | undefined;
      const repoPaths = [workPaths?.bzdevBkdev, workPaths?.bzdevExdev].filter(
        (p): p is string => Boolean(p && String(p).trim())
      );

      const result = await window.electronAPI.plugins.execute('daily-report', {
        timeRange,
        repoPaths: repoPaths.length > 0 ? repoPaths : ['~/bzdev/bkdev', '~/bzdev/exdev'],
        includeAllBranches: true
      });

      if (result.success) {
        setReport(result.data.report);
        // 解析统计信息（简化版）
        const lines = result.data.report.split('\n');
        lines.forEach(line => {
          if (line.includes('提交总数:')) {
            const match = line.match(/提交总数:\s*(\d+)/);
            if (match) setStats(prev => ({ ...prev, totalCommits: parseInt(match[1]) }));
          }
          if (line.includes('涉及仓库:')) {
            const match = line.match(/涉及仓库:\s*(\d+)/);
            if (match) setStats(prev => ({ ...prev, totalRepos: parseInt(match[1]) }));
          }
          if (line.includes('工作时间:')) {
            const match = line.match(/工作时间:\s*([\d.]+)/);
            if (match) setStats(prev => ({ ...prev, workHours: parseFloat(match[1]) }));
          }
        });
      } else {
        setReport(`生成失败: ${result.error}`);
      }
    } catch (error) {
      setReport(`错误: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-gray-400">Welcome to Ming</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-primary-500/20 rounded-lg">
                <GitBranch className="text-primary-400" size={24} />
              </div>
              <span className="text-sm text-gray-400">Today</span>
            </div>
            <div className="text-3xl font-bold mb-1">{stats.totalCommits}</div>
            <div className="text-sm text-gray-400">Commits</div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <FileText className="text-green-400" size={24} />
              </div>
              <span className="text-sm text-gray-400">Active</span>
            </div>
            <div className="text-3xl font-bold mb-1">{stats.totalRepos}</div>
            <div className="text-sm text-gray-400">Repositories</div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <Clock className="text-purple-400" size={24} />
              </div>
              <span className="text-sm text-gray-400">Estimated</span>
            </div>
            <div className="text-3xl font-bold mb-1">{stats.workHours}h</div>
            <div className="text-sm text-gray-400">Work Time</div>
          </div>
        </div>

        {/* Daily Report Generator */}
        <div className="card mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-500/20 rounded-lg">
                <TrendingUp className="text-primary-400" size={20} />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Daily Report Generator</h2>
                <p className="text-sm text-gray-400">Generate work reports from Git commits</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="input w-32"
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="week">This Week</option>
              </select>

              <button
                onClick={handleGenerateReport}
                disabled={isGenerating}
                className="btn-primary flex items-center gap-2"
              >
                <Play size={18} />
                {isGenerating ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </div>

          {/* Report Output */}
          {report && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Calendar size={20} />
                  Generated Report
                </h3>
              </div>
              <div className="bg-dark-800 rounded-lg p-6 overflow-x-auto">
                <div className="markdown">
                  {report.split('\n').map((line, index) => (
                    <div key={index} className="mb-1">
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full btn-secondary text-left flex items-center gap-3">
                <GitBranch size={18} />
                View Git Status
              </button>
              <button className="w-full btn-secondary text-left flex items-center gap-3">
                <FileText size={18} />
                Create New Agent
              </button>
              <button className="w-full btn-secondary text-left flex items-center gap-3">
                <TrendingUp size={18} />
                View Statistics
              </button>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between text-gray-400">
                <span>No recent activity</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
