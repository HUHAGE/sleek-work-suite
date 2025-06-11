import { Minus, Square, X } from 'lucide-react';
import styles from './TitleBar.module.css';

const TitleBar = () => {
  const handleMinimize = () => {
    // @ts-ignore
    window.electron?.minimize();
  };

  const handleMaximize = () => {
    // @ts-ignore
    window.electron?.maximize();
  };

  const handleClose = () => {
    // @ts-ignore
    window.electron?.close();
  };

  return (
    <div className={`${styles.titlebar} h-10 flex items-center px-4 bg-background/80 backdrop-blur-xl border-b border-border/50`}>
      <div className={`${styles.controls} flex items-center gap-2`}>
        <button
          onClick={handleMinimize}
          className="w-4 h-4 rounded-full bg-yellow-500 hover:bg-yellow-600 transition-colors"
        />
        <button
          onClick={handleMaximize}
          className="w-4 h-4 rounded-full bg-green-500 hover:bg-green-600 transition-colors"
        />
        <button
          onClick={handleClose}
          className="w-4 h-4 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
        />
      </div>
      <div className="flex-1 flex justify-center">
        <div className="text-sm text-muted-foreground">
          HUHA • 工作提效小助手
        </div>
      </div>
    </div>
  );
};

export default TitleBar; 