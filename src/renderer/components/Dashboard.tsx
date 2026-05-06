import { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar, Clock, GitBranch, FileText, TrendingUp, Play, RefreshCw, Folder, Activity, User, Plus, Minus } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from './ui/sheet';
import { Switch } from './ui/switch';
import { cn } from '@/lib/utils';

interface GitRepo {
  name: string;
  path: string;
}

interface CommitInfo {
  hash: string;
  date: string;
  author: string;
  message: string;
  repo: string;
  files_changed: string[];
  additions: number;
  deletions: number;
  branches: string;
}

export default function Dashboard() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [commits, setCommits] = useState<CommitInfo[]>([]);
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
  const [onlyMine, setOnlyMine] = useState(false);

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
        const activeNames = new Set<string>();
        if (result.data.commits?.length > 0) {
          setCommits(result.data.commits);
          for (const c of result.data.commits) {
            activeNames.add(c.repo);
          }
        } else {
          const lines = (result.data.report || '').split('\n');
          for (const line of lines) {
            const m = line.match(/###\s*📁\s*(.+)/);
            if (m) activeNames.add(m[1].trim());
          }
        }
        setActiveRepoNames(activeNames);
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
        setCommits([]);
        return;
      }

      const result = await window.electronAPI.plugins.execute('daily-report', {
        timeRange,
        repoPaths,
        includeAllBranches: true,
        ...(onlyMine ? { filterByAuthor: 'zhangbing' } : {}),
      });

      if (result.success) {
        const s = result.data.stats;
        if (s) {
          setStats({ totalCommits: s.totalCommits || 0, totalRepos: s.totalRepos || 0, workHours: s.workHours || 0 });
        }
        const activeNames = new Set<string>();
        if (result.data.commits?.length > 0) {
          setCommits(result.data.commits);
          for (const c of result.data.commits) {
            activeNames.add(c.repo);
          }
        }
        setActiveRepoNames(activeNames);
        setActiveSheet('commits');
      }
    } catch {
      // silently fail
    } finally {
      setIsGenerating(false);
    }
  };

  // Filter commits by author when "only mine" is toggled (client-side)
  const filteredCommits = useMemo(() => {
    if (!onlyMine) return commits;
    return commits.filter(c => c.author === 'zhangbing');
  }, [commits, onlyMine]);

  // Group commits by repo
  const commitsByRepo = useMemo(() => {
    const grouped: Record<string, CommitInfo[]> = {};
    for (const c of filteredCommits) {
      if (!grouped[c.repo]) grouped[c.repo] = [];
      grouped[c.repo].push(c);
    }
    // Sort each group by date descending
    for (const repo of Object.keys(grouped)) {
      grouped[repo].sort((a, b) => b.date.localeCompare(a.date));
    }
    return grouped;
  }, [filteredCommits]);

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
                  Commit Details ({filteredCommits.length} commits in {Object.keys(commitsByRepo).length} repos)
                </SheetTitle>
              </div>
              <SheetDescription>
                Git commit details for the selected time range
              </SheetDescription>
            </SheetHeader>
            <div className="mt-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Switch checked={onlyMine} onCheckedChange={setOnlyMine} />
                  <span className="text-sm text-muted-foreground">只看我</span>
                </div>
                <Button
                  onClick={handleGenerateReport}
                  disabled={isGenerating}
                  size="sm"
                >
                  <Play size={14} />
                  {isGenerating ? 'Generating...' : 'Regenerate'}
                </Button>
              </div>

              {filteredCommits.length === 0 ? (
                <div className="text-sm text-muted-foreground py-8 text-center">
                  没有找到提交记录
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(commitsByRepo).map(([repo, repoCommits]) => (
                    <div key={repo}>
                      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <Folder size={14} className="text-muted-foreground" />
                        {repo}
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                          {repoCommits.length}
                        </Badge>
                      </h3>
                      <div className="space-y-2">
                        {repoCommits.map((commit, i) => (
                          <div
                            key={i}
                            className="rounded-lg border bg-card p-3 text-sm"
                          >
                            {/* Commit header */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-foreground truncate">
                                  {commit.message}
                                </div>
                                <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                                  <span className="font-mono">{commit.hash}</span>
                                  <span className="flex items-center gap-1">
                                    <User size={10} />
                                    {commit.author}
                                  </span>
                                  <span>{commit.date.slice(0, 16)}</span>
                                  {commit.branches && (
                                    <span className="flex items-center gap-1">
                                      <GitBranch size={10} />
                                      {commit.branches}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {(commit.additions > 0 || commit.deletions > 0) && (
                                <div className="flex items-center gap-2 text-xs flex-shrink-0">
                                  {commit.additions > 0 && (
                                    <span className="flex items-center gap-0.5 text-green-600 dark:text-green-400">
                                      <Plus size={10} />{commit.additions}
                                    </span>
                                  )}
                                  {commit.deletions > 0 && (
                                    <span className="flex items-center gap-0.5 text-red-600 dark:text-red-400">
                                      <Minus size={10} />{commit.deletions}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Files changed */}
                            {(commit.files_changed || []).length > 0 && (
                              <div className="mt-2 pt-2 border-t">
                                <div className="space-y-0.5">
                                  {(commit.files_changed || []).map((file, fi) => (
                                    <div key={fi} className="text-xs text-muted-foreground font-mono truncate">
                                      {file}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
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
