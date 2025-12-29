import { useState } from 'react';
import { ChevronDown, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CollapsibleDescriptionProps {
  title: string;
  description: string;
}

const CollapsibleDescription = ({ title, description }: CollapsibleDescriptionProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mb-6">
      {/* 折叠按钮 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200",
          "hover:bg-primary/10 border border-transparent hover:border-primary/20",
          "text-sm text-muted-foreground hover:text-primary",
          isExpanded && "bg-card/50 border-primary/20 backdrop-blur-sm"
        )}
      >
        <Info size={16} className="shrink-0" />
        <span className="font-medium">功能说明</span>
        <ChevronDown 
          size={16} 
          className={cn(
            "ml-auto transition-transform duration-200",
            isExpanded && "rotate-180"
          )}
        />
      </button>

      {/* 展开的内容 */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-200",
          isExpanded ? "max-h-96 opacity-100 mt-2" : "max-h-0 opacity-0"
        )}
      >
        <div className="p-4 rounded-lg bg-card/50 border border-primary/20 backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <Info className="text-primary mt-1 shrink-0" size={20} />
            <div>
              <h2 className="text-lg font-medium text-primary mb-2">{title}</h2>
              <p className="text-muted-foreground">{description}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollapsibleDescription;
