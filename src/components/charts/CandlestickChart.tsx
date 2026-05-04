import { useEffect, useRef } from 'react'
import {
  createChart, ColorType, CrosshairMode,
  CandlestickSeries, HistogramSeries, LineSeries,
} from 'lightweight-charts'
import type { OHLCVRow, FinancialMetrics } from '../../types/financial'

interface Props {
  data: OHLCVRow[]
  metrics: FinancialMetrics
  height?: number
}

export function CandlestickChart({ data, metrics, height = 360 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#FAFAF9' },
        textColor: '#5C5C57',
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: '#EBE7DC' },
        horzLines: { color: '#EBE7DC' },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: '#DDD9CE' },
      timeScale: { borderColor: '#DDD9CE', timeVisible: true, secondsVisible: false },
      height,
    })

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#0A7A45',
      downColor: '#C42B35',
      borderUpColor: '#0A7A45',
      borderDownColor: '#C42B35',
      wickUpColor: '#0A7A45',
      wickDownColor: '#C42B35',
    })
    type TimeStr = `${number}-${number}-${number}`
    candleSeries.setData(data.map((d) => ({
      time: d.date as TimeStr,
      open: d.open, high: d.high, low: d.low, close: d.close,
    })))

    const volSeries = chart.addSeries(HistogramSeries, {
      color: '#DDD9CE',
      priceScaleId: 'volume',
    })
    chart.priceScale('volume').applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } })
    volSeries.setData(data.map((d) => ({
      time: d.date as TimeStr,
      value: d.volume,
      color: d.close >= d.open ? 'rgba(10,122,69,0.2)' : 'rgba(196,43,53,0.15)',
    })))

    const ma20S = chart.addSeries(LineSeries, {
      color: '#B07C00',
      lineWidth: 1,
      title: '',
      priceLineVisible: false,
      lastValueVisible: false,
    })
    ma20S.setData(
      data.map((d, i) => ({ time: d.date as TimeStr, value: metrics.ma20Series[i] }))
        .filter((p): p is { time: TimeStr; value: number } => p.value != null)
    )

    const ma50S = chart.addSeries(LineSeries, {
      color: '#4F46E5',
      lineWidth: 1,
      title: '',
      priceLineVisible: false,
      lastValueVisible: false,
    })
    ma50S.setData(
      data.map((d, i) => ({ time: d.date as TimeStr, value: metrics.ma50Series[i] }))
        .filter((p): p is { time: TimeStr; value: number } => p.value != null)
    )

    if (metrics.bollingerSeries.length > 0) {
      const bbUpper = chart.addSeries(LineSeries, {
        color: 'rgba(37,99,235,0.65)',
        lineWidth: 1,
        lineStyle: 2,
        title: '',
        priceLineVisible: false,
        lastValueVisible: false,
      })
      bbUpper.setData(
        data
          .map((d, i) => ({
            time: d.date as TimeStr,
            value: metrics.bollingerSeries[i]?.upper ?? null,
          }))
          .filter((p): p is { time: TimeStr; value: number } => p.value != null)
      )

      const bbMiddle = chart.addSeries(LineSeries, {
        color: 'rgba(37,99,235,0.3)',
        lineWidth: 1,
        lineStyle: 1,
        title: '',
        priceLineVisible: false,
        lastValueVisible: false,
      })
      bbMiddle.setData(
        data
          .map((d, i) => ({
            time: d.date as TimeStr,
            value: metrics.bollingerSeries[i]?.middle ?? null,
          }))
          .filter((p): p is { time: TimeStr; value: number } => p.value != null)
      )

      const bbLower = chart.addSeries(LineSeries, {
        color: 'rgba(37,99,235,0.65)',
        lineWidth: 1,
        lineStyle: 2,
        title: '',
        priceLineVisible: false,
        lastValueVisible: false,
      })
      bbLower.setData(
        data
          .map((d, i) => ({
            time: d.date as TimeStr,
            value: metrics.bollingerSeries[i]?.lower ?? null,
          }))
          .filter((p): p is { time: TimeStr; value: number } => p.value != null)
      )
    }

    chart.timeScale().fitContent()
    const ro = new ResizeObserver(() => {
      if (containerRef.current) chart.applyOptions({ width: containerRef.current.clientWidth })
    })
    ro.observe(containerRef.current)
    return () => { ro.disconnect(); chart.remove() }
  }, [data, metrics, height])

  const last = data[data.length - 1]
  const prev = data[data.length - 2]
  const change = last && prev ? ((last.close - prev.close) / prev.close) * 100 : 0
  const isUp = change >= 0

  return (
    <div style={{ background: '#FAFAF9', border: '1px solid #DDD9CE', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', borderBottom: '1px solid #DDD9CE' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '0.75rem', color: '#5C5C57', textTransform: 'uppercase', letterSpacing: '0.05em' }}>캔들스틱</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.625rem' }}>
            <span style={{ color: '#B07C00' }}>&mdash; MA20</span>
            <span style={{ color: '#4F46E5' }}>&mdash; MA50</span>
            <span style={{ color: 'rgba(37,99,235,0.8)' }}>&ndash;&ndash; BB</span>
          </div>
        </div>
        {last && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.875rem' }}>
            <span style={{ color: '#1A1A1A', fontWeight: 500 }}>{last.close.toLocaleString()}</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 500, color: isUp ? '#0A7A45' : '#C42B35' }}>
              {isUp ? '+' : ''}{change.toFixed(2)}%
            </span>
          </div>
        )}
      </div>
      <div ref={containerRef} />
    </div>
  )
}
