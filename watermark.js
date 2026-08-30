(function(){
'use strict';
const {PDFDocument,rgb,degrees,StandardFonts}=PDFLib;
pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

const state={
  pdfFile:null,pdfBytes:null,pdfDoc:null,
  pdfJsDoc:null,originalPdfJsDoc:null,
  watermarkedBytes:null,
  currentPage:1,totalPages:0,
  activeTab:'text',
  pattern:'single',
  textPos:{nx:.5,ny:.5},
  imagePos:{nx:.5,ny:.5},
  watermarkImageData:null,
  watermarkImageEl:null,
  rendering:false,liveRendering:false,
  baseCanvas:document.createElement('canvas'),
  basePageNum:null,
  baseRenderTask:null,
  renderTask:null,
  drag:null,
  hoverActive:false,
};
let _liveRafId=null;
let _canvasQueue=Promise.resolve();
function queueCanvasTask(taskFn){
  const result=_canvasQueue.then(taskFn,taskFn);
  _canvasQueue=result.then(()=>{},()=>{});
  return result;
}
const $=id=>document.getElementById(id);
const el={
  root:document.getElementById('wpwm-root'),
  loader:$('wpwm-loader'),dropzone:$('wpwm-dropzone'),fileInput:$('wpwm-file-input'),
  fileInfo:$('wpwm-file-info'),fileName:$('wpwm-file-name'),fileSize:$('wpwm-file-size'),
  filePages:$('wpwm-file-pages'),
  removeFile:$('wpwm-remove-file'),error:$('wpwm-error'),mainPanel:$('wpwm-main-panel'),
  tabText:$('wpwm-tab-text'),tabImage:$('wpwm-tab-image'),
  textOptions:$('wpwm-text-options'),imageOptions:$('wpwm-image-options'),
  tileSpacingField:$('wpwm-tile-spacing-field'),
  pageRangeMode:$('wpwm-page-range-mode'),
  customRangeField:$('wpwm-custom-range-field'),
  customRangeInput:$('wpwm-custom-range-input'),
  hSpacing:$('wpwm-h-spacing'),hSpacingVal:$('wpwm-h-spacing-val'),
  vSpacing:$('wpwm-v-spacing'),vSpacingVal:$('wpwm-v-spacing-val'),
  wmText:$('wpwm-wm-text'),fontSize:$('wpwm-font-size'),fontSizeVal:$('wpwm-font-size-val'),
  fontFamily:$('wpwm-font-family'),styleBoldBtn:$('wpwm-style-bold'),styleItalicBtn:$('wpwm-style-italic'),
  textOpacity:$('wpwm-text-opacity'),textOpVal:$('wpwm-text-opacity-val'),
  rotation:$('wpwm-rotation'),rotationVal:$('wpwm-rotation-val'),
  textColor:$('wpwm-text-color'),
  colorPickerTrigger:$('wpwm-color-picker-trigger'),colorPopover:$('wpwm-color-popover'),
  svBox:$('wpwm-color-sv'),svHandle:$('wpwm-color-sv-handle'),
  hueSlider:$('wpwm-color-hue-slider'),colorHexInput:$('wpwm-color-hex-input'),
  colorPopoverPreview:$('wpwm-color-popover-preview'),
  outputFilename:$('wpwm-output-filename'),
  applyIcon:$('wpwm-apply-icon'),applyLabel:$('wpwm-apply-label'),
  imgDropzone:$('wpwm-img-dropzone'),imgInput:$('wpwm-img-input'),
  imgPrevWrap:$('wpwm-img-preview-wrap'),imgThumb:$('wpwm-img-thumb'),
  removeImg:$('wpwm-remove-img'),imgSize:$('wpwm-img-size'),imgSizeVal:$('wpwm-img-size-val'),
  imgOpacity:$('wpwm-img-opacity'),imgOpVal:$('wpwm-img-opacity-val'),
  imgRotation:$('wpwm-img-rotation'),imgRotationVal:$('wpwm-img-rotation-val'),
  applyBtn:$('wpwm-apply-btn'),downloadBtn:$('wpwm-download-btn'),
  canvas:$('wpwm-canvas'),placeholder:$('wpwm-preview-placeholder'),
  pageInfo:$('wpwm-page-info'),prevPage:$('wpwm-prev-page'),nextPage:$('wpwm-next-page'),
};
const showLoader=()=>el.loader.classList.remove('wpwm-hidden');
const hideLoader=()=>el.loader.classList.add('wpwm-hidden');
function showError(msg){el.error.textContent=msg;el.error.classList.remove('wpwm-hidden');setTimeout(()=>el.error.classList.add('wpwm-hidden'),6000);}
function formatSize(b){if(b<1024)return b+' B';if(b<1048576)return(b/1024).toFixed(1)+' KB';return(b/1048576).toFixed(2)+' MB';}
function hexToRgb01(hex){return{r:parseInt(hex.slice(1,3),16)/255,g:parseInt(hex.slice(3,5),16)/255,b:parseInt(hex.slice(5,7),16)/255};}
function hexToRgb255(hex){return{r:parseInt(hex.slice(1,3),16),g:parseInt(hex.slice(3,5),16),b:parseInt(hex.slice(5,7),16)};}
function rgbToHex(r,g,b){
  function c(x){const n=Math.max(0,Math.min(255,Math.round(x)));const s=n.toString(16);return s.length===1?'0'+s:s;}
  return '#'+c(r)+c(g)+c(b);
}
function rgbToHsv(r,g,b){
  r/=255;g/=255;b/=255;
  const max=Math.max(r,g,b),min=Math.min(r,g,b);
  const d=max-min;
  let h=0;
  if(d!==0){
    if(max===r){h=((g-b)/d)%6;}
    else if(max===g){h=(b-r)/d+2;}
    else{h=(r-g)/d+4;}
    h*=60;
    if(h<0)h+=360;
  }
  const s=max===0?0:d/max;
  const v=max;
  return{h,s,v};
}
function hsvToRgb(h,s,v){
  const c=v*s;
  const x=c*(1-Math.abs((h/60)%2-1));
  const m=v-c;
  let r=0,g=0,b=0;
  if(h<60){r=c;g=x;b=0;}
  else if(h<120){r=x;g=c;b=0;}
  else if(h<180){r=0;g=c;b=x;}
  else if(h<240){r=0;g=x;b=c;}
  else if(h<300){r=x;g=0;b=c;}
  else{r=c;g=0;b=x;}
  return{r:(r+m)*255,g:(g+m)*255,b:(b+m)*255};
}
function getFontSettings(){
  let bold=false,italic=false;
  if(el.styleBoldBtn.classList.contains('wpwm-style-active'))bold=true;
  if(el.styleItalicBtn.classList.contains('wpwm-style-active'))italic=true;
  return{family:el.fontFamily.value,bold,italic};
}
function getFontFamilyCss(family){
  if(family==='times')return "'Times New Roman', Times, serif";
  if(family==='courier')return "'Courier New', Courier, monospace";
  return 'Helvetica, Arial, sans-serif';
}
function buildCanvasFont(fs){
  const s=getFontSettings();
  let str='';
  if(s.italic)str+='italic ';
  if(s.bold)str+='bold ';
  str+=fs+'px '+getFontFamilyCss(s.family);
  return str;
}
function getStandardFontKey(){
  const s=getFontSettings();
  if(s.family==='times'){
    if(s.bold){if(s.italic)return StandardFonts.TimesRomanBoldItalic;return StandardFonts.TimesRomanBold;}
    if(s.italic)return StandardFonts.TimesRomanItalic;
    return StandardFonts.TimesRoman;
  }
  if(s.family==='courier'){
    if(s.bold){if(s.italic)return StandardFonts.CourierBoldOblique;return StandardFonts.CourierBold;}
    if(s.italic)return StandardFonts.CourierOblique;
    return StandardFonts.Courier;
  }
  if(s.bold){if(s.italic)return StandardFonts.HelveticaBoldOblique;return StandardFonts.HelveticaBold;}
  if(s.italic)return StandardFonts.HelveticaOblique;
  return StandardFonts.Helvetica;
}
function parseColorInput(val){
  val=(val||'').trim();
  const rgbaMatch=val.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/i);
  if(rgbaMatch){
    const r=Math.max(0,Math.min(255,parseInt(rgbaMatch[1],10)));
    const g=Math.max(0,Math.min(255,parseInt(rgbaMatch[2],10)));
    const b=Math.max(0,Math.min(255,parseInt(rgbaMatch[3],10)));
    let a=null;
    if(rgbaMatch[4]!==undefined){a=Math.max(0,Math.min(1,parseFloat(rgbaMatch[4])));}
    return{r,g,b,a};
  }
  let hex=val;
  if(hex.charAt(0)!=='#')hex='#'+hex;
  if(/^#[0-9a-fA-F]{6}$/.test(hex)){
    const rgb=hexToRgb255(hex);
    return{r:rgb.r,g:rgb.g,b:rgb.b,a:null};
  }
  return null;
}
function sanitizeFilename(name){
  return name.replace(/[\\/:*?"<>|]+/g,'').trim();
}
function parsePageRangeString(str,totalPages){
  const pages=new Set();
  if(!str)return pages;
  const parts=str.split(',');
  parts.forEach(part=>{
    const trimmed=part.trim();
    if(!trimmed)return;
    if(trimmed.indexOf('-')!==-1){
      const bounds=trimmed.split('-');
      if(bounds.length===2){
        const a=parseInt(bounds[0],10);
        const b=parseInt(bounds[1],10);
        if(!isNaN(a)){
          if(!isNaN(b)){
            const lo=Math.max(1,Math.min(a,b));
            const hi=Math.min(totalPages,Math.max(a,b));
            for(let i=lo;i<=hi;i++){pages.add(i);}
          }
        }
      }
    }else{
      const n=parseInt(trimmed,10);
      if(!isNaN(n)){
        if(n>=1){
          if(n<=totalPages){pages.add(n);}
        }
      }
    }
  });
  return pages;
}
function getTargetPages(totalPages,currentPage){
  const mode=el.pageRangeMode.value;
  const arr=[];
  if(mode==='current'){
    arr.push(currentPage);
    return arr;
  }
  if(mode==='custom'){
    const set=parsePageRangeString(el.customRangeInput.value,totalPages);
    if(set.size===0){
      for(let i=1;i<=totalPages;i++){arr.push(i);}
      return arr;
    }
    return Array.from(set).sort((a,b)=>a-b);
  }
  if(mode==='odd'){
    for(let i=1;i<=totalPages;i++){if(i%2===1){arr.push(i);}}
    return arr;
  }
  if(mode==='even'){
    for(let i=1;i<=totalPages;i++){if(i%2===0){arr.push(i);}}
    return arr;
  }
  for(let i=1;i<=totalPages;i++){arr.push(i);}
  return arr;
}
function isCurrentPageTargeted(){
  const targets=getTargetPages(state.totalPages,state.currentPage);
  return targets.indexOf(state.currentPage)!==-1;
}
function calcPos(nx,ny,pw,ph,ww,wh,flipY){
  const pad=12;const uw=pw-ww-pad*2;const uh=ph-wh-pad*2;
  const ny2=flipY?(1-ny):ny;
  return{x:pad+nx*uw,y:pad+ny2*uh};
}
function getTilePositions(pw,ph,tw,th,pattern,nx,ny,flipY,renderScale){
  if(pattern==='single'){
    const pos=calcPos(nx,ny,pw,ph,tw,th,flipY);
    return[{x:pos.x+tw/2,y:pos.y+th/2}];
  }
  const scale=renderScale?renderScale:1;
  const spacingX=Math.max(parseInt(el.hSpacing.value,10)*scale,10);
  const spacingY=Math.max(parseInt(el.vSpacing.value,10)*scale,10);
  const positions=[];
  let row=0;
  for(let y=spacingY/2;y<ph+spacingY/2;y+=spacingY){
    const offsetX=pattern==='diagonal'?(row%2===1?spacingX/2:0):0;
    for(let x=spacingX/2-offsetX;x<pw+spacingX;x+=spacingX){
      if(x>-spacingX/4){if(x<pw+spacingX/4+pw)positions.push({x,y});}
    }
    row++;
  }
  return positions;
}
function textOriginForCenter(cx,cy,tw,th,rad){
  return{
    dx:cx-(tw/2)*Math.cos(rad)+(th/2)*Math.sin(rad),
    dy:cy-(tw/2)*Math.sin(rad)-(th/2)*Math.cos(rad)
  };
}
async function loadPDF(file){
  if(file.size>52428800){showError('File too large - max 50 MB.');return;}
  if(!file.type.includes('pdf')){if(!file.name.toLowerCase().endsWith('.pdf')){showError('Please upload a valid PDF.');return;}}
  showLoader();
  try{
    const buf=await file.arrayBuffer();
    state.pdfFile=file;state.pdfBytes=buf.slice(0);state.watermarkedBytes=null;
    state.pdfDoc=await PDFDocument.load(buf);
    state.totalPages=state.pdfDoc.getPageCount();state.currentPage=1;
    const u8=new Uint8Array(buf.slice(0));
    const doc=await pdfjsLib.getDocument({data:u8}).promise;
    state.pdfJsDoc=doc;state.originalPdfJsDoc=doc;
    state.basePageNum=null;
    el.fileName.textContent=file.name;el.fileSize.textContent=formatSize(file.size);
    el.filePages.textContent=state.totalPages+(state.totalPages===1?' page':' pages');
    el.outputFilename.value=file.name.replace(/\.pdf$/i,'')+'_watermarked';
    el.fileInfo.classList.remove('wpwm-hidden');el.mainPanel.classList.remove('wpwm-hidden');
    el.downloadBtn.classList.add('wpwm-hidden');el.root.classList.add('wpwm-file-loaded');
    scheduleLive();
  }catch(e){showError('Failed to load PDF: '+e.message);}
  finally{hideLoader();}
}
function scheduleLive(){if(!state.originalPdfJsDoc)return;if(_liveRafId)cancelAnimationFrame(_liveRafId);_liveRafId=requestAnimationFrame(()=>{_liveRafId=null;queueCanvasTask(drawLive);});}
async function renderBasePage(){
  const SCALE=1.5;
  const page=await state.originalPdfJsDoc.getPage(state.currentPage);
  const vp=page.getViewport({scale:SCALE});
  state.baseCanvas.width=vp.width;state.baseCanvas.height=vp.height;
  const bctx=state.baseCanvas.getContext('2d');
  if(state.baseRenderTask){try{state.baseRenderTask.cancel();}catch(e){}}
  state.baseRenderTask=page.render({canvasContext:bctx,viewport:vp});
  await state.baseRenderTask.promise;
  state.baseRenderTask=null;
  state.basePageNum=state.currentPage;
}
function drawSelectionBorder(ctx,cx,cy,w,h,rad){
  ctx.save();
  ctx.translate(cx,cy);
  ctx.rotate(-rad);
  ctx.strokeStyle='#2563eb';
  ctx.lineWidth=1.5;
  ctx.setLineDash([6,4]);
  ctx.strokeRect(-w/2-8,-h/2-8,w+16,h+16);
  ctx.restore();
}
async function drawLive(){
  if(!state.originalPdfJsDoc)return;
  try{
    if(state.basePageNum!==state.currentPage||!state.baseCanvas.width){
      await renderBasePage();
    }
    const vpWidth=state.baseCanvas.width,vpHeight=state.baseCanvas.height;
    if(el.canvas.width!==vpWidth||el.canvas.height!==vpHeight){
      el.canvas.width=vpWidth;el.canvas.height=vpHeight;
    }
    el.canvas.style.display='block';
    el.placeholder.classList.add('wpwm-hidden');
    const ctx=el.canvas.getContext('2d');
    ctx.clearRect(0,0,vpWidth,vpHeight);
    ctx.drawImage(state.baseCanvas,0,0);
    const pageTargeted=isCurrentPageTargeted();
    if(pageTargeted){
    if(state.activeTab==='text'){
      const text=el.wmText.value.trim()||'WATERMARK';
      const fs=parseInt(el.fontSize.value,10)*1.5;
      const op=parseInt(el.textOpacity.value,10)/100;
      const rot=parseInt(el.rotation.value,10);
      const{nx,ny}=state.textPos;
      ctx.save();ctx.globalAlpha=op;
      ctx.font=buildCanvasFont(fs);
      ctx.fillStyle=el.textColor.value;ctx.textBaseline='alphabetic';
      const tw=ctx.measureText(text).width;const th=fs*0.70;
      const rad=rot*Math.PI/180;
      const positions=getTilePositions(vpWidth,vpHeight,tw,th,state.pattern,nx,ny,false,1.5);
      positions.forEach(p=>{
        ctx.save();
        ctx.translate(p.x,p.y);
        ctx.rotate(-rad);
        ctx.fillText(text,-tw/2,th*0.85);
        ctx.restore();
      });
      ctx.restore();
      if(state.pattern==='single'){
        if(state.hoverActive||state.drag){
          drawSelectionBorder(ctx,positions[0].x,positions[0].y,tw,th,rad);
        }
      }
    }else if(state.activeTab==='image'){
      const im=state.watermarkImageEl;
      if(im){if(im.complete){if(im.naturalWidth>0){
        const sp=parseInt(el.imgSize.value,10)/100;
        const op=parseInt(el.imgOpacity.value,10)/100;
        const rot=parseInt(el.imgRotation.value,10);
        const{nx,ny}=state.imagePos;
        const iw=im.naturalWidth,ih=im.naturalHeight;
        const scale=sp*Math.min(vpWidth,vpHeight)/Math.max(iw,ih);
        const dw=iw*scale,dh=ih*scale;
        const pos=calcPos(nx,ny,vpWidth,vpHeight,dw,dh,false);
        const cx=pos.x+dw/2,cy=pos.y+dh/2;
        const rad=rot*Math.PI/180;
        ctx.save();
        ctx.globalAlpha=op;
        ctx.translate(cx,cy);
        ctx.rotate(-rad);
        ctx.drawImage(im,-dw/2,-dh/2,dw,dh);
        ctx.restore();
        if(state.hoverActive||state.drag){
          drawSelectionBorder(ctx,cx,cy,dw,dh,rad);
        }
      }}}
    }
    }
    el.pageInfo.textContent='Page '+state.currentPage+' / '+state.totalPages;
  }catch(e){console.warn('live preview:',e);}
}
async function renderPage(n){
  return queueCanvasTask(()=>renderPageInner(n));
}
async function renderPageInner(n){
  try{
    const page=await state.pdfJsDoc.getPage(n);const vp=page.getViewport({scale:1.5});
    el.canvas.width=vp.width;el.canvas.height=vp.height;el.canvas.style.display='block';
    el.placeholder.classList.add('wpwm-hidden');
    if(state.renderTask){try{state.renderTask.cancel();}catch(e){}}
    state.renderTask=page.render({canvasContext:el.canvas.getContext('2d'),viewport:vp});
    await state.renderTask.promise;
    state.renderTask=null;
    el.pageInfo.textContent='Page '+n+' / '+state.totalPages;
  }catch(e){if(e){if(e.name!=='RenderingCancelledException')showError('Preview failed: '+e.message);}}
}
async function applyText(){
  const text=el.wmText.value.trim()||'WATERMARK';
  const fs=parseInt(el.fontSize.value,10);const op=parseInt(el.textOpacity.value,10)/100;
  const rot=parseInt(el.rotation.value,10);const{r,g,b}=hexToRgb01(el.textColor.value);
  const{nx,ny}=state.textPos;
  const doc=await PDFDocument.load(state.pdfBytes.slice(0));
  const font=await doc.embedFont(getStandardFontKey());
  const rad=rot*Math.PI/180;
  const totalPages=doc.getPageCount();
  const targetPages=getTargetPages(totalPages,state.currentPage);
  targetPages.forEach(pageNum=>{
    const page=doc.getPage(pageNum-1);
    const{width,height}=page.getSize();const tw=font.widthOfTextAtSize(text,fs);const th=fs*0.72;
    const positions=getTilePositions(width,height,tw,th,state.pattern,nx,ny,true,1);
    positions.forEach(p=>{
      const{dx,dy}=textOriginForCenter(p.x,p.y,tw,th,rad);
      page.drawText(text,{x:dx,y:dy,size:fs,font,color:rgb(r,g,b),opacity:op,rotate:degrees(rot)});
    });
  });
  return await doc.save();
}
async function applyImage(){
  if(!state.watermarkImageData){showError('Please upload a watermark image first.');return null;}
  const sp=parseInt(el.imgSize.value,10)/100;const op=parseInt(el.imgOpacity.value,10)/100;
  const rot=parseInt(el.imgRotation.value,10);
  const{nx,ny}=state.imagePos;
  const doc=await PDFDocument.load(state.pdfBytes.slice(0));
  const dataUrl=state.watermarkImageData;const b64=dataUrl.split(',')[1];
  const bin=atob(b64);const bytes=new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
  let img;
  try{img=dataUrl.includes('image/png')||dataUrl.includes('image/svg')?await doc.embedPng(bytes):await doc.embedJpg(bytes);}
  catch(e1){try{img=await doc.embedPng(bytes);}catch(e2){showError('Cannot embed image - use PNG or JPG.');return null;}}
  const rad=rot*Math.PI/180;
  const totalPages=doc.getPageCount();
  const targetPages=getTargetPages(totalPages,state.currentPage);
  targetPages.forEach(pageNum=>{
    const page=doc.getPage(pageNum-1);
    const{width,height}=page.getSize();
    const d=img.scale(sp*Math.min(width,height)/Math.max(img.width,img.height));
    const pos=calcPos(nx,ny,width,height,d.width,d.height,true);
    const cx=pos.x+d.width/2,cy=pos.y+d.height/2;
    const{dx,dy}=textOriginForCenter(cx,cy,d.width,d.height,rad);
    page.drawImage(img,{x:dx,y:dy,width:d.width,height:d.height,opacity:op,rotate:degrees(rot)});
  });
  return await doc.save();
}
function resetApplyButton(){
  el.applyBtn.disabled=false;
  el.applyLabel.textContent='Apply Watermark';
  el.applyIcon.classList.remove('wpwm-spin');
  el.applyIcon.innerHTML='<polyline points="20 6 9 17 4 12"></polyline>';
}
async function handleApply(){
  if(!state.pdfBytes)return;
  if(el.applyBtn.disabled)return;
  state.hoverActive=false;state.drag=null;
  el.applyBtn.disabled=true;
  el.applyLabel.textContent='Applying...';
  el.applyIcon.innerHTML='<line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>';
  el.applyIcon.classList.add('wpwm-spin');
  showLoader();el.downloadBtn.classList.add('wpwm-hidden');
  try{
    const bytes=state.activeTab==='text'?await applyText():await applyImage();
    if(!bytes){hideLoader();resetApplyButton();return;}
    state.watermarkedBytes=bytes;
    state.pdfJsDoc=await pdfjsLib.getDocument({data:new Uint8Array(bytes)}).promise;
    state.totalPages=state.pdfJsDoc.numPages;
    el.filePages.textContent=state.totalPages+(state.totalPages===1?' page':' pages');
    await renderPage(state.currentPage);el.downloadBtn.classList.remove('wpwm-hidden');
  }catch(e){showError('Failed to apply watermark: '+e.message);}
  finally{hideLoader();resetApplyButton();}
}
function handleDownload(){
  if(!state.watermarkedBytes)return;
  const blob=new Blob([state.watermarkedBytes],{type:'application/pdf'});
  const url=URL.createObjectURL(blob);const a=document.createElement('a');
  let name=sanitizeFilename(el.outputFilename.value);
  if(!name){
    name=state.pdfFile?state.pdfFile.name.replace(/\.pdf$/i,'')+'_watermarked':'document_watermarked';
  }
  if(!/\.pdf$/i.test(name))name+='.pdf';
  a.href=url;a.download=name;document.body.appendChild(a);a.click();
  document.body.removeChild(a);URL.revokeObjectURL(url);
}
function updateSliderFill(input,bipolar){
  const min=parseFloat(input.min);
  const max=parseFloat(input.max);
  const val=parseFloat(input.value);
  const pct=(val-min)/(max-min)*100;
  if(bipolar){
    const centerPct=(0-min)/(max-min)*100;
    const lo=Math.min(centerPct,pct);
    const hi=Math.max(centerPct,pct);
    input.style.background='linear-gradient(to right, #e2e8f0 0%, #e2e8f0 '+lo+'%, #2563eb '+lo+'%, #2563eb '+hi+'%, #e2e8f0 '+hi+'%, #e2e8f0 100%)';
  }else{
    input.style.background='linear-gradient(to right, #2563eb 0%, #2563eb '+pct+'%, #e2e8f0 '+pct+'%, #e2e8f0 100%)';
  }
}
function syncRange(inp,disp,cb,bipolar){
  updateSliderFill(inp,bipolar);
  inp.addEventListener('input',()=>{if(disp)disp.textContent=inp.value;updateSliderFill(inp,bipolar);if(cb)cb();});
}
function canvasPointFromEvent(evt){
  const rect=el.canvas.getBoundingClientRect();
  let clientX,clientY;
  if(evt.touches){if(evt.touches.length>0){clientX=evt.touches[0].clientX;clientY=evt.touches[0].clientY;}}
  if(clientX===undefined){clientX=evt.clientX;clientY=evt.clientY;}
  const scaleX=el.canvas.width/rect.width;
  const scaleY=el.canvas.height/rect.height;
  return{x:(clientX-rect.left)*scaleX,y:(clientY-rect.top)*scaleY};
}
function getActiveDragBox(){
  if(!state.baseCanvas.width)return null;
  if(!isCurrentPageTargeted())return null;
  const vpWidth=state.baseCanvas.width,vpHeight=state.baseCanvas.height;
  if(state.activeTab==='text'){
    if(state.pattern!=='single')return null;
    const text=el.wmText.value.trim()||'WATERMARK';
    const fs=parseInt(el.fontSize.value,10)*1.5;
    const mctx=el.canvas.getContext('2d');
    mctx.font=buildCanvasFont(fs);
    const tw=mctx.measureText(text).width;const th=fs*0.70;
    const rot=parseInt(el.rotation.value,10);
    const pos=calcPos(state.textPos.nx,state.textPos.ny,vpWidth,vpHeight,tw,th,false);
    return{cx:pos.x+tw/2,cy:pos.y+th/2,w:tw,h:th,rad:rot*Math.PI/180,type:'text'};
  }
  const im=state.watermarkImageEl;
  if(!im)return null;
  if(!im.complete)return null;
  if(!im.naturalWidth)return null;
  const sp=parseInt(el.imgSize.value,10)/100;
  const iw=im.naturalWidth,ih=im.naturalHeight;
  const scale=sp*Math.min(vpWidth,vpHeight)/Math.max(iw,ih);
  const dw=iw*scale,dh=ih*scale;
  const rot=parseInt(el.imgRotation.value,10);
  const pos=calcPos(state.imagePos.nx,state.imagePos.ny,vpWidth,vpHeight,dw,dh,false);
  return{cx:pos.x+dw/2,cy:pos.y+dh/2,w:dw,h:dh,rad:rot*Math.PI/180,type:'image'};
}
function hitTestBox(px,py,box){
  if(!box)return false;
  const pad=20;
  const dx=px-box.cx,dy=py-box.cy;
  const lx=dx*Math.cos(box.rad)-dy*Math.sin(box.rad);
  const ly=dx*Math.sin(box.rad)+dy*Math.cos(box.rad);
  if(Math.abs(lx)>box.w/2+pad)return false;
  if(Math.abs(ly)>box.h/2+pad)return false;
  return true;
}
let colorPopoverHue=0,colorPopoverSat=0,colorPopoverVal=0;
function positionColorPopover(){
  const rect=el.colorPickerTrigger.getBoundingClientRect();
  const popW=200,popH=200;
  let left=rect.left;
  let top=rect.bottom+8;
  const vw=window.innerWidth,vh=window.innerHeight;
  if(left+popW>vw-8)left=vw-popW-8;
  if(left<8)left=8;
  if(top+popH>vh-8)top=rect.top-popH-8;
  if(top<8)top=8;
  el.colorPopover.style.left=left+'px';
  el.colorPopover.style.top=top+'px';
}
function applyColorPopoverColor(hex){
  el.textColor.value=hex;
  el.colorPopoverPreview.style.background=hex;
  el.svBox.style.background='linear-gradient(to top, #000, rgba(0,0,0,0)), linear-gradient(to right, #fff, rgba(255,255,255,0)), hsl('+colorPopoverHue+',100%,50%)';
  el.svHandle.style.left=(colorPopoverSat*100)+'%';
  el.svHandle.style.top=((1-colorPopoverVal)*100)+'%';
  el.hueSlider.value=colorPopoverHue;
  document.querySelectorAll('.wpwm-swatch').forEach(s=>s.classList.remove('wpwm-swatch-active'));
  scheduleLive();
}
function updateColorPopoverUI(){
  const rgb=hsvToRgb(colorPopoverHue,colorPopoverSat,colorPopoverVal);
  const hex=rgbToHex(rgb.r,rgb.g,rgb.b);
  el.colorHexInput.value=hex;
  applyColorPopoverColor(hex);
}
function updateColorPopoverUIPreserveInput(){
  const rgb=hsvToRgb(colorPopoverHue,colorPopoverSat,colorPopoverVal);
  const hex=rgbToHex(rgb.r,rgb.g,rgb.b);
  applyColorPopoverColor(hex);
}
function openColorPopover(){
  const rgb=hexToRgb255(el.textColor.value);
  const hsv=rgbToHsv(rgb.r,rgb.g,rgb.b);
  colorPopoverHue=hsv.h;colorPopoverSat=hsv.s;colorPopoverVal=hsv.v;
  el.colorHexInput.value=el.textColor.value;
  el.colorPopoverPreview.style.background=el.textColor.value;
  el.svBox.style.background='linear-gradient(to top, #000, rgba(0,0,0,0)), linear-gradient(to right, #fff, rgba(255,255,255,0)), hsl('+colorPopoverHue+',100%,50%)';
  el.svHandle.style.left=(colorPopoverSat*100)+'%';
  el.svHandle.style.top=((1-colorPopoverVal)*100)+'%';
  el.hueSlider.value=colorPopoverHue;
  el.colorPopover.classList.remove('wpwm-hidden');
  positionColorPopover();
}
function closeColorPopover(){
  el.colorPopover.classList.add('wpwm-hidden');
}
function isColorPopoverOpen(){
  return!el.colorPopover.classList.contains('wpwm-hidden');
}
let svDragging=false;
function svPointFromEvent(evt){
  const rect=el.svBox.getBoundingClientRect();
  let clientX,clientY;
  if(evt.touches){if(evt.touches.length>0){clientX=evt.touches[0].clientX;clientY=evt.touches[0].clientY;}}
  if(clientX===undefined){clientX=evt.clientX;clientY=evt.clientY;}
  let x=(clientX-rect.left)/rect.width;
  let y=(clientY-rect.top)/rect.height;
  if(x<0)x=0;if(x>1)x=1;
  if(y<0)y=0;if(y>1)y=1;
  return{x,y};
}
function setupColorPopover(){
  el.colorPickerTrigger.addEventListener('click',e=>{
    e.stopPropagation();
    if(isColorPopoverOpen()){closeColorPopover();}
    else{openColorPopover();}
  });
  el.colorPickerTrigger.addEventListener('keydown',e=>{
    if(e.key==='Enter'){e.preventDefault();openColorPopover();}
    if(e.key===' '){e.preventDefault();openColorPopover();}
  });
  el.svBox.addEventListener('mousedown',e=>{
    e.preventDefault();svDragging=true;
    const p=svPointFromEvent(e);colorPopoverSat=p.x;colorPopoverVal=1-p.y;updateColorPopoverUI();
  });
  document.addEventListener('mousemove',e=>{
    if(svDragging){const p=svPointFromEvent(e);colorPopoverSat=p.x;colorPopoverVal=1-p.y;updateColorPopoverUI();}
  });
  document.addEventListener('mouseup',()=>{svDragging=false;});
  el.svBox.addEventListener('touchstart',e=>{
    e.preventDefault();svDragging=true;
    const p=svPointFromEvent(e);colorPopoverSat=p.x;colorPopoverVal=1-p.y;updateColorPopoverUI();
  },{passive:false});
  el.svBox.addEventListener('touchmove',e=>{
    e.preventDefault();
    if(svDragging){const p=svPointFromEvent(e);colorPopoverSat=p.x;colorPopoverVal=1-p.y;updateColorPopoverUI();}
  },{passive:false});
  el.svBox.addEventListener('touchend',()=>{svDragging=false;});
  el.hueSlider.addEventListener('input',()=>{
    colorPopoverHue=parseFloat(el.hueSlider.value);updateColorPopoverUI();
  });
  el.colorHexInput.addEventListener('input',()=>{
    const parsed=parseColorInput(el.colorHexInput.value);
    if(parsed){
      const hsv=rgbToHsv(parsed.r,parsed.g,parsed.b);
      colorPopoverHue=hsv.h;colorPopoverSat=hsv.s;colorPopoverVal=hsv.v;
      if(parsed.a!==null){
        const pct=Math.round(parsed.a*100);
        el.textOpacity.value=pct;
        el.textOpVal.textContent=pct;
        updateSliderFill(el.textOpacity);
      }
      updateColorPopoverUIPreserveInput();
      scheduleLive();
    }
  });
  document.addEventListener('click',e=>{
    if(isColorPopoverOpen()){
      if(!el.colorPopover.contains(e.target)){
        if(!el.colorPickerTrigger.contains(e.target)){closeColorPopover();}
      }
    }
  });
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'){closeColorPopover();}
  });
  window.addEventListener('resize',()=>{if(isColorPopoverOpen())positionColorPopover();});
}
function setupCanvasDrag(){
  function down(evt){
    if(!state.baseCanvas.width)return;
    const pt=canvasPointFromEvent(evt);
    const box=getActiveDragBox();
    if(!hitTestBox(pt.x,pt.y,box))return;
    evt.preventDefault();
    state.drag={type:box.type,grabDX:pt.x-box.cx,grabDY:pt.y-box.cy,w:box.w,h:box.h};
    state.hoverActive=true;
    el.canvas.style.cursor='grabbing';
    scheduleLive();
  }
  function move(evt){
    if(state.drag){
      evt.preventDefault();
      const pt=canvasPointFromEvent(evt);
      const vpWidth=state.baseCanvas.width,vpHeight=state.baseCanvas.height;
      const cx=pt.x-state.drag.grabDX,cy=pt.y-state.drag.grabDY;
      const pad=12;
      const uw=vpWidth-state.drag.w-pad*2;
      const uh=vpHeight-state.drag.h-pad*2;
      const x=cx-state.drag.w/2,y=cy-state.drag.h/2;
      const nx=uw?(x-pad)/uw:0;
      const ny=uh?(y-pad)/uh:0;
      if(state.drag.type==='text'){state.textPos={nx,ny};}
      else{state.imagePos={nx,ny};}
      scheduleLive();
      return;
    }
    const pt=canvasPointFromEvent(evt);
    const box=getActiveDragBox();
    const hit=hitTestBox(pt.x,pt.y,box);
    el.canvas.style.cursor=hit?'grab':'default';
    if(hit!==state.hoverActive){
      state.hoverActive=hit;
      scheduleLive();
    }
  }
  function up(){
    if(state.drag){
      state.drag=null;
      state.hoverActive=false;
      el.canvas.style.cursor='default';
      scheduleLive();
    }
  }
  el.canvas.addEventListener('mousedown',down);
  document.addEventListener('mousemove',move);
  document.addEventListener('mouseup',up);
  el.canvas.addEventListener('mouseleave',()=>{
    if(!state.drag){
      if(state.hoverActive){state.hoverActive=false;scheduleLive();}
      el.canvas.style.cursor='default';
    }
  });
  el.canvas.addEventListener('touchstart',down,{passive:false});
  el.canvas.addEventListener('touchmove',move,{passive:false});
  el.canvas.addEventListener('touchend',up);
  el.canvas.addEventListener('touchcancel',up);
}
function refreshPreview(){
  if(state.watermarkedBytes){renderPage(state.currentPage);}
  else{scheduleLive();}
}
function switchTab(tab){
  state.activeTab=tab;
  state.hoverActive=false;state.drag=null;
  if(tab==='text'){el.tabText.classList.add('wpwm-tab-active');el.tabImage.classList.remove('wpwm-tab-active');el.textOptions.classList.remove('wpwm-hidden');el.imageOptions.classList.add('wpwm-hidden');}
  else{el.tabImage.classList.add('wpwm-tab-active');el.tabText.classList.remove('wpwm-tab-active');el.imageOptions.classList.remove('wpwm-hidden');el.textOptions.classList.add('wpwm-hidden');}
  refreshPreview();
}
function handleWmImage(file){
  if(!file||!file.type.startsWith('image/')){showError('Please upload PNG or JPG.');return;}
  const reader=new FileReader();
  reader.onload=e=>{
    state.watermarkImageData=e.target.result;
    el.imgThumb.src=e.target.result;
    el.imgPrevWrap.classList.remove('wpwm-hidden');
    el.imgDropzone.style.display='none';
    const im=new Image();
    im.onload=()=>{state.watermarkImageEl=im;scheduleLive();};
    im.onerror=()=>{showError('Failed to load image.');};
    im.src=e.target.result;
  };
  reader.onerror=()=>{showError('Failed to read image file.');};
  reader.readAsDataURL(file);
}
function goPrev(){if(state.currentPage<=1)return;state.currentPage--;refreshPreview();}
function goNext(){if(state.currentPage>=state.totalPages)return;state.currentPage++;refreshPreview();}
function init(){
  el.dropzone.addEventListener('dragover',e=>{e.preventDefault();el.dropzone.classList.add('wpwm-drag-over');});
  el.dropzone.addEventListener('dragleave',()=>el.dropzone.classList.remove('wpwm-drag-over'));
  el.dropzone.addEventListener('drop',e=>{e.preventDefault();el.dropzone.classList.remove('wpwm-drag-over');const f=e.dataTransfer.files[0];if(f)loadPDF(f);});
  el.dropzone.addEventListener('click',e=>{if(e.target.tagName!=='BUTTON')el.fileInput.click();});
  el.dropzone.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')el.fileInput.click();});
  el.fileInput.addEventListener('change',e=>{if(e.target.files[0])loadPDF(e.target.files[0]);});
  el.removeFile.addEventListener('click',()=>{
    state.pdfFile=state.pdfBytes=state.pdfDoc=state.pdfJsDoc=state.originalPdfJsDoc=state.watermarkedBytes=null;
    state.basePageNum=null;state.drag=null;state.hoverActive=false;
    el.outputFilename.value='';
    closeColorPopover();
    el.root.classList.remove('wpwm-file-loaded');el.fileInfo.classList.add('wpwm-hidden');
    el.mainPanel.classList.add('wpwm-hidden');el.downloadBtn.classList.add('wpwm-hidden');
    el.fileInput.value='';el.canvas.style.display='none';el.placeholder.classList.remove('wpwm-hidden');
  });
  el.tabText.addEventListener('click',()=>switchTab('text'));
  el.tabImage.addEventListener('click',()=>switchTab('image'));
  document.querySelectorAll('.wpwm-pattern-btn').forEach(btn=>{
    btn.addEventListener('click',()=>{
      document.querySelectorAll('.wpwm-pattern-btn').forEach(b=>b.classList.remove('wpwm-pattern-active'));
      btn.classList.add('wpwm-pattern-active');
      state.pattern=btn.dataset.pattern;
      const isSingle=state.pattern==='single';
      el.tileSpacingField.classList.toggle('wpwm-hidden',isSingle);
      const curFontSize=parseInt(el.fontSize.value,10);
      if(isSingle){
        if(curFontSize===30){el.fontSize.value=48;el.fontSizeVal.textContent='48';updateSliderFill(el.fontSize);}
      }else{
        if(curFontSize===48){el.fontSize.value=30;el.fontSizeVal.textContent='30';updateSliderFill(el.fontSize);}
      }
      scheduleLive();
    });
  });
  el.pageRangeMode.addEventListener('change',()=>{
    el.customRangeField.classList.toggle('wpwm-hidden',el.pageRangeMode.value!=='custom');
    scheduleLive();
  });
  el.customRangeInput.addEventListener('input',scheduleLive);
  document.querySelectorAll('.wpwm-suggest-chip').forEach(chip=>{
    chip.addEventListener('click',()=>{el.wmText.value=chip.dataset.text;scheduleLive();});
  });
  document.querySelectorAll('.wpwm-swatch').forEach(sw=>{
    sw.addEventListener('click',()=>{
      const c=sw.dataset.color;el.textColor.value=c;
      closeColorPopover();
      document.querySelectorAll('.wpwm-swatch').forEach(s=>s.classList.remove('wpwm-swatch-active'));
      sw.classList.add('wpwm-swatch-active');scheduleLive();
    });
  });
  syncRange(el.fontSize,el.fontSizeVal,scheduleLive);
  syncRange(el.textOpacity,el.textOpVal,scheduleLive);
  syncRange(el.rotation,el.rotationVal,scheduleLive,true);
  syncRange(el.hSpacing,el.hSpacingVal,scheduleLive);
  syncRange(el.vSpacing,el.vSpacingVal,scheduleLive);
  syncRange(el.imgSize,el.imgSizeVal,scheduleLive);
  syncRange(el.imgOpacity,el.imgOpVal,scheduleLive);
  syncRange(el.imgRotation,el.imgRotationVal,scheduleLive,true);
  el.wmText.addEventListener('input',scheduleLive);
  el.textColor.addEventListener('input',()=>{
    document.querySelectorAll('.wpwm-swatch').forEach(s=>s.classList.remove('wpwm-swatch-active'));
    scheduleLive();
  });
  el.fontFamily.addEventListener('change',scheduleLive);
  [el.styleBoldBtn,el.styleItalicBtn].forEach(btn=>{
    btn.addEventListener('click',()=>{
      btn.classList.toggle('wpwm-style-active');
      scheduleLive();
    });
  });
  setupColorPopover();
  setupCanvasDrag();
  el.imgDropzone.addEventListener('click',()=>el.imgInput.click());
  el.imgDropzone.addEventListener('dragover',e=>{e.preventDefault();el.imgDropzone.classList.add('wpwm-drag-over');});
  el.imgDropzone.addEventListener('dragleave',()=>el.imgDropzone.classList.remove('wpwm-drag-over'));
  el.imgDropzone.addEventListener('drop',e=>{e.preventDefault();el.imgDropzone.classList.remove('wpwm-drag-over');if(e.dataTransfer.files[0])handleWmImage(e.dataTransfer.files[0]);});
  el.imgInput.addEventListener('change',e=>{if(e.target.files[0])handleWmImage(e.target.files[0]);});
  el.removeImg.addEventListener('click',()=>{
    state.watermarkImageData=null;state.watermarkImageEl=null;
    el.imgThumb.src='';el.imgPrevWrap.classList.add('wpwm-hidden');el.imgDropzone.style.display='';el.imgInput.value='';
    scheduleLive();
  });
  el.applyBtn.addEventListener('click',handleApply);
  el.downloadBtn.addEventListener('click',handleDownload);
  el.prevPage.addEventListener('click',goPrev);
  el.nextPage.addEventListener('click',goNext);
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();
