'use client';

import { useRef, useState, useEffect, useCallback } from 'react';

interface SignatureCanvasProps {
  onSave?: (dataUrl: string) => void;
  width?: number;
  height?: number;
  label?: string;
  disabled?: boolean;
}

export default function SignatureCanvas({
  onSave,
  width = 600,
  height = 160,
  label = 'Tanda Tangan Digital',
  disabled = false,
}: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const strokePointsRef = useRef(0);
  const [hasContent, setHasContent] = useState(false);
  const [sigData, setSigData] = useState<string | null>(null);

  // Initialize and handle canvas sizing
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    // Set internal resolution
    canvas.width = (rect.width || width) * dpr;
    canvas.height = (rect.height || height) * dpr;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#1a1a1a';
  }, [width, height]);

  useEffect(() => {
    initCanvas();
    const handleResize = () => {
      // Re-init canvas on window resize only if empty
      if (!isDrawingRef.current && !hasContent) {
        initCanvas();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [initCanvas, hasContent]);

  const getPos = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      if (!touch) return { x: 0, y: 0 };
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    isDrawingRef.current = true;
    strokePointsRef.current = 1;
  }, [disabled, getPos]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (disabled || !isDrawingRef.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    strokePointsRef.current += 1;
  }, [disabled, getPos]);

  const stopDrawing = useCallback(() => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Strict pixel inspection to reject blank canvas or single click/dot
    try {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      let inkPixels = 0;
      for (let i = 3; i < data.length; i += 4) {
        const alpha = data[i] ?? 0;
        if (alpha > 20) {
          inkPixels++;
          if (inkPixels >= 60) break; // Reached valid ink threshold
        }
      }

      if (inkPixels >= 60 && strokePointsRef.current >= 6) {
        const dataUrl = canvas.toDataURL('image/png');
        setHasContent(true);
        setSigData(dataUrl);
        if (onSave) onSave(dataUrl);
      } else {
        // Dot or empty tap: discard and clear
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        strokePointsRef.current = 0;
        setHasContent(false);
        setSigData(null);
        if (onSave) onSave('');
      }
    } catch {
      // Fallback
      setHasContent(false);
      setSigData(null);
      if (onSave) onSave('');
    }
  }, [onSave]);

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    isDrawingRef.current = false;
    strokePointsRef.current = 0;
    setHasContent(false);
    setSigData(null);
    if (onSave) onSave('');
  }, [onSave]);

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-luxury-charcoal">
          {label}
        </label>
        {hasContent && (
          <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <span>✓</span> Tanda Tangan Terekam
          </span>
        )}
      </div>

      <div
        className={`relative border-2 rounded-2xl overflow-hidden transition-all select-none ${
          hasContent
            ? 'border-emerald-500/80 bg-emerald-50/10 shadow-xs'
            : 'border-dashed border-amber-300/80 bg-white hover:border-amber-400'
        }`}
      >
        <canvas
          ref={canvasRef}
          className="w-full touch-none cursor-crosshair block"
          style={{ height }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />

        {!hasContent && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-gray-400 space-y-1">
            <span className="text-base">✍️</span>
            <span className="text-xs font-medium text-gray-400">
              Goreskan tanda tangan digital Anda di sini
            </span>
            <span className="text-[10px] text-gray-300">
              (Gunakan mouse atau jari pada layar sentuh)
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-1">
        {hasContent ? (
          <button
            type="button"
            onClick={clear}
            className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1 hover:underline cursor-pointer transition-colors"
          >
            <span>↺</span>
            <span>Hapus & tanda tangan ulang</span>
          </button>
        ) : (
          <p className="text-[10px] text-amber-700/80 font-medium">
            ⚠️ Tanda tangan wajib diisi sebelum lanjut ke pembayaran DP
          </p>
        )}
      </div>
    </div>
  );
}
