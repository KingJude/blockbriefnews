(() => {
  if (customElements.get('world-clock-widget')) return;
  const cities = [
    ['Manila','Philippines','Asia/Manila','geo:1701668'],['UTC','Coordinated Universal Time','UTC'],
    ['Singapore','Singapore','Asia/Singapore','geo:1880252'],['Tokyo','Japan','Asia/Tokyo','geo:1850147'],
    ['London','United Kingdom','Europe/London','geo:2643743'],['New York','United States','America/New_York','geo:5128581'],
    ['Hong Kong','Hong Kong','Asia/Hong_Kong','geo:1819729'],['Shanghai','China','Asia/Shanghai','geo:1796236'],
    ['Seoul','South Korea','Asia/Seoul','geo:1835848'],['Taipei','Taiwan','Asia/Taipei','geo:1668341'],
    ['Bangkok','Thailand','Asia/Bangkok','geo:1609350'],['Jakarta','Indonesia','Asia/Jakarta','geo:1642911'],
    ['Kuala Lumpur','Malaysia','Asia/Kuala_Lumpur','geo:1735161'],['New Delhi','India','Asia/Kolkata','geo:1261481'],
    ['Dubai','United Arab Emirates','Asia/Dubai','geo:292223'],['Riyadh','Saudi Arabia','Asia/Riyadh','geo:108410'],
    ['Sydney','Australia','Australia/Sydney','geo:2147714'],['Melbourne','Australia','Australia/Melbourne','geo:2158177'],
    ['Auckland','New Zealand','Pacific/Auckland','geo:2193733'],['Paris','France','Europe/Paris','geo:2988507'],
    ['Berlin','Germany','Europe/Berlin','geo:2950159'],['Zurich','Switzerland','Europe/Zurich'],
    ['Istanbul','Türkiye','Europe/Istanbul','geo:745044'],['Johannesburg','South Africa','Africa/Johannesburg','geo:993800'],
    ['Cairo','Egypt','Africa/Cairo','geo:360630'],['Los Angeles','United States','America/Los_Angeles','geo:5368361'],
    ['Chicago','United States','America/Chicago','geo:4887398'],['Toronto','Canada','America/Toronto','geo:6167865'],
    ['Vancouver','Canada','America/Vancouver','geo:6173331'],['São Paulo','Brazil','America/Sao_Paulo','geo:3448439']
  ];
  const themes = [
  {
    "id": "midnight",
    "name": "Midnight Blue",
    "scheme": "dark",
    "colors": [
      "#020711",
      "#07111f",
      "#f8fbff",
      "#a6b1c5",
      "#193952",
      "#24dfff"
    ]
  },
  {
    "id": "daylight",
    "name": "Daylight",
    "scheme": "light",
    "colors": [
      "#f4f8fc",
      "#ffffff",
      "#17283c",
      "#51647c",
      "#cbd8e6",
      "#006776"
    ]
  },
  {
    "id": "gold",
    "name": "Gold",
    "scheme": "dark",
    "colors": [
      "#120f08",
      "#211a0e",
      "#fff8e8",
      "#cdbd9b",
      "#66502a",
      "#ffd16a"
    ]
  },
  {
    "id": "ocean",
    "name": "Ocean",
    "scheme": "dark",
    "colors": [
      "#031c2b",
      "#082e42",
      "#effbff",
      "#a3cbd9",
      "#23586a",
      "#61def4"
    ]
  },
  {
    "id": "violet",
    "name": "Violet",
    "scheme": "dark",
    "colors": [
      "#120d24",
      "#211736",
      "#faf5ff",
      "#c2afd9",
      "#57416f",
      "#ce9bff"
    ]
  },
  {
    "id": "emerald",
    "name": "Emerald",
    "scheme": "dark",
    "colors": [
      "#061b15",
      "#0d2c23",
      "#f0fff8",
      "#a5cabc",
      "#2c5c49",
      "#66e8ac"
    ]
  }
];
  const normalize = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const sameCity = (a,b) => a[3] && b[3] ? a[3] === b[3] : normalize(a[0]) === normalize(b[0]) && a[1] === b[1] && a[2] === b[2];
  const validCity = city => {
    if(!Array.isArray(city) || city.length < 3 || !city.slice(0,3).every(v=>typeof v==='string' && v.length>0 && v.length<=160)) return false;
    try { new Intl.DateTimeFormat('en-US',{timeZone:city[2]}); return true; } catch { return false; }
  };
  let cityIndexPromise;
  async function loadCityIndex() {
    if(!cityIndexPromise) cityIndexPromise = (async()=>{
      const response = await fetch('/assets/world-clock-cities.json', {signal:AbortSignal.timeout(15000)});
      if(!response.ok) throw new Error('City search unavailable');
      const rows = await response.json();
      if(!Array.isArray(rows)) throw new Error('Invalid city data');
      const names = typeof Intl.DisplayNames === 'function' ? new Intl.DisplayNames(['en'],{type:'region'}) : null;
      const countries = new Map();
      return rows.map(row=>{
        if(!countries.has(row[2])) countries.set(row[2],names ? names.of(row[2]) : row[2]);
        const country = countries.get(row[2]);
        const region = row[4] ? row[4] : '';
        return {city:[row[1],country,row[3],'geo:'+row[0]],region,
          search:normalize([row[1],row[5],country,row[2],region].join(' ')),name:normalize(row[1]),population:row[6]};
      });
    })().catch(error=>{cityIndexPromise = null; throw error;});
    return cityIndexPromise;
  }
  class WorldClock extends HTMLElement {
    constructor() {
      super(); this.attachShadow({mode:'open'});
      this.content = document.createElement('div');
      this.dialog = document.createElement('dialog');
      this.dialog.setAttribute('aria-label', 'World clock full screen');
      const shellStyle = document.createElement('style');
      shellStyle.textContent = `
        :host(:fullscreen){width:100%;height:100%;overflow:auto;background:var(--clock-bg,#020711)}
        dialog{position:fixed;inset:0;width:100%;height:100%;height:100dvh;max-width:none;max-height:none;margin:0;padding:0;border:0;background:var(--clock-bg,#020711);overflow:auto;overscroll-behavior:contain}
        dialog::backdrop{background:var(--clock-bg,#020711)}
        .expanded .widget{max-width:none;min-height:100vh;min-height:100dvh;border:0;border-radius:0;padding:max(20px,env(safe-area-inset-top)) max(20px,env(safe-area-inset-right)) max(20px,env(safe-area-inset-bottom)) max(20px,env(safe-area-inset-left))}
        .expanded .grid{grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr))}
        .expanded .time{font-size:clamp(28px,3vw,40px)}
        .expanded .clockrow{flex-wrap:wrap}
      `;
      this.shadowRoot.append(shellStyle, this.content, this.dialog);
      this.onFullscreenChange = () => this.syncFullscreen();
      this.onLanguageChange = () => this.render();
      this.dialog.addEventListener('close', () => this.restoreInline());
      this.selected = cities.slice(0,6); this.hour12 = true; this.theme = 'midnight';
      try {
        const saved = JSON.parse(localStorage.getItem('blockbrief-world-clock-v1'));
        if(saved && (Array.isArray(saved.locations) || Array.isArray(saved.zones))) {
          const stored = Array.isArray(saved.locations) ? saved.locations.filter(validCity).map(c=>c.slice(0,4)) : [...new Set(saved.zones)].map(zone=>cities.find(city=>city[2]===zone)).filter(Boolean);
          this.selected = stored.filter((c,i)=>stored.findIndex(other=>sameCity(c,other))===i);
          this.hour12 = saved.hour12 !== false;
          this.theme = themes.some(t => t.id === saved.theme) ? saved.theme : saved.light === true ? 'daylight' : 'midnight';
        }
      } catch {}
    }
    connectedCallback() {
      clearInterval(this.timer);
      document.addEventListener('fullscreenchange', this.onFullscreenChange);
      document.addEventListener('blockbrief-language-change', this.onLanguageChange);
      this.render(); this.timer = setInterval(() => this.tick(),1000);
    }
    disconnectedCallback() {
      clearInterval(this.timer);
      clearTimeout(this.searchTimer); this.searchVersion = (this.searchVersion || 0) + 1;
      document.removeEventListener('fullscreenchange', this.onFullscreenChange);
      document.removeEventListener('blockbrief-language-change', this.onLanguageChange);
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
      try { localStorage.setItem('blockbrief-world-clock-v1', JSON.stringify({locations:this.selected,zones:this.selected.map(city=>city[2]),hour12:this.hour12,theme:this.theme,light:this.theme==='daylight'})); } catch {}
    }
    applyTheme() {
      const theme = themes.find(t => t.id === this.theme) || themes[0];
      this.theme = theme.id;
      this.style.setProperty('--clock-bg', theme.colors[0]);
      const widget = this.shadowRoot.querySelector('.widget');
      if(widget) widget.dataset.theme = theme.id;
    }
    async searchCities() {
      clearTimeout(this.searchTimer);
      const version = this.searchVersion = (this.searchVersion || 0) + 1;
      const input = this.shadowRoot.querySelector('#city');
      const query = normalize(input.value);
      this.searchQuery = input.value;
      const status = this.shadowRoot.querySelector('#city-status');
      const results = this.shadowRoot.querySelector('#city-results');
      results.replaceChildren();
      if(query.length < 2) { status.textContent = 'Type at least 2 letters, then choose a matching city.'; return; }
      status.textContent = 'Searching cities…';
      const words = query.split(/\s+/);
      const local = cities.map(city=>({city,region:'',name:normalize(city[0]),search:normalize(city.join(' ')),population:0}));
      let index = [], failed = false;
      try { index = await loadCityIndex(); } catch { failed = true; }
      if(version !== this.searchVersion || !this.isConnected) return;
      const candidates = [...local,...index].filter(r=>words.every(word=>r.search.includes(word)));
      const rank = r => r.name === query ? 0 : r.name.startsWith(query) ? 1 : 2;
      candidates.sort((a,b)=>rank(a)-rank(b) || b.population-a.population);
      const found = [];
      for(const candidate of candidates) {
        if(found.some(r=>sameCity(r.city,candidate.city))) continue;
        found.push(candidate); if(found.length === 12) break;
      }
      status.textContent = failed ? 'Worldwide search is temporarily unavailable. Showing matching saved choices; press Search to retry.' : found.length ? 'Choose a city below. Add a country or region to narrow your search.' : 'No matching cities found. Try another spelling or a nearby city.';
      for(const result of found) {
        const row = document.createElement('li');
        const button = document.createElement('button'); button.type = 'button'; button.className = 'city-result';
        const added = this.selected.some(city=>sameCity(city,result.city));
        // Geographic names are always rendered as text, never HTML.
        const title = document.createElement('span'); title.textContent = result.city[0];
        const detail = document.createElement('small'); detail.textContent = [result.city[1],result.region,result.city[2]].filter(Boolean).join(' · ');
        const action = document.createElement('span'); action.className = 'result-action'; action.textContent = added ? 'Added' : '+ Add';
        const label = document.createElement('span'); label.append(title,detail);
        button.append(label,action); button.disabled = added;
        button.setAttribute('aria-label', (added ? 'Already added: ' : 'Add ') + [result.city[0],result.city[1],result.region].filter(Boolean).join(', '));
        button.onclick = () => {
          if(!validCity(result.city)) { status.textContent='This browser does not recognize that time zone. Try a nearby city.'; return; }
          if(this.selected.some(city=>sameCity(city,result.city))) return;
          this.selected.push(result.city); this.searchQuery=''; this.saveSettings(); this.render();
          this.shadowRoot.querySelector('#city-status').textContent = result.city[0] + ' added.';
          this.shadowRoot.querySelector('#city').focus({preventScroll:true});
        };
        row.append(button); results.append(row);
      }
    }
    render() {
      clearTimeout(this.searchTimer); this.searchVersion = (this.searchVersion || 0) + 1;
      this.content.innerHTML = `<style>
        :host{display:block;color-scheme:dark;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
        *{box-sizing:border-box}.widget{--bg:#020711;--card:#07111f;--ink:#f8fbff;--muted:#a6b1c5;--line:#193952;--accent:#24dfff;background:var(--bg);color:var(--ink);padding:clamp(18px,4vw,30px);border:1px solid var(--line);border-radius:22px;max-width:1180px;margin:auto}
        .widget[data-theme="midnight"]{--bg:#020711;--card:#07111f;--ink:#f8fbff;--muted:#a6b1c5;--line:#193952;--accent:#24dfff;color-scheme:dark}
        .widget[data-theme="daylight"]{--bg:#f4f8fc;--card:#ffffff;--ink:#17283c;--muted:#51647c;--line:#cbd8e6;--accent:#006776;color-scheme:light}
        .widget[data-theme="gold"]{--bg:#120f08;--card:#211a0e;--ink:#fff8e8;--muted:#cdbd9b;--line:#66502a;--accent:#ffd16a;color-scheme:dark}
        .widget[data-theme="ocean"]{--bg:#031c2b;--card:#082e42;--ink:#effbff;--muted:#a3cbd9;--line:#23586a;--accent:#61def4;color-scheme:dark}
        .widget[data-theme="violet"]{--bg:#120d24;--card:#211736;--ink:#faf5ff;--muted:#c2afd9;--line:#57416f;--accent:#ce9bff;color-scheme:dark}
        .widget[data-theme="emerald"]{--bg:#061b15;--card:#0d2c23;--ink:#f0fff8;--muted:#a5cabc;--line:#2c5c49;--accent:#66e8ac;color-scheme:dark}
        header,.tools,.bottom{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap}
        .eyebrow{font-size:10px;font-weight:750;letter-spacing:.18em;color:var(--accent);margin:0 0 6px}.clock-brand{display:flex;align-items:center;gap:9px;letter-spacing:.04em;font-size:13px;margin-bottom:10px}.clock-brand img{width:30px;height:30px;object-fit:contain;flex-shrink:0}h2{font-size:25px;letter-spacing:-.7px;margin:0}.sub{font-size:12px;color:var(--muted);margin:7px 0 0}
        button,select,input{font:inherit;font-size:12px;border:1px solid var(--line);border-radius:9px;background:var(--card);color:var(--ink);padding:10px 12px;min-height:42px}button{cursor:pointer}button:hover{border-color:var(--accent)}button:focus-visible,select:focus-visible,input:focus-visible{outline:2px solid var(--accent);outline-offset:3px}.tools{gap:7px}.theme-control{display:flex;align-items:center;gap:8px;color:var(--muted)}.theme-control select{width:145px;cursor:pointer}
        .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));gap:12px;margin:24px 0 18px}.card{position:relative;border:1px solid var(--line);background:var(--card);border-radius:14px;padding:18px;min-width:0}.city{font-size:16px;font-weight:700;margin:0;padding-right:30px}.country{font-size:11px;color:var(--muted);margin:4px 0 16px;min-height:15px}.remove{position:absolute;top:8px;right:8px;border:0;padding:4px 10px;font-size:21px;color:var(--muted);background:transparent;min-width:40px}.clockrow{display:flex;align-items:center;gap:12px;flex-wrap:wrap}.face{width:62px;height:62px;flex-shrink:0;color:var(--accent)}.face circle{stroke:var(--line)}.time{font-variant-numeric:tabular-nums;font-size:25px;letter-spacing:-.8px;white-space:nowrap;line-height:1.2}.date,.zone{font-size:11px;color:var(--muted);margin-top:6px}.zone{border-top:1px solid var(--line);padding-top:12px;margin-top:16px;display:flex;justify-content:space-between;gap:8px}.period{color:var(--accent)}.bottom{font-size:11px;color:var(--muted)}form{display:flex;gap:8px;flex-wrap:wrap;align-items:center}label{font-size:12px}select{max-width:100%;width:160px}.empty{font-size:14px;color:var(--muted)}
        .city-search{width:100%;max-width:660px}.city-search form{margin:0}.city-search input{flex:1;min-width:130px;width:230px;font-size:16px}.city-search label{font-size:13px}.city-status{font-size:12px;color:var(--muted);margin:10px 0;min-height:18px}.city-results{list-style:none;padding:0;margin:0;display:grid;gap:7px;max-height:330px;overflow-y:auto;overscroll-behavior:contain}.city-result{display:flex;justify-content:space-between;align-items:center;gap:12px;width:100%;text-align:left;min-height:56px}.city-result span{min-width:0;overflow-wrap:anywhere}.city-result small{display:block;color:var(--muted);font-size:11px;margin-top:4px}.result-action{flex-shrink:0;color:var(--accent)}.city-result:disabled{opacity:.65;cursor:default}.data-credit{font-size:11px;margin:10px 0 0;color:var(--muted)}.data-credit a{color:var(--accent)}
        @media(max-width:440px){h2{font-size:22px}.widget{padding:16px}.tools{width:100%}.time{font-size:28px}.bottom{align-items:flex-start;flex-direction:column}}
      </style>
      <section class="widget" data-theme="${this.theme}" aria-label="World clock">
        <header><div><p class="eyebrow clock-brand"><img src="/blockbrief-digital-icon.png" alt="" width="30" height="30"><span>BlockBriefNews</span></p><h2>World clock</h2><p class="sub">Track the time across the cities you follow.</p></div><div class="tools"><button id="format" aria-label="Use ${this.hour12?'24':'12'}-hour time">${this.hour12?'12':'24'}-hour</button><div class="theme-control"><label for="theme">Theme</label><select id="theme">${themes.map(t=>`<option value="${t.id}"${t.id===this.theme?' selected':''}>${t.name}</option>`).join('')}</select></div><button id="fullscreen" type="button" aria-label="Open world clock full screen" aria-pressed="false">Full screen</button></div></header>
        <div class="grid"></div>
        <div class="bottom"><div class="city-search"><form role="search" aria-label="Find a world clock city"><label for="city">Add city</label><input id="city" type="search" placeholder="Type a city, e.g. General Santos" maxlength="100" autocomplete="off" aria-describedby="city-status"><button type="submit">Search</button></form><p id="city-status" class="city-status" role="status">Type at least 2 letters, then choose a matching city.</p><ul id="city-results" class="city-results" aria-label="Matching cities"></ul><p class="data-credit">City data: <a href="https://www.geonames.org/" target="_blank" rel="noopener noreferrer">GeoNames</a></p></div><span>Time from your device · Updates every second</span></div>
      </section>`;
      const grid=this.shadowRoot.querySelector('.grid');
      this.views=this.selected.map(city=>{
        const card=document.createElement('article');card.className='card';
        card.innerHTML=`<h3 class="city"></h3><p class="country"></p><button class="remove" type="button">×</button><div class="clockrow"><svg class="face" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="30" fill="none" stroke-width="1.5"/><path d="M32 5v4M59 32h-4M32 59v-4M5 32h4" stroke="currentColor" stroke-width="1.5"/><line class="hour" x1="32" y1="32" x2="32" y2="18" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><line class="minute" x1="32" y1="32" x2="32" y2="11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="32" cy="32" r="2.5" fill="currentColor"/></svg><div><div class="time"></div><div class="date"></div></div></div><div class="zone"><span class="offset"></span><span class="period"></span></div>`;
        card.querySelector('.city').textContent=city[0];card.querySelector('.country').textContent=city[1];
        const remove=card.querySelector('.remove');remove.setAttribute('aria-label',`Remove ${city[0]}`);
        remove.onclick=()=>{this.selected=this.selected.filter(c=>c!==city);this.saveSettings();this.render();this.shadowRoot.querySelector('#city').focus();};
        grid.append(card);
        return {card,time:new Intl.DateTimeFormat(document.documentElement.lang || 'en-US',{timeZone:city[2],hour:'2-digit',minute:'2-digit',hour12:this.hour12}),date:new Intl.DateTimeFormat(document.documentElement.lang || 'en-US',{timeZone:city[2],weekday:'short',month:'short',day:'numeric'}),parts:new Intl.DateTimeFormat('en-GB',{timeZone:city[2],hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23',timeZoneName:'shortOffset'})};
      });
      if(!this.views.length){const empty=document.createElement('p');empty.className='empty';empty.textContent='Add a city to see its local time.';grid.append(empty);}
      const input = this.shadowRoot.querySelector('#city');
      input.value = this.searchQuery || '';
      input.addEventListener('input',()=>{
        this.searchQuery = input.value;
        this.searchVersion = (this.searchVersion || 0) + 1;
        clearTimeout(this.searchTimer);
        this.shadowRoot.querySelector('#city-results').replaceChildren();
        this.shadowRoot.querySelector('#city-status').textContent = input.value.trim().length < 2 ? 'Type at least 2 letters, then choose a matching city.' : 'Searching cities…';
        this.searchTimer = setTimeout(()=>this.searchCities(),250);
      });
      this.shadowRoot.querySelector('form').onsubmit=e=>{e.preventDefault();this.searchCities();};
      if(input.value.trim().length >= 2) this.searchCities();
      this.shadowRoot.querySelector('#format').onclick=()=>{this.hour12=!this.hour12;this.saveSettings();this.render();this.shadowRoot.querySelector('#format').focus();};
      this.shadowRoot.querySelector('#theme').onchange=e=>{this.theme=e.target.value;this.applyTheme();this.saveSettings();};
      this.shadowRoot.querySelector('#fullscreen').onclick=()=>this.toggleFullscreen();
      this.applyTheme();
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
