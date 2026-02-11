import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, message } = req.body;
    
    if (!email || !message) {
      return res.status(400).json({
        error: 'Missing required fields: email, message',
      });
    }
    
    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email format',
      });
    }
    
    // 실제로는 DB에 저장하거나 이메일 전송
    console.log('Contact received:', { email, message });
    
    res.status(200).json({
      success: true,
      message: '문의가 접수되었습니다.',
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
