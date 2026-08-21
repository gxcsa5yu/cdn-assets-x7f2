document.addEventListener('DOMContentLoaded', function () {
  const ta = document.getElementById('tpx-dfg-input');
  const grid = document.getElementById('tpx-dfg-fonts-grid');
  const defaultStylesContainer = document.getElementById('tpx-dfg-default-styles');
  const extraStyles = document.getElementById('tpx-dfg-extra-styles');
  const announcer = document.getElementById('tpx-dfg-sr-announcer');

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

  function applyCombining(text, mark) {
    let out = '';
    for (const ch of text) {
      if (/\s/.test(ch)) out += ch;
      else out += ch + mark;
    }
    return out;
  }

  function applyAlternating(text, markA, markB) {
    let out = '';
    let i = 0;
    for (const ch of text) {
      if (/\s/.test(ch)) { out += ch; continue; }
      out += ch + (i % 2 === 0 ? markA : markB);
      i++;
    }
    return out;
  }

  const SMALLCAPS = { a:'ᴀ',b:'ʙ',c:'ᴄ',d:'ᴅ',e:'ᴇ',f:'ꜰ',g:'ɢ',h:'ʜ',i:'ɪ',j:'ᴊ',k:'ᴋ',l:'ʟ',m:'ᴍ',n:'ɴ',o:'ᴏ',p:'ᴘ',q:'ǫ',r:'ʀ',s:'ꜱ',t:'ᴛ',u:'ᴜ',v:'ᴠ',w:'ᴡ',y:'ʏ',z:'ᴢ' };
  const SUPERSCRIPT = { a:'ᵃ',b:'ᵇ',c:'ᶜ',d:'ᵈ',e:'ᵉ',f:'ᶠ',g:'ᵍ',h:'ʰ',i:'ⁱ',j:'ʲ',k:'ᵏ',l:'ˡ',m:'ᵐ',n:'ⁿ',o:'ᵒ',p:'ᵖ',r:'ʳ',s:'ˢ',t:'ᵗ',u:'ᵘ',v:'ᵛ',w:'ʷ',x:'ˣ',y:'ʸ',z:'ᶻ',
    A:'ᴬ',B:'ᴮ',D:'ᴰ',E:'ᴱ',G:'ᴳ',H:'ᴴ',I:'ᴵ',J:'ᴶ',K:'ᴷ',L:'ᴸ',M:'ᴹ',N:'ᴺ',O:'ᴼ',P:'ᴾ',R:'ᴿ',T:'ᵀ',U:'ᵁ',V:'ⱽ',W:'ᵂ',
    '0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹','+':'⁺','-':'⁻','=':'⁼','(':'⁽',')':'⁾' };

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

  // Currency style
  const CURRENCY = {
    a:'₳',b:'฿',c:'₵',d:'Ð',e:'€',f:'₣',g:'₲',h:'Ⱨ',i:'ł',j:'ɉ',k:'₭',l:'₤',m:'M',n:'₦',o:'Ø',p:'₱',q:'Ꝗ',r:'₹',s:'$',t:'₮',u:'Ʉ',v:'Ѵ',w:'₩',x:'Ӿ',y:'¥',z:'Ƶ',
    A:'₳',B:'฿',C:'₵',D:'Ð',E:'€',F:'₣',G:'₲',H:'Ⱨ',I:'ł',J:'Ɉ',K:'₭',L:'₤',M:'M',N:'₦',O:'Ø',P:'₱',Q:'Ꝗ',R:'₹',S:'$',T:'₮',U:'Ʉ',V:'Ѵ',W:'₩',X:'Ӿ',Y:'¥',Z:'Ƶ'
  };

  // Gaming / Canadian Aboriginal style
  const GAMING = {
    a:'ᗩ',b:'ᗷ',c:'ᑕ',d:'ᗪ',e:'E',f:'ᖴ',g:'G',h:'ᕼ',i:'I',j:'ᒍ',k:'K',l:'ᒪ',m:'ᗰ',n:'ᑎ',o:'O',p:'ᑭ',q:'ᑫ',r:'ᖇ',s:'S',t:'T',u:'ᑌ',v:'ᐯ',w:'ᗯ',x:'᙭',y:'Y',z:'ᘔ',
    A:'ᗩ',B:'ᗷ',C:'ᑕ',D:'ᗪ',E:'E',F:'ᖴ',G:'G',H:'ᕼ',I:'I',J:'ᒍ',K:'K',L:'ᒪ',M:'ᗰ',N:'ᑎ',O:'O',P:'ᑭ',Q:'ᑫ',R:'ᖇ',S:'S',T:'T',U:'ᑌ',V:'ᐯ',W:'ᗯ',X:'᙭',Y:'Y',Z:'ᘔ'
  };

  // Braille
  const BRAILLE = {
    a:'⠁',b:'⠃',c:'⠉',d:'⠙',e:'⠑',f:'⠋',g:'⠛',h:'⠓',i:'⠊',j:'⠚',k:'⠅',l:'⠇',m:'⠍',n:'⠝',o:'⠕',p:'⠏',q:'⠟',r:'⠗',s:'⠎',t:'⠞',u:'⠥',v:'⠧',w:'⠺',x:'⠭',y:'⠽',z:'⠵',
    A:'⠁',B:'⠃',C:'⠉',D:'⠙',E:'⠑',F:'⠋',G:'⠛',H:'⠓',I:'⠊',J:'⠚',K:'⠅',L:'⠇',M:'⠍',N:'⠝',O:'⠕',P:'⠏',Q:'⠟',R:'⠗',S:'⠎',T:'⠞',U:'⠥',V:'⠧',W:'⠺',X:'⠭',Y:'⠽',Z:'⠵',
    ' ':'⠀','1':'⠼⠁','2':'⠼⠃','3':'⠼⠉','4':'⠼⠙','5':'⠼⠑','6':'⠼⠋','7':'⠼⠛','8':'⠼⠓','9':'⠼⠊','0':'⠼⠚'
  };

  // Runic (Cherokee-inspired)
  // Fairytale (formerly Runic)
  const FAIRYTALE = {
    a:'Ꮧ',b:'Ᏸ',c:'Ꮳ',d:'Ꮄ',e:'Ꮛ',f:'Ꮈ',g:'Ꮆ',h:'Ꮒ',i:'Ꭵ',j:'Ꮰ',k:'Ꮶ',l:'Ꮮ',m:'Ꮇ',n:'Ꮑ',o:'Ꭷ',p:'Ꭾ',q:'Ꭴ',r:'Ꮢ',s:'Ꮥ',t:'Ꮦ',u:'Ꮼ',v:'Ꮙ',w:'Ꮗ',x:'ጀ',y:'Ꭹ',z:'ፚ',
    A:'Ꮧ',B:'Ᏸ',C:'Ꮳ',D:'Ꮄ',E:'Ꮛ',F:'Ꮈ',G:'Ꮆ',H:'Ꮒ',I:'Ꭵ',J:'Ꮰ',K:'Ꮶ',L:'Ꮮ',M:'Ꮇ',N:'Ꮑ',O:'Ꭷ',P:'Ꭾ',Q:'Ꭴ',R:'Ꮢ',S:'Ꮥ',T:'Ꮦ',U:'Ꮼ',V:'Ꮙ',W:'Ꮗ',X:'ጀ',Y:'Ꭹ',Z:'ፚ'
  };

  // Wizard (formerly Fantasy Script)
  const WIZARD = {
    a:'ǟ',b:'ɮ',c:'ƈ',d:'ɖ',e:'ɛ',f:'ʄ',g:'ɢ',h:'ɦ',i:'ɨ',j:'ʝ',k:'ӄ',l:'ʟ',m:'ʍ',n:'ռ',o:'օ',p:'ք',q:'զ',r:'ʀ',s:'ֆ',t:'ȶ',u:'ʊ',v:'ʋ',w:'ա',x:'Ӽ',y:'ʏ',z:'ʐ',
    A:'Ǟ',B:'ɮ',C:'ƈ',D:'ɖ',E:'ɛ',F:'ʄ',G:'ɢ',H:'ɦ',I:'ɨ',J:'ʝ',K:'ӄ',L:'ʟ',M:'ʍ',N:'ռ',O:'օ',P:'ք',Q:'զ',R:'ʀ',S:'ֆ',T:'ȶ',U:'ʊ',V:'ʋ',W:'ա',X:'Ӽ',Y:'ʏ',Z:'ʐ'
  };

  // Symbolic (new)
  const SYMBOLIC = {
    a:'ꍏ',b:'♭',c:'☾',d:'◗',e:'€',f:'Ϝ',g:'❡',h:'♄',i:'♗',j:'♪',k:'ϰ',l:'↳',m:'♔',n:'♫',o:'⊙',p:'ρ',q:'☭',r:'☈',s:'ⓢ',t:'☂',u:'☋',v:'✓',w:'ω',x:'⌘',y:'☿',z:'☡',
    A:'ꍏ',B:'♭',C:'☾',D:'◗',E:'€',F:'Ϝ',G:'❡',H:'♄',I:'♗',J:'♪',K:'ϰ',L:'↳',M:'♔',N:'♫',O:'⊙',P:'ρ',Q:'☭',R:'☈',S:'ⓢ',T:'☂',U:'☋',V:'✓',W:'ω',X:'⌘',Y:'☿',Z:'☡'
  };

  // Mystic
  const MYSTIC = {
    a:'α',b:'в',c:'c',d:'ɗ',e:'є',f:'f',g:'g',h:'н',i:'ι',j:'ʝ',k:'к',l:'ℓ',m:'м',n:'η',o:'σ',p:'ρ',q:'q',r:'я',s:'ѕ',t:'т',u:'υ',v:'ν',w:'ω',x:'χ',y:'у',z:'z',
    A:'α',B:'в',C:'c',D:'ɗ',E:'є',F:'f',G:'g',H:'н',I:'ι',J:'ʝ',K:'к',L:'ℓ',M:'м',N:'η',O:'σ',P:'ρ',Q:'q',R:'я',S:'ѕ',T:'т',U:'υ',V:'ν',W:'ω',X:'χ',Y:'у',Z:'z'
  };

  // Old Italic (fixed — no more collisions, borrows from Cherokee/Canadian Aboriginal Syllabics to fill gaps)
  const OLD_ITALIC = {
    a:'𐌀',b:'𐌁',c:'𐌂',d:'𐌃',e:'𐌄',f:'𐌅',g:'Ᏼ',h:'𐋅',i:'𐌉',j:'Ꮭ',k:'𐌊',l:'𐌋',m:'𐌌',n:'𐌍',o:'Ꝋ',p:'𐌐',q:'𐌒',r:'𐌓',s:'𐌔',t:'𐌕',u:'𐌵',v:'ᕓ',w:'Ꮤ',x:'𐋄',y:'𐌙',z:'Ɀ',
    A:'𐌀',B:'𐌁',C:'𐌂',D:'𐌃',E:'𐌄',F:'𐌅',G:'Ᏼ',H:'𐋅',I:'𐌉',J:'Ꮭ',K:'𐌊',L:'𐌋',M:'𐌌',N:'𐌍',O:'Ꝋ',P:'𐌐',Q:'𐌒',R:'𐌓',S:'𐌔',T:'𐌕',U:'𐌵',V:'ᕓ',W:'Ꮤ',X:'𐋄',Y:'𐌙',Z:'Ɀ'
  };

  // Faux Ethiopian (fixed — no more collisions)
  const FAUX_ETHIOPIAN = {
    a:'ል',b:'ጌ',c:'ር',d:'ዕ',e:'ቿ',f:'ቻ',g:'ኗ',h:'ዘ',i:'ጎ',j:'ጋ',k:'ጕ',l:'ረ',m:'ጠ',n:'ክ',o:'ዐ',p:'የ',q:'ቅ',r:'ዪ',s:'ነ',t:'ፕ',u:'ሁ',v:'ሀ',w:'ሠ',x:'ሸ',y:'ሃ',z:'ጊ',
    A:'ል',B:'ጌ',C:'ር',D:'ዕ',E:'ቿ',F:'ቻ',G:'ኗ',H:'ዘ',I:'ጎ',J:'ጋ',K:'ጕ',L:'ረ',M:'ጠ',N:'ክ',O:'ዐ',P:'የ',Q:'ቅ',R:'ዪ',S:'ነ',T:'ፕ',U:'ሁ',V:'ሀ',W:'ሠ',X:'ሸ',Y:'ሃ',Z:'ጊ'
  };

  // Modern Greek
  const MODERN_GREEK = {
    a:'Λ',b:'Ɓ',c:'Ƈ',d:'Ɗ',e:'Σ',f:'F',g:'G',h:'Ή',i:'I',j:'J',k:'Ƙ',l:'Ƚ',m:'M',n:'П',o:'Ө',p:'P',q:'Ƣ',r:'Я',s:'Ƨ',t:'Ƭ',u:'Ʊ',v:'V',w:'Ш',x:'Ж',y:'Ƴ',z:'Ƶ',
    A:'Λ',B:'Ɓ',C:'Ƈ',D:'Ɗ',E:'Σ',F:'F',G:'G',H:'Ή',I:'I',J:'J',K:'Ƙ',L:'Ƚ',M:'M',N:'П',O:'Ө',P:'P',Q:'Ƣ',R:'Я',S:'Ƨ',T:'Ƭ',U:'Ʊ',V:'V',W:'Ш',X:'Ж',Y:'Ƴ',Z:'Ƶ'
  };

  // Wise Characters (r fixed — swapped a Gujarati glyph for an IPA lookalike to keep the set visually consistent)
  const WISE_CHARACTERS = {
    a:'λ',b:'β',c:'Ć',d:'δ',e:'ε',f:'ƒ',g:'Ģ',h:'ħ',i:'ί',j:'ĵ',k:'κ',l:'ℓ',m:'ɱ',n:'ɴ',o:'Θ',p:'ρ',q:'q',r:'ɼ',s:'Ș',t:'τ',u:'µ',v:'v',w:'ω',x:'χ',y:'ϓ',z:'ζ',
    A:'λ',B:'β',C:'Ć',D:'δ',E:'ε',F:'ƒ',G:'Ģ',H:'ħ',I:'ί',J:'ĵ',K:'κ',L:'ℓ',M:'ɱ',N:'ɴ',O:'Θ',P:'ρ',Q:'q',R:'ɼ',S:'Ș',T:'τ',U:'µ',V:'v',W:'ω',X:'χ',Y:'ϓ',Z:'ζ'
  };

  // Hidden Heritage (RTL Hebrew/Arabic glyphs swapped for LTR-safe lookalikes to avoid bidi text-reordering bugs)
  const HIDDEN_HERITAGE = {
    a:'ค',b:'๒',c:'ς',d:'๔',e:'є',f:'Ŧ',g:'ງ',h:'ђ',i:'เ',j:'ĵ',k:'к',l:'ɭ',m:'๓',n:'ภ',o:'๏',p:'ρ',q:'ợ',r:'г',s:'ร',t:'Շ',u:'ย',v:'ѵ',w:'ฬ',x:'ჯ',y:'ყ',z:'չ',
    A:'ค',B:'๒',C:'ς',D:'๔',E:'є',F:'Ŧ',G:'ງ',H:'ђ',I:'เ',J:'ĵ',K:'к',L:'ɭ',M:'๓',N:'ภ',O:'๏',P:'ρ',Q:'ợ',R:'г',S:'ร',T:'Շ',U:'ย',V:'ѵ',W:'ฬ',X:'ჯ',Y:'ყ',Z:'չ'
  };

  // Shadow Script
  const SHADOW_SCRIPT = {
    a:'α',b:'ҍ',c:'ƈ',d:'ԃ',e:'ҽ',f:'ϝ',g:'ɠ',h:'ԋ',i:'ι',j:'ʝ',k:'ƙ',l:'ʅ',m:'ɱ',n:'ɳ',o:'σ',p:'ρ',q:'ϙ',r:'ɾ',s:'ʂ',t:'ƚ',u:'υ',v:'ʋ',w:'ω',x:'x',y:'ყ',z:'z',
    A:'α',B:'ҍ',C:'ƈ',D:'ԃ',E:'ҽ',F:'ϝ',G:'ɠ',H:'ԋ',I:'ι',J:'ʝ',K:'ƙ',L:'ʅ',M:'ɱ',N:'ɳ',O:'σ',P:'ρ',Q:'ϙ',R:'ɾ',S:'ʂ',T:'ƚ',U:'υ',V:'ʋ',W:'ω',X:'x',Y:'ყ',Z:'z'
  };

  // Thai Fusion
  const THAI_FUSION = {
    a:'ค',b:'๒',c:'ƈ',d:'ɗ',e:'є',f:'f',g:'g',h:'ђ',i:'เ',j:'ĵ',k:'к',l:'l',m:'๓',n:'ภ',o:'๏',p:'ρ',q:'ợ',r:'г',s:'ร',t:'t',u:'น',v:'v',w:'ω',x:'x',y:'ყ',z:'z',
    A:'ค',B:'๒',C:'ƈ',D:'ɗ',E:'є',F:'f',G:'g',H:'ђ',I:'เ',J:'ĵ',K:'к',L:'l',M:'๓',N:'ภ',O:'๏',P:'ρ',Q:'ợ',R:'г',S:'ร',T:'t',U:'น',V:'v',W:'ω',X:'x',Y:'ყ',Z:'z'
  };

  // Decorative Latin
  const DECORATIVE_LATIN = {
    a:'å',b:'β',c:'ç',d:'ð',e:'ê',f:'ƒ',g:'g',h:'ħ',i:'ï',j:'ʝ',k:'κ',l:'ℓ',m:'ɱ',n:'ñ',o:'ο',p:'þ',q:'q',r:'ř',s:'§',t:'†',u:'ü',v:'v',w:'ω',x:'χ',y:'¥',z:'ž',
    A:'Å',B:'Β',C:'Ç',D:'Ð',E:'Ê',F:'Ƒ',G:'G',H:'Ħ',I:'Ï',J:'ʝ',K:'Κ',L:'Ł',M:'Ɱ',N:'Ñ',O:'Ο',P:'Þ',Q:'Q',R:'Ř',S:'§',T:'†',U:'Ü',V:'V',W:'₩',X:'Χ',Y:'¥',Z:'Ž'
  };

  // Cyberpunk
  const CYBERPUNK = {
    a:'Δ',b:'β',c:'Ć',d:'Đ',e:'€',f:'₣',g:'Ǥ',h:'Ħ',i:'Ɨ',j:'Ĵ',k:'Ҝ',l:'Ł',m:'Μ',n:'Ň',o:'Ø',p:'Ƥ',q:'Ω',r:'Ř',s:'Ş',t:'Ŧ',u:'Ữ',v:'V',w:'Ŵ',x:'Ж',y:'¥',z:'Ž',
    A:'Δ',B:'β',C:'Ć',D:'Đ',E:'€',F:'₣',G:'Ǥ',H:'Ħ',I:'Ɨ',J:'Ĵ',K:'Ҝ',L:'Ł',M:'Μ',N:'Ň',O:'Ø',P:'Ƥ',Q:'Ω',R:'Ř',S:'Ş',T:'Ŧ',U:'Ữ',V:'V',W:'Ŵ',X:'Ж',Y:'¥',Z:'Ž'
  };

  // Greek Fusion
  const GREEK_FUSION = {
    a:'λ',b:'β',c:'Ć',d:'δ',e:'ε',f:'ƒ',g:'Ģ',h:'ħ',i:'ί',j:'ĵ',k:'κ',l:'ℓ',m:'ɱ',n:'ɴ',o:'Θ',p:'ρ',q:'q',r:'ર',s:'Ș',t:'τ',u:'µ',v:'v',w:'ω',x:'χ',y:'ϓ',z:'ζ',
    A:'λ',B:'β',C:'Ć',D:'δ',E:'ε',F:'ƒ',G:'Ģ',H:'ħ',I:'ί',J:'ĵ',K:'κ',L:'ℓ',M:'ɱ',N:'ɴ',O:'Θ',P:'ρ',Q:'q',R:'ર',S:'Ș',T:'τ',U:'µ',V:'v',W:'ω',X:'χ',Y:'ϓ',Z:'ζ'
  };

  // Slashed Latin
  const SLASHED_LATIN = {
    a:'ⱥ',b:'ƀ',c:'ȼ',d:'đ',e:'ɇ',f:'ƒ',g:'ǥ',h:'ħ',i:'ɨ',j:'ɉ',k:'ꝁ',l:'ł',m:'ɱ',n:'₦',o:'ø',p:'ᵽ',q:'ꝗ',r:'ɍ',s:'ꞩ',t:'ŧ',u:'ʉ',v:'v',w:'₩',x:'Ӿ',y:'ɏ',z:'ƶ',
    A:'Ⱥ',B:'Ƀ',C:'Ȼ',D:'Đ',E:'Ɇ',F:'Ƒ',G:'Ǥ',H:'Ħ',I:'Ɨ',J:'Ɉ',K:'Ꝁ',L:'Ł',M:'Ɱ',N:'₦',O:'Ø',P:'Ᵽ',Q:'Ꝗ',R:'Ɍ',S:'Ꞩ',T:'Ŧ',U:'Ʉ',V:'V',W:'₩',X:'Ӿ',Y:'Ɏ',Z:'Ƶ'
  };

  // Rusify (formerly Russian Lookalike) — duplicates fixed for uniqueness
  const RUSIFY = {
    a:'a',b:'б',c:'ц',d:'д',e:'є',f:'ф',g:'г',h:'н',i:'і',j:'ј',k:'к',l:'л',m:'м',n:'и',o:'о',p:'р',q:'q',r:'я',s:'с',t:'т',u:'ū',v:'в',w:'ш',x:'ж',y:'у',z:'з',
    A:'A',B:'Б',C:'Ц',D:'Д',E:'Є',F:'Ф',G:'Г',H:'Н',I:'І',J:'Ј',K:'К',L:'Л',M:'Ѫ',N:'Й',O:'О',P:'Р',Q:'Ǫ',R:'Я',S:'С',T:'Т',U:'Ū',V:'В',W:'Ш',X:'Ж',Y:'У',Z:'З'
  };

  // Soviet (formerly Cyber Cyrillic) — Latin p fixed, y made distinct
  const SOVIET = {
    a:'ӓ',b:'б',c:'ц',d:'д',e:'э',f:'ф',g:'ѓ',h:'ћ',i:'ї',j:'ј',k:'к',l:'л',m:'м',n:'и',o:'ѳ',p:'p',q:'ǫ',r:'г',s:'ş',t:'ҭ',u:'ў',v:'в',w:'ш',x:'ж',y:'ӳ',z:'ƶ',
    A:'Ӓ',B:'Б',C:'Ц',D:'Д',E:'Э',F:'Ф',G:'Ѓ',H:'Ћ',I:'Ї',J:'Ј',K:'К',L:'Л',M:'Ѫ',N:'Й',O:'Ѳ',P:'P',Q:'Ǫ',R:'Г',S:'Ş',T:'Ҭ',U:'Ў',V:'В',W:'Ш',X:'Ж',Y:'Ӳ',Z:'Ƶ'
  };

  // Lisu Style
  const LISU = {
    a:'ꍏ',b:'ꌃ',c:'ꉓ',d:'ꀸ',e:'ꍟ',f:'ꎇ',g:'ꁅ',h:'ꃅ',i:'ꀤ',j:'ꀭ',k:'ꀘ',l:'꒒',m:'ꂵ',n:'ꈤ',o:'ꂦ',p:'ꉣ',q:'ꆰ',r:'ꋪ',s:'ꌗ',t:'꓄',u:'ꀎ',v:'ꃴ',w:'ꅐ',x:'ꊼ',y:'ꌩ',z:'ꁴ',
    A:'ꍏ',B:'ꌃ',C:'ꉓ',D:'ꀸ',E:'ꍟ',F:'ꎇ',G:'ꁅ',H:'ꃅ',I:'ꀤ',J:'ꀭ',K:'ꀘ',L:'꒒',M:'ꂵ',N:'ꈤ',O:'ꂦ',P:'ꉣ',Q:'ꆰ',R:'ꋪ',S:'ꌗ',T:'꓄',U:'ꀎ',V:'ꃴ',W:'ꅐ',X:'ꊼ',Y:'ꌩ',Z:'ꁴ'
  };

  // Katakana
  const KATAKANA = {
    a:'ﾑ',b:'乃',c:'ᄃ',d:'り',e:'乇',f:'ｷ',g:'g',h:'ん',i:'ﾉ',j:'ﾌ',k:'ズ',l:'ﾚ',m:'ﾶ',n:'刀',o:'の',p:'ｱ',q:'q',r:'尺',s:'丂',t:'ｲ',u:'u',v:'v',w:'w',x:'ﾒ',y:'ﾘ',z:'乙',
    A:'ﾑ',B:'乃',C:'ᄃ',D:'り',E:'乇',F:'ｷ',G:'G',H:'ん',I:'ﾉ',J:'ﾌ',K:'ズ',L:'ﾚ',M:'ﾶ',N:'刀',O:'の',P:'ｱ',Q:'Q',R:'尺',S:'丂',T:'ｲ',U:'U',V:'V',W:'W',X:'ﾒ',Y:'ﾘ',Z:'乙'
  };

  // Pixel East (formerly Box Text)
  const PIXEL_EAST = {
    a:'卂',b:'乃',c:'匚',d:'ᗪ',e:'乇',f:'千',g:'g',h:'卄',i:'丨',j:'ﾌ',k:'Ҝ',l:'ㄥ',m:'爪',n:'几',o:'ㄖ',p:'卩',q:'Ɋ',r:'尺',s:'丂',t:'ㄒ',u:'ㄩ',v:'ᐯ',w:'山',x:'乂',y:'ㄚ',z:'乙',
    A:'卂',B:'乃',C:'匚',D:'ᗪ',E:'乇',F:'千',G:'G',H:'卄',I:'丨',J:'ﾌ',K:'Ҝ',L:'ㄥ',M:'爪',N:'几',O:'ㄖ',P:'卩',Q:'Ɋ',R:'尺',S:'丂',T:'ㄒ',U:'ㄩ',V:'ᐯ',W:'山',X:'乂',Y:'ㄚ',Z:'乙'
  };

  // Stinky (new)
  const STINKY = {
    a:'ą',b:'ც',c:'č',d:'đ',e:'ę',f:'ƒ',g:'ğ',h:'ħ',i:'į',j:'ĵ',k:'ķ',l:'ľ',m:'m',n:'ŋ',o:'ơ',p:'p',q:'q',r:'ř',s:'ş',t:'ť',u:'ų',v:'v',w:'ŵ',x:'ж',y:'ỳ',z:'ź',
    A:'Ą',B:'ც',C:'Č',D:'Đ',E:'Ę',F:'Ƒ',G:'Ğ',H:'Ħ',I:'Į',J:'Ĵ',K:'Ķ',L:'Ľ',M:'M',N:'Ŋ',O:'Ơ',P:'P',Q:'Q',R:'Ř',S:'Ş',T:'Ť',U:'Ų',V:'V',W:'Ŵ',X:'Ж',Y:'Ỳ',Z:'Ź'
  };

  // Hieroglyphs (new)
  const HIEROGLYPHS = {
    a:'Թ',b:'Ϧ',c:'ƈ',d:'ɖ',e:'ȝ',f:'ք',g:'ɡ',h:'ɧ',i:'ɿ',j:'ј',k:'ƙ',l:'ʟ',m:'ʍ',n:'ռ',o:'ծ',p:'ρ',q:'ϙ',r:'ɾ',s:'ʂ',t:'ɛ',u:'մ',v:'ν',w:'ɯ',x:'ӿ',y:'վ',z:'ȥ',
    A:'Թ',B:'Ϧ',C:'Ƈ',D:'Ɖ',E:'Ȝ',F:'Ք',G:'Գ',H:'ɧ',I:'Ɨ',J:'Ј',K:'Ƙ',L:'Ʂ',M:'ʍ',N:'Ռ',O:'Ծ',P:'Ρ',Q:'Ϙ',R:'Ր',S:'Տ',T:'Ե',U:'Մ',V:'Ѵ',W:'Ɯ',X:'Ӿ',Y:'Վ',Z:'Ȥ'
  };

  // Yangtan (new)
  const YANGTAN = {
    a:'ค',b:'๖',c:'ς',d:'ɗ',e:'ē',f:'Ŧ',g:'ງ',h:'h',i:'เ',j:'ʝ',k:'к',l:'l',m:'๓',n:'ຖ',o:'໐',p:'ρ',q:'q',r:'r',s:'Ş',t:'t',u:'น',v:'ง',w:'ω',x:'x',y:'ฯ',z:'z',
    A:'ค',B:'๖',C:'ς',D:'ɗ',E:'Ē',F:'Ŧ',G:'ງ',H:'H',I:'เ',J:'ʝ',K:'к',L:'L',M:'๓',N:'ຖ',O:'໐',P:'ρ',Q:'Q',R:'R',S:'Ş',T:'T',U:'น',V:'ง',W:'ω',X:'X',Y:'ฯ',Z:'Z'
  };

  function bracketText(text) {
    let out = '';
    for (const ch of text) {
      if (/\s/.test(ch)) out += ch;
      else out += '[' + ch + ']';
    }
    return out;
  }

  function parenthesized(text) {
    let out = '';
    for (const ch of text) {
      const up = ch.toUpperCase();
      if (up >= 'A' && up <= 'Z') out += String.fromCodePoint(0x1F110 + (up.charCodeAt(0) - 65));
      else out += ch;
    }
    return out;
  }

  function circled(text) {
    let out = '';
    for (const ch of text) {
      const up = ch.toUpperCase();
      if (up >= 'A' && up <= 'Z') out += String.fromCodePoint(0x24B6 + (up.charCodeAt(0) - 65));
      else if (ch === '0') out += '⓪';
      else if (ch >= '1' && ch <= '9') out += String.fromCodePoint(0x2460 + (ch.charCodeAt(0) - 49));
      else out += ch;
    }
    return out;
  }

  function negativeCircled(text) {
    let out = '';
    for (const ch of text) {
      const up = ch.toUpperCase();
      if (up >= 'A' && up <= 'Z') out += String.fromCodePoint(0x1F150 + (up.charCodeAt(0) - 65));
      else out += ch;
    }
    return out;
  }

  function squared(text) {
    let out = '';
    for (const ch of text) {
      const up = ch.toUpperCase();
      if (up >= 'A' && up <= 'Z') out += String.fromCodePoint(0x1F130 + (up.charCodeAt(0) - 65));
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

  function fullwidth(text) {
    let out = '';
    for (const ch of text) {
      const code = ch.charCodeAt(0);
      if (ch >= 'A' && ch <= 'Z') out += String.fromCodePoint(0xFF21 + (code - 65));
      else if (ch >= 'a' && ch <= 'z') out += String.fromCodePoint(0xFF41 + (code - 97));
      else if (ch >= '0' && ch <= '9') out += String.fromCodePoint(0xFF10 + (code - 48));
      else if (ch === ' ') out += '　';
      else out += ch;
    }
    return out;
  }

  /* ---- Style config ---- */
  const SAFETY_LABELS = {
    safe: 'Safe everywhere',
    warn: 'May not render on older devices',
    risk: 'Often shows as boxes on some platforms'
  };

  // BUG FIX: the crown/fire styles previously embedded literal emoji characters
  // (👑 / 🔥) inside JS string literals. Per ToolPX's established WordPress
  // deployment rule ("Emoji in JS strings must be avoided — WordPress mangles
  // them"), these are now built from their Unicode code points instead, which
  // is safe regardless of how/where this file ends up being edited or embedded.
  const EMOJI_CROWN = String.fromCodePoint(0x1F451);
  const EMOJI_FIRE = String.fromCodePoint(0x1F525);
  const EMOJI_HEART = String.fromCodePoint(0x1F49D);
  const EMOJI_SPARKLE = String.fromCodePoint(0x2728);
  const EMOJI_BOW = String.fromCodePoint(0x1F380);
  const EMOJI_PEACE = String.fromCodePoint(0x270C, 0xFE0F);

  const STYLE_DEFS = [
    // Discord-tuned order: lead with the styles Discord nicknames actually
    // reach for (gamer glyphs, bold, one emoji-decorated style, small caps,
    // upside down) instead of Instagram's bold/italic/smallcaps/circled/spaced
    // row, so the two tools don't feel like reskins of each other. Later
    // batches interleave gamer/cyber styles, lookalike scripts, combining-mark
    // styles, and the emoji-wrapped styles instead of grouping them together.
    { key: 'gaming',         title: 'Gaming',           safety: 'safe', group: 'default', size: 1.00, fn: t => mapLookup(t, GAMING) },
    { key: 'bold',           title: 'Bold',             safety: 'safe', group: 'default', size: 1.05, fn: t => mapContiguous(t, 0x1D5D4, 0x1D5EE, 0x1D7EC, {}) },
    { key: 'sparkle',        title: 'Sparkle',          safety: 'safe', group: 'default', size: 1.00, fn: t => EMOJI_SPARKLE + ' ' + t + ' ' + EMOJI_SPARKLE },
    { key: 'smallcaps',      title: 'Small Caps',       safety: 'safe', group: 'default', size: 1.00, fn: t => mapLookup(t, SMALLCAPS) },
    { key: 'upsidedown',     title: 'Upside Down',      safety: 'safe', group: 'default', size: 1.00, fn: upsideDown },

    { key: 'cyberpunk',      title: 'Cyberpunk',        safety: 'warn', group: 'extra', size: 1.00, fn: t => mapLookup(t, CYBERPUNK) },
    { key: 'monospace',      title: 'Monospace',        safety: 'warn', group: 'extra', size: 1.00, fn: t => mapContiguous(t, 0x1D670, 0x1D68A, 0x1D7F6, {}) },
    { key: 'sweetheart',     title: 'Sweetheart',       safety: 'safe', group: 'extra', size: 1.00, fn: t => EMOJI_HEART + ' ' + t + ' ' + EMOJI_HEART },
    { key: 'fraktur',        title: 'Fraktur',          safety: 'warn', group: 'extra', size: 1.10, fn: t => mapContiguous(t, 0x1D504, 0x1D51E, null, { C: 'ℭ', H: 'ℌ', I: 'ℑ', R: 'ℜ', Z: 'ℨ' }) },
    { key: 'italic',         title: 'Italic',           safety: 'safe', group: 'extra', size: 1.05, fn: t => mapContiguous(t, 0x1D608, 0x1D622, null, {}) },
    { key: 'giftbow',        title: 'Gift Bow',         safety: 'safe', group: 'extra', size: 1.00, fn: t => EMOJI_BOW + ' ' + t + ' ' + EMOJI_BOW },

    { key: 'wizard',         title: 'Wizard',           safety: 'warn', group: 'extra', size: 1.00, fn: t => mapLookup(t, WIZARD) },
    { key: 'crown',          title: 'Crown',            safety: 'safe', group: 'extra', size: 1.00, fn: t => EMOJI_CROWN + ' ' + t + ' ' + EMOJI_CROWN },
    { key: 'doublestruck',   title: 'Double-Struck',    safety: 'warn', group: 'extra', size: 1.05, fn: t => mapContiguous(t, 0x1D538, 0x1D552, 0x1D7D8, { C: 'ℂ', H: 'ℍ', N: 'ℕ', P: 'ℙ', Q: 'ℚ', R: 'ℝ', Z: 'ℤ' }) },
    { key: 'sassy',          title: 'Sassy',            safety: 'safe', group: 'extra', size: 1.00, fn: t => EMOJI_PEACE + t },
    { key: 'circled',        title: 'Circled',          safety: 'safe', group: 'extra', size: 0.90, fn: circled },

    { key: 'fire',           title: 'Fire',             safety: 'safe', group: 'extra', size: 1.00, fn: t => EMOJI_FIRE + ' ' + t + ' ' + EMOJI_FIRE },
    { key: 'mystic',         title: 'Mystic',           safety: 'warn', group: 'extra', size: 1.00, fn: t => mapLookup(t, MYSTIC) },
    { key: 'script',         title: 'Script',           safety: 'warn', group: 'extra', size: 1.05, fn: t => mapContiguous(t, 0x1D49C, 0x1D4B6, null, { B: 'ℬ', E: 'ℰ', F: 'ℱ', H: 'ℋ', I: 'ℐ', L: 'ℒ', M: 'ℳ', R: 'ℛ', e: 'ℯ', g: 'ℊ', o: 'ℴ' }) },
    { key: 'bracket',        title: 'Bracket Text',     safety: 'safe', group: 'extra', size: 0.95, fn: bracketText },
    { key: 'fairytale',      title: 'Fairytale',        safety: 'warn', group: 'extra', size: 1.00, fn: t => mapLookup(t, FAIRYTALE) },

    { key: 'backwards',      title: 'Backwards',        safety: 'safe', group: 'extra', size: 1.00, fn: t => t.split('').reverse().join('') },
    { key: 'strikethrough',  title: 'Strikethrough',    safety: 'safe', group: 'extra', size: 1.00, fn: t => applyCombining(t, '\u0336') },
    { key: 'symbolic',       title: 'Symbolic',         safety: 'warn', group: 'extra', size: 1.00, fn: t => mapLookup(t, SYMBOLIC) },
    { key: 'slashthrough',   title: 'Slash Through',    safety: 'safe', group: 'extra', size: 1.00, fn: t => applyCombining(t, '\u0337') },
    { key: 'currency',       title: 'Currency',         safety: 'warn', group: 'extra', size: 1.00, fn: t => mapLookup(t, CURRENCY) },

    { key: 'underline',      title: 'Underline',        safety: 'safe', group: 'extra', size: 1.00, fn: t => applyCombining(t, '\u0332') },
    { key: 'bolditalic',     title: 'Bold Italic',      safety: 'safe', group: 'extra', size: 1.05, fn: t => mapContiguous(t, 0x1D63C, 0x1D656, null, {}) },
    { key: 'overline',       title: 'Overline',         safety: 'safe', group: 'extra', size: 1.00, fn: t => applyCombining(t, '\u0305') },
    { key: 'boldscript',     title: 'Bold Script',      safety: 'warn', group: 'extra', size: 1.05, fn: t => mapContiguous(t, 0x1D4D0, 0x1D4EA, null, {}) },
    { key: 'altline',        title: 'Alternating Line', safety: 'safe', group: 'extra', size: 1.00, fn: t => applyAlternating(t, '\u0332', '\u0305') },

    { key: 'ringabove',      title: 'Ring Above',       safety: 'safe', group: 'extra', size: 1.00, fn: t => applyCombining(t, '\u030A') },
    { key: 'serifbold',      title: 'Serif Bold',       safety: 'safe', group: 'extra', size: 1.05, fn: t => mapContiguous(t, 0x1D400, 0x1D41A, 0x1D7CE, {}) },
    { key: 'wavy',           title: 'Wavy',             safety: 'safe', group: 'extra', size: 1.00, fn: t => applyCombining(t, '\u0334') },
    { key: 'serifitalic',    title: 'Serif Italic',     safety: 'safe', group: 'extra', size: 1.05, fn: t => mapContiguous(t, 0x1D434, 0x1D44E, null, { h: 'ℎ' }) },
    { key: 'frakturbold',    title: 'Fraktur Bold',     safety: 'warn', group: 'extra', size: 1.10, fn: t => mapContiguous(t, 0x1D56C, 0x1D586, null, {}) },

    { key: 'serifbolditalic',title: 'Serif Bold Italic',safety: 'safe', group: 'extra', size: 1.05, fn: t => mapContiguous(t, 0x1D468, 0x1D482, null, {}) },
    { key: 'shadowscript',   title: 'Shadow Script',    safety: 'warn', group: 'extra', size: 1.00, fn: t => mapLookup(t, SHADOW_SCRIPT) },
    { key: 'spaced',         title: 'Spaced',           safety: 'safe', group: 'extra', size: 0.95, fn: fullwidth },
    { key: 'thaifusion',     title: 'Thai Fusion',      safety: 'warn', group: 'extra', size: 1.00, fn: t => mapLookup(t, THAI_FUSION) },
    { key: 'hiddenheritage', title: 'Hidden Heritage',  safety: 'warn', group: 'extra', size: 1.00, fn: t => mapLookup(t, HIDDEN_HERITAGE) },

    { key: 'decorativelatin',title: 'Decorative Latin', safety: 'warn', group: 'extra', size: 1.00, fn: t => mapLookup(t, DECORATIVE_LATIN) },
    { key: 'greekfusion',    title: 'Greek Fusion',     safety: 'warn', group: 'extra', size: 1.00, fn: t => mapLookup(t, GREEK_FUSION) },
    { key: 'negcircled',     title: 'Negative Circled', safety: 'risk', group: 'extra', size: 1.10, fn: negativeCircled },
    { key: 'moderngreek',    title: 'Modern Greek',     safety: 'warn', group: 'extra', size: 1.00, fn: t => mapLookup(t, MODERN_GREEK) },
    { key: 'squared',        title: 'Squared',          safety: 'risk', group: 'extra', size: 0.90, fn: squared },

    { key: 'wisecharacters', title: 'Wise Characters',  safety: 'warn', group: 'extra', size: 1.00, fn: t => mapLookup(t, WISE_CHARACTERS) },
    { key: 'negsquared',     title: 'Negative Squared', safety: 'risk', group: 'extra', size: 1.10, fn: negativeSquared },
    { key: 'slashedlatin',   title: 'Slashed Latin',    safety: 'warn', group: 'extra', size: 1.00, fn: t => mapLookup(t, SLASHED_LATIN) },
    { key: 'parenthesized',  title: 'Parenthesized',    safety: 'risk', group: 'extra', size: 0.90, fn: parenthesized },
    { key: 'rusify',         title: 'Rusify',           safety: 'warn', group: 'extra', size: 1.00, fn: t => mapLookup(t, RUSIFY) },

    { key: 'superscript',    title: 'Superscript',      safety: 'warn', group: 'extra', size: 1.20, fn: t => mapLookup(t, SUPERSCRIPT) },
    { key: 'soviet',         title: 'Soviet',           safety: 'warn', group: 'extra', size: 1.00, fn: t => mapLookup(t, SOVIET) },
    { key: 'braille',        title: 'Braille',          safety: 'warn', group: 'extra', size: 1.10, fn: t => mapLookup(t, BRAILLE) },
    { key: 'lisu',           title: 'Lisu Style',       safety: 'risk', group: 'extra', size: 1.00, fn: t => mapLookup(t, LISU) },
    { key: 'olditalic',      title: 'Old Italic',       safety: 'risk', group: 'extra', size: 1.00, fn: t => mapLookup(t, OLD_ITALIC) },

    { key: 'fauxethiopian',  title: 'Faux Ethiopian',   safety: 'risk', group: 'extra', size: 1.00, fn: t => mapLookup(t, FAUX_ETHIOPIAN) },
    { key: 'katakana',       title: 'Katakana',         safety: 'warn', group: 'extra', size: 1.00, fn: t => mapLookup(t, KATAKANA) },
    { key: 'pixeleast',      title: 'Pixel East',       safety: 'warn', group: 'extra', size: 1.00, fn: t => mapLookup(t, PIXEL_EAST) },
    { key: 'stinky',         title: 'Stinky',           safety: 'warn', group: 'extra', size: 1.00, fn: t => mapLookup(t, STINKY) },
    { key: 'hieroglyphs',    title: 'Hieroglyphs',      safety: 'risk', group: 'extra', size: 1.00, fn: t => mapLookup(t, HIEROGLYPHS) },
    { key: 'yangtan',        title: 'Yangtan',          safety: 'warn', group: 'extra', size: 1.00, fn: t => mapLookup(t, YANGTAN) }
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
      '<div class="tpx-dfg-font-card tpx-dfg-card-empty" id="tpx-dfg-card-' + key + '">' +
        '<div class="tpx-dfg-card-left">' +
          '<div class="tpx-dfg-card-header">' +
            '<div class="tpx-dfg-card-title-wrap">' +
              '<span class="tpx-dfg-safety-dot ' + def.safety + '" role="img" aria-label="Compatibility: ' + label + '"></span>' +
              '<span class="tpx-dfg-card-title">' + def.title + '</span>' +
            '</div>' +
            '<div class="tpx-dfg-card-actions">' +
              '<button type="button" class="tpx-dfg-copy-btn" data-key="' + key + '" aria-label="Copy ' + def.title + ' text">' + iconUse('icon-copy') + '</button>' +
              '<button type="button" class="tpx-dfg-preview-btn" data-key="' + key + '" aria-label="Preview ' + def.title + ' in Discord" title="Preview in Discord">' + iconUse('icon-brand-discord') + '</button>' +
              '<button type="button" class="tpx-dfg-download-btn" data-key="' + key + '" aria-label="Download ' + def.title + ' text">' + iconUse('icon-download') + '</button>' +
            '</div>' +
          '</div>' +
          '<div class="tpx-dfg-card-body tpx-dfg-placeholder" data-key="' + key + '" style="--tpx-dfg-scale:' + scale + '">Type something to start</div>' +
        '</div>' +
        '<div class="tpx-dfg-preview-panel" id="tpx-dfg-preview-' + key + '" data-key="' + key + '">' +
          '<div class="tpx-dfg-preview-stage">' +
            '<div class="tpx-dfg-pv-view tpx-dfg-pv-bio" data-view="bio">' +
              '<div class="tpx-dfg-pv-bio-banner"></div>' +
              '<div class="tpx-dfg-pv-bio-body">' +
                '<div class="tpx-dfg-preview-avatar tpx-dfg-pv-bio-avatar">' + iconUse('icon-person') + '<span class="tpx-dfg-pv-bio-status"></span></div>' +
                '<div class="tpx-dfg-pv-bio-name">Toolpx</div>' +
                '<div class="tpx-dfg-pv-bio-username">toolpx</div>' +
                '<div class="tpx-dfg-pv-bio-label">Bio</div>' +
                '<div class="tpx-dfg-pv-bio-text tpx-dfg-preview-bio" data-key="' + key + '">Type something to see it here</div>' +
              '</div>' +
            '</div>' +
            '<div class="tpx-dfg-pv-view tpx-dfg-pv-chat" data-view="chat" hidden>' +
              '<div class="tpx-dfg-pv-chat-row">' +
                '<div class="tpx-dfg-preview-avatar tpx-dfg-pv-chat-avatar">' + iconUse('icon-person') + '</div>' +
                '<div class="tpx-dfg-pv-chat-right">' +
                  '<div class="tpx-dfg-pv-chat-meta"><span class="tpx-dfg-pv-chat-name">Toolpx</span><span class="tpx-dfg-pv-chat-time">Today at 9:41 AM</span></div>' +
                  '<div class="tpx-dfg-pv-chat-msg tpx-dfg-pv-chat-styled tpx-dfg-preview-bio" data-key="' + key + '">Type something to see it here</div>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="tpx-dfg-preview-tabbar">' +
            '<div class="tpx-dfg-preview-tabgroup">' +
              '<button type="button" class="tpx-dfg-preview-tab is-active" data-platform="bio" title="Bio" aria-label="Preview as Discord bio">' + iconUse('icon-user-edit') + '<span>Bio</span></button>' +
              '<button type="button" class="tpx-dfg-preview-tab" data-platform="chat" title="Chat" aria-label="Preview as Discord chat">' + iconUse('icon-brand-line') + '<span>Chat</span></button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  const PREVIEW_CHAR_LIMITS = { bio: 190 };

  function truncateForPlatform(str, limit) {
    if (!limit) return str;
    const chars = Array.from(str);
    if (chars.length <= limit) return str;
    return chars.slice(0, limit - 1).join('') + '…';
  }

  /* ---- Timeline ---- */
  // Discord-specific limits: nickname (32), server name (100), custom
  // status (128), About Me bio (190). Node "left" positions in the HTML
  // are set to match these pct values so each dot sits exactly where the
  // fill bar reaches it.
  const CHAR_BREAKPOINTS = [
    { chars: 0, pct: 0 },
    { chars: 32, pct: 15 },
    { chars: 100, pct: 38.33 },
    { chars: 128, pct: 61.66 },
    { chars: 190, pct: 85 }
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
    toggleNode('node-nickname', chars >= 32);
    toggleNode('node-servername', chars >= 100);
    toggleNode('node-status', chars >= 128);
    toggleNode('node-bio', chars >= 190);
  }

  /* ---- Cards / render ---- */
  const PLACEHOLDER_SAMPLE = 'Type something to start';
  const styleRefs = {};

  function buildStyleRefs(key) {
    const fn = STYLE_FNS[key];
    const previewBios = grid.querySelectorAll('.tpx-dfg-preview-bio[data-key="' + key + '"]');
    const placeholderText = fn(PLACEHOLDER_SAMPLE);
    const previewPlaceholders = {};
    previewBios.forEach(function (el) {
      const view = el.closest('.tpx-dfg-pv-view');
      const platform = view ? view.dataset.view : null;
      previewPlaceholders[platform] = truncateForPlatform(placeholderText, PREVIEW_CHAR_LIMITS[platform]);
    });
    styleRefs[key] = {
      body: grid.querySelector('.tpx-dfg-card-body[data-key="' + key + '"]'),
      card: document.getElementById('tpx-dfg-card-' + key),
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

  const moreStylesToggle = document.getElementById('tpx-dfg-more-styles-toggle');
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
        refs.body.classList.add('tpx-dfg-placeholder');
        refs.card.classList.add('tpx-dfg-card-empty');
        refs.previewBios.forEach(function (el) {
          const view = el.closest('.tpx-dfg-pv-view');
          const platform = view ? view.dataset.view : null;
          el.textContent = refs.previewPlaceholders[platform];
        });
      } else {
        const styled = fn(text);
        refs.body.textContent = styled;
        refs.body.classList.remove('tpx-dfg-placeholder');
        refs.card.classList.remove('tpx-dfg-card-empty');
        refs.previewBios.forEach(function (el) {
          const view = el.closest('.tpx-dfg-pv-view');
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
    document.getElementById('tpx-dfg-val-words').textContent = words.toLocaleString();
    document.getElementById('tpx-dfg-val-chars').textContent = chars.toLocaleString();
    document.getElementById('tpx-dfg-val-chars-ns').textContent = charsNoSpaces.toLocaleString();
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
  const infoToggle = document.getElementById('tpx-dfg-info-toggle');
  const infoBody = document.getElementById('tpx-dfg-info-body');
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
    document.querySelectorAll('.tpx-dfg-preview-panel.is-open').forEach(function (panel) {
      panel.classList.remove('is-open');
      const key = panel.dataset.key;
      const btn = grid.querySelector('.tpx-dfg-preview-btn[data-key="' + key + '"]');
      const card = document.getElementById('tpx-dfg-card-' + key);
      if (btn) btn.classList.remove('tpx-dfg-preview-active');
      if (card) card.classList.remove('tpx-dfg-preview-is-open');
    });
  });

  function flashCopied(btn, announceLabel) {
    btn.innerHTML = ICON_CHECK;
    btn.classList.add('tpx-dfg-copied');
    if (announceLabel) announce(announceLabel);
    setTimeout(function () {
      btn.innerHTML = ICON_COPY;
      btn.classList.remove('tpx-dfg-copied');
    }, 1500);
  }

  function copyCardText(key) {
    const body = grid.querySelector('.tpx-dfg-card-body[data-key="' + key + '"]');
    if (!body) return;
    const value = body.textContent;
    if (!value || body.classList.contains('tpx-dfg-placeholder')) return;
    const card = document.getElementById('tpx-dfg-card-' + key);
    const styleName = card ? card.querySelector('.tpx-dfg-card-title').textContent : 'Text';
    const copyBtn = grid.querySelector('.tpx-dfg-copy-btn[data-key="' + key + '"]');
    navigator.clipboard.writeText(value).then(function () {
      if (copyBtn) flashCopied(copyBtn, styleName + ' copied');
      else announce(styleName + ' copied');
    }).catch(function () {
      announce('Could not copy — check clipboard permission');
    });
  }

  grid.addEventListener('click', function (e) {
    const copyBtn = e.target.closest('.tpx-dfg-copy-btn');
    const dlBtn = e.target.closest('.tpx-dfg-download-btn');
    const previewBtn = e.target.closest('.tpx-dfg-preview-btn');
    const tabBtn = e.target.closest('.tpx-dfg-preview-tab');
    const cardLeft = e.target.closest('.tpx-dfg-card-left');

    if (previewBtn) {
      const key = previewBtn.dataset.key;
      const panel = document.getElementById('tpx-dfg-preview-' + key);
      const outerCard = document.getElementById('tpx-dfg-card-' + key);
      if (panel) {
        const willOpen = !panel.classList.contains('is-open');
        panel.classList.toggle('is-open', willOpen);
        previewBtn.classList.toggle('tpx-dfg-preview-active', willOpen);
        if (outerCard) outerCard.classList.toggle('tpx-dfg-preview-is-open', willOpen);
      }
      return;
    }

    if (tabBtn) {
      const panel = tabBtn.closest('.tpx-dfg-preview-panel');
      const platform = tabBtn.dataset.platform;
      panel.querySelectorAll('.tpx-dfg-preview-tab').forEach(function (t) {
        t.classList.toggle('is-active', t === tabBtn);
      });
      panel.querySelectorAll('.tpx-dfg-pv-view').forEach(function (v) {
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
      const body = grid.querySelector('.tpx-dfg-card-body[data-key="' + key + '"]');
      const value = body.textContent;
      if (!value || body.classList.contains('tpx-dfg-placeholder')) return;
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
      const body = cardLeft.querySelector('.tpx-dfg-card-body');
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
  document.getElementById('tpx-dfg-btn-paste').addEventListener('click', function () {
    navigator.clipboard.readText().then(function (t) {
      ta.value += t;
      render();
      ta.focus();
    }).catch(function () {
      announce('Could not paste — check clipboard permission');
      ta.focus();
    });
  });

  document.getElementById('tpx-dfg-btn-clear').addEventListener('click', function () {
    ta.value = '';
    render();
    ta.focus();
  });

  document.getElementById('tpx-dfg-btn-copy').addEventListener('click', function () {
    if (!ta.value.trim()) return;
    const btn = this;
    navigator.clipboard.writeText(ta.value).then(function () {
      flashCopied(btn, 'Input copied');
    }).catch(function () {
      announce('Could not copy — check clipboard permission');
    });
  });

  document.getElementById('tpx-dfg-btn-upload').addEventListener('click', function () {
    document.getElementById('tpx-dfg-file-uploader').click();
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

  document.getElementById('tpx-dfg-file-uploader').addEventListener('change', function (e) {
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
