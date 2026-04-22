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
        background: { type: ColorType.Solid, color: '#0a0a0a' },
        textColor: '#555555',
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: '#1a1a1a' },
        horzLines: { color: '#1a1a1a' },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: '#222222' },
      timeScale: { borderColor: '#222222', timeVisible: true, secondsVisible: false },
      height,
    })

    // 캔들스틱 (상승=teal, 하락=red)
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderUpColor: '#26a69a',
      borderDownColor: '#ef5350',
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    })
    type TimeStr = `${number}-${number}-${number}`
    candleSeries.setData(data.map((d) => ({
      time: d.date as TimeStr,
      open: d.open, high: d.high, low: d.low, close: d.close,
    })))

    // 거래량 히스토그램
    const volSeries = chart.addSeries(HistogramSeries, {
      color: '#222222',
      priceScaleId: 'volume',
    })
    chart.priceScale('volume').applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } })
    volSeries.setData(data.map((d) => ({
      time: d.date as TimeStr,
      value: d.volume,
      color: d.close >= d.open ? '#1a3a38' : '#3a1a1a',
    })))

    // MA20 (amber)
    const ma20S = chart.addSeries(LineSeries, {
      color: '#f59e0b',
      lineWidth: 1,
      title: '',
      priceLineVisible: false,
      lastValueVisible: false,
    })
    ma20S.setData(
      data.map((d, i) => ({ time: d.date as TimeStr, value: metrics.ma20Series[i] }))
        .filter((p): p is { time: TimeStr; value: number } => p.value != null)
    )

    // MA50 (indigo)
    const ma50S = chart.addSeries(LineSeries, {
      color: '#818cf8',
      lineWidth: 1,
      title: '',
      priceLineVisible: false,
      lastValueVisible: false,
    })
    ma50S.setData(
      data.map((d, i) => ({ time: d.date as TimeStr, value: metrics.ma50Series[i] }))
        .filter((p): p is { time: TimeStr; value: number } => p.value != null)
    )

    // 볼린저 밴드 (blue-400, dashed)
    if (metrics.bollingerSeries.length > 0) {
      const bbUpper = chart.addSeries(LineSeries, {
        color: 'rgba(96,165,250,0.7)',
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
        color: 'rgba(96,165,250,0.35)',
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
        color: 'rgba(96,165,250,0.7)',
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
    <div className="bg-[#0a0a0a] border border-[#222222] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#1e1e1e]">
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#888888] uppercase tracking-wider">캔들스틱</span>
          <div className="flex items-center gap-3 text-[10px]">
            <span style={{ color: '#f59e0b' }}>&mdash; MA20</span>
            <span style={{ color: '#818cf8' }}>&mdash; MA50</span>
            <span style={{ color: 'rgba(96,165,250,0.9)' }}>&ndash;&ndash; BB</span>
          </div>
        </div>
        {last && (
          <div className="flex items-center gap-4 text-sm">
            <span className="text-white font-medium">{last.close.toLocaleString()}</span>
            <span className={`text-xs font-medium ${isUp ? 'text-[#26a69a]' : 'text-[#ef5350]'}`}>
              {isUp ? '+' : ''}{change.toFixed(2)}%
            </span>
          </div>
        )}
      </div>
      <div ref={containerRef} />
    </div>
  )
}
