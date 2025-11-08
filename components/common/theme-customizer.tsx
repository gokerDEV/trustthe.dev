'use client';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { AlertTriangle, CheckCircle, RotateCcw, Settings2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

const clamp = (val: number, min = 0, max = 1): number =>
  Math.max(min, Math.min(max, val));

function linearSRGBToSRGB(val: number): number {
  val = clamp(val);
  return val <= 0.0031308
    ? val * 12.92
    : 1.055 * Math.pow(val, 1 / 2.4) - 0.055;
}

function calculateRelativeLuminance(
  r_srgb: number,
  g_srgb: number,
  b_srgb: number
): number {
  return 0.2126 * r_srgb + 0.7152 * g_srgb + 0.0722 * b_srgb;
}

function calculateContrastRatio(lum1: number, lum2: number): number {
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

function getColorLuminance(
  oklchColorString: string | undefined
): number | null {
  if (!oklchColorString) return null;
  const match = oklchColorString.match(
    /oklch\(([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)/
  );
  if (!match) return null;

  const oklch_L = parseFloat(match[1]);
  const oklch_C = parseFloat(match[2]);
  const oklch_H_degrees = parseFloat(match[3]);

  if (
    isNaN(oklch_L) ||
    isNaN(oklch_C) ||
    isNaN(oklch_H_degrees) ||
    oklch_L < 0 ||
    oklch_L > 1 ||
    oklch_C < 0
  ) {
    return null;
  }

  const oklch_H_radians = oklch_H_degrees * (Math.PI / 180);
  const oklab_L = oklch_L;
  const oklab_a = oklch_C * Math.cos(oklch_H_radians);
  const oklab_b = oklch_C * Math.sin(oklch_H_radians);

  const l_ = oklab_L + 0.3963377774 * oklab_a + 0.2158037573 * oklab_b;
  const m_ = oklab_L - 0.1055613458 * oklab_a - 0.0638541728 * oklab_b;
  const s_ = oklab_L - 0.0894841775 * oklab_a - 1.291485548 * oklab_b;

  const l_cubed = l_ * l_ * l_;
  const m_cubed = m_ * m_ * m_;
  const s_cubed = s_ * s_ * s_;

  const linearR =
    +4.0767416621 * l_cubed - 3.3077115913 * m_cubed + 0.2309699292 * s_cubed;
  const linearG =
    -1.2684380046 * l_cubed + 2.6097574011 * m_cubed - 0.3413193965 * s_cubed;
  const linearB =
    -0.0041960863 * l_cubed - 0.7034186147 * m_cubed + 1.707614701 * s_cubed;

  const sR = linearSRGBToSRGB(linearR);
  const sG = linearSRGBToSRGB(linearG);
  const sB = linearSRGBToSRGB(linearB);

  return calculateRelativeLuminance(sR, sG, sB);
}

interface ThemeConfig {
  hueShift: number;
  chroma: number;
  contrast: number;
  radius: number;
  originalL: { background: number; primary: number };
  originalHue: number;
  originalChroma: number;
}

interface ThemeModes {
  light: ThemeConfig;
  dark: ThemeConfig;
}

function getThemeFromCSS(isDark = false): ThemeConfig | null {
  if (typeof window === 'undefined') return null;
  const root = document.documentElement;

  const getOklchValues = (colorString: string) => {
    const match = colorString.match(/oklch\(([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)/);
    if (!match) return null;
    const l = parseFloat(match[1]);
    const c = parseFloat(match[2]);
    const h = parseFloat(match[3]);
    if (isNaN(l) || isNaN(c) || isNaN(h) || l < 0 || l > 1 || c < 0)
      return null;
    return { l, c, h };
  };

  const wasDark = root.classList.contains('dark');
  const currentDynamicStyles = new Map<string, string>();
  for (let i = 0; i < root.style.length; i++) {
    const propName = root.style[i];
    currentDynamicStyles.set(propName, root.style.getPropertyValue(propName));
  }
  currentDynamicStyles.forEach((_value, prop) =>
    root.style.removeProperty(prop)
  );

  if (isDark) root.classList.add('dark');
  else root.classList.remove('dark');

  const computedStyle = getComputedStyle(root);
  const primary = getOklchValues(
    computedStyle.getPropertyValue('--primary').trim()
  );
  const background = getOklchValues(
    computedStyle.getPropertyValue('--background').trim()
  );
  const radiusString = computedStyle.getPropertyValue('--radius').trim();
  const radius = parseFloat(radiusString);

  if (wasDark) root.classList.add('dark');
  else root.classList.remove('dark');
  currentDynamicStyles.forEach((value, prop) =>
    root.style.setProperty(prop, value)
  );

  if (!primary || !background || isNaN(radius)) return null;

  let derivedContrastSliderValue: number;
  const lightModeBgLMin = 0.92;
  const lightModeBgLMax = 1.0;
  const darkModeBgLMin = 0.02;
  const darkModeBgLMax = 0.15;
  const sliderMin = 0.5;
  const sliderMax = 0.95;
  const sliderRange = sliderMax - sliderMin;

  if (!isDark) {
    let normalizedContrastDerived =
      (background.l - lightModeBgLMin) / (lightModeBgLMax - lightModeBgLMin);
    normalizedContrastDerived = clamp(normalizedContrastDerived);
    derivedContrastSliderValue =
      normalizedContrastDerived * sliderRange + sliderMin;
  } else {
    let normalizedContrastDerived =
      (darkModeBgLMax - background.l) / (darkModeBgLMax - darkModeBgLMin);
    normalizedContrastDerived = clamp(normalizedContrastDerived);
    derivedContrastSliderValue =
      normalizedContrastDerived * sliderRange + sliderMin;
  }
  derivedContrastSliderValue = clamp(
    derivedContrastSliderValue,
    sliderMin,
    sliderMax
  );

  return {
    hueShift: 0,
    chroma: primary.c,
    contrast: derivedContrastSliderValue,
    radius,
    originalL: { background: background.l, primary: primary.l },
    originalHue: primary.h,
    originalChroma: primary.c,
  };
}

function getInitialThemes(): ThemeModes {
  const light = getThemeFromCSS(false);
  const dark = getThemeFromCSS(true);

  const fallbackLight: ThemeConfig = {
    hueShift: 0,
    chroma: 0.006,
    contrast: 0.95,
    radius: 0.75,
    originalL: { background: 1, primary: 0.21 },
    originalHue: 285.885,
    originalChroma: 0.006,
  };
  const fallbackDark: ThemeConfig = {
    hueShift: 0,
    chroma: 0.004,
    contrast: 0.531,
    radius: 0.75,
    originalL: { background: 0.141, primary: 0.92 },
    originalHue: 286.32,
    originalChroma: 0.004,
  };

  return {
    light: light || fallbackLight,
    dark: dark || fallbackDark,
  };
}

const toOklch = (l: number, c: number, h: number, a?: number): string =>
  `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${h.toFixed(3)}${a !== undefined && a < 1 ? ` / ${a.toFixed(2)}` : ''})`;

function generateThemeTokens(
  config: ThemeConfig,
  isDark: boolean
): Record<string, string> {
  const {
    hueShift,
    chroma: chromaSliderValue,
    contrast: contrastSliderValue,
    radius,
  } = config;

  const basePrimaryH = config.originalHue;
  // const basePrimaryC = config.originalChroma
  const basePrimaryL = config.originalL.primary;
  const baseBackgroundL = config.originalL.background;

  // Calculate effective hue shift
  const effectiveHue = (((basePrimaryH + hueShift) % 360) + 360) % 360;
  const finalPrimaryC = clamp(chromaSliderValue, 0.001, 0.1);

  const normalizedContrast = clamp((contrastSliderValue - 0.5) / (0.95 - 0.5));
  const lightModeBgLMin = 0.92;
  const lightModeBgLMax = 1.0;
  const darkModeBgLMin = 0.02;
  const darkModeBgLMax = 0.15;

  // Calculate background lightness
  let finalBackgroundL: number;
  if (!isDark) {
    finalBackgroundL =
      lightModeBgLMin +
      normalizedContrast * (lightModeBgLMax - lightModeBgLMin);
  } else {
    finalBackgroundL =
      darkModeBgLMax - normalizedContrast * (darkModeBgLMax - darkModeBgLMin);
  }
  finalBackgroundL = clamp(finalBackgroundL);

  // Calculate primary lightness - always preserve original lightness
  const finalPrimaryL = basePrimaryL;

  // Calculate foreground lightness
  let fgL: number;
  if (!isDark) {
    fgL = clamp(1.15 - finalBackgroundL, 0.05, 0.35);
  } else {
    fgL = clamp(0.95 + (finalBackgroundL - 0.15), 0.65, 0.98);
  }

  // Calculate primary foreground lightness
  const primaryFgL = clamp(finalPrimaryL > 0.55 ? 0.05 : 0.98, 0.02, 0.98);

  // Calculate accent hue
  const accentHue = (effectiveHue + 45) % 360;

  // Background tint should be minimal and proportional to chroma
  const backgroundChromaForTint = Math.min(0.015, finalPrimaryC * 0.1);

  const tokens: Record<string, string> = {
    radius: `${clamp(radius, 0, 2.5)}rem`,
    destructive: toOklch(clamp(isDark ? 0.62 : 0.57), 0.18, 25),
    background: toOklch(
      finalBackgroundL,
      backgroundChromaForTint,
      effectiveHue
    ),
    foreground: toOklch(
      fgL,
      Math.min(backgroundChromaForTint * 0.5, 0.005),
      effectiveHue
    ),
    primary: toOklch(finalPrimaryL, finalPrimaryC, effectiveHue),
    'primary-foreground': toOklch(
      primaryFgL,
      Math.min(finalPrimaryC * 0.2, 0.003),
      effectiveHue
    ),
    card: toOklch(
      clamp(
        isDark
          ? finalBackgroundL * 1.07
          : finalBackgroundL * (finalBackgroundL < 0.99 ? 1.005 : 1)
      ),
      backgroundChromaForTint,
      effectiveHue
    ),
    'card-foreground': toOklch(
      fgL,
      Math.min(backgroundChromaForTint * 0.4, 0.004),
      effectiveHue
    ),
    popover: toOklch(
      clamp(
        isDark
          ? finalBackgroundL * 1.1
          : finalBackgroundL * (finalBackgroundL < 0.99 ? 1.01 : 1)
      ),
      backgroundChromaForTint,
      effectiveHue
    ),
    'popover-foreground': toOklch(
      fgL,
      Math.min(backgroundChromaForTint * 0.3, 0.003),
      effectiveHue
    ),
    secondary: toOklch(
      clamp(isDark ? finalBackgroundL * 1.25 : baseBackgroundL * 0.94),
      Math.min(finalPrimaryC * 0.4, 0.05),
      accentHue
    ),
    'secondary-foreground': toOklch(
      clamp(
        isDark ? fgL * 0.9 : primaryFgL * (finalPrimaryL < 0.4 ? 0.6 : 1.3)
      ),
      Math.min(finalPrimaryC * 0.15, 0.02),
      accentHue
    ),
    muted: toOklch(
      clamp(isDark ? finalBackgroundL * 1.18 : baseBackgroundL * 0.96),
      Math.min(finalPrimaryC * 0.2, 0.03),
      effectiveHue
    ),
    'muted-foreground': toOklch(
      clamp(isDark ? fgL * 0.7 : fgL * 1.6, 0.25, 0.85),
      Math.min(finalPrimaryC * 0.25, 0.04),
      effectiveHue
    ),
    accent: toOklch(
      clamp(finalPrimaryL * (isDark ? 0.95 : 1.05), 0.15, 0.9),
      Math.min(finalPrimaryC * 0.6, 0.15),
      accentHue
    ),
    'accent-foreground': toOklch(
      primaryFgL,
      Math.min(finalPrimaryC * 0.2, 0.04),
      accentHue
    ),
    border: toOklch(
      clamp(isDark ? finalBackgroundL * 1.35 : baseBackgroundL * 0.88),
      Math.min(backgroundChromaForTint * 0.2, 0.002),
      effectiveHue,
      0.55
    ),
    input: toOklch(
      clamp(isDark ? finalBackgroundL * 1.25 : baseBackgroundL * 0.95),
      Math.min(backgroundChromaForTint * 0.15, 0.002),
      effectiveHue,
      isDark ? 0.35 : 0.65
    ),
    ring: toOklch(
      clamp(finalPrimaryL, 0.25, 0.85),
      Math.min(finalPrimaryC * 0.5, 0.1),
      effectiveHue,
      0.65
    ),
    'chart-1': toOklch(clamp(isDark ? 0.52 : 0.63, 0.2, 0.8), 0.21, 40),
    'chart-2': toOklch(clamp(isDark ? 0.62 : 0.48, 0.2, 0.8), 0.16, 180),
    'chart-3': toOklch(clamp(isDark ? 0.42 : 0.73, 0.2, 0.8), 0.12, 220),
    'chart-4': toOklch(clamp(isDark ? 0.72 : 0.38, 0.2, 0.8), 0.23, 80),
    'chart-5': toOklch(clamp(isDark ? 0.57 : 0.58, 0.2, 0.8), 0.19, 300),
  };
  return tokens;
}

function applyThemeTokens(tokens: Record<string, string>): void {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;
  Object.entries(tokens).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value);
  });
}

interface ContrastRatioResult {
  ratio: number;
  passAA: boolean;
  passAAA: boolean;
  error?: string;
}

function getContrastRatios(
  tokens: Record<string, string>
): Record<string, ContrastRatioResult> {
  const ratios: Record<string, ContrastRatioResult> = {};
  const backgroundLum = getColorLuminance(tokens['background']);

  if (backgroundLum === null) {
    return {
      Error: {
        ratio: 1,
        passAA: false,
        passAAA: false,
        error: 'Background luminance could not be calculated.',
      },
    };
  }

  const contrastPairs: Record<string, string | undefined> = {
    'Text / BG': tokens['foreground'],
    'Primary / BG': tokens['primary'],
    'Muted Text / BG': tokens['muted-foreground'],
  };

  for (const [label, fgColorString] of Object.entries(contrastPairs)) {
    if (!fgColorString) {
      ratios[label] = {
        ratio: 1,
        passAA: false,
        passAAA: false,
        error: `Color value for ${label} is undefined.`,
      };
      continue;
    }
    const fgLum = getColorLuminance(fgColorString);
    if (fgLum !== null) {
      const ratio = calculateContrastRatio(backgroundLum, fgLum);
      ratios[label] = { ratio, passAA: ratio >= 4.5, passAAA: ratio >= 7 };
    } else {
      ratios[label] = {
        ratio: 1,
        passAA: false,
        passAAA: false,
        error: `Luminance for ${label} could not be calculated.`,
      };
    }
  }

  const primaryLum = getColorLuminance(tokens['primary']);
  const primaryFgLum = getColorLuminance(tokens['primary-foreground']);

  if (primaryLum !== null && primaryFgLum !== null) {
    const ratio = calculateContrastRatio(primaryLum, primaryFgLum);
    ratios['Primary Text / Primary BG'] = {
      ratio,
      passAA: ratio >= 4.5,
      passAAA: ratio >= 7,
    };
  } else {
    ratios['Primary Text / Primary BG'] = {
      ratio: 1,
      passAA: false,
      passAAA: false,
      error:
        "Luminance for 'Primary Text / Primary BG' pair could not be calculated.",
    };
  }
  return ratios;
}

function compareThemeValues(
  current: ThemeConfig,
  original: ThemeConfig
): Array<keyof ThemeConfig> {
  const changes: Array<keyof ThemeConfig> = [];
  const threshold = 0.001;
  if (Math.abs(current.hueShift - original.hueShift) > threshold)
    changes.push('hueShift');
  if (Math.abs(current.chroma - original.chroma) > threshold)
    changes.push('chroma');
  if (Math.abs(current.contrast - original.contrast) > threshold)
    changes.push('contrast');
  if (Math.abs(current.radius - original.radius) > threshold)
    changes.push('radius');
  return changes;
}

export default function ThemeCustomizerButton() {
  const [originalThemes, setOriginalThemes] = useState<ThemeModes | null>(null);
  const [configs, setConfigs] = useState<ThemeModes | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [cssChanged, setCssChanged] = useState(false);
  const [changedProperties, setChangedProperties] = useState<{
    light: string[];
    dark: string[];
  }>({ light: [], dark: [] });
  const [currentContrastRatios, setCurrentContrastRatios] = useState<
    ReturnType<typeof getContrastRatios>
  >({});
  const [activeMode, setActiveMode] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const currentOsMode = document.documentElement.classList.contains('dark')
      ? 'dark'
      : 'light';
    // Use setTimeout to avoid synchronous setState in effect
    setTimeout(() => {
      setActiveMode(currentOsMode);
    }, 0);

    const loadedOriginalThemes = getInitialThemes();
    // Use setTimeout to avoid synchronous setState in effect
    setTimeout(() => {
      setOriginalThemes(loadedOriginalThemes);
    }, 0);

    const storedOriginalRaw = localStorage.getItem(
      'original-theme-modes-snapshot'
    );
    if (storedOriginalRaw) {
      try {
        const parsedStoredOriginal = JSON.parse(
          storedOriginalRaw
        ) as ThemeModes;
        if (parsedStoredOriginal.light && parsedStoredOriginal.dark) {
          const lightCssChanges = compareThemeValues(
            loadedOriginalThemes.light,
            parsedStoredOriginal.light
          );
          const darkCssChanges = compareThemeValues(
            loadedOriginalThemes.dark,
            parsedStoredOriginal.dark
          );
          const hasChanges =
            lightCssChanges.length > 0 || darkCssChanges.length > 0;
          // Use setTimeout to avoid synchronous setState in effect
          setTimeout(() => {
            setCssChanged(hasChanges);
          }, 0);
          if (hasChanges) {
            setTimeout(() => {
              setChangedProperties({
                light: lightCssChanges.map(String),
                dark: darkCssChanges.map(String),
              });
            }, 0);
            localStorage.setItem(
              'original-theme-modes-snapshot',
              JSON.stringify(loadedOriginalThemes)
            );
          }
        } else {
          localStorage.setItem(
            'original-theme-modes-snapshot',
            JSON.stringify(loadedOriginalThemes)
          );
        }
      } catch (e) {
        console.error('Error parsing original theme modes snapshot:', e);
        localStorage.setItem(
          'original-theme-modes-snapshot',
          JSON.stringify(loadedOriginalThemes)
        );
      }
    } else {
      localStorage.setItem(
        'original-theme-modes-snapshot',
        JSON.stringify(loadedOriginalThemes)
      );
    }

    const userStoredConfigsRaw = localStorage.getItem('user-theme-modes');
    if (userStoredConfigsRaw) {
      try {
        const parsedUserConfigs = JSON.parse(
          userStoredConfigsRaw
        ) as ThemeModes;
        if (parsedUserConfigs.light && parsedUserConfigs.dark) {
          // Use setTimeout to avoid synchronous setState in effect
          setTimeout(() => {
            setConfigs(parsedUserConfigs);
          }, 0);
        } else {
          setTimeout(() => {
            setConfigs(loadedOriginalThemes);
          }, 0);
        }
      } catch (e) {
        console.error('Error parsing user theme modes:', e);
        setTimeout(() => {
          setConfigs(loadedOriginalThemes);
        }, 0);
      }
    } else {
      setTimeout(() => {
        setConfigs(loadedOriginalThemes);
      }, 0);
    }
    // Use setTimeout to avoid synchronous setState in effect
    setTimeout(() => {
      setIsMounted(true);
    }, 0);
  }, []);

  useEffect(() => {
    if (!configs || !isMounted || !activeMode) return;
    const activeConfig = configs[activeMode];
    if (!activeConfig) return;

    const tokens = generateThemeTokens(activeConfig, activeMode === 'dark');
    applyThemeTokens(tokens);
    // Use setTimeout to avoid synchronous setState in effect
    setTimeout(() => {
      setCurrentContrastRatios(getContrastRatios(tokens));
    }, 0);
    localStorage.setItem('user-theme-modes', JSON.stringify(configs));
  }, [configs, activeMode, isMounted]);

  useEffect(() => {
    if (!isMounted) return;
    const handleThemeChange = (event: Event) => {
      const newMode = (event as CustomEvent).detail.theme as 'light' | 'dark';
      if (newMode && (newMode === 'light' || newMode === 'dark')) {
        setActiveMode(newMode);
      }
    };
    window.addEventListener('themeChange', handleThemeChange);
    return () => window.removeEventListener('themeChange', handleThemeChange);
  }, [isMounted]);

  const updateConfig = useCallback(
    (key: keyof ThemeConfig, value: number) => {
      setConfigs((prev) => {
        if (!prev || !prev[activeMode]) return prev;
        const newCurrentModeConfig = { ...prev[activeMode], [key]: value };
        return { ...prev, [activeMode]: newCurrentModeConfig };
      });
    },
    [activeMode]
  );

  const resetCurrentMode = useCallback(() => {
    if (!originalThemes || !originalThemes[activeMode]) return;
    setConfigs((prev) => {
      if (!prev) return null;
      const newConfigs = {
        ...prev,
        [activeMode]: { ...originalThemes[activeMode] },
      };
      localStorage.setItem('user-theme-modes', JSON.stringify(newConfigs));
      if (cssChanged) {
        localStorage.setItem(
          'original-theme-modes-snapshot',
          JSON.stringify(originalThemes)
        );
        setCssChanged(false);
        setChangedProperties({ light: [], dark: [] });
      }
      return newConfigs;
    });
  }, [activeMode, originalThemes, cssChanged]);

  if (!isMounted || !configs || !originalThemes) {
    return (
      <span className='bg-muted ml-2 h-8 w-8 animate-pulse rounded-md border p-1 shadow' />
    );
  }

  const currentActiveConfig = configs[activeMode];
  if (!currentActiveConfig) {
    return (
      <span className='bg-muted ml-2 h-8 w-8 animate-pulse rounded-md border p-1 shadow' />
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          aria-label='Open theme settings'
          className='bg-background/80 hover:bg-muted relative ml-2 inline-flex h-8 w-8 items-center justify-center rounded-md border p-1'
        >
          <Settings2 className='h-4 w-4' />
          {cssChanged && (
            <span
              title='Global CSS file has changed since last customization. Consider resetting.'
              className='bg-primary ring-background absolute -top-1 -right-1 block h-2.5 w-2.5 rounded-full ring-2'
            />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className='bg-background/80 dark:bg-background/60 mr-2 w-[320px] text-xs backdrop-blur-sm'>
        <div className='space-y-3'>
          {cssChanged && (
            <div className='bg-muted/70 text-muted-foreground rounded-md p-2.5 text-xs shadow-sm'>
              <p className='text-primary mb-1 font-semibold'>
                Global CSS Has Changed
              </p>
              {changedProperties.light.length > 0 ||
              changedProperties.dark.length > 0 ? (
                <>
                  {changedProperties.light.length > 0 && (
                    <p>
                      Light mode changes: {changedProperties.light.join(', ')}
                    </p>
                  )}
                  {changedProperties.dark.length > 0 && (
                    <p>
                      Dark mode changes: {changedProperties.dark.join(', ')}
                    </p>
                  )}
                  <p className='mt-1 text-xs'>
                    Consider resetting this mode if customizations look off.
                  </p>
                </>
              ) : (
                <p>
                  CSS values differ from the stored base. You might want to
                  reset to re-baseline.
                </p>
              )}
            </div>
          )}
          <div className='flex items-center justify-between'>
            <h2 className='text-foreground text-sm font-medium capitalize'>
              {activeMode} Theme Settings
            </h2>
            <button
              onClick={resetCurrentMode}
              className='bg-card text-muted-foreground hover:bg-muted hover:text-foreground inline-flex h-7 w-7 items-center justify-center rounded-md border p-1 shadow-sm'
              title={`Reset ${activeMode} theme to current global CSS values`}
            >
              <RotateCcw className='h-3.5 w-3.5' />
            </button>
          </div>

          <div className='grid space-y-1.5'>
            <label htmlFor='hueShiftSlider' className='text-foreground/90'>
              Hue:{' '}
              {currentActiveConfig.hueShift < 0
                ? currentActiveConfig.hueShift + 360
                : currentActiveConfig.hueShift}
              °
            </label>
            <Slider
              id='hueShiftSlider'
              min={0}
              max={359}
              step={1}
              value={[
                currentActiveConfig.hueShift < 0
                  ? currentActiveConfig.hueShift + 360
                  : currentActiveConfig.hueShift,
              ]}
              onValueChange={([v]) => {
                // Convert 0-359 range to effective hue shift (-180 to 179)
                const effectiveShift = v > 179 ? v - 360 : v;
                updateConfig('hueShift', effectiveShift);
              }}
            />
          </div>
          <div className='grid space-y-1.5'>
            <label htmlFor='chromaSlider' className='text-foreground/90'>
              Chroma: {currentActiveConfig.chroma?.toFixed(3)}
            </label>
            <Slider
              id='chromaSlider'
              min={0.001}
              max={0.1}
              step={0.001}
              value={[currentActiveConfig.chroma]}
              onValueChange={([v]) => updateConfig('chroma', v)}
            />
          </div>
          <div className='grid space-y-1.5'>
            <label htmlFor='contrastSlider' className='text-foreground/90'>
              BG Lightness Factor: {currentActiveConfig.contrast?.toFixed(3)}
            </label>
            <Slider
              id='contrastSlider'
              min={0.5}
              max={0.95}
              step={0.01}
              value={[currentActiveConfig.contrast]}
              onValueChange={([v]) => updateConfig('contrast', v)}
            />
          </div>
          <div className='grid space-y-1.5'>
            <label htmlFor='radiusSlider' className='text-foreground/90'>
              Radius: {currentActiveConfig.radius?.toFixed(2)}rem
            </label>
            <Slider
              id='radiusSlider'
              min={0}
              max={2}
              step={0.05}
              value={[currentActiveConfig.radius]}
              onValueChange={([v]) => updateConfig('radius', v)}
            />
          </div>

          <div className='border-border/70 mt-4 space-y-2 border-t pt-3'>
            <h3 className='text-foreground text-sm font-semibold'>
              Accessibility Contrast
            </h3>
            <div className='grid gap-1 text-xs'>
              {Object.entries(currentContrastRatios).map(([label, data]) => {
                if (data.error) {
                  return (
                    <div
                      key={label}
                      className='flex items-center justify-between rounded-sm px-1.5 py-1'
                    >
                      {' '}
                      <span className='text-foreground opacity-90'>
                        {label}:
                      </span>{' '}
                      <span className='font-medium text-red-600 dark:text-red-400'>
                        Error
                      </span>{' '}
                    </div>
                  );
                }
                let sampleStyle = {};
                if (label === 'Text / BG')
                  sampleStyle = {
                    color: 'var(--foreground)',
                    background: 'var(--background)',
                  };
                else if (label === 'Primary / BG')
                  sampleStyle = {
                    color: 'var(--primary)',
                    background: 'var(--background)',
                  };
                else if (label === 'Muted Text / BG')
                  sampleStyle = {
                    color: 'var(--muted-foreground)',
                    background: 'var(--background)',
                  };
                else if (label === 'Primary Text / Primary BG')
                  sampleStyle = {
                    color: 'var(--primary-foreground)',
                    background: 'var(--primary)',
                  };

                return (
                  <div
                    key={label}
                    className='flex items-center justify-between rounded-sm px-1.5 py-0.5'
                  >
                    <span className='rounded px-2 py-0.5' style={sampleStyle}>
                      {' '}
                      {label}{' '}
                    </span>
                    <span
                      className={`flex items-center font-medium ${data.passAAA ? 'text-green-600 dark:text-green-400' : data.passAA ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}
                    >
                      {data.ratio.toFixed(2)}
                      {data.passAAA ? (
                        <CheckCircle className='ml-1 inline h-3.5 w-3.5' />
                      ) : data.passAA ? (
                        <CheckCircle className='ml-1 inline h-3.5 w-3.5 opacity-70' />
                      ) : (
                        <AlertTriangle className='ml-1 inline h-3.5 w-3.5' />
                      )}
                    </span>
                  </div>
                );
              })}
              {Object.keys(currentContrastRatios).length === 0 && (
                <p className='text-muted-foreground'>Calculating ratios...</p>
              )}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
