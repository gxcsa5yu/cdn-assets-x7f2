document.addEventListener('DOMContentLoaded', function () {
  const ta = document.getElementById('tpx-stg-input');
  const grid = document.getElementById('tpx-stg-fonts-grid');
  const announcer = document.getElementById('tpx-stg-sr-announcer');

  // Only these keys render live on every keystroke (the ones visible by default,
  // before "Show More Styles" is expanded). Hidden styles are computed once,
  // the moment that section is revealed — not on every keystroke while unseen.
  const DEFAULT_VISIBLE_KEYS = ['smallcaps', 'superscript', 'subscript'];
  let extraStylesRevealed = false;

  /* ---------- Show More Styles toggle ---------- */
  const moreStylesToggle = document.getElementById('tpx-stg-more-styles-toggle');
  const extraStyles = document.getElementById('tpx-stg-extra-styles');
  if (moreStylesToggle && extraStyles) {
    const moreStylesText = moreStylesToggle.querySelector('.tpx-stg-more-styles-text');
    moreStylesToggle.addEventListener('click', function () {
      const isExpanded = moreStylesToggle.getAttribute('aria-expanded') === 'true';
      moreStylesToggle.setAttribute('aria-expanded', String(!isExpanded));
      extraStyles.hidden = isExpanded;
      if (moreStylesText) {
        moreStylesText.textContent = isExpanded ? 'Show More Styles' : 'Show Less Styles';
      }
      if (!isExpanded && !extraStylesRevealed) {
        extraStylesRevealed = true;
        const text = ta.value;
        const hiddenKeys = Object.keys(STYLE_FNS).filter(function (k) {
          return DEFAULT_VISIBLE_KEYS.indexOf(k) === -1;
        });
        renderKeys(hiddenKeys, text, text.trim() === '');
      }
    });
  }

  /* =========================================================
     CONVERSION ENGINE — the only reason JS exists here: turning
     typed text into unicode-mapped glyph variants. There's no
     CSS/HTML way to remap characters, so this part must be JS.
     The card markup itself is now static HTML above; JS only
     fills in text content and wires up interactions.
     ========================================================= */

  function mapContiguous(text, upperBase, lowerBase, digitBase, exceptions) {
    let out = '';
    for (const ch of text) {
      if (exceptions && exceptions[ch] !== undefined) { out += exceptions[ch]; continue; }
      const code = ch.charCodeAt(0);
      if (ch >= 'A' && ch <= 'Z') out += String.fromCodePoint(upperBase + (code - 65));
      else if (ch >= 'a' && ch <= 'z') out += String.fromCodePoint(lowerBase + (code - 97));
      else if (digitBase !== null && ch >= '0' && ch <= '9') out += String.fromCodePoint(digitBase + (code - 48));
      else out += ch;
    }
    return out;
  }

  function mapLookup(text, table) {
    let out = '';
    for (const ch of text) {
      const lower = ch.toLowerCase();
      if (table[ch] !== undefined) out += table[ch];
      else if (table[lower] !== undefined) out += table[lower];
      else out += ch;
    }
    return out;
  }

  // ---- Lookup tables ----
  const SMALLCAPS = { a:'ᴀ',b:'ʙ',c:'ᴄ',d:'ᴅ',e:'ᴇ',f:'ꜰ',g:'ɢ',h:'ʜ',i:'ɪ',j:'ᴊ',k:'ᴋ',l:'ʟ',m:'ᴍ',n:'ɴ',o:'ᴏ',p:'ᴘ',q:'ꞯ',r:'ʀ',s:'ꜱ',t:'ᴛ',u:'ᴜ',v:'ᴠ',w:'ᴡ',y:'ʏ',z:'ᴢ' };

  const SUPERSCRIPT = { a:'ᵃ',b:'ᵇ',c:'ᶜ',d:'ᵈ',e:'ᵉ',f:'ᶠ',g:'ᵍ',h:'ʰ',i:'ⁱ',j:'ʲ',k:'ᵏ',l:'ˡ',m:'ᵐ',n:'ⁿ',o:'ᵒ',p:'ᵖ',r:'ʳ',s:'ˢ',t:'ᵗ',u:'ᵘ',v:'ᵛ',w:'ʷ',x:'ˣ',y:'ʸ',z:'ᶻ',
    '0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹','+':'⁺','-':'⁻','=':'⁼','(':'⁽',')':'⁾' };

  const SUBSCRIPT = { a:'ₐ',e:'ₑ',h:'ₕ',i:'ᵢ',j:'ⱼ',k:'ₖ',l:'ₗ',m:'ₘ',n:'ₙ',o:'ₒ',p:'ₚ',r:'ᵣ',s:'ₛ',t:'ₜ',u:'ᵤ',v:'ᵥ',x:'ₓ',
    '0':'₀','1':'₁','2':'₂','3':'₃','4':'₄','5':'₅','6':'₆','7':'₇','8':'₈','9':'₉','+':'₊','-':'₋','=':'₌','(':'₍',')':'₎' };

  const UPSIDE_LOWER = { a:'ɐ',b:'q',c:'ɔ',d:'p',e:'ǝ',f:'ɟ',g:'ƃ',h:'ɥ',i:'ᴉ',j:'ɾ',k:'ʞ',l:'l',m:'ɯ',n:'u',o:'o',p:'d',q:'b',r:'ɹ',s:'s',t:'ʇ',u:'n',v:'ʌ',w:'ʍ',x:'x',y:'ʎ',z:'z' };
  const UPSIDE_UPPER = { A:'∀',B:'𐐒',C:'Ɔ',D:'ᗡ',E:'Ǝ',F:'Ⅎ',G:'⅁',H:'H',I:'I',J:'ſ',K:'ʞ',L:'˥',M:'W',N:'N',O:'O',P:'Ԁ',Q:'Q',R:'ᴚ',S:'S',T:'⊥',U:'∩',V:'Λ',W:'M',X:'X',Y:'⅄',Z:'Z' };
  const UPSIDE_OTHER = { '0':'0','1':'Ɩ','2':'ᄅ','3':'Ɛ','4':'ㄣ','5':'ϛ','6':'9','7':'ㄥ','8':'8','9':'6','.':'˙',',':"'",'?':'¿','!':'¡',"'":',','"':'„','(' :')',')':'(','[':']',']':'[','{':'}','}':'{','<':'>','>':'<','&':'⅋','_':'‾' };

  function upsideDown(text) {
    let out = '';
    for (const ch of text) {
      if (UPSIDE_LOWER[ch]) out += UPSIDE_LOWER[ch];
      else if (UPSIDE_UPPER[ch]) out += UPSIDE_UPPER[ch];
      else if (UPSIDE_OTHER[ch]) out += UPSIDE_OTHER[ch];
      else out += ch;
    }
    return out.split('').reverse().join('');
  }

  function bubbles(text) {
    let out = '';
    for (const ch of text) {
      const code = ch.charCodeAt(0);
      if (ch >= 'A' && ch <= 'Z') out += String.fromCodePoint(0x24B6 + (code - 65));
      else if (ch >= 'a' && ch <= 'z') out += String.fromCodePoint(0x24D0 + (code - 97));
      else if (ch === '0') out += '⓪';
      else if (ch >= '1' && ch <= '9') out += String.fromCodePoint(0x2460 + (code - 49));
      else out += ch;
    }
    return out;
  }

  function darkBubbles(text) {
    let out = '';
    for (const ch of text) {
      const up = ch.toUpperCase();
      const code = up.charCodeAt(0);
      if (up >= 'A' && up <= 'Z') out += String.fromCodePoint(0x1F150 + (code - 65));
      else if (ch >= '1' && ch <= '9') out += String.fromCodePoint(0x2775 + (ch.charCodeAt(0) - 48));
      else out += ch;
    }
    return out;
  }

  function lightSquares(text) {
    let out = '';
    for (const ch of text) {
      const up = ch.toUpperCase();
      const code = up.charCodeAt(0);
      if (up >= 'A' && up <= 'Z') out += String.fromCodePoint(0x1F130 + (code - 65));
      else out += ch;
    }
    return out;
  }

  function darkSquares(text) {
    let out = '';
    for (const ch of text) {
      const up = ch.toUpperCase();
      const code = up.charCodeAt(0);
      if (up >= 'A' && up <= 'Z') out += String.fromCodePoint(0x1F170 + (code - 65));
      else out += ch;
    }
    return out;
  }

  function upAndDown(text) {
    let out = '';
    let i = 0;
    for (const ch of text) {
      if (/\s/.test(ch)) { out += ch; continue; }
      out += ch + (i % 2 === 0 ? '\u0332' : '\u0305');
      i++;
    }
    return out;
  }

  const FUNKY_MARKS = ['\u0301','\u0300','\u0311','\u0330','\u0303'];
  function funky(text) {
    let out = '';
    let i = 0;
    for (const ch of text) {
      if (/\s/.test(ch)) { out += ch; continue; }
      out += ch + FUNKY_MARKS[i % FUNKY_MARKS.length] + FUNKY_MARKS[(i + 2) % FUNKY_MARKS.length];
      i++;
    }
    return out;
  }

  // ---- Style registry: maps each card's data-key to its conversion function.
  // Card markup (name/safety dot/layout) lives in the static HTML above —
  // this object only supplies the transform logic. ----
  const STYLE_FNS = {
    bold:        t => mapContiguous(t, 0x1D400, 0x1D41A, 0x1D7CE, {}),
    smallcaps:   t => mapLookup(t, SMALLCAPS),
    smalltext:   t => mapLookup(t, SUPERSCRIPT),
    upsidedown:  upsideDown,
    backwards:   t => t.split('').reverse().join(''),
    superscript: t => mapLookup(t, SUPERSCRIPT),
    subscript:   t => mapLookup(t, SUBSCRIPT),
    monoupper:   t => mapContiguous(t, 0x1D670, 0x1D68A, 0x1D7F6, {}),
    mathsans:    t => mapContiguous(t, 0x1D5A0, 0x1D5BA, 0x1D7E2, {}),
    mathstyle:   t => mapContiguous(t, 0x1D434, 0x1D44E, null, { h:'ℎ' }),
    bubbles:     bubbles,
    darkbubbles: darkBubbles,
    lightsq:     lightSquares,
    darksq:      darkSquares,
    updown:      upAndDown,
    funky:       funky,
    flourish:    t => mapContiguous(t, 0x1D4D0, 0x1D4EA, null, {}),
    fraktur:     t => mapContiguous(t, 0x1D504, 0x1D51E, null, { C:'ℭ', H:'ℌ', I:'ℑ', R:'ℜ', Z:'ℨ' }),
    script:      t => mapContiguous(t, 0x1D49C, 0x1D4B6, null, { B:'ℬ', E:'ℰ', F:'ℱ', H:'ℋ', I:'ℐ', L:'ℒ', M:'ℳ', R:'ℛ', e:'ℯ', g:'ℊ', o:'ℴ' })
  };

  const ICON_COPY  = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M7 7m0 2.667a2.667 2.667 0 0 1 2.667 -2.667h8.666a2.667 2.667 0 0 1 2.667 2.667v8.666a2.667 2.667 0 0 1 -2.667 2.667h-8.666a2.667 2.667 0 0 1 -2.667 -2.667z"></path><path d="M4.012 16.737a2.005 2.005 0 0 1 -1.012 -1.737v-10c0 -1.1 .9 -2 2 -2h10c.75 0 1.412 .412 1.737 1.012"></path></svg>';
  const ICON_CHECK = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M5 12l5 5l10 -10"></path></svg>';

  // Real per-platform bio character caps — preview text is clipped to match what the platform actually allows
  const PREVIEW_CHAR_LIMITS = { instagram: 150, facebook: 101 };

  function truncateForPlatform(str, limit) {
    if (!limit) return str;
    const chars = Array.from(str); // codepoint-safe, since styled text uses supplementary-plane glyphs
    if (chars.length <= limit) return str;
    return chars.slice(0, limit - 1).join('') + '…';
  }

  /* =========================================================
     NEON GLOW THEME HOOKS — additive only, doesn't touch any
     logic above. Respects prefers-reduced-motion. Safe to
     delete this whole block to fall back to the plain build.
     ========================================================= */
  const REDUCE_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const GLOW_COLORS = ['#7c3aed', '#d946ef', '#00e5ff'];

  function spawnBurst(el) {
    if (REDUCE_MOTION || !el) return;
    for (let i = 0; i < 6; i++) {
      const spark = document.createElement('span');
      spark.className = 'tpx-stg-spark';
      const angle = (Math.PI * 2 * i) / 6 + Math.random() * 0.4;
      const dist = 16 + Math.random() * 10;
      spark.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
      spark.style.setProperty('--dy', Math.sin(angle) * dist + 'px');
      spark.style.setProperty('--dot-color', GLOW_COLORS[i % GLOW_COLORS.length]);
      el.appendChild(spark);
      setTimeout(function () { spark.remove(); }, 500);
    }
  }

  /* =========================================================
     TRACK / NEEDLE / NODE-POINT LOGIC
     Breakpoints mirror the six node points exactly as placed
     in the markup (101c/15%, 150c/29%, 160c/43%, 190c/57%,
     200c/71%, 220c/85%), so the needle/fill lands precisely on a
     node the instant the character count matches it. Past the
     last node (220c) the same slope from the previous segment is
     continued until the track reaches 100%.
     ========================================================= */
  const CHAR_BREAKPOINTS = [
    { chars: 0,   pct: 0 },
    { chars: 101, pct: 15 },
    { chars: 150, pct: 29 },
    { chars: 160, pct: 43 },
    { chars: 190, pct: 57 },
    { chars: 200, pct: 71 },
    { chars: 220, pct: 85 }
  ];

  function interpolatePct(chars) {
    for (let i = 0; i < CHAR_BREAKPOINTS.length - 1; i++) {
      const a = CHAR_BREAKPOINTS[i];
      const b = CHAR_BREAKPOINTS[i + 1];
      if (chars <= b.chars) {
        const ratio = (chars - a.chars) / (b.chars - a.chars);
        return a.pct + ratio * (b.pct - a.pct);
      }
    }
    const last = CHAR_BREAKPOINTS[CHAR_BREAKPOINTS.length - 1];
    const prev = CHAR_BREAKPOINTS[CHAR_BREAKPOINTS.length - 2];
    const slope = (last.pct - prev.pct) / (last.chars - prev.chars);
    const pct = last.pct + slope * (chars - last.chars);
    return Math.min(pct, 100);
  }

  function toggleNode(id, reached) {
    const node = document.getElementById(id);
    if (node) node.classList.toggle('is-reached', reached);
  }

  function updateTimeline(chars, words) {
    const pct = Math.max(0, Math.min(interpolatePct(chars), 100));

    document.getElementById('tpx-timeline-progress').style.width = pct + '%';
    document.getElementById('tpx-timeline-needle').style.left = pct + '%';

    toggleNode('node-ig', chars >= 101);
    toggleNode('node-fb', chars >= 150);
    toggleNode('node-tw', chars >= 160);
    toggleNode('node-discord', chars >= 190);
    toggleNode('node-reddit', chars >= 200);
    toggleNode('node-li', chars >= 220);
    toggleNode('node-bl', words >= 1500);
  }

  // ---- Cache DOM refs per style key once (avoids repeated querySelectorAll on every keystroke) ----
  const styleRefs = {};
  Object.keys(STYLE_FNS).forEach(function (key) {
    styleRefs[key] = {
      body: grid.querySelector('.tpx-stg-card-body[data-key="' + key + '"]'),
      card: document.getElementById('tpx-stg-card-' + key),
      previewBios: grid.querySelectorAll('.tpx-stg-preview-bio[data-key="' + key + '"]')
    };
  });

  // ---- Renders only the given subset of style keys ----
  function renderKeys(keys, text, isEmpty) {
    keys.forEach(function (key) {
      const fn = STYLE_FNS[key];
      const refs = styleRefs[key];
      if (isEmpty) {
        refs.body.textContent = 'Type something to start';
        refs.body.classList.add('tpx-stg-placeholder');
        refs.card.classList.add('tpx-stg-card-empty');
        refs.previewBios.forEach(function (el) { el.textContent = 'Type something to see it here'; });
      } else {
        const styled = fn(text);
        refs.body.textContent = styled;
        refs.body.classList.remove('tpx-stg-placeholder');
        refs.card.classList.remove('tpx-stg-card-empty');
        refs.previewBios.forEach(function (el) {
          const view = el.closest('.tpx-stg-pv-view');
          const platform = view ? view.dataset.view : null;
          el.textContent = truncateForPlatform(styled, PREVIEW_CHAR_LIMITS[platform]);
        });
      }
    });
  }

  function getActiveKeys() {
    return extraStylesRevealed ? Object.keys(STYLE_FNS) : DEFAULT_VISIBLE_KEYS;
  }

  // ---- Live stats + fill in the visible card bodies ----
  function render() {
    const text = ta.value;
    const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).filter(Boolean).length;
    const chars = text.replace(/\n/g, '').length;
    const charsNoSpaces = text.replace(/\s/g, '').length;

    document.getElementById('tpx-stg-val-words').textContent = words.toLocaleString();
    document.getElementById('tpx-stg-val-chars').textContent = chars.toLocaleString();
    document.getElementById('tpx-stg-val-chars-ns').textContent = charsNoSpaces.toLocaleString();

    updateTimeline(chars, words);

    const isEmpty = text.trim() === '';
    renderKeys(getActiveKeys(), text, isEmpty);
  }

  // ---- Instant render on input, throttled to one paint frame instead of a fixed debounce ----
  let renderScheduled = false;
  ta.addEventListener('input', function () {
    if (renderScheduled) return;
    renderScheduled = true;
    requestAnimationFrame(function () {
      render();
      renderScheduled = false;
    });
  });

  /* ---------- Info strip toggle ---------- */
  const infoToggle = document.getElementById('tpx-stg-info-toggle');
  const infoBody = document.getElementById('tpx-stg-info-body');
  if (infoToggle && infoBody) {
    infoToggle.addEventListener('click', function () {
      const isExpanded = infoToggle.getAttribute('aria-expanded') === 'true';
      infoToggle.setAttribute('aria-expanded', String(!isExpanded));
      infoBody.hidden = isExpanded;
    });
  }

  /* ---------- Shared safety-dot tooltip ----------
     Replaces the native `title` attribute (which doesn't work on touch
     and is inconsistent across browsers) with a single positioned
     tooltip: hover/focus reveals it on desktop, tap toggles it on
     touch devices, and it dismisses on outside tap or scroll. ---------- */
  const sharedTooltip = document.getElementById('tpx-stg-shared-tooltip');
  const isTouchPrimary = window.matchMedia('(hover: none)').matches;

  function positionTooltip(target) {
    const rect = target.getBoundingClientRect();
    const tipRect = sharedTooltip.getBoundingClientRect();
    let left = rect.left + rect.width / 2 - tipRect.width / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - tipRect.width - 8));
    let top = rect.top - tipRect.height - 8;
    if (top < 8) top = rect.bottom + 8;
    sharedTooltip.style.left = left + 'px';
    sharedTooltip.style.top = top + 'px';
  }

  function showTooltip(target) {
    const text = target.getAttribute('data-tooltip');
    if (!text) return;
    sharedTooltip.textContent = text;
    sharedTooltip.classList.add('tpx-stg-show');
    positionTooltip(target);
  }

  function hideTooltip() {
    sharedTooltip.classList.remove('tpx-stg-show');
  }

  document.querySelectorAll('.tpx-stg-safety-dot[data-tooltip]').forEach(function (dot) {
    if (!isTouchPrimary) {
      dot.addEventListener('mouseenter', function () { showTooltip(dot); });
      dot.addEventListener('mouseleave', hideTooltip);
      dot.addEventListener('focus', function () { showTooltip(dot); });
      dot.addEventListener('blur', hideTooltip);
    } else {
      dot.addEventListener('click', function (e) {
        e.stopPropagation();
        const alreadyShown = sharedTooltip.classList.contains('tpx-stg-show') &&
          sharedTooltip.textContent === dot.getAttribute('data-tooltip');
        hideTooltip();
        if (!alreadyShown) showTooltip(dot);
      });
    }
  });

  document.addEventListener('click', hideTooltip);
  window.addEventListener('scroll', hideTooltip, true);

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('.tpx-stg-preview-panel.is-open').forEach(function (panel) {
      panel.classList.remove('is-open');
      const key = panel.dataset.key;
      const btn = grid.querySelector('.tpx-stg-preview-btn[data-key="' + key + '"]');
      const card = document.getElementById('tpx-stg-card-' + key);
      if (btn) btn.classList.remove('tpx-stg-preview-active');
      if (card) card.classList.remove('tpx-stg-preview-is-open');
    });
  });

  // ---- Card copy / download / preview toggle (event delegation on the static grid) ----
  grid.addEventListener('click', function (e) {
    const copyBtn = e.target.closest('.tpx-stg-copy-btn');
    const dlBtn = e.target.closest('.tpx-stg-download-btn');
    const previewBtn = e.target.closest('.tpx-stg-preview-btn');
    const tabBtn = e.target.closest('.tpx-stg-preview-tab');

    if (previewBtn) {
      const key = previewBtn.dataset.key;
      const panel = document.getElementById('tpx-stg-preview-' + key);
      const outerCard = document.getElementById('tpx-stg-card-' + key);
      if (panel) {
        const willOpen = !panel.classList.contains('is-open');
        panel.classList.toggle('is-open', willOpen);
        previewBtn.classList.toggle('tpx-stg-preview-active', willOpen);
        if (outerCard) outerCard.classList.toggle('tpx-stg-preview-is-open', willOpen);
      }
      return;
    }

    if (tabBtn) {
      const panel = tabBtn.closest('.tpx-stg-preview-panel');
      const platform = tabBtn.dataset.platform;
      panel.querySelectorAll('.tpx-stg-preview-tab').forEach(function (t) {
        t.classList.toggle('is-active', t === tabBtn);
      });
      panel.querySelectorAll('.tpx-stg-pv-view').forEach(function (v) {
        v.hidden = v.dataset.view !== platform;
      });
      return;
    }

    if (copyBtn) {
      const key = copyBtn.dataset.key;
      const body = grid.querySelector('.tpx-stg-card-body[data-key="' + key + '"]');
      const value = body.textContent;
      if (!value || body.classList.contains('tpx-stg-placeholder')) return;

      const card = document.getElementById('tpx-stg-card-' + key);
      const styleName = card ? card.querySelector('.tpx-stg-card-title').textContent : 'Text';

      navigator.clipboard.writeText(value).then(function () {
        copyBtn.innerHTML = ICON_CHECK;
        copyBtn.classList.add('tpx-stg-copied');
        spawnBurst(copyBtn);
        announce(styleName + ' copied');
        setTimeout(function () {
          copyBtn.innerHTML = ICON_COPY;
          copyBtn.classList.remove('tpx-stg-copied');
        }, 1500);
      }).catch(function () {
        announce('Could not copy — check clipboard permission');
      });
    }

    if (dlBtn) {
      const key = dlBtn.dataset.key;
      const body = grid.querySelector('.tpx-stg-card-body[data-key="' + key + '"]');
      const value = body.textContent;
      if (!value || body.classList.contains('tpx-stg-placeholder')) return;

      const blob = new Blob([value], { type: 'text/plain;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'toolpx-' + key + '-' + getDate() + '.txt';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    }
  });

  function getDate() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  }

  function announce(msg) {
    announcer.textContent = '';
    // Re-set on next frame so repeated identical messages still get announced
    requestAnimationFrame(function () {
      announcer.textContent = msg;
    });
  }

  // ---- Footer actions ----
  document.getElementById('tpx-stg-btn-paste').addEventListener('click', function () {
    navigator.clipboard.readText().then(function (t) { ta.value += t; render(); ta.focus(); }).catch(function(){ ta.focus(); });
  });
  document.getElementById('tpx-stg-btn-clear').addEventListener('click', function () {
    ta.value = ''; render(); ta.focus();
  });
  document.getElementById('tpx-stg-btn-copy').addEventListener('click', function () {
    if (!ta.value.trim()) return;
    const btn = this;
    navigator.clipboard.writeText(ta.value).then(function () {
      btn.innerHTML = ICON_CHECK;
      btn.classList.add('tpx-stg-copied');
      spawnBurst(btn);
      announce('Input copied');
      setTimeout(function () {
        btn.innerHTML = ICON_COPY;
        btn.classList.remove('tpx-stg-copied');
      }, 1500);
    }).catch(function () {
      announce('Could not copy — check clipboard permission');
    });
  });
  document.getElementById('tpx-stg-btn-upload').addEventListener('click', function () {
    document.getElementById('tpx-stg-file-uploader').click();
  });
  document.getElementById('tpx-stg-file-uploader').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'txt') {
      const reader = new FileReader();
      reader.onload = function (evt) { ta.value = evt.target.result; render(); };
      reader.readAsText(file);
    } else {
      announce('DOCX parsing uses Mammoth.js — wire up as in Word Counter');
    }
    this.value = '';
  });

  /* ---------- Stat value pulse on change (additive, decoupled via MutationObserver) ---------- */
  if (!REDUCE_MOTION) {
    ['tpx-stg-val-words', 'tpx-stg-val-chars', 'tpx-stg-val-chars-ns'].forEach(function (id) {
      const el = document.getElementById(id);
      if (!el) return;
      let pulseTimeout = null;
      const observer = new MutationObserver(function () {
        el.classList.remove('tpx-stg-pulse');
        void el.offsetWidth; // restart animation even on repeated identical mutations
        el.classList.add('tpx-stg-pulse');
        clearTimeout(pulseTimeout);
        pulseTimeout = setTimeout(function () { el.classList.remove('tpx-stg-pulse'); }, 350);
      });
      observer.observe(el, { characterData: true, childList: true, subtree: true });
    });
  }

  render();
});
