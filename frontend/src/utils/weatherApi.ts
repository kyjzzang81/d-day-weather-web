import { WeatherStatistics, City } from '../types/weather';

const API_BASE_URL = '/api';

export const fetchWeatherStatistics = async (
  city: string,
  month: number,
  day: number
): Promise<WeatherStatistics> => {
  const response = await fetch(
    `${API_BASE_URL}/weather/statistics?city=${city}&month=${month}&day=${day}`
  );
  
  if (!response.ok) {
    throw new Error(`Failed to fetch weather statistics: ${response.statusText}`);
  }
  
  return response.json();
};

export const fetchCities = async (): Promise<City[]> => {
  const response = await fetch(`${API_BASE_URL}/weather/cities`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch cities: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.cities;
};

export const submitContact = async (email: string, message: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/contact`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, message }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to submit contact: ${response.statusText}`);
  }
};
