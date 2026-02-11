import { Router, Request, Response } from 'express';

const router = Router();

/**
 * POST /api/contact
 * 문의를 접수합니다.
 */
router.post('/', (req: Request, res: Response) => {
  try {
    const { email, message } = req.body;
    
    // 파라미터 검증
    if (!email || !message) {
      return res.status(400).json({
        error: 'Missing required fields: email, message',
      });
    }
    
    // 이메일 형식 검증 (간단한 regex)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email format',
      });
    }
    
    // 실제로는 DB에 저장하거나 이메일 전송 로직이 들어갑니다.
    console.log('Contact received:', { email, message });
    
    res.json({
      success: true,
      message: '문의가 접수되었습니다.',
    });
  } catch (error) {
    console.error('Error processing contact:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

export default router;
