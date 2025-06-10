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
    <div className={`h-10 flex items-center px-4 bg-background/80 backdrop-blur-xl border-b border-border/50 select-none ${styles.titlebar}`}>
      <div className={`flex items-center gap-2 flex-1 ${styles.controls}`}>
        <button
          onClick={handleClose}
          className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
        />
        <button
          onClick={handleMinimize}
          className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-600 transition-colors"
        />
        <button
          onClick={handleMaximize}
          className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-600 transition-colors"
        />
      </div>
      <div className="absolute left-1/2 transform -translate-x-1/2 text-sm text-muted-foreground">
        工作提效小助手
      </div>
    </div>
  );
};

export default TitleBar; 