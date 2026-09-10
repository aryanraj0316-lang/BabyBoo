import React, { useState, useRef, useEffect, useCallback } from 'react';
import { soundEngine } from '../../utils/audio';

interface PatternLockProps {
  onComplete: (pattern: number[]) => void;
  error?: boolean;
  success?: boolean;
  disabled?: boolean;
  size?: number;
  label?: string;
  helperText?: string;
}

interface Point {
  x: number;
  y: number;
}

export const PatternLock: React.FC<PatternLockProps> = ({
  onComplete,
  error = false,
  success = false,
  disabled = false,
  size = 280,
  label = 'Draw Parent Pattern Lock',
  helperText = 'Connect at least 4 dots',
}) => {
  const [selectedNodes, setSelectedNodes] = useState<number[]>([]);
  const [isInteracting, setIsInteracting] = useState(false);
  const [currentCoord, setCurrentCoord] = useState<Point | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 3x3 grid layout (9 dots)
  const nodePositions = [
    { idx: 0, x: 20, y: 20 },
    { idx: 1, x: 50, y: 20 },
    { idx: 2, x: 80, y: 20 },
    { idx: 3, x: 20, y: 50 },
    { idx: 4, x: 50, y: 50 },
    { idx: 5, x: 80, y: 50 },
    { idx: 6, x: 20, y: 80 },
    { idx: 7, x: 50, y: 80 },
    { idx: 8, x: 80, y: 80 },
  ];

  const getRelativeCoordinates = (clientX: number, clientY: number): Point | null => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    return { x, y };
  };

  const checkNodeCollision = useCallback((point: Point): number | null => {
    const HIT_RADIUS = 12; // Percentage hit radius
    for (const node of nodePositions) {
      const dist = Math.hypot(node.x - point.x, node.y - point.y);
      if (dist < HIT_RADIUS) {
        return node.idx;
      }
    }
    return null;
  }, []);

  const handleStart = (clientX: number, clientY: number) => {
    if (disabled) return;
    const pt = getRelativeCoordinates(clientX, clientY);
    if (!pt) return;
    setIsInteracting(true);
    setCurrentCoord(pt);

    const hit = checkNodeCollision(pt);
    if (hit !== null) {
      setSelectedNodes([hit]);
      soundEngine.playPatternTick();
    } else {
      setSelectedNodes([]);
    }
  };

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!isInteracting || disabled) return;
    const pt = getRelativeCoordinates(clientX, clientY);
    if (!pt) return;
    setCurrentCoord(pt);

    const hit = checkNodeCollision(pt);
    if (hit !== null && !selectedNodes.includes(hit)) {
      setSelectedNodes((prev) => [...prev, hit]);
      soundEngine.playPatternTick();
    }
  }, [isInteracting, disabled, selectedNodes, checkNodeCollision]);

  const handleEnd = useCallback(() => {
    if (!isInteracting || disabled) return;
    setIsInteracting(false);
    setCurrentCoord(null);

    if (selectedNodes.length >= 3) {
      onComplete([...selectedNodes]);
    } else if (selectedNodes.length > 0) {
      setSelectedNodes([]);
    }
  }, [isInteracting, disabled, selectedNodes, onComplete]);

  // Mouse event listeners
  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX, e.clientY);
  };

  // Touch event listeners
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      handleStart(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  useEffect(() => {
    const onWindowMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    };
    const onWindowMouseUp = () => {
      handleEnd();
    };
    const onWindowTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const onWindowTouchEnd = () => {
      handleEnd();
    };

    if (isInteracting) {
      window.addEventListener('mousemove', onWindowMouseMove);
      window.addEventListener('mouseup', onWindowMouseUp);
      window.addEventListener('touchmove', onWindowTouchMove);
      window.addEventListener('touchend', onWindowTouchEnd);
    }

    return () => {
      window.removeEventListener('mousemove', onWindowMouseMove);
      window.removeEventListener('mouseup', onWindowMouseUp);
      window.removeEventListener('touchmove', onWindowTouchMove);
      window.removeEventListener('touchend', onWindowTouchEnd);
    };
  }, [isInteracting, handleMove, handleEnd]);

  // Reset local state if error occurs
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setSelectedNodes([]);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const lineColor = error
    ? '#EF4444' // red
    : success
      ? '#10B981' // green
      : '#5D997C'; // soft sage primary

  return (
    <div className="flex flex-col items-center">
      {label && <p className="text-sm font-bold text-[#1A2436] mb-1">{label}</p>}
      {helperText && <p className="text-xs text-[#718096] mb-4">{helperText}</p>}

      <div
        ref={containerRef}
        style={{ width: size, height: size }}
        className={`relative touch-none select-none rounded-[28px] bg-white border-2 transition-all p-4 ${
          error
            ? 'border-red-400 bg-red-50/30 animate-shake'
            : success
              ? 'border-emerald-400 bg-emerald-50/30'
              : 'border-[#EAE5DE] shadow-xs'
        }`}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
      >
        {/* Connecting Lines SVG */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {/* Static connected segments */}
          {selectedNodes.map((nodeIdx, i) => {
            if (i === 0) return null;
            const prevIdx = selectedNodes[i - 1];
            const p1 = nodePositions[prevIdx];
            const p2 = nodePositions[nodeIdx];
            return (
              <line
                key={`line-${i}`}
                x1={`${p1.x}%`}
                y1={`${p1.y}%`}
                x2={`${p2.x}%`}
                y2={`${p2.y}%`}
                stroke={lineColor}
                strokeWidth="4"
                strokeLinecap="round"
                strokeOpacity="0.8"
              />
            );
          })}

          {/* Active pointer follower line */}
          {isInteracting && selectedNodes.length > 0 && currentCoord && (
            <line
              x1={`${nodePositions[selectedNodes[selectedNodes.length - 1]].x}%`}
              y1={`${nodePositions[selectedNodes[selectedNodes.length - 1]].y}%`}
              x2={`${currentCoord.x}%`}
              y2={`${currentCoord.y}%`}
              stroke={lineColor}
              strokeWidth="3"
              strokeDasharray="4 4"
              strokeLinecap="round"
              strokeOpacity="0.6"
            />
          )}
        </svg>

        {/* 3x3 Nodes */}
        {nodePositions.map((node) => {
          const isSelected = selectedNodes.includes(node.idx);
          const isCurrentTail = selectedNodes[selectedNodes.length - 1] === node.idx;

          return (
            <div
              key={node.idx}
              style={{
                left: `${node.x}%`,
                top: `${node.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
              className={`absolute flex items-center justify-center rounded-full transition-all duration-200 cursor-pointer ${
                isSelected
                  ? error
                    ? 'w-10 h-10 bg-red-100 border-2 border-red-500 scale-110 shadow-sm'
                    : success
                      ? 'w-10 h-10 bg-emerald-100 border-2 border-emerald-500 scale-110 shadow-sm'
                      : 'w-10 h-10 bg-[#EBF4EF] border-2 border-[#5D997C] scale-110 shadow-xs'
                  : 'w-8 h-8 bg-white border-2 border-[#EAE5DE] hover:border-[#5D997C] hover:scale-105 shadow-xs'
              }`}
            >
              {/* Inner dot */}
              <div
                className={`w-3.5 h-3.5 rounded-full transition-all ${
                  isSelected
                    ? error
                      ? 'bg-red-600 scale-125'
                      : success
                        ? 'bg-emerald-600 scale-125'
                        : 'bg-[#5D997C] scale-125'
                    : 'bg-[#A0AEC0]'
                } ${isCurrentTail ? 'animate-ping opacity-75' : ''}`}
              />
            </div>
          );
        })}
      </div>

      {selectedNodes.length > 0 && (
        <button
          type="button"
          onClick={() => setSelectedNodes([])}
          className="mt-3 text-xs font-semibold text-slate-500 hover:text-slate-700 underline"
        >
          Reset drawing
        </button>
      )}
    </div>
  );
};
