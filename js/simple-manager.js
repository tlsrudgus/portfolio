(() => {
  'use strict';
  // 이 값은 우연한 관리자 화면 진입을 방지하기 위한 공개 가능한 잠금 비밀번호입니다.
  const ADMIN_PASSWORD = '1234'; // 원하는 비밀번호로 변경하세요.
  const $ = id => document.getElementById(id);
  const gallery = $('premiere-gallery');
  const gate = $('manager-gate');
  const editor = $('manager-editor');
  const status = text => { $('manager-status').textContent=text; };
  let loggedIn = false;
  const close = () => { gate.hidden=true;editor.hidden=true; };
  const addCard=document.createElement('div');addCard.className='box manager-add-card';addCard.hidden=true;
  const addButton=document.createElement('button');addButton.type='button';addButton.className='manager-add-button';
  const plus=document.createElement('span');plus.className='manager-plus';plus.textContent='+';
  const label=document.createElement('span');label.textContent='작품 추가';
  addButton.append(plus,label);addCard.append(addButton);
  const exit=document.createElement('button');exit.type='button';exit.className='manager-exit';exit.textContent='관리자 모드 종료';exit.hidden=true;document.body.append(exit);
  const setMode = active => { loggedIn=active; addCard.hidden=!active;exit.hidden=!active;if(active)gallery.appendChild(addCard);else addCard.remove();close(); };
  const login=()=>{if(!loggedIn){gate.hidden=false;$('manager-password').focus();}else{openEditor();}};
  document.addEventListener('keydown',event=>{
    if(event.ctrlKey&&event.altKey&&event.key.toLowerCase()==='e') {event.preventDefault();login();}
    if(event.key==='Escape')close();
  });
  document.querySelectorAll('[data-close-manager]').forEach(button=>button.addEventListener('click',close));
  [gate,editor].forEach(backdrop=>backdrop.addEventListener('click',event=>{if(event.target===backdrop)close();}));
  $('manager-login').addEventListener('submit',event=>{
    event.preventDefault();
    if($('manager-password').value===ADMIN_PASSWORD){$('manager-password').value='';$('manager-login-message').textContent='';setMode(true);}
    else{$('manager-login-message').textContent='비밀번호가 일치하지 않습니다.';}
  });
  exit.addEventListener('click',()=>setMode(false));
  const openEditor=()=>{$('manager-form').reset();$('manager-type').value='youtube';syncType();status('');editor.hidden=false;$('manager-title').focus();};
  addButton.addEventListener('click',openEditor);
  const syncType=()=>{const kind=$('manager-type').value,file=['video','image'].includes(kind);
    $('manager-url-row').hidden=file;$('manager-file-row').hidden=!file;
    $('manager-file').accept=kind==='image'?'image/jpeg,image/png,image/webp':'video/mp4,video/webm,video/ogg';
  };
  $('manager-type').addEventListener('change',syncType);syncType();
  // GitHub Pages 주소에서 저장소 이름을 가능한 경우 자동으로 채웁니다.
  if(location.hostname.endsWith('.github.io')){
    const owner=location.hostname.split('.')[0];
    $('manager-owner').value=owner;
    $('manager-repo').value=location.pathname.split('/').filter(Boolean)[0]||owner+'.github.io';
  }
  const encoder=new TextEncoder();
  const b64=bytes=>{let out='';for(let i=0;i<bytes.length;i+=8192)out+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(out);};
  const decodeB64=value=>new TextDecoder().decode(Uint8Array.from(atob(value.replace(/\s/g,'')),x=>x.charCodeAt(0)));
  const auth=()=>{
    const owner=$('manager-owner').value.trim(),repo=$('manager-repo').value.trim(),branch=$('manager-branch').value.trim()||'main',token=$('manager-token').value.trim();
    if(!owner||!repo||!token)throw Error('GitHub 게시 연결을 열고 저장소 정보와 토큰을 입력해 주세요.');
    if(!/^[\w.-]+$/.test(owner)||!/^[\w.-]+$/.test(repo))throw Error('저장소 이름을 확인해 주세요.');
    return {owner,repo,branch,token};
  };
  const github=async(config,path,method='GET',body)=>{
    const uri=path.split('/').map(encodeURIComponent).join('/');
    const url=`https://api.github.com/repos/${encodeURIComponent(config.owner)}/${encodeURIComponent(config.repo)}/contents/${uri}`+(method==='GET'?'?ref='+encodeURIComponent(config.branch):'');
    const response=await fetch(url,{method,headers:{'Accept':'application/vnd.github+json','Authorization':'Bearer '+config.token,'X-GitHub-Api-Version':'2022-11-28',...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
    const data=await response.json().catch(()=>({}));
    if(response.status===404&&method==='GET')return null;
    if(!response.ok)throw Error(`GitHub ${response.status}: ${data.message||'게시 권한 또는 설정을 확인해 주세요.'}`);
    return data;
  };
  const upload=async(config,file,type)=>{
    const ext=file.name.split('.').pop().toLowerCase();
    const path=`media/${type}-${Date.now()}-${Math.random().toString(36).slice(2,9)}.${ext}`;
    await github(config,path,'PUT',{message:'Add portfolio '+type,content:b64(new Uint8Array(await file.arrayBuffer())),branch:config.branch});
    return path;
  };
  const validFile=(file,types,limit,description)=>{
    if(!file)throw Error(description+'을(를) 선택해 주세요.');
    if(!types.includes(file.type))throw Error(description+': 지원하지 않는 파일 형식입니다.');
    if(file.size>limit)throw Error(description+': 파일이 너무 큽니다.');
    return file;
  };
  $('manager-form').addEventListener('submit',async event=>{
    event.preventDefault();
    const submit=$('manager-publish');submit.disabled=true;
    try{
      const title=$('manager-title').value.trim(),kind=$('manager-type').value;
      if(!title)throw Error('제목을 입력해 주세요.');
      const thumb=validFile($('manager-thumbnail').files[0],['image/jpeg','image/png','image/webp'],5*1024*1024,'썸네일');
      const fileKind=['video','image'].includes(kind);
      const asset=fileKind?validFile($('manager-file').files[0],kind==='image'?['image/jpeg','image/png','image/webp']:['video/mp4','video/webm','video/ogg'],kind==='image'?8*1024*1024:15*1024*1024,'작품 파일'):null;
      let url='';
      if(!fileKind){url=$('manager-url').value.trim();const parsed=new URL(url);if(!['http:','https:'].includes(parsed.protocol))throw Error('https://로 시작하는 링크만 사용할 수 있어요.');url=parsed.href;}
      const config=auth();
      status('현재 작품 목록을 확인하는 중...');
      const record=await github(config,'data/premiere-extra.json');
      const items=record?JSON.parse(decodeB64(record.content)):[];
      if(!Array.isArray(items))throw Error('기존 작품 목록 형식이 올바르지 않습니다.');
      status('썸네일 업로드 중...');
      const thumbPath=await upload(config,thumb,'thumbnail');
      if(asset){status('작품 파일 업로드 중...');url=await upload(config,asset,kind);}
      items.push({id:'p-'+Date.now(),title,kind:kind==='video'?'file':kind==='youtube'?'link':kind,thumb:thumbPath,url});
      status('작품 목록 게시 중...');
      const newBody={message:'Add Premiere portfolio: '+title,content:b64(encoder.encode(JSON.stringify(items,null,2)+'\n')),branch:config.branch,...(record?{sha:record.sha}:{})};
      await github(config,'data/premiere-extra.json','PUT',newBody);
      status('등록 완료! GitHub Pages 배포가 끝나면 새 작품이 나타납니다.');
      $('manager-form').reset();syncType();
      window.reloadPremiereExtras?.().catch(()=>{});
    }catch(error){status(error.message||'등록에 실패했습니다.');$('manager-github').open=true;}
    finally{submit.disabled=false;}
  });
})();
