"use client";

import type { ParentSettings } from "../types/game";
import { isNaturalVoice } from "../lib/voiceSelect";

type Props = {
  settings: ParentSettings;
  enVoices: SpeechSynthesisVoice[];
  esVoices: SpeechSynthesisVoice[];
  selectedEn: SpeechSynthesisVoice | null;
  selectedEs: SpeechSynthesisVoice | null;
  naturalAvailable: boolean;
  onChange: (patch: Partial<ParentSettings>) => void;
  onPreviewEn: () => void;
  onPreviewEs: () => void;
  onResetCollection: () => void;
  onClose: () => void;
};

export function ParentSettingsPanel({
  settings,
  enVoices,
  esVoices,
  selectedEn,
  selectedEs,
  naturalAvailable,
  onChange,
  onPreviewEn,
  onPreviewEs,
  onResetCollection,
  onClose,
}: Props) {
  return (
    <div className="parent-overlay" role="dialog" aria-label="Parent settings">
      <section className="parent-panel card">
        <p className="eyebrow">Parent settings</p>
        <h2>Garden Care</h2>
        <p className="intro small">
          Hidden from little hands. Hold the flower for 2 seconds to open.
        </p>

        <div className={`voice-status ${naturalAvailable ? "natural" : "device"}`}>
          {naturalAvailable ? "Natural voice available" : "Using device voice"}
        </div>

        <div className="voice-selected">
          <p>
            <strong>English:</strong> {selectedEn?.name ?? "Not detected yet"}
            {selectedEn ? ` (${selectedEn.lang})` : ""}
            {isNaturalVoice(selectedEn) ? " · Natural" : ""}
          </p>
          <p>
            <strong>Spanish:</strong> {selectedEs?.name ?? "Not detected yet"}
            {selectedEs ? ` (${selectedEs.lang})` : ""}
            {isNaturalVoice(selectedEs) ? " · Natural" : ""}
          </p>
        </div>

        <label className="setting-row stack">
          <span>Spoken language</span>
          <select
            value={settings.languageMode ?? "both"}
            onChange={(e) =>
              onChange({
                languageMode: e.target.value as "en" | "es" | "both",
              })
            }
          >
            <option value="both">English + Spanish</option>
            <option value="en">English only</option>
            <option value="es">Spanish only</option>
          </select>
        </label>

        <label className="setting-row">
          <span>Speech</span>
          <input
            type="checkbox"
            checked={settings.speechOn}
            onChange={(e) => onChange({ speechOn: e.target.checked })}
          />
        </label>
        <label className="setting-row">
          <span>Music &amp; sounds</span>
          <input
            type="checkbox"
            checked={settings.musicOn}
            onChange={(e) => onChange({ musicOn: e.target.checked })}
          />
        </label>
        <label className="setting-row stack">
          <span>Speech volume</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={settings.speechVolume}
            onChange={(e) => onChange({ speechVolume: Number(e.target.value) })}
          />
        </label>
        <label className="setting-row stack">
          <span>Music volume</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={settings.musicVolume}
            onChange={(e) => onChange({ musicVolume: Number(e.target.value) })}
          />
        </label>

        <label className="setting-row stack">
          <span>English voice</span>
          <select
            value={settings.enVoiceURI ?? ""}
            onChange={(e) => onChange({ enVoiceURI: e.target.value || null })}
          >
            <option value="">Auto (best natural voice)</option>
            {enVoices.map((v) => (
              <option key={v.voiceURI} value={v.voiceURI}>
                {v.name} ({v.lang}){isNaturalVoice(v) ? " ★" : ""}
              </option>
            ))}
          </select>
        </label>
        <div className="setting-actions">
          <button type="button" className="play mini" onClick={onPreviewEn}>
            Preview English
          </button>
        </div>

        <label className="setting-row stack">
          <span>Spanish voice (Mexico preferred)</span>
          <select
            value={settings.esVoiceURI ?? ""}
            onChange={(e) => onChange({ esVoiceURI: e.target.value || null })}
          >
            <option value="">Auto (best natural voice)</option>
            {esVoices.map((v) => (
              <option key={v.voiceURI} value={v.voiceURI}>
                {v.name} ({v.lang}){isNaturalVoice(v) ? " ★" : ""}
              </option>
            ))}
          </select>
        </label>
        <div className="setting-actions">
          <button type="button" className="play mini" onClick={onPreviewEs}>
            Preview Spanish
          </button>
        </div>

        <p className="intro small">
          Tip: On Windows, Edge often offers Microsoft Ava / Jenny / Dalia Online (Natural)
          voices. Recorded clips in <code>public/audio/voice/</code> always sound best.
        </p>

        <section className="install-guide" aria-label="Install on a phone">
          <h3>Install on a phone • Instalar en el teléfono</h3>
          <p>
            After opening the game once online, you can install it like an app and play
            offline. Aria&apos;s garden friends stay saved on this device.
          </p>
          <ul>
            <li>
              <strong>iPhone / iPad:</strong> Open in <em>Safari</em> → tap{" "}
              <em>Share</em> → <em>Add to Home Screen</em>
            </li>
            <li>
              <strong>Android:</strong> Open in <em>Chrome</em> → tap the menu (⋮) →{" "}
              <em>Install app</em> or <em>Add to Home screen</em>
            </li>
            <li>
              <strong>Windows:</strong> In Edge/Chrome, use the install icon in the address
              bar, or the Desktop Play shortcut for the local game.
            </li>
          </ul>
        </section>

        <div className="danger-zone">
          <button
            type="button"
            className="play secondary mini"
            onClick={() => {
              if (
                typeof window !== "undefined" &&
                window.confirm("Reset Aria's garden friends collection?")
              ) {
                onResetCollection();
              }
            }}
          >
            Reset collection
          </button>
        </div>

        <button type="button" className="play" onClick={onClose}>
          Done
        </button>
      </section>
    </div>
  );
}
