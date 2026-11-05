import { useEffect } from 'react';
import { useSettings } from './sound';

export function useTheme(): void {
  const [settings] = useSettings();
  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
  }, [settings.theme]);
}
