"use client";

import { useState, useEffect, type ButtonHTMLAttributes, type ReactNode } from "react";
import { CHARACTER_ART, SCENE_ART, type CharacterArtId, type SceneId, assertCharacterSet, isDevMissingArt } from "../../game/assets";

type SceneProps = {
  id: SceneId;
  className?: string;
  children?: ReactNode;
};

export function SceneBackground({ id, className = "", children }: SceneProps) {
  const art = SCENE_ART[id];
  const [failed, setFailed] = useState(false);
  return (
    <div className={`scene-bg ${className}`} data-scene={id}>
      {!failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className="scene-bg-img"
          src={art.src}
          alt={art.alt}
          draggable={false}
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="scene-bg-fallback" aria-hidden />
      )}
      {failed && isDevMissingArt() && (
        <span className="missing-art-badge">Missing scene: {id}</span>
      )}
      <div className="scene-bg-content">{children}</div>
    </div>
  );
}

type SpriteProps = {
  id: CharacterArtId;
  className?: string;
  size?: number;
  pose?: "idle" | "celebrate" | "tap";
  title?: string;
};

export function CharacterSprite({ id, className = "", size = 120, pose = "idle", title }: SpriteProps) {
  const art = CHARACTER_ART[id];
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (import.meta.env.DEV) {
      try {
        assertCharacterSet(art, `CharacterSprite/${id}`);
      } catch (e) {
        console.error(e);
      }
    }
  }, [art, id]);

  if (!art) {
    if (import.meta.env.DEV) {
      return <span className="missing-art-badge">Missing cast sprite: {id}</span>;
    }
    return null;
  }

  return (
    <span
      className={`character-sprite pose-${pose} ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={title || art.alt}
      data-character-set={art.characterSetVersion}
    >
      {!failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={art.src}
          alt=""
          draggable={false}
          onError={() => {
            setFailed(true);
            if (import.meta.env.DEV) {
              console.error(`[AriaGarden] Failed to load ${art.src}. No SVG/emoji fallback.`);
            }
          }}
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      ) : import.meta.env.DEV ? (
        <span className="missing-art-badge">Broken: {id}</span>
      ) : null}
    </span>
  );
}

type TouchProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  minPx?: number;
};

export function TouchSafeButton({ minPx = 88, className = "", children, ...rest }: TouchProps) {
  return (
    <button
      type="button"
      className={`touch-safe-btn ${className}`}
      style={{ minWidth: minPx, minHeight: minPx }}
      {...rest}
    >
      {children}
    </button>
  );
}

export function CelebrationEffect({
  kind = "petals",
  active,
}: {
  kind?: "petals" | "splash" | "sparkle";
  active: boolean;
}) {
  if (!active) return null;
  return (
    <div className={`celebration-fx kind-${kind}`} aria-hidden>
      <span /><span /><span /><span /><span /><span />
    </div>
  );
}

export function SpokenPrompt({
  en,
  es,
  onReplay,
}: {
  en: string;
  es: string;
  onReplay: () => void;
}) {
  return (
    <div className="spoken-prompt-bar">
      <p className="spoken-prompt-text" aria-live="polite">
        <span>{en}</span>
        <span aria-hidden> · </span>
        <span>{es}</span>
      </p>
      <TouchSafeButton className="replay-chip" onClick={onReplay} aria-label="Replay" minPx={72}>
        <svg viewBox="0 0 48 48" width="36" height="36" aria-hidden>
          <circle cx="24" cy="24" r="22" fill="#fff4c8" stroke="#fff" strokeWidth="3" />
          <path d="M16 20v8h6l8 6V14l-8 6h-6z" fill="#5a4a70" />
        </svg>
      </TouchSafeButton>
    </div>
  );
}

export function ChildGameControls({
  onHome,
  onReplay,
}: {
  onHome: () => void;
  onReplay?: () => void;
}) {
  return (
    <div className="child-game-controls">
      <TouchSafeButton className="home-chip" onClick={onHome} aria-label="Home">
        <svg viewBox="0 0 48 48" width="36" height="36" aria-hidden>
          <circle cx="24" cy="24" r="22" fill="#fff4c8" stroke="#fff" strokeWidth="3" />
          <path d="M24 12l12 10v12h-8v-8h-8v8h-8V22z" fill="#5a4a70" />
        </svg>
      </TouchSafeButton>
      {onReplay && (
        <TouchSafeButton className="replay-chip" onClick={onReplay} aria-label="Replay">
          <svg viewBox="0 0 48 48" width="36" height="36" aria-hidden>
            <circle cx="24" cy="24" r="22" fill="#fff4c8" stroke="#fff" strokeWidth="3" />
            <path d="M16 20v8h6l8 6V14l-8 6h-6z" fill="#5a4a70" />
          </svg>
        </TouchSafeButton>
      )}
    </div>
  );
}
