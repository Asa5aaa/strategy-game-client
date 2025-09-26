// main.js - Enhanced prototype with server endpoints for register/verify, matchmaking, search, and friend requests.
// Configure server URL in client/config.json (api_base)
(async ()=> {
  const cfg = await fetch('config.json').then(r=>r.json()).catch(()=>({api_base: 'http://localhost:8000'}));
  const API = cfg.api_base.replace(/\/$/, '');
  const STATE = {
    recent_player_actions: JSON.parse(localStorage.getItem('recent_player_actions')||'[]'),
    player_stats: JSON.parse(localStorage.getItem('player_stats')||'{"offlineWins":0,"offlineLosses":0,"onlineWins":0,"onlineLosses":0}'),

    mode: null,
    timerSec: 15*60,
    hpYou: 100, hpEnemy:100,
    buildingsYou: [], buildingsEnemy: [],
    money: 7000,
    country: localStorage.getItem('country') || 'Iran',
    player: JSON.parse(localStorage.getItem('player')||'null'),
    queued: false
  };

  // DOM
  const menu = document.getElementById('menu');
  const game = document.getElementById('game');
  const btnOffline = document.getElementById('btn-offline');
  const btnOnline = document.getElementById('btn-online');
  const btnChooseCountry = document.getElementById('btn-choose-country');
  const btnSettings = document.getElementById('btn-settings');
  const cardBar = document.getElementById('card-bar');
  const islandYou = document.getElementById('island-you');
  const islandEnemy = document.getElementById('island-enemy');
  const timerEl = document.getElementById('timer');
  const hpYouEl = document.getElementById('hp-you');
  const hpEnemyEl = document.getElementById('hp-enemy');
  const logEl = document.getElementById('log');
  const btnBack = document.getElementById('btn-back');
  const accountArea = document.getElementById('account-area');
  const modal = document.getElementById('modal');
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');
  const modalOk = document.getElementById('modal-ok');
  const modalCancel = document.getElementById('modal-cancel');
  const modalSettings = document.getElementById('modal-settings');
  const profileArea = document.getElementById('profile-area');
  const searchInput = document.getElementById('search-player-id');
  const btnSearchPlayer = document.getElementById('btn-search-player');
  const btnMatchmaking = document.getElementById('btn-matchmaking');
  const btnLogoutSettings = document.getElementById('btn-logout-settings');
  const settingsClose = document.getElementById('settings-close');

  function log(msg){ const p=document.createElement('div'); p.textContent = msg; logEl.prepend(p); }

  
function renderAccount(){
    const accountArea = document.getElementById('account-area');
    if(STATE.player){
      accountArea.innerHTML = `<div style="display:flex;gap:12px;align-items:center"><img id="flag-img" class="flag" src="assets/flag_${STATE.player.country||'IR'}.png" /> <div>${STATE.player.name||'(بدون نام)'}</div> <div class="player-id">${STATE.player.player_id}</div> <button id="btn-logout">خروج</button></div>`;
      document.getElementById('btn-logout').onclick = () => {
        STATE.player = null; localStorage.removeItem('player'); renderAccount(); updateProfileArea();
      };
    } else {
      accountArea.innerHTML = `<button id="btn-register">ثبت‌نام / ورود با ایمیل</button>`;
      document.getElementById('btn-register').onclick = openRegisterModal;
    }
    updateProfileArea();
} — ID: ${STATE.player.player_id}</div>
      <button id="btn-logout">خروج</button>`;
      document.getElementById('btn-logout').onclick = () => {
        STATE.player = null; localStorage.removeItem('player'); renderAccount(); updateProfileArea();
      };
    } else {
      accountArea.innerHTML = `<button id="btn-register">ثبت‌نام / ورود با ایمیل</button>`;
      document.getElementById('btn-register').onclick = openRegisterModal;
    }
    updateProfileArea();
  }

  function updateProfileArea(){
    if(!profileArea) return;
    if(STATE.player){
      profileArea.innerHTML = `<div>نام: ${STATE.player.name || ''}</div>
      <div>ایمیل: ${STATE.player.email || ''}</div>
      <div>پلیر آیدی: ${STATE.player.player_id || ''}</div>`;
    } else {
      profileArea.innerHTML = `<div>وارد نشده‌اید</div>`;
    }
  }

  async function openRegisterModal(){
    modalTitle.textContent = 'ورود / ثبت‌نام';
    modalBody.innerHTML = `
      <label>ایمیل: <input id="reg-email" type="email" /></label>
      <div style="margin-top:8px">در این نسخه، کد ۶ رقمی از سرور درخواست می‌شود و در پیش‌نمایش نمایش داده می‌شود.</div>
    `;
    modal.classList.remove('hidden');
    modalOk.onclick = async () => {
      const email = document.getElementById('reg-email').value.trim();
      if(!email){ alert('ایمیل را وارد کنید'); return; }
      try{
        const res = await fetch(API + '/api/register', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({email})});
        const data = await res.json();
        if(!data.ok){ alert('خطا در ثبت‌نام'); return; }
        const code = data.code_preview;
        alert('کد از سرور دریافت شد (پیش‌نمایش): '+code);
        const userCode = prompt('کد ۶ رقمی را وارد کنید:');
        if(userCode === code){
          const name = prompt('اسم خود را وارد کنید (برای پروفایل):', email.split('@')[0]);
          const password = prompt('یک رمز ۴ کاراکتری انتخاب کن (برای لاگین‌های بعدی):','abcd');
          const verifyRes = await fetch(API + '/api/verify', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({email, code, name, password})});
          const vdata = await verifyRes.json();
          if(vdata.ok){
            const player = {email, name: name||email.split('@')[0], player_id: vdata.player_id};
            localStorage.setItem('player', JSON.stringify(player));
            STATE.player = player;
            renderAccount(); closeModal();
            alert('ثبت‌نام موفق. پلیر آیدی: ' + player.player_id);
          } else alert('خطا در تایید');
        } else alert('کد نامعتبر');
      }catch(e){ alert('خطا در ارتباط با سرور: '+e.message); }
    };
    modalCancel.onclick = closeModal;
  }

  function closeModal(){ modal.classList.add('hidden'); modalOk.onclick = modalCancel.onclick = null; }

  // Cards (same as before)
  const CARDS = [
    { id:'launcher', name:'لانچر', buildTime:3, price:1200, hp:20 },
    { id:'radar', name:'رادار', buildTime:2, price:2000, hp:10 },
    { id:'petro', name:'پتروشیمی', buildTime:4, price:2500, hp:50, income:1000, incomeInterval:10 },
    { id:'defense', name:'پدافند', buildTime:3, price:1500, hp:25 },
    { id:'airport', name:'فرودگاه', buildTime:3, price:1200, hp:20, droneCapacity:4 },
  ];

  
function renderCards(){
    cardBar.innerHTML = '';
    CARDS.forEach(c=>{
      const d = document.createElement('div'); d.className='card'; d.draggable=true;
      const img = document.createElement('img'); img.src='assets/'+c.id+'.png'; img.style.width='100%'; img.style.height='64px'; img.style.objectFit='contain';
      d.appendChild(img);
      const title = document.createElement('div'); title.innerHTML = `<strong>${c.name}</strong><div>قیمت: ${c.price}</div>`;
      d.appendChild(title);
      d.ondragstart = (ev)=>{ ev.dataTransfer.setData('text/plain', JSON.stringify(c)); };
      cardBar.appendChild(d);
    });
}</strong><div>قیمت: ${c.price}</div>`;
      d.ondragstart = (ev)=>{ ev.dataTransfer.setData('text/plain', JSON.stringify(c)); };
      cardBar.appendChild(d);
    });
  }

  function initDragDrop(){
    [islandYou, islandEnemy].forEach(is => {
      is.ondragover = (ev)=> ev.preventDefault();
      is.ondrop = (ev)=>{
        ev.preventDefault();
        const data = JSON.parse(ev.dataTransfer.getData('text/plain'));
        const rect = is.getBoundingClientRect();
        const x = Math.max(10, Math.min(ev.clientX-rect.left-30, rect.width-60));
        const y = Math.max(10, Math.min(ev.clientY-rect.top-20, rect.height-40));
        if(STATE.money < data.price){ alert('بودجه کافی نیست'); return; }
        STATE.money -= data.price;
        buildStructure(data, is.id==='island-you' ? 'you' : 'enemy', {x,y});
      };
    });
  }

  function buildStructure(card, owner, pos){
    log(`${card.name} ساخته می‌شود (${owner}) ...`);
    setTimeout(()=>{
      const b = { id: card.id+'-'+Date.now(), type: card.id, name: card.name, hp: card.hp, x: pos.x, y: pos.y, owner, meta: card };
      if(owner==='you') STATE.buildingsYou.push(b); else STATE.buildingsEnemy.push(b);
      renderBuildings();
      if(card.income){
        // start income
        b._incomeTimer = setInterval(()=>{
          STATE.money += card.income;
          log(`پتروشیمی درآمد ${card.income} اضافه کرد. موجودی: ${STATE.money}`);
        }, card.incomeInterval*1000);
      }
      log(`${card.name} ساخته شد!`);
    }, card.buildTime*1000);
  }

  function renderBuildings(){
    islandYou.innerHTML = '<div class="island-title">جزیره شما</div>';
    islandEnemy.innerHTML = '<div class="island-title">جزیره دشمن</div>';
    STATE.buildingsYou.forEach(b => {
      const el = document.createElement('div'); el.className='building';
      el.style.left = b.x+'px'; el.style.top = b.y+'px';
      el.textContent = `${b.name} (${b.hp})`;
      el.onclick = ()=> onBuildingClick(b);
      islandYou.appendChild(el);
    });
    STATE.buildingsEnemy.forEach(b => {
      const el = document.createElement('div'); el.className='building';
      el.style.left = b.x+'px'; el.style.top = b.y+'px';
      el.textContent = `${b.name} (${b.hp})`;
      el.onclick = ()=> onBuildingClick(b);
      islandEnemy.appendChild(el);
    });
    hpYouEl.textContent = STATE.hpYou;
    hpEnemyEl.textContent = STATE.hpEnemy;
  }

  function onBuildingClick(b){
    if(b.type==='launcher' && b.owner==='you'){ STATE.recent_player_actions.push('player_attack'); if(STATE.recent_player_actions.length>12) STATE.recent_player_actions.shift(); localStorage.setItem('recent_player_actions', JSON.stringify(STATE.recent_player_actions));
      if(STATE.buildingsEnemy.length===0){ alert('ساختمان دشمن پیدا نشد'); return; }
      const target = STATE.buildingsEnemy[0];
      log(`لانچر به سمت ${target.name} شلیک کرد`);
      const enemyHasDefense = STATE.buildingsEnemy.some(x=>x.type==='defense');
      const hitChance = enemyHasDefense ? 0.9 : 1.0;
      setTimeout(()=>{
        const hit = Math.random() < hitChance;
        if(hit){
          target.hp -= 20;
          log(`موشک اصابت کرد به ${target.name} - HP باقی‌مانده: ${target.hp}`);
          if(target.hp<=0){
            removeBuilding(target);
            STATE.hpEnemy -= 10;
            log(`${target.name} نابود شد!`);
          }
        } else log('موشک توسط پدافند نابود شد');
        renderBuildings();
        checkGameOver();
      }, 1500);
    } else {
      log(`ساختمان انتخاب شد: ${b.name}`);
    }
  }

  function removeBuilding(b){
    const arr = b.owner==='you' ? STATE.buildingsYou : STATE.buildingsEnemy;
    const idx = arr.findIndex(x=>x.id===b.id);
    if(idx>=0) arr.splice(idx,1);
    if(b._incomeTimer) clearInterval(b._incomeTimer);
  }

  
async function enemyAIAction(){
  // Try server AI first
  const state = {
    money: STATE.money,
    time_left: STATE.timerSec,
    buildings_you: STATE.buildingsYou.map(b=>({id:b.id,type:b.type,hp:b.hp})),
    buildings_enemy: STATE.buildingsEnemy.map(b=>({id:b.id,type:b.type,hp:b.hp})),
    hp_you: STATE.hpYou, hp_enemy: STATE.hpEnemy,
    radar_active: false,
    radar_needed: false
  };
  try{
    const res = await fetch(API + '/api/ai/action', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(Object.assign(state, { recent_player_actions: STATE.recent_player_actions, player_offline_wins: STATE.player_stats.offlineWins || 0, player_online_wins: STATE.player_stats.onlineWins || 0 }))
    });
    if(res.ok){
      const data = await res.json();
      if(data && data.ok && data.action){
        applyAIAction(data.action);
        return;
      }
    }
  } catch(e){
    // server not reachable or error - fallback to local AI
    console.warn('AI server error, using local AI fallback', e);
  }
  // local fallback
  enemyUtilityActionLocal();
}
;
      buildStructure(c, 'enemy', pos);
    } else {
      const launchers = STATE.buildingsEnemy.filter(x=>x.type==='launcher');
      if(launchers.length){
        const l = launchers[0];
        const target = STATE.buildingsYou[0];
        if(target){
          log('دشمن با لانچر شلیک کرد');
          setTimeout(()=>{
            const youHasDefense = STATE.buildingsYou.some(x=>x.type==='defense');
            const hitChance = youHasDefense ? 0.9 : 1.0;
            if(Math.random() < hitChance){
              target.hp -= 15;
              log(`ساختمان شما ضربه خورد: ${target.name} - HP: ${target.hp}`);
              if(target.hp<=0){ removeBuilding(target); STATE.hpYou -= 10; log('ساختمان شما نابود شد'); }
            } else log('پدافند شما موشک را نابود کرد');
            renderBuildings();
            checkGameOver();
          }, 1200);
        }
      }
    }
  }

  function tick(){
    STATE.timerSec--;
    const m = Math.floor(STATE.timerSec/60).toString().padStart(2,'0');
    const s = (STATE.timerSec%60).toString().padStart(2,'0');
    timerEl.textContent = `${m}:${s}`;
    if(Math.random()<0.35) enemyAIAction();
    if(STATE.timerSec<=0) endGame();
  }

  function checkGameOver(){
    if(STATE.hpEnemy<=0 || STATE.hpYou<=0) endGame();
  }

  function endGame(){
    clearInterval(game._tick);
    const winner = STATE.hpEnemy<=0 ? 'شما' : (STATE.hpYou<=0 ? 'دشمن' : (STATE.hpEnemy<STATE.hpYou ? 'شما' : 'مساوی'));
    alert('پایان بازی: برنده — ' + winner);
    // update server stats if online
    if(STATE.player && STATE.mode.startsWith('online')){
      const payload = { player_id: STATE.player.player_id, opponent_id: STATE.currentOpponent || 'bot', result: winner==='شما' ? 'win' : (winner==='دشمن' ? 'loss' : 'draw') };
      fetch(API + '/api/game/complete', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)}).catch(()=>{});
    }
    const stats = JSON.parse(localStorage.getItem('stats')||'{"offlineWins":0,"offlineLosses":0}');
    // update player_stats
    STATE.player_stats.offlineWins = STATE.player_stats.offlineWins || 0; STATE.player_stats.offlineLosses = STATE.player_stats.offlineLosses || 0; try{ localStorage.setItem('player_stats', JSON.stringify(STATE.player_stats)); }catch(e){}
    if(winner==='شما') stats.offlineWins++; else if(winner==='دشمن') stats.offlineLosses++;
    localStorage.setItem('stats', JSON.stringify(stats));
    showMenu();
  }

  function startGame(mode){
    STATE.mode = mode;
    STATE.timerSec = 15*60;
    STATE.hpYou = 100; STATE.hpEnemy = 100;
    STATE.buildingsYou = []; STATE.buildingsEnemy = [];
    STATE.money = 7000;
    menu.classList.add('hidden'); game.classList.remove('hidden');
    renderCards(); renderBuildings(); initDragDrop();
    game._tick = setInterval(tick, 1000);
    log('بازی آغاز شد: ' + mode);
  }

  // matchmaking logic (simple)
  async function startMatchmaking(){
    if(!STATE.player){ alert('ابتدا وارد شوید'); return; }
    try{
      const res = await fetch(API + '/api/matchmaking', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({player_id: STATE.player.player_id})});
      const data = await res.json();
      if(data.status === 'matched'){
        STATE.currentOpponent = data.opponent.player_id || 'bot';
        alert('حریف پیدا شد: ' + (data.opponent.name || 'ربات'));
        startGame('online-vs-player');
      } else if(data.status === 'queued'){
        alert('در صف جستجوی حریف قرار گرفتید. لطفاً صبور باشید یا دکمه را دوباره بزنید.');
      } else if(data.status === 'bot'){
        STATE.currentOpponent = 'bot';
        alert('هیچ بازیکن آنلاینی پیدا نشد. بازی با ربات آغاز می‌شود.');
        startGame('online-vs-bot');
      } else {
        alert('پاسخ نامشخص از سرور');
      }
    }catch(e){ alert('خطا در اتصال به سرور: '+e.message); }
  }

  // friend request: send and respond simplified via server endpoints
  async function sendFriendRequest(to_player_id){
    if(!STATE.player) { alert('ابتدا وارد شوید'); return; }
    try{
      const payload = { from_player_id: STATE.player.player_id, to_player_id: to_player_id };
      const res = await fetch(API + '/api/friend/request', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)});
      const data = await res.json();
      if(data.ok) alert('درخواست دوستی ارسال شد');
      else alert('خطا: ' + (data.message || 'unknown'));
    }catch(e){ alert('خطا در ارسال درخواست: '+e.message); }
  }

  async function searchPlayerById(pid){
    try{
      const res = await fetch(API + '/api/player/' + pid);
      if(!res.ok){ alert('پلیر پیدا نشد'); return null; }
      const data = await res.json();
      return data;
    }catch(e){ alert('خطا در جستجو: '+e.message); return null; }
  }

  // UI hooks
  btnOffline.onclick = ()=> startGame('offline');
  btnOnline.onclick = ()=> {
    if(!STATE.player) { openRegisterModal(); return; }
    startMatchmaking();
  };
  btnChooseCountry.onclick = ()=> {
    const c = prompt('کشور انتخاب کن: Iran یا China (پیش‌فرض Iran)');
    if(c){ STATE.country = c; localStorage.setItem('country', c); alert('کشور انتخاب شد: '+c); }
  };
  btnSettings.onclick = ()=> {
    modalSettings.classList.remove('hidden');
    updateProfileArea();
  };
  settingsClose.onclick = ()=> modalSettings.classList.add('hidden');
  btnBack.onclick = ()=> { if(confirm('بازگشت به منو؟')) showMenu(); };
  btnSearchPlayer.onclick = async ()=> {
    const pid = searchInput.value.trim();
    if(!pid){ alert('پلیر آیدی را وارد کنید'); return; }
    const p = await searchPlayerById(pid);
    if(p){ alert('پیدا شد: ' + p.name + ' - ' + p.player_id); if(confirm('ارسال درخواست دوستی به '+p.name+'؟')) sendFriendRequest(p.player_id); }
  };
  btnMatchmaking.onclick = ()=> startMatchmaking();
  btnLogoutSettings.onclick = ()=> { STATE.player=null; localStorage.removeItem('player'); renderAccount(); updateProfileArea(); };

  function showMenu(){ menu.classList.remove('hidden'); game.classList.add('hidden'); if(game._tick) clearInterval(game._tick); renderAccount(); }

  // Initial setup
  renderAccount();
  renderCards();
  showMenu();

})();


function applyAIAction(action){
  if(!action || !action.action) return;
  const a = action;
  if(a.action === 'build' && a.type){
    const card = CARDS.find(c=>c.id===a.type) || {id:a.type,name:a.type,buildTime:3,price:a.price||1200,hp:20};
    const pos = {x: Math.random()*200+20, y: Math.random()*260+20};
    buildStructure(card, 'enemy', pos);
    log('AI built ' + card.name);
    return;
  }
  if(a.action === 'attack' && a.from && a.target){
    // find shooter and target
    const shooter = STATE.buildingsEnemy.find(b=>b.id===a.from) || STATE.buildingsEnemy[0];
    const target = STATE.buildingsYou.find(b=>b.id===a.target) || STATE.buildingsYou[0];
    if(!shooter || !target) return;
    log('AI orders attack from ' + (shooter.name||shooter.type) + ' to ' + (target.name||target.type));
    setTimeout(()=>{
      const youHasDefense = STATE.buildingsYou.some(x=>x.type==='defense');
      const hitChance = youHasDefense ? 0.9 : 1.0;
      const hit = a.expected_hit !== undefined ? a.expected_hit : (Math.random() < hitChance);
      if(hit){
        target.hp -= 20;
        log('AI attack hit: ' + target.name + ' - HP: ' + target.hp);
        if(target.hp<=0){ removeBuilding(target); STATE.hpYou -= 10; log('ساختمان شما نابود شد'); }
      } else {
        log('AI attack missed or was shot down');
      }
      renderBuildings();
      checkGameOver();
    }, 1200 + Math.random()*800);
    return;
  }
  if(a.action === 'use_radar'){
    log('AI used radar');
    // reveal enemy (in this simplified prototype we just log)
    return;
  }
  if(a.action === 'wait'){
    // no-op or small delay
    return;
  }
}


function enemyUtilityActionLocal(){
  // adapt to recent player behavior
  const recent = STATE.recent_player_actions || []; const playerAgg = recent.filter(x=>x.includes('attack')||x.includes('launch')).length;
  // utility-based local AI fallback
  const state = {
    money: STATE.money,
    time_left: STATE.timerSec,
    buildings_you: STATE.buildingsYou.map(b=>({id:b.id,type:b.type,hp:b.hp})),
    buildings_enemy: STATE.buildingsEnemy.map(b=>({id:b.id,type:b.type,hp:b.hp})),
    hp_you: STATE.hpYou, hp_enemy: STATE.hpEnemy
  };
  const priorities = {petro:0.9,radar:0.8,defense:0.7,launcher:0.85,airport:0.6};
  const prices = {launcher:1200,radar:2000,petro:2500,defense:1500,airport:1200};
  // if has launcher, prefer to attack
  if(STATE.buildingsEnemy.some(x=>x.type==='launcher') && STATE.buildingsYou.length>0 && Math.random()<0.75){
    const launcher = STATE.buildingsEnemy.find(x=>x.type==='launcher');
    const target = STATE.buildingsYou.reduce((a,b)=> a.hp < b.hp ? a : b, STATE.buildingsYou[0]);
    // perform attack
    log('دشمن (AI) با لانچر شلیک کرد (محلی)');
    setTimeout(()=>{
      const youHasDefense = STATE.buildingsYou.some(x=>x.type==='defense');
      const hitChance = youHasDefense ? 0.9 : 1.0;
      if(Math.random() < hitChance){
        target.hp -= 15;
        log('ساختمان شما ضربه خورد: ' + target.name + ' - HP: ' + target.hp);
        if(target.hp<=0){ removeBuilding(target); STATE.hpYou -= 10; log('ساختمان شما نابود شد'); }
      } else log('پدافند شما موشک را نابود کرد');
      renderBuildings();
      checkGameOver();
    }, 1200 + Math.random()*800);
    return;
  }
  // otherwise try to build based on priority
  const affordable = [];
  for(const t in prices) if(state.money >= prices[t]) affordable.push({t,score:priorities[t]});
  if(affordable.length>0){
    affordable.sort((a,b)=>b.score-a.score);
    const pick = affordable[0].t;
    const card = CARDS.find(c=>c.id===pick) || {id:pick,name:pick,buildTime:3,price:prices[pick],hp:20};
    buildStructure(card, 'enemy', {x: Math.random()*200+20, y: Math.random()*260+20});
    log('AI local built ' + card.name);
  } else {
    // wait / do nothing
  }
}
