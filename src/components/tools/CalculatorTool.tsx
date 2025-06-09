
import { useState } from 'react';
import { Calculator, Delete, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CalculatorTool = () => {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const inputNumber = (num: string) => {
    if (waitingForOperand) {
      setDisplay(num);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const inputDot = () => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
    } else if (display.indexOf('.') === -1) {
      setDisplay(display + '.');
    }
  };

  const clear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  };

  const deleteLast = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  const performOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      let result;

      switch (operation) {
        case '+':
          result = currentValue + inputValue;
          break;
        case '-':
          result = currentValue - inputValue;
          break;
        case '×':
          result = currentValue * inputValue;
          break;
        case '÷':
          result = currentValue / inputValue;
          break;
        default:
          return;
      }

      setDisplay(String(result));
      setPreviousValue(result);
    }

    setWaitingForOperand(true);
    setOperation(nextOperation);
  };

  const calculate = () => {
    const inputValue = parseFloat(display);

    if (previousValue !== null && operation) {
      let result;

      switch (operation) {
        case '+':
          result = previousValue + inputValue;
          break;
        case '-':
          result = previousValue - inputValue;
          break;
        case '×':
          result = previousValue * inputValue;
          break;
        case '÷':
          result = previousValue / inputValue;
          break;
        default:
          return;
      }

      setDisplay(String(result));
      setPreviousValue(null);
      setOperation(null);
      setWaitingForOperand(true);
    }
  };

  const buttons = [
    ['C', '⌫', '÷'],
    ['7', '8', '9', '×'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', '+'],
    ['0', '.', '=']
  ];

  return (
    <div className="max-w-md mx-auto">
      <div className="tool-card">
        <div className="flex items-center gap-2 mb-6">
          <Calculator size={20} className="text-primary" />
          <h3 className="text-xl font-semibold">计算器</h3>
        </div>
        
        {/* 显示屏 */}
        <div className="bg-background/80 rounded-xl p-6 mb-6 border border-border/50">
          <div className="text-right">
            <div className="text-sm text-muted-foreground mb-1">
              {previousValue !== null && operation ? `${previousValue} ${operation}` : ''}
            </div>
            <div className="text-3xl font-mono font-bold text-foreground truncate">
              {display}
            </div>
          </div>
        </div>

        {/* 按键 */}
        <div className="grid grid-cols-4 gap-3">
          {buttons.flat().map((btn, index) => {
            let buttonClass = "h-14 text-lg font-semibold rounded-xl transition-all duration-200 ";
            
            if (btn === 'C') {
              buttonClass += "bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30";
            } else if (btn === '⌫') {
              buttonClass += "bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30";
            } else if (['+', '-', '×', '÷', '='].includes(btn)) {
              buttonClass += "bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30";
            } else {
              buttonClass += "bg-secondary/50 hover:bg-secondary/70 text-foreground border border-border/50";
            }

            if (btn === '0') {
              return (
                <Button
                  key={index}
                  className={`col-span-2 ${buttonClass}`}
                  onClick={() => inputNumber(btn)}
                >
                  {btn}
                </Button>
              );
            }

            return (
              <Button
                key={index}
                className={buttonClass}
                onClick={() => {
                  if (btn === 'C') clear();
                  else if (btn === '⌫') deleteLast();
                  else if (btn === '=') calculate();
                  else if (['+', '-', '×', '÷'].includes(btn)) performOperation(btn);
                  else if (btn === '.') inputDot();
                  else inputNumber(btn);
                }}
              >
                {btn}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CalculatorTool;
