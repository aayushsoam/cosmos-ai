import { CSSProperties, useMemo } from 'react';

interface ShinyTextProps {
  text: string;
  disabled?: boolean;
  speed?: number;
  className?: string;
}

export const ShinyText: React.FC<ShinyTextProps> = ({ text, disabled = false, speed = 3, className = '' }) => {
  const animationDuration = useMemo(() => `${speed}s`, [speed]);

  const shinyStyle: CSSProperties = {
    background: 'linear-gradient(90deg, #fff 0%, #fff 40%, rgba(255,255,255,0.5) 50%, #fff 60%, #fff 100%)',
    backgroundSize: '200% auto',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: disabled ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.9)',
    backgroundClip: 'text',
    animation: disabled ? 'none' : `shimmer ${animationDuration} linear infinite`,
    cursor: disabled ? 'not-allowed' : 'default',
    opacity: disabled ? 0.6 : 1,
  };

  return (
    <style>
      {`
        @keyframes shimmer {
          0% {
            background-position: -200% center;
          }
          100% {
            background-position: 200% center;
          }
        }
      `}
    </style>
  );
};

interface ShinyTextWrapperProps {
  text: string;
  disabled?: boolean;
  speed?: number;
  className?: string;
}

/**
 * Component that displays text with a shiny/shimmer animation effect
 * Similar to ChatGPT's UI loading states
 */
export const ShinyTextDisplay: React.FC<ShinyTextWrapperProps> = ({
  text,
  disabled = false,
  speed = 3,
  className = '',
}) => {
  const animationDuration = useMemo(() => `${speed}s`, [speed]);

  return (
    <>
      <style>
        {`
          @keyframes shimmer {
            0% {
              background-position: -200% center;
            }
            100% {
              background-position: 200% center;
            }
          }
          
          .shiny-text {
            background: linear-gradient(
              90deg,
              rgba(255, 255, 255, 0.9) 0%,
              rgba(255, 255, 255, 0.9) 40%,
              rgba(255, 255, 255, 0.3) 50%,
              rgba(255, 255, 255, 0.9) 60%,
              rgba(255, 255, 255, 0.9) 100%
            );
            background-size: 200% auto;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            animation: shimmer ${animationDuration} linear infinite;
            font-weight: 500;
          }
          
          .shiny-text.disabled {
            animation: none;
            -webkit-text-fill-color: rgba(255, 255, 255, 0.5);
            opacity: 0.6;
          }
        `}
      </style>
      <span className={`shiny-text ${disabled ? 'disabled' : ''} ${className}`}>{text}</span>
    </>
  );
};

export default ShinyTextDisplay;
