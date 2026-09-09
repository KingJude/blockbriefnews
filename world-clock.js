(() => {
  if (customElements.get('world-clock-widget')) return;
  const cities = [
    ['Manila','Philippines','Asia/Manila'],['UTC','Coordinated Universal Time','UTC'],
    ['Singapore','Singapore','Asia/Singapore'],['Tokyo','Japan','Asia/Tokyo'],
    ['London','United Kingdom','Europe/London'],['New York','United States','America/New_York'],
    ['Hong Kong','Hong Kong','Asia/Hong_Kong'],['Shanghai','China','Asia/Shanghai'],
    ['Seoul','South Korea','Asia/Seoul'],['Taipei','Taiwan','Asia/Taipei'],
    ['Bangkok','Thailand','Asia/Bangkok'],['Jakarta','Indonesia','Asia/Jakarta'],
    ['Kuala Lumpur','Malaysia','Asia/Kuala_Lumpur'],['New Delhi','India','Asia/Kolkata'],
    ['Dubai','United Arab Emirates','Asia/Dubai'],['Riyadh','Saudi Arabia','Asia/Riyadh'],
    ['Sydney','Australia','Australia/Sydney'],['Melbourne','Australia','Australia/Melbourne'],
    ['Auckland','New Zealand','Pacific/Auckland'],['Paris','France','Europe/Paris'],
    ['Berlin','Germany','Europe/Berlin'],['Zurich','Switzerland','Europe/Zurich'],
    ['Istanbul','Türkiye','Europe/Istanbul'],['Johannesburg','South Africa','Africa/Johannesburg'],
    ['Cairo','Egypt','Africa/Cairo'],['Los Angeles','United States','America/Los_Angeles'],
    ['Chicago','United States','America/Chicago'],['Toronto','Canada','America/Toronto'],
    ['Vancouver','Canada','America/Vancouver'],['São Paulo','Brazil','America/Sao_Paulo']
  ];
  class WorldClock extends HTMLElement {
    constructor() {
      super(); this.attachShadow({mode:'open'});
      this.content = document.createElement('div');
      this.dialog = document.createElement('dialog');
      this.dialog.setAttribute('aria-label', 'World clock full screen');
      const shellStyle = document.createElement('style');
      shellStyle.textContent = `
        :host(:fullscreen){width:100%;height:100%;overflow:auto;background:#020711}
        dialog{position:fixed;inset:0;width:100%;height:100%;height:100dvh;max-width:none;max-height:none;margin:0;padding:0;border:0;background:#020711;overflow:auto;overscroll-behavior:contain}
        dialog::backdrop{background:#020711}
        .expanded .widget{max-width:none;min-height:100vh;min-height:100dvh;border:0;border-radius:0;padding:max(20px,env(safe-area-inset-top)) max(20px,env(safe-area-inset-right)) max(20px,env(safe-area-inset-bottom)) max(20px,env(safe-area-inset-left))}
        .expanded .grid{grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr))}
        .expanded .time{font-size:clamp(28px,3vw,40px)}
        .expanded .clockrow{flex-wrap:wrap}
      `;
      this.shadowRoot.append(shellStyle, this.content, this.dialog);
      this.onFullscreenChange = () => this.syncFullscreen();
      this.dialog.addEventListener('close', () => this.restoreInline());
      this.selected = cities.slice(0,6); this.hour12 = true; this.light = false;
      try {
        const saved = JSON.parse(localStorage.getItem('blockbrief-world-clock-v1'));
        if(saved && Array.isArray(saved.zones)) {
          this.selected = [...new Set(saved.zones)].map(zone => cities.find(city => city[2] === zone)).filter(Boolean);
          this.hour12 = saved.hour12 !== false; this.light = saved.light === true;
        }
      } catch {}
    }
    connectedCallback() {
      clearInterval(this.timer);
      document.addEventListener('fullscreenchange', this.onFullscreenChange);
      this.render(); this.timer = setInterval(() => this.tick(),1000);
    }
    disconnectedCallback() {
      clearInterval(this.timer);
      document.removeEventListener('fullscreenchange', this.onFullscreenChange);
      if(this.dialog.open) this.dialog.close();
      this.restoreInline(false);
    }
    syncFullscreen() {
      const expanded = document.fullscreenElement === this || this.dialog.open;
      this.content.classList.toggle('expanded', expanded);
      const button = this.shadowRoot.querySelector('#fullscreen');
      if(button) {
        button.textContent = expanded ? 'Exit full screen' : 'Full screen';
        button.setAttribute('aria-label', expanded ? 'Exit world clock full screen' : 'Open world clock full screen');
        button.setAttribute('aria-pressed', String(expanded));
      }
    }
    restoreInline(focus = true) {
      // The content stays inside this component, so controls and clock timers survive.
      if(this.dialog.open) return;
      if(this.content.parentNode === this.dialog) this.shadowRoot.insertBefore(this.content, this.dialog);
      if(this.previousOverflow !== undefined) {
        document.documentElement.style.overflow = this.previousOverflow;
        this.previousOverflow = undefined;
      }
      this.syncFullscreen();
      if(focus && this.isConnected) this.shadowRoot.querySelector('#fullscreen')?.focus({preventScroll:true});
    }
    async toggleFullscreen() {
      if(this.fullscreenBusy) return;
      this.fullscreenBusy = true;
      try {
        if(document.fullscreenElement === this) {
          await document.exitFullscreen();
        } else if(this.dialog.open) {
          this.dialog.close();
          this.restoreInline();
        } else {
          let entered = false;
          if(document.fullscreenEnabled && this.requestFullscreen) {
            try { await this.requestFullscreen(); entered = true; } catch {}
          }
          if(!entered && this.isConnected) {
            this.dialog.append(this.content);
            this.dialog.showModal();
            this.previousOverflow = document.documentElement.style.overflow;
            document.documentElement.style.overflow = 'hidden';
          }
        }
      } finally {
        this.fullscreenBusy = false;
        this.syncFullscreen();
        this.shadowRoot.querySelector('#fullscreen')?.focus({preventScroll:true});
      }
    }
    saveSettings() {
      try { localStorage.setItem('blockbrief-world-clock-v1', JSON.stringify({zones:this.selected.map(city=>city[2]),hour12:this.hour12,light:this.light})); } catch {}
    }
    render() {
      this.content.innerHTML = `<style>
        :host{display:block;color-scheme:dark;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
        *{box-sizing:border-box}.widget{--bg:#020711;--card:#07111f;--ink:#f8fbff;--muted:#a6b1c5;--line:#193952;--accent:#24dfff;background:var(--bg);color:var(--ink);padding:clamp(18px,4vw,30px);border:1px solid var(--line);border-radius:22px;max-width:1180px;margin:auto}
        .widget.light{--bg:#f4f8fc;--card:#fff;--ink:#17283c;--muted:#51647c;--line:#cbd8e6;--accent:#006776;color-scheme:light}
        header,.tools,.bottom{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap}
        .eyebrow{font-size:10px;font-weight:750;letter-spacing:.18em;color:var(--accent);margin:0 0 6px}h2{font-size:25px;letter-spacing:-.7px;margin:0}.sub{font-size:12px;color:var(--muted);margin:7px 0 0}
        button,select{font:inherit;font-size:12px;border:1px solid var(--line);border-radius:9px;background:var(--card);color:var(--ink);padding:10px 12px;min-height:42px}button{cursor:pointer}button:hover{border-color:var(--accent)}button:focus-visible,select:focus-visible{outline:2px solid var(--accent);outline-offset:3px}.tools{gap:7px}
        .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));gap:12px;margin:24px 0 18px}.card{position:relative;border:1px solid var(--line);background:var(--card);border-radius:14px;padding:18px;min-width:0}.city{font-size:16px;font-weight:700;margin:0;padding-right:30px}.country{font-size:11px;color:var(--muted);margin:4px 0 16px;min-height:15px}.remove{position:absolute;top:8px;right:8px;border:0;padding:4px 10px;font-size:21px;color:var(--muted);background:transparent;min-width:40px}.clockrow{display:flex;align-items:center;gap:12px;flex-wrap:wrap}.face{width:62px;height:62px;flex-shrink:0;color:var(--accent)}.face circle{stroke:var(--line)}.time{font-variant-numeric:tabular-nums;font-size:25px;letter-spacing:-.8px;white-space:nowrap;line-height:1.2}.date,.zone{font-size:11px;color:var(--muted);margin-top:6px}.zone{border-top:1px solid var(--line);padding-top:12px;margin-top:16px;display:flex;justify-content:space-between;gap:8px}.period{color:var(--accent)}.bottom{font-size:11px;color:var(--muted)}form{display:flex;gap:8px;flex-wrap:wrap;align-items:center}label{font-size:12px}select{max-width:100%;width:160px}.empty{font-size:14px;color:var(--muted)}
        @media(max-width:440px){h2{font-size:22px}.widget{padding:16px}.tools{width:100%}.time{font-size:28px}.bottom{align-items:flex-start;flex-direction:column}}
      </style>
      <section class="widget ${this.light?'light':''}" aria-label="World clock">
        <header><div><p class="eyebrow">GLOBAL CRYPTO · LOCAL TIME</p><h2>World clock</h2><p class="sub">Track the time across the cities you follow.</p></div><div class="tools"><button id="format" aria-label="Use ${this.hour12?'24':'12'}-hour time">${this.hour12?'12':'24'}-hour</button><button id="theme" aria-label="Switch to ${this.light?'dark':'light'} theme">${this.light?'Dark':'Light'} theme</button><button id="fullscreen" type="button" aria-label="Open world clock full screen" aria-pressed="false">Full screen</button></div></header>
        <div class="grid"></div>
        <div class="bottom"><form><label for="city">Add city</label><select id="city"></select><button type="submit">+ Add</button></form><span>Time from your device · Updates every second</span></div>
      </section>`;
      const grid=this.shadowRoot.querySelector('.grid');
      this.views=this.selected.map(city=>{
        const card=document.createElement('article');card.className='card';
        card.innerHTML=`<h3 class="city"></h3><p class="country"></p><button class="remove" type="button">×</button><div class="clockrow"><svg class="face" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="30" fill="none" stroke-width="1.5"/><path d="M32 5v4M59 32h-4M32 59v-4M5 32h4" stroke="currentColor" stroke-width="1.5"/><line class="hour" x1="32" y1="32" x2="32" y2="18" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><line class="minute" x1="32" y1="32" x2="32" y2="11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="32" cy="32" r="2.5" fill="currentColor"/></svg><div><div class="time"></div><div class="date"></div></div></div><div class="zone"><span class="offset"></span><span class="period"></span></div>`;
        card.querySelector('.city').textContent=city[0];card.querySelector('.country').textContent=city[1];
        const remove=card.querySelector('.remove');remove.setAttribute('aria-label',`Remove ${city[0]}`);
        remove.onclick=()=>{this.selected=this.selected.filter(c=>c[2]!==city[2]);this.saveSettings();this.render();this.shadowRoot.querySelector('#city').focus();};
        grid.append(card);
        return {card,time:new Intl.DateTimeFormat('en-US',{timeZone:city[2],hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:this.hour12}),date:new Intl.DateTimeFormat('en-US',{timeZone:city[2],weekday:'short',month:'short',day:'numeric'}),parts:new Intl.DateTimeFormat('en-GB',{timeZone:city[2],hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23',timeZoneName:'shortOffset'})};
      });
      if(!this.views.length){const empty=document.createElement('p');empty.className='empty';empty.textContent='Add a city to see its local time.';grid.append(empty);}
      const select=this.shadowRoot.querySelector('#city');
      cities.filter(c=>!this.selected.some(s=>s[2]===c[2])).sort((a,b)=>a[0].localeCompare(b[0])).forEach(c=>{const o=document.createElement('option');o.value=c[2];o.textContent=c[0];select.append(o);});
      select.disabled=!select.options.length;this.shadowRoot.querySelector('button[type="submit"]').disabled=select.disabled;
      this.shadowRoot.querySelector('form').onsubmit=e=>{e.preventDefault();const city=cities.find(c=>c[2]===select.value);if(city&&!this.selected.some(c=>c[2]===city[2])){this.selected.push(city);this.saveSettings();this.render();this.shadowRoot.querySelector('#city').focus();}};
      this.shadowRoot.querySelector('#format').onclick=()=>{this.hour12=!this.hour12;this.saveSettings();this.render();this.shadowRoot.querySelector('#format').focus();};
      this.shadowRoot.querySelector('#theme').onclick=()=>{this.light=!this.light;this.saveSettings();this.render();this.shadowRoot.querySelector('#theme').focus();};
      this.shadowRoot.querySelector('#fullscreen').onclick=()=>this.toggleFullscreen();
      this.syncFullscreen();
      this.tick();
    }
    tick(){
      const now=new Date();
      for(const view of this.views){
        const p=Object.fromEntries(view.parts.formatToParts(now).map(x=>[x.type,x.value]));const h=Number(p.hour),m=Number(p.minute),s=Number(p.second);
        view.card.querySelector('.time').textContent=view.time.format(now);
        view.card.querySelector('.date').textContent=view.date.format(now);
        view.card.querySelector('.offset').textContent=p.timeZoneName.replace('GMT','UTC');
        view.card.querySelector('.period').textContent=h>=6&&h<18?'Daytime hours':'Nighttime hours';
        view.card.querySelector('.hour').setAttribute('transform',`rotate(${h%12*30+m/2} 32 32)`);
        view.card.querySelector('.minute').setAttribute('transform',`rotate(${m*6+s/10} 32 32)`);
      }
    }
  }
  customElements.define('world-clock-widget',WorldClock);
})();
