# 数据库加解密性能优化

## 优化概述

针对 JSBC（数据库）快速加解密功能进行了性能优化，大幅提升了加解密速度。

## 优化前的问题

### 性能瓶颈
1. **每次操作都创建新窗口**：每次加解密都要创建新的 BrowserWindow
2. **页面加载时间长**：每次等待 3000ms 加载远程页面
3. **串行处理**：三个字段（url、username、password）逐个处理
4. **固定等待时间**：每个字段处理后固定等待 1000ms
5. **总耗时约 6-7 秒**：3000ms(加载) + 500ms(切换tab) + 3×1000ms(处理) = 6500ms

## 优化方案

### 1. 窗口复用机制
创建 `CryptoWindowManager` 类来管理加解密窗口：
- **单例模式**：全局只维护一个加解密窗口
- **懒加载**：首次使用时才初始化窗口
- **持久化**：窗口保持打开状态，可重复使用
- **自动恢复**：窗口意外关闭时自动重建

### 2. 减少等待时间
- **页面加载**：从 3000ms 降低到 1500ms
- **字段处理**：从 1000ms 降低到 300ms
- **预设参数**：初始化时就设置好加密类型和模式

### 3. 串行处理优化
虽然不能并行处理（会导致输入框互相覆盖），但通过窗口复用避免了重复初始化：
```typescript
// 串行处理，但复用同一个窗口
const url = await cryptoWindowManager.decrypt(urlCipher);
const username = await cryptoWindowManager.decrypt(usernameCipher);
const password = await cryptoWindowManager.decrypt(passwordCipher);
```

### 4. 智能初始化
- **一次性初始化**：页面加载、tab切换、参数设置一次完成
- **状态管理**：跟踪窗口就绪状态，避免重复初始化
- **并发控制**：多个请求同时到达时，共享同一个初始化过程

## 性能提升

### 首次使用
- **优化前**：约 6500ms
- **优化后**：约 2400ms（1500ms初始化 + 3×300ms处理）
- **提升**：约 63% 的速度提升

### 后续使用
- **优化前**：约 6500ms（每次都要重新创建窗口）
- **优化后**：约 900ms（3×300ms处理，无需初始化）
- **提升**：约 86% 的速度提升

## 技术实现

### CryptoWindowManager 类

```typescript
class CryptoWindowManager {
  private cryptoWindow: BrowserWindow | null = null;
  private isReady: boolean = false;
  private initPromise: Promise<void> | null = null;

  // 确保窗口可用
  async ensureWindow(): Promise<BrowserWindow>
  
  // 初始化窗口
  private async initWindow(): Promise<void>
  
  // 解密方法
  async decrypt(ciphertext: string): Promise<string>
  
  // 加密方法
  async encrypt(plaintext: string): Promise<string>
  
  // 销毁窗口
  destroy(): void
}
```

### 关键优化点

1. **窗口复用**
   ```typescript
   if (this.cryptoWindow && !this.cryptoWindow.isDestroyed() && this.isReady) {
     return this.cryptoWindow;
   }
   ```

2. **并发初始化控制**
   ```typescript
   if (this.initPromise) {
     await this.initPromise;
     return this.cryptoWindow!;
   }
   ```

3. **串行处理（窗口复用）**
   ```typescript
   // 串行处理避免输入框冲突，但复用窗口避免重复初始化
   const url = await cryptoWindowManager.decrypt(urlCipher);
   const username = await cryptoWindowManager.decrypt(usernameCipher);
   const password = await cryptoWindowManager.decrypt(passwordCipher);
   ```

## 使用说明

优化后的功能使用方式完全不变，用户无需做任何调整：

1. 在数据库加解密工具中输入内容
2. 点击"加密"或"解密"按钮
3. 享受更快的处理速度

## 注意事项

1. **首次使用**：第一次使用时需要初始化窗口，会稍慢一些（约2.4秒）
2. **后续使用**：窗口已初始化，速度非常快（约0.9秒）
3. **窗口管理**：应用退出时会自动清理加解密窗口
4. **错误恢复**：如果窗口意外关闭，会自动重新初始化

## 未来优化方向

1. **预加载**：应用启动时预先初始化加解密窗口
2. **本地实现**：考虑使用 Node.js 的 crypto 模块实现 SM4 算法，完全避免浏览器窗口
3. **缓存机制**：对常用的加解密结果进行缓存
4. **批量优化**：支持一次性处理多组数据库配置

## 更新日期

2024-12-29
