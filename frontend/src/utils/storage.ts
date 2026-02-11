import Cookies from 'js-cookie';
import { SearchHistory } from '../types/weather';

const COOKIE_NAME = 'weather-history';
const COOKIE_EXPIRES = 30; // 30일

export const saveSearchHistory = (city: string, date: string): void => {
  const history: SearchHistory = {
    city,
    date,
    timestamp: Date.now(),
  };
  
  Cookies.set(COOKIE_NAME, JSON.stringify(history), { expires: COOKIE_EXPIRES });
};

export const getSearchHistory = (): SearchHistory | null => {
  const historyStr = Cookies.get(COOKIE_NAME);
  
  if (!historyStr) {
    return null;
  }
  
  try {
    return JSON.parse(historyStr) as SearchHistory;
  } catch (error) {
    console.error('Failed to parse search history:', error);
    return null;
  }
};

export const clearSearchHistory = (): void => {
  Cookies.remove(COOKIE_NAME);
};
