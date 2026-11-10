(() => {
  'use strict';
  // 우연한 편집 모드 진입을 막는 편의용 잠금입니다. GitHub 게시 권한을 대체하지 않습니다.
  const ADMIN_PASSWORD = '1234'; // 여기서 수정
  const $ = id => document.getElementById(id);
  const gallery=$('aftereffect-gallery'), gate=$('manager-gate'), editor=$('manager-editor'), position=$('manager-position');
  if(!gallery)return;
  const overlays=[gate,editor,position];
  let loggedIn=false, editingId=null, positioningId=null;
  const status=t=>{$('manager-status').textContent=t;};
  const positionStatus=t=>{$('manager-position-status').textContent=t;};
  const close=()=>{for(const el of overlays)el.hidden=true;};
  const addCard=document.createElement('div');addCard.className='box manager-add-card';addCard.hidden=true;
  const addButton=document.createElement('button');addButton.type='button';addButton.className='manager-add-button';
  const plus=document.createElement('span');plus.className='manager-plus';plus.textContent='+';
  const addLabel=document.createElement('span');addLabel.textContent='작품 추가';addButton.append(plus,addLabel);addCard.append(addButton);
  const exit=document.createElement('button');exit.type='button';exit.className='manager-exit';exit.textContent='관리자 모드 종료';exit.hidden=true;document.body.append(exit);
  const buttons=new Map();
  const setMode=active=>{
    loggedIn=active;addCard.hidden=!active;exit.hidden=!active;
    if(active)gallery.appendChild(addCard);else addCard.remove();
    document.body.classList.toggle('portfolio-manager-active',active);
    window.refreshManagerCards?.();close();
  };
  const login=()=>{if(!loggedIn){gate.hidden=false;$('manager-password').focus();}else openEditor();};
  document.addEventListener('keydown',e=>{
    if(e.ctrlKey&&e.altKey&&e.key.toLowerCase()==='e'){e.preventDefault();login();}
    if(e.key==='Escape')close();
  });
  document.querySelectorAll('[data-close-manager]').forEach(button=>button.addEventListener('click',close));
  overlays.forEach(backdrop=>backdrop.addEventListener('click',e=>{if(e.target===backdrop)close();}));
  $('manager-login').addEventListener('submit',e=>{
    e.preventDefault();
    if($('manager-password').value===ADMIN_PASSWORD){$('manager-password').value='';$('manager-login-message').textContent='';setMode(true);}
    else $('manager-login-message').textContent='비밀번호가 일치하지 않습니다.';
  });
  exit.addEventListener('click',()=>setMode(false));
  function syncType(){
    const kind=$('manager-type').value, file=['video','image'].includes(kind);
    $('manager-url-row').hidden=file;$('manager-file-row').hidden=!file;
    $('manager-url').required=!file && !editingId;
    $('manager-file').required=file && !editingId;
    $('manager-file').accept=kind==='image'?'image/png,image/jpeg,image/webp':'video/mp4,video/webm,video/ogg';
  }
  $('manager-type').addEventListener('change',syncType);
  function openEditor(id=null){
    editingId=id;
    const connection={owner:$('manager-owner').value,repo:$('manager-repo').value,branch:$('manager-branch').value};
    $('manager-form').reset();
    $('manager-owner').value=connection.owner;$('manager-repo').value=connection.repo;$('manager-branch').value=connection.branch||'main';
    $('manager-delete').hidden=!id;
    $('manager-editor-heading').textContent=id?'작품 수정하기':'새 작품 추가';
    $('manager-publish').textContent=id?'수정 내용 저장하기':'작품 등록하기';
    $('manager-thumbnail').required=!id;
    if(id){
      const item=window.getAftereffectItems?.().find(it=>it.id===id);
      if(!item)return;
      $('manager-title').value=item.title;
      const kind=item.kind==='file'?'video':item.kind==='link'?'youtube':item.kind;
      $('manager-type').value=kind;
      if(['youtube','external'].includes(kind))$('manager-url').value=item.url.startsWith('http')?item.url:'';
    } else {$('manager-type').value='youtube';}
    syncType();status('');close();editor.hidden=false;$('manager-title').focus();
  }
  addButton.addEventListener('click',()=>openEditor());
  window.refreshManagerCards=()=>{
    gallery.querySelectorAll('.box[data-portfolio-id]').forEach(card=>{
      const id=card.dataset.portfolioId;
      let bar=card.querySelector('.portfolio-manager-actions');
      if(!bar){
        bar=document.createElement('div');bar.className='portfolio-manager-actions';
        const positionButton=document.createElement('button');positionButton.type='button';positionButton.textContent='위치 조절';
        positionButton.addEventListener('click',()=>openPosition(id));bar.append(positionButton);
        if(!id.startsWith('legacy-')){
          const edit=document.createElement('button');edit.type='button';edit.textContent='수정';edit.addEventListener('click',()=>openEditor(id));bar.append(edit);
          const del=document.createElement('button');del.type='button';del.className='portfolio-delete-button';del.textContent='삭제';del.addEventListener('click',()=>deleteItem(id));bar.append(del);
        }
        card.append(bar);
      }
    });
  };
  const readConnection=prefix=>{
    const owner=$(prefix+'-owner').value.trim(),repo=$(prefix+'-repo').value.trim(),branch=$(prefix+'-branch').value.trim()||'main',token=$(prefix+'-token').value.trim();
    if(!owner||!repo||!token)throw Error('GitHub 게시 설정을 열고 소유자, 저장소, 토큰을 입력해 주세요.');
    if(!/^[\w.-]+$/.test(owner)||!/^[\w.-]+$/.test(repo))throw Error('저장소 이름을 확인해 주세요.');
    return {owner,repo,branch,token};
  };
  function fillRepository(prefix){
    if(location.hostname.endsWith('.github.io')){
      const owner=location.hostname.split('.')[0];
      $(prefix+'-owner').value=owner;
      $(prefix+'-repo').value=location.pathname.split('/').filter(Boolean)[0]||owner+'.github.io';
    }
  }
  fillRepository('manager');fillRepository('position');
  const encoder=new TextEncoder();
  const b64=bytes=>{let out='';for(let i=0;i<bytes.length;i+=8192)out+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(out);};
  const decodeB64=value=>new TextDecoder().decode(Uint8Array.from(atob(value.replace(/\s/g,'')),c=>c.charCodeAt(0)));
  async function github(config,path,method='GET',body){
    const uri=path.split('/').map(encodeURIComponent).join('/');
    const url=`https://api.github.com/repos/${encodeURIComponent(config.owner)}/${encodeURIComponent(config.repo)}/contents/${uri}`+(method==='GET'?'?ref='+encodeURIComponent(config.branch)+'&_='+Date.now()+'-'+Math.random().toString(36).slice(2):'');
    const response=await fetch(url,{method,cache:'no-store',headers:{'Accept':'application/vnd.github+json','Authorization':'Bearer '+config.token,'X-GitHub-Api-Version':'2022-11-28',...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
    const data=await response.json().catch(()=>({}));
    if(response.status===404&&method==='GET')return null;
    if(!response.ok){const error=Error(`GitHub ${response.status}: ${data.message||'게시 권한 또는 설정을 확인해 주세요.'}`);error.status=response.status;throw error;}
    return data;
  }
  async function readData(config,path,fallback){
    const record=await github(config,path);
    return {record,data:record?JSON.parse(decodeB64(record.content)):fallback};
  }
  const putData=(config,path,record,data,message)=>github(config,path,'PUT',{message,content:b64(encoder.encode(JSON.stringify(data,null,2)+'\n')),branch:config.branch,...(record?{sha:record.sha}:{})});
  // 한 번 저장한 직후 다시 등록할 때 GitHub Pages 배포를 기다리지 않도록
  // 마지막으로 성공한 GitHub 커밋의 SHA와 데이터를 현재 탭에 보관합니다.
  const confirmedFiles=new Map();
  const fileKey=(config,path)=>[config.owner,config.repo,config.branch,path].join('/');
  const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  async function mutateData(config,path,fallback,message,change){
    const key=fileKey(config,path);
    for(let attempt=0;attempt<5;attempt++){
      try{
       // 같은 탭의 연속 등록은 직전 PUT 응답의 SHA를 사용합니다.
       // 다른 곳에서 변경된 경우 아래 충돌 처리에서 최신 버전으로 합칩니다.
       const current=confirmedFiles.get(key)||await readData(config,path,fallback);
       const data=structuredClone(current.data);
       change(data);
       const result=await putData(config,path,current.record,data,message);
       if(!result.content?.sha)throw Error('GitHub 저장 응답에 최신 SHA가 없습니다. 새로고침 후 확인해 주세요.');
       confirmedFiles.set(key,{record:{sha:result.content.sha},data});
       return data;
      }catch(error){
       if((error.status!==409&&error.status!==422)||attempt===4)throw error;
       // 다른 탭이나 요청이 먼저 저장한 경우, 오래된 SHA를 버리고 최신 파일에 다시 반영.
       confirmedFiles.delete(key);
       await pause(200*(attempt+1));
      }
    }
  }

  async function upload(config,file,type){
    const ext=file.name.split('.').pop().toLowerCase();
    const path=`media/${type}-${Date.now()}-${Math.random().toString(36).slice(2,9)}.${ext}`;
    await github(config,path,'PUT',{message:'Upload portfolio '+type,content:b64(new Uint8Array(await file.arrayBuffer())),branch:config.branch});
    return path;
  }
  const types={thumbnail:['image/jpeg','image/png','image/webp'],image:['image/jpeg','image/png','image/webp'],video:['video/mp4','video/webm','video/ogg']};
  function validate(file,type,limit,label){
    if(!file)throw Error(label+'을(를) 선택해 주세요.');
    if(!types[type].includes(file.type))throw Error(label+': 지원하지 않는 형식입니다.');
    if(file.size>limit)throw Error(label+': 파일이 너무 큽니다.');
    return file;
  }
  $('manager-form').addEventListener('submit',async e=>{
    e.preventDefault();
    const submit=$('manager-publish');submit.disabled=true;
    try{
      const title=$('manager-title').value.trim(),kind=$('manager-type').value;
      if(!title)throw Error('제목을 입력해 주세요.');
      const thumb=$('manager-thumbnail').files[0];
      if(thumb)validate(thumb,'thumbnail',5*1024*1024,'썸네일');
      if(!thumb&&!editingId)throw Error('썸네일을 등록해 주세요.');
      const old=editingId?window.getAftereffectItems?.().find(it=>it.id===editingId):null;
      const fileKind=['video','image'].includes(kind);
      const asset=$('manager-file').files[0];
      if(asset)validate(asset,kind==='image'?'image':'video',kind==='image'?8*1024*1024:15*1024*1024,'작품 파일');
      const urlInput=$('manager-url').value.trim();
      if(!fileKind&&urlInput){const parsed=new URL(urlInput);if(!['http:','https:'].includes(parsed.protocol))throw Error('http(s) 주소만 등록할 수 있습니다.');}
      if(!fileKind&&!urlInput&&!old)throw Error('작품 링크를 입력해 주세요.');
      if(fileKind&&!asset&&(!old||!['file','image','video'].includes(old.kind)))throw Error('작품 파일을 선택해 주세요.');
      const config=readConnection('manager');
      status('작품 목록을 확인하는 중...');
      const savedId=editingId;
      const oldItem=editingId?window.getAftereffectItems?.().find(a=>a.id===editingId):null;
      if(thumb)status('썸네일 업로드 중...');
      const thumbPath=thumb?await upload(config,thumb,'thumbnail'):oldItem?.thumb;
      let url=fileKind?null:(urlInput || oldItem?.url || '');
      if(asset){status('작품 파일 업로드 중...');url=await upload(config,asset,kind);}
      else if(fileKind){url=oldItem?.url;}
      if(!url)throw Error('등록할 작품 파일 또는 링크가 없습니다.');
      const newId='ae-'+Date.now()+'-'+Math.random().toString(36).slice(2,7);
      status('GitHub에 저장 중...');
      const items=await mutateData(config,'data/aftereffect-extra.json',[],`${savedId?'Update':'Add'} portfolio: ${title}`,list=>{
        if(!Array.isArray(list))throw Error('작품 목록 형식이 올바르지 않습니다.');
        const idx=savedId?list.findIndex(a=>a.id===savedId):-1;
        if(savedId&&idx<0)throw Error('수정하려는 작품을 찾을 수 없습니다.');
        const previous=idx>=0?list[idx]:null;
        const entry={id:previous?.id||newId,title,kind:kind==='video'?'file':kind==='youtube'?'link':kind,thumb:thumbPath||previous?.thumb,url,...(previous?.position?{position:previous.position}:{})};
        if(idx>=0)list[idx]=entry;else list.push(entry);
      });
      window.renderAftereffectExtras?.(items);
      status('저장 완료! GitHub Pages 배포 후 일반 방문자에게도 반영됩니다.');
      editingId=null; $('manager-thumbnail').required=true; $('manager-form').reset();syncType();
    }catch(error){status(error.message||'저장에 실패했습니다.');$('manager-form .manager-github').open=true;}
    finally{submit.disabled=false;}
  });
  async function deleteItem(id){
    const item=window.getAftereffectItems?.().find(it=>it.id===id);
    if(!item||!confirm(`「${item.title}」 작품을 삭제할까요?\n기존 4개 작품은 삭제되지 않습니다.`))return;
    openEditor(id);
    status('이 작품을 삭제하려면 GitHub 게시 설정을 입력하고 아래 삭제 버튼을 눌러 주세요.');
  }
  $('manager-delete').addEventListener('click',async()=>{
    const id=editingId;
    if(!id||!confirm('작품을 목록에서 삭제할까요?'))return;
    const button=$('manager-delete');button.disabled=true;
    try{
      const config=readConnection('manager');
      status('작품 목록을 불러오는 중...');
      const filtered=await mutateData(config,'data/aftereffect-extra.json',[],'Remove portfolio item',data=>{
        const idx=data.findIndex(item=>item.id===id);
        if(idx<0)throw Error('작품을 찾을 수 없습니다.');
        data.splice(idx,1);
      });
      window.renderAftereffectExtras?.(filtered);close();
    }catch(error){status(error.message);$('manager-form .manager-github').open=true;}
    finally{button.disabled=false;}
  });
  function getPositionValues(){return {x:Number($('manager-x').value),y:Number($('manager-y').value),size:Number($('manager-size').value)};}
  const drawPreview=()=>{
    const p=getPositionValues();
    $('manager-x-label').textContent=p.x+'%';$('manager-y-label').textContent=p.y+'%';$('manager-size-label').textContent=p.size+'%';
    const sample=$('manager-position-sample');
    sample.style.left=p.x+'%';sample.style.top=p.y+'%';sample.style.width=(p.size*.72)+'%';
  };
  function openPosition(id){
    positioningId=id;
    const card=window.getAftereffectCard?.(id);
    $('manager-position-title').textContent=card?.querySelector('h2')?.textContent||'작품';
    const saved=window.getAftereffectLayout?.(id)||{x:50,y:50,size:70};
    $('manager-x').value=saved.x;$('manager-y').value=saved.y;$('manager-size').value=saved.size;
    positionStatus('');drawPreview();close();position.hidden=false;
  }
  ['manager-x','manager-y','manager-size'].forEach(id=>$(id).addEventListener('input',drawPreview));
  $('manager-position-reset').addEventListener('click',()=>{$('manager-x').value=50;$('manager-y').value=50;$('manager-size').value=70;drawPreview();});
  $('manager-position-form').addEventListener('submit',async e=>{
    e.preventDefault();const button=$('manager-position-save');button.disabled=true;
    try{
      const config=readConnection('position'),id=positioningId,value=getPositionValues();
      if(!id)throw Error('선택된 작품이 없습니다.');
      if(id.startsWith('legacy-')){
        const data=await mutateData(config,'data/aftereffect-layout.json',{},'Update original portfolio popup position',layouts=>{
          layouts[id]=value;
        });
        window.setAftereffectLayouts?.(data);
      }else{
        const data=await mutateData(config,'data/aftereffect-extra.json',[],'Update portfolio popup position',items=>{
          const item=items.find(a=>a.id===id);
          if(!item)throw Error('작품을 찾을 수 없습니다.');
          item.position=value;
        });
        window.renderAftereffectExtras?.(data);
      }
      positionStatus('저장 완료! 해당 작품에만 적용됩니다. GitHub Pages 배포 후 공개 사이트에 반영돼요.');
    }catch(error){positionStatus(error.message||'저장에 실패했습니다.');$('manager-position-form .manager-github').open=true;}
    finally{button.disabled=false;}
  });
  window.refreshManagerCards();
})();
