import { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, GitBranch, FileText, TrendingUp, Play, RefreshCw, ChevronDown, ChevronUp, Folder } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/select';
import { cn } from '@/lib/utils';

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
          <h1 className="text-3xl font-bold mb-2 text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to 銘</p>
        </div>

        {/* Work Paths Info */}
        {workPaths.length > 0 && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-3">
                <FileText size={16} className="text-muted-foreground" />
                <span className="text-sm font-medium text-secondary-foreground">
                  Work Paths ({workPaths.length})
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {workPaths.map((p, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {p}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {workPaths.length === 0 && (
          <Card className="mb-6 border-yellow-500">
            <CardContent className="pt-6">
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                未配置工作目录，请在 Settings 中添加 Work Paths 以启用统计功能
              </p>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-accent">
                  <GitBranch size={24} className="text-primary" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Today</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={fetchStats}
                    disabled={isRefreshing}
                    title="Refresh stats"
                  >
                    <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
                  </Button>
                </div>
              </div>
              <div className="text-3xl font-bold mb-1 text-foreground">{stats.totalCommits}</div>
              <div className="text-sm text-muted-foreground">Commits</div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer select-none"
            onClick={() => setShowRepoList(!showRepoList)}
            title="Click to toggle repo list"
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-emerald-500/10">
                  <FileText size={24} className="text-emerald-500" />
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="text-sm">Scanned</span>
                  {showRepoList ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
              </div>
              <div className="text-3xl font-bold mb-1 text-foreground">{gitRepos.length}</div>
              <div className="text-sm text-muted-foreground">Git Repositories</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <Clock size={24} className="text-blue-500" />
                </div>
                <span className="text-sm text-muted-foreground">Estimated</span>
              </div>
              <div className="text-3xl font-bold mb-1 text-foreground">{stats.workHours}h</div>
              <div className="text-sm text-muted-foreground">Work Time</div>
            </CardContent>
          </Card>
        </div>

        {/* Git Repo List */}
        {showRepoList && (
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  Git Repositories ({gitRepos.length})
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={loadGitRepos}
                  title="Refresh repo list"
                >
                  <RefreshCw size={14} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {gitRepos.length === 0 ? (
                <p className="text-sm py-2 text-muted-foreground">
                  No git repositories found in configured work paths.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-80 overflow-y-auto">
                  {gitRepos.map((repo, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 p-2.5 rounded-lg text-sm bg-input border"
                    >
                      <Folder size={14} className="text-muted-foreground flex-shrink-0" />
                      <span className="font-medium truncate text-foreground">
                        {repo.name}
                      </span>
                      <span className="text-xs truncate ml-auto flex-shrink-0 text-muted-foreground" title={repo.path}>
                        {repo.path.replace(/^\/Users\/[^/]+/, '~')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Daily Report Generator */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent">
                  <TrendingUp size={20} className="text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Daily Report Generator</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Generate work reports from Git commits</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Select value={timeRange} onValueChange={(value) => setTimeRange(value as any)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="yesterday">Yesterday</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  onClick={handleGenerateReport}
                  disabled={isGenerating}
                >
                  <Play size={18} />
                  {isGenerating ? 'Generating...' : 'Generate'}
                </Button>
              </div>
            </div>
          </CardHeader>

          {/* Report Output */}
          {report && (
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                  <Calendar size={20} />
                  Generated Report
                </h3>
              </div>
              <div className="rounded-lg p-6 overflow-x-auto bg-muted">
                <div className="markdown">
                  {report.split('\n').map((line, index) => (
                    <div key={index} className="mb-1">{line}</div>
                  ))}
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="secondary" className="w-full justify-start gap-3">
                <GitBranch size={18} />
                View Git Status
              </Button>
              <Button variant="secondary" className="w-full justify-start gap-3">
                <FileText size={18} />
                Create New Agent
              </Button>
              <Button variant="secondary" className="w-full justify-start gap-3">
                <TrendingUp size={18} />
                View Statistics
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>No recent activity</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
