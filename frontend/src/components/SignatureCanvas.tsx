'use client';

import { useRef, useState, useEffect, useCallback } from 'react';

interface SignatureCanvasProps {
  onSave?: (dataUrl: string) => void;
  width?: number;
  height?: number;
  label?: string;
}

export default function SignatureCanvas({
  onSave,
  width = 600,
  height = 200,
  label = 'Tanda Tangan Digital',
}: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasContent, setHasContent] = useState(false);
  const [sigData, setSigData] = useState<string | null>(null);

  const getPos = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      const touch = (e.touches[0] || e.changedTouches[0]);
      if (!touch) return { x: 0, y: 0 };
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
  }, [getPos]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#2C1810';
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setHasContent(true);
  }, [isDrawing, getPos]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
    const dataUrl = canvasRef.current?.toDataURL('image/png');
    if (dataUrl) setSigData(dataUrl);
  }, []);

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasContent(false);
    setSigData(null);
  };

  // Adjust canvas size to container
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    // Restore signature if exists
    if (sigData) {
      const img = new Image();
      img.onload = () => {
        ctx?.drawImage(img, 0, 0);
      };
      const ctx = canvas.getContext('2d');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Validate data URL — prevents XSS from manipulated canvas
    const isValid = typeof sigData === 'string' && sigData.startsWith('data:image/png;base64,');
    if (isValid && onSave) onSave(sigData);
  }, [sigData, onSave]);

  return (
    <div className="w-full space-y-2">
      <label className="block text-sm font-medium text-luxury-charcoal">{label}</label>
      <div className="relative border-2 border-dashed border-luxury-champagne/60 rounded-xl overflow-hidden bg-white/80">
        <canvas
          ref={canvasRef}
          className="w-full touch-none cursor-crosshair"
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
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-xs text-luxury-deep-slate/30 font-light">Tanda tangan di sini</span>
          </div>
        )}
      </div>
      {hasContent && (
        <button
          onClick={clear}
          className="text-xs text-luxury-deep-slate/40 hover:text-luxury-rose-gold transition-colors underline cursor-pointer"
        >
          Hapus & tanda tangan ulang
        </button>
      )}
    </div>
  );
}
