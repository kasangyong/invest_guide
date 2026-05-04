import { useRef, useState, type DragEvent, type ChangeEvent } from 'react'

interface Props {
  onFile: (file: File) => void
  accept?: string
}

export function UploadZone({ onFile, accept = '.csv' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) onFile(file)
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onFile(file)
  }

  return (
    <div
      onDragEnter={() => setDragging(true)}
      onDragLeave={() => setDragging(false)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      style={{
        border: dragging ? '2px dashed var(--c-accent)' : '2px dashed var(--c-line)',
        background: dragging ? 'rgba(27,79,204,0.04)' : 'var(--c-bg)',
        padding: 'var(--s-8) var(--s-6)',
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'border-color 0.15s, background 0.15s',
      }}
    >
      <input ref={inputRef} type="file" accept={accept} style={{ display: 'none' }} onChange={handleChange} />

      <div style={{ marginBottom: 'var(--s-5)', display: 'flex', justifyContent: 'center' }}>
        <svg
          width="36" height="36" viewBox="0 0 36 36" fill="none"
          style={{ opacity: dragging ? 1 : 0.35, transition: 'opacity 0.15s' }}
        >
          <rect x="0.5" y="0.5" width="35" height="35" stroke={dragging ? 'var(--c-accent)' : 'var(--c-fg)'} strokeWidth="1"/>
          <path d="M18 24V13M13 18l5-6 5 6" stroke={dragging ? 'var(--c-accent)' : 'var(--c-fg)'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      <p style={{ fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 700, fontSize: 'var(--t-1)', color: dragging ? 'var(--c-accent)' : 'var(--c-fg)', marginBottom: 'var(--s-2)', transition: 'color 0.15s' }}>
        {dragging ? '여기에 놓으세요' : 'CSV 파일을 드래그하세요'}
      </p>
      <p style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: 'var(--t-0)', color: 'var(--c-fg-muted)', marginBottom: 'var(--s-5)' }}>
        또는 클릭해서 파일 선택
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-4)', marginBottom: 'var(--s-4)' }}>
        <div style={{ flex: 1, height: '1px', background: 'var(--c-line)' }} />
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 'var(--t--1)', color: 'var(--c-fg-muted)', letterSpacing: '0.08em' }}>지원 형식</span>
        <div style={{ flex: 1, height: '1px', background: 'var(--c-line)' }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--s-3)', flexWrap: 'wrap' }}>
        {['주가 OHLCV', '포트폴리오', '수익률 시계열'].map((tag) => (
          <span
            key={tag}
            style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: 'var(--t--1)', color: 'var(--c-fg-muted)', border: '1px solid var(--c-line)', padding: '3px 12px' }}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  )
}
