document.addEventListener('DOMContentLoaded', function () {
  const ta = document.getElementById('tpx-btg-input');
  const grid = document.getElementById('tpx-btg-fonts-grid');
  const defaultStylesContainer = document.getElementById('tpx-btg-default-styles');
  const extraStyles = document.getElementById('tpx-btg-extra-styles');
  const announcer = document.getElementById('tpx-btg-sr-announcer');

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

  // Currency style
  const CURRENCY = {
    a:'₳',b:'฿',c:'₵',d:'Ð',e:'€',f:'₣',g:'₲',h:'Ⱨ',i:'ł',j:'ɉ',k:'₭',l:'₤',m:'M',n:'₦',o:'Ø',p:'₱',q:'Ꝗ',r:'₹',s:'$',t:'₮',u:'Ʉ',v:'Ѵ',w:'₩',x:'Ӿ',y:'¥',z:'Ƶ',
    A:'₳',B:'฿',C:'₵',D:'Ð',E:'€',F:'₣',G:'₲',H:'Ⱨ',I:'ł',J:'Ɉ',K:'₭',L:'₤',M:'M',N:'₦',O:'Ø',P:'₱',Q:'Ꝗ',R:'₹',S:'$',T:'₮',U:'Ʉ',V:'Ѵ',W:'₩',X:'Ӿ',Y:'¥',Z:'Ƶ'
  };

  function negativeCircled(text) {
    let out = '';
    for (const ch of text) {
      const up = ch.toUpperCase();
      if (up >= 'A' && up <= 'Z') out += String.fromCodePoint(0x1F150 + (up.charCodeAt(0) - 65));
      else out += ch;
    }
    return out;
  }

  function negativeSquared(text) {
    let out = '';
    for (const ch of text) {
      const up = ch.toUpperCase();
      if (up >= 'A' && up <= 'Z') out += String.fromCodePoint(0x1F170 + (up.charCodeAt(0) - 65));
      else out += ch;
    }
    return out;
  }

  /* ---- Core bold transforms ---- */
  function boldFn(t) { return mapContiguous(t, 0x1D5D4, 0x1D5EE, 0x1D7EC, {}); }
  function boldItalicFn(t) { return mapContiguous(t, 0x1D63C, 0x1D656, null, {}); }
  function serifBoldFn(t) { return mapContiguous(t, 0x1D400, 0x1D41A, 0x1D7CE, {}); }
  function serifBoldItalicFn(t) { return mapContiguous(t, 0x1D468, 0x1D482, null, {}); }
  function boldScriptFn(t) { return mapContiguous(t, 0x1D4D0, 0x1D4EA, null, {}); }
  function frakturBoldFn(t) { return mapContiguous(t, 0x1D56C, 0x1D586, null, {}); }
  function currencyFn(t) { return mapLookup(t, CURRENCY); }

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

  const SWEET_START = emojiSeq([0x1F370, 0x1F36A, 0x1F9C1]);
  const SWEET_END = emojiSeq([0x1F366, 0x1F36D, 0x1F369]);

  const VEGGIE_START = emojiSeq([0x1F955, 0x1F345, 0x1F966]);
  const VEGGIE_END = emojiSeq([0x1F346, 0x1F33D, 0x1F951]);

  /* ---- Emoji-decorated bold transforms ---- */
  function royalBoldFn(t) { return EMOJI_CROWN + ' ' + boldFn(t) + ' ' + EMOJI_CROWN; }
  function blazingBoldFn(t) { return EMOJI_FIRE + ' ' + boldFn(t) + ' ' + EMOJI_FIRE; }
  function sassyBoldFn(t) { return EMOJI_PEACE + boldScriptFn(t) + EMOJI_PEACE; }
  function foodieBoldFn(t) { return FOOD_START + ' ' + boldScriptFn(t) + ' ' + FOOD_END; }
  function lovestruckBoldFn(t) { return LOVE_START + ' ' + boldScriptFn(t) + ' ' + LOVE_END; }
  function happyHourBoldFn(t) { return DRINK_START + ' ' + boldScriptFn(t) + ' ' + DRINK_END; }
  function sweetToothBoldFn(t) { return SWEET_START + ' ' + boldScriptFn(t) + ' ' + SWEET_END; }
  function gardenFreshBoldFn(t) { return VEGGIE_START + ' ' + boldScriptFn(t) + ' ' + VEGGIE_END; }

  /* ---- Style config ---- */
  const SAFETY_LABELS = {
    safe: 'Safe everywhere',
    warn: 'May not render on older devices',
    risk: 'Often shows as boxes on some platforms'
  };

  const STYLE_DEFS = [
    // Default 5 — core bold typography variants
    { key: 'bold',             title: 'Bold',                 safety: 'safe', group: 'default', size: 1.05, fn: boldFn },
    { key: 'bolditalic',       title: 'Bold Italic',          safety: 'safe', group: 'default', size: 1.05, fn: boldItalicFn },
    { key: 'serifbold',        title: 'Serif Bold',           safety: 'safe', group: 'default', size: 1.05, fn: serifBoldFn },
    { key: 'serifbolditalic',  title: 'Serif Bold Italic',    safety: 'safe', group: 'default', size: 1.05, fn: serifBoldItalicFn },
    { key: 'boldscript',       title: 'Bold Script',          safety: 'warn', group: 'default', size: 1.05, fn: boldScriptFn },

    // Extra 12 — "Show More"
    { key: 'frakturbold',      title: 'Fraktur Bold',         safety: 'warn', group: 'extra', size: 1.10, fn: frakturBoldFn },
    // BUG-AWARE RATING: Negative Circled and Negative Squared both come from
    // the Enclosed Alphanumeric Supplement astral block (U+1F150 / U+1F170),
    // a newer, emoji-adjacent range with real support gaps — rated 'risk'
    // together, consistent with how ToolPX rates that block elsewhere.
    { key: 'negcircled',       title: 'Negative Circled',     safety: 'risk', group: 'extra', size: 1.10, fn: negativeCircled },
    { key: 'negsquared',       title: 'Negative Squared',     safety: 'risk', group: 'extra', size: 1.10, fn: negativeSquared },
    { key: 'currency',         title: 'Currency',             safety: 'warn', group: 'extra', size: 1.00, fn: currencyFn },
    { key: 'royalbold',        title: 'Royal Bold',           safety: 'safe', group: 'extra', size: 1.05, fn: royalBoldFn },
    { key: 'blazingbold',      title: 'Blazing Bold',         safety: 'safe', group: 'extra', size: 1.05, fn: blazingBoldFn },
    // These six wrap Bold Script under the hood, so they share Bold Script's
    // 'warn' (Limited Support) rating rather than being marked 'safe'.
    { key: 'sassybold',        title: 'Sassy Bold',           safety: 'warn', group: 'extra', size: 1.05, fn: sassyBoldFn },
    { key: 'foodiebold',       title: 'Foodie Bold',          safety: 'warn', group: 'extra', size: 1.05, fn: foodieBoldFn },
    { key: 'lovestruckbold',   title: 'Lovestruck Bold',      safety: 'warn', group: 'extra', size: 1.05, fn: lovestruckBoldFn },
    { key: 'happyhourbold',    title: 'Happy Hour Bold',      safety: 'warn', group: 'extra', size: 1.05, fn: happyHourBoldFn },
    { key: 'sweettoothbold',   title: 'Sweet Tooth Bold',     safety: 'warn', group: 'extra', size: 1.05, fn: sweetToothBoldFn },
    { key: 'gardenfreshbold',  title: 'Garden Fresh Bold',    safety: 'warn', group: 'extra', size: 1.05, fn: gardenFreshBoldFn }
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
      '<div class="tpx-btg-font-card tpx-btg-card-empty" id="tpx-btg-card-' + key + '">' +
        '<div class="tpx-btg-card-left">' +
          '<div class="tpx-btg-card-header">' +
            '<div class="tpx-btg-card-title-wrap">' +
              '<span class="tpx-btg-safety-dot ' + def.safety + '" role="img" aria-label="Compatibility: ' + label + '"></span>' +
              '<span class="tpx-btg-card-title">' + def.title + '</span>' +
            '</div>' +
            '<div class="tpx-btg-card-actions">' +
              '<button type="button" class="tpx-btg-copy-btn" data-key="' + key + '" aria-label="Copy ' + def.title + ' text">' + iconUse('icon-copy') + '</button>' +
              '<button type="button" class="tpx-btg-preview-btn" data-key="' + key + '" aria-label="Preview ' + def.title + ' on social platforms" title="Preview on social platforms">' + iconUse('icon-preview') + '</button>' +
              '<button type="button" class="tpx-btg-download-btn" data-key="' + key + '" aria-label="Download ' + def.title + ' text">' + iconUse('icon-download') + '</button>' +
            '</div>' +
          '</div>' +
          '<div class="tpx-btg-card-body tpx-btg-placeholder" data-key="' + key + '" style="--tpx-btg-scale:' + scale + '">Type something to start</div>' +
        '</div>' +
        '<div class="tpx-btg-preview-panel" id="tpx-btg-preview-' + key + '" data-key="' + key + '">' +
          '<div class="tpx-btg-preview-stage">' +
            '<div class="tpx-btg-pv-view tpx-btg-pv-ig" data-view="instagram">' +
              '<div class="tpx-btg-pv-ig-top">' +
                '<div class="tpx-btg-preview-avatar">' + iconUse('icon-person') + '</div>' +
                '<div class="tpx-btg-pv-ig-right">' +
                  '<div class="tpx-btg-pv-ig-name">Toolpx</div>' +
                  '<div class="tpx-btg-pv-ig-stats">' +
                    '<div class="tpx-btg-pv-ig-stat"><b>128</b><span>posts</span></div>' +
                    '<div class="tpx-btg-pv-ig-stat"><b>2,024</b><span>followers</span></div>' +
                    '<div class="tpx-btg-pv-ig-stat"><b>75</b><span>following</span></div>' +
                  '</div>' +
                '</div>' +
              '</div>' +
              '<div class="tpx-btg-pv-ig-bio tpx-btg-preview-bio" data-key="' + key + '">Type something to see it here</div>' +
              '<div class="tpx-btg-pv-ig-link">' + iconUse('icon-link') + '<span>toolpx.com</span><span class="tpx-btg-pv-ig-more">and 3 more</span></div>' +
            '</div>' +
            '<div class="tpx-btg-pv-view tpx-btg-pv-fb" data-view="facebook" hidden>' +
              '<div class="tpx-btg-pv-fb-cover"></div>' +
              '<div class="tpx-btg-pv-fb-body">' +
                '<div class="tpx-btg-pv-fb-top">' +
                  '<div class="tpx-btg-preview-avatar">' + iconUse('icon-person') + '</div>' +
                  '<div class="tpx-btg-pv-fb-right">' +
                    '<div class="tpx-btg-pv-fb-name">Toolpx <span class="tpx-btg-pv-fb-badge">' + iconUse('icon-badge-check') + '</span></div>' +
                    '<div class="tpx-btg-pv-fb-stats"><b>17M</b> followers · <b>1</b> following · <b>1.5K</b> posts</div>' +
                  '</div>' +
                '</div>' +
                '<div class="tpx-btg-pv-fb-category">Page · Artist</div>' +
                '<div class="tpx-btg-pv-fb-bio tpx-btg-preview-bio" data-key="' + key + '">Type something to see it here</div>' +
              '</div>' +
            '</div>' +
            '<div class="tpx-btg-pv-view tpx-btg-pv-x" data-view="x" hidden>' +
              '<div class="tpx-btg-pv-x-cover"></div>' +
              '<div class="tpx-btg-pv-x-body">' +
                '<div class="tpx-btg-preview-avatar tpx-btg-pv-x-avatar">' + iconUse('icon-person') + '</div>' +
                '<div class="tpx-btg-pv-x-top-actions">' +
                  '<div class="tpx-btg-pv-x-icon-btn" aria-label="Notifications">' + iconUse('icon-bell-plus') + '</div>' +
                  '<button type="button" class="tpx-btg-pv-x-follow-btn">' + iconUse('icon-user-plus') + '<span>Follow</span></button>' +
                '</div>' +
                '<div class="tpx-btg-pv-x-name">Toolpx <span class="tpx-btg-pv-x-badge">' + iconUse('icon-badge-check') + '</span></div>' +
                '<div class="tpx-btg-pv-x-handle">@toolpx</div>' +
                '<div class="tpx-btg-pv-x-bio tpx-btg-preview-bio" data-key="' + key + '">Type something to see it here</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="tpx-btg-preview-tabbar">' +
            '<div class="tpx-btg-preview-tabgroup">' +
              '<button type="button" class="tpx-btg-preview-tab is-active" data-platform="instagram" title="Instagram" aria-label="Preview on Instagram">' + iconUse('icon-platform-instagram') + '</button>' +
              '<button type="button" class="tpx-btg-preview-tab" data-platform="facebook" title="Facebook" aria-label="Preview on Facebook">' + iconUse('icon-platform-facebook') + '</button>' +
              '<button type="button" class="tpx-btg-preview-tab" data-platform="x" title="X" aria-label="Preview on X">' + iconUse('icon-platform-twitter') + '</button>' +
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
    document.getElementById('tpx-timeline-progress').style.width = pct + '%';
    document.getElementById('tpx-timeline-needle').style.left = pct + '%';
    toggleNode('node-fb', chars >= 101);
    toggleNode('node-ig', chars >= 150);
    toggleNode('node-tw', chars >= 160);
    toggleNode('node-discord', chars >= 190);
    toggleNode('node-reddit', chars >= 200);
    toggleNode('node-li', chars >= 220);
  }

  /* ---- Cards / render ---- */
  const PLACEHOLDER_SAMPLE = 'Type something to start';
  const styleRefs = {};

  function buildStyleRefs(key) {
    const fn = STYLE_FNS[key];
    const previewBios = grid.querySelectorAll('.tpx-btg-preview-bio[data-key="' + key + '"]');
    const placeholderText = fn(PLACEHOLDER_SAMPLE);
    const previewPlaceholders = {};
    previewBios.forEach(function (el) {
      const view = el.closest('.tpx-btg-pv-view');
      const platform = view ? view.dataset.view : null;
      previewPlaceholders[platform] = truncateForPlatform(placeholderText, PREVIEW_CHAR_LIMITS[platform]);
    });
    styleRefs[key] = {
      body: grid.querySelector('.tpx-btg-card-body[data-key="' + key + '"]'),
      card: document.getElementById('tpx-btg-card-' + key),
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
  const LOAD_MORE_COUNT = 12;
  let loadedCount = 0;
  let activeKeys = [];

  // Initially show first 5 styles
  activeKeys = renderCardsSlice(0, INITIAL_COUNT, defaultStylesContainer, false);
  loadedCount = INITIAL_COUNT;

  const moreStylesToggle = document.getElementById('tpx-btg-more-styles-toggle');
  if (moreStylesToggle && extraStyles) {
    extraStyles.hidden = false;
    extraStyles.removeAttribute('hidden');

    if (loadedCount >= STYLE_DEFS.length) {
      moreStylesToggle.style.display = 'none';
    }

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
        refs.body.classList.add('tpx-btg-placeholder');
        refs.card.classList.add('tpx-btg-card-empty');
        refs.previewBios.forEach(function (el) {
          const view = el.closest('.tpx-btg-pv-view');
          const platform = view ? view.dataset.view : null;
          el.textContent = refs.previewPlaceholders[platform];
        });
      } else {
        const styled = fn(text);
        refs.body.textContent = styled;
        refs.body.classList.remove('tpx-btg-placeholder');
        refs.card.classList.remove('tpx-btg-card-empty');
        refs.previewBios.forEach(function (el) {
          const view = el.closest('.tpx-btg-pv-view');
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
    document.getElementById('tpx-btg-val-words').textContent = words.toLocaleString();
    document.getElementById('tpx-btg-val-chars').textContent = chars.toLocaleString();
    document.getElementById('tpx-btg-val-chars-ns').textContent = charsNoSpaces.toLocaleString();
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
  const infoToggle = document.getElementById('tpx-btg-info-toggle');
  const infoBody = document.getElementById('tpx-btg-info-body');
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
    document.querySelectorAll('.tpx-btg-preview-panel.is-open').forEach(function (panel) {
      panel.classList.remove('is-open');
      const key = panel.dataset.key;
      const btn = grid.querySelector('.tpx-btg-preview-btn[data-key="' + key + '"]');
      const card = document.getElementById('tpx-btg-card-' + key);
      if (btn) btn.classList.remove('tpx-btg-preview-active');
      if (card) card.classList.remove('tpx-btg-preview-is-open');
    });
  });

  function flashCopied(btn, announceLabel) {
    btn.innerHTML = ICON_CHECK;
    btn.classList.add('tpx-btg-copied');
    if (announceLabel) announce(announceLabel);
    setTimeout(function () {
      btn.innerHTML = ICON_COPY;
      btn.classList.remove('tpx-btg-copied');
    }, 1500);
  }

  function copyCardText(key) {
    const body = grid.querySelector('.tpx-btg-card-body[data-key="' + key + '"]');
    if (!body) return;
    const value = body.textContent;
    if (!value || body.classList.contains('tpx-btg-placeholder')) return;
    const card = document.getElementById('tpx-btg-card-' + key);
    const styleName = card ? card.querySelector('.tpx-btg-card-title').textContent : 'Text';
    const copyBtn = grid.querySelector('.tpx-btg-copy-btn[data-key="' + key + '"]');
    navigator.clipboard.writeText(value).then(function () {
      if (copyBtn) flashCopied(copyBtn, styleName + ' copied');
      else announce(styleName + ' copied');
    }).catch(function () {
      announce('Could not copy — check clipboard permission');
    });
  }

  grid.addEventListener('click', function (e) {
    const copyBtn = e.target.closest('.tpx-btg-copy-btn');
    const dlBtn = e.target.closest('.tpx-btg-download-btn');
    const previewBtn = e.target.closest('.tpx-btg-preview-btn');
    const tabBtn = e.target.closest('.tpx-btg-preview-tab');
    const cardLeft = e.target.closest('.tpx-btg-card-left');

    if (previewBtn) {
      const key = previewBtn.dataset.key;
      const panel = document.getElementById('tpx-btg-preview-' + key);
      const outerCard = document.getElementById('tpx-btg-card-' + key);
      if (panel) {
        const willOpen = !panel.classList.contains('is-open');
        panel.classList.toggle('is-open', willOpen);
        previewBtn.classList.toggle('tpx-btg-preview-active', willOpen);
        if (outerCard) outerCard.classList.toggle('tpx-btg-preview-is-open', willOpen);
      }
      return;
    }

    if (tabBtn) {
      const panel = tabBtn.closest('.tpx-btg-preview-panel');
      const platform = tabBtn.dataset.platform;
      panel.querySelectorAll('.tpx-btg-preview-tab').forEach(function (t) {
        t.classList.toggle('is-active', t === tabBtn);
      });
      panel.querySelectorAll('.tpx-btg-pv-view').forEach(function (v) {
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
      const body = grid.querySelector('.tpx-btg-card-body[data-key="' + key + '"]');
      const value = body.textContent;
      if (!value || body.classList.contains('tpx-btg-placeholder')) return;
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
      const body = cardLeft.querySelector('.tpx-btg-card-body');
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
  document.getElementById('tpx-btg-btn-paste').addEventListener('click', function () {
    navigator.clipboard.readText().then(function (t) {
      ta.value += t;
      render();
      ta.focus();
    }).catch(function () {
      announce('Could not paste — check clipboard permission');
      ta.focus();
    });
  });

  document.getElementById('tpx-btg-btn-clear').addEventListener('click', function () {
    ta.value = '';
    render();
    ta.focus();
  });

  document.getElementById('tpx-btg-btn-copy').addEventListener('click', function () {
    if (!ta.value.trim()) return;
    const btn = this;
    navigator.clipboard.writeText(ta.value).then(function () {
      flashCopied(btn, 'Input copied');
    }).catch(function () {
      announce('Could not copy — check clipboard permission');
    });
  });

  document.getElementById('tpx-btg-btn-upload').addEventListener('click', function () {
    document.getElementById('tpx-btg-file-uploader').click();
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

  document.getElementById('tpx-btg-file-uploader').addEventListener('change', function (e) {
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
