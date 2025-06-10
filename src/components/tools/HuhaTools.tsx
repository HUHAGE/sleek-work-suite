import React from 'react';

const HuhaTools: React.FC = () => {
  return (
    <div className="fixed inset-0 left-[var(--sidebar-width)] z-10 transition-all duration-300">
      <iframe 
        src="https://www.huhage.fun" 
        className="w-full h-full" 
        style={{ 
          border: 'none'
        }}
        title="HUHA工具集"
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
      />
    </div>
  );
};

export default HuhaTools; 