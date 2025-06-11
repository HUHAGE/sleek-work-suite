import React from 'react';

const HuhaTools: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <iframe 
        src="https://www.huhage.fun" 
        className="w-full"
        style={{ 
          border: 'none',
          height: 'calc(100% - 1px)'  // 稍微减少一点高度以确保不会出现滚动条
        }}
        title="HUHA工具集"
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
      />
    </div>
  );
};

export default HuhaTools; 