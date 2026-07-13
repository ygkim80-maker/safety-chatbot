// Vercel Serverless Function
// API 키는 여기(서버)에서만 process.env.GEMINI_API_KEY로 읽습니다.
// 브라우저(index.html)에는 절대 키가 내려가지 않습니다.

const SYSTEM_PROMPT = `당신은 산업안전보건 전문 AI 상담사입니다.

전문 분야:
- 산업안전보건법 및 관련 법령 해석
- 위험성 평가 방법 및 절차
- 사고 유형별 원인 분석 및 대응 방법
- 안전관리 체계 구축 및 운영
- 산업안전기사/산업기사 시험 관련 정보
- 작업환경 개선 및 안전 교육

답변 원칙:
1. 정확하고 실용적인 정보를 제공합니다
2. 법령 기준은 최신 산업안전보건법 기준으로 안내합니다
3. 필요시 관련 법조항을 인용합니다
4. 위험 상황은 신속하고 명확하게 안내합니다
5. 친절하고 이해하기 쉬운 언어로 설명합니다

중요: 실제 긴급 상황에서는 반드시 전문가(안전관리자, 119 등)에게 즉시 연락하도록 안내하세요.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY가 서버에 설정되지 않았습니다. Vercel 프로젝트 Settings > Environment Variables 확인 필요.' });
  }

  const { contents } = req.body || {};
  if (!contents) {
    return res.status(400).json({ error: 'contents가 필요합니다.' });
  }

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents,
          generationConfig: { maxOutputTokens: 1500, temperature: 0.7 }
        })
      }
    );

    const data = await geminiRes.json();

    if (!geminiRes.ok) {
      // Gemini가 429(레이트리밋) 등을 반환하면 그대로 상태코드 전달 → 프론트가 재시도 로직 수행
      return res.status(geminiRes.status).json(data);
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message || '서버 오류가 발생했습니다.' });
  }
}
