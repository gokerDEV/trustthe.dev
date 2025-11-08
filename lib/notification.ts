// Notification sound utility
let audioContext: AudioContext | null = null;

const createAudioContext = () => {
  // Create on user interaction if it doesn't exist yet
  if (!audioContext) {
    audioContext = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: AudioContext })
        .webkitAudioContext)();
  }
  return audioContext;
};

// Simple beep notification sound
export const playNotificationSound = () => {
  try {
    const context = createAudioContext();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    // Set oscillator options
    oscillator.type = 'sine';
    oscillator.frequency.value = 830; // Hz
    gainNode.gain.value = 0.3; // 30% volume

    // Schedule start and stop
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.15); // Short beep

    // Create a second beep after a short delay
    const oscillator2 = context.createOscillator();
    oscillator2.connect(gainNode);
    oscillator2.type = 'sine';
    oscillator2.frequency.value = 1250; // Higher frequency for second beep

    oscillator2.start(context.currentTime + 0.2);
    oscillator2.stop(context.currentTime + 0.35);

    return true;
  } catch (error) {
    console.error('Error playing notification sound:', error);
    return false;
  }
};
