'use client';

import {
  calculateDistance,
  calculateScale,
  getRotation,
  registerLogoComponent,
  unregisterLogoComponent,
} from '@/lib/logo.utils';
import { useCallback, useEffect, useRef } from 'react';

type Props = {
  className?: string;
};

const ROTATION_OFFSET = 40;
const MAX_PUPIL_OFFSET = 20;

const LogoAnimation = ({ className = '' }: Props) => {
  const pupilL = useRef<SVGCircleElement>(null);
  const pupilR = useRef<SVGCircleElement>(null);
  const eyelid = useRef<SVGPathElement>(null);

  const applyTransform = useCallback(
    (
      pupil: SVGCircleElement,
      targetX: number,
      targetY: number,
      distance: number,
      rotation: number
    ) => {
      const scale = Math.min(Math.max(calculateScale(distance), 0.75), 2);
      pupil.style.transformOrigin = 'center';
      pupil.style.transformBox = 'fill-box';

      const currentOffset = Math.sqrt(targetX * targetX + targetY * targetY);
      const clampedOffset = Math.min(currentOffset, MAX_PUPIL_OFFSET);
      const angle = Math.atan2(targetY, targetX);
      const tx = clampedOffset * Math.cos(angle);
      const ty = clampedOffset * Math.sin(angle);

      pupil.style.transform = `translate(${tx}px, ${ty}px) rotate(${rotation - ROTATION_OFFSET}deg) scale(${scale})`;
    },
    []
  );

  const updatePupils = useCallback(
    (mousePos: { x: number; y: number }) => {
      if (!pupilL.current || !pupilR.current) return;

      const rectL = pupilL.current.getBoundingClientRect();
      const rectR = pupilR.current.getBoundingClientRect();

      const centerX_L = rectL.left + rectL.width / 2;
      const centerY_L = rectL.top + rectL.height / 2;
      const centerX_R = rectR.left + rectR.width / 2;
      const centerY_R = rectR.top + rectR.height / 2;

      const dL = calculateDistance(
        mousePos.x,
        mousePos.y,
        centerX_L,
        centerY_L
      );
      const dR = calculateDistance(
        mousePos.x,
        mousePos.y,
        centerX_R,
        centerY_R
      );

      const targetX_L = mousePos.x - centerX_L;
      const targetY_L = mousePos.y - centerY_L;
      const targetX_R = mousePos.x - centerX_R;
      const targetY_R = mousePos.y - centerY_R;

      const rotationL = getRotation(
        mousePos.x,
        mousePos.y,
        centerX_L,
        centerY_L
      );
      const rotationR = getRotation(
        mousePos.x,
        mousePos.y,
        centerX_R,
        centerY_R
      );

      applyTransform(pupilL.current, targetX_L, targetY_L, dL, rotationL);
      applyTransform(pupilR.current, targetX_R, targetY_R, dR, rotationR);
    },
    [applyTransform]
  );

  const handleBlink = useCallback(() => {
    if (!eyelid.current) return;
    const currentEyelid = eyelid.current; // Capture ref value

    currentEyelid.setAttribute(
      'transform',
      'scale(1, 0.1) translate(0, 450)' // Adjust translate Y if needed based on origin
    );
    const blinkTimer = setTimeout(() => {
      if (eyelid.current === currentEyelid) {
        currentEyelid.setAttribute('transform', 'scale(1, 1) translate(0, 0)');
      }
    }, 250);

    return () => clearTimeout(blinkTimer);
  }, []);

  useEffect(() => {
    registerLogoComponent(updatePupils);
    return () => {
      unregisterLogoComponent(updatePupils);
    };
  }, [updatePupils]);

  return (
    <>
      <svg
        className={`logo-animation group ${className}`}
        xmlns='http://www.w3.org/2000/svg'
        viewBox='0 0 278.08 278.08'
        onMouseEnter={handleBlink}
        onMouseLeave={() => {}}
      >
        <defs>
          <mask id='eyelid-mask'>
            <path
              ref={eyelid}
              className='origin-[50%][60%]'
              fill='white'
              d='M73.3,152.7c-28,0-50.7-24.9-50.7-55.6s22.7-55.6,50.7-55.6,50.7,24.9,50.7,55.6-22.7,55.6-50.7,55.6ZM195.1,145.7c-27.8,0-50.3-23.9-50.3-53.3s22.5-53.3,50.3-53.3,50.3,23.9,50.3,53.3-22.5,53.3-50.3,53.3Z'
            />
          </mask>
        </defs>
        <g className='translate-0 transition-transform duration-200 ease-in-out group-hover:translate-x-[12px] group-hover:scale-90 group-hover:rotate-3'>
          <path d='M267,87.29c-2.26-42.46-36.85-75.14-77.25-73C165.13,15.61,144,29.61,131.81,50,117.56,29.17,94.43,16.2,69,17.55,28.62,19.7-2.22,57.25.13,101.41s37,78.23,77.4,76.08a68.83,68.83,0,0,0,41.83-17.27c3.26,12,7.37,23.3,11.56,35.42a5.16,5.16,0,0,1-1.46,5.55c-15.6,13.77-48.9,41.5-59.78,53.09-21.76,22.19-26.52,34.62,8,11.22,24-15.08,51.33-29.7,70.7-47.9,11.18-9.4,10.18-21.07,4.71-33.39-5.91-12.11-9.31-24.05-11.25-39.17,14.24,15.2,34.34,24.19,56.15,23C238.38,165.92,269.3,129.76,267,87.29ZM73.32,152.66c-28,0-50.72-24.89-50.72-55.6s22.71-55.6,50.72-55.6S124,66.36,124,97.06,101.33,152.66,73.32,152.66Zm121.8-7c-27.77,0-50.29-23.86-50.29-53.28S167.35,39.1,195.12,39.1,245.4,63,245.4,92.38,222.89,145.66,195.12,145.66Z' />
          <g mask='url(#eyelid-mask)'>
            <circle
              ref={pupilL}
              className='pupil transition-transform duration-100 ease-out'
              cx='74.3'
              cy='96.5'
              r='15.7'
            />
            <circle
              ref={pupilR}
              className='pupil transition-transform duration-100 ease-out'
              cx='195.1'
              cy='92.4'
              r='15.7'
            />
          </g>
          {/* <path
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            d="M73.3,152.7c-28,0-50.7-24.9-50.7-55.6s22.7-55.6,50.7-55.6,50.7,24.9,50.7,55.6-22.7,55.6-50.7,55.6ZM195.1,145.7c-27.8,0-50.3-23.9-50.3-53.3s22.5-53.3,50.3-53.3,50.3,23.9,50.3,53.3-22.5,53.3-50.3,53.3Z"
          /> */}
        </g>
      </svg>
    </>
  );
};

export default LogoAnimation;
