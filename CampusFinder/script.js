const CATEGORIES = [
  {key:"airpods",label:"AirPods",icon:"🎧"},
  {key:"id",label:"ID card",icon:"💳"},
  {key:"phone",label:"Phone",icon:"📱"},
  {key:"book",label:"Book",icon:"📖"},
  {key:"keys",label:"Keys",icon:"🔑"},
  {key:"other",label:"Other",icon:"📦"}
];
const LOCATIONS = ["Library","Cafeteria","Hostel","Sports complex","Main building","Parking lot","Classroom block","Other"];

const seedItems = [
 {id:1001,type:"lost",category:"phone",name:"iPhone 13, black case",description:"Cracked corner on the case, lock screen shows a mountain wallpaper. Last had it during the 2pm lecture.",location:"Library",date:"2026-09-14",photo:null,status:"active",owner:"other",postedBy:"Ananya"},
 {id:1002,type:"found",category:"keys",name:"Bunch of keys, red keychain",description:"Four keys on a ring with a small red tag, no name on it.",location:"Parking lot",date:"2026-09-15",photo:null,status:"active",owner:"other",postedBy:"Rahul"},
 {id:1003,type:"lost",category:"id",name:"College ID — Priya Sharma",description:"Must have dropped it near the counter during lunch.",location:"Cafeteria",date:"2026-09-13",photo:null,status:"resolved",owner:"other",postedBy:"Priya"},
 {id:1004,type:"found",category:"book",name:"Data Structures textbook",description:'Name "Kunal" written inside the front cover.',location:"Classroom block",date:"2026-09-12",photo:null,status:"active",owner:"other",postedBy:"Simran"},
 {id:1005,type:"lost",category:"airpods",name:"AirPods Pro, white case",description:"Small scratch on the lid. Might be in the changing room.",location:"Sports complex",date:"2026-09-11",photo:null,status:"active",owner:"other",postedBy:"Dev"}
];
const seedNotifications = [
 {id:2001,text:"Welcome to CampusFind. Report what you lost, or post what you found.",read:true}
];

let items = JSON.parse(localStorage.getItem("campusfind_items") || "null") || seedItems;
let notifications = JSON.parse(localStorage.getItem("campusfind_notifications") || "null") || seedNotifications;
let name = localStorage.getItem("campusfind_name") || "You";
let view = "home";
let detailItem = null;
let notifOpen = false;
let confirming = null;
let toastTimer = null;
let nextId = Math.max(3000,...items.map(x=>Number(x.id)),...notifications.map(x=>Number(x.id))) + 1;

const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const catInfo = key => CATEGORIES.find(c=>c.key===key) || CATEGORIES[5];
const todayStr = () => new Date().toISOString().slice(0,10);
function prettyDate(str){
  const d=new Date(str+"T00:00:00"), t=new Date(); t.setHours(0,0,0,0);
  const diff=Math.round((t-d)/86400000);
  if(diff===0)return "Today"; if(diff===1)return "Yesterday";
  return d.toLocaleDateString("en-IN",{day:"numeric",month:"short"});
}
function save(){
  localStorage.setItem("campusfind_items",JSON.stringify(items));
  localStorage.setItem("campusfind_notifications",JSON.stringify(notifications));
  localStorage.setItem("campusfind_name",name);
}
function showToast(msg){
  $("toast").innerHTML=`<span>${esc(msg)}</span>`;
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>$("toast").innerHTML="",2200);
}
function addNotification(text){notifications.push({id:nextId++,text,read:false});save();updateBadge();}
function updateBadge(){
  const n=notifications.filter(x=>!x.read).length,b=$("notificationBadge");
  b.textContent=n;b.classList.toggle("hidden",n===0);
}
function pill(item){
  const tone=item.status==="resolved"?"resolved":item.type;
  const label=item.status==="resolved"?"Resolved":item.type==="lost"?"Lost":"Found";
  return `<span class="pill ${tone}">${label}</span>`;
}
function card(item,mine=false){
  const c=catInfo(item.category);
  const media=item.photo?`<img class="card-img" src="${item.photo}" alt="${esc(item.name)}">`:`<div class="card-placeholder">${c.icon}</div>`;
  let actions="";
  if(mine){
    if(confirming===item.id) actions=`<div class="confirm"><span class="tiny muted">Delete this post?</span><div class="confirm-actions"><button onclick="cancelConfirm()">Cancel</button><button class="danger" onclick="deleteItem(${item.id})">Delete</button></div></div>`;
    else actions=`<button onclick="toggleResolve(${item.id})">✓ ${item.status==="resolved"?"Mark as active":"Mark as resolved"}</button><button class="delete" onclick="startConfirm(${item.id})">♲ Delete</button>`;
  }
  return `<article class="card">
    <button class="card-main" onclick="openDetail(${item.id})">${media}
      <div class="card-info"><div class="pills">${pill(item)}<span class="tiny faint">${c.label}</span></div>
      <p class="card-name truncate">${esc(item.name)}</p>
      <div class="meta"><span>⌖ ${esc(item.location)}</span><span>◷ ${prettyDate(item.date)}</span></div></div><span class="chevron">›</span>
    </button>${mine?`<div class="card-actions">${actions}</div>`:""}</article>`;
}
function empty(icon,title,sub){return `<div class="empty"><div class="tile">${icon}</div><p class="empty-title">${title}</p><p class="empty-sub">${sub}</p></div>`}

function renderHome(){
  const lost=items.filter(i=>i.type==="lost"&&i.status==="active").length;
  const found=items.filter(i=>i.type==="found"&&i.status==="active").length;
  const resolved=items.filter(i=>i.status==="resolved").length;
  const recent=items.slice(-4).reverse();
  return `<div class="screen"><p class="small muted">Welcome back</p><h1>${esc(name)}</h1>
    <div class="stats"><div class="stat"><strong>${lost}</strong><span>Lost, open</span></div><div class="stat"><strong>${found}</strong><span>Found, open</span></div><div class="stat"><strong>${resolved}</strong><span>Resolved</span></div></div>
    <div class="actions"><button class="action-card dark" onclick="setView('reportLost')"><div class="action-icon">＋</div><div class="action-title">Report lost</div><div class="action-sub">Lost something on campus?</div></button>
    <button class="action-card" onclick="setView('reportFound')"><div class="action-icon">＋</div><div class="action-title">Report found</div><div class="action-sub">Picked something up?</div></button></div>
    <div class="section-head"><p class="section-title">Recent activity</p><button class="link" onclick="setView('listings')">See all</button></div>
    <div class="recent">${recent.map(i=>`<div class="recent-item"><div class="tile">${catInfo(i.category).icon}</div><div class="recent-main"><p class="body truncate">${esc(i.name)}</p><p class="tiny muted">${i.type==="lost"?"Lost":"Found"} · ${esc(i.location)} · ${prettyDate(i.date)}</p></div></div>`).join("")}</div>
  </div>`;
}
function renderSearch(){
  return `<div class="screen"><h1 class="page-title">Search</h1>
    <div class="searchbox"><span>⌕</span><input id="searchQuery" placeholder="Search by item name or description"><button onclick="clearSearch()">×</button></div>
    <div class="chips" style="margin-top:12px">${["all","lost","found"].map(t=>`<button class="chip ${searchType===t?"active":""}" onclick="setSearchType('${t}')">${t==="all"?"All types":t[0].toUpperCase()+t.slice(1)}</button>`).join("")}</div>
    <div class="chips" style="margin-top:8px">${[["any","Any date"],["today","Today"],["yesterday","Yesterday"],["week","This week"]].map(([k,l])=>`<button class="chip ${dateFilter===k?"active":""}" onclick="setDateFilter('${k}')">${l}</button>`).join("")}</div>
    <div class="filters"><select id="searchCategory" onchange="runSearch()"><option value="all">Any category</option>${CATEGORIES.map(c=>`<option value="${c.key}">${c.label}</option>`).join("")}</select>
    <select id="searchLocation" onchange="runSearch()"><option value="all">Any location</option>${LOCATIONS.map(l=>`<option>${l}</option>`).join("")}</select></div>
    <div id="searchResults"></div>
  </div>`;
}
let searchType="all",dateFilter="any";
function matchesDate(d,f){
  if(f==="any")return true;
  const x=new Date(d+"T00:00:00"),t=new Date();t.setHours(0,0,0,0);
  const diff=Math.round((t-x)/86400000);
  return f==="today"?diff===0:f==="yesterday"?diff===1:f==="week"?diff>=0&&diff<=7:true;
}
function runSearch(){
  const q=($("searchQuery")?.value||"").trim().toLowerCase(),cat=$("searchCategory")?.value||"all",loc=$("searchLocation")?.value||"all";
  const result=items.filter(i=>(searchType==="all"||i.type===searchType)&&(cat==="all"||i.category===cat)&&(loc==="all"||i.location===loc)&&matchesDate(i.date,dateFilter)&&(!q||i.name.toLowerCase().includes(q)||i.description.toLowerCase().includes(q)));
  $("searchResults").innerHTML=`<p class="results-count">${result.length} ${result.length===1?"result":"results"}</p><div class="list">${result.length?result.map(i=>card(i)).join(""):empty("⌕","No matches yet","Try a different keyword or clear a filter.")}</div>`;
}
function bindSearch(){ $("searchQuery").addEventListener("input",runSearch);runSearch(); }
function clearSearch(){ $("searchQuery").value="";runSearch(); }
function setSearchType(t){searchType=t;render();bindSearch();}
function setDateFilter(f){dateFilter=f;render();bindSearch();}

let reportType="lost",reportCategory="phone",reportPhoto=null;
function renderReport(){
  const opposite=reportType==="lost"?"found":"lost";
  const matchCount=items.filter(i=>i.type===opposite&&i.status==="active"&&i.category===reportCategory).length;
  return `<div class="screen bottom-space"><h1>Report an item</h1><p class="small muted" style="margin-top:4px">Fill in a few details so the right person can find this post.</p>
    <div class="segment"><button class="${reportType==="lost"?"active":""}" onclick="setReportType('lost')">I lost something</button><button class="${reportType==="found"?"active":""}" onclick="setReportType('found')">I found something</button></div>
    <p class="tiny muted" style="font-weight:600;margin-bottom:8px">Category</p><div class="category-grid">${CATEGORIES.map(c=>`<button class="category ${reportCategory===c.key?"active":""}" onclick="setReportCategory('${c.key}')"><span class="cat-icon">${c.icon}</span><span>${c.label}</span></button>`).join("")}</div>
    <div class="field"><label>Item name</label><input id="reportName" placeholder="${reportType==="lost"?"e.g. Black wallet":"e.g. Blue water bottle"}"></div>
    <div class="field"><label>Description</label><textarea id="reportDescription" rows="3" placeholder="Any details that help identify it — colour, marks, contents..."></textarea></div>
    <div class="row"><div class="field"><label>Location</label><select id="reportLocation">${LOCATIONS.map(l=>`<option>${l}</option>`).join("")}</select></div><div class="field"><label>Date</label><input id="reportDate" type="date" value="${todayStr()}" max="${todayStr()}"></div></div>
    <div class="field"><label>Photo</label>${reportPhoto?`<div class="photo-preview"><img src="${reportPhoto}" alt="Preview"><button class="remove-photo" onclick="removePhoto()">×</button></div>`:`<button class="photo-upload" onclick="$('photoInput').click()">📷 Add a photo (optional)</button>`}<input id="photoInput" type="file" accept="image/*" style="display:none" onchange="handlePhoto(event)"></div>
    ${matchCount?`<div class="match-box">✓ ${matchCount} ${opposite} post${matchCount>1?"s":""} for "${catInfo(reportCategory).label}" already exist — check the listings after posting.</div>`:""}
    <div class="form-actions"><button class="outline" onclick="setView('home')">Cancel</button><button id="postBtn" class="primary" onclick="submitReport()">Post as ${reportType}</button></div>
  </div>`;
}
function setReportType(t){reportType=t;render()}
function setReportCategory(c){reportCategory=c;render()}
function handlePhoto(e){const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{reportPhoto=r.result;render()};r.readAsDataURL(f)}
function removePhoto(){reportPhoto=null;render()}
function submitReport(){
  const nameEl=$("reportName"),nameVal=nameEl.value.trim(); if(!nameVal){nameEl.focus();showToast("Please enter an item name");return}
  const data={id:nextId++,type:reportType,category:reportCategory,name:nameVal,description:$("reportDescription").value.trim(),location:$("reportLocation").value,date:$("reportDate").value,photo:reportPhoto,status:"active",owner:"me",postedBy:name};
  const opposite=reportType==="lost"?"found":"lost";
  const matches=items.filter(i=>i.type===opposite&&i.status==="active"&&i.category===reportCategory);
  items.push(data);save();
  if(matches.length)addNotification(`${matches.length} ${opposite} post${matches.length>1?"s":""} for "${catInfo(reportCategory).label}" ${matches.some(m=>m.location===data.location)?`near ${data.location} `:""}might match your ${reportType} item. Check the listings.`);
  reportPhoto=null;showToast(reportType==="lost"?"Lost item posted":"Found item posted");setView("listings");
}
function renderListings(){
  const filtered=items.filter(i=>listTab==="all"||i.type===listTab).slice().reverse();
  return `<div class="screen"><h1 class="page-title">Listings</h1><div class="chips" style="margin-bottom:16px">${["all","lost","found"].map(t=>`<button class="chip ${listTab===t?"active":""}" onclick="setListTab('${t}')">${t[0].toUpperCase()+t.slice(1)}</button>`).join("")}</div>
  <div class="list">${filtered.length?filtered.map(i=>card(i,i.owner==="me")).join(""):empty("☷","Nothing here yet","Posts will show up here as students report items.")}</div></div>`;
}
let listTab="all";
function setListTab(t){listTab=t;render()}
function renderProfile(){
  const mine=items.filter(i=>i.owner==="me").slice().reverse(), initials=name.split(" ").map(x=>x[0]).join("").slice(0,2).toUpperCase();
  return `<div class="screen"><h1 class="page-title">Profile</h1><div class="profile-box"><div class="avatar">${esc(initials||"ME")}</div><div class="profile-main">${editingProfile?`<input class="edit-input" id="nameDraft" value="${esc(name)}" autofocus>`:`<p class="body" style="font-weight:600">${esc(name)}</p>`}<p class="tiny muted" style="margin-top:3px">Campus member</p></div><button class="edit-btn" onclick="toggleProfileEdit()">${editingProfile?"Save":"Edit"}</button></div>
  <div class="stats" style="margin-top:16px"><div class="stat" style="text-align:center"><strong>${mine.length}</strong><span>My posts</span></div><div class="stat" style="text-align:center"><strong>${mine.filter(i=>i.status==="active").length}</strong><span>Active</span></div><div class="stat" style="text-align:center"><strong>${mine.filter(i=>i.status==="resolved").length}</strong><span>Resolved</span></div></div>
  <div class="section-head"><p class="section-title">My posts</p></div><div class="list">${mine.length?mine.map(i=>card(i,true)).join(""):empty("♙","No posts yet","Anything you report will appear here.")}</div></div>`;
}
let editingProfile=false;
function toggleProfileEdit(){
  if(editingProfile){const d=$("nameDraft").value.trim();if(d)name=d;editingProfile=false;save()}else editingProfile=true;render();
}
function openDetail(id){detailItem=items.find(i=>i.id===id);renderOverlay()}
function closeDetail(){detailItem=null;renderOverlay()}
function toggleResolve(id){items=items.map(i=>i.id===id?{...i,status:i.status==="resolved"?"active":"resolved"}:i);if(detailItem&&detailItem.id===id)detailItem=items.find(i=>i.id===id);save();render();renderOverlay()}
function startConfirm(id){confirming=id;render()}
function cancelConfirm(){confirming=null;render()}
function deleteItem(id){items=items.filter(i=>i.id!==id);confirming=null;detailItem=null;save();render();renderOverlay();showToast("Post deleted")}
function renderOverlay(){
  const o=$("overlay");
  if(notifOpen){o.innerHTML=`<div class="overlay"><div class="overlay-header"><button onclick="closeNotifs()">←</button><strong style="font:600 14px Sora,sans-serif">Notifications</strong><span style="flex:1"></span>${notifications.length?`<button class="link" onclick="clearNotifs()">Clear all</button>`:""}</div><div class="overlay-body">${notifications.length?`<div class="notif-list">${notifications.slice().reverse().map(n=>`<div class="notif"><div class="tile" style="width:32px;height:32px;flex-basis:32px">♧</div><div>${esc(n.text)}</div></div>`).join("")}</div>`:empty("♧","You're all caught up","We'll let you know about matches here.")}</div></div>`;return}
  if(!detailItem){o.innerHTML="";return}
  const c=catInfo(detailItem.category),mine=detailItem.owner==="me";
  o.innerHTML=`<div class="overlay"><div class="overlay-header"><button onclick="closeDetail()">←</button><strong style="font:600 14px Sora,sans-serif">Post details</strong></div>
  <div class="overlay-body">${detailItem.photo?`<img class="detail-photo" src="${detailItem.photo}" alt="${esc(detailItem.name)}">`:`<div class="detail-placeholder">${c.icon}</div>`}
  <div class="pills">${pill(detailItem)}<span class="pill line">${c.label}</span></div><h2 class="detail-title">${esc(detailItem.name)}</h2>
  <p class="detail-desc">${esc(detailItem.description||"No further description was added.")}</p>
  <div class="detail-meta"><div>⌖ ${esc(detailItem.location)}</div><div>◷ ${prettyDate(detailItem.date)}</div>${detailItem.postedBy?`<div>♙ Posted by ${esc(detailItem.postedBy)}</div>`:""}</div></div>
  <div class="overlay-footer">${mine?`<div class="form-actions"><button class="outline" onclick="toggleResolve(${detailItem.id})">${detailItem.status==="resolved"?"Mark as active":"Mark as resolved"}</button><button class="primary" style="background:var(--lost)" onclick="deleteItem(${detailItem.id})">Delete post</button></div>`:`<button class="primary" style="width:100%;padding:12px;border-radius:12px" onclick="showToast('Direct messaging is planned for the next version')">${detailItem.type==="lost"?"I found this":"This is mine"}</button>`}</div></div>`;
}
function openNotifs(){notifOpen=true;notifications=notifications.map(n=>({...n,read:true}));save();updateBadge();renderOverlay()}
function closeNotifs(){notifOpen=false;renderOverlay()}
function clearNotifs(){notifications=[];save();renderOverlay();updateBadge()}
function nav(){
  const navs=[["home","⌂","Home"],["search","⌕","Search"],["report","＋","Report"],["listings","☷","Listings"],["profile","♙","Profile"]];
  $("bottomNav").innerHTML=navs.map(([k,ic,l])=>{const active=view===k||(k==="report"&&(view==="reportLost"||view==="reportFound"));return `<button class="nav-item ${active?"active":""}" onclick="setView('${k==="report"?"reportLost":k}')"><span class="nav-icon">${ic}</span><span>${l}</span></button>`}).join("");
}
function render(){
  const content=$("content");
  if(view==="home")content.innerHTML=renderHome();
  else if(view==="search"){content.innerHTML=renderSearch();bindSearch()}
  else if(view==="reportLost"||view==="reportFound"){reportType=view==="reportLost"?"lost":"found";content.innerHTML=renderReport()}
  else if(view==="listings")content.innerHTML=renderListings();
  else if(view==="profile")content.innerHTML=renderProfile();
  nav();updateBadge();
}
function setView(v){view=v;confirming=null;render();$("content").scrollTop=0}
$("notificationBtn").addEventListener("click",openNotifs);
render();
