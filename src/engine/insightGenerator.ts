// skills/insight-generation.md 를 시스템 프롬프트로 주입하는 인사이트 생성기
import type { InsightRequest, DataType } from '../types/financial'
import { sharpeGrade, formatReturn } from './financialEngine'

// ─── 규칙 기반 폴백 인사이트 (API 없을 때) ──────────────────────────────────

function rsiInterpretation(rsi: number): string {
  if (rsi > 80) return `RSI(${rsi.toFixed(1)}) — 심한 과매수 구간(>80)입니다. 이 수준의 RSI는 단기 급등 이후 나타나는 경우가 많으며, 차익 실현 매물이 증가해 조정 가능성이 높습니다. 신규 매수보다는 보유 비중 점검 및 손익 관리를 권장합니다.`
  if (rsi > 70) return `RSI(${rsi.toFixed(1)}) — 과매수 구간(>70)에 진입했습니다. 상승 모멘텀이 강하지만 단기 과열 신호로 해석될 수 있어, 추가 상승 여력이 제한될 수 있습니다. 볼린저 밴드 상단·거래량과 함께 확인해 과열 여부를 판단하세요.`
  if (rsi < 20) return `RSI(${rsi.toFixed(1)}) — 극심한 과매도 구간(<20)입니다. 급격한 매도세로 기술적 반등 가능성이 높으나, 펀더멘털 악화 여부를 먼저 확인해야 합니다. 분할 매수 전략으로 접근하되 추세 전환 확인 후 진입을 고려하세요.`
  if (rsi < 30) return `RSI(${rsi.toFixed(1)}) — 과매도 구간(<30)에 위치합니다. 과도한 하락으로 기술적 반등 가능성이 있으나, 하락 추세가 지속될 수도 있으므로 반등 확인 후 대응이 안전합니다. 거래량 증가 동반 시 반등 신뢰도가 높아집니다.`
  if (rsi > 55) return `RSI(${rsi.toFixed(1)}) — 중립 상단 구간으로 완만한 상승 모멘텀이 유지되고 있습니다. 과매수는 아니지만 추세 지속 여부를 MA 방향성과 함께 확인하는 것이 좋습니다.`
  if (rsi < 45) return `RSI(${rsi.toFixed(1)}) — 중립 하단 구간으로 약한 하락 압력이 존재합니다. 뚜렷한 방향성이 없는 구간으로, 다른 기술 지표와 병행하여 분석해야 합니다.`
  return `RSI(${rsi.toFixed(1)}) — 중립 구간(45~55)으로 방향성이 중립입니다. 과매수·과매도 신호가 없어 추세 판단이 어렵습니다. 가격 움직임과 거래량 변화를 함께 주시하세요.`
}

function volatilityGrade(vol: number): string {
  if (vol < 10) return '저변동성'
  if (vol < 20) return '중간 변동성'
  if (vol < 30) return '고변동성'
  return '매우 고변동성'
}

function mddGrade(mdd: number): string {
  const abs = Math.abs(mdd)
  if (abs < 10) return '낮은 낙폭'
  if (abs < 20) return '보통 낙폭'
  if (abs < 40) return '높은 낙폭'
  return '매우 높은 낙폭 — 리스크 재검토 필요'
}

// Golden Cross / Death Cross 포함 MA 신호
function maSignal(ma20: number | null, ma50: number | null): string | null {
  if (!ma20 || !ma50) return null
  const gap = ((ma20 - ma50) / ma50 * 100).toFixed(2)
  if (ma20 > ma50) {
    return `MA20(${ma20.toFixed(0)})이 MA50(${ma50.toFixed(0)}) 위에 위치하는 골든크로스 구도입니다(괴리율 +${gap}%). 단기 이동평균이 중기 이동평균을 상회할 때는 상승 추세가 확인된 것으로, 추세 추종 관점에서 긍정적 신호입니다. 단, 괴리가 지나치게 벌어진 경우 단기 되돌림이 발생할 수 있으므로 조정 시 분할 매수 전략이 유효합니다.`
  }
  return `MA20(${ma20.toFixed(0)})이 MA50(${ma50.toFixed(0)}) 아래에 위치하는 데드크로스 구도입니다(괴리율 ${gap}%). 단기 이동평균이 중기 이동평균을 하향 이탈한 상태로, 단기 약세 압력이 존재하며 추세 전환 여부를 확인해야 합니다. MA20이 MA50을 재상향 돌파할 때까지 보수적인 접근을 권장합니다.`
}

// 볼린저 밴드 위치 신호
function bollingerSignal(
  close: number | null,
  upper: number | null,
  lower: number | null,
  middle: number | null,
): string | null {
  if (!close || !upper || !lower || !middle) return null
  const bandwidth = (upper - lower) / middle
  const pct = (close - lower) / (upper - lower) // 0~1

  if (bandwidth < 0.04) {
    return `볼린저 밴드폭이 ${(bandwidth * 100).toFixed(1)}%로 극도로 좁아진 스퀴즈 상태입니다. 변동성 압축 이후에는 통상 강한 방향성 돌파가 발생하며, 상방 또는 하방 중 어느 방향이든 큰 움직임이 예상됩니다. 거래량 급증과 함께 상단/하단 이탈 방향을 확인하세요.`
  }
  if (bandwidth < 0.06) {
    return `볼린저 밴드폭이 ${(bandwidth * 100).toFixed(1)}%로 좁아졌습니다(밴드 스퀴즈 진행 중). 변동성이 낮아진 구간으로, 조만간 방향성 확대가 나타날 가능성이 있습니다. 돌파 방향과 거래량을 함께 모니터링하는 것이 중요합니다.`
  }
  if (pct > 0.95) {
    return `현재가(${close.toLocaleString()})가 볼린저 상단밴드(${upper.toFixed(0)}) 바로 위까지 올라왔습니다. 통계적으로 가격의 95%는 밴드 내에 위치하므로, 이 수준은 강한 단기 과열 신호입니다. RSI 지표와 함께 확인하여 추가 상승 혹은 되돌림 여부를 판단하세요.`
  }
  if (pct > 0.9) {
    return `현재가(${close.toLocaleString()})가 볼린저 상단밴드(${upper.toFixed(0)}) 근처에 위치합니다. 상단 밴드 근접은 단기 과열의 신호일 수 있으며, 모멘텀이 강한 경우 추가 상승도 가능합니다. 거래량과 RSI를 함께 확인하여 과열 여부를 판단하세요.`
  }
  if (pct < 0.05) {
    return `현재가(${close.toLocaleString()})가 볼린저 하단밴드(${lower.toFixed(0)}) 아래까지 내려왔습니다. 통계적으로 드문 수준의 하락으로, 강한 하방 압력이 있거나 과매도 상태일 수 있습니다. 지지선 역할 여부를 확인하고 하락 지속 시 손절 수준을 미리 설정해두세요.`
  }
  if (pct < 0.1) {
    return `현재가(${close.toLocaleString()})가 볼린저 하단밴드(${lower.toFixed(0)}) 근처에 위치합니다. 하단 밴드는 통상 기술적 지지선 역할을 하며, 이 부근에서의 반등을 노리는 매수세가 유입될 수 있습니다. 단, 하단 밴드 하향 이탈 시 추세 전환 신호로 해석해야 합니다.`
  }
  return null
}

// 거래량 신호 (최근 거래량 vs 20일 평균)
function volumeSignal(volumes: number[] | undefined): string | null {
  if (!volumes || volumes.length < 21) return null
  const recent = volumes[volumes.length - 1]
  const avg20 = volumes.slice(-21, -1).reduce((a, b) => a + b, 0) / 20
  if (avg20 === 0) return null
  const ratio = recent / avg20
  const recentStr = recent > 100000000 ? `${(recent / 100000000).toFixed(1)}억` : `${(recent / 10000).toFixed(0)}만`
  if (ratio > 2.0) {
    return `최근 거래량(${recentStr})이 20일 평균 대비 ${((ratio - 1) * 100).toFixed(0)}% 폭증했습니다. 이는 강한 매수세 또는 매도세의 유입을 의미하며, 주요 이벤트나 세력의 개입 가능성도 있습니다. 가격 상승 동반 시 추세 강화 신호로, 가격 하락 동반 시 투매 또는 대규모 청산 신호로 해석할 수 있습니다.`
  }
  if (ratio > 1.5) {
    return `최근 거래량(${recentStr})이 20일 평균 대비 ${((ratio - 1) * 100).toFixed(0)}% 증가했습니다. 평소보다 많은 거래 참여는 현재 가격 방향성에 힘을 실어주는 신호입니다. 상승장 속 거래량 증가는 추세 지속 가능성을 높이고, 하락장 속 증가는 빠른 저점 탐색을 의미할 수 있습니다.`
  }
  if (ratio < 0.3) {
    return `최근 거래량이 20일 평균의 ${(ratio * 100).toFixed(0)}% 수준으로 극도로 감소했습니다. 이는 시장 참여자들의 극단적인 관망세를 나타내며, 방향성 없는 횡보 혹은 변동성 확대 직전의 압축 구간일 수 있습니다. 거래량 회복 시점과 방향을 주시하세요.`
  }
  if (ratio < 0.5) {
    return `최근 거래량이 20일 평균의 ${(ratio * 100).toFixed(0)}% 수준으로 크게 줄었습니다. 거래 참여도 감소는 추세 모멘텀 약화의 신호일 수 있으며, 현재 가격 움직임에 대한 확신이 낮다는 의미입니다. 거래량이 회복될 때까지 추세 신뢰도를 낮게 보는 것이 바람직합니다.`
  }
  return null
}

export function generateRuleBasedInsights(
  metrics: InsightRequest['metrics'],
  dataType: DataType,
  volumes?: number[],
): string[] {
  const insights: string[] = []

  if (dataType === 'STOCK_OHLCV') {
    // 1. 추세: MA 골든/데드크로스
    const maNote = maSignal(metrics.ma20 ?? null, metrics.ma50 ?? null)
    if (maNote) insights.push(`📈 추세: ${maNote}`)

    // 2. 모멘텀: RSI
    if (metrics.rsi14 != null) {
      insights.push(`⚡ 모멘텀: ${rsiInterpretation(metrics.rsi14)}`)
    }

    // 3. 볼린저 밴드 위치 (ma20 = bollingerMiddle)
    const bbNote = bollingerSignal(
      metrics.ma20 ?? null,   // close 대신 ma20 근처 (실제 close는 InsightRequest에 없으므로)
      metrics.bollingerUpper ?? null,
      metrics.bollingerLower ?? null,
      metrics.bollingerMiddle ?? null,
    )
    if (bbNote) insights.push(`📊 밴드: ${bbNote}`)

    // 4. 거래량 신호
    const volNote = volumeSignal(volumes)
    if (volNote) insights.push(`📦 거래량: ${volNote}`)

    // 5. 위험 지표 (변동성 + MDD)
    if (metrics.volatility != null && metrics.mdd != null) {
      const volGrade = volatilityGrade(metrics.volatility)
      const mddGradeStr = mddGrade(Math.abs(metrics.mdd))
      const mddAbs = Math.abs(metrics.mdd)
      let riskComment = ''
      if (mddAbs >= 40) riskComment = ' 이 수준의 낙폭은 포트폴리오 회복에 장기간이 소요될 수 있어 리스크 관리 전략 재검토가 필요합니다.'
      else if (mddAbs >= 20) riskComment = ' 낙폭이 크기 때문에 손절 기준 설정과 분산투자 비중을 재점검하는 것이 좋습니다.'
      else riskComment = ' 비교적 양호한 리스크 수준이지만 변동성 확대 국면에서는 주의가 필요합니다.'
      insights.push(`⚠️ 리스크: 연환산 변동성 ${metrics.volatility.toFixed(1)}%(${volGrade}), 최대 낙폭 ${metrics.mdd.toFixed(1)}%(${mddGradeStr}).${riskComment}`)
    } else if (metrics.volatility != null) {
      insights.push(`⚠️ 리스크: 연환산 변동성 ${metrics.volatility.toFixed(1)}%(${volatilityGrade(metrics.volatility)})입니다. 변동성이 높을수록 단기 가격 진폭이 크고, 심리적 손실 부담도 커집니다.`)
    } else if (metrics.mdd != null) {
      const mddAbs = Math.abs(metrics.mdd)
      insights.push(`⚠️ 리스크: 최대 낙폭 ${metrics.mdd.toFixed(1)}%(${mddGrade(mddAbs)})을 기록했습니다. 최대 낙폭은 투자 기간 중 가장 극심한 손실 구간을 나타내며, 이를 견딜 수 있는지 리스크 허용도를 확인하세요.`)
    }

    // 6. 위험 조정 성과 (샤프 + 소르티노)
    if (metrics.sharpeRatio != null || metrics.sortinoRatio != null) {
      const grade = metrics.sharpeRatio != null ? sharpeGrade(metrics.sharpeRatio) : null
      let text = '📉 위험조정수익: '
      if (metrics.sharpeRatio != null) {
        text += `샤프비율 ${metrics.sharpeRatio.toFixed(2)}(${grade?.label ?? ''})은 변동성 1단위당 초과수익을 나타냅니다. `
        if (metrics.sharpeRatio >= 2) text += '매우 우수한 수준으로 위험 대비 수익이 탁월합니다.'
        else if (metrics.sharpeRatio >= 1) text += '양호한 수준으로 리스크 조정 후에도 충분한 수익이 발생했습니다.'
        else if (metrics.sharpeRatio >= 0) text += '보통 수준으로 리스크 대비 수익률이 충분하지 않을 수 있습니다.'
        else text += '음수로, 무위험수익률보다 낮은 성과입니다. 전략 재검토가 필요합니다.'
      }
      if (metrics.sortinoRatio != null) {
        text += ` 소르티노 ${metrics.sortinoRatio.toFixed(2)}는 하방 변동성만을 고려한 지표로, 샤프비율 대비 높으면 손실 변동성이 작고 수익 변동성이 큰 양호한 구조를 의미합니다.`
      }
      insights.push(text)
    }

    // 최대 5개로 제한
    return insights.slice(0, 5)

  } else if (dataType === 'PORTFOLIO') {
    if (metrics.totalReturn != null) {
      const ret = formatReturn(metrics.totalReturn)
      const sharpeGradeObj = metrics.sharpeRatio != null ? sharpeGrade(metrics.sharpeRatio) : null
      const sharpeNote = sharpeGradeObj ? `, 샤프비율 ${metrics.sharpeRatio!.toFixed(2)}(${sharpeGradeObj.label})` : ''
      const perfComment = metrics.totalReturn > 0
        ? ' 양수 수익률로 포트폴리오가 수익을 창출했습니다. 개별 종목 기여도를 분석하여 우수 종목의 비중 조절을 검토하세요.'
        : ' 손실 구간입니다. 손실 원인을 종목별로 분석하고 비중 재조정이나 손절을 고려해야 합니다.'
      insights.push(`💼 성과: 포트폴리오 가중 수익률 ${ret}${sharpeNote}.${perfComment}`)
    }
    if (metrics.mdd != null && metrics.topConcentration != null) {
      const concComment = metrics.topConcentration > 30
        ? ' 단일 종목 집중도가 높아 해당 종목의 하락 시 포트폴리오 전체에 큰 영향을 줄 수 있습니다. 분산 비중 조정을 검토하세요.'
        : ' 비중 분산이 적절하게 이루어지고 있습니다.'
      insights.push(`🔴 위험: 최대 낙폭 ${metrics.mdd.toFixed(1)}%(${mddGrade(Math.abs(metrics.mdd))}), 최대 종목 비중 ${metrics.topConcentration.toFixed(1)}%.${concComment}`)
    }
    if (metrics.worstAsset) {
      insights.push(`✅ 참고: 최저 성과 종목(${metrics.worstAsset})의 비중 재검토를 고려해볼 수 있습니다. 해당 종목의 손실이 포트폴리오 전체 성과를 끌어내리고 있는지 기여도 분석이 필요합니다. (과거 데이터 기반 분석으로 미래 성과를 보장하지 않습니다)`)
    }

  } else if (dataType === 'RETURNS') {
    if (metrics.totalReturn != null) {
      const ret = formatReturn(metrics.totalReturn)
      const cagrNote = metrics.cagr != null ? `, CAGR ${formatReturn(metrics.cagr)}` : ''
      const cagrComment = metrics.cagr != null
        ? ` CAGR은 연평균 복리 수익률로, 장기 투자 성과를 비교하는 핵심 지표입니다.`
        : ''
      insights.push(`📊 수익성: 총 수익률 ${ret}${cagrNote}.${cagrComment}`)
    }
    if (metrics.sharpeRatio != null && metrics.sortinoRatio != null) {
      const grade = sharpeGrade(metrics.sharpeRatio)
      const diff = (metrics.sortinoRatio - metrics.sharpeRatio).toFixed(2)
      const diffComment = metrics.sortinoRatio > metrics.sharpeRatio
        ? ` 소르티노가 샤프보다 ${diff} 높아 손실 변동성이 수익 변동성보다 낮은 바람직한 구조입니다.`
        : ` 소르티노가 샤프보다 낮아 하방 변동성이 상대적으로 크다는 점에 유의하세요.`
      insights.push(`⚡ 효율성: 샤프비율 ${metrics.sharpeRatio.toFixed(2)}(${grade.label}), 소르티노 ${metrics.sortinoRatio.toFixed(2)}.${diffComment}`)
    } else if (metrics.sharpeRatio != null) {
      const grade = sharpeGrade(metrics.sharpeRatio)
      insights.push(`⚡ 효율성: 샤프비율 ${metrics.sharpeRatio.toFixed(2)} — ${grade.label}. 샤프비율은 위험 1단위당 얼마나 초과수익을 올렸는지 나타내는 지표로, 1.0 이상이면 양호한 수준입니다.`)
    }
    if (metrics.mdd != null) {
      const mddAbs = Math.abs(metrics.mdd)
      const mddComment = mddAbs > 30
        ? ' 이 수준의 낙폭은 심리적으로 견디기 어려울 수 있으며, 레버리지 사용 또는 집중 투자 여부를 점검해야 합니다.'
        : mddAbs > 15
        ? ' 허용 가능한 수준인지 개인의 리스크 허용도와 비교해보세요.'
        : ' 비교적 안정적인 낙폭 관리가 이루어지고 있습니다.'
      insights.push(`⚠️ 하방: 최대 낙폭 ${metrics.mdd.toFixed(1)}%(${mddGrade(mddAbs)}).${mddComment}`)
    }

  } else {
    insights.push('📊 분석: 데이터가 로드되었습니다. 지원되는 데이터 형식으로 업로드하면 더 상세한 분석을 확인하실 수 있습니다.')
  }

  if (insights.length === 0) {
    insights.push('📊 분석: 데이터가 충분하지 않아 인사이트를 생성할 수 없습니다.')
  }
  return insights
}


// Claude API system prompt
const SYSTEM_PROMPT = `당신은 10년 경력의 전문 퀀트 애널리스트입니다. 한국어로 실용적이고 상세한 투자 인사이트를 생성합니다.

[작성 규칙]
- 각 인사이트는 2~3문장으로 작성: ①현재 상태 설명 + ②의미/해석 + ③대응 방향 또는 주의사항
- 구체적인 수치를 반드시 포함
- 이모지 접두사 필수: 📈(추세) ⚡(모멘텀) ⚠️(리스크) 💼(성과) 🔴(위험) ✅(긍정) 📊(수익률) 📦(거래량)
- 최대 5개 인사이트, 위험 지표 우선

[지표 해석 기준]
샤프비율: >=2=매우우수, 1~2=양호, 0~1=보통, <0=위험(재검토 필요)
소르티노: 샤프보다 높으면 하방리스크 낮다는 의미
RSI: >80=심한과매수, >70=과매수, <30=과매도, <20=심한과매도
볼린저 밴드폭: <4%=극심한스퀴즈, <6%=스퀴즈, 상단90%초과=과열, 하단10%미만=지지
거래량: 평균대비 +100%이상=폭증, +50%=급증, -50%이하=급감, -70%이하=극감
MDD: <10%=낮음, 10~20%=보통, 20~40%=높음, >40%=매우높음(재검토)

[금지사항]
- 직접적 매수/매도 권유
- "반드시", "확실히" 등 미래 확정 표현
- 근거 없는 예측

[응답 형식 — 반드시 JSON만 반환]
{"insights":["인사이트1(2~3문장)","인사이트2(2~3문장)","인사이트3(2~3문장)","인사이트4(2~3문장)"],"disclaimer":"본 분석은 과거 데이터 기반이며 미래 수익을 보장하지 않습니다."}
`

export async function generateInsightsViaAPI(
  request: InsightRequest,
  apiKey: string,
): Promise<{ insights: string[]; disclaimer: string }> {
  const metricsText = Object.entries(request.metrics)
    .filter(([, v]) => v != null && typeof v === 'number')
    .map(([k, v]) => `- ${k}: ${(v as number).toFixed(4)}`)
    .join('\n')

  const userMessage = `데이터 타입: ${request.dataType}\n요약: ${request.summary}\n\n금융 지표:\n${metricsText}\n\nJSON 인사이트를 생성해주세요.`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    }),
  })

  if (!response.ok) throw new Error(`Claude API 오류: ${response.status}`)

  const result = await response.json() as { content: { text: string }[] }
  const text = result.content[0]?.text ?? ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('응답 JSON 파싱 실패')

  const parsed = JSON.parse(jsonMatch[0]) as { insights?: string[]; disclaimer?: string }
  return {
    insights: parsed.insights ?? [],
    disclaimer: parsed.disclaimer ?? '본 분석은 과거 데이터 기반이며 미래 수익을 보장하지 않습니다.',
  }
}

// ─── 통합 함수 ──────────────────────────────────────────────────────────

export async function generateInsights(
  request: InsightRequest,
  volumes?: number[],
): Promise<{ insights: string[]; disclaimer: string }> {
  const apiKey = import.meta.env['VITE_CLAUDE_API_KEY'] as string | undefined

  if (apiKey && apiKey.startsWith('sk-ant-')) {
    try {
      return await generateInsightsViaAPI(request, apiKey)
    } catch {
      // API 실패 시 규칙 기반 폴백
    }
  }

  return {
    insights: generateRuleBasedInsights(request.metrics, request.dataType, volumes),
    disclaimer: '본 분석은 과거 데이터 기반이며 미래 수익을 보장하지 않습니다.',
  }
}
