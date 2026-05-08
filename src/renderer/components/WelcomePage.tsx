import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Bot, FileText, Puzzle, Zap, ArrowRight, X } from 'lucide-react';

import { useTheme } from '../App';

interface WelcomePageProps {
  onComplete: () => void;
}

export const WelcomePage: React.FC<WelcomePageProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const { resolvedTheme } = useTheme();

  const steps = [
    {
      title: '欢迎来到 Ming',
      description: '你的 AI 驱动开发助手',
      icon: '🧠',
      content: (
        <div className="text-center py-8">
          <div className="text-8xl mb-8">🧠</div>
          <p className="text-xl text-muted-foreground max-w-md mx-auto">
            集成 AI Agent、插件系统和智能日报生成
          </p>
        </div>
      )
    },
    {
      title: '核心功能',
      description: '探索 Ming 的强大能力',
      icon: <Zap className="w-12 h-12" />,
      content: (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <Bot className="w-8 h-8 text-blue-500 mb-2" />
              <CardTitle className="text-lg">AI Agent</CardTitle>
              <CardDescription>智能代码助手 & 研究助手</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <FileText className="w-8 h-8 text-green-500 mb-2" />
              <CardTitle className="text-lg">智能日报</CardTitle>
              <CardDescription>自动生成 Git 工作总结</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Puzzle className="w-8 h-8 text-purple-500 mb-2" />
              <CardTitle className="text-lg">插件系统</CardTitle>
              <CardDescription>轻松扩展你的工具箱</CardDescription>
            </CardHeader>
          </Card>
        </div>
      )
    },
    {
      title: '快速开始',
      description: '几步完成初始设置',
      icon: <ArrowRight className="w-12 h-12" />,
      content: (
        <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-secondary rounded-xl">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">1</div>
            <div>
              <div className="font-medium">配置 LLM Provider</div>
              <div className="text-sm text-muted-foreground">连接 OpenAI / Claude / 本地模型</div>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-secondary rounded-xl">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">2</div>
            <div>
              <div className="font-medium">设置工作目录</div>
              <div className="text-sm text-muted-foreground">添加你的 Git 仓库路径</div>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-secondary rounded-xl">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">3</div>
            <div>
              <div className="font-medium">生成第一份日报</div>
              <div className="text-sm text-muted-foreground">体验 AI 自动总结</div>
            </div>
          </div>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
      <div className="max-w-3xl w-full mx-4 bg-background border border-border rounded-3xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-2xl">銘</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold">Ming Desktop</h2>
              <p className="text-sm text-muted-foreground">AI 开发助手 v0.1</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onComplete}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-10">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mb-6">
              {steps[currentStep].icon}
            </div>
            <h3 className="text-3xl font-semibold mb-3">{steps[currentStep].title}</h3>
            <p className="text-muted-foreground text-lg">{steps[currentStep].description}</p>
          </div>

          {steps[currentStep].content}
        </div>

        {/* Footer */}
        <div className="p-6 border-t flex justify-between items-center bg-secondary/50">
          <div className="flex gap-2">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`w-2 h-2 rounded-full transition-all ${idx === currentStep ? 'bg-primary w-6' : 'bg-muted'}`}
              />
            ))}
          </div>

          <Button onClick={handleNext} size="lg" className="px-8">
            {currentStep === steps.length - 1 ? '开始使用 Ming →' : '下一步'}
          </Button>
        </div>
      </div>
    </div>
  );
};
