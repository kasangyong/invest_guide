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
      className="cursor-pointer text-center transition-all"
      style={{
        border: dragging ? '2px dashed #0a0a0a' : '2px dashed #cccccc',
        background: dragging ? 'rgba(10,10,10,0.04)' : '#ffffff',
        padding: '3rem 2rem',
        transition: 'border-color 0.2s, background 0.2s',
      }}
    >
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleChange} />

      {/* 업로드 아이콘 */}
      <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'center' }}>
        <svg
          width="40" height="40" viewBox="0 0 40 40" fill="none"
          style={{ opacity: dragging ? 1 : 0.4, transition: 'opacity 0.2s' }}
        >
          <circle cx="20" cy="20" r="19" stroke="#0a0a0a" strokeWidth="1.5"/>
          <path d="M20 27V14M14 20l6-7 6 7" stroke="#0a0a0a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {/* 메인 문구 */}
      <p style={{ fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 700, fontSize: '1.05rem', color: '#0a0a0a', marginBottom: '0.5rem' }}>
        {dragging ? '여기에 놓으세요' : 'CSV 파일을 여기에 드래그하세요'}
      </p>
      <p style={{ fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 400, fontSize: '0.875rem', color: '#888888', marginBottom: '1.5rem' }}>
        또는 클릭해서 파일 선택
      </p>

      {/* 구분선 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
        <div style={{ flex: 1, height: '1px', background: '#e8e8e8' }} />
        <span style={{ fontFamily: "'Inter', monospace", fontSize: '0.7rem', color: '#cccccc', letterSpacing: '0.1em' }}>지원 형식</span>
        <div style={{ flex: 1, height: '1px', background: '#e8e8e8' }} />
      </div>

      {/* 지원 타입 태그 */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        {['주가 OHLCV', '포트폴리오', '수익률 시계열'].map((tag) => (
          <span
            key={tag}
            style={{
              fontFamily: "'Noto Sans KR', sans-serif",
              fontSize: '0.75rem',
              color: '#666666',
              border: '1px solid #e0e0e0',
              padding: '0.25rem 0.75rem',
              background: '#fafafa',
            }}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  )
}
