document.addEventListener('DOMContentLoaded', function () {
  const ta = document.getElementById('tpx-cfg-input');
  const grid = document.getElementById('tpx-cfg-fonts-grid');
  const defaultStylesContainer = document.getElementById('tpx-cfg-default-styles');
  const extraStyles = document.getElementById('tpx-cfg-extra-styles');
  const announcer = document.getElementById('tpx-cfg-sr-announcer');

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

  const SMALLCAPS = { a:'ᴀ',b:'ʙ',c:'ᴄ',d:'ᴅ',e:'ᴇ',f:'ꜰ',g:'ɢ',h:'ʜ',i:'ɪ',j:'ᴊ',k:'ᴋ',l:'ʟ',m:'ᴍ',n:'ɴ',o:'ᴏ',p:'ᴘ',q:'ǫ',r:'ʀ',s:'ꜱ',t:'ᴛ',u:'ᴜ',v:'ᴠ',w:'ᴡ',y:'ʏ',z:'ᴢ' };

  const UPSIDE_LOWER = { a:'ɐ',b:'q',c:'ɔ',d:'p',e:'ǝ',f:'ɟ',g:'ƃ',h:'ɥ',i:'ᴉ',j:'ɾ',k:'ʞ',l:'l',m:'ɯ',n:'u',o:'o',p:'d',q:'b',r:'ɹ',s:'s',t:'ʇ',u:'n',v:'ʌ',w:'ʍ',x:'x',y:'ʎ',z:'z' };
  const UPSIDE_UPPER = { A:'∀',B:'ᙠ',C:'Ↄ',D:'ᗡ',E:'Ǝ',F:'Ⅎ',G:'⅁',H:'H',I:'I',J:'ſ',K:'ʞ',L:'˥',M:'W',N:'N',O:'O',P:'Ԁ',Q:'Q',R:'ᴚ',S:'S',T:'⊥',U:'∩',V:'Λ',W:'M',X:'X',Y:'⅄',Z:'Z' };
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

  // Gaming / Canadian Aboriginal style
  const GAMING = {
    a:'ᗩ',b:'ᗷ',c:'ᑕ',d:'ᗪ',e:'E',f:'ᖴ',g:'G',h:'ᕼ',i:'I',j:'ᒍ',k:'K',l:'ᒪ',m:'ᗰ',n:'ᑎ',o:'O',p:'ᑭ',q:'ᑫ',r:'ᖇ',s:'S',t:'T',u:'ᑌ',v:'ᐯ',w:'ᗯ',x:'᙭',y:'Y',z:'ᘔ',
    A:'ᗩ',B:'ᗷ',C:'ᑕ',D:'ᗪ',E:'E',F:'ᖴ',G:'G',H:'ᕼ',I:'I',J:'ᒍ',K:'K',L:'ᒪ',M:'ᗰ',N:'ᑎ',O:'O',P:'ᑭ',Q:'ᑫ',R:'ᖇ',S:'S',T:'T',U:'ᑌ',V:'ᐯ',W:'ᗯ',X:'᙭',Y:'Y',Z:'ᘔ'
  };

  // Fairytale
  const FAIRYTALE = {
    a:'Ꮧ',b:'Ᏸ',c:'Ꮳ',d:'Ꮄ',e:'Ꮛ',f:'Ꮈ',g:'Ꮆ',h:'Ꮒ',i:'Ꭵ',j:'Ꮰ',k:'Ꮶ',l:'Ꮮ',m:'Ꮇ',n:'Ꮑ',o:'Ꭷ',p:'Ꭾ',q:'Ꭴ',r:'Ꮢ',s:'Ꮥ',t:'Ꮦ',u:'Ꮼ',v:'Ꮙ',w:'Ꮗ',x:'ጀ',y:'Ꭹ',z:'ፚ',
    A:'Ꮧ',B:'Ᏸ',C:'Ꮳ',D:'Ꮄ',E:'Ꮛ',F:'Ꮈ',G:'Ꮆ',H:'Ꮒ',I:'Ꭵ',J:'Ꮰ',K:'Ꮶ',L:'Ꮮ',M:'Ꮇ',N:'Ꮑ',O:'Ꭷ',P:'Ꭾ',Q:'Ꭴ',R:'Ꮢ',S:'Ꮥ',T:'Ꮦ',U:'Ꮼ',V:'Ꮙ',W:'Ꮗ',X:'ጀ',Y:'Ꭹ',Z:'ፚ'
  };

  // Cyberpunk
  const CYBERPUNK = {
    a:'Δ',b:'β',c:'Ć',d:'Đ',e:'€',f:'₣',g:'Ǥ',h:'Ħ',i:'Ɨ',j:'Ĵ',k:'Ҝ',l:'Ł',m:'Μ',n:'Ň',o:'Ø',p:'Ƥ',q:'Ω',r:'Ř',s:'Ş',t:'Ŧ',u:'Ữ',v:'V',w:'Ŵ',x:'Ж',y:'¥',z:'Ž',
    A:'Δ',B:'β',C:'Ć',D:'Đ',E:'€',F:'₣',G:'Ǥ',H:'Ħ',I:'Ɨ',J:'Ĵ',K:'Ҝ',L:'Ł',M:'Μ',N:'Ň',O:'Ø',P:'Ƥ',Q:'Ω',R:'Ř',S:'Ş',T:'Ŧ',U:'Ữ',V:'V',W:'Ŵ',X:'Ж',Y:'¥',Z:'Ž'
  };

  // Old Italic
  const OLD_ITALIC = {
    a:'𐌀',b:'𐌁',c:'𐌂',d:'𐌃',e:'𐌄',f:'𐌅',g:'Ᏼ',h:'𐋅',i:'𐌉',j:'Ꮭ',k:'𐌊',l:'𐌋',m:'𐌌',n:'𐌍',o:'Ꝋ',p:'𐌐',q:'𐌒',r:'𐌓',s:'𐌔',t:'𐌕',u:'𐌵',v:'ᕓ',w:'Ꮤ',x:'𐋄',y:'𐌙',z:'Ɀ',
    A:'𐌀',B:'𐌁',C:'𐌂',D:'𐌃',E:'𐌄',F:'𐌅',G:'Ᏼ',H:'𐋅',I:'𐌉',J:'Ꮭ',K:'𐌊',L:'𐌋',M:'𐌌',N:'𐌍',O:'Ꝋ',P:'𐌐',Q:'𐌒',R:'𐌓',S:'𐌔',T:'𐌕',U:'𐌵',V:'ᕓ',W:'Ꮤ',X:'𐋄',Y:'𐌙',Z:'Ɀ'
  };

  /* ---- Style config ---- */
  const SAFETY_LABELS = {
    safe: 'Safe everywhere',
    warn: 'May not render on older devices',
    risk: 'Often shows as boxes on some platforms'
  };

  // Emoji are built from their Unicode code points rather than typed as
  // literal characters in this JS file, per ToolPX's established WordPress
  // deployment rule ("Emoji in JS strings must be avoided — WordPress
  // mangles them"). Safe regardless of how/where this file is edited or embedded.
  const EMOJI_HEART = String.fromCodePoint(0x1F495);
  const EMOJI_CROWN = String.fromCodePoint(0x1F451);
  const EMOJI_FIRE = String.fromCodePoint(0x1F525);
  const EMOJI_SPARKLE = String.fromCodePoint(0x2728);
  const EMOJI_BOW = String.fromCodePoint(0x1F380);
  const EMOJI_PEACE = String.fromCodePoint(0x270C, 0xFE0F);

  const boldScriptFn = t => mapContiguous(t, 0x1D4D0, 0x1D4EA, null, {});
  function wrapEmoji(fn, emoji) {
    return function (t) { return emoji + ' ' + fn(t) + ' ' + emoji; };
  }

  const STYLE_DEFS = [
    // First 5 are shown by default; the rest load in batches of 10 via
    // "Show More" (10, then the remaining 5, then the button disappears).
    { key: 'script',           title: 'Script',            safety: 'warn', group: 'default', size: 1.05, fn: t => mapContiguous(t, 0x1D49C, 0x1D4B6, null, { B: 'ℬ', E: 'ℰ', F: 'ℱ', H: 'ℋ', I: 'ℐ', L: 'ℒ', M: 'ℳ', R: 'ℛ', e: 'ℯ', g: 'ℊ', o: 'ℴ' }) },
    { key: 'boldscript',       title: 'Bold Script',       safety: 'warn', group: 'default', size: 1.05, fn: boldScriptFn },
    { key: 'italic',           title: 'Italic',            safety: 'safe', group: 'default', size: 1.05, fn: t => mapContiguous(t, 0x1D608, 0x1D622, null, {}) },
    { key: 'bolditalic',       title: 'Bold Italic',       safety: 'safe', group: 'default', size: 1.05, fn: t => mapContiguous(t, 0x1D63C, 0x1D656, null, {}) },
    { key: 'serifitalic',      title: 'Serif Italic',      safety: 'safe', group: 'default', size: 1.05, fn: t => mapContiguous(t, 0x1D434, 0x1D44E, null, { h: 'ℎ' }) },

    { key: 'serifbolditalic',  title: 'Serif Bold Italic', safety: 'safe', group: 'extra', size: 1.05, fn: t => mapContiguous(t, 0x1D468, 0x1D482, null, {}) },
    { key: 'heartscript',      title: 'Heart Script',      safety: 'warn', group: 'extra', size: 1.05, fn: wrapEmoji(boldScriptFn, EMOJI_HEART) },
    { key: 'royalscript',      title: 'Royal Script',      safety: 'warn', group: 'extra', size: 1.05, fn: wrapEmoji(boldScriptFn, EMOJI_CROWN) },
    { key: 'blazingscript',    title: 'Blazing Script',    safety: 'warn', group: 'extra', size: 1.05, fn: wrapEmoji(boldScriptFn, EMOJI_FIRE) },
    { key: 'sparklescript',    title: 'Sparkle Script',    safety: 'warn', group: 'extra', size: 1.05, fn: wrapEmoji(boldScriptFn, EMOJI_SPARKLE) },
    { key: 'bowscript',        title: 'Bow Script',        safety: 'warn', group: 'extra', size: 1.05, fn: wrapEmoji(boldScriptFn, EMOJI_BOW) },
    { key: 'sassyscript',      title: 'Sassy Script',      safety: 'warn', group: 'extra', size: 1.05, fn: wrapEmoji(boldScriptFn, EMOJI_PEACE) },
    { key: 'smallcaps',        title: 'Small Caps',        safety: 'safe', group: 'extra', size: 1.00, fn: t => mapLookup(t, SMALLCAPS) },
    { key: 'doublestruck',     title: 'Double-Struck',     safety: 'warn', group: 'extra', size: 1.05, fn: t => mapContiguous(t, 0x1D538, 0x1D552, 0x1D7D8, { C: 'ℂ', H: 'ℍ', N: 'ℕ', P: 'ℙ', Q: 'ℚ', R: 'ℝ', Z: 'ℤ' }) },
    { key: 'gaming',           title: 'Gaming',            safety: 'safe', group: 'extra', size: 1.00, fn: t => mapLookup(t, GAMING) },
    { key: 'upsidedown',       title: 'Upside Down',       safety: 'safe', group: 'extra', size: 1.00, fn: upsideDown },

    { key: 'cyberpunk',        title: 'Cyberpunk',         safety: 'warn', group: 'extra', size: 1.00, fn: t => mapLookup(t, CYBERPUNK) },
    { key: 'fairytale',        title: 'Fairytale',         safety: 'warn', group: 'extra', size: 1.00, fn: t => mapLookup(t, FAIRYTALE) },
    { key: 'olditalic',        title: 'Old Italic',        safety: 'risk', group: 'extra', size: 1.00, fn: t => mapLookup(t, OLD_ITALIC) },
    { key: 'fraktur',          title: 'Fraktur',           safety: 'warn', group: 'extra', size: 1.10, fn: t => mapContiguous(t, 0x1D504, 0x1D51E, null, { C: 'ℭ', H: 'ℌ', I: 'ℑ', R: 'ℜ', Z: 'ℨ' }) },
    { key: 'frakturbold',      title: 'Fraktur Bold',      safety: 'warn', group: 'extra', size: 1.10, fn: t => mapContiguous(t, 0x1D56C, 0x1D586, null, {}) }
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
      '<div class="tpx-cfg-font-card tpx-cfg-card-empty" id="tpx-cfg-card-' + key + '">' +
        '<div class="tpx-cfg-card-left">' +
          '<div class="tpx-cfg-card-header">' +
            '<div class="tpx-cfg-card-title-wrap">' +
              '<span class="tpx-cfg-safety-dot ' + def.safety + '" role="img" aria-label="Compatibility: ' + label + '"></span>' +
              '<span class="tpx-cfg-card-title">' + def.title + '</span>' +
            '</div>' +
            '<div class="tpx-cfg-card-actions">' +
              '<button type="button" class="tpx-cfg-copy-btn" data-key="' + key + '" aria-label="Copy ' + def.title + ' text">' + iconUse('icon-copy') + '</button>' +
              '<button type="button" class="tpx-cfg-preview-btn" data-key="' + key + '" aria-label="Preview ' + def.title + ' on social platforms" title="Preview on social platforms">' + iconUse('icon-preview') + '</button>' +
              '<button type="button" class="tpx-cfg-download-btn" data-key="' + key + '" aria-label="Download ' + def.title + ' text">' + iconUse('icon-download') + '</button>' +
            '</div>' +
          '</div>' +
          '<div class="tpx-cfg-card-body tpx-cfg-placeholder" data-key="' + key + '" style="--tpx-cfg-scale:' + scale + '">Type something to start</div>' +
        '</div>' +
        '<div class="tpx-cfg-preview-panel" id="tpx-cfg-preview-' + key + '" data-key="' + key + '">' +
          '<div class="tpx-cfg-preview-stage">' +
            '<div class="tpx-cfg-pv-view tpx-cfg-pv-ig" data-view="instagram">' +
              '<div class="tpx-cfg-pv-ig-top">' +
                '<div class="tpx-cfg-preview-avatar">' + iconUse('icon-person') + '</div>' +
                '<div class="tpx-cfg-pv-ig-right">' +
                  '<div class="tpx-cfg-pv-ig-name">Toolpx</div>' +
                  '<div class="tpx-cfg-pv-ig-stats">' +
                    '<div class="tpx-cfg-pv-ig-stat"><b>128</b><span>posts</span></div>' +
                    '<div class="tpx-cfg-pv-ig-stat"><b>2,024</b><span>followers</span></div>' +
                    '<div class="tpx-cfg-pv-ig-stat"><b>75</b><span>following</span></div>' +
                  '</div>' +
                '</div>' +
              '</div>' +
              '<div class="tpx-cfg-pv-ig-bio tpx-cfg-preview-bio" data-key="' + key + '">Type something to see it here</div>' +
              '<div class="tpx-cfg-pv-ig-link">' + iconUse('icon-link') + '<span>toolpx.com</span><span class="tpx-cfg-pv-ig-more">and 3 more</span></div>' +
            '</div>' +
            '<div class="tpx-cfg-pv-view tpx-cfg-pv-fb" data-view="facebook" hidden>' +
              '<div class="tpx-cfg-pv-fb-cover"></div>' +
              '<div class="tpx-cfg-pv-fb-body">' +
                '<div class="tpx-cfg-pv-fb-top">' +
                  '<div class="tpx-cfg-preview-avatar">' + iconUse('icon-person') + '</div>' +
                  '<div class="tpx-cfg-pv-fb-right">' +
                    '<div class="tpx-cfg-pv-fb-name">Toolpx <span class="tpx-cfg-pv-fb-badge">' + iconUse('icon-badge-check') + '</span></div>' +
                    '<div class="tpx-cfg-pv-fb-stats"><b>17M</b> followers · <b>1</b> following · <b>1.5K</b> posts</div>' +
                  '</div>' +
                '</div>' +
                '<div class="tpx-cfg-pv-fb-category">Page · Artist</div>' +
                '<div class="tpx-cfg-pv-fb-bio tpx-cfg-preview-bio" data-key="' + key + '">Type something to see it here</div>' +
              '</div>' +
            '</div>' +
            '<div class="tpx-cfg-pv-view tpx-cfg-pv-x" data-view="x" hidden>' +
              '<div class="tpx-cfg-pv-x-cover"></div>' +
              '<div class="tpx-cfg-pv-x-body">' +
                '<div class="tpx-cfg-preview-avatar tpx-cfg-pv-x-avatar">' + iconUse('icon-person') + '</div>' +
                '<div class="tpx-cfg-pv-x-top-actions">' +
                  '<div class="tpx-cfg-pv-x-icon-btn" aria-label="Notifications">' + iconUse('icon-bell-plus') + '</div>' +
                  '<button type="button" class="tpx-cfg-pv-x-follow-btn">' + iconUse('icon-user-plus') + '<span>Follow</span></button>' +
                '</div>' +
                '<div class="tpx-cfg-pv-x-name">Toolpx <span class="tpx-cfg-pv-x-badge">' + iconUse('icon-badge-check') + '</span></div>' +
                '<div class="tpx-cfg-pv-x-handle">@toolpx</div>' +
                '<div class="tpx-cfg-pv-x-bio tpx-cfg-preview-bio" data-key="' + key + '">Type something to see it here</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="tpx-cfg-preview-tabbar">' +
            '<div class="tpx-cfg-preview-tabgroup">' +
              '<button type="button" class="tpx-cfg-preview-tab is-active" data-platform="instagram" title="Instagram" aria-label="Preview on Instagram">' + iconUse('icon-platform-instagram') + '</button>' +
              '<button type="button" class="tpx-cfg-preview-tab" data-platform="facebook" title="Facebook" aria-label="Preview on Facebook">' + iconUse('icon-platform-facebook') + '</button>' +
              '<button type="button" class="tpx-cfg-preview-tab" data-platform="x" title="X" aria-label="Preview on X">' + iconUse('icon-platform-twitter') + '</button>' +
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
    const previewBios = grid.querySelectorAll('.tpx-cfg-preview-bio[data-key="' + key + '"]');
    const placeholderText = fn(PLACEHOLDER_SAMPLE);
    const previewPlaceholders = {};
    previewBios.forEach(function (el) {
      const view = el.closest('.tpx-cfg-pv-view');
      const platform = view ? view.dataset.view : null;
      previewPlaceholders[platform] = truncateForPlatform(placeholderText, PREVIEW_CHAR_LIMITS[platform]);
    });
    styleRefs[key] = {
      body: grid.querySelector('.tpx-cfg-card-body[data-key="' + key + '"]'),
      card: document.getElementById('tpx-cfg-card-' + key),
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

  const moreStylesToggle = document.getElementById('tpx-cfg-more-styles-toggle');
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
        refs.body.classList.add('tpx-cfg-placeholder');
        refs.card.classList.add('tpx-cfg-card-empty');
        refs.previewBios.forEach(function (el) {
          const view = el.closest('.tpx-cfg-pv-view');
          const platform = view ? view.dataset.view : null;
          el.textContent = refs.previewPlaceholders[platform];
        });
      } else {
        const styled = fn(text);
        refs.body.textContent = styled;
        refs.body.classList.remove('tpx-cfg-placeholder');
        refs.card.classList.remove('tpx-cfg-card-empty');
        refs.previewBios.forEach(function (el) {
          const view = el.closest('.tpx-cfg-pv-view');
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
    document.getElementById('tpx-cfg-val-words').textContent = words.toLocaleString();
    document.getElementById('tpx-cfg-val-chars').textContent = chars.toLocaleString();
    document.getElementById('tpx-cfg-val-chars-ns').textContent = charsNoSpaces.toLocaleString();
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
  const infoToggle = document.getElementById('tpx-cfg-info-toggle');
  const infoBody = document.getElementById('tpx-cfg-info-body');
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
    document.querySelectorAll('.tpx-cfg-preview-panel.is-open').forEach(function (panel) {
      panel.classList.remove('is-open');
      const key = panel.dataset.key;
      const btn = grid.querySelector('.tpx-cfg-preview-btn[data-key="' + key + '"]');
      const card = document.getElementById('tpx-cfg-card-' + key);
      if (btn) btn.classList.remove('tpx-cfg-preview-active');
      if (card) card.classList.remove('tpx-cfg-preview-is-open');
    });
  });

  function flashCopied(btn, announceLabel) {
    btn.innerHTML = ICON_CHECK;
    btn.classList.add('tpx-cfg-copied');
    if (announceLabel) announce(announceLabel);
    setTimeout(function () {
      btn.innerHTML = ICON_COPY;
      btn.classList.remove('tpx-cfg-copied');
    }, 1500);
  }

  function copyCardText(key) {
    const body = grid.querySelector('.tpx-cfg-card-body[data-key="' + key + '"]');
    if (!body) return;
    const value = body.textContent;
    if (!value || body.classList.contains('tpx-cfg-placeholder')) return;
    const card = document.getElementById('tpx-cfg-card-' + key);
    const styleName = card ? card.querySelector('.tpx-cfg-card-title').textContent : 'Text';
    const copyBtn = grid.querySelector('.tpx-cfg-copy-btn[data-key="' + key + '"]');
    navigator.clipboard.writeText(value).then(function () {
      if (copyBtn) flashCopied(copyBtn, styleName + ' copied');
      else announce(styleName + ' copied');
    }).catch(function () {
      announce('Could not copy — check clipboard permission');
    });
  }

  grid.addEventListener('click', function (e) {
    const copyBtn = e.target.closest('.tpx-cfg-copy-btn');
    const dlBtn = e.target.closest('.tpx-cfg-download-btn');
    const previewBtn = e.target.closest('.tpx-cfg-preview-btn');
    const tabBtn = e.target.closest('.tpx-cfg-preview-tab');
    const cardLeft = e.target.closest('.tpx-cfg-card-left');

    if (previewBtn) {
      const key = previewBtn.dataset.key;
      const panel = document.getElementById('tpx-cfg-preview-' + key);
      const outerCard = document.getElementById('tpx-cfg-card-' + key);
      if (panel) {
        const willOpen = !panel.classList.contains('is-open');
        panel.classList.toggle('is-open', willOpen);
        previewBtn.classList.toggle('tpx-cfg-preview-active', willOpen);
        if (outerCard) outerCard.classList.toggle('tpx-cfg-preview-is-open', willOpen);
      }
      return;
    }

    if (tabBtn) {
      const panel = tabBtn.closest('.tpx-cfg-preview-panel');
      const platform = tabBtn.dataset.platform;
      panel.querySelectorAll('.tpx-cfg-preview-tab').forEach(function (t) {
        t.classList.toggle('is-active', t === tabBtn);
      });
      panel.querySelectorAll('.tpx-cfg-pv-view').forEach(function (v) {
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
      const body = grid.querySelector('.tpx-cfg-card-body[data-key="' + key + '"]');
      const value = body.textContent;
      if (!value || body.classList.contains('tpx-cfg-placeholder')) return;
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
      const body = cardLeft.querySelector('.tpx-cfg-card-body');
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
  document.getElementById('tpx-cfg-btn-paste').addEventListener('click', function () {
    navigator.clipboard.readText().then(function (t) {
      ta.value += t;
      render();
      ta.focus();
    }).catch(function () {
      announce('Could not paste — check clipboard permission');
      ta.focus();
    });
  });

  document.getElementById('tpx-cfg-btn-clear').addEventListener('click', function () {
    ta.value = '';
    render();
    ta.focus();
  });

  document.getElementById('tpx-cfg-btn-copy').addEventListener('click', function () {
    if (!ta.value.trim()) return;
    const btn = this;
    navigator.clipboard.writeText(ta.value).then(function () {
      flashCopied(btn, 'Input copied');
    }).catch(function () {
      announce('Could not copy — check clipboard permission');
    });
  });

  document.getElementById('tpx-cfg-btn-upload').addEventListener('click', function () {
    document.getElementById('tpx-cfg-file-uploader').click();
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

  document.getElementById('tpx-cfg-file-uploader').addEventListener('change', function (e) {
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
