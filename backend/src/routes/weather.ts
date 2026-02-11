import { Router, Request, Response } from 'express';
import { getWeatherStatistics, getCities } from '../services/weatherService.js';

const router = Router();

/**
 * GET /api/weather/statistics
 * 특정 날짜의 10년간 날씨 통계를 조회합니다.
 */
router.get('/statistics', async (req: Request, res: Response) => {
  try {
    const { city, month, day } = req.query;
    
    // 파라미터 검증
    if (!city || !month || !day) {
      return res.status(400).json({
        error: 'Missing required parameters: city, month, day',
      });
    }
    
    const monthNum = parseInt(month as string, 10);
    const dayNum = parseInt(day as string, 10);
    
    if (isNaN(monthNum) || isNaN(dayNum)) {
      return res.status(400).json({
        error: 'Invalid month or day format',
      });
    }
    
    if (monthNum < 1 || monthNum > 12) {
      return res.status(400).json({
        error: 'Month must be between 1 and 12',
      });
    }
    
    if (dayNum < 1 || dayNum > 31) {
      return res.status(400).json({
        error: 'Day must be between 1 and 31',
      });
    }
    
    // 날씨 통계 조회
    const statistics = await getWeatherStatistics(
      city as string,
      monthNum,
      dayNum
    );
    
    res.json(statistics);
  } catch (error) {
    console.error('Error fetching weather statistics:', error);
    
    if ((error as Error).message.includes('City not found')) {
      return res.status(404).json({
        error: 'City not found',
      });
    }
    
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/weather/cities
 * 사용 가능한 도시 목록을 조회합니다.
 */
router.get('/cities', async (req: Request, res: Response) => {
  try {
    const cities = await getCities();
    res.json({ cities });
  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

export default router;
