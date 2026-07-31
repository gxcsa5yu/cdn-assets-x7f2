document.addEventListener('DOMContentLoaded', function () {
  const ta = document.getElementById('tpx-stg-input');
  const grid = document.getElementById('tpx-stg-fonts-grid');
  const defaultStylesContainer = document.getElementById('tpx-stg-default-styles');
  const extraStyles = document.getElementById('tpx-stg-extra-styles');
  const announcer = document.getElementById('tpx-stg-sr-announcer');

  let extraStylesRevealed = false;

  /* =========================================================
     CONVERSION ENGINE — turns typed text into unicode-mapped
     glyph variants. No CSS/HTML way to remap characters, so
     this part must be JS.
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

  /* =========================================================
     STYLE CONFIG — the single source of truth for every card:
     which styles exist, what group they render in (default vs
     "show more"), their safety rating, and their transform.
     Adding a style is now a one-line addition here, not a
     block of hand-written HTML.
     ========================================================= */
  const SAFETY_TOOLTIPS = {
    safe: 'Safe everywhere',
    warn: 'May not render on older devices',
    risk: 'Often shows as boxes on some platforms'
  };

  const STYLE_DEFS = [
    { key: 'smallcaps',   title: 'Small Caps',        safety: 'safe', group: 'default', fn: t => mapLookup(t, SMALLCAPS) },
    { key: 'superscript', title: 'Superscript',       safety: 'warn', group: 'default', fn: t => mapLookup(t, SUPERSCRIPT) },
    { key: 'subscript',   title: 'Subscript',         safety: 'risk', group: 'default', fn: t => mapLookup(t, SUBSCRIPT) },

    { key: 'bold',        title: 'Bold',               safety: 'safe', group: 'extra', fn: t => mapContiguous(t, 0x1D400, 0x1D41A, 0x1D7CE, {}) },
    { key: 'smalltext',   title: 'Small Text',         safety: 'safe', group: 'extra', fn: t => mapLookup(t, SUPERSCRIPT) },
    { key: 'upsidedown',  title: 'Upside Down',        safety: 'safe', group: 'extra', fn: upsideDown },
    { key: 'backwards',   title: 'Backwards',          safety: 'safe', group: 'extra', fn: t => t.split('').reverse().join('') },
    { key: 'updown',      title: 'Up and Down',        safety: 'safe', group: 'extra', fn: upAndDown },
    { key: 'monoupper',   title: 'Mono Upper',         safety: 'warn', group: 'extra', fn: t => mapContiguous(t, 0x1D670, 0x1D68A, 0x1D7F6, {}) },
    { key: 'mathsans',    title: 'Math Sans',          safety: 'warn', group: 'extra', fn: t => mapContiguous(t, 0x1D5A0, 0x1D5BA, 0x1D7E2, {}) },
    { key: 'mathstyle',   title: 'Math Style',         safety: 'warn', group: 'extra', fn: t => mapContiguous(t, 0x1D434, 0x1D44E, null, { h: 'ℎ' }) },
    { key: 'bubbles',     title: 'Bubbles',            safety: 'warn', group: 'extra', fn: bubbles },
    { key: 'lightsq',     title: 'Light Squares',      safety: 'warn', group: 'extra', fn: lightSquares },
    { key: 'flourish',    title: 'Flourish',           safety: 'warn', group: 'extra', fn: t => mapContiguous(t, 0x1D4D0, 0x1D4EA, null, {}) },
    { key: 'fraktur',     title: 'Fraktur',            safety: 'warn', group: 'extra', fn: t => mapContiguous(t, 0x1D504, 0x1D51E, null, { C: 'ℭ', H: 'ℌ', I: 'ℑ', R: 'ℜ', Z: 'ℨ' }) },
    { key: 'script',      title: 'Script / Cursive',   safety: 'warn', group: 'extra', fn: t => mapContiguous(t, 0x1D49C, 0x1D4B6, null, { B: 'ℬ', E: 'ℰ', F: 'ℱ', H: 'ℋ', I: 'ℐ', L: 'ℒ', M: 'ℳ', R: 'ℛ', e: 'ℯ', g: 'ℊ', o: 'ℴ' }) },
    { key: 'darkbubbles', title: 'Dark Bubbles',       safety: 'risk', group: 'extra', fn: darkBubbles },
    { key: 'darksq',      title: 'Dark Squares',       safety: 'risk', group: 'extra', fn: darkSquares },
    { key: 'funky',       title: 'Funky',              safety: 'risk', group: 'extra', fn: funky }
  ];

  const STYLE_FNS = {};
  STYLE_DEFS.forEach(function (d) { STYLE_FNS[d.key] = d.fn; });

  const ICON_COPY  = '<svg><use href="#icon-copy"></use></svg>';
  const ICON_CHECK = '<svg><use href="#icon-check"></use></svg>';

  function iconUse(id) {
    return '<svg class="tpx-icon" aria-hidden="true"><use href="#' + id + '"></use></svg>';
  }

  // ---- Builds one card's full markup (main card + all platform previews) from a style def ----
  function cardTemplate(def) {
    const tooltip = SAFETY_TOOLTIPS[def.safety];
    const key = def.key;
    return (
      '<div class="tpx-stg-font-card tpx-stg-card-empty" id="tpx-stg-card-' + key + '">' +
        '<div class="tpx-stg-card-left">' +
          '<div class="tpx-stg-card-header">' +
            '<div class="tpx-stg-card-title-wrap">' +
              '<span class="tpx-stg-safety-dot ' + def.safety + '" data-tooltip="' + tooltip + '" tabindex="0" role="img" aria-label="Compatibility: ' + tooltip + '"></span>' +
              '<span class="tpx-stg-card-title">' + def.title + '</span>' +
            '</div>' +
            '<div class="tpx-stg-card-actions">' +
              '<button type="button" class="tpx-stg-copy-btn" data-key="' + key + '" aria-label="Copy ' + def.title + ' text">' + iconUse('icon-copy') + '</button>' +
              '<button type="button" class="tpx-stg-preview-btn" data-key="' + key + '" aria-label="Preview ' + def.title + ' on social platforms" title="Preview on social platforms">' + iconUse('icon-preview') + '</button>' +
              '<button type="button" class="tpx-stg-download-btn" data-key="' + key + '" aria-label="Download ' + def.title + ' text">' + iconUse('icon-download') + '</button>' +
            '</div>' +
          '</div>' +
          '<div class="tpx-stg-card-body tpx-stg-placeholder" data-key="' + key + '">Type something to start</div>' +
        '</div>' +
        '<div class="tpx-stg-preview-panel" id="tpx-stg-preview-' + key + '" data-key="' + key + '">' +
          '<div class="tpx-stg-preview-stage">' +
            '<div class="tpx-stg-pv-view tpx-stg-pv-ig" data-view="instagram">' +
              '<div class="tpx-stg-pv-ig-top">' +
                '<div class="tpx-stg-preview-avatar">' + iconUse('icon-person') + '</div>' +
                '<div class="tpx-stg-pv-ig-right">' +
                  '<div class="tpx-stg-pv-ig-name">Toolpx</div>' +
                  '<div class="tpx-stg-pv-ig-stats">' +
                    '<div class="tpx-stg-pv-ig-stat"><b>128</b><span>posts</span></div>' +
                    '<div class="tpx-stg-pv-ig-stat"><b>2,024</b><span>followers</span></div>' +
                    '<div class="tpx-stg-pv-ig-stat"><b>75</b><span>following</span></div>' +
                  '</div>' +
                '</div>' +
              '</div>' +
              '<div class="tpx-stg-pv-ig-bio tpx-stg-preview-bio" data-key="' + key + '">Type something to see it here</div>' +
              '<div class="tpx-stg-pv-ig-link">' + iconUse('icon-link') + '<span>toolpx.com</span><span class="tpx-stg-pv-ig-more">and 3 more</span></div>' +
            '</div>' +
            '<div class="tpx-stg-pv-view tpx-stg-pv-fb" data-view="facebook" hidden>' +
              '<div class="tpx-stg-pv-fb-cover"></div>' +
              '<div class="tpx-stg-pv-fb-body">' +
                '<div class="tpx-stg-pv-fb-top">' +
                  '<div class="tpx-stg-preview-avatar">' + iconUse('icon-person') + '</div>' +
                  '<div class="tpx-stg-pv-fb-right">' +
                    '<div class="tpx-stg-pv-fb-name">Toolpx <span class="tpx-stg-pv-fb-badge">' + iconUse('icon-badge-check') + '</span></div>' +
                    '<div class="tpx-stg-pv-fb-stats"><b>17M</b> followers · <b>1</b> following · <b>1.5K</b> posts</div>' +
                  '</div>' +
                '</div>' +
                '<div class="tpx-stg-pv-fb-category">Page · Artist</div>' +
                '<div class="tpx-stg-pv-fb-bio tpx-stg-preview-bio" data-key="' + key + '">Type something to see it here</div>' +
              '</div>' +
            '</div>' +
            '<div class="tpx-stg-pv-view tpx-stg-pv-x" data-view="twitter" hidden>' +
              '<div class="tpx-stg-pv-x-cover"></div>' +
              '<div class="tpx-stg-pv-x-body">' +
                '<div class="tpx-stg-preview-avatar tpx-stg-pv-x-avatar">' + iconUse('icon-person') + '</div>' +
                '<div class="tpx-stg-pv-x-name">Toolpx <span class="tpx-stg-pv-x-badge">' + iconUse('icon-badge-check') + '</span></div>' +
                '<div class="tpx-stg-pv-x-handle">@toolpx</div>' +
                '<div class="tpx-stg-pv-x-bio tpx-stg-preview-bio" data-key="' + key + '">Type something to see it here</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="tpx-stg-preview-tabbar">' +
            '<div class="tpx-stg-preview-tabgroup">' +
              '<button type="button" class="tpx-stg-preview-tab is-active" data-platform="instagram" title="Instagram" aria-label="Preview on Instagram">' + iconUse('icon-platform-instagram') + '<span>Instagram</span></button>' +
              '<button type="button" class="tpx-stg-preview-tab" data-platform="facebook" title="Facebook" aria-label="Preview on Facebook">' + iconUse('icon-platform-facebook') + '<span>Facebook</span></button>' +
              '<button type="button" class="tpx-stg-preview-tab" data-platform="twitter" title="X" aria-label="Preview on X">' + iconUse('icon-platform-twitter') + '<span>X</span></button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  // Real per-platform bio character caps — preview text is clipped to match what the platform actually allows
  const PREVIEW_CHAR_LIMITS = { instagram: 150, facebook: 101, twitter: 160 };

  function truncateForPlatform(str, limit) {
    if (!limit) return str;
    const chars = Array.from(str);
    if (chars.length <= limit) return str;
    return chars.slice(0, limit - 1).join('') + '…';
  }

  /* =========================================================
     TRACK / NEEDLE / NODE-POINT LOGIC
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

  // ---- Per-style DOM refs, populated as each group's cards are built ----
  const styleRefs = {};
  function buildStyleRefs(key) {
    styleRefs[key] = {
      body: grid.querySelector('.tpx-stg-card-body[data-key="' + key + '"]'),
      card: document.getElementById('tpx-stg-card-' + key),
      previewBios: grid.querySelectorAll('.tpx-stg-preview-bio[data-key="' + key + '"]')
    };
  }

  // ---- Builds and mounts every card in a group ("default" or "extra") into its container ----
  function renderCardsForGroup(group, container) {
    const defs = STYLE_DEFS.filter(function (d) { return d.group === group; });
    container.innerHTML = defs.map(cardTemplate).join('');
    defs.forEach(function (d) { buildStyleRefs(d.key); });
    return defs.map(function (d) { return d.key; });
  }

  // Default-visible cards are built immediately; "extra" cards are built lazily
  // the first time "Show More Styles" is opened, so a page with 100+ styles
  // never pays for markup the visitor hasn't asked to see.
  const DEFAULT_VISIBLE_KEYS = renderCardsForGroup('default', defaultStylesContainer);

  /* ---------- Show More Styles toggle ---------- */
  const moreStylesToggle = document.getElementById('tpx-stg-more-styles-toggle');
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
        const extraKeys = renderCardsForGroup('extra', extraStyles);
        const text = ta.value;
        renderKeys(extraKeys, text, text.trim() === '');
      }
    });
  }

  // ---- Renders only the given subset of style keys ----
  function renderKeys(keys, text, isEmpty) {
    keys.forEach(function (key) {
      const fn = STYLE_FNS[key];
      const refs = styleRefs[key];
      if (!refs || !refs.body) return;
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

  /* ---------- Shared safety-dot tooltip ---------- */
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

  // Tooltip listeners are delegated to the document so they keep working
  // for safety dots created later (lazily built "extra" cards).
  document.addEventListener('mouseover', function (e) {
    if (isTouchPrimary) return;
    const dot = e.target.closest('.tpx-stg-safety-dot[data-tooltip]');
    if (dot) showTooltip(dot);
  });
  document.addEventListener('mouseout', function (e) {
    if (isTouchPrimary) return;
    const dot = e.target.closest('.tpx-stg-safety-dot[data-tooltip]');
    if (dot) hideTooltip();
  });
  document.addEventListener('focusin', function (e) {
    const dot = e.target.closest('.tpx-stg-safety-dot[data-tooltip]');
    if (dot) showTooltip(dot);
  });
  document.addEventListener('focusout', function (e) {
    const dot = e.target.closest('.tpx-stg-safety-dot[data-tooltip]');
    if (dot) hideTooltip();
  });
  document.addEventListener('click', function (e) {
    if (!isTouchPrimary) { hideTooltip(); return; }
    const dot = e.target.closest('.tpx-stg-safety-dot[data-tooltip]');
    if (dot) {
      e.stopPropagation();
      const alreadyShown = sharedTooltip.classList.contains('tpx-stg-show') &&
        sharedTooltip.textContent === dot.getAttribute('data-tooltip');
      hideTooltip();
      if (!alreadyShown) showTooltip(dot);
      return;
    }
    hideTooltip();
  });
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

  // ---- Shared helper: flash a button to the check icon briefly after a successful copy ----
  function flashCopied(btn, announceLabel) {
    btn.innerHTML = ICON_CHECK;
    btn.classList.add('tpx-stg-copied');
    if (announceLabel) announce(announceLabel);
    setTimeout(function () {
      btn.innerHTML = ICON_COPY;
      btn.classList.remove('tpx-stg-copied');
    }, 1500);
  }

  // ---- Copies a card's generated text and flashes its copy button ----
  function copyCardText(key) {
    const body = grid.querySelector('.tpx-stg-card-body[data-key="' + key + '"]');
    if (!body) return;
    const value = body.textContent;
    if (!value || body.classList.contains('tpx-stg-placeholder')) return;

    const card = document.getElementById('tpx-stg-card-' + key);
    const styleName = card ? card.querySelector('.tpx-stg-card-title').textContent : 'Text';
    const copyBtn = grid.querySelector('.tpx-stg-copy-btn[data-key="' + key + '"]');

    navigator.clipboard.writeText(value).then(function () {
      if (copyBtn) flashCopied(copyBtn, styleName + ' copied');
      else announce(styleName + ' copied');
    }).catch(function () {
      announce('Could not copy — check clipboard permission');
    });
  }

  // ---- Card copy / download / preview toggle (event delegation on the grid, so
  //      lazily-created "extra" cards are covered without extra listeners) ----
  grid.addEventListener('click', function (e) {
    const copyBtn = e.target.closest('.tpx-stg-copy-btn');
    const dlBtn = e.target.closest('.tpx-stg-download-btn');
    const previewBtn = e.target.closest('.tpx-stg-preview-btn');
    const tabBtn = e.target.closest('.tpx-stg-preview-tab');
    const cardLeft = e.target.closest('.tpx-stg-card-left');

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
      copyCardText(copyBtn.dataset.key);
      return;
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
      return;
    }

    // Clicking anywhere else on the card's left column (title, safety dot, body text)
    // copies that card's generated text, same as clicking its copy button.
    if (cardLeft) {
      const body = cardLeft.querySelector('.tpx-stg-card-body');
      const key = body ? body.dataset.key : null;
      if (key) copyCardText(key);
    }
  });

  function getDate() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function announce(msg) {
    announcer.textContent = '';
    requestAnimationFrame(function () {
      announcer.textContent = msg;
    });
  }

  /* ---------- Footer actions ---------- */
  document.getElementById('tpx-stg-btn-paste').addEventListener('click', function () {
    navigator.clipboard.readText().then(function (t) { ta.value += t; render(); ta.focus(); }).catch(function () { ta.focus(); });
  });
  document.getElementById('tpx-stg-btn-clear').addEventListener('click', function () {
    ta.value = ''; render(); ta.focus();
  });
  document.getElementById('tpx-stg-btn-copy').addEventListener('click', function () {
    if (!ta.value.trim()) return;
    const btn = this;
    navigator.clipboard.writeText(ta.value).then(function () {
      flashCopied(btn, 'Input copied');
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

  render();
});
