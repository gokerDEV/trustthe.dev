type MousePosition = { x: number; y: number };
type UpdateFunction = (pos: MousePosition) => void;

let mousePosition: MousePosition = { x: 0, y: 0 };
const registry = new Set<UpdateFunction>();
let frameRequested = false;
let listenerAttached = false;

const updateAllComponents = () => {
  registry.forEach((updateCallback) => {
    try {
      updateCallback(mousePosition);
    } catch (error) {
      console.error('Error updating logo component:', error);
      // Consider removing the faulty callback if errors persist
      // registry.delete(updateCallback);
    }
  });
  frameRequested = false;
};

const handleGlobalMouseMove = (event: MouseEvent | TouchEvent) => {
  let x = 0;
  let y = 0;

  if ('touches' in event && event.touches.length > 0) {
    x = event.touches[0].clientX;
    y = event.touches[0].clientY;
  } else if ('clientX' in event) {
    x = event.clientX;
    y = event.clientY;
  }

  mousePosition = { x, y };

  if (!frameRequested) {
    frameRequested = true;
    requestAnimationFrame(updateAllComponents);
  }
};

export const registerLogoComponent = (updateCallback: UpdateFunction) => {
  registry.add(updateCallback);

  if (!listenerAttached && registry.size > 0) {
    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('touchmove', handleGlobalMouseMove);
    listenerAttached = true;
  }
};

export const unregisterLogoComponent = (updateCallback: UpdateFunction) => {
  registry.delete(updateCallback);

  if (listenerAttached && registry.size === 0) {
    document.removeEventListener('mousemove', handleGlobalMouseMove);
    document.removeEventListener('touchmove', handleGlobalMouseMove);
    listenerAttached = false;
    frameRequested = false;
  }
};

export const calculateDistance = (
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number => {
  return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
};

export const calculateScale = (
  distance: number,
  maxDistance: number = 1600,
  minScale: number = 0.75,
  maxScale: number = 1.5
): number => {
  const normalizedDistance = Math.min(distance / maxDistance, 1);
  const invertedDistance = 1 - normalizedDistance;
  return minScale + invertedDistance * (maxScale - minScale);
};

export const getRotation = (
  x: number,
  y: number,
  centerX: number,
  centerY: number
): number => Math.atan2(y - centerY, x - centerX) * (180 / Math.PI);
