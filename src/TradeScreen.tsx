/**
 * Pantalla de intercambio (Fase 2 del roadmap).
 *
 * Sin servidor ni cuentas: cada celular escanea el código del otro y
 * confirma el trueque sobre SU PROPIA colección local. Para que ambas
 * colecciones queden al día, los dos celulares tienen que escanearse
 * mutuamente (uno el código del otro, y viceversa).
 */
import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import type { AlbumDefinition, Collection, CollectionStats, TradeProposal } from '@core/types';
import { decodeCollection, encodeCollection } from '@core/codec';
import { matchTrade } from '@core/trade-matcher';
import { formatShareList, type ShareListKind } from '@core/share';
import { setStickerCount } from '@data/db';

type Step = 'menu' | 'showCode' | 'scan' | 'proposal' | 'done' | 'shareText';

interface Props {
  album: AlbumDefinition;
  collection: Collection;
  stats: CollectionStats;
  onClose: () => void;
  onTradeApplied: () => void;
}

const buttonClass = 'rounded-lg border px-3 py-1.5 text-sm font-medium';
const primaryButtonClass = 'rounded-lg border border-sky-500 bg-sky-500/15 px-3 py-1.5 text-sm font-medium';

export default function TradeScreen({ album, collection, stats, onClose, onTradeApplied }: Props) {
  const [step, setStep] = useState<Step>('menu');
  const [myCode, setMyCode] = useState('');
  const [pasteValue, setPasteValue] = useState('');
  const [scanError, setScanError] = useState<string | null>(null);
  const [proposal, setProposal] = useState<TradeProposal | null>(null);
  const [shareText, setShareText] = useState('');
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  // Genera mi código al entrar a "Mostrar mi código".
  useEffect(() => {
    if (step !== 'showCode') return;
    let cancelled = false;
    void encodeCollection(album, collection).then((code) => {
      if (!cancelled) setMyCode(code);
    });
    return () => {
      cancelled = true;
    };
  }, [step, album, collection]);

  // Dibuja el QR una vez que el código está listo.
  useEffect(() => {
    if (step !== 'showCode' || !myCode || !canvasRef.current) return;
    void QRCode.toCanvas(canvasRef.current, myCode, { width: 240, margin: 1 });
  }, [step, myCode]);

  const applyScannedCode = async (code: string) => {
    setScanError(null);
    try {
      const decoded = await decodeCollection(code.trim(), album);
      setProposal(matchTrade(album, collection, decoded));
      setStep('proposal');
    } catch (error) {
      setScanError(error instanceof Error ? error.message : 'Código inválido.');
    }
  };

  const stopCamera = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  // Cámara + loop de escaneo mientras estamos en el paso "scan".
  useEffect(() => {
    if (step !== 'scan') return;
    let active = true;
    setScanError(null);
    const scanCanvas = document.createElement('canvas');

    const tick = () => {
      if (!active) return;
      const video = videoRef.current;
      const ctx = scanCanvas.getContext('2d');
      if (video && ctx && video.readyState === video.HAVE_ENOUGH_DATA) {
        scanCanvas.width = video.videoWidth;
        scanCanvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, scanCanvas.width, scanCanvas.height);
        const imageData = ctx.getImageData(0, 0, scanCanvas.width, scanCanvas.height);
        const result = jsQR(imageData.data, imageData.width, imageData.height);
        if (result?.data) {
          stopCamera();
          void applyScannedCode(result.data);
          return;
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
        if (active) setScanError('No se pudo acceder a la cámara. Pegá el código manualmente.');
      }
    })();

    return () => {
      active = false;
      stopCamera();
    };
  }, [step]);

  const confirmTrade = async () => {
    if (!proposal) return;
    for (const sticker of proposal.aGives) {
      const current = collection.ownedCounts[sticker.index] ?? 0;
      await setStickerCount(album.id, sticker.index, Math.max(0, current - 1));
    }
    for (const sticker of proposal.bGives) {
      await setStickerCount(album.id, sticker.index, 1);
    }
    onTradeApplied();
    setStep('done');
  };

  const reset = () => {
    setProposal(null);
    setPasteValue('');
    setScanError(null);
    setShareText('');
    setCopied(false);
    setStep('menu');
  };

  // Comparte la lista (repetidas o faltantes) con el share sheet nativo;
  // si no está disponible o el usuario cancela, muestra el texto para copiar.
  const startShare = async (kind: ShareListKind) => {
    const text = formatShareList(album, collection, kind);
    setShareText(text);
    setCopied(false);
    if (navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return;
      }
    }
    setStep('shareText');
  };

  const copyShareText = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
    } catch {
      // clipboard API no disponible: el texto ya queda seleccionado para copiar a mano
    }
  };

  return (
    <div className="mx-auto max-w-2xl p-4 pb-24">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">🔄 Intercambiar</h1>
        <button onClick={onClose} className={buttonClass}>
          ✕ Cerrar
        </button>
      </div>

      {step === 'menu' ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm opacity-70">
            Sin cuentas ni internet: cada uno escanea el código del otro desde su celular. Para que
            las dos colecciones queden al día, ambos tienen que escanearse mutuamente.
          </p>
          <button onClick={() => setStep('showCode')} className={primaryButtonClass}>
            📤 Mostrar mi código
          </button>
          <button onClick={() => setStep('scan')} className={buttonClass}>
            📷 Escanear código de un amigo
          </button>
          <hr className="my-1 border-t opacity-30" />
          <p className="text-sm opacity-70">
            O mandá una lista de texto por WhatsApp o Instagram para que la otra persona vea qué te
            puede ofrecer, aunque no tenga la app:
          </p>
          <button onClick={() => void startShare('duplicates')} className={buttonClass}>
            📋 Compartir repetidas ({stats.duplicates})
          </button>
          <button onClick={() => void startShare('missing')} className={buttonClass}>
            📋 Compartir faltantes ({stats.missing})
          </button>
        </div>
      ) : null}

      {step === 'showCode' ? (
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm opacity-70">
            Mostrale esta pantalla a tu amigo para que la escanee con la opción «Escanear código de
            un amigo» de su celular.
          </p>
          <canvas ref={canvasRef} className="rounded-lg border" />
          <details className="w-full">
            <summary className="cursor-pointer text-sm opacity-70">
              No podés escanear: usar el código como texto
            </summary>
            <textarea
              readOnly
              value={myCode}
              className="mt-2 h-24 w-full rounded-lg border bg-transparent p-2 text-xs"
              onFocus={(e) => e.currentTarget.select()}
            />
          </details>
          <button onClick={reset} className={buttonClass}>
            Volver
          </button>
        </div>
      ) : null}

      {step === 'scan' ? (
        <div className="flex flex-col gap-3">
          <video ref={videoRef} playsInline muted className="w-full rounded-lg border bg-black" />
          {scanError ? <p className="text-sm text-red-500">{scanError}</p> : null}
          <label className="text-sm opacity-70" htmlFor="trade-paste">
            O pegá el código que te compartieron:
          </label>
          <textarea
            id="trade-paste"
            value={pasteValue}
            onChange={(e) => setPasteValue(e.target.value)}
            className="h-24 w-full rounded-lg border bg-transparent p-2 text-xs"
            placeholder="Pegá acá el código…"
          />
          <button
            onClick={() => void applyScannedCode(pasteValue)}
            disabled={!pasteValue.trim()}
            className={[primaryButtonClass, !pasteValue.trim() && 'opacity-50'].filter(Boolean).join(' ')}
          >
            Usar este código
          </button>
          <button onClick={reset} className={buttonClass}>
            Volver
          </button>
        </div>
      ) : null}

      {step === 'shareText' ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm opacity-70">
            Copiá este texto y pegalo en WhatsApp, Instagram o donde quieras.
          </p>
          <textarea
            readOnly
            value={shareText}
            className="h-72 w-full rounded-lg border bg-transparent p-2 text-xs"
            onFocus={(e) => e.currentTarget.select()}
          />
          <button onClick={() => void copyShareText()} className={primaryButtonClass}>
            {copied ? '✅ Copiado' : '📋 Copiar'}
          </button>
          <button onClick={reset} className={buttonClass}>
            Volver
          </button>
        </div>
      ) : null}

      {step === 'proposal' && proposal ? (
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="mb-2 font-semibold text-amber-600 dark:text-amber-400">
              Vos das ({proposal.aGives.length})
            </h2>
            {proposal.aGives.length === 0 ? (
              <p className="text-sm opacity-70">No tenés repetidas que a tu amigo le falten.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {proposal.aGives.map((s) => (
                  <span key={s.index} className="rounded-full border px-2.5 py-1 text-xs">
                    {s.code}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div>
            <h2 className="mb-2 font-semibold text-emerald-600 dark:text-emerald-400">
              Vos recibís ({proposal.bGives.length})
            </h2>
            {proposal.bGives.length === 0 ? (
              <p className="text-sm opacity-70">Tu amigo no tiene repetidas que te falten.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {proposal.bGives.map((s) => (
                  <span key={s.index} className="rounded-full border px-2.5 py-1 text-xs">
                    {s.code}
                  </span>
                ))}
              </div>
            )}
          </div>
          {proposal.aGives.length === 0 ? (
            <p className="text-sm opacity-70">No hay trueque posible por ahora.</p>
          ) : (
            <button onClick={() => void confirmTrade()} className={primaryButtonClass}>
              ✅ Confirmar intercambio
            </button>
          )}
          <button onClick={reset} className={buttonClass}>
            Cancelar
          </button>
        </div>
      ) : null}

      {step === 'done' ? (
        <div className="flex flex-col gap-3">
          <p>¡Listo! Tu colección se actualizó.</p>
          <p className="text-sm opacity-70">
            Para que la colección de tu amigo también quede al día, ahora mostrale tu código (📤
            Mostrar mi código) y que la escanee desde su celular.
          </p>
          <button onClick={() => setStep('showCode')} className={primaryButtonClass}>
            📤 Mostrar mi código
          </button>
          <button onClick={onClose} className={buttonClass}>
            Volver al álbum
          </button>
        </div>
      ) : null}
    </div>
  );
}
