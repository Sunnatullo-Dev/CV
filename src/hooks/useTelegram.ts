import { useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';
import axios from 'axios';

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

export function useTelegram() {
  const [user, setUser] = useState<TelegramUser | null>(null);

  useEffect(() => {
    // Initialize WebApp
    WebApp.ready();
    WebApp.expand();
    
    if (WebApp.initDataUnsafe?.user) {
      setUser(WebApp.initDataUnsafe.user as TelegramUser);
      
      // Backend verification
      if (WebApp.initData) {
        axios.post('/api/auth/verify', { initData: WebApp.initData })
          .then(res => {
            if (!res.data.success) console.error('Telegram auth verification failed');
            else console.log('Telegram auth verified');
          })
          .catch(err => console.error('Auth verification error:', err));
      }
    }

    // Apply colors from Telegram
    if (WebApp.themeParams) {
      const {
        bg_color,
        text_color,
        hint_color,
        link_color,
        button_color,
        button_text_color,
      } = WebApp.themeParams;

      if (bg_color) document.documentElement.style.setProperty('--tg-theme-bg-color', bg_color);
      if (text_color) document.documentElement.style.setProperty('--tg-theme-text-color', text_color);
      if (hint_color) document.documentElement.style.setProperty('--tg-theme-hint-color', hint_color);
      if (link_color) document.documentElement.style.setProperty('--tg-theme-link-color', link_color);
      if (button_color) document.documentElement.style.setProperty('--tg-theme-button-color', button_color);
      if (button_text_color) document.documentElement.style.setProperty('--tg-theme-button-text-color', button_text_color);
    }
  }, []);

  const onClose = () => {
    WebApp.close();
  };

  const onToggleButton = () => {
    if (WebApp.MainButton.isVisible) {
      WebApp.MainButton.hide();
    } else {
      WebApp.MainButton.show();
    }
  };

  return {
    onClose,
    onToggleButton,
    tg: WebApp,
    user,
    queryId: WebApp.initDataUnsafe?.query_id,
  };
}
