
import { useState, useEffect } from 'react';
import { Clock, Timer, Calendar, Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

const TimeTools = () => {
  const [timestamp, setTimestamp] = useState('');
  const [customTime, setCustomTime] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60); // 25分钟
  const [pomodoroRunning, setPomodoroRunning] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            setTimerRunning(false);
            toast({
              title: "计时器结束",
              description: "时间到了！",
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerSeconds, toast]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (pomodoroRunning && pomodoroTime > 0) {
      interval = setInterval(() => {
        setPomodoroTime(prev => {
          if (prev <= 1) {
            setPomodoroRunning(false);
            toast({
              title: "番茄钟结束",
              description: "休息一下吧！",
            });
            return 25 * 60;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [pomodoroRunning, pomodoroTime, toast]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const convertTimestamp = () => {
    const ts = parseInt(timestamp);
    if (isNaN(ts)) return '无效时间戳';
    const date = new Date(ts * (timestamp.length === 10 ? 1000 : 1));
    return date.toLocaleString('zh-CN');
  };

  const convertToTimestamp = () => {
    const date = new Date(customTime);
    if (isNaN(date.getTime())) return '无效日期';
    return Math.floor(date.getTime() / 1000).toString();
  };

  return (
    <div className="space-y-6">
      {/* 当前时间 */}
      <div className="tool-card">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={20} className="text-primary" />
          <h3 className="text-xl font-semibold">当前时间</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-background/50 rounded-lg p-6 text-center">
            <div className="text-3xl font-mono font-bold text-primary mb-2">
              {currentTime.toLocaleTimeString('zh-CN')}
            </div>
            <div className="text-muted-foreground">北京时间</div>
          </div>
          <div className="bg-background/50 rounded-lg p-6 text-center">
            <div className="text-xl font-mono font-bold text-blue-400 mb-2">
              {Math.floor(currentTime.getTime() / 1000)}
            </div>
            <div className="text-muted-foreground">时间戳</div>
          </div>
        </div>
      </div>

      {/* 时间戳转换 */}
      <div className="tool-card">
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={20} className="text-primary" />
          <h3 className="text-xl font-semibold">时间戳转换</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="text-sm font-medium">时间戳转日期</label>
            <div className="flex gap-2">
              <Input
                placeholder="输入时间戳"
                value={timestamp}
                onChange={(e) => setTimestamp(e.target.value)}
                className="bg-background/50"
              />
            </div>
            <div className="bg-muted/20 rounded p-3 text-sm">
              {timestamp ? convertTimestamp() : '请输入时间戳'}
            </div>
          </div>
          
          <div className="space-y-3">
            <label className="text-sm font-medium">日期转时间戳</label>
            <div className="flex gap-2">
              <Input
                type="datetime-local"
                value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
                className="bg-background/50"
              />
            </div>
            <div className="bg-muted/20 rounded p-3 text-sm">
              {customTime ? convertToTimestamp() : '请选择日期时间'}
            </div>
          </div>
        </div>
      </div>

      {/* 计时器和番茄钟 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 倒计时器 */}
        <div className="tool-card">
          <div className="flex items-center gap-2 mb-4">
            <Timer size={20} className="text-primary" />
            <h3 className="text-xl font-semibold">倒计时器</h3>
          </div>
          <div className="text-center space-y-4">
            <div className="text-4xl font-mono font-bold text-primary">
              {formatTime(timerSeconds)}
            </div>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="分钟"
                className="bg-background/50"
                onChange={(e) => setTimerSeconds(parseInt(e.target.value || '0') * 60)}
              />
              <Button
                onClick={() => setTimerRunning(!timerRunning)}
                disabled={timerSeconds === 0}
                className="bg-primary hover:bg-primary/80"
              >
                {timerRunning ? <Pause size={16} /> : <Play size={16} />}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setTimerRunning(false);
                  setTimerSeconds(0);
                }}
              >
                <RotateCcw size={16} />
              </Button>
            </div>
          </div>
        </div>

        {/* 番茄钟 */}
        <div className="tool-card">
          <div className="flex items-center gap-2 mb-4">
            <Timer size={20} className="text-primary" />
            <h3 className="text-xl font-semibold">番茄钟</h3>
          </div>
          <div className="text-center space-y-4">
            <div className="text-4xl font-mono font-bold text-red-400">
              {formatTime(pomodoroTime)}
            </div>
            <div className="flex gap-2 justify-center">
              <Button
                onClick={() => setPomodoroRunning(!pomodoroRunning)}
                className="bg-red-500 hover:bg-red-600"
              >
                {pomodoroRunning ? <Pause size={16} /> : <Play size={16} />}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setPomodoroRunning(false);
                  setPomodoroTime(25 * 60);
                }}
              >
                <RotateCcw size={16} />
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              25分钟专注时间
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeTools;
