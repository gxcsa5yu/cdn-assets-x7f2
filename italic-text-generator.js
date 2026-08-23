document.addEventListener('DOMContentLoaded', function () {
  const ta = document.getElementById('tpx-itg-input');
  const grid = document.getElementById('tpx-itg-fonts-grid');
  const defaultStylesContainer = document.getElementById('tpx-itg-default-styles');
  const extraStyles = document.getElementById('tpx-itg-extra-styles');
  const announcer = document.getElementById('tpx-itg-sr-announcer');

  /* ---- Conversion engine ---- */
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

  // Mathematical Script (non-bold) has letter gaps that fall back to the
  // older "Script Capital/Small" compatibility characters (B, E, F, H, I,
  // L, M, R uppercase; e, g, o lowercase). Built as an explicit lookup
  // table (rather than a contiguous offset map) so every letter — gap or
  // not — resolves to the correct assigned code point.
  const SCRIPT_TABLE = {
    A:'\u{1D49C}', B:'\u212C', C:'\u{1D49E}', D:'\u{1D49F}', E:'\u2130', F:'\u2131',
    G:'\u{1D4A2}', H:'\u210B', I:'\u2110', J:'\u{1D4A5}', K:'\u{1D4A6}', L:'\u2112',
    M:'\u2133', N:'\u{1D4A9}', O:'\u{1D4AA}', P:'\u{1D4AB}', Q:'\u{1D4AC}', R:'\u211B',
    S:'\u{1D4AE}', T:'\u{1D4AF}', U:'\u{1D4B0}', V:'\u{1D4B1}', W:'\u{1D4B2}', X:'\u{1D4B3}',
    Y:'\u{1D4B4}', Z:'\u{1D4B5}',
    a:'\u{1D4B6}', b:'\u{1D4B7}', c:'\u{1D4B8}', d:'\u{1D4B9}', e:'\u212F', f:'\u{1D4BB}',
    g:'\u210A', h:'\u{1D4BD}', i:'\u{1D4BE}', j:'\u{1D4BF}', k:'\u{1D4C0}', l:'\u{1D4C1}',
    m:'\u{1D4C2}', n:'\u{1D4C3}', o:'\u2134', p:'\u{1D4C5}', q:'\u{1D4C6}', r:'\u{1D4C7}',
    s:'\u{1D4C8}', t:'\u{1D4C9}', u:'\u{1D4CA}', v:'\u{1D4CB}', w:'\u{1D4CC}', x:'\u{1D4CD}',
    y:'\u{1D4CE}', z:'\u{1D4CF}'
  };

  /* ---- Core italic transforms ---- */
  function italicFn(t) { return mapContiguous(t, 0x1D608, 0x1D622, null, {}); }
  function boldItalicFn(t) { return mapContiguous(t, 0x1D63C, 0x1D656, null, {}); }
  // Mathematical Italic (serif) has one gap: lowercase "h" has no assigned
  // code point in the block and falls back to the Planck-constant
  // compatibility character (ℎ), same as most "fancy text" implementations.
  function serifItalicFn(t) { return mapContiguous(t, 0x1D434, 0x1D44E, null, { h: '\u210E' }); }
  function serifBoldItalicFn(t) { return mapContiguous(t, 0x1D468, 0x1D482, null, {}); }
  function scriptFn(t) { return mapLookup(t, SCRIPT_TABLE); }
  function boldScriptFn(t) { return mapContiguous(t, 0x1D4D0, 0x1D4EA, null, {}); }

  /* ---- Emoji sequences ----
     BUG-PRONE PATTERN AVOIDED: emoji are built from Unicode code points via
     String.fromCodePoint() rather than typed as literal characters in this
     source file. Per ToolPX's established WordPress deployment rule ("Emoji
     in JS strings must be avoided — WordPress mangles them"), this keeps the
     emoji-decorated styles safe regardless of how/where this file is edited
     or pasted into a WordPress Custom HTML block. */
  function emojiSeq(codepoints) {
    return codepoints.map(function (cp) { return String.fromCodePoint(cp); }).join('');
  }

  const EMOJI_CROWN = emojiSeq([0x1F451]);
  const EMOJI_FIRE = emojiSeq([0x1F525]);
  const EMOJI_PEACE = emojiSeq([0x270C, 0xFE0F]);

  const FOOD_START = emojiSeq([0x1F355, 0x1F35F, 0x1F96A]);
  const FOOD_END = emojiSeq([0x1F959, 0x1F961, 0x1F356]);

  const LOVE_START = emojiSeq([0x1F60D, 0x1F49E, 0x1F498]);
  const LOVE_END = emojiSeq([0x1F494, 0x1F48F, 0x1F496]);

  const DRINK_START = emojiSeq([0x1F37A, 0x1F942, 0x1F378]);
  const DRINK_END = emojiSeq([0x1F37B, 0x1F377, 0x1F379]);

  const VEGGIE_START = emojiSeq([0x1F955, 0x1F345, 0x1F966]);
  const VEGGIE_END = emojiSeq([0x1F346, 0x1F33D, 0x1F951]);

  const EMOJI_HEART = emojiSeq([0x1F497]);   // 💗 Growing Heart
  const EMOJI_SPARKLE = emojiSeq([0x2728]);  // ✨ Sparkles
  const EMOJI_RIBBON = emojiSeq([0x1F380]);  // 🎀 Ribbon

  /* ---- Emoji-decorated italic transforms ----
     All wrap plain Italic (not Script) so every decorated style renders
     consistently with the sample text ("Type something to start"). */
  function sweetheartItalicFn(t) { return EMOJI_HEART + ' ' + italicFn(t) + ' ' + EMOJI_HEART; }
  function sparkleItalicFn(t) { return EMOJI_SPARKLE + ' ' + italicFn(t) + ' ' + EMOJI_SPARKLE; }
  function royalItalicFn(t) { return EMOJI_CROWN + ' ' + italicFn(t) + ' ' + EMOJI_CROWN; }
  function blazingItalicFn(t) { return EMOJI_FIRE + ' ' + italicFn(t) + ' ' + EMOJI_FIRE; }
  function giftBowItalicFn(t) { return EMOJI_RIBBON + ' ' + italicFn(t) + ' ' + EMOJI_RIBBON; }
  function sassyItalicFn(t) { return EMOJI_PEACE + italicFn(t) + EMOJI_PEACE; }
  function foodieItalicFn(t) { return FOOD_START + ' ' + italicFn(t) + ' ' + FOOD_END; }
  function lovestruckItalicFn(t) { return LOVE_START + ' ' + italicFn(t) + ' ' + LOVE_END; }
  function happyHourItalicFn(t) { return DRINK_START + ' ' + italicFn(t) + ' ' + DRINK_END; }
  function gardenFreshItalicFn(t) { return VEGGIE_START + ' ' + italicFn(t) + ' ' + VEGGIE_END; }

  /* ---- Style config ---- */
  const SAFETY_LABELS = {
    safe: 'Safe everywhere',
    warn: 'May not render on older devices',
    risk: 'Often shows as boxes on some platforms'
  };

  const STYLE_DEFS = [
    // Default 5
    { key: 'italic',            title: 'Italic',              safety: 'safe', group: 'default', size: 1.0, fn: italicFn },
    { key: 'bolditalic',        title: 'Bold Italic',         safety: 'safe', group: 'default', size: 1.0, fn: boldItalicFn },
    { key: 'serifitalic',       title: 'Serif Italic',        safety: 'safe', group: 'default', size: 1.0, fn: serifItalicFn },
    { key: 'serifbolditalic',   title: 'Serif Bold Italic',   safety: 'safe', group: 'default', size: 1.0, fn: serifBoldItalicFn },
    // Script has real gap-driven support risk (mixes two Unicode ranges),
    // so it's rated 'risk' rather than the 'warn' given to the gap-free
    // Bold Script block below.
    { key: 'script',            title: 'Script',              safety: 'risk', group: 'default', size: 1.0, fn: scriptFn },

    // Extra 11 — "Show More" (revealed in batches of 10)
    { key: 'boldscript',        title: 'Bold Script',         safety: 'warn', group: 'extra', size: 1.0, fn: boldScriptFn },
    { key: 'sweetheartitalic',  title: 'Sweetheart Italic',   safety: 'safe', group: 'extra', size: 1.0, fn: sweetheartItalicFn },
    { key: 'sparkleitalic',     title: 'Sparkle Italic',      safety: 'safe', group: 'extra', size: 1.0, fn: sparkleItalicFn },
    { key: 'royalitalic',       title: 'Royal Italic',        safety: 'safe', group: 'extra', size: 1.0, fn: royalItalicFn },
    { key: 'blazingitalic',     title: 'Blazing Italic',      safety: 'safe', group: 'extra', size: 1.0, fn: blazingItalicFn },
    { key: 'giftbowitalic',     title: 'Gift Bow Italic',     safety: 'safe', group: 'extra', size: 1.0, fn: giftBowItalicFn },
    { key: 'sassyitalic',       title: 'Sassy Italic',        safety: 'safe', group: 'extra', size: 1.0, fn: sassyItalicFn },
    { key: 'foodieitalic',      title: 'Foodie Italic',       safety: 'safe', group: 'extra', size: 1.0, fn: foodieItalicFn },
    { key: 'lovestruckitalic',  title: 'Lovestruck Italic',   safety: 'safe', group: 'extra', size: 1.0, fn: lovestruckItalicFn },
    { key: 'happyhouritalic',   title: 'Happy Hour Italic',   safety: 'safe', group: 'extra', size: 1.0, fn: happyHourItalicFn },
    { key: 'gardenfreshitalic', title: 'Garden Fresh Italic', safety: 'safe', group: 'extra', size: 1.0, fn: gardenFreshItalicFn }
  ];

  const STYLE_FNS = {};
  STYLE_DEFS.forEach(function (d) { STYLE_FNS[d.key] = d.fn; });

  const ICON_COPY = '<svg><use href="#icon-copy"></use></svg>';
  const ICON_CHECK = '<svg><use href="#icon-check"></use></svg>';

  function iconUse(id) {
    return '<svg class="tpx-icon" aria-hidden="true"><use href="#' + id + '"></use></svg>';
  }

  function cardTemplate(def) {
    const label = SAFETY_LABELS[def.safety];
    const key = def.key;
    const scale = def.size || 1;
    return (
      '<div class="tpx-itg-font-card tpx-itg-card-empty" id="tpx-itg-card-' + key + '">' +
        '<div class="tpx-itg-card-left">' +
          '<div class="tpx-itg-card-header">' +
            '<div class="tpx-itg-card-title-wrap">' +
              '<span class="tpx-itg-safety-dot ' + def.safety + '" role="img" aria-label="Compatibility: ' + label + '"></span>' +
              '<span class="tpx-itg-card-title">' + def.title + '</span>' +
            '</div>' +
            '<div class="tpx-itg-card-actions">' +
              '<button type="button" class="tpx-itg-copy-btn" data-key="' + key + '" aria-label="Copy ' + def.title + ' text">' + iconUse('icon-copy') + '</button>' +
              '<button type="button" class="tpx-itg-preview-btn" data-key="' + key + '" aria-label="Preview ' + def.title + ' on social platforms" title="Preview on social platforms">' + iconUse('icon-preview') + '</button>' +
              '<button type="button" class="tpx-itg-download-btn" data-key="' + key + '" aria-label="Download ' + def.title + ' text">' + iconUse('icon-download') + '</button>' +
            '</div>' +
          '</div>' +
          '<div class="tpx-itg-card-body tpx-itg-placeholder" data-key="' + key + '" style="--tpx-itg-scale:' + scale + '">Type something to start</div>' +
        '</div>' +
        '<div class="tpx-itg-preview-panel" id="tpx-itg-preview-' + key + '" data-key="' + key + '">' +
          '<div class="tpx-itg-preview-stage">' +
            '<div class="tpx-itg-pv-view tpx-itg-pv-ig" data-view="instagram">' +
              '<div class="tpx-itg-pv-ig-top">' +
                '<div class="tpx-itg-preview-avatar">' + iconUse('icon-person') + '</div>' +
                '<div class="tpx-itg-pv-ig-right">' +
                  '<div class="tpx-itg-pv-ig-name">Toolpx</div>' +
                  '<div class="tpx-itg-pv-ig-stats">' +
                    '<div class="tpx-itg-pv-ig-stat"><b>128</b><span>posts</span></div>' +
                    '<div class="tpx-itg-pv-ig-stat"><b>2,024</b><span>followers</span></div>' +
                    '<div class="tpx-itg-pv-ig-stat"><b>75</b><span>following</span></div>' +
                  '</div>' +
                '</div>' +
              '</div>' +
              '<div class="tpx-itg-pv-ig-bio tpx-itg-preview-bio" data-key="' + key + '">Type something to see it here</div>' +
              '<div class="tpx-itg-pv-ig-link">' + iconUse('icon-link') + '<span>toolpx.com</span><span class="tpx-itg-pv-ig-more">and 3 more</span></div>' +
            '</div>' +
            '<div class="tpx-itg-pv-view tpx-itg-pv-fb" data-view="facebook" hidden>' +
              '<div class="tpx-itg-pv-fb-cover"></div>' +
              '<div class="tpx-itg-pv-fb-body">' +
                '<div class="tpx-itg-pv-fb-top">' +
                  '<div class="tpx-itg-preview-avatar">' + iconUse('icon-person') + '</div>' +
                  '<div class="tpx-itg-pv-fb-right">' +
                    '<div class="tpx-itg-pv-fb-name">Toolpx <span class="tpx-itg-pv-fb-badge">' + iconUse('icon-badge-check') + '</span></div>' +
                    '<div class="tpx-itg-pv-fb-stats"><b>17M</b> followers · <b>1</b> following · <b>1.5K</b> posts</div>' +
                  '</div>' +
                '</div>' +
                '<div class="tpx-itg-pv-fb-category">Page · Artist</div>' +
                '<div class="tpx-itg-pv-fb-bio tpx-itg-preview-bio" data-key="' + key + '">Type something to see it here</div>' +
              '</div>' +
            '</div>' +
            '<div class="tpx-itg-pv-view tpx-itg-pv-x" data-view="x" hidden>' +
              '<div class="tpx-itg-pv-x-cover"></div>' +
              '<div class="tpx-itg-pv-x-body">' +
                '<div class="tpx-itg-preview-avatar tpx-itg-pv-x-avatar">' + iconUse('icon-person') + '</div>' +
                '<div class="tpx-itg-pv-x-top-actions">' +
                  '<div class="tpx-itg-pv-x-icon-btn" aria-label="Notifications">' + iconUse('icon-bell-plus') + '</div>' +
                  '<button type="button" class="tpx-itg-pv-x-follow-btn">' + iconUse('icon-user-plus') + '<span>Follow</span></button>' +
                '</div>' +
                '<div class="tpx-itg-pv-x-name">Toolpx <span class="tpx-itg-pv-x-badge">' + iconUse('icon-badge-check') + '</span></div>' +
                '<div class="tpx-itg-pv-x-handle">@toolpx</div>' +
                '<div class="tpx-itg-pv-x-bio tpx-itg-preview-bio" data-key="' + key + '">Type something to see it here</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="tpx-itg-preview-tabbar">' +
            '<div class="tpx-itg-preview-tabgroup">' +
              '<button type="button" class="tpx-itg-preview-tab is-active" data-platform="instagram" title="Instagram" aria-label="Preview on Instagram">' + iconUse('icon-platform-instagram') + '</button>' +
              '<button type="button" class="tpx-itg-preview-tab" data-platform="facebook" title="Facebook" aria-label="Preview on Facebook">' + iconUse('icon-platform-facebook') + '</button>' +
              '<button type="button" class="tpx-itg-preview-tab" data-platform="x" title="X" aria-label="Preview on X">' + iconUse('icon-platform-twitter') + '</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  const PREVIEW_CHAR_LIMITS = { instagram: 150, facebook: 101, x: 160 };

  function truncateForPlatform(str, limit) {
    if (!limit) return str;
    const chars = Array.from(str);
    if (chars.length <= limit) return str;
    return chars.slice(0, limit - 1).join('') + '…';
  }

  /* ---- Timeline ---- */
  const CHAR_BREAKPOINTS = [
    { chars: 0, pct: 0 },
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
    return Math.min(last.pct + slope * (chars - last.chars), 100);
  }

  function toggleNode(id, reached) {
    const node = document.getElementById(id);
    if (node) node.classList.toggle('is-reached', reached);
  }

  function updateTimeline(chars) {
    const pct = Math.max(0, Math.min(interpolatePct(chars), 100));
    document.getElementById('tpx-itg-timeline-progress').style.width = pct + '%';
    document.getElementById('tpx-itg-timeline-needle').style.left = pct + '%';
    toggleNode('itg-node-fb', chars >= 101);
    toggleNode('itg-node-ig', chars >= 150);
    toggleNode('itg-node-tw', chars >= 160);
    toggleNode('itg-node-discord', chars >= 190);
    toggleNode('itg-node-reddit', chars >= 200);
    toggleNode('itg-node-li', chars >= 220);
  }

  /* ---- Cards / render ---- */
  const PLACEHOLDER_SAMPLE = 'Type something to start';
  const styleRefs = {};

  function buildStyleRefs(key) {
    const fn = STYLE_FNS[key];
    const previewBios = grid.querySelectorAll('.tpx-itg-preview-bio[data-key="' + key + '"]');
    const placeholderText = fn(PLACEHOLDER_SAMPLE);
    const previewPlaceholders = {};
    previewBios.forEach(function (el) {
      const view = el.closest('.tpx-itg-pv-view');
      const platform = view ? view.dataset.view : null;
      previewPlaceholders[platform] = truncateForPlatform(placeholderText, PREVIEW_CHAR_LIMITS[platform]);
    });
    styleRefs[key] = {
      body: grid.querySelector('.tpx-itg-card-body[data-key="' + key + '"]'),
      card: document.getElementById('tpx-itg-card-' + key),
      previewBios: previewBios,
      placeholderText: placeholderText,
      previewPlaceholders: previewPlaceholders
    };
  }

  function renderCardsSlice(start, count, container, append) {
    const defs = STYLE_DEFS.slice(start, start + count);
    const html = defs.map(cardTemplate).join('');
    if (append) {
      container.insertAdjacentHTML('beforeend', html);
    } else {
      container.innerHTML = html;
    }
    defs.forEach(function (d) { buildStyleRefs(d.key); });
    return defs.map(function (d) { return d.key; });
  }

  const INITIAL_COUNT = 5;
  const LOAD_MORE_COUNT = 10;
  let loadedCount = 0;
  let activeKeys = [];

  // Initially show first 5 styles
  activeKeys = renderCardsSlice(0, INITIAL_COUNT, defaultStylesContainer, false);
  loadedCount = INITIAL_COUNT;

  const moreStylesToggle = document.getElementById('tpx-itg-more-styles-toggle');
  if (moreStylesToggle && extraStyles) {
    extraStyles.hidden = false;
    extraStyles.removeAttribute('hidden');

    if (loadedCount >= STYLE_DEFS.length) {
      moreStylesToggle.style.display = 'none';
    }

    // Reveals the next 10 styles per click; the button disappears once
    // every style has been loaded (the final batch may be smaller than 10).
    moreStylesToggle.addEventListener('click', function () {
      if (loadedCount >= STYLE_DEFS.length) {
        moreStylesToggle.style.display = 'none';
        return;
      }
      const nextKeys = renderCardsSlice(loadedCount, LOAD_MORE_COUNT, extraStyles, true);
      activeKeys = activeKeys.concat(nextKeys);
      loadedCount += nextKeys.length;
      const text = ta.value;
      renderKeys(nextKeys, text, text.trim() === '');
      if (loadedCount >= STYLE_DEFS.length) {
        moreStylesToggle.style.display = 'none';
      }
    });
  }

  function renderKeys(keys, text, isEmpty) {
    keys.forEach(function (key) {
      const fn = STYLE_FNS[key];
      const refs = styleRefs[key];
      if (!refs || !refs.body) return;
      if (isEmpty) {
        refs.body.textContent = refs.placeholderText;
        refs.body.classList.add('tpx-itg-placeholder');
        refs.card.classList.add('tpx-itg-card-empty');
        refs.previewBios.forEach(function (el) {
          const view = el.closest('.tpx-itg-pv-view');
          const platform = view ? view.dataset.view : null;
          el.textContent = refs.previewPlaceholders[platform];
        });
      } else {
        const styled = fn(text);
        refs.body.textContent = styled;
        refs.body.classList.remove('tpx-itg-placeholder');
        refs.card.classList.remove('tpx-itg-card-empty');
        refs.previewBios.forEach(function (el) {
          const view = el.closest('.tpx-itg-pv-view');
          const platform = view ? view.dataset.view : null;
          el.textContent = truncateForPlatform(styled, PREVIEW_CHAR_LIMITS[platform]);
        });
      }
    });
  }

  function getActiveKeys() {
    return activeKeys;
  }

  function render() {
    const text = ta.value;
    const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).filter(Boolean).length;
    const chars = text.replace(/\n/g, '').length;
    const charsNoSpaces = text.replace(/\s/g, '').length;
    document.getElementById('tpx-itg-val-words').textContent = words.toLocaleString();
    document.getElementById('tpx-itg-val-chars').textContent = chars.toLocaleString();
    document.getElementById('tpx-itg-val-chars-ns').textContent = charsNoSpaces.toLocaleString();
    updateTimeline(chars);
    renderKeys(getActiveKeys(), text, text.trim() === '');
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

  /* ---- Info toggle ---- */
  const infoToggle = document.getElementById('tpx-itg-info-toggle');
  const infoBody = document.getElementById('tpx-itg-info-body');
  if (infoToggle && infoBody) {
    infoToggle.addEventListener('click', function () {
      const isExpanded = infoToggle.getAttribute('aria-expanded') === 'true';
      infoToggle.setAttribute('aria-expanded', String(!isExpanded));
      infoBody.hidden = isExpanded;
    });
  }

  /* ---- Escape closes open previews ---- */
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('.tpx-itg-preview-panel.is-open').forEach(function (panel) {
      panel.classList.remove('is-open');
      const key = panel.dataset.key;
      const btn = grid.querySelector('.tpx-itg-preview-btn[data-key="' + key + '"]');
      const card = document.getElementById('tpx-itg-card-' + key);
      if (btn) btn.classList.remove('tpx-itg-preview-active');
      if (card) card.classList.remove('tpx-itg-preview-is-open');
    });
  });

  function flashCopied(btn, announceLabel) {
    btn.innerHTML = ICON_CHECK;
    btn.classList.add('tpx-itg-copied');
    if (announceLabel) announce(announceLabel);
    setTimeout(function () {
      btn.innerHTML = ICON_COPY;
      btn.classList.remove('tpx-itg-copied');
    }, 1500);
  }

  function copyCardText(key) {
    const body = grid.querySelector('.tpx-itg-card-body[data-key="' + key + '"]');
    if (!body) return;
    const value = body.textContent;
    if (!value || body.classList.contains('tpx-itg-placeholder')) return;
    const card = document.getElementById('tpx-itg-card-' + key);
    const styleName = card ? card.querySelector('.tpx-itg-card-title').textContent : 'Text';
    const copyBtn = grid.querySelector('.tpx-itg-copy-btn[data-key="' + key + '"]');
    navigator.clipboard.writeText(value).then(function () {
      if (copyBtn) flashCopied(copyBtn, styleName + ' copied');
      else announce(styleName + ' copied');
    }).catch(function () {
      announce('Could not copy — check clipboard permission');
    });
  }

  grid.addEventListener('click', function (e) {
    const copyBtn = e.target.closest('.tpx-itg-copy-btn');
    const dlBtn = e.target.closest('.tpx-itg-download-btn');
    const previewBtn = e.target.closest('.tpx-itg-preview-btn');
    const tabBtn = e.target.closest('.tpx-itg-preview-tab');
    const cardLeft = e.target.closest('.tpx-itg-card-left');

    if (previewBtn) {
      const key = previewBtn.dataset.key;
      const panel = document.getElementById('tpx-itg-preview-' + key);
      const outerCard = document.getElementById('tpx-itg-card-' + key);
      if (panel) {
        const willOpen = !panel.classList.contains('is-open');
        panel.classList.toggle('is-open', willOpen);
        previewBtn.classList.toggle('tpx-itg-preview-active', willOpen);
        if (outerCard) outerCard.classList.toggle('tpx-itg-preview-is-open', willOpen);
      }
      return;
    }

    if (tabBtn) {
      const panel = tabBtn.closest('.tpx-itg-preview-panel');
      const platform = tabBtn.dataset.platform;
      panel.querySelectorAll('.tpx-itg-preview-tab').forEach(function (t) {
        t.classList.toggle('is-active', t === tabBtn);
      });
      panel.querySelectorAll('.tpx-itg-pv-view').forEach(function (v) {
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
      const body = grid.querySelector('.tpx-itg-card-body[data-key="' + key + '"]');
      const value = body.textContent;
      if (!value || body.classList.contains('tpx-itg-placeholder')) return;
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

    if (cardLeft) {
      const body = cardLeft.querySelector('.tpx-itg-card-body');
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

  /* ---- Footer actions ---- */
  document.getElementById('tpx-itg-btn-paste').addEventListener('click', function () {
    navigator.clipboard.readText().then(function (t) {
      ta.value += t;
      render();
      ta.focus();
    }).catch(function () {
      announce('Could not paste — check clipboard permission');
      ta.focus();
    });
  });

  document.getElementById('tpx-itg-btn-clear').addEventListener('click', function () {
    ta.value = '';
    render();
    ta.focus();
  });

  document.getElementById('tpx-itg-btn-copy').addEventListener('click', function () {
    if (!ta.value.trim()) return;
    const btn = this;
    navigator.clipboard.writeText(ta.value).then(function () {
      flashCopied(btn, 'Input copied');
    }).catch(function () {
      announce('Could not copy — check clipboard permission');
    });
  });

  document.getElementById('tpx-itg-btn-upload').addEventListener('click', function () {
    document.getElementById('tpx-itg-file-uploader').click();
  });

  let mammothLoadPromise = null;
  function loadMammoth() {
    if (window.mammoth) return Promise.resolve();
    if (mammothLoadPromise) return mammothLoadPromise;
    mammothLoadPromise = new Promise(function (resolve, reject) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
    return mammothLoadPromise;
  }

  document.getElementById('tpx-itg-file-uploader').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'txt') {
      const reader = new FileReader();
      reader.onload = function (evt) {
        ta.value = evt.target.result;
        render();
      };
      reader.onerror = function () {
        announce('Could not read that file');
      };
      reader.readAsText(file);
    } else if (ext === 'docx') {
      loadMammoth().then(function () {
        const reader = new FileReader();
        reader.onload = function (evt) {
          window.mammoth.extractRawText({ arrayBuffer: evt.target.result })
            .then(function (result) {
              ta.value = result.value;
              render();
            })
            .catch(function () {
              announce('Could not read that .docx file');
            });
        };
        reader.onerror = function () {
          announce('Could not read that file');
        };
        reader.readAsArrayBuffer(file);
      }).catch(function () {
        announce('Could not load the document reader — check your connection');
      });
    } else {
      announce('Unsupported file type — upload a .txt or .docx file');
    }
    this.value = '';
  });

  render();
});
