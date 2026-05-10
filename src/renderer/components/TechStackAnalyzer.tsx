import { useState, useCallback } from 'react';
import { PackageOpen, FolderSearch, Loader2, Upload, FileCode, Layers, Cpu, Wrench, Box, Layers3, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';

interface FrameworkDetection {
  name: string;
  confidence: 'high' | 'medium' | 'low';
  version?: string;
  evidence: string[];
}

interface AppAnalysisResult {
  appName: string;
  version?: string;
  bundleId?: string;
  frameworks: FrameworkDetection[];
  resources: { type: string; count: number };
  fileType: string;
  categorizedDependencies?: Record<string, string[]>;
  plistInfo?: Record<string, any>;
  runtimeProcesses?: string[];
}

interface ProjectAnalysisResult {
  languages: { name: string; percentage: number }[];
  frameworks: string[];
  buildTools: string[];
  packageManagers: string[];
  dependencies: { manager: string; count: number };
  categorizedDependencies: Record<string, string[]>;
}

const LANG_COLORS: Record<string, string> = {
  TypeScript: '#3178c6', JavaScript: '#f1e05a', Python: '#3572a5', Rust: '#dea584',
  Go: '#00add8', Java: '#b07219', Swift: '#f05138', 'C++': '#f34b7d', 'C#': '#178600',
  Ruby: '#701516', PHP: '#4f5d95', HTML: '#e34c26', CSS: '#563d7c', Vue: '#41b883',
  Svelte: '#ff3e00', Kotlin: '#a97bff', Dart: '#00b4ab', Shell: '#89e051',
};

function ConfidenceBadge({ level }: { level: string }) {
  const variant = level === 'high' ? 'default' : level === 'medium' ? 'secondary' : 'outline';
  const label = level === 'high' ? 'High' : level === 'medium' ? 'Medium' : 'Low';
  return <Badge variant={variant} className="text-xs">{label}</Badge>;
}

function AppResult({ result }: { result: AppAnalysisResult }) {
  return (
    <div className="space-y-6">
      {/* App Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <PackageOpen size={20} className="text-primary" />
            {result.appName}
            {result.version && <span className="text-sm text-muted-foreground font-normal">v{result.version}</span>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {result.bundleId && (
            <div className="text-sm text-muted-foreground">Bundle ID: {result.bundleId}</div>
          )}
          <div className="text-sm text-muted-foreground">File type: {result.fileType}</div>
          {result.plistInfo && Object.keys(result.plistInfo).length > 0 && (
            <div className="mt-3 pt-3 border-t space-y-1.5">
              {result.plistInfo.category && (
                <div className="text-sm"><span className="text-muted-foreground">Category:</span> {result.plistInfo.category}</div>
              )}
              {result.plistInfo.minOSVersion && (
                <div className="text-sm"><span className="text-muted-foreground">Min OS:</span> macOS {result.plistInfo.minOSVersion}</div>
              )}
              {result.plistInfo.electronAsarIntegrity && (
                <div className="text-sm text-muted-foreground">Electron Asar Integrity: Enabled</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Frameworks */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Layers size={18} className="text-primary" />
            Detected Frameworks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {result.frameworks.map((fw, i) => (
              <div key={i} className="flex items-start justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <div className="font-medium flex items-center gap-2">
                    {fw.name}
                    {fw.version && <span className="text-xs text-muted-foreground">{fw.version}</span>}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {fw.evidence.slice(0, 3).join(' · ')}
                  </div>
                </div>
                <ConfidenceBadge level={fw.confidence} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Resources */}
      {result.resources.type && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileCode size={18} className="text-primary" />
              Resources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">{result.resources.type}</div>
            <div className="text-xs text-muted-foreground mt-1">{result.resources.count} total files</div>
          </CardContent>
        </Card>
      )}

      {/* Categorized Dependencies */}
      {result.categorizedDependencies && Object.keys(result.categorizedDependencies).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Layers3 size={18} className="text-primary" />
              技术栈分类
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(result.categorizedDependencies).map(([category, deps]) => (
                <div key={category} className="space-y-2">
                  <div className="text-sm font-medium text-foreground">{category}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {deps.slice(0, 8).map(dep => (
                      <Badge key={dep} variant="outline" className="text-xs">{dep}</Badge>
                    ))}
                    {deps.length > 8 && (
                      <Badge variant="secondary" className="text-xs">+{deps.length - 8} more</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Runtime Processes */}
      {result.runtimeProcesses && result.runtimeProcesses.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity size={18} className="text-primary" />
              Running Processes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {result.runtimeProcesses.slice(0, 3).map((proc, i) => (
                <div key={i} className="text-xs font-mono text-muted-foreground truncate">{proc}</div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ProjectResult({ result }: { result: ProjectAnalysisResult }) {
  return (
    <div className="space-y-6">
      {/* Languages */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileCode size={18} className="text-primary" />
            Languages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Bar chart */}
            <div className="flex rounded-full overflow-hidden h-3 bg-muted">
              {result.languages.map((lang) => (
                <div
                  key={lang.name}
                  style={{
                    width: `${lang.percentage}%`,
                    backgroundColor: LANG_COLORS[lang.name] || '#8b8b8b',
                  }}
                  title={`${lang.name}: ${lang.percentage}%`}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              {result.languages.map(lang => (
                <div key={lang.name} className="flex items-center gap-1.5 text-sm">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: LANG_COLORS[lang.name] || '#8b8b8b' }} />
                  <span>{lang.name}</span>
                  <span className="text-muted-foreground">{lang.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Frameworks */}
      {result.frameworks.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Cpu size={18} className="text-primary" />
              Frameworks & Libraries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {result.frameworks.map(fw => (
                <Badge key={fw} variant="secondary" className="text-sm">{fw}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Build Tools */}
      {result.buildTools.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Wrench size={18} className="text-primary" />
              Build Tools
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {result.buildTools.map(tool => (
                <Badge key={tool} variant="outline" className="text-sm">{tool}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Package Managers & Dependencies */}
      {(result.packageManagers.length > 0 || result.dependencies.count > 0) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Box size={18} className="text-primary" />
              Dependencies
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {result.packageManagers.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Package Manager:</span>
                <div className="flex gap-1">
                  {result.packageManagers.map(pm => (
                    <Badge key={pm} variant="secondary">{pm}</Badge>
                  ))}
                </div>
              </div>
            )}
            {result.dependencies.count > 0 && (
              <div className="text-sm">
                <span className="text-muted-foreground">Dependencies:</span>{' '}
                <span className="font-medium">{result.dependencies.count}</span>
                {result.dependencies.manager && (
                  <span className="text-muted-foreground"> via {result.dependencies.manager}</span>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Categorized Dependencies */}
      {Object.keys(result.categorizedDependencies).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Layers3 size={18} className="text-primary" />
              技术栈分类
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(result.categorizedDependencies).map(([category, deps]) => (
                <div key={category} className="space-y-2">
                  <div className="text-sm font-medium text-foreground">{category}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {deps.map(dep => (
                      <Badge key={dep} variant="outline" className="text-xs">{dep}</Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function TechStackAnalyzer() {
  const [activeTab, setActiveTab] = useState('app');
  const [loading, setLoading] = useState(false);
  const [appResult, setAppResult] = useState<AppAnalysisResult | null>(null);
  const [projectResult, setProjectResult] = useState<ProjectAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const analyzeApp = useCallback(async (filePath: string) => {
    setLoading(true);
    setError(null);
    setAppResult(null);
    try {
      const result = await window.electronAPI.techStack.analyzeApp(filePath);
      setAppResult(result);
    } catch (err: any) {
      setError(err.message || '分析失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const analyzeProject = useCallback(async (dirPath: string) => {
    setLoading(true);
    setError(null);
    setProjectResult(null);
    try {
      const result = await window.electronAPI.techStack.analyzeProject(dirPath);
      setProjectResult(result);
    } catch (err: any) {
      setError(err.message || '分析失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleOpenApp = async () => {
    const result = await window.electronAPI.dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'Applications', extensions: ['app', 'dmg', 'exe'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });
    if (!result.canceled && result.filePaths[0]) {
      analyzeApp(result.filePaths[0]);
    }
  };

  const handleOpenProject = async () => {
    const result = await window.electronAPI.dialog.showOpenDialog({
      properties: ['openDirectory'],
    });
    if (!result.canceled && result.filePaths[0]) {
      analyzeProject(result.filePaths[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && activeTab === 'app') {
      // In Electron, we need the file path
      const filePath = (file as any).path;
      if (filePath) analyzeApp(filePath);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-1 text-foreground">TechStack Analyzer</h1>
        <p className="text-muted-foreground mb-6">分析安装包或项目的技术栈</p>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="app" className="gap-2">
              <PackageOpen size={16} />
              安装包分析
            </TabsTrigger>
            <TabsTrigger value="project" className="gap-2">
              <FolderSearch size={16} />
              项目分析
            </TabsTrigger>
          </TabsList>

          <TabsContent value="app">
            <Card
              className={`border-2 border-dashed transition-colors cursor-pointer ${dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={handleOpenApp}
            >
              <CardContent className="py-16 flex flex-col items-center gap-4">
                {loading ? (
                  <>
                    <Loader2 size={40} className="text-primary animate-spin" />
                    <p className="text-muted-foreground">分析中...</p>
                  </>
                ) : (
                  <>
                    <Upload size={40} className="text-muted-foreground" />
                    <div className="text-center">
                      <p className="font-medium">拖入安装包或点击选择</p>
                      <p className="text-sm text-muted-foreground mt-1">支持 .dmg, .app, .exe</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {error && (
              <div className="mt-4 p-4 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
            )}

            {appResult && <div className="mt-6"><AppResult result={appResult} /></div>}
          </TabsContent>

          <TabsContent value="project">
            <Card
              className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors cursor-pointer"
              onClick={handleOpenProject}
            >
              <CardContent className="py-16 flex flex-col items-center gap-4">
                {loading ? (
                  <>
                    <Loader2 size={40} className="text-primary animate-spin" />
                    <p className="text-muted-foreground">分析中...</p>
                  </>
                ) : (
                  <>
                    <FolderSearch size={40} className="text-muted-foreground" />
                    <div className="text-center">
                      <p className="font-medium">点击选择项目文件夹</p>
                      <p className="text-sm text-muted-foreground mt-1">自动检测 package.json, Cargo.toml, go.mod 等</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {error && (
              <div className="mt-4 p-4 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
            )}

            {projectResult && <div className="mt-6"><ProjectResult result={projectResult} /></div>}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
