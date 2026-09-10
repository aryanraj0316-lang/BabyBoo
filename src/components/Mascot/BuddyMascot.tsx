import React, { useState, useEffect } from 'react';
import mascotBodyImg from '../../assets/mascot_body.png';
import mascotHandImg from '../../assets/mascot_hand.png';

export type MascotMood = 'waving' | 'cheerful' | 'encouraging' | 'sleepy' | 'celebrate' | 'subtle_corner';

interface BuddyMascotProps {
  mood?: MascotMood;
  size?: number;
  className?: string;
  speechText?: string;
  disableHover?: boolean;
  waveHand?: boolean;
  lookAround?: boolean;
}

export const BuddyMascot: React.FC<BuddyMascotProps> = ({
  size = 140,
  className = '',
  speechText,
  disableHover = true,
  waveHand = true,
  lookAround = true,
}) => {
  const [pupilOffset, setPupilOffset] = useState({ x: 0, y: 0 });

  // Procedural randomized glance loop
  useEffect(() => {
    if (!lookAround) {
      setPupilOffset({ x: 0, y: 0 });
      return;
    }

    let isMounted = true;
    let timerId: ReturnType<typeof setTimeout> | null = null;

    const nextGlance = () => {
      if (!isMounted) return;

      const isCenter = Math.random() < 0.35;
      let targetX = 0;
      let targetY = 0;

      if (!isCenter) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 1.2 + Math.random() * 2.2;
        targetX = Math.cos(angle) * radius;
        targetY = Math.sin(angle) * radius;
      }

      setPupilOffset({ x: targetX, y: targetY });

      const pauseDuration = isCenter
        ? 1400 + Math.random() * 1500
        : 700 + Math.random() * 1400;

      timerId = setTimeout(nextGlance, pauseDuration);
    };

    timerId = setTimeout(nextGlance, 800);

    return () => {
      isMounted = false;
      if (timerId) clearTimeout(timerId);
    };
  }, [lookAround]);

  const bodyWidth = size;
  const bodyHeight = size * (682 / 1024);
  const handWidth = size * 0.41;
  const handHeight = handWidth * (972 / 1024);

  const mainPupilSize = Math.max(5, bodyWidth * 0.034);

  const leftEyeX = bodyWidth * 0.416;
  const leftEyeY = bodyHeight * 0.419;
  const rightEyeX = bodyWidth * 0.646;
  const rightEyeY = bodyHeight * 0.463;

  return (
    <div className={`flex flex-col items-center justify-center select-none ${className}`}>
      {speechText && (
        <div className="relative mb-3 px-4 py-2.5 bg-white text-slate-800 rounded-2xl shadow-lg border border-purple-100 text-sm md:text-base font-medium max-w-[260px] text-center animate-bounce-gentle z-20">
          {speechText}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-b border-r border-purple-100 rotate-45" />
        </div>
      )}

      <div
        style={{
          width: bodyWidth,
          height: bodyHeight,
        }}
        className={`relative flex items-center justify-center ${disableHover ? '' : 'transition-transform hover:scale-105 duration-300'} drop-shadow-md`}
      >
        {/* Mascot Body & Head Wrapper */}
        <div
          style={{
            position: 'relative',
            width: bodyWidth,
            height: bodyHeight,
          }}
        >
          {/* Waving Paw / Arm (Attached directly to shoulder) */}
          <div
            style={{
              position: 'absolute',
              width: handWidth,
              height: handHeight,
              left: bodyWidth * 0.05,
              top: bodyHeight * 0.27,
              transformOrigin: '72% 85%',
              transform: 'rotate(-10deg)',
            }}
            className={`z-10 pointer-events-none ${waveHand ? 'animate-mascot-wave' : ''}`}
          >
            <img
              src={mascotHandImg}
              alt="Mascot Arm"
              className="w-full h-full object-contain"
            />
          </div>

          {/* Body image on top */}
          <img
            src={mascotBodyImg}
            alt="BabyBoo Mascot"
            className="relative z-20 w-full h-full object-contain pointer-events-none"
          />

          {/* Left Eye Shine (Single White Dot with randomized glance) */}
          <div
            style={{
              left: leftEyeX - mainPupilSize / 2,
              top: leftEyeY - mainPupilSize / 2,
              transform: `translate(${pupilOffset.x}px, ${pupilOffset.y}px)`,
              transition: 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
            }}
            className="absolute z-30 pointer-events-none"
          >
            <div
              style={{
                width: mainPupilSize,
                height: mainPupilSize,
                borderRadius: '50%',
              }}
              className="bg-white shadow-[0_0_4px_rgba(255,255,255,0.9)]"
            />
          </div>

          {/* Right Eye Shine (Single White Dot with randomized glance) */}
          <div
            style={{
              left: rightEyeX - mainPupilSize / 2,
              top: rightEyeY - mainPupilSize / 2,
              transform: `translate(${pupilOffset.x}px, ${pupilOffset.y}px)`,
              transition: 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
            }}
            className="absolute z-30 pointer-events-none"
          >
            <div
              style={{
                width: mainPupilSize,
                height: mainPupilSize,
                borderRadius: '50%',
              }}
              className="bg-white shadow-[0_0_4px_rgba(255,255,255,0.9)]"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
