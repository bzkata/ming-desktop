import { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, GitBranch, FileText, TrendingUp, Play, RefreshCw, Folder, Activity } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from './ui/sheet';
import { cn } from '@/lib/utils';

interface GitRepo {
  name: string;
  path: string;
}

export default function Dashboard() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<string>('');
  const [timeRange, setTimeRange] = useState<'today' | 'yesterday' | 'day_before_yesterday' | 'week'>('today');
  const [stats, setStats] = useState({
    totalCommits: 0,
    totalRepos: 0,
    workHours: 0,
  });
  const [workPaths, setWorkPaths] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [gitRepos, setGitRepos] = useState<GitRepo[]>([]);
  const [activeSheet, setActiveSheet] = useState<'commits' | 'repos' | null>(null);
  const [activeRepoNames, setActiveRepoNames] = useState<Set<string>>(new Set());

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
        setActiveRepoNames(new Set());
        return;
      }

      const result = await window.electronAPI.plugins.execute('daily-report', {
        timeRange,
        repoPaths,
        includeAllBranches: true,
      });

      if (result.success) {
        const s = result.data.stats;
        if (s) {
          setStats({ totalCommits: s.totalCommits || 0, totalRepos: s.totalRepos || 0, workHours: s.workHours || 0 });
        }
        // Extract active repo names from report
        const activeNames = new Set<string>();
        const lines = (result.data.report || '').split('\n');
        for (const line of lines) {
          const m = line.match(/###\s*📁\s*(.+)/);
          if (m) activeNames.add(m[1].trim());
        }
        setActiveRepoNames(activeNames);
        // Cache report for detail view
        setReport(result.data.report);
      }
    } catch {
      // silently fail
    } finally {
      setIsRefreshing(false);
    }
  }, [timeRange]);

  useEffect(() => {
    if (workPaths.length > 0) {
      fetchStats();
    }
  }, [workPaths, timeRange, fetchStats]);

  const handleGenerateReport = async () => {
    setIsGenerating(true);
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
        const s = result.data.stats;
        if (s) {
          setStats({ totalCommits: s.totalCommits || 0, totalRepos: s.totalRepos || 0, workHours: s.workHours || 0 });
        }
        // Update active repos
        const activeNames = new Set<string>();
        const lines = (result.data.report || '').split('\n');
        for (const line of lines) {
          const m = line.match(/###\s*📁\s*(.+)/);
          if (m) activeNames.add(m[1].trim());
        }
        setActiveRepoNames(activeNames);
        setActiveSheet('commits');
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Welcome to 銘</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={(value) => setTimeRange(value as any)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">今天</SelectItem>
                <SelectItem value="yesterday">昨天</SelectItem>
                <SelectItem value="day_before_yesterday">前天</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={fetchStats}
              disabled={isRefreshing}
              title="Refresh"
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            </Button>
          </div>
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
          <Card
            className={cn('cursor-pointer select-none transition-colors', stats.totalCommits > 0 && 'hover:border-primary/50')}
            onClick={() => { if (stats.totalCommits > 0) setActiveSheet('commits'); }}
            title={stats.totalCommits > 0 ? 'Click to view commit details' : 'No commits in this period'}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-accent">
                  <GitBranch size={24} className="text-primary" />
                </div>
              </div>
              <div className="text-3xl font-bold mb-1 text-foreground">{stats.totalCommits}</div>
              <div className="text-sm text-muted-foreground">Commits</div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer select-none hover:border-emerald-500/50 transition-colors"
            onClick={() => setActiveSheet('repos')}
            title="Click to view repository list"
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-emerald-500/10">
                  <FileText size={24} className="text-emerald-500" />
                </div>
                <span className="text-sm text-muted-foreground">{activeRepoNames.size} active</span>
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

        {/* Commit Detail Sheet */}
        <Sheet open={activeSheet === 'commits'} onOpenChange={(open) => !open && setActiveSheet(null)}>
          <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
            <SheetHeader>
              <div className="flex items-center justify-between pr-6">
                <SheetTitle className="flex items-center gap-2">
                  <Calendar size={18} />
                  Commit Details ({stats.totalCommits} commits in {activeRepoNames.size} repos)
                </SheetTitle>
              </div>
              <SheetDescription>
                Git commit details for the selected time range
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6">
              <div className="flex justify-end mb-4">
                <Button
                  onClick={handleGenerateReport}
                  disabled={isGenerating}
                  size="sm"
                >
                  <Play size={14} />
                  {isGenerating ? 'Generating...' : 'Regenerate'}
                </Button>
              </div>
              {report && (
                <div className="rounded-lg p-4 overflow-x-auto bg-muted">
                  <div className="markdown text-sm">
                    {report.split('\n').map((line, index) => (
                      <div key={index} className="mb-0.5">{line}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>

        {/* Git Repo List Sheet */}
        <Sheet open={activeSheet === 'repos'} onOpenChange={(open) => !open && setActiveSheet(null)}>
          <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
            <SheetHeader>
              <div className="flex items-center justify-between pr-6">
                <SheetTitle>
                  Git Repositories ({gitRepos.length})
                </SheetTitle>
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
              <SheetDescription>
                Repositories found in your configured work paths
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6">
              {gitRepos.length === 0 ? (
                <p className="text-sm py-2 text-muted-foreground">
                  No git repositories found in configured work paths.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {gitRepos.map((repo, i) => {
                    const isActive = activeRepoNames.has(repo.name);
                    return (
                      <div
                        key={i}
                        className={cn(
                          'flex items-center gap-2 p-2.5 rounded-lg text-sm border',
                          isActive
                            ? 'bg-primary/5 border-primary/30'
                            : 'bg-input border-border'
                        )}
                      >
                        <Folder size={14} className="text-muted-foreground flex-shrink-0" />
                        <span className={cn('font-medium truncate', isActive ? 'text-foreground' : 'text-foreground/70')}>
                          {repo.name}
                        </span>
                        {isActive && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary border-0 flex-shrink-0">
                            <Activity size={10} className="mr-0.5" />
                            active
                          </Badge>
                        )}
                        <span className="text-xs truncate ml-auto flex-shrink-0 text-muted-foreground" title={repo.path}>
                          {repo.path.replace(/^\/Users\/[^/]+/, '~')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>

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

              <Button
                onClick={handleGenerateReport}
                disabled={isGenerating}
              >
                <Play size={18} />
                {isGenerating ? 'Generating...' : 'Generate'}
              </Button>
            </div>
          </CardHeader>
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
