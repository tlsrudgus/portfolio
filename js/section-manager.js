/* 포토샵 · 일러스트레이터 관리자 — 기존 HTML 작품은 보존 */
(() => {
  'use strict';
  const root = document.querySelector('[data-section-manager]');
  if (!root) return;
  const page = root.dataset.sectionManager;
  const CONFIG = {
    photoshop: { data: 'data/photoshop-sections.json', categories: ['thumbnail', 'poster', 'comp'] },
    illustrator: { data: 'data/illustrator-sections.json', categories: ['logo', 'character'] }
  }[page];
  if (!CONFIG) return;
  const ADMIN_PASSWORD = '1234'; // 우발적인 진입 방지용. 원하는 비밀번호로 변경.
  const DEFAULT_OWNER = 'tlsrudgus';
  const DEFAULT_REPO = 'portfolio';
  const DEFAULT_BRANCH = 'main';
  const main = root;
  const modal = document.getElementById('modal');
  const originalSections = new Map(CONFIG.categories.map(cat => [cat, root.querySelector('section.' + cat)]));
  const originalCount = new Map(CONFIG.categories.map(cat => [cat, originalSections.get(cat)?.querySelectorAll('.box-group > .box').length || 0]));
  let loggedIn = false;
  let model = { sections: [] };
  let currentSection = null;
  let editingItem = null;
  let editingSection = null;
  let working = false;
  const lastSaves = new Map();
  const el = (tag, cls, text) => {const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node;};
  const uuid=()=>crypto.randomUUID?.() || ('p-'+Date.now()+'-'+Math.random().toString(36).slice(2));
  const safeUrl = text => {try {const parsed=new URL(text,location.href);return ['https:','http:'].includes(parsed.protocol)?parsed.href:'';}catch{return '';}};
  const escapeSelector = value => CSS.escape(value);
  const savedData = ()=>structuredClone(model);
  const safeModel = obj => ({sections: Array.isArray(obj?.sections)?obj.sections.filter(x=>x && typeof x.id==='string' && Array.isArray(x.items)):[]});
  function getSection(id) {return model.sections.find(s=>s.id===id);}
  function ensureSection(id) {let s=getSection(id); if(!s){s={id,title:'',items:[]};model.sections.push(s);} return s;}
  function sectionNode(id) {return originalSections.get(id) || root.querySelector('section[data-custom-section="'+escapeSelector(id)+'"]');}
  function button(label, cls, fn) {const b=el('button',cls,label);b.type='button';b.addEventListener('click',fn);return b;}
  function createAddedCard(item, sectionId, noPreview) {
    const card=el('div','box sm-new-item');card.dataset.itemId=item.id;
    const title=el('h2','',item.title);card.append(title);
    const pic=el('img','sm-thumb');pic.src=safeUrl(item.thumb);pic.alt=item.title;pic.loading='lazy';
    // Photoshop 일반 썸네일 영역은 기존 동작을 유지: 이미지 확대 없음
    if(!noPreview){pic.tabIndex=0;pic.setAttribute('role','button');pic.addEventListener('click',()=>openPreview(item.image,item.title));pic.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openPreview(item.image,item.title);}});}
    card.append(pic);
    if(!noPreview && page==='photoshop')card.append(el('p','','클릭하여 원본 소스 보기'));
    const tools=el('div','sm-item-actions');
    tools.append(button('수정','',()=>openItem(sectionId,item.id)),button('삭제','sm-danger',()=>removeItem(sectionId,item.id)));
    card.append(tools);
    return card;
  }
  function openPreview(image,title){
    if(!modal)return;
    const view=modal.querySelector('img');if(!view)return;
    const uri=safeUrl(image);if(!uri)return;
    view.src=uri;view.alt=title;modal.style.display='block';
  }
  function sectionAddCard(sectionId){
    const add=el('div','box sm-add-card');
    add.append(button('＋\n작품 추가','sm-add-button',()=>openItem(sectionId,null)));
    return add;
  }
  function createCustomSection(section){
    const container=el('section','sm-custom-section');container.dataset.customSection=section.id;
    const inside=el('div','container');
    const heading=el('h1','',section.title);
    const actions=el('div','sm-section-actions');
    actions.append(button('구역 이름 수정','',()=>openSection(section.id)),button('구역 삭제','sm-danger',()=>removeSection(section.id)));
    const gallery=el('div','box-group');
    inside.append(heading,actions,gallery);container.append(inside);
    return container;
  }
  const footer=el('div','sm-footer');
  footer.append(button('＋ 새 구역 추가','sm-new-section-button',()=>openSection(null)));
  main.append(footer);
  const exit=button('관리자 모드 종료','sm-exit',()=>setMode(false));exit.hidden=true;document.body.append(exit);
  const shade=el('div','sm-shade');shade.hidden=true;
  const panel=el('div','sm-panel');shade.append(panel);document.body.append(shade);
  shade.addEventListener('click',e=>{if(e.target===shade)closePanel();});
  document.addEventListener('keydown',e=>{
    if(e.ctrlKey && e.altKey && e.key.toLowerCase()==='e'){
      e.preventDefault();loggedIn ? setMode(false) : openLogin();
    } else if(e.key==='Escape' && !shade.hidden)closePanel();
  });
  function closePanel(force=false){if(working&&!force)return;shade.hidden=true;panel.replaceChildren();}
  function resetPanel(title){panel.replaceChildren();panel.append(button('×','sm-close',closePanel),el('h2','',title));shade.hidden=false;}
  function message(){const status=el('p','sm-status');status.setAttribute('role','status');panel.append(status);return status;}
  function row(labelText,ctrl){const label=el('label','sm-field');label.append(el('span','',labelText),ctrl);return label;}
  function input(type,placeholder,value){const item=el('input');item.type=type;item.placeholder=placeholder||'';if(value!==undefined)item.value=value;return item;}
  function openLogin(){resetPanel('관리자 모드');const form=el('form','sm-form');const password=input('password','비밀번호');password.required=true;
    const note=el('p','sm-hint','관리자 화면을 여는 잠금장치야. GitHub 게시에는 별도의 인증이 필요해.');
    const err=el('p','sm-status');form.append(note,row('비밀번호',password),button('관리자 모드 열기','sm-main',()=>{if(password.value!==ADMIN_PASSWORD){err.textContent='비밀번호가 일치하지 않아.';return;}password.value='';setMode(true);}),err);panel.append(form);password.focus();}
  function setMode(flag){loggedIn=flag;document.body.classList.toggle('sm-admin-mode',flag);exit.hidden=!flag;render();closePanel();}
  function render(){
    root.querySelectorAll('.sm-custom-section').forEach(n=>n.remove());
    for(const [id,section] of originalSections){
      if(!section)continue;
      const gallery=section.querySelector('.box-group');
      gallery.querySelectorAll('.sm-new-item,.sm-add-card').forEach(n=>n.remove());
      for(const item of getSection(id)?.items||[]){if(!safeUrl(item.thumb)||!safeUrl(item.image))continue;gallery.append(createAddedCard(item,id,page==='photoshop'&&id==='thumbnail'));}
      gallery.append(sectionAddCard(id));
    }
    for(const s of model.sections){
      if(CONFIG.categories.includes(s.id))continue;
      const section=createCustomSection(s);
      const gallery=section.querySelector('.box-group');
      for(const item of s.items){if(!safeUrl(item.thumb)||!safeUrl(item.image))continue;gallery.append(createAddedCard(item,s.id,false));}
      gallery.append(sectionAddCard(s.id));
      main.insertBefore(section,footer);
    }
    // 썸네일 hover 스타일은 이미지를 이동시키지 않으므로 기존의 클릭 이벤트에 영향 없음.
  }
  // GitHub에 공개된 JSON은 페이지 배포 후 노출. 관리자 등록 성공 직후에는 메모리로 즉시 렌더.
  async function load(){
    try{const response=await fetch(CONFIG.data+'?v='+Date.now(),{cache:'no-store'});
      if(response.status===404){model={sections:[]};} else {if(!response.ok)throw Error('HTTP '+response.status);model=safeModel(await response.json());}
    }catch(err){console.warn('포트폴리오 목록을 읽지 못했어:',err);model={sections:[]};}
    render();
  }
  function githubConfig(form){
    const owner=form.querySelector('[name=owner]').value.trim();
    const repo=form.querySelector('[name=repo]').value.trim();
    const branch=form.querySelector('[name=branch]').value.trim();
    const token=form.querySelector('[name=token]').value.trim();
    if(!owner||!repo||!branch||!token)throw Error('GitHub 계정, 저장소, 브랜치, 토큰을 모두 입력해 줘.');
    return {owner,repo,branch,token};
  }
  function githubSettings(){
    const fold=el('details','sm-github');fold.open=false;
    fold.append(el('summary','','GitHub 게시 설정 (게시할 때만 입력)'));
    const a=input('text','GitHub 사용자명',DEFAULT_OWNER);a.name='owner';
    const b=input('text','저장소',DEFAULT_REPO);b.name='repo';
    const c=input('text','브랜치',DEFAULT_BRANCH);c.name='branch';
    const d=input('password','Fine-grained token');d.name='token';d.autocomplete='off';
    fold.append(row('사용자명',a),row('저장소',b),row('브랜치',c),row('토큰 (Contents: Read and write)',d));
    return fold;
  }
  const utf8Decode = b64 => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\s/g,'')),ch=>ch.charCodeAt(0)));
  const utf8Encode = bytes => {let result='';const chunk=16384;for(let i=0;i<bytes.length;i+=chunk){result+=String.fromCharCode(...bytes.subarray(i,i+chunk));}return btoa(result);};
  async function api(config,path,method='GET',payload){
    const uri=path.split('/').map(encodeURIComponent).join('/');
    const url=`https://api.github.com/repos/${encodeURIComponent(config.owner)}/${encodeURIComponent(config.repo)}/contents/${uri}`+(method==='GET'?`?ref=${encodeURIComponent(config.branch)}&t=${Date.now()}`:'');
    const response=await fetch(url,{method,cache:'no-store',headers:{'Accept':'application/vnd.github+json','Authorization':'Bearer '+config.token,'X-GitHub-Api-Version':'2022-11-28',...(payload?{'Content-Type':'application/json'}:{})},...(payload?{body:JSON.stringify(payload)}:{})});
    const json=await response.json().catch(()=>({}));
    if(method==='GET'&&response.status===404)return null;
    if(!response.ok){const error=Error(`GitHub ${response.status}: ${json.message||'권한을 확인해 줘.'}`);error.status=response.status;throw error;}
    return json;
  }
  const configKey=c=>`${c.owner}/${c.repo}/${c.branch}/${CONFIG.data}`;
  async function mutate(config,modify){
    const key=configKey(config);
    for(let attempt=0;attempt<5;attempt++){
      let last=lastSaves.get(key);
      if(!last){const record=await api(config,CONFIG.data);last={sha:record?.sha||null,data:record?safeModel(JSON.parse(utf8Decode(record.content))):{sections:[]}};}
      const next=structuredClone(last.data);modify(next);
      const b64=utf8Encode(new TextEncoder().encode(JSON.stringify(next,null,2)+'\n'));
      try{
        const saved=await api(config,CONFIG.data,'PUT',{message:'Update '+page+' portfolio',content:b64,branch:config.branch,...(last.sha?{sha:last.sha}:{})});
        lastSaves.set(key,{sha:saved.content.sha,data:next});model=next;render();return;
      }catch(error){if(![409,422].includes(error.status)||attempt===4)throw error;lastSaves.delete(key);await new Promise(r=>setTimeout(r,(attempt+1)*180));}
    }
  }
  function validatePicture(file,label){
    if(!file)throw Error(label+'을 선택해 줘.');
    if(!['image/png','image/jpeg','image/webp','image/gif'].includes(file.type))throw Error(label+'은 PNG, JPG, WEBP, GIF만 등록할 수 있어.');
    // 썸네일은 8MB, 클릭 시 표시하는 원본 이미지는 25MB까지 허용합니다.
    const maxBytes = label === 'thumbnail' ? 8 * 1024 * 1024 : 25 * 1024 * 1024;
    const maxMB = label === 'thumbnail' ? 8 : 25;
    if (file.size > maxBytes) throw Error(label+'이 '+maxMB+'MB보다 커. 용량을 줄여 줘.');
  }
  async function upload(config,file,label){
    validatePicture(file,label);
    const ext=({ 'image/png':'png','image/jpeg':'jpg','image/webp':'webp','image/gif':'gif'})[file.type];
    const path=`media/${page}-${Date.now()}-${uuid()}.${ext}`;
    const encoded=utf8Encode(new Uint8Array(await file.arrayBuffer()));
    await api(config,path,'PUT',{message:'Upload '+page+' '+label,content:encoded,branch:config.branch});
    return path;
  }
  function openItem(sectionId,itemId){
    currentSection=sectionId;editingItem=itemId;
    const old=itemId?getSection(sectionId)?.items.find(i=>i.id===itemId):null;
    resetPanel(old?'작품 수정':'작품 추가');
    const form=el('form','sm-form');form.noValidate=true;
    const title=input('text','작품 이름',old?.title||'');title.required=true;
    const thumb=input('file');thumb.accept='image/png,image/jpeg,image/webp,image/gif';
    const original=input('file');original.accept='image/png,image/jpeg,image/webp,image/gif';
    const same=el('input');same.type='checkbox';same.checked=false;
    const sameLabel=el('label','sm-checkbox');sameLabel.append(same,el('span','','썸네일 이미지를 원본 이미지로도 사용'));
    const folder=githubSettings();const report=el('p','sm-status');
    form.append(row('작품 제목',title),row(old?'썸네일 교체 (선택)':'썸네일 이미지',thumb),sameLabel,row(old?'원본 이미지 교체 (선택)':'클릭하면 크게 보일 이미지',original),folder,report);
    const publish=button(old?'수정 저장':'작품 등록','sm-main',async()=>{
      if(working)return;working=true;publish.disabled=true;
      try{
        if(!title.value.trim())throw Error('작품 제목을 입력해 줘.');
        if(!old&&!thumb.files[0])throw Error('썸네일을 선택해 줘.');
        if(!old&&!same.checked&&!original.files[0] && !(page==='photoshop'&&sectionId==='thumbnail'))throw Error('원본 이미지를 선택하거나 썸네일 재사용을 체크해 줘.');
        const config=githubConfig(form);
        let thumbPath=old?.thumb||'',imagePath=old?.image||'';
        if(thumb.files[0]){report.textContent='썸네일 업로드 중...';thumbPath=await upload(config,thumb.files[0],'thumbnail');}
        if(same.checked)imagePath=thumbPath;
        else if(original.files[0]){report.textContent='원본 이미지 업로드 중...';imagePath=await upload(config,original.files[0],'original');}
        else if(!imagePath && page==='photoshop'&&sectionId==='thumbnail')imagePath=thumbPath;
        report.textContent='GitHub에 작품 목록 저장 중...';
        const newId=old?.id||uuid();
        await mutate(config,data=>{
          let section=data.sections.find(s=>s.id===sectionId);
          if(!section){section={id:sectionId,title:'',items:[]};data.sections.push(section);}
          if(old){const index=section.items.findIndex(i=>i.id===old.id);if(index<0)throw Error('다른 기기에서 작품이 변경됐어. 새로고침해 줘.');section.items[index]={...section.items[index],title:title.value.trim(),thumb:thumbPath,image:imagePath};}
          else section.items.push({id:newId,title:title.value.trim(),thumb:thumbPath,image:imagePath});
        });
        closePanel(true);
      }catch(err){report.textContent=err.message||'저장 실패';folder.open=true;}
      finally{working=false;publish.disabled=false;}
    });
    form.append(publish);panel.append(form);
  }
  function openSection(id){
    editingSection=id;
    const old=id?getSection(id):null;
    resetPanel(old?'구역 제목 수정':'새 구역 추가');
    const form=el('form','sm-form');form.noValidate=true;
    const name=input('text','예: 브랜드 디자인',old?.title||'');
    const note=el('p','sm-hint',old?'제목만 변경하며 기존 작품은 유지돼.':'구역 제목과 첫 작품을 함께 등록할 수 있어. 작품을 나중에 추가하려면 이미지는 비워도 돼.');
    const starterTitle=input('text','첫 작품 제목 (선택)');
    const starterThumb=input('file');starterThumb.accept='image/png,image/jpeg,image/webp,image/gif';
    const starterOriginal=input('file');starterOriginal.accept='image/png,image/jpeg,image/webp,image/gif';
    const starterSame=input('checkbox');starterSame.checked=true;
    const starterSameLabel=el('label','sm-checkbox');starterSameLabel.append(starterSame,el('span','','썸네일을 원본 이미지로도 사용'));
    const folder=githubSettings(),report=el('p','sm-status');
    const submit=button(old?'제목 저장':'구역 만들기','sm-main',async()=>{
      if(working)return;working=true;submit.disabled=true;
      try{
        if(!name.value.trim())throw Error('구역 제목을 입력해 줘.');
        const config=githubConfig(form);const idToUse=old?.id||'custom-'+uuid();
        let first=null;
        if(!old && (starterTitle.value.trim()||starterThumb.files[0]||starterOriginal.files[0])){
          if(!starterTitle.value.trim()||!starterThumb.files[0])throw Error('첫 작품을 등록하려면 작품 제목과 썸네일을 모두 선택해 줘.');
          if(!starterSame.checked&&!starterOriginal.files[0])throw Error('원본 이미지도 선택해 줘.');
          report.textContent='첫 작품 썸네일 업로드 중...';
          const thumbPath=await upload(config,starterThumb.files[0],'thumbnail');
          let imagePath=thumbPath;
          if(!starterSame.checked){report.textContent='원본 이미지 업로드 중...';imagePath=await upload(config,starterOriginal.files[0],'original');}
          first={id:uuid(),title:starterTitle.value.trim(),thumb:thumbPath,image:imagePath};
        }
        report.textContent='새 구역 저장 중...';
        await mutate(config,data=>{const existing=data.sections.find(s=>s.id===idToUse);
          if(existing){existing.title=name.value.trim();}
          else data.sections.push({id:idToUse,title:name.value.trim(),items:first?[first]:[]});
        });closePanel(true);
      }catch(err){report.textContent=err.message;folder.open=true;}
      finally{working=false;submit.disabled=false;}
    });
    form.append(note,row('구역 제목',name));
    if(!old)form.append(row('첫 작품 제목 (선택)',starterTitle),row('첫 작품 썸네일 (선택)',starterThumb),starterSameLabel,row('첫 작품 원본 이미지 (필요할 때)',starterOriginal));
    form.append(folder,report,submit);panel.append(form);
  }
  function confirmation(action,text,mutator){
    if(!confirm(text))return;
    resetPanel(action);const form=el('form','sm-form');const folder=githubSettings();const report=el('p','sm-status');
    form.append(el('p','sm-hint','삭제 후 GitHub에 반영하면 일반 방문자 화면에서도 사라져. 기존 HTML 작품은 삭제되지 않아.'),folder,report);
    const b=button('삭제 확정','sm-danger-button',async()=>{
      if(working)return;working=true;b.disabled=true;
      try{const config=githubConfig(form);report.textContent='삭제 내용을 저장 중...';await mutate(config,mutator);closePanel(true);}
      catch(err){report.textContent=err.message;folder.open=true;}finally{working=false;b.disabled=false;}
    });form.append(b);panel.append(form);
  }
  function removeItem(sectionId,itemId){confirmation('작품 삭제','이 작품을 삭제할까?',data=>{const section=data.sections.find(s=>s.id===sectionId);if(!section)throw Error('작품을 찾을 수 없어.');const i=section.items.findIndex(a=>a.id===itemId);if(i<0)throw Error('작품을 찾을 수 없어.');section.items.splice(i,1);});}
  function removeSection(sectionId){confirmation('구역 삭제','이 구역과 안의 추가 작품들을 모두 삭제할까?',data=>{if(CONFIG.categories.includes(sectionId))throw Error('기존 구역은 삭제할 수 없어.');data.sections=data.sections.filter(s=>s.id!==sectionId);});}
  load();
})();
