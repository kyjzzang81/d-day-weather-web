import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

interface City {
  id: string;
  name: string;
  nameKo: string;
  country: string;
}

const cityNameMap: Record<string, string> = {
  seoul: '서울',
  busan: '부산',
  incheon: '인천',
  daegu: '대구',
  daejeon: '대전',
  gwangju: '광주',
  ulsan: '울산',
  sejong: '세종',
  suwon: '수원',
  goyang: '고양',
  yongin: '용인',
  changwon: '창원',
  seongnam: '성남',
  cheongju: '청주',
  jeonju: '전주',
  pohang: '포항',
  jinju: '진주',
  yeosu: '여수',
  suncheon: '순천',
  jeju: '제주',
  seogwipo: '서귀포',
  chuncheon: '춘천',
  gangneung: '강릉',
  sokcho: '속초',
  wonju: '원주',
  tokyo: '도쿄',
  osaka: '오사카',
  kyoto: '교토',
  fukuoka: '후쿠오카',
  sapporo: '삿포로',
  beijing: '베이징',
  shanghai: '상하이',
  'hong-kong': '홍콩',
  taipei: '타이페이',
  bangkok: '방콕',
  singapore: '싱가포르',
  'kuala-lumpur': '쿠알라룸푸르',
  hanoi: '하노이',
  'ho-chi-minh': '호치민',
  bali: '발리',
  phuket: '푸켓',
  cebu: '세부',
  manila: '마닐라',
  paris: '파리',
  london: '런던',
  rome: '로마',
  barcelona: '바르셀로나',
  'new-york': '뉴욕',
  'los-angeles': '로스앤젤레스',
  'san-francisco': '샌프란시스코',
  honolulu: '호놀룰루',
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const datasDir = join(process.cwd(), 'datas');
    const files = await readdir(datasDir);
    const jsonFiles = files.filter((file) => file.endsWith('.json'));
    
    const cities: City[] = [];
    
    for (const file of jsonFiles) {
      const cityId = file.replace('.json', '');
      
      try {
        const filePath = join(datasDir, file);
        const content = await readFile(filePath, 'utf-8');
        const data = JSON.parse(content);
        const nameKo = cityNameMap[cityId] || data.city;
        
        cities.push({
          id: cityId,
          name: data.city,
          nameKo,
          country: data.country,
        });
      } catch (error) {
        console.error(`Failed to load city: ${cityId}`, error);
      }
    }
    
    res.status(200).json({ cities });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
