import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const HuhaTools: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 启动入场动画
    setIsVisible(true);

    // 模拟加载进度
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 100);

    // 设置最小加载时间，确保动画完整播放
    const minLoadTime = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setIsLoading(false);
      }, 300);
    }, 1500);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(minLoadTime);
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* 加载动画层 */}
      <div 
        className={`absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-primary/5 backdrop-blur-sm z-10 flex flex-col items-center justify-center transition-all duration-700 ${
          isLoading ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* 动画圆环 */}
        <div className="relative mb-8">
          <div className="absolute inset-0 animate-ping">
            <div className="w-24 h-24 rounded-full bg-primary/20"></div>
          </div>
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center animate-pulse">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
          </div>
        </div>

        {/* 加载文本 */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold text-foreground mb-2 animate-pulse">
            正在加载 HUHA 工具集
          </h3>
          <p className="text-sm text-muted-foreground">
            {progress < 100 ? '准备中...' : '即将完成'}
          </p>
        </div>

        {/* 进度条 */}
        <div className="w-64 h-2 bg-primary/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary/50 via-primary to-primary/50 rounded-full transition-all duration-300 ease-out relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
          </div>
        </div>

        {/* 进度百分比 */}
        <div className="mt-3 text-sm font-medium text-primary">
          {Math.round(progress)}%
        </div>
      </div>

      {/* iframe 内容 */}
      <div 
        className={`w-full h-full transition-all duration-1000 ${
          isVisible && !isLoading 
            ? 'opacity-100 scale-100 blur-0' 
            : 'opacity-0 scale-95 blur-sm'
        }`}
      >
        <iframe 
          src="https://www.huhage.fun" 
          className="w-full h-full"
          style={{ 
            border: 'none',
          }}
          title="HUHA工具集"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          onLoad={() => {
            // iframe 加载完成后，确保进度达到 100%
            setProgress(100);
            setTimeout(() => {
              setIsLoading(false);
            }, 300);
          }}
        />
      </div>
    </div>
  );
};

export default HuhaTools; 