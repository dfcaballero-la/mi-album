/**
 * Ronda de intercambio (v2.3): varias personas presentes suman sus códigos y
 * la app encuentra círculos de trueque (3+) que destraban intercambios
 * imposibles de a dos. Todo offline: se coordina en persona.
 */
import { useMemo, useState } from 'react';
import type { AlbumDefinition, Collection, TradeCircle } from '@core/types';
import type { Translations } from '@core/i18n';
import { decodeCollection } from '@core/codec';
import { findTradeCircles, type Participant } from '@core/trade-circles';
import { getCollection, setStickerCount } from '@data/db';
import CodeScanner from './CodeScanner';

interface RondaParticipant {
  id: string;
  name: string;
  collection: Collection;
}

interface Props {
  album: AlbumDefinition;
  collection: Collection;
  t: Translations;
  onClose: () => void;
  onCollectionChanged: () => void;
}

const buttonClass = 'rounded-lg border px-3 py-1.5 text-sm font-medium';
const primaryButtonClass = 'rounded-lg border border-sky-500 bg-sky-500/15 px-3 py-1.5 text-sm font-medium';
const YOU = 'you';

export default function RondaScreen({ album, collection, t, onClose, onCollectionChanged }: Props) {
  const [participants, setParticipants] = useState<RondaParticipant[]>(() => [
    { id: YOU, name: t.ronda.you, collection },
  ]);
  const [friendCounter, setFriendCounter] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [confirmed, setConfirmed] = useState<Set<string>>(new Set());

  const nameOf = (id: string): string =>
    id === YOU ? t.ronda.you : (participants.find((p) => p.id === id)?.name ?? id);

  const circles = useMemo<TradeCircle[]>(() => {
    if (participants.length < 3) return [];
    const input: Participant[] = participants.map((p) => ({ id: p.id, collection: p.collection }));
    return findTradeCircles(album, input);
  }, [album, participants]);

  const addFriend = async (code: string): Promise<string | null> => {
    try {
      const decoded = await decodeCollection(code.trim(), album);
      const n = friendCounter + 1;
      setFriendCounter(n);
      setParticipants((prev) => [...prev, { id: `f${n}`, name: t.ronda.friendDefaultName(n), collection: decoded }]);
      setScanning(false);
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : t.trade.invalidCode;
    }
  };

  const renameFriend = (id: string, name: string) => {
    setParticipants((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)));
  };

  const removeFriend = (id: string) => {
    setParticipants((prev) => prev.filter((p) => p.id !== id));
  };

  // Aplica SOLO mi parte del círculo a mi colección local (entrego una repetida,
  // recibo la que me faltaba). Lee del DB por si ya confirmé otro círculo.
  const confirmMyPart = async (circle: TradeCircle, key: string) => {
    const myGive = circle.steps.find((s) => s.from === YOU);
    const myGet = circle.steps.find((s) => s.to === YOU);
    const fresh = await getCollection(album.id);
    if (myGive) {
      const current = fresh.ownedCounts[myGive.sticker.index] ?? 0;
      await setStickerCount(album.id, myGive.sticker.index, Math.max(0, current - 1));
    }
    if (myGet && (fresh.ownedCounts[myGet.sticker.index] ?? 0) === 0) {
      await setStickerCount(album.id, myGet.sticker.index, 1);
    }
    onCollectionChanged();
    setConfirmed((prev) => new Set(prev).add(key));
  };

  const namePill = (id: string) => (
    <span
      className={[
        'rounded-full border px-2 py-0.5 text-xs font-medium',
        id === YOU && 'border-sky-500 bg-sky-500/15',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {nameOf(id)}
    </span>
  );

  return (
    <div className="mx-auto max-w-2xl p-4 pb-24">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">{t.ronda.title}</h1>
        <button onClick={onClose} className={buttonClass}>
          {t.trade.close}
        </button>
      </div>

      {scanning ? (
        <div className="flex flex-col gap-3">
          <CodeScanner t={t} onDetected={addFriend} />
          <button onClick={() => setScanning(false)} className={buttonClass}>
            {t.trade.back}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <p className="text-sm opacity-70">{t.ronda.intro}</p>

          <section>
            <h2 className="mb-2 font-semibold">{t.ronda.participants(participants.length)}</h2>
            <ul className="flex flex-col gap-2">
              {participants.map((p) => (
                <li key={p.id} className="flex items-center gap-2">
                  {p.id === YOU ? (
                    <span className="flex-1 rounded-lg border border-sky-500 bg-sky-500/15 px-3 py-1.5 text-sm font-medium">
                      {t.ronda.you}
                    </span>
                  ) : (
                    <>
                      <input
                        value={p.name}
                        onChange={(e) => renameFriend(p.id, e.target.value)}
                        aria-label={t.ronda.namePlaceholder}
                        placeholder={t.ronda.namePlaceholder}
                        className="flex-1 rounded-lg border bg-transparent px-3 py-1.5 text-sm"
                      />
                      <button onClick={() => removeFriend(p.id)} className={buttonClass}>
                        {t.ronda.remove}
                      </button>
                    </>
                  )}
                </li>
              ))}
            </ul>
            <button onClick={() => setScanning(true)} className={`mt-2 ${primaryButtonClass}`}>
              {t.ronda.addFriend}
            </button>
          </section>

          <section>
            {participants.length < 3 ? (
              <p className="text-sm opacity-70">{t.ronda.needMore}</p>
            ) : circles.length === 0 ? (
              <p className="text-sm opacity-70">{t.ronda.noCircles}</p>
            ) : (
              <>
                <h2 className="mb-2 font-semibold">{t.ronda.circles(circles.length)}</h2>
                <p className="mb-3 text-sm opacity-70">{t.ronda.coordinate}</p>
                <ul className="flex flex-col gap-3">
                  {circles.map((circle, i) => {
                    const key = String(i);
                    const myGive = circle.steps.find((s) => s.from === YOU);
                    const myGet = circle.steps.find((s) => s.to === YOU);
                    const isDone = confirmed.has(key);
                    return (
                      <li key={key} className="rounded-lg border p-3">
                        {myGive && myGet ? (
                          <p className="mb-2 text-sm font-medium text-sky-600 dark:text-sky-400">
                            {t.ronda.youSummary(myGive.sticker.code, myGet.sticker.code)}
                          </p>
                        ) : null}
                        <ul className="flex flex-col gap-1.5">
                          {circle.steps.map((step, k) => (
                            <li key={k} className="flex flex-wrap items-center gap-1.5 text-sm">
                              {namePill(step.from)}
                              <span className="opacity-60">{t.ronda.gives}</span>
                              <span className="rounded border border-amber-500 bg-amber-500/15 px-1.5 py-0.5 text-xs font-medium">
                                {step.sticker.code}
                              </span>
                              <span className="opacity-60">{t.ronda.to}</span>
                              {namePill(step.to)}
                            </li>
                          ))}
                        </ul>
                        {myGive && myGet ? (
                          <button
                            onClick={() => void confirmMyPart(circle, key)}
                            disabled={isDone}
                            className={[isDone ? buttonClass : primaryButtonClass, 'mt-3', isDone && 'opacity-70']
                              .filter(Boolean)
                              .join(' ')}
                          >
                            {isDone ? t.ronda.confirmedMyPart : t.ronda.confirmMyPart}
                          </button>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
