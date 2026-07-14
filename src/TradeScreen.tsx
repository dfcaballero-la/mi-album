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
import type { AlbumDefinition, Collection, CollectionStats, TradeProposal } from '@core/types';
import type { Locale, Translations } from '@core/i18n';
import { decodeCollection, encodeCollection } from '@core/codec';
import { matchTrade } from '@core/trade-matcher';
import { formatShareList, type ShareListKind } from '@core/share';
import { setStickerCount } from '@data/db';
import CodeScanner from './CodeScanner';

type Step = 'menu' | 'showCode' | 'scan' | 'proposal' | 'done' | 'shareText';

interface Props {
  album: AlbumDefinition;
  collection: Collection;
  stats: CollectionStats;
  locale: Locale;
  t: Translations;
  onClose: () => void;
  onTradeApplied: () => void;
  onOpenRonda: () => void;
}

const buttonClass = 'rounded-lg border px-3 py-1.5 text-sm font-medium';
const primaryButtonClass = 'rounded-lg border border-sky-500 bg-sky-500/15 px-3 py-1.5 text-sm font-medium';

export default function TradeScreen({
  album,
  collection,
  stats,
  locale,
  t,
  onClose,
  onTradeApplied,
  onOpenRonda,
}: Props) {
  const [step, setStep] = useState<Step>('menu');
  const [myCode, setMyCode] = useState('');
  const [proposal, setProposal] = useState<TradeProposal | null>(null);
  const [shareText, setShareText] = useState('');
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  // Devuelve un mensaje de error para el escáner, o null si el código sirvió.
  const applyScannedCode = async (code: string): Promise<string | null> => {
    try {
      const decoded = await decodeCollection(code.trim(), album);
      setProposal(matchTrade(album, collection, decoded));
      setStep('proposal');
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : t.trade.invalidCode;
    }
  };

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
    setShareText('');
    setCopied(false);
    setStep('menu');
  };

  // Comparte la lista (repetidas o faltantes) con el share sheet nativo;
  // si no está disponible o el usuario cancela, muestra el texto para copiar.
  const startShare = async (kind: ShareListKind) => {
    const text = formatShareList(album, collection, kind, locale);
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
        <h1 className="text-xl font-bold">{t.trade.title}</h1>
        <button onClick={onClose} className={buttonClass}>
          {t.trade.close}
        </button>
      </div>

      {step === 'menu' ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm opacity-70">{t.trade.menuIntro}</p>
          <button onClick={() => setStep('showCode')} className={primaryButtonClass}>
            {t.trade.showMyCode}
          </button>
          <button onClick={() => setStep('scan')} className={buttonClass}>
            {t.trade.scanFriendCode}
          </button>
          <button onClick={onOpenRonda} className={buttonClass}>
            {t.ronda.menuButton}
          </button>
          <hr className="my-1 border-t opacity-30" />
          <p className="text-sm opacity-70">{t.trade.shareIntro}</p>
          <button onClick={() => void startShare('duplicates')} className={buttonClass}>
            {t.trade.shareDuplicates(stats.duplicates)}
          </button>
          <button onClick={() => void startShare('missing')} className={buttonClass}>
            {t.trade.shareMissing(stats.missing)}
          </button>
        </div>
      ) : null}

      {step === 'showCode' ? (
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm opacity-70">{t.trade.showCodeInstructions}</p>
          <canvas ref={canvasRef} className="rounded-lg border" />
          <details className="w-full">
            <summary className="cursor-pointer text-sm opacity-70">{t.trade.textFallbackSummary}</summary>
            <textarea
              readOnly
              value={myCode}
              className="mt-2 h-24 w-full rounded-lg border bg-transparent p-2 text-xs"
              onFocus={(e) => e.currentTarget.select()}
            />
          </details>
          <button onClick={reset} className={buttonClass}>
            {t.trade.back}
          </button>
        </div>
      ) : null}

      {step === 'scan' ? (
        <div className="flex flex-col gap-3">
          <CodeScanner t={t} onDetected={applyScannedCode} />
          <button onClick={reset} className={buttonClass}>
            {t.trade.back}
          </button>
        </div>
      ) : null}

      {step === 'shareText' ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm opacity-70">{t.trade.shareTextInstructions}</p>
          <textarea
            readOnly
            value={shareText}
            className="h-72 w-full rounded-lg border bg-transparent p-2 text-xs"
            onFocus={(e) => e.currentTarget.select()}
          />
          <button onClick={() => void copyShareText()} className={primaryButtonClass}>
            {copied ? t.trade.copied : t.trade.copy}
          </button>
          <button onClick={reset} className={buttonClass}>
            {t.trade.back}
          </button>
        </div>
      ) : null}

      {step === 'proposal' && proposal ? (
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="mb-2 font-semibold text-amber-600 dark:text-amber-400">
              {t.trade.youGive(proposal.aGives.length)}
            </h2>
            {proposal.aGives.length === 0 ? (
              <p className="text-sm opacity-70">{t.trade.noDuplicatesTheyNeed}</p>
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
              {t.trade.youReceive(proposal.bGives.length)}
            </h2>
            {proposal.bGives.length === 0 ? (
              <p className="text-sm opacity-70">{t.trade.friendHasNothing}</p>
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
            <p className="text-sm opacity-70">{t.trade.noTradePossible}</p>
          ) : (
            <button onClick={() => void confirmTrade()} className={primaryButtonClass}>
              {t.trade.confirmTrade}
            </button>
          )}
          <button onClick={reset} className={buttonClass}>
            {t.trade.cancel}
          </button>
        </div>
      ) : null}

      {step === 'done' ? (
        <div className="flex flex-col gap-3">
          <p>{t.trade.done}</p>
          <p className="text-sm opacity-70">{t.trade.doneInstructions}</p>
          <button onClick={() => setStep('showCode')} className={primaryButtonClass}>
            {t.trade.showMyCode}
          </button>
          <button onClick={onClose} className={buttonClass}>
            {t.trade.backToAlbum}
          </button>
        </div>
      ) : null}
    </div>
  );
}
