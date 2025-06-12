import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"

interface LoadingScreenProps {
  onLoadingComplete?: () => void
}

export const LoadingScreen = ({ onLoadingComplete }: LoadingScreenProps) => {
  const [opacity, setOpacity] = useState("opacity-100")

  useEffect(() => {
    // 当组件加载完成后，等待一小段时间再触发淡出动画
    const timer = setTimeout(() => {
      setOpacity("opacity-0")
      // 等待动画完成后再触发回调
      setTimeout(() => {
        onLoadingComplete?.()
      }, 200)
    }, 500)

    return () => clearTimeout(timer)
  }, [onLoadingComplete])

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-background transition-opacity duration-200",
        opacity
      )}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-lg font-medium text-muted-foreground">
          正在加载应用...
        </p>
      </div>
    </div>
  )
} 