(() => {
'use strict';
// ★ 여기의 따옴표 안 내용만 원하는 관리자 화면 비밀번호로 바꿔 주세요.
// 이 비밀번호는 화면 표시를 제한할 뿐, GitHub 게시 권한을 제공하거나 비밀을 안전하게 보호하지 않습니다.
const ADMIN_PASSWORD = '1234';
const gate = document.getElementById('password-gate');
const adminContent = document.getElementById('admin-content');
const passwordInput = document.getElementById('admin-password');
const gateStatus = document.getElementById('gate-status');
const unlockForm = document.getElementById('unlock-form');
const setUnlocked = (unlocked) => {
  gate.hidden = unlocked;
  adminContent.hidden = !unlocked;
  if (unlocked) passwordInput.value = '';
};
setUnlocked(false);
unlockForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (passwordInput.value === ADMIN_PASSWORD) {
    gateStatus.textContent = '';
    setUnlocked(true);
  } else {
    gateStatus.textContent = '비밀번호가 일치하지 않습니다.';
    passwordInput.select();
  }
});
document.getElementById('lock').addEventListener('click', () => {
  setUnlocked(false);
  document.getElementById('token').value = '';
  passwordInput.focus();
});
const $=id=>document.getElementById(id);let items=[],editing=null,originalSha=null;
const token=()=> $('token').value.trim();
const escapePath=p=>p.split('/').map(encodeURIComponent).join('/');
const apiBase=()=>{const owner=$('owner').value.trim(), repo=$('repo').value.trim();if(!/^[\w.-]+$/.test(owner)||!/^[\w.-]+$/.test(repo))throw Error('저장소 소유자와 이름을 정확히 입력해 주세요.');return `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/`;};
const branch=()=> $('branch').value.trim()||'main';
const status=s=>{$('status').textContent=s};
const req=async(path,options={})=>{
 if(!token())throw Error('GitHub 토큰을 입력해 주세요.');
 const r=await fetch(apiBase()+escapePath(path)+(options.method?'':`?ref=${encodeURIComponent(branch())}`),{...options,headers:{Accept:'application/vnd.github+json',Authorization:`Bearer ${token()}`,'X-GitHub-Api-Version':'2022-11-28',...(options.headers||{})}});
 let d;try{d=await r.json()}catch{d={}};if(!r.ok){if(r.status===404)return null;throw Error(`GitHub 오류 ${r.status}: ${d.message||'접근 또는 권한을 확인해 주세요.'}`)}return d;
};
const toB64=bytes=>{let s='';for(let i=0;i<bytes.length;i+=8192)s+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(s);};
const utf8B64=s=>toB64(new TextEncoder().encode(s));
const fromB64=s=>new TextDecoder().decode(Uint8Array.from(atob(s.replace(/\s/g,'')),c=>c.charCodeAt(0)));
const put=async(path,content,message,sha)=>req(path,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({message,content,branch:branch(),...(sha?{sha}:{})})});
const fileData=async(input,max,types)=>{const f=input.files[0];if(!f)return null;if(f.size>max)throw Error(`${f.name}: 파일이 너무 큽니다.`);if(!types.includes(f.type))throw Error(`${f.name}: 지원하지 않는 형식입니다.`);return f;};
const upload=async(file,prefix)=>{const ext=file.name.split('.').pop().toLowerCase();const path=`media/${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,9)}.${ext}`;await put(path,toB64(new Uint8Array(await file.arrayBuffer())),`Add portfolio ${prefix}`);return path;};
const asUrl=p=>{if(!p)return '';try{const u=new URL(p);return ['https:','http:'].includes(u.protocol)?u.href:''}catch {return /^[\w./-]+$/.test(p) && !p.includes('..') ? p : ''}};
const setMode=()=>{const file=$('kind').value==='file';$('file-wrap').hidden=!file;$('url-wrap').hidden=file;};$('kind').addEventListener('change',setMode);
function render(){const box=$('items');box.replaceChildren();items.forEach((item,i)=>{const row=document.createElement('div');row.className='item';const img=document.createElement('img');img.src=item.thumb;img.alt='';const desc=document.createElement('div');desc.className='desc';const title=document.createElement('strong');title.textContent=item.title;const note=document.createElement('small');note.textContent=(item.kind==='file'?'영상 파일':'링크')+' · '+item.url;desc.append(title,note);const controls=document.createElement('div');controls.className='controls';[['수정',()=>edit(i)],['↑',()=>move(i,-1)],['↓',()=>move(i,1)],['삭제',()=>{if(confirm('이 신규 작품을 삭제할까요?')){items.splice(i,1);render()}}]].forEach(([label,fn])=>{const b=document.createElement('button');b.textContent=label;b.type='button';b.onclick=fn;controls.appendChild(b)});row.append(img,desc,controls);box.appendChild(row)});if(!items.length)box.textContent='새로 등록된 작품이 없습니다.';}
const move=(i,dir)=>{const j=i+dir;if(j<0||j>=items.length)return;[items[i],items[j]]=[items[j],items[i]];render();};
const edit=i=>{editing=i;const o=items[i];$('title').value=o.title;$('kind').value=o.kind;$('url').value=o.kind==='file'?'':o.url;$('thumb').value='';$('video').value='';setMode();window.scrollTo({top:0,behavior:'smooth'});status('수정 중: '+o.title);};
const clear=()=>{editing=null;$('title').value='';$('url').value='';$('thumb').value='';$('video').value='';$('kind').value='link';setMode();};$('reset').onclick=clear;
$('load').onclick=async()=>{try{status('불러오는 중...');const d=await req('data/premiere-extra.json');originalSha=d?.sha||null;const parsed=d?JSON.parse(fromB64(d.content)):[];if(!Array.isArray(parsed))throw Error('작품 목록 형식이 잘못됐습니다.');items=parsed;render();status('불러오기 완료: 신규 작품 '+items.length+'개');}catch(e){status(e.message);}};
$('save').onclick=async()=>{try{const title=$('title').value.trim();if(!title)throw Error('제목을 입력해 주세요.');const kind=$('kind').value;const old=editing===null?null:items[editing];const thumb=await fileData($('thumb'),5*1024*1024,['image/png','image/jpeg','image/webp']);const vid=kind==='file'?await fileData($('video'),15*1024*1024,['video/mp4','video/webm','video/ogg']):null;let thumbUrl=old?.thumb||'',url=old?.url||'';
 if(!thumb && !thumbUrl)throw Error('썸네일 이미지를 골라 주세요.');
 if(kind==='link'){url=asUrl($('url').value.trim());if(!url||!/^https?:\/\//.test(url))throw Error('https://로 시작하는 작품 링크를 입력해 주세요.');}
 else if(!vid && (!old || old.kind!=='file'))throw Error('영상 파일을 선택해 주세요.');
 // 이미지/파일은 저장소 업로드 후 목록에 등록합니다. 링크는 공개 주소만 저장합니다.
 if(thumb||vid){if(!token())throw Error('파일 업로드에는 GitHub 토큰이 필요합니다.');status('파일을 GitHub에 업로드 중...');if(thumb)thumbUrl=await upload(thumb,'thumbnail');if(vid)url=await upload(vid,'video');}
 const result={id:old?.id||`p-${Date.now()}`,title,kind,url,thumb:thumbUrl};if(editing===null)items.push(result);else items[editing]=result;clear();render();status('목록에 반영됨. 실제 사이트에 올리려면 [GitHub에 게시하기]를 누르세요.');
 }catch(e){status(e.message);}};
$('publish').onclick=async()=>{try{if(!token())throw Error('GitHub 토큰을 입력해 주세요.');status('게시 중...');const current=await req('data/premiere-extra.json');const data=JSON.stringify(items,null,2)+'\n';await put('data/premiere-extra.json',utf8B64(data),'Update Premiere portfolio entries',current?.sha);status('GitHub에 저장했습니다. Pages 배포가 끝난 뒤 사이트에 나타납니다.');}catch(e){status(e.message);}};
$('export').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(items,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='premiere-extra.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),500);};
// 정적 페이지에서 자동으로 GitHub 사용자명과 저장소를 추정할 수 있는 경우만 기본값을 채웁니다.
if(location.hostname.endsWith('.github.io')){const owner=location.hostname.split('.')[0];const repo=location.pathname.split('/').filter(Boolean)[0]||owner+'.github.io';$('owner').value=owner;$('repo').value=repo;}
render();setMode();
})();
