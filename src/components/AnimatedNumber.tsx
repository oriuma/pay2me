import { useState, useEffect } from "react";

interface AnimatedNumberProps {
  value: number;
  className?: string;
}

export function AnimatedNumber({ value, className = "" }: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (value !== displayValue) {
      setIsAnimating(true);
      
      // Smooth transition for the number change
      const startValue = displayValue;
      const endValue = value;
      const duration = 300; // milliseconds
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease-out cubic function for smooth animation
        const easeOut = 1 - Math.pow(1 - progress, 3);
        
        const currentValue = startValue + (endValue - startValue) * easeOut;
        setDisplayValue(currentValue);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setDisplayValue(endValue);
          setIsAnimating(false);
        }
      };

      requestAnimationFrame(animate);
    }
  }, [value, displayValue]);

  const formatNumber = (num: number) => {
    return num.toFixed(2);
  };

  return (
    <span 
      className={`transition-all duration-300 ${isAnimating ? 'scale-110 blur-sm' : 'scale-100 blur-0'} ${className}`}
      style={{
        filter: isAnimating ? 'blur(1px)' : 'blur(0px)',
        transform: isAnimating ? 'scale(1.05)' : 'scale(1)',
        textShadow: isAnimating ? '0 0 8px rgba(59, 130, 246, 0.5)' : 'none'
      }}
    >
      {formatNumber(displayValue)}
    </span>
  );
}