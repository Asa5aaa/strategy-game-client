// pixi_game.js - lightweight Pixi renderer for Strategic Islands
const PixiGame = (function(){


// Simple particle system utilities
function createParticle(x,y,opts={color:0xffcc33,life:40,dx:0,dy:-1,size:4}){
  try{
    const g = new PIXI.Graphics();
    g.beginFill(opts.color);
    g.drawCircle(0,0,opts.size);
    g.endFill();
    g.x = x; g.y = y; g._life = opts.life; g._dx = opts.dx; g._dy = opts.dy;
    app.stage.addChild(g);
    const id = app.ticker.add(()=>{ g.x += g._dx; g.y += g._dy; g._life--; g.alpha = Math.max(0,g._life/opts.life); if(g._life<=0){ app.ticker.remove(id); try{ app.stage.removeChild(g);}catch(e){} } });
    return g;
  }catch(e){ return null; }
}

function emitSmoke(x,y,amount=6){
  for(let i=0;i<amount;i++){
    const dx = (Math.random()-0.5)*1.2; const dy = -Math.random()*1.2-0.4;
    createParticle(x + (Math.random()*8-4), y + (Math.random()*8-4), {color:0x999999, life:30 + Math.random()*20, dx:dx, dy:dy, size: 3 + Math.random()*3});
  }
}

function emitSparks(x,y,amount=10){
  for(let i=0;i<amount;i++){
    const dx = (Math.random()-0.5)*4; const dy = (Math.random()-0.5)*4;
    createParticle(x, y, {color:0xffcc33, life:20 + Math.random()*20, dx:dx, dy:dy, size:2 + Math.random()*3});
  }
}


  let app, layerYou, layerEnemy;
  function init(containerId){
    try{
      const container = document.getElementById(containerId);
      if(!container) return;
      // clear and attach canvas
      container.innerHTML = '';
      app = new PIXI.Application({ width: container.clientWidth, height: 400, backgroundAlpha: 0 });
      container.appendChild(app.view);
      layerYou = new PIXI.Container(); layerEnemy = new PIXI.Container();
      app.stage.addChild(layerYou); app.stage.addChild(layerEnemy);
      drawIslands();
      window.addEventListener('resize', ()=>{ try{ app.renderer.resize(container.clientWidth,400); }catch(e){} });
    }catch(e){ console.warn('Pixi init error', e); }
  }
  function drawIslands(){
    layerYou.removeChildren(); layerEnemy.removeChildren();
    const g1 = new PIXI.Graphics();
    g1.beginFill(0x2b8f57);
    g1.drawRoundedRect(20, 40, 400, 320, 12);
    g1.endFill();
    layerYou.addChild(g1);
    const g2 = new PIXI.Graphics();
    g2.beginFill(0x6b2b2b);
    g2.drawRoundedRect(480, 40, 400, 320, 12);
    g2.endFill();
    layerEnemy.addChild(g2);
  }
  function renderBuildings(buildingsYou, buildingsEnemy){
    try{
      layerYou.removeChildren(); layerEnemy.removeChildren(); drawIslands();
      buildingsYou.forEach(b=>{
        try{
          const tex = PIXI.Texture.from('assets/'+b.type+'.png');
          const spr = new PIXI.Sprite(tex); spr.x = b.x; spr.y = b.y; spr.width=48; spr.height=36;
          layerYou.addChild(spr);
          const txt = new PIXI.Text(b.name, {fontSize:10, fill:0x000000});
          txt.x = b.x; txt.y = b.y - 12; layerYou.addChild(txt);
        }catch(e){}
      });
      buildingsEnemy.forEach(b=>{
        try{
          const tex = PIXI.Texture.from('assets/'+b.type+'.png');
          const spr = new PIXI.Sprite(tex); spr.x = 480 + b.x; spr.y = b.y; spr.width=48; spr.height=36;
          layerEnemy.addChild(spr);
          const txt = new PIXI.Text(b.name, {fontSize:10, fill:0x000000});
          txt.x = 480 + b.x; txt.y = b.y - 12; layerEnemy.addChild(txt);
        }catch(e){}
      });
    }catch(e){ console.warn('renderBuildings error', e); }
  }
  function animateMissile(from, to, onComplete){
    try{
      const gfx = new PIXI.Graphics(); gfx.beginFill(0xff0000); gfx.drawCircle(0,0,6); gfx.endFill();
      gfx.x = from.owner==='you' ? from.x+20 : 480+from.x+20; gfx.y = from.y+12; app.stage.addChild(gfx);
      const duration = 60 + Math.random()*40; let t=0;
      const dx = ( (to.owner==='you' ? to.x : 480+to.x) - gfx.x )/duration;
      const dy = (to.y - gfx.y)/duration;
      const id = app.ticker.add(()=>{ t++; gfx.x += dx; gfx.y += dy; if(t%4===0) { try{ emitSmoke(gfx.x,gfx.y,1); }catch(e){} } if(t>=duration){ app.ticker.remove(id); app.stage.removeChild(gfx);
            // explosion anim
            try{ const sheet = PIXI.Texture.from('assets/explosion_sheet.png'); const frames = []; for(let i=0;i<6;i++){ frames.push(new PIXI.Texture(sheet, new PIXI.Rectangle(i*64,0,64,64))); } const anim = new PIXI.AnimatedSprite(frames); anim.x = gfx.x; anim.y = gfx.y; anim.animationSpeed = 0.6; anim.loop=false; anim.onComplete = ()=>{ app.stage.removeChild(anim); }; app.stage.addChild(anim); anim.play(); }catch(e){};
            if(onComplete) onComplete();
      } });
    }catch(e){ console.warn('animateMissile error', e); if(onComplete) onComplete(); }
  }
  return { init, renderBuildings, animateMissile };
})();