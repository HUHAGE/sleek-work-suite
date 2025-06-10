import React from 'react';

const HuhaTools: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <iframe 
        src="https://www.huhage.fun" 
        className="w-full h-screen" 
        style={{ 
          border: 'none',
          height: '100vh'
        }}
        title="HUHA工具集"
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
      />
    </div>
  );
};

export default HuhaTools; 