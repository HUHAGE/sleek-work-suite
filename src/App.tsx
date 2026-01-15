import { useEffect, useMemo } from 'react'
import { useSettings } from './lib/store/settings'
import { useUserData } from './lib/store/userDataManager'
import { HashRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { getThemeColorVariables } from '@/lib/utils';
import { LoadingScreen } from '@/components/LoadingScreen';
import UpdateNotification from '@/components/UpdateNotification';
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const { theme, themeColor } = useSettings()
  const { migrateFromLocalStorage } = useUserData()

  // 在应用启动时迁移数据
  useEffect(() => {
    migrateFromLocalStorage()
  }, [migrateFromLocalStorage])

  // 移除初始加载动画 - 最少显示1秒，最多1.2秒
  useEffect(() => {
    const loader = document.getElementById('initial-loader')
    if (!loader) return

    const startTime = performance.now()
    const minDisplayTime = 1000 // 最少显示1秒，让用户看到炫酷动画
    const maxDisplayTime = 1200 // 最多1.2秒，避免等待过久

    // 应用加载完成后的处理
    const handleAppReady = () => {
      const elapsed = performance.now() - startTime
      const remainingTime = Math.max(0, Math.min(minDisplayTime - elapsed, maxDisplayTime - elapsed))

      setTimeout(() => {
        loader.classList.add('fade-out')
        setTimeout(() => {
          loader.remove()
        }, 400)
      }, remainingTime)
    }

    // 使用 requestIdleCallback 或 setTimeout 确保应用已渲染
    if ('requestIdleCallback' in window) {
      requestIdleCallback(handleAppReady, { timeout: maxDisplayTime })
    } else {
      setTimeout(handleAppReady, 100)
    }
  }, [])

  // 计算当前是否为深色模式
  const isDarkMode = useMemo(() => {
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return theme === 'dark'
  }, [theme])

  // 监听系统主题变化
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      if (theme === 'system') {
        document.documentElement.classList.toggle('dark', e.matches)
        // 重新应用主题色
        const variables = getThemeColorVariables(themeColor, e.matches)
        Object.entries(variables).forEach(([key, value]) => {
          document.documentElement.style.setProperty(key, value)
        })
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme, themeColor])

  // 应用主题和主题色
  useEffect(() => {
    const root = document.documentElement

    // 应用深色/浅色主题
    root.classList.remove('light', 'dark')
    if (theme === 'system') {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark')
      } else {
        root.classList.add('light')
      }
    } else {
      root.classList.add(theme)
    }

    // 应用主题色变量
    const variables = getThemeColorVariables(themeColor, isDarkMode)
    Object.entries(variables).forEach(([key, value]) => {
      root.style.setProperty(key, value)
    })
  }, [theme, themeColor, isDarkMode])

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <UpdateNotification />
        <div className="min-h-screen bg-background text-foreground">
          <Toaster />
          <Sonner />
          <HashRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </HashRouter>
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
