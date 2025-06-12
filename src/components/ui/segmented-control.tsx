import * as React from "react"
import { cn } from "@/lib/utils"

interface SegmentedControlProps {
  segments: string[];
  value: number;
  onChange: (index: number) => void;
  disabled?: boolean;
  className?: string;
}

const SegmentedControl = React.forwardRef<HTMLDivElement, SegmentedControlProps>(
  ({ segments, value, onChange, disabled, className }, ref) => {
    const [containerWidth, setContainerWidth] = React.useState(0);
    const containerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    }, []);

    return (
      <div
        ref={containerRef}
        className={cn(
          "relative flex h-10 items-center rounded-lg p-1",
          "bg-muted/50 dark:bg-muted/20",
          "ring-1 ring-border dark:ring-border",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
      >
        {/* 背景滑块 */}
        <div
          className={cn(
            "absolute h-8 rounded-md transition-transform duration-200 ease-out",
            "bg-background dark:bg-muted",
            "shadow-sm dark:shadow-md",
            "ring-1 ring-border dark:ring-border"
          )}
          style={{
            width: `${containerWidth / segments.length - 8}px`,
            transform: `translateX(${value * (containerWidth / segments.length)}px)`,
          }}
        />

        {/* 选项按钮 */}
        {segments.map((segment, index) => (
          <button
            key={segment}
            onClick={() => !disabled && onChange(index)}
            className={cn(
              "relative flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200",
              "focus-visible:outline-none",
              value === index
                ? "text-foreground dark:text-foreground"
                : "text-muted-foreground hover:text-foreground dark:text-muted-foreground dark:hover:text-foreground",
              disabled && "cursor-not-allowed"
            )}
            disabled={disabled}
          >
            {segment}
          </button>
        ))}
      </div>
    );
  }
);

SegmentedControl.displayName = "SegmentedControl";

export { SegmentedControl }; 