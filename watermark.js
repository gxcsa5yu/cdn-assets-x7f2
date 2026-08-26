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
};
let _liveRafId=null;
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
  hSpacing:$('wpwm-h-spacing'),hSpacingVal:$('wpwm-h-spacing-val'),
  vSpacing:$('wpwm-v-spacing'),vSpacingVal:$('wpwm-v-spacing-val'),
  wmText:$('wpwm-wm-text'),fontSize:$('wpwm-font-size'),fontSizeVal:$('wpwm-font-size-val'),
  textOpacity:$('wpwm-text-opacity'),textOpVal:$('wpwm-text-opacity-val'),
  rotation:$('wpwm-rotation'),rotationVal:$('wpwm-rotation-val'),
  textColor:$('wpwm-text-color'),
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
    el.fileInfo.classList.remove('wpwm-hidden');el.mainPanel.classList.remove('wpwm-hidden');
    el.downloadBtn.classList.add('wpwm-hidden');el.root.classList.add('wpwm-file-loaded');
    scheduleLive();
  }catch(e){showError('Failed to load PDF: '+e.message);}
  finally{hideLoader();}
}
function scheduleLive(){if(!state.originalPdfJsDoc)return;if(_liveRafId)cancelAnimationFrame(_liveRafId);_liveRafId=requestAnimationFrame(drawLive);}
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
async function drawLive(){
  _liveRafId=null;if(!state.originalPdfJsDoc||state.liveRendering)return;state.liveRendering=true;
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
    if(state.activeTab==='text'){
      const text=el.wmText.value.trim()||'WATERMARK';
      const fs=parseInt(el.fontSize.value,10)*1.5;
      const op=parseInt(el.textOpacity.value,10)/100;
      const rot=parseInt(el.rotation.value,10);
      const{nx,ny}=state.textPos;
      ctx.save();ctx.globalAlpha=op;
      ctx.font='bold '+fs+'px Inter,-apple-system,Helvetica,sans-serif';
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
      }}}
    }
    el.pageInfo.textContent='Page '+state.currentPage+' / '+state.totalPages;
  }catch(e){console.warn('live preview:',e);}
  finally{state.liveRendering=false;}
}
async function renderPage(n){
  if(state.rendering)return;state.rendering=true;
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
  finally{state.rendering=false;}
}
async function applyText(){
  const text=el.wmText.value.trim()||'WATERMARK';
  const fs=parseInt(el.fontSize.value,10);const op=parseInt(el.textOpacity.value,10)/100;
  const rot=parseInt(el.rotation.value,10);const{r,g,b}=hexToRgb01(el.textColor.value);
  const{nx,ny}=state.textPos;
  const doc=await PDFDocument.load(state.pdfBytes.slice(0));
  const font=await doc.embedFont(StandardFonts.HelveticaBold);
  const rad=rot*Math.PI/180;
  doc.getPages().forEach(page=>{
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
  for(const page of doc.getPages()){
    const{width,height}=page.getSize();
    const d=img.scale(sp*Math.min(width,height)/Math.max(img.width,img.height));
    const pos=calcPos(nx,ny,width,height,d.width,d.height,true);
    const cx=pos.x+d.width/2,cy=pos.y+d.height/2;
    const{dx,dy}=textOriginForCenter(cx,cy,d.width,d.height,rad);
    page.drawImage(img,{x:dx,y:dy,width:d.width,height:d.height,opacity:op,rotate:degrees(rot)});
  }
  return await doc.save();
}
async function handleApply(){
  if(!state.pdfBytes)return;showLoader();el.downloadBtn.classList.add('wpwm-hidden');
  try{
    const bytes=state.activeTab==='text'?await applyText():await applyImage();
    if(!bytes){hideLoader();return;}
    state.watermarkedBytes=bytes;
    state.pdfJsDoc=await pdfjsLib.getDocument({data:new Uint8Array(bytes)}).promise;
    state.totalPages=state.pdfJsDoc.numPages;
    el.filePages.textContent=state.totalPages+(state.totalPages===1?' page':' pages');
    await renderPage(state.currentPage);el.downloadBtn.classList.remove('wpwm-hidden');
  }catch(e){showError('Failed to apply watermark: '+e.message);}
  finally{hideLoader();}
}
function handleDownload(){
  if(!state.watermarkedBytes)return;
  const blob=new Blob([state.watermarkedBytes],{type:'application/pdf'});
  const url=URL.createObjectURL(blob);const a=document.createElement('a');
  const name=state.pdfFile?state.pdfFile.name.replace(/\.pdf$/i,''):'document';
  a.href=url;a.download=name+'_watermarked.pdf';document.body.appendChild(a);a.click();
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
  const vpWidth=state.baseCanvas.width,vpHeight=state.baseCanvas.height;
  if(state.activeTab==='text'){
    if(state.pattern!=='single')return null;
    const text=el.wmText.value.trim()||'WATERMARK';
    const fs=parseInt(el.fontSize.value,10)*1.5;
    const mctx=el.canvas.getContext('2d');
    mctx.font='bold '+fs+'px Inter,-apple-system,Helvetica,sans-serif';
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
function setupCanvasDrag(){
  function down(evt){
    if(!state.baseCanvas.width)return;
    const pt=canvasPointFromEvent(evt);
    const box=getActiveDragBox();
    if(!hitTestBox(pt.x,pt.y,box))return;
    evt.preventDefault();
    state.drag={type:box.type,grabDX:pt.x-box.cx,grabDY:pt.y-box.cy,w:box.w,h:box.h};
    el.canvas.style.cursor='grabbing';
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
    el.canvas.style.cursor=hitTestBox(pt.x,pt.y,box)?'grab':'default';
  }
  function up(){
    if(state.drag){state.drag=null;el.canvas.style.cursor='default';}
  }
  el.canvas.addEventListener('mousedown',down);
  document.addEventListener('mousemove',move);
  document.addEventListener('mouseup',up);
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
    state.basePageNum=null;state.drag=null;
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
  document.querySelectorAll('.wpwm-suggest-chip').forEach(chip=>{
    chip.addEventListener('click',()=>{el.wmText.value=chip.dataset.text;scheduleLive();});
  });
  document.querySelectorAll('.wpwm-swatch').forEach(sw=>{
    sw.addEventListener('click',()=>{
      const c=sw.dataset.color;el.textColor.value=c;
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
