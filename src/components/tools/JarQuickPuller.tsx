import React, { useState } from 'react';
import { Archive, Download, Settings, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SegmentedControl } from "@/components/ui/segmented-control";

interface SingleJarConfig {
  groupId: string;
  artifactId: string;
  version: string;
}

const JarQuickPuller: React.FC = () => {
  const [repoUrl, setRepoUrl] = useState('http://192.168.0.99:8081/nexus/content/groups/public/');
  const [username, setUsername] = useState('epointyanfa');
  const [password, setPassword] = useState('');
  const [singleJar, setSingleJar] = useState<SingleJarConfig>({
    groupId: '',
    artifactId: '',
    version: ''
  });
  const [batchDependencies, setBatchDependencies] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const { toast } = useToast();

  const handleSinglePull = async () => {
    if (!singleJar.groupId || !singleJar.artifactId || !singleJar.version) {
      toast({
        title: "输入不完整",
        description: "请填写完整的Jar包信息",
        variant: "destructive"
      });
      return;
    }
    
    setIsDownloading(true);
    setErrorMessage(null);
    
    try {
      await window.electron.ipcRenderer.invoke('select-directory-and-pull-jar', {
        type: 'single',
        repoUrl,
        username,
        password,
        jar: singleJar
      });
      
      toast({
        title: "下载成功",
        description: "Jar包已成功下载到指定位置",
      });
    } catch (error) {
      setErrorMessage(error.message);
      toast({
        title: "下载失败",
        description: error.message || "下载过程中发生错误",
        variant: "destructive"
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleBatchPull = async () => {
    if (!batchDependencies.trim()) {
      toast({
        title: "输入为空",
        description: "请输入Maven依赖配置",
        variant: "destructive"
      });
      return;
    }

    setIsDownloading(true);
    setErrorMessage(null);

    try {
      await window.electron.ipcRenderer.invoke('select-directory-and-pull-jar', {
        type: 'batch',
        repoUrl,
        username,
        password,
        dependencies: batchDependencies
      });

      toast({
        title: "批量下载成功",
        description: "所有Jar包已成功下载到指定位置",
      });
    } catch (error) {
      setErrorMessage(error.message);
      toast({
        title: "下载失败",
        description: error.message || "下载过程中发生错误",
        variant: "destructive"
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 仓库配置 */}
      <div className="tool-card">
        <div className="flex items-center gap-3 mb-4">
          <Settings className="text-primary" size={20} />
          <h2 className="text-lg font-medium text-primary">仓库配置</h2>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">仓库地址</label>
            <Input
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="请输入Maven仓库地址"
              disabled={isDownloading}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">用户名</label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入仓库用户名"
              disabled={isDownloading}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">密码</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入仓库密码"
              disabled={isDownloading}
            />
          </div>
        </div>
      </div>

      {/* 错误提示 */}
      {errorMessage && (
        <Alert variant="destructive">
          <AlertDescription className="whitespace-pre-wrap">{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Jar包拉取 */}
      <div className="tool-card">
        <div className="flex items-center gap-3 mb-4">
          <Archive className="text-primary" size={20} />
          <h2 className="text-lg font-medium text-primary">Jar包拉取</h2>
        </div>

        <div className="space-y-6">
          <SegmentedControl
            segments={['单个拉取', '批量拉取']}
            value={activeTab}
            onChange={setActiveTab}
            disabled={isDownloading}
            className="w-[240px] mx-auto"
          />

          <div className="space-y-4">
            {activeTab === 0 ? (
              // 单个拉取
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">GroupId</label>
                  <Input
                    value={singleJar.groupId}
                    onChange={(e) => setSingleJar({...singleJar, groupId: e.target.value})}
                    placeholder="例如：com.epoint.frame"
                    disabled={isDownloading}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">ArtifactId</label>
                  <Input
                    value={singleJar.artifactId}
                    onChange={(e) => setSingleJar({...singleJar, artifactId: e.target.value})}
                    placeholder="例如：epoint-dto"
                    disabled={isDownloading}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Version</label>
                  <Input
                    value={singleJar.version}
                    onChange={(e) => setSingleJar({...singleJar, version: e.target.value})}
                    placeholder="例如：9.5.0-sp4"
                    disabled={isDownloading}
                  />
                </div>
                <Button 
                  onClick={handleSinglePull} 
                  className="w-full" 
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      正在下载...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      拉取Jar包
                    </>
                  )}
                </Button>
              </>
            ) : (
              // 批量拉取
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Maven依赖配置</label>
                  <Textarea
                    value={batchDependencies}
                    onChange={(e) => setBatchDependencies(e.target.value)}
                    placeholder={`<!-- 请粘贴Maven依赖配置，例如： -->
<dependency>
    <groupId>com.epoint.frame</groupId>
    <artifactId>epoint-dto</artifactId>
    <version>9.5.0-sp4</version>
</dependency>

<!-- 支持多个依赖配置 -->
<dependency>
    <groupId>com.epoint.frame</groupId>
    <artifactId>epoint-core</artifactId>
    <version>9.5.0-sp4</version>
</dependency>`}
                    className="min-h-[200px] font-mono text-sm whitespace-pre"
                    disabled={isDownloading}
                  />
                </div>
                <Button 
                  onClick={handleBatchPull} 
                  className="w-full"
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      正在下载...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      批量拉取Jar包
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JarQuickPuller; 