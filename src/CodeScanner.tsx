/**
 * Captura de un código de colección: cámara en vivo (jsQR) con fallback a
 * pegar el texto. Reutilizado por el trueque bilateral (`TradeScreen`) y la
 * ronda de intercambio (`RondaScreen`).
 *
 * `onDetected` recibe el código leído y devuelve un mensaje de error para
 * mostrar (si el código no sirve) o `null` si se aceptó. El componente sigue
 * escaneando tras un error; el padre lo desmonta cuando el código es válido.
 */
import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import type { Translations } from '@core/i18n';

interface Props {
  t: Translations;
  onDetected: (code: string) => Promise<string | null>;
}

export default function CodeScanner({ t, onDetected }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [pasteValue, setPasteValue] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const pausedRef = useRef(false);

  useEffect(() => {
    let active = true;
    const scanCanvas = document.createElement('canvas');

    const stopCamera = () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };

    const tick = () => {
      if (!active) return;
      const video = videoRef.current;
      const ctx = scanCanvas.getContext('2d');
      if (!pausedRef.current && video && ctx && video.readyState === video.HAVE_ENOUGH_DATA) {
        scanCanvas.width = video.videoWidth;
        scanCanvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, scanCanvas.width, scanCanvas.height);
        const imageData = ctx.getImageData(0, 0, scanCanvas.width, scanCanvas.height);
        const result = jsQR(imageData.data, imageData.width, imageData.height);
        if (result?.data) {
          pausedRef.current = true;
          void onDetected(result.data).then((err) => {
            if (!active) return;
            setError(err);
            // Tras un error se sigue escaneando; si fue válido, el padre desmonta.
            if (err !== null) window.setTimeout(() => (pausedRef.current = false), 1200);
          });
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    void (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        rafRef.current = requestAnimationFrame(tick);
      } catch {
        if (active) setError(t.trade.cameraError);
      }
    })();

    return () => {
      active = false;
      stopCamera();
    };
  }, [t, onDetected]);

  const submitPaste = async () => {
    const err = await onDetected(pasteValue);
    setError(err);
    if (err === null) setPasteValue('');
  };

  return (
    <div className="flex flex-col gap-3">
      <video ref={videoRef} playsInline muted className="w-full rounded-lg border bg-black" />
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
      <label className="text-sm opacity-70" htmlFor="scanner-paste">
        {t.trade.pasteLabel}
      </label>
      <textarea
        id="scanner-paste"
        value={pasteValue}
        onChange={(e) => setPasteValue(e.target.value)}
        className="h-24 w-full rounded-lg border bg-transparent p-2 text-xs"
        placeholder={t.trade.pastePlaceholder}
      />
      <button
        onClick={() => void submitPaste()}
        disabled={!pasteValue.trim()}
        className={[
          'rounded-lg border border-sky-500 bg-sky-500/15 px-3 py-1.5 text-sm font-medium',
          !pasteValue.trim() && 'opacity-50',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {t.trade.useThisCode}
      </button>
    </div>
  );
}
