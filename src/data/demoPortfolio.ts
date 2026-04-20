import type { PortfolioRow, DetectedSchema } from '../types/financial'

export const DEMO_PORTFOLIO_DATA: PortfolioRow[] = [
  { ticker: '삼성전자',   weight: 22.5, returnRate: 12.4,  sector: 'IT' },
  { ticker: 'SK하이닉스', weight: 15.0, returnRate: 34.2,  sector: 'IT' },
  { ticker: 'LG에너지솔루션', weight: 12.0, returnRate: -8.3, sector: '2차전지' },
  { ticker: '현대차',     weight: 8.5,  returnRate: 5.1,   sector: '자동차' },
  { ticker: 'NAVER',     weight: 7.0,  returnRate: -2.7,  sector: 'IT' },
  { ticker: '카카오',    weight: 5.5,  returnRate: -15.2, sector: 'IT' },
  { ticker: 'POSCO홀딩스', weight: 6.0, returnRate: 8.9,  sector: '소재' },
  { ticker: '셀트리온',  weight: 4.5,  returnRate: 22.1,  sector: '헬스케어' },
  { ticker: 'KB금융',    weight: 5.0,  returnRate: 18.6,  sector: '금융' },
  { ticker: '신한지주',  weight: 4.0,  returnRate: 14.3,  sector: '금융' },
  { ticker: '한국전력',  weight: 3.5,  returnRate: -11.8, sector: '유틸리티' },
  { ticker: '기타',      weight: 6.5,  returnRate: 3.2,   sector: '기타' },
]

export const DEMO_PORTFOLIO_SCHEMA: DetectedSchema = {
  dataType: 'PORTFOLIO',
  columns: [
    { name: 'ticker',     inferredType: 'string', sample: ['삼성전자'], nullRatio: 0 },
    { name: 'weight',     inferredType: 'number', sample: [22.5],       nullRatio: 0 },
    { name: 'returnRate', inferredType: 'number', sample: [12.4],       nullRatio: 0 },
    { name: 'sector',     inferredType: 'string', sample: ['IT'],       nullRatio: 0 },
  ],
  primaryKey: 'ticker',
  dateColumn: null,
  valueColumns: ['weight', 'returnRate'],
  confidence: 0.92,
  warnings: [],
  rowCount: 12,
}
