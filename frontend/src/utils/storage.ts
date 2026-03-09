import Cookies from "js-cookie";
import { SearchHistory } from "../types/weather";

const COOKIE_NAME = "weather-history-list";
const COOKIE_EXPIRES = 30; // 30일
const MAX_HISTORY = 10;

export const getSearchHistoryList = (): SearchHistory[] => {
  const str = Cookies.get(COOKIE_NAME);
  if (!str) return [];
  try {
    const parsed = JSON.parse(str);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const addSearchHistory = (
  city: string,
  date: string,
  cityNameKo?: string
): void => {
  const list = getSearchHistoryList();
  const newItem: SearchHistory = {
    city,
    date,
    timestamp: Date.now(),
    cityNameKo,
  };
  const filtered = list.filter(
    (h) => !(h.city === city && h.date === date)
  );
  const updated = [newItem, ...filtered].slice(0, MAX_HISTORY);
  Cookies.set(COOKIE_NAME, JSON.stringify(updated), {
    expires: COOKIE_EXPIRES,
  });
};

export const removeSearchHistoryItem = (city: string, date: string): void => {
  const list = getSearchHistoryList().filter(
    (h) => !(h.city === city && h.date === date)
  );
  if (list.length === 0) {
    Cookies.remove(COOKIE_NAME);
  } else {
    Cookies.set(COOKIE_NAME, JSON.stringify(list), {
      expires: COOKIE_EXPIRES,
    });
  }
};

export const clearSearchHistory = (): void => {
  Cookies.remove(COOKIE_NAME);
};

// 하위 호환용 (기존 단일 저장 방식 → 리스트에 추가)
export const saveSearchHistory = (
  city: string,
  date: string,
  cityNameKo?: string
): void => {
  addSearchHistory(city, date, cityNameKo);
};

export const getSearchHistory = (): SearchHistory | null => {
  const list = getSearchHistoryList();
  return list.length > 0 ? list[0] : null;
};

// ─── Today 날씨 캐시 ─────────────────────────────────────────────────────────

import { TodayWeatherData } from './weatherApi';

const TODAY_CACHE_KEY = 'today_weather_cache';
const CACHE_TTL_MS = 3_600_000; // 1시간

interface TodayCache {
  city_id: string;
  fetchedAt: number;
  data: TodayWeatherData;
}

export function getTodayCache(city_id: string): TodayWeatherData | null {
  try {
    const raw = localStorage.getItem(TODAY_CACHE_KEY);
    if (!raw) return null;
    const cache: TodayCache = JSON.parse(raw);
    if (cache.city_id !== city_id) return null;
    if (Date.now() - cache.fetchedAt > CACHE_TTL_MS) return null;
    return cache.data;
  } catch {
    return null;
  }
}

export function setTodayCache(city_id: string, data: TodayWeatherData): void {
  try {
    const cache: TodayCache = { city_id, fetchedAt: Date.now(), data };
    localStorage.setItem(TODAY_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // localStorage 실패 시 무시
  }
}
