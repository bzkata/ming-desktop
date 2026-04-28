import { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, GitBranch, FileText, TrendingUp, Play, RefreshCw, ChevronDown, ChevronUp, Folder } from 'lucide-react';

interface GitRepo {
  name: string;
  path: string;
}

export default function Dashboard() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<string>('');
  const [timeRange, setTimeRange] = useState<'today' | 'yesterday' | 'week'>('today');
  const [stats, setStats] = useState({
    totalCommits: 0,
    totalRepos: 0,
    workHours: 0,
  });
  const [workPaths, setWorkPaths] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [gitRepos, setGitRepos] = useState<GitRepo[]>([]);
  const [showRepoList, setShowRepoList] = useState(false);

  const loadWorkPaths = useCallback(async () => {
    try {
      const paths = await window.electronAPI.config.get('workPaths');
      if (Array.isArray(paths) && paths.length > 0) {
        setWorkPaths(paths);
      } else {
        setWorkPaths([]);
      }
    } catch {
      setWorkPaths([]);
    }
  }, []);

  const loadGitRepos = useCallback(async () => {
    try {
      const repos = await window.electronAPI.git.scanRepos();
      setGitRepos(repos || []);
    } catch {
      setGitRepos([]);
    }
  }, []);

  useEffect(() => {
    loadWorkPaths();
  }, [loadWorkPaths]);

  // Load git repos when workPaths change
  useEffect(() => {
    if (workPaths.length > 0) {
      loadGitRepos();
    } else {
      setGitRepos([]);
    }
  }, [workPaths, loadGitRepos]);

  const fetchStats = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const paths = await window.electronAPI.config.get('workPaths');
      const repoPaths = Array.isArray(paths) && paths.length > 0
        ? paths.filter((p: string) => Boolean(p?.trim()))
        : [];

      if (repoPaths.length === 0) {
        setStats({ totalCommits: 0, totalRepos: 0, workHours: 0 });
        return;
      }

      const result = await window.electronAPI.plugins.execute('daily-report', {
        timeRange,
        repoPaths,
        includeAllBranches: true,
      });

      if (result.success) {
        const lines = result.data.report.split('\n');
        let totalCommits = 0;
        let totalRepos = 0;
        let workHours = 0;

        lines.forEach((line: string) => {
          const commitMatch = line.match(/提交总数:\s*(\d+)/);
          if (commitMatch) totalCommits = parseInt(commitMatch[1]);
          const repoMatch = line.match(/涉及仓库:\s*(\d+)/);
          if (repoMatch) totalRepos = parseInt(repoMatch[1]);
          const hoursMatch = line.match(/工作时间:\s*([\d.]+)/);
          if (hoursMatch) workHours = parseFloat(hoursMatch[1]);
        });

        setStats({ totalCommits, totalRepos, workHours });
      }
    } catch {
      // silently fail on refresh
    } finally {
      setIsRefreshing(false);
    }
  }, [timeRange]);

  // Auto-fetch stats when workPaths or timeRange changes
  useEffect(() => {
    if (workPaths.length > 0) {
      fetchStats();
    }
  }, [workPaths, timeRange, fetchStats]);

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    setReport('');

    try {
      const paths = await window.electronAPI.config.get('workPaths');
      const repoPaths = Array.isArray(paths) && paths.length > 0
        ? paths.filter((p: string) => Boolean(p?.trim()))
        : [];

      if (repoPaths.length === 0) {
        setReport('未配置工作目录，请先在 Settings 中添加 Work Paths');
        return;
      }

      const result = await window.electronAPI.plugins.execute('daily-report', {
        timeRange,
        repoPaths,
        includeAllBranches: true,
      });

      if (result.success) {
        setReport(result.data.report);
        // Parse stats
        const lines = result.data.report.split('\n');
        lines.forEach((line: string) => {
          const commitMatch = line.match(/提交总数:\s*(\d+)/);
          if (commitMatch) setStats(prev => ({ ...prev, totalCommits: parseInt(commitMatch[1]) }));
          const repoMatch = line.match(/涉及仓库:\s*(\d+)/);
          if (repoMatch) setStats(prev => ({ ...prev, totalRepos: parseInt(repoMatch[1]) }));
          const hoursMatch = line.match(/工作时间:\s*([\d.]+)/);
          if (hoursMatch) setStats(prev => ({ ...prev, workHours: parseFloat(hoursMatch[1]) }));
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
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Dashboard</h1>
          <p style={{ color: 'var(--text-muted)' }}>Welcome to 銘</p>
        </div>

        {/* Work Paths Info */}
        {workPaths.length > 0 && (
          <div className="card mb-6">
            <div className="flex items-center gap-2 mb-3">
              <FileText size={16} style={{ color: 'var(--text-muted)' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Work Paths ({workPaths.length})
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {workPaths.map((p, i) => (
                <span key={i} className="text-xs px-2 py-1 rounded-md" style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>
                  {p}
                </span>
              ))}
            </div>
          </div>
        )}

        {workPaths.length === 0 && (
          <div className="card mb-6" style={{ borderColor: 'var(--badge-warning-text)' }}>
            <p className="text-sm" style={{ color: 'var(--badge-warning-text)' }}>
              未配置工作目录，请在 Settings 中添加 Work Paths 以启用统计功能
            </p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg" style={{ background: 'var(--accent-bg)' }}>
                <GitBranch size={24} style={{ color: 'var(--accent)' }} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Today</span>
                <button
                  onClick={fetchStats}
                  disabled={isRefreshing}
                  className="p-1 rounded transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                  title="Refresh stats"
                >
                  <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>
            <div className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{stats.totalCommits}</div>
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Commits</div>
          </div>

          <div
            className="card cursor-pointer select-none"
            onClick={() => setShowRepoList(!showRepoList)}
            title="Click to toggle repo list"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg" style={{ background: 'var(--badge-success-bg)' }}>
                <FileText size={24} style={{ color: 'var(--badge-success-text)' }} />
              </div>
              <div className="flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                <span className="text-sm">Scanned</span>
                {showRepoList ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>
            </div>
            <div className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{gitRepos.length}</div>
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Git Repositories</div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg" style={{ background: 'var(--badge-info-bg)' }}>
                <Clock size={24} style={{ color: 'var(--badge-info-text)' }} />
              </div>
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Estimated</span>
            </div>
            <div className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{stats.workHours}h</div>
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Work Time</div>
          </div>
        </div>

        {/* Git Repo List */}
        {showRepoList && (
          <div className="card mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                Git Repositories ({gitRepos.length})
              </h3>
              <button
                onClick={loadGitRepos}
                className="p-1.5 rounded transition-colors"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                title="Refresh repo list"
              >
                <RefreshCw size={14} />
              </button>
            </div>
            {gitRepos.length === 0 ? (
              <p className="text-sm py-2" style={{ color: 'var(--text-muted)' }}>
                No git repositories found in configured work paths.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-80 overflow-y-auto">
                {gitRepos.map((repo, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 p-2.5 rounded-lg text-sm"
                    style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)' }}
                  >
                    <Folder size={14} style={{ color: 'var(--text-muted)' }} className="flex-shrink-0" />
                    <span className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                      {repo.name}
                    </span>
                    <span className="text-xs truncate ml-auto flex-shrink-0" style={{ color: 'var(--text-muted)' }} title={repo.path}>
                      {repo.path.replace(/^\/Users\/[^/]+/, '~')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Daily Report Generator */}
        <div className="card mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ background: 'var(--accent-bg)' }}>
                <TrendingUp size={20} style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Daily Report Generator</h2>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Generate work reports from Git commits</p>
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
                <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Calendar size={20} />
                  Generated Report
                </h3>
              </div>
              <div className="rounded-lg p-6 overflow-x-auto" style={{ background: 'var(--code-bg)' }}>
                <div className="markdown">
                  {report.split('\n').map((line, index) => (
                    <div key={index} className="mb-1">{line}</div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Quick Actions</h3>
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
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Recent Activity</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between" style={{ color: 'var(--text-muted)' }}>
                <span>No recent activity</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
