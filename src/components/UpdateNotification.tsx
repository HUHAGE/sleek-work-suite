import { useState, useEffect } from 'react';
import { X, Download, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { checkForUpdate, type VersionInfo } from '@/lib/versionService';

interface UpdateNotificationProps {
    onClose?: () => void;
}

export default function UpdateNotification({ onClose }: UpdateNotificationProps) {
    const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        // 应用启动时检查更新
        const checkUpdate = async () => {
            try {
                const info = await checkForUpdate(true); // 使用缓存
                if (info.hasUpdate) {
                    setVersionInfo(info);
                    setIsVisible(true);
                }
            } catch (error) {
                console.error('检查更新失败:', error);
            } finally {
                setIsChecking(false);
            }
        };

        checkUpdate();
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => {
            onClose?.();
        }, 300); // 等待动画完成
    };

    const handleUpdate = async () => {
        if (versionInfo?.updateUrl) {
            // 在系统默认浏览器中打开更新链接
            if (window.electron?.openExternal) {
                await window.electron.openExternal(versionInfo.updateUrl);
            } else {
                // 降级方案：在新窗口中打开
                window.open(versionInfo.updateUrl, '_blank');
            }
        }
    };

    // 如果正在检查或没有更新，不显示
    if (isChecking || !versionInfo?.hasUpdate) {
        return null;
    }

    return (
        <div
            className={cn(
                'fixed top-10 left-0 right-0 z-50 transition-all duration-300',
                isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
            )}
        >
            <div className="mx-auto max-w-7xl px-4">
                <div className="relative overflow-hidden rounded-lg border border-primary/30 bg-gradient-to-r from-primary/20 via-primary/15 to-primary/20 backdrop-blur-sm shadow-lg">
                    {/* 背景装饰 */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-pulse" />

                    <div className="relative flex items-center justify-between gap-4 px-6 py-3">
                        {/* 左侧图标和文本 */}
                        <div className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                                <div className="rounded-full bg-primary/20 p-2">
                                    <AlertCircle className="h-5 w-5 text-primary" />
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                                <span className="font-semibold text-foreground">
                                    发现新版本 v{versionInfo.latest}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                    当前版本: v{versionInfo.current}
                                </span>
                            </div>
                        </div>

                        {/* 右侧按钮 */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleUpdate}
                                className={cn(
                                    'flex items-center gap-2 rounded-lg px-4 py-2',
                                    'bg-primary text-primary-foreground',
                                    'hover:bg-primary/90 transition-colors duration-200',
                                    'font-medium text-sm shadow-md hover:shadow-lg'
                                )}
                            >
                                <Download className="h-4 w-4" />
                                <span>立即更新</span>
                            </button>

                            <button
                                onClick={handleClose}
                                className={cn(
                                    'rounded-lg p-2',
                                    'text-muted-foreground hover:text-foreground',
                                    'hover:bg-muted/50 transition-colors duration-200'
                                )}
                                aria-label="关闭"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
