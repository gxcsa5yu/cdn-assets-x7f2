document.addEventListener('DOMContentLoaded', function () {
  const ta = document.getElementById('tpx-stg-input');
  const grid = document.getElementById('tpx-stg-fonts-grid');
  const defaultStylesContainer = document.getElementById('tpx-stg-default-styles');
  const extraStyles = document.getElementById('tpx-stg-extra-styles');
  const announcer = document.getElementById('tpx-stg-sr-announcer');
  let extraStylesRevealed = false;

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

  // Currency style
  const CURRENCY = {
    a:'₳',b:'฿',c:'₵',d:'₫',e:'€',f:'₣',g:'₲',h:'₴',i:'ł',j:'ɉ',k:'₭',l:'₤',m:'₥',n:'₦',o:'Ø',p:'₱',q:'Ω',r:'₹',s:'₴',t:'₮',u:'Ʉ',v:'Ѵ',w:'₩',x:'Ӿ',y:'¥',z:'₴',
    A:'₳',B:'฿',C:'₵',D:'₫',E:'€',F:'₣',G:'₲',H:'₴',I:'ł',J:'Ɉ',K:'₭',L:'₤',M:'₥',N:'₦',O:'Ø',P:'₱',Q:'Ω',R:'₹',S:'₴',T:'₮',U:'Ʉ',V:'Ѵ',W:'₩',X:'Ӿ',Y:'¥',Z:'₴'
  };

  // Gaming / Canadian Aboriginal style
  const GAMING = {
    a:'ᗩ',b:'ᗷ',c:'ᑕ',d:'ᗪ',e:'E',f:'ᖴ',g:'G',h:'ᕼ',i:'I',j:'ᒍ',k:'K',l:'L',m:'ᗰ',n:'ᑎ',o:'O',p:'ᑭ',q:'ᑫ',r:'ᖇ',s:'ᔕ',t:'T',u:'ᑌ',v:'ᐯ',w:'ᗯ',x:'᙭',y:'Y',z:'ᘔ',
    A:'ᗩ',B:'ᗷ',C:'ᑕ',D:'ᗪ',E:'E',F:'ᖴ',G:'G',H:'ᕼ',I:'I',J:'ᒍ',K:'K',L:'L',M:'ᗰ',N:'ᑎ',O:'O',P:'ᑭ',Q:'ᑫ',R:'ᖇ',S:'ᔕ',T:'T',U:'ᑌ',V:'ᐯ',W:'ᗯ',X:'᙭',Y:'Y',Z:'ᘔ'
  };

  // Braille
  const BRAILLE = {
    a:'⠁',b:'⠃',c:'⠉',d:'⠙',e:'⠑',f:'⠋',g:'⠛',h:'⠓',i:'⠊',j:'⠚',k:'⠅',l:'⠇',m:'⠍',n:'⠝',o:'⠕',p:'⠏',q:'⠟',r:'⠗',s:'⠎',t:'⠞',u:'⠥',v:'⠧',w:'⠺',x:'⠭',y:'⠽',z:'⠵',
    A:'⠁',B:'⠃',C:'⠉',D:'⠙',E:'⠑',F:'⠋',G:'⠛',H:'⠓',I:'⠊',J:'⠚',K:'⠅',L:'⠇',M:'⠍',N:'⠝',O:'⠕',P:'⠏',Q:'⠟',R:'⠗',S:'⠎',T:'⠞',U:'⠥',V:'⠧',W:'⠺',X:'⠭',Y:'⠽',Z:'⠵',
    ' ':'⠀','1':'⠼⠁','2':'⠼⠃','3':'⠼⠉','4':'⠼⠙','5':'⠼⠑','6':'⠼⠋','7':'⠼⠛','8':'⠼⠓','9':'⠼⠊','0':'⠼⠚'
  };

  // Runic (Cherokee-inspired)
  const RUNIC = {
    a:'Ꭺ',b:'Ᏼ',c:'Ꮯ',d:'Ꭰ',e:'Ꭼ',f:'Ꮀ',g:'Ꮆ',h:'Ꮋ',i:'Ꮖ',j:'Ꭻ',k:'Ꮶ',l:'Ꮮ',m:'Ꮇ',n:'Ꮑ',o:'Ꮎ',p:'Ꮲ',q:'Ꮕ',r:'Ꭱ',s:'Ꮪ',t:'Ꭲ',u:'Ꮜ',v:'Ꮙ',w:'Ꮤ',x:'Ꮖ',y:'Ꭹ',z:'Ꮓ',
    A:'Ꭺ',B:'Ᏼ',C:'Ꮯ',D:'Ꭰ',E:'Ꭼ',F:'Ꮀ',G:'Ꮆ',H:'Ꮋ',I:'Ꮖ',J:'Ꭻ',K:'Ꮶ',L:'Ꮮ',M:'Ꮇ',N:'Ꮑ',O:'Ꮎ',P:'Ꮲ',Q:'Ꮕ',R:'Ꭱ',S:'Ꮪ',T:'Ꭲ',U:'Ꮜ',V:'Ꮙ',W:'Ꮤ',X:'Ꮖ',Y:'Ꭹ',Z:'Ꮓ'
  };

  // Fantasy Script
  const FANTASY_SCRIPT = {
    a:'ǟ',b:'ɮ',c:'ƈ',d:'ɖ',e:'ɛ',f:'ʄ',g:'ɢ',h:'ɦ',i:'ɨ',j:'ʝ',k:'ӄ',l:'ʟ',m:'ʍ',n:'ռ',o:'օ',p:'ք',q:'զ',r:'ʀ',s:'ֆ',t:'ȶ',u:'ʊ',v:'ʋ',w:'ա',x:'Ӽ',y:'ʏ',z:'ʐ',
    A:'ǟ',B:'ɮ',C:'ƈ',D:'ɖ',E:'ɛ',F:'ʄ',G:'ɢ',H:'ɦ',I:'ɨ',J:'ʝ',K:'ӄ',L:'ʟ',M:'ʍ',N:'ռ',O:'օ',P:'ք',Q:'զ',R:'ʀ',S:'ֆ',T:'ȶ',U:'ʊ',V:'ʋ',W:'ա',X:'Ӽ',Y:'ʏ',Z:'ʐ'
  };

  // Mystic
  const MYSTIC = {
    a:'α',b:'в',c:'c',d:'ɗ',e:'є',f:'f',g:'g',h:'н',i:'ι',j:'נ',k:'к',l:'ℓ',m:'м',n:'η',o:'σ',p:'ρ',q:'q',r:'я',s:'ѕ',t:'т',u:'υ',v:'ν',w:'ω',x:'χ',y:'у',z:'z',
    A:'α',B:'в',C:'c',D:'ɗ',E:'є',F:'f',G:'g',H:'н',I:'ι',J:'נ',K:'к',L:'ℓ',M:'м',N:'η',O:'σ',P:'ρ',Q:'q',R:'я',S:'ѕ',T:'т',U:'υ',V:'ν',W:'ω',X:'χ',Y:'у',Z:'z'
  };

  // Faux Ethiopian
  const FAUX_ETHIOPIAN = {
    a:'ል',b:'ጌ',c:'ር',d:'ዕ',e:'ቿ',f:'ቻ',g:'ኗ',h:'ዘ',i:'ጎ',j:'ጋ',k:'ክ',l:'ረ',m:'ጠ',n:'ክ',o:'ዐ',p:'የ',q:'ዓ',r:'ዪ',s:'ነ',t:'ፕ',u:'ሁ',v:'ሸ',w:'ሠ',x:'ሸ',y:'ሃ',z:'ጊ',
    A:'ል',B:'ጌ',C:'ር',D:'ዕ',E:'ቿ',F:'ቻ',G:'ኗ',H:'ዘ',I:'ጎ',J:'ጋ',K:'ክ',L:'ረ',M:'ጠ',N:'ክ',O:'ዐ',P:'የ',Q:'ዓ',R:'ዪ',S:'ነ',T:'ፕ',U:'ሁ',V:'ሸ',W:'ሠ',X:'ሸ',Y:'ሃ',Z:'ጊ'
  };

  // Shadow Script
  const SHADOW_SCRIPT = {
    a:'α',b:'ҍ',c:'ƈ',d:'ԃ',e:'ҽ',f:'ϝ',g:'ɠ',h:'ԋ',i:'ι',j:'ʝ',k:'ƙ',l:'ʅ',m:'ɱ',n:'ɳ',o:'σ',p:'ρ',q:'ϙ',r:'ɾ',s:'ʂ',t:'ƚ',u:'υ',v:'ʋ',w:'ω',x:'x',y:'ყ',z:'z',
    A:'α',B:'ҍ',C:'ƈ',D:'ԃ',E:'ҽ',F:'ϝ',G:'ɠ',H:'ԋ',I:'ι',J:'ʝ',K:'ƙ',L:'ʅ',M:'ɱ',N:'ɳ',O:'σ',P:'ρ',Q:'ϙ',R:'ɾ',S:'ʂ',T:'ƚ',U:'υ',V:'ʋ',W:'ω',X:'x',Y:'ყ',Z:'z'
  };

  // Ancient Glyphs
  const ANCIENT_GLYPHS = {
    a:'ᗩ',b:'ᗷ',c:'ᑕ',d:'ᗪ',e:'ᕮ',f:'ᖴ',g:'ᘜ',h:'ᕼ',i:'ᓰ',j:'ᒍ',k:'ᖽᐸ',l:'ᒪ',m:'ᘻ',n:'ᘉ',o:'ᓍ',p:'ᕵ',q:'ᕴ',r:'ᖇ',s:'ᔕ',t:'ᖶ',u:'ᑌ',v:'ᕓ',w:'ᗯ',x:'᙭',y:'ᖻ',z:'ᘔ',
    A:'ᗩ',B:'ᗷ',C:'ᑕ',D:'ᗪ',E:'ᕮ',F:'ᖴ',G:'ᘜ',H:'ᕼ',I:'ᓰ',J:'ᒍ',K:'ᖽᐸ',L:'ᒪ',M:'ᘻ',N:'ᘉ',O:'ᓍ',P:'ᕵ',Q:'ᕴ',R:'ᖇ',S:'ᔕ',T:'ᖶ',U:'ᑌ',V:'ᕓ',W:'ᗯ',X:'᙭',Y:'ᖻ',Z:'ᘔ'
  };

  // Fantasy Runes
  const FANTASY_RUNES = {
    a:'ᗩ',b:'ᗷ',c:'ᑕ',d:'ᗪ',e:'ᗴ',f:'ᖴ',g:'ᘜ',h:'ℋ',i:'ℐ',j:'ᒍ',k:'ᖽᐸ',l:'ᒪ',m:'ᘻ',n:'ᘉ',o:'ᓍ',p:'ᕵ',q:'ᕴ',r:'ℛ',s:'ᔕ',t:'ᖶ',u:'ᑌ',v:'ᕓ',w:'ᗯ',x:'᙭',y:'ᖻ',z:'ᘔ',
    A:'ᗩ',B:'ᗷ',C:'ᑕ',D:'ᗪ',E:'ᗴ',F:'ᖴ',G:'ᘜ',H:'ℋ',I:'ℐ',J:'ᒍ',K:'ᖽᐸ',L:'ᒪ',M:'ᘻ',N:'ᘉ',O:'ᓍ',P:'ᕵ',Q:'ᕴ',R:'ℛ',S:'ᔕ',T:'ᖶ',U:'ᑌ',V:'ᕓ',W:'ᗯ',X:'᙭',Y:'ᖻ',Z:'ᘔ'
  };

  // Symbolic
  const SYMBOLIC = {
    a:'α',b:'в',c:'¢',d:'∂',e:'є',f:'ƒ',g:'g',h:'н',i:'ι',j:'נ',k:'к',l:'ℓ',m:'м',n:'η',o:'σ',p:'ρ',q:'q',r:'я',s:'ѕ',t:'т',u:'υ',v:'ν',w:'ω',x:'χ',y:'у',z:'z',
    A:'α',B:'в',C:'¢',D:'∂',E:'є',F:'ƒ',G:'g',H:'н',I:'ι',J:'נ',K:'к',L:'ℓ',M:'м',N:'η',O:'σ',P:'ρ',Q:'q',R:'я',S:'ѕ',T:'т',U:'υ',V:'ν',W:'ω',X:'χ',Y:'у',Z:'z'
  };

  // Thai Fusion
  const THAI_FUSION = {
    a:'ค',b:'๒',c:'ƈ',d:'ɗ',e:'є',f:'f',g:'g',h:'ђ',i:'เ',j:'ן',k:'к',l:'l',m:'๓',n:'ภ',o:'๏',p:'ρ',q:'ợ',r:'г',s:'ร',t:'t',u:'น',v:'v',w:'ω',x:'x',y:'ყ',z:'z',
    A:'ค',B:'๒',C:'ƈ',D:'ɗ',E:'є',F:'f',G:'g',H:'ђ',I:'เ',J:'ן',K:'к',L:'l',M:'๓',N:'ภ',O:'๏',P:'ρ',Q:'ợ',R:'г',S:'ร',T:'t',U:'น',V:'v',W:'ω',X:'x',Y:'ყ',Z:'z'
  };

  // Decorative Latin
  const DECORATIVE_LATIN = {
    a:'å',b:'β',c:'ç',d:'ð',e:'ê',f:'ƒ',g:'g',h:'ħ',i:'ï',j:'ʝ',k:'κ',l:'ℓ',m:'ɱ',n:'ñ',o:'ð',p:'þ',q:'q',r:'ř',s:'§',t:'†',u:'ü',v:'v',w:'ω',x:'χ',y:'¥',z:'ž',
    A:'Å',B:'Β',C:'Ç',D:'Ð',E:'Ê',F:'Ƒ',G:'G',H:'Ħ',I:'Ï',J:'ʝ',K:'Κ',L:'Ł',M:'Ɱ',N:'Ñ',O:'Ð',P:'Þ',Q:'Q',R:'Ř',S:'§',T:'†',U:'Ü',V:'V',W:'Ω',X:'Χ',Y:'¥',Z:'Ž'
  };

  // Mystic Latin
  const MYSTIC_LATIN = {
    a:'α',b:'в',c:'ƈ',d:'ԃ',e:'ҽ',f:'ϝ',g:'ɠ',h:'ԋ',i:'ι',j:'ʝ',k:'ƙ',l:'ʅ',m:'ɱ',n:'ɳ',o:'σ',p:'ρ',q:'ϙ',r:'ɾ',s:'ʂ',t:'ƚ',u:'υ',v:'ʋ',w:'ω',x:'x',y:'ყ',z:'z',
    A:'α',B:'в',C:'ƈ',D:'ԃ',E:'ҽ',F:'ϝ',G:'ɠ',H:'ԋ',I:'ι',J:'ʝ',K:'ƙ',L:'ʅ',M:'ɱ',N:'ɳ',O:'σ',P:'ρ',Q:'ϙ',R:'ɾ',S:'ʂ',T:'ƚ',U:'υ',V:'ʋ',W:'ω',X:'x',Y:'ყ',Z:'z'
  };

  // Techno
  const TECHNO = {
    a:'Δ',b:'β',c:'C',d:'D',e:'€',f:'F',g:'G',h:'Ħ',i:'Ɨ',j:'J',k:'K',l:'L',m:'M',n:'Ň',o:'Ø',p:'P',q:'Q',r:'R',s:'Ş',t:'Ŧ',u:'U',v:'V',w:'W',x:'X',y:'¥',z:'Z',
    A:'Δ',B:'β',C:'C',D:'D',E:'€',F:'F',G:'G',H:'Ħ',I:'Ɨ',J:'J',K:'K',L:'L',M:'M',N:'Ň',O:'Ø',P:'P',Q:'Q',R:'R',S:'Ş',T:'Ŧ',U:'U',V:'V',W:'W',X:'X',Y:'¥',Z:'Z'
  };

  // Cyberpunk
  const CYBERPUNK = {
    a:'Δ',b:'β',c:'C',d:'D',e:'Ɇ',f:'F',g:'G',h:'Ħ',i:'Ɨ',j:'J',k:'K',l:'L',m:'M',n:'Ň',o:'Ø',p:'P',q:'Q',r:'R',s:'Ș',t:'Ŧ',u:'U',v:'V',w:'W',x:'X',y:'Ɏ',z:'Z',
    A:'Δ',B:'β',C:'C',D:'D',E:'Ɇ',F:'F',G:'G',H:'Ħ',I:'Ɨ',J:'J',K:'K',L:'L',M:'M',N:'Ň',O:'Ø',P:'P',Q:'Q',R:'R',S:'Ș',T:'Ŧ',U:'U',V:'V',W:'W',X:'X',Y:'Ɏ',Z:'Z'
  };

  // Greek Fusion
  const GREEK_FUSION = {
    a:'α',b:'в',c:'c',d:'ɗ',e:'ε',f:'f',g:'g',h:'ħ',i:'ί',j:'ʝ',k:'κ',l:'ℓ',m:'ɱ',n:'ɴ',o:'σ',p:'ρ',q:'q',r:'я',s:'ѕ',t:'τ',u:'υ',v:'ν',w:'ω',x:'χ',y:'у',z:'z',
    A:'α',B:'в',C:'c',D:'ɗ',E:'ε',F:'f',G:'g',H:'ħ',I:'ί',J:'ʝ',K:'κ',L:'ℓ',M:'ɱ',N:'ɴ',O:'σ',P:'ρ',Q:'q',R:'я',S:'ѕ',T:'τ',U:'υ',V:'ν',W:'ω',X:'χ',Y:'у',Z:'z'
  };

  // Greek Capitals
  const GREEK_CAPITALS = {
    a:'Λ',b:'B',c:'C',d:'D',e:'Σ',f:'F',g:'G',h:'Ή',i:'I',j:'J',k:'K',l:'L',m:'M',n:'П',o:'Ө',p:'P',q:'Q',r:'Я',s:'Ƨ',t:'Ƭ',u:'U',v:'V',w:'W',x:'X',y:'Ƴ',z:'Z',
    A:'Λ',B:'B',C:'C',D:'D',E:'Σ',F:'F',G:'G',H:'Ή',I:'I',J:'J',K:'K',L:'L',M:'M',N:'П',O:'Ө',P:'P',Q:'Q',R:'Я',S:'Ƨ',T:'Ƭ',U:'U',V:'V',W:'W',X:'X',Y:'Ƴ',Z:'Z'
  };

  // Cyrillic Mix
  const CYRILLIC_MIX = {
    a:'а',b:'б',c:'с',d:'д',e:'э',f:'ф',g:'г',h:'ћ',i:'і',j:'ј',k:'к',l:'л',m:'м',n:'и',o:'о',p:'р',q:'ԛ',r:'г',s:'ѕ',t:'т',u:'у',v:'в',w:'ш',x:'х',y:'ӳ',z:'з',
    A:'А',B:'Б',C:'С',D:'Д',E:'Э',F:'Ф',G:'Г',H:'Ћ',I:'І',J:'Ј',K:'К',L:'Л',M:'М',N:'И',O:'О',P:'Р',Q:'Ԛ',R:'Г',S:'Ѕ',T:'Т',U:'У',V:'В',W:'Ш',X:'Х',Y:'Ӳ',Z:'З'
  };

  // Slashed Latin
  const SLASHED_LATIN = {
    a:'ⱥ',b:'ƀ',c:'ȼ',d:'đ',e:'ɇ',f:'ƒ',g:'ǥ',h:'ħ',i:'ɨ',j:'ɉ',k:'ꝁ',l:'ł',m:'ɱ',n:'n',o:'ø',p:'ᵽ',q:'ꝗ',r:'ɍ',s:'ꞩ',t:'ŧ',u:'ʉ',v:'v',w:'w',x:'x',y:'ɏ',z:'ƶ',
    A:'Ⱥ',B:'Ƀ',C:'Ȼ',D:'Đ',E:'Ɇ',F:'Ƒ',G:'Ǥ',H:'Ħ',I:'Ɨ',J:'Ɉ',K:'Ꝁ',L:'Ł',M:'Ɱ',N:'N',O:'Ø',P:'Ᵽ',Q:'Ꝗ',R:'Ɍ',S:'Ꞩ',T:'Ŧ',U:'Ʉ',V:'V',W:'W',X:'X',Y:'Ɏ',Z:'Ƶ'
  };

  // Double Slashed (currency-like)
  const DOUBLE_SLASHED = {
    a:'₳',b:'฿',c:'₵',d:'₫',e:'€',f:'₣',g:'₲',h:'₴',i:'ł',j:'ɉ',k:'₭',l:'₤',m:'₥',n:'₦',o:'Ø',p:'₱',q:'Ω',r:'₹',s:'₴',t:'₮',u:'Ʉ',v:'Ѵ',w:'₩',x:'Ӿ',y:'¥',z:'₴',
    A:'₳',B:'฿',C:'₵',D:'₫',E:'€',F:'₣',G:'₲',H:'₴',I:'ł',J:'Ɉ',K:'₭',L:'₤',M:'₥',N:'₦',O:'Ø',P:'₱',Q:'Ω',R:'₹',S:'₴',T:'₮',U:'Ʉ',V:'Ѵ',W:'₩',X:'Ӿ',Y:'¥',Z:'₴'
  };

  // Decorative Thai
  const DECORATIVE_THAI = {
    a:'ค',b:'๒',c:'ƈ',d:'ɗ',e:'ē',f:'f',g:'g',h:'h',i:'เ',j:'ן',k:'к',l:'l',m:'๓',n:'ภ',o:'໐',p:'ρ',q:'ợ',r:'г',s:'Ş',t:'t',u:'น',v:'v',w:'ω',x:'x',y:'ฯ',z:'z',
    A:'ค',B:'๒',C:'ƈ',D:'ɗ',E:'Ē',F:'f',G:'g',H:'h',I:'เ',J:'ן',K:'к',L:'l',M:'๓',N:'ภ',O:'໐',P:'ρ',Q:'ợ',R:'г',S:'Ş',T:'t',U:'น',V:'v',W:'ω',X:'x',Y:'ฯ',Z:'z'
  };

  // Russian Lookalike
  const RUSSIAN_LOOKALIKE = {
    a:'а',b:'б',c:'с',d:'д',e:'е',f:'ф',g:'г',h:'н',i:'і',j:'ј',k:'к',l:'л',m:'м',n:'и',o:'о',p:'р',q:'ԛ',r:'г',s:'ѕ',t:'т',u:'у',v:'в',w:'ш',x:'х',y:'у',z:'з',
    A:'А',B:'Б',C:'С',D:'Д',E:'Е',F:'Ф',G:'Г',H:'Н',I:'І',J:'Ј',K:'К',L:'Л',M:'М',N:'И',O:'О',P:'Р',Q:'Ԛ',R:'Г',S:'Ѕ',T:'Т',U:'У',V:'В',W:'Ш',X:'Х',Y:'У',Z:'З'
  };

  // Cyber Cyrillic
  const CYBER_CYRILLIC = {
    a:'а',b:'б',c:'с',d:'д',e:'ё',f:'ф',g:'г',h:'н',i:'і',j:'ј',k:'к',l:'л',m:'м',n:'и',o:'о',p:'р',q:'ԛ',r:'г',s:'$',t:'т',u:'у',v:'в',w:'ш',x:'х',y:'у',z:'з',
    A:'А',B:'Б',C:'С',D:'Д',E:'Ё',F:'Ф',G:'Г',H:'Н',I:'І',J:'Ј',K:'К',L:'Л',M:'М',N:'И',O:'О',P:'Р',Q:'Ԛ',R:'Г',S:'$',T:'Т',U:'У',V:'В',W:'Ш',X:'Х',Y:'У',Z:'З'
  };

  // Fake Cyrillic
  const FAKE_CYRILLIC = {
    a:'а',b:'б',c:'с',d:'д',e:'э',f:'ф',g:'г',h:'н',i:'і',j:'ј',k:'к',l:'л',m:'м',n:'и',o:'о',p:'р',q:'ԛ',r:'г',s:'ѕ',t:'т',u:'у',v:'в',w:'ш',x:'х',y:'ў',z:'з',
    A:'А',B:'Б',C:'С',D:'Д',E:'Э',F:'Ф',G:'Г',H:'Н',I:'І',J:'Ј',K:'К',L:'Л',M:'М',N:'И',O:'О',P:'Р',Q:'Ԛ',R:'Г',S:'Ѕ',T:'Т',U:'У',V:'В',W:'Ш',X:'Х',Y:'Ў',Z:'З'
  };

  // Lisu Style
  const LISU = {
    a:'ꓮ',b:'ꓐ',c:'ꓚ',d:'ꓓ',e:'ꓰ',f:'ꓝ',g:'ꓖ',h:'ꓧ',i:'ꓲ',j:'ꓙ',k:'ꓗ',l:'ꓡ',m:'ꓟ',n:'ꓠ',o:'ꓳ',p:'ꓑ',q:'ꓣ',r:'ꓣ',s:'ꓢ',t:'ꓔ',u:'ꓴ',v:'ꓦ',w:'ꓪ',x:'ꓫ',y:'ꓬ',z:'ꓜ',
    A:'ꓮ',B:'ꓐ',C:'ꓚ',D:'ꓓ',E:'ꓰ',F:'ꓝ',G:'ꓖ',H:'ꓧ',I:'ꓲ',J:'ꓙ',K:'ꓗ',L:'ꓡ',M:'ꓟ',N:'ꓠ',O:'ꓳ',P:'ꓑ',Q:'ꓣ',R:'ꓣ',S:'ꓢ',T:'ꓔ',U:'ꓴ',V:'ꓦ',W:'ꓪ',X:'ꓫ',Y:'ꓬ',Z:'ꓜ'
  };

  // Yi Style
  const YI = {
    a:'ꀊ',b:'ꀘ',c:'ꀯ',d:'ꀊ',e:'ꈼ',f:'ꃅ',g:'ꁅ',h:'ꍩ',i:'ꂑ',j:'ꀊ',k:'ꀊ',l:'ꀊ',m:'ꂵ',n:'ꋊ',o:'ꂦ',p:'ꉣ',q:'ꀊ',r:'ꌅ',s:'ꌚ',t:'ꋖ',u:'ꀊ',v:'ꀊ',w:'ꀊ',x:'ꀊ',y:'ꐞ',z:'ꀊ',
    A:'ꀊ',B:'ꀘ',C:'ꀯ',D:'ꀊ',E:'ꈼ',F:'ꃅ',G:'ꁅ',H:'ꍩ',I:'ꂑ',J:'ꀊ',K:'ꀊ',L:'ꀊ',M:'ꂵ',N:'ꋊ',O:'ꂦ',P:'ꉣ',Q:'ꀊ',R:'ꌅ',S:'ꌚ',T:'ꋖ',U:'ꀊ',V:'ꀊ',W:'ꀊ',X:'ꀊ',Y:'ꐞ',Z:'ꀊ'
  };

  // Old Italic
  const OLD_ITALIC = {
    a:'𐌀',b:'𐌁',c:'𐌂',d:'𐌃',e:'𐌄',f:'𐌅',g:'𐌖',h:'𐌇',i:'𐌉',j:'𐌉',k:'𐌊',l:'𐌋',m:'𐌌',n:'𐌍',o:'𐌏',p:'𐌐',q:'𐌒',r:'𐌓',s:'𐌔',t:'𐌕',u:'𐌖',v:'𐌖',w:'𐌖',x:'𐌗',y:'𐌙',z:'𐌆',
    A:'𐌀',B:'𐌁',C:'𐌂',D:'𐌃',E:'𐌄',F:'𐌅',G:'𐌖',H:'𐌇',I:'𐌉',J:'𐌉',K:'𐌊',L:'𐌋',M:'𐌌',N:'𐌍',O:'𐌏',P:'𐌐',Q:'𐌒',R:'𐌓',S:'𐌔',T:'𐌕',U:'𐌖',V:'𐌖',W:'𐌖',X:'𐌗',Y:'𐌙',Z:'𐌆'
  };

  // Katakana
  const KATAKANA = {
    a:'ﾑ',b:'乃',c:'ᄃ',d:'り',e:'乇',f:'ｷ',g:'g',h:'ん',i:'ﾉ',j:'ﾌ',k:'ズ',l:'ﾚ',m:'ﾶ',n:'刀',o:'の',p:'ｱ',q:'q',r:'尺',s:'丂',t:'ｲ',u:'u',v:'v',w:'w',x:'ﾒ',y:'ﾘ',z:'乙',
    A:'ﾑ',B:'乃',C:'ᄃ',D:'り',E:'乇',F:'ｷ',G:'G',H:'ん',I:'ﾉ',J:'ﾌ',K:'ズ',L:'ﾚ',M:'ﾶ',N:'刀',O:'の',P:'ｱ',Q:'Q',R:'尺',S:'丂',T:'ｲ',U:'U',V:'V',W:'W',X:'ﾒ',Y:'ﾘ',Z:'乙'
  };

  // Box Text
  const BOX_TEXT = {
    a:'卂',b:'乃',c:'匚',d:'ᗪ',e:'乇',f:'千',g:'g',h:'卄',i:'丨',j:'ﾌ',k:'Ҝ',l:'ㄥ',m:'爪',n:'几',o:'ㄖ',p:'卩',q:'Ɋ',r:'尺',s:'丂',t:'ㄒ',u:'ㄩ',v:'ᐯ',w:'山',x:'乂',y:'ㄚ',z:'乙',
    A:'卂',B:'乃',C:'匚',D:'ᗪ',E:'乇',F:'千',G:'G',H:'卄',I:'丨',J:'ﾌ',K:'Ҝ',L:'ㄥ',M:'爪',N:'几',O:'ㄖ',P:'卩',Q:'Ɋ',R:'尺',S:'丂',T:'ㄒ',U:'ㄩ',V:'ᐯ',W:'山',X:'乂',Y:'ㄚ',Z:'乙'
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

  const STYLE_DEFS = [
    // Default group
    { key: 'bold',           title: 'Bold',             safety: 'safe', group: 'default', size: 1.05, fn: t => mapContiguous(t, 0x1D400, 0x1D41A, 0x1D7CE, {}) },
    { key: 'italic',         title: 'Italic',           safety: 'warn', group: 'default', size: 1.05, fn: t => mapContiguous(t, 0x1D434, 0x1D44E, null, { h: 'ℎ' }) },
    { key: 'bolditalic',     title: 'Bold Italic',      safety: 'warn', group: 'default', size: 1.05, fn: t => mapContiguous(t, 0x1D468, 0x1D482, null, {}) },
    { key: 'smallcaps',      title: 'Small Caps',       safety: 'safe', group: 'default', size: 1.00, fn: t => mapLookup(t, SMALLCAPS) },
    { key: 'monospace',      title: 'Monospace',        safety: 'warn', group: 'default', size: 1.00, fn: t => mapContiguous(t, 0x1D670, 0x1D68A, 0x1D7F6, {}) },

    // Extra group
    { key: 'script',         title: 'Script',           safety: 'warn', group: 'extra', size: 1.05, fn: t => mapContiguous(t, 0x1D49C, 0x1D4B6, null, { B: 'ℬ', E: 'ℰ', F: 'ℱ', H: 'ℋ', I: 'ℐ', L: 'ℒ', M: 'ℳ', R: 'ℛ', e: 'ℯ', g: 'ℊ', o: 'ℴ' }) },
    { key: 'boldscript',     title: 'Bold Script',      safety: 'warn', group: 'extra', size: 1.05, fn: t => mapContiguous(t, 0x1D4D0, 0x1D4EA, null, {}) },
    { key: 'doublestruck',   title: 'Double-Struck',    safety: 'warn', group: 'extra', size: 1.05, fn: t => mapContiguous(t, 0x1D538, 0x1D552, 0x1D7D8, { C: 'ℂ', H: 'ℍ', N: 'ℕ', P: 'ℙ', Q: 'ℚ', R: 'ℝ', Z: 'ℤ' }) },
    { key: 'fraktur',        title: 'Fraktur',          safety: 'warn', group: 'extra', size: 1.10, fn: t => mapContiguous(t, 0x1D504, 0x1D51E, null, { C: 'ℭ', H: 'ℌ', I: 'ℑ', R: 'ℜ', Z: 'ℨ' }) },
    { key: 'frakturbold',    title: 'Fraktur Bold',     safety: 'warn', group: 'extra', size: 1.10, fn: t => mapContiguous(t, 0x1D56C, 0x1D586, null, {}) },
    { key: 'spaced',         title: 'Spaced',           safety: 'safe', group: 'extra', size: 0.95, fn: fullwidth },
    { key: 'circled',        title: 'Circled',          safety: 'warn', group: 'extra', size: 0.90, fn: circled },
    { key: 'negcircled',     title: 'Negative Circled', safety: 'risk', group: 'extra', size: 1.10, fn: negativeCircled },
    { key: 'squared',        title: 'Squared',          safety: 'warn', group: 'extra', size: 0.90, fn: squared },
    { key: 'negsquared',     title: 'Negative Squared', safety: 'risk', group: 'extra', size: 1.10, fn: negativeSquared },
    { key: 'bracket',        title: 'Bracket Text',     safety: 'safe', group: 'extra', size: 0.95, fn: bracketText },
    { key: 'currency',       title: 'Currency',         safety: 'warn', group: 'extra', size: 1.00, fn: t => mapLookup(t, CURRENCY) },
    { key: 'parenthesized',  title: 'Parenthesized',    safety: 'warn', group: 'extra', size: 0.90, fn: parenthesized },
    { key: 'superscript',    title: 'Superscript',      safety: 'warn', group: 'extra', size: 1.20, fn: t => mapLookup(t, SUPERSCRIPT) },
    { key: 'gaming',         title: 'Gaming',           safety: 'safe', group: 'extra', size: 1.00, fn: t => mapLookup(t, GAMING) },
    { key: 'upsidedown',     title: 'Upside Down',      safety: 'safe', group: 'extra', size: 1.00, fn: upsideDown },
    { key: 'backwards',      title: 'Backwards',        safety: 'safe', group: 'extra', size: 1.00, fn: t => t.split('').reverse().join('') },
    { key: 'braille',        title: 'Braille',          safety: 'warn', group: 'extra', size: 1.10, fn: t => mapLookup(t, BRAILLE) },
    { key: 'strikethrough',  title: 'Strikethrough',    safety: 'safe', group: 'extra', size: 1.00, fn: t => applyCombining(t, '\u0336') },
    { key: 'slashthrough',   title: 'Slash Through',    safety: 'safe', group: 'extra', size: 1.00, fn: t => applyCombining(t, '\u0337') },
    { key: 'underline',      title: 'Underline',        safety: 'safe', group: 'extra', size: 1.00, fn: t => applyCombining(t, '\u0332') },
    { key: 'overline',       title: 'Overline',         safety: 'safe', group: 'extra', size: 1.00, fn: t => applyCombining(t, '\u0305') },
    { key: 'altline',        title: 'Alternating Line', safety: 'safe', group: 'extra', size: 1.00, fn: t => applyAlternating(t, '\u0332', '\u0305') },
    { key: 'ringabove',      title: 'Ring Above',       safety: 'safe', group: 'extra', size: 1.00, fn: t => applyCombining(t, '\u030A') },
    { key: 'wavy',           title: 'Wavy',             safety: 'safe', group: 'extra', size: 1.00, fn: t => applyCombining(t, '\u0334') },
    { key: 'crown',          title: 'Crown',            safety: 'safe', group: 'extra', size: 1.00, fn: t => '👑 ' + t + ' 👑' },
    { key: 'fire',           title: 'Fire',             safety: 'safe', group: 'extra', size: 1.00, fn: t => '🔥 ' + t + ' 🔥' },
    { key: 'runic',          title: 'Runic',            safety: 'warn', group: 'extra', size: 1.00, fn: t => mapLookup(t, RUNIC) },
    { key: 'fantasyscript',  title: 'Fantasy Script',   safety: 'warn', group: 'extra', size: 1.00, fn: t => mapLookup(t, FANTASY_SCRIPT) },
    { key: 'mystic',         title: 'Mystic',           safety: 'warn', group: 'extra', size: 1.00, fn: t => mapLookup(t, MYSTIC) },
    { key: 'fauxethiopian',  title: 'Faux Ethiopian',   safety: 'risk', group: 'extra', size: 1.00, fn: t => mapLookup(t, FAUX_ETHIOPIAN) },
    { key: 'shadowscript',   title: 'Shadow Script',    safety: 'warn', group: 'extra', size: 1.00, fn: t => mapLookup(t, SHADOW_SCRIPT) },
    { key: 'ancientglyphs',  title: 'Ancient Glyphs',   safety: 'warn', group: 'extra', size: 1.00, fn: t => mapLookup(t, ANCIENT_GLYPHS) },
    { key: 'fantasyrunes',   title: 'Fantasy Runes',    safety: 'warn', group: 'extra', size: 1.00, fn: t => mapLookup(t, FANTASY_RUNES) },
    { key: 'symbolic',       title: 'Symbolic',         safety: 'warn', group: 'extra', size: 1.00, fn: t => mapLookup(t, SYMBOLIC) },
    { key: 'thaifusion',     title: 'Thai Fusion',      safety: 'warn', group: 'extra', size: 1.00, fn: t => mapLookup(t, THAI_FUSION) },
    { key: 'decorativelatin',title: 'Decorative Latin', safety: 'warn', group: 'extra', size: 1.00, fn: t => mapLookup(t, DECORATIVE_LATIN) },
    { key: 'mysticlatin',    title: 'Mystic Latin',     safety: 'warn', group: 'extra', size: 1.00, fn: t => mapLookup(t, MYSTIC_LATIN) },
    { key: 'techno',         title: 'Techno',           safety: 'warn', group: 'extra', size: 1.00, fn: t => mapLookup(t, TECHNO) },
    { key: 'cyberpunk',      title: 'Cyberpunk',        safety: 'warn', group: 'extra', size: 1.00, fn: t => mapLookup(t, CYBERPUNK) },
    { key: 'greekfusion',    title: 'Greek Fusion',     safety: 'warn', group: 'extra', size: 1.00, fn: t => mapLookup(t, GREEK_FUSION) },
    { key: 'greekcapitals',  title: 'Greek Capitals',   safety: 'warn', group: 'extra', size: 1.00, fn: t => mapLookup(t, GREEK_CAPITALS) },
    { key: 'cyrillicmix',    title: 'Cyrillic Mix',     safety: 'warn', group: 'extra', size: 1.00, fn: t => mapLookup(t, CYRILLIC_MIX) },
    { key: 'slashedlatin',   title: 'Slashed Latin',    safety: 'warn', group: 'extra', size: 1.00, fn: t => mapLookup(t, SLASHED_LATIN) },
    { key: 'doubleslashed',  title: 'Double Slashed',   safety: 'warn', group: 'extra', size: 1.00, fn: t => mapLookup(t, DOUBLE_SLASHED) },
    { key: 'decorativethai', title: 'Decorative Thai',  safety: 'warn', group: 'extra', size: 1.00, fn: t => mapLookup(t, DECORATIVE_THAI) },
    { key: 'russianlookalike', title: 'Russian Lookalike', safety: 'warn', group: 'extra', size: 1.00, fn: t => mapLookup(t, RUSSIAN_LOOKALIKE) },
    { key: 'cybercyrillic',  title: 'Cyber Cyrillic',   safety: 'warn', group: 'extra', size: 1.00, fn: t => mapLookup(t, CYBER_CYRILLIC) },
    { key: 'fakecyrillic',   title: 'Fake Cyrillic',    safety: 'warn', group: 'extra', size: 1.00, fn: t => mapLookup(t, FAKE_CYRILLIC) },
    { key: 'lisu',           title: 'Lisu Style',       safety: 'risk', group: 'extra', size: 1.00, fn: t => mapLookup(t, LISU) },
    { key: 'yi',             title: 'Yi Style',         safety: 'risk', group: 'extra', size: 1.00, fn: t => mapLookup(t, YI) },
    { key: 'olditalic',      title: 'Old Italic',       safety: 'risk', group: 'extra', size: 1.00, fn: t => mapLookup(t, OLD_ITALIC) },
    { key: 'katakana',       title: 'Katakana',         safety: 'warn', group: 'extra', size: 1.00, fn: t => mapLookup(t, KATAKANA) },
    { key: 'boxtext',        title: 'Box Text',         safety: 'warn', group: 'extra', size: 1.00, fn: t => mapLookup(t, BOX_TEXT) }
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
      '<div class="tpx-stg-font-card tpx-stg-card-empty" id="tpx-stg-card-' + key + '">' +
        '<div class="tpx-stg-card-left">' +
          '<div class="tpx-stg-card-header">' +
            '<div class="tpx-stg-card-title-wrap">' +
              '<span class="tpx-stg-safety-dot ' + def.safety + '" role="img" aria-label="Compatibility: ' + label + '"></span>' +
              '<span class="tpx-stg-card-title">' + def.title + '</span>' +
            '</div>' +
            '<div class="tpx-stg-card-actions">' +
              '<button type="button" class="tpx-stg-copy-btn" data-key="' + key + '" aria-label="Copy ' + def.title + ' text">' + iconUse('icon-copy') + '</button>' +
              '<button type="button" class="tpx-stg-preview-btn" data-key="' + key + '" aria-label="Preview ' + def.title + ' on social platforms" title="Preview on social platforms">' + iconUse('icon-preview') + '</button>' +
              '<button type="button" class="tpx-stg-download-btn" data-key="' + key + '" aria-label="Download ' + def.title + ' text">' + iconUse('icon-download') + '</button>' +
            '</div>' +
          '</div>' +
          '<div class="tpx-stg-card-body tpx-stg-placeholder" data-key="' + key + '" style="--tpx-stg-scale:' + scale + '">Type something to start</div>' +
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
            '<div class="tpx-stg-pv-view tpx-stg-pv-x" data-view="x" hidden>' +
              '<div class="tpx-stg-pv-x-cover"></div>' +
              '<div class="tpx-stg-pv-x-body">' +
                '<div class="tpx-stg-preview-avatar tpx-stg-pv-x-avatar">' + iconUse('icon-person') + '</div>' +
                '<div class="tpx-stg-pv-x-top-actions">' +
                  '<div class="tpx-stg-pv-x-icon-btn" aria-label="Notifications">' + iconUse('icon-bell-plus') + '</div>' +
                  '<button type="button" class="tpx-stg-pv-x-follow-btn">' + iconUse('icon-user-plus') + '<span>Follow</span></button>' +
                '</div>' +
                '<div class="tpx-stg-pv-x-name">Toolpx <span class="tpx-stg-pv-x-badge">' + iconUse('icon-badge-check') + '</span></div>' +
                '<div class="tpx-stg-pv-x-handle">@toolpx</div>' +
                '<div class="tpx-stg-pv-x-bio tpx-stg-preview-bio" data-key="' + key + '">Type something to see it here</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="tpx-stg-preview-tabbar">' +
            '<div class="tpx-stg-preview-tabgroup">' +
              '<button type="button" class="tpx-stg-preview-tab is-active" data-platform="instagram" title="Instagram" aria-label="Preview on Instagram">' + iconUse('icon-platform-instagram') + '</button>' +
              '<button type="button" class="tpx-stg-preview-tab" data-platform="facebook" title="Facebook" aria-label="Preview on Facebook">' + iconUse('icon-platform-facebook') + '</button>' +
              '<button type="button" class="tpx-stg-preview-tab" data-platform="x" title="X" aria-label="Preview on X">' + iconUse('icon-platform-twitter') + '</button>' +
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
    const previewBios = grid.querySelectorAll('.tpx-stg-preview-bio[data-key="' + key + '"]');
    const placeholderText = fn(PLACEHOLDER_SAMPLE);
    const previewPlaceholders = {};
    previewBios.forEach(function (el) {
      const view = el.closest('.tpx-stg-pv-view');
      const platform = view ? view.dataset.view : null;
      previewPlaceholders[platform] = truncateForPlatform(placeholderText, PREVIEW_CHAR_LIMITS[platform]);
    });
    styleRefs[key] = {
      body: grid.querySelector('.tpx-stg-card-body[data-key="' + key + '"]'),
      card: document.getElementById('tpx-stg-card-' + key),
      previewBios: previewBios,
      placeholderText: placeholderText,
      previewPlaceholders: previewPlaceholders
    };
  }

  function renderCardsForGroup(group, container) {
    const defs = STYLE_DEFS.filter(function (d) { return d.group === group; });
    container.innerHTML = defs.map(cardTemplate).join('');
    defs.forEach(function (d) { buildStyleRefs(d.key); });
    return defs.map(function (d) { return d.key; });
  }

  const DEFAULT_VISIBLE_KEYS = renderCardsForGroup('default', defaultStylesContainer);

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

  function renderKeys(keys, text, isEmpty) {
    keys.forEach(function (key) {
      const fn = STYLE_FNS[key];
      const refs = styleRefs[key];
      if (!refs || !refs.body) return;
      if (isEmpty) {
        refs.body.textContent = refs.placeholderText;
        refs.body.classList.add('tpx-stg-placeholder');
        refs.card.classList.add('tpx-stg-card-empty');
        refs.previewBios.forEach(function (el) {
          const view = el.closest('.tpx-stg-pv-view');
          const platform = view ? view.dataset.view : null;
          el.textContent = refs.previewPlaceholders[platform];
        });
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

  function render() {
    const text = ta.value;
    const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).filter(Boolean).length;
    const chars = text.replace(/\n/g, '').length;
    const charsNoSpaces = text.replace(/\s/g, '').length;
    document.getElementById('tpx-stg-val-words').textContent = words.toLocaleString();
    document.getElementById('tpx-stg-val-chars').textContent = chars.toLocaleString();
    document.getElementById('tpx-stg-val-chars-ns').textContent = charsNoSpaces.toLocaleString();
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
  const infoToggle = document.getElementById('tpx-stg-info-toggle');
  const infoBody = document.getElementById('tpx-stg-info-body');
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
    document.querySelectorAll('.tpx-stg-preview-panel.is-open').forEach(function (panel) {
      panel.classList.remove('is-open');
      const key = panel.dataset.key;
      const btn = grid.querySelector('.tpx-stg-preview-btn[data-key="' + key + '"]');
      const card = document.getElementById('tpx-stg-card-' + key);
      if (btn) btn.classList.remove('tpx-stg-preview-active');
      if (card) card.classList.remove('tpx-stg-preview-is-open');
    });
  });

  function flashCopied(btn, announceLabel) {
    btn.innerHTML = ICON_CHECK;
    btn.classList.add('tpx-stg-copied');
    if (announceLabel) announce(announceLabel);
    setTimeout(function () {
      btn.innerHTML = ICON_COPY;
      btn.classList.remove('tpx-stg-copied');
    }, 1500);
  }

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

  /* ---- Footer actions ---- */
  document.getElementById('tpx-stg-btn-paste').addEventListener('click', function () {
    navigator.clipboard.readText().then(function (t) {
      ta.value += t;
      render();
      ta.focus();
    }).catch(function () {
      ta.focus();
    });
  });

  document.getElementById('tpx-stg-btn-clear').addEventListener('click', function () {
    ta.value = '';
    render();
    ta.focus();
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
      reader.onload = function (evt) {
        ta.value = evt.target.result;
        render();
      };
      reader.readAsText(file);
    } else {
      announce('DOCX parsing uses Mammoth.js — wire up as in Word Counter');
    }
    this.value = '';
  });

  render();
});
