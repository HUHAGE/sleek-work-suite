import axios from 'axios';
// @ts-ignore - package.json 导入
import packageJson from '../../package.json';

// 版本信息接口
export interface VersionInfo {
    current: string;
    latest: string;
    hasUpdate: boolean;
    updateUrl: string;
}

// 缓存键名
const CACHE_KEY = 'version_check_cache';
const CACHE_DURATION = 60 * 60 * 1000; // 1小时缓存

// 缓存数据结构
interface CacheData {
    timestamp: number;
    versionInfo: VersionInfo;
}

/**
 * 获取当前本地版本号
 */
export function getCurrentVersion(): string {
    // 从 package.json 读取版本号
    return packageJson.version;
}

/**
 * 从 GitHub 仓库获取最新版本号
 */
export async function getLatestVersion(): Promise<string> {
    try {
        const response = await axios.get(
            'https://raw.githubusercontent.com/HUHAGE/sleek-work-suite/main/package.json',
            {
                timeout: 10000, // 10秒超时
                headers: {
                    'Cache-Control': 'no-cache',
                },
            }
        );

        return response.data.version || '0.0.0';
    } catch (error) {
        console.error('获取最新版本失败:', error);
        throw new Error('无法获取最新版本信息，请检查网络连接');
    }
}

/**
 * 比较两个版本号
 * @returns 1: v1 > v2, 0: v1 = v2, -1: v1 < v2
 */
export function compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
        const num1 = parts1[i] || 0;
        const num2 = parts2[i] || 0;

        if (num1 > num2) return 1;
        if (num1 < num2) return -1;
    }

    return 0;
}

/**
 * 从缓存中获取版本信息
 */
function getFromCache(): VersionInfo | null {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (!cached) return null;

        const data: CacheData = JSON.parse(cached);
        const now = Date.now();

        // 检查缓存是否过期
        if (now - data.timestamp > CACHE_DURATION) {
            localStorage.removeItem(CACHE_KEY);
            return null;
        }

        return data.versionInfo;
    } catch (error) {
        console.error('读取缓存失败:', error);
        return null;
    }
}

/**
 * 保存版本信息到缓存
 */
function saveToCache(versionInfo: VersionInfo): void {
    try {
        const data: CacheData = {
            timestamp: Date.now(),
            versionInfo,
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch (error) {
        console.error('保存缓存失败:', error);
    }
}

/**
 * 检查更新
 * @param useCache 是否使用缓存，默认为 true
 */
export async function checkForUpdate(useCache: boolean = true): Promise<VersionInfo> {
    // 尝试从缓存获取
    if (useCache) {
        const cached = getFromCache();
        if (cached) {
            console.log('使用缓存的版本信息');
            return cached;
        }
    }

    // 获取版本信息
    const current = getCurrentVersion();
    const latest = await getLatestVersion();
    const hasUpdate = compareVersions(latest, current) > 0;

    const versionInfo: VersionInfo = {
        current,
        latest,
        hasUpdate,
        updateUrl: 'https://pan.quark.cn/s/6a047746dcc1',
    };

    // 保存到缓存
    saveToCache(versionInfo);

    return versionInfo;
}

/**
 * 清除版本检查缓存
 */
export function clearVersionCache(): void {
    localStorage.removeItem(CACHE_KEY);
}
