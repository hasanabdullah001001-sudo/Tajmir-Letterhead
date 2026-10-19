import React, { useEffect, useRef, useCallback } from 'react';

interface TajmirLogoProps {
  variant: number; // 0, 1, or 2
  onSwitchLogo?: () => void;
  height?: number; // Target rendered height, defaults to 90px
}

const DESIGN_SPECS = [
  { width: 973, height: 293 },  // Logo 1
  { width: 1024, height: 273 }, // Logo 2
  { width: 1024, height: 271 }, // Logo 3
];

export const TajmirLogo: React.FC<TajmirLogoProps> = ({
  variant = 0,
  onSwitchLogo,
  height = 90,
}) => {
  const activeVariant = ((variant % 3) + 3) % 3;
  const currentSpec = DESIGN_SPECS[activeVariant];
  const scale = height / currentSpec.height;
  const containerWidth = currentSpec.width * scale;
  const containerHeight = height;

  const switcherRef = useRef<HTMLDivElement>(null);

  const baselineOffset = (el: HTMLElement, s: number) => {
    const probe = document.createElement('span');
    probe.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
    el.appendChild(probe);
    const off = (probe.getBoundingClientRect().top - el.getBoundingClientRect().top) / (s || 1);
    el.removeChild(probe);
    return off;
  };

  const fitLogos = useCallback(() => {
    const root = switcherRef.current;
    if (!root) return;

    const currentScale = scale || 1;

    root.querySelectorAll<HTMLElement>('.tl').forEach((el) => {
      if (el.dataset.edited === '1') return; /* never resize text the user has typed */

      if (el.dataset.w) {
        el.style.fontSize = '100px';
        const w = el.getBoundingClientRect().width / currentScale;
        if (w > 0) {
          el.style.fontSize = (100 * parseFloat(el.dataset.w) / w) + 'px';
        }
      } else if (el.dataset.fs) {
        el.style.fontSize = el.dataset.fs + 'px';
      }

      el.style.top = '0px';
      if (el.dataset.base) {
        const off = baselineOffset(el, currentScale);
        el.style.top = (parseFloat(el.dataset.base) - off) + 'px';
      }
    });
  }, [scale]);

  useEffect(() => {
    const ready = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
    ready.then(() => {
      fitLogos();
    });
    fitLogos();
  }, [fitLogos, activeVariant]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      (e.currentTarget as HTMLElement).blur();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLSpanElement>) => {
    e.preventDefault();
    const text = (e.clipboardData || (window as any).clipboardData).getData('text').replace(/\s+/g, ' ');
    document.execCommand('insertText', false, text);
  };

  const handleInput = (e: React.FormEvent<HTMLSpanElement>) => {
    (e.currentTarget as HTMLElement).dataset.edited = '1';
  };

  const handleShieldClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSwitchLogo) {
      onSwitchLogo();
    }
  };

  const handleShieldKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      if (onSwitchLogo) {
        onSwitchLogo();
      }
    }
  };

  return (
    <div
      className="tajmir-logo-wrapper"
      style={{
        position: 'relative',
        width: `${containerWidth}px`,
        height: `${containerHeight}px`,
        flexShrink: 0,
      }}
    >
      <div
        id="tajmirSwitcher"
        ref={switcherRef}
        className="tajmir-switcher"
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: `${currentSpec.width}px`,
          height: `${currentSpec.height}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'top right',
          background: 'transparent',
        }}
      >
        {/* Logo 1 */}
        <div className={`tajmir-logo logo-1 ${activeVariant === 0 ? 'is-active' : ''}`} style={{ background: 'transparent' }}>
          <img
            className="tajmir-logo__icon"
            src="/logo_1.png"
            alt="Logo 1"
            role="button"
            tabIndex={0}
            title="Click to see the next logo"
            onClick={handleShieldClick}
            onKeyDown={handleShieldKeyDown}
            crossOrigin="anonymous"
            draggable={false}
          />
          <span
            className="tl tl--title"
            contentEditable
            suppressContentEditableWarning
            spellCheck={false}
            data-w="663"
            data-base="108"
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
          >
            TAJMIR GLOBAL
          </span>
          <span
            className="tl tl--sub"
            contentEditable
            suppressContentEditableWarning
            spellCheck={false}
            data-w="566"
            data-base="185"
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
          >
            CORPORATION
          </span>
          <span
            className="tl tl--tag"
            contentEditable
            suppressContentEditableWarning
            spellCheck={false}
            data-w="553"
            data-base="246"
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
          >
            A Concern of Tajmir Group
          </span>
        </div>

        {/* Logo 2 */}
        <div className={`tajmir-logo logo-2 ${activeVariant === 1 ? 'is-active' : ''}`} style={{ background: 'transparent' }}>
          <img
            className="tajmir-logo__icon"
            src="/logo_2.png"
            alt="Logo 2"
            role="button"
            tabIndex={0}
            title="Click to see the next logo"
            onClick={handleShieldClick}
            onKeyDown={handleShieldKeyDown}
            crossOrigin="anonymous"
            draggable={false}
          />
          <div className="tajmir-logo__divider" />
          <span
            className="tl tl--title"
            contentEditable
            suppressContentEditableWarning
            spellCheck={false}
            data-w="689"
            data-base="123"
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
          >
            TAJMIR GLOBAL CORPORATION
          </span>
          <span
            className="tl tl--tag"
            contentEditable
            suppressContentEditableWarning
            spellCheck={false}
            data-w="464"
            data-base="181"
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
          >
            A Concern of Tajmir Group
          </span>
        </div>

        {/* Logo 3 */}
        <div className={`tajmir-logo logo-3 ${activeVariant === 2 ? 'is-active' : ''}`} style={{ background: 'transparent' }}>
          <img
            className="tajmir-logo__icon"
            src="/logo_3.png"
            alt="Logo 3"
            role="button"
            tabIndex={0}
            title="Click to see the next logo"
            onClick={handleShieldClick}
            onKeyDown={handleShieldKeyDown}
            crossOrigin="anonymous"
            draggable={false}
          />
          <div className="tajmir-logo__divider" />
          <span
            className="tl tl--title"
            contentEditable
            suppressContentEditableWarning
            spellCheck={false}
            data-w="672"
            data-base="87"
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
          >
            TAJMIR GLOBAL
          </span>
          <span
            className="tl tl--sub"
            contentEditable
            suppressContentEditableWarning
            spellCheck={false}
            data-w="450"
            data-base="169"
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
          >
            CORPORATION
          </span>
          <span
            className="tl tl--tag"
            contentEditable
            suppressContentEditableWarning
            spellCheck={false}
            data-fs="44.6"
            data-base="235"
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
          >
            A Concern of Tajmir Group
          </span>
        </div>
      </div>
    </div>
  );
};
