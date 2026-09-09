(() => {
  'use strict';
  const dictionary = {
    'Skip to content':['跳转到正文','Saltar al contenido'],
    'Refresh unavailable. Showing previously loaded headlines.':['暂时无法刷新，正在显示此前加载的新闻。','No se pudo actualizar. Se muestran los titulares cargados anteriormente.'],
    'Read the original report →':['阅读原始报道 →','Leer la noticia original →'],
    'World Clock':['世界时钟','Reloj mundial'], 'World clock':['世界时钟','Reloj mundial'], 'Main navigation':['主导航','Navegación principal'],
    'Track the time across the cities you follow.':['查看您关注的城市时间。','Consulta la hora de las ciudades que sigues.'],
    'Theme':['主题','Tema'], 'Midnight Blue':['午夜蓝','Azul medianoche'], 'Daylight':['日光','Luz del día'], 'Gold':['金色','Dorado'], 'Ocean':['海洋','Océano'], 'Violet':['紫罗兰','Violeta'], 'Emerald':['翡翠绿','Esmeralda'],
    '12-hour':['12小时制','12 horas'], '24-hour':['24小时制','24 horas'], 'Use 24-hour time':['使用24小时制','Usar formato de 24 horas'], 'Use 12-hour time':['使用12小时制','Usar formato de 12 horas'],
    'Full screen':['全屏','Pantalla completa'], 'Exit full screen':['退出全屏','Salir de pantalla completa'],
    'World clock full screen':['世界时钟全屏','Reloj mundial en pantalla completa'], 'Open world clock full screen':['全屏打开世界时钟','Abrir reloj mundial en pantalla completa'], 'Exit world clock full screen':['退出世界时钟全屏','Salir del reloj mundial en pantalla completa'],
    'Add city':['添加城市','Añadir ciudad'], 'Search':['搜索','Buscar'], 'Find a world clock city':['查找世界时钟城市','Buscar una ciudad para el reloj'], 'Matching cities':['匹配的城市','Ciudades coincidentes'],
    'Type a city, e.g. General Santos':['输入城市，例如 General Santos','Escribe una ciudad, p. ej. General Santos'],
    'Type at least 2 letters, then choose a matching city.':['输入至少2个字符，然后选择匹配的城市。','Escribe al menos 2 caracteres y elige una ciudad.'],
    'Searching cities…':['正在搜索城市…','Buscando ciudades…'],
    'Choose a city below. Add a country or region to narrow your search.':['请选择下方城市。添加国家或地区可缩小搜索范围。','Elige una ciudad. Añade un país o región para acotar la búsqueda.'],
    'No matching cities found. Try another spelling or a nearby city.':['未找到匹配的城市。请尝试其他拼写或附近城市。','No se encontraron ciudades. Prueba otra forma de escribir el nombre o una ciudad cercana.'],
    'Worldwide search is temporarily unavailable. Showing matching saved choices; press Search to retry.':['全球搜索暂不可用。当前显示匹配的预设城市；点击搜索重试。','La búsqueda mundial no está disponible. Se muestran opciones guardadas; pulsa Buscar para reintentar.'],
    'This browser does not recognize that time zone. Try a nearby city.':['此浏览器无法识别该时区。请尝试附近城市。','Este navegador no reconoce esa zona horaria. Prueba una ciudad cercana.'],
    'Added':['已添加','Añadida'], '+ Add':['+ 添加','+ Añadir'], 'Add a city to see its local time.':['添加城市以查看当地时间。','Añade una ciudad para ver su hora local.'],
    'City data:':['城市数据：','Datos de ciudades:'], 'Time from your device · Updates every minute':['时间来自您的设备 · 每分钟更新','Hora de tu dispositivo · Se actualiza cada minuto'],
    'Daytime hours':['白天','Horario diurno'], 'Nighttime hours':['夜间','Horario nocturno'],
    'FRIED Crypto. Built by the community. Powered by the community. Visit crispyfriedchicken.net (opens in a new tab)':['FRIED 加密货币。由社区共建，由社区驱动。访问 crispyfriedchicken.net（在新标签页打开）','FRIED Crypto. Creado e impulsado por la comunidad. Visita crispyfriedchicken.net (se abre en otra pestaña)'],
    'Bitcoin':['比特币','Bitcoin'], 'Ethereum':['以太坊','Ethereum'], 'Solana':['Solana','Solana'],
    'Markets':['市场','Mercados'], 'Regulation':['监管','Regulación'], 'Sources':['新闻来源','Fuentes'],
    'bitcoin':['比特币','Bitcoin'], 'ethereum':['以太坊','Ethereum'], 'solana':['Solana','Solana'], 'markets':['市场','Mercados'], 'regulation':['监管','Regulación'],
    'Independent Crypto News':['独立加密货币新闻','Noticias cripto independientes'],
    'Crypto news.':['加密货币新闻。','Noticias cripto.'], 'Without the noise.':['远离喧嚣。','Sin ruido.'],
    'Live crypto headlines, market moves, regulation and infrastructure updates — with links back to original reporting.':['实时加密货币新闻、市场动态、监管及基础设施更新，附原始报道链接。','Titulares cripto en tiempo real, movimientos del mercado, regulación e infraestructura, con enlaces a las fuentes originales.'],
    'Auto-refreshing':['自动刷新','Actualización automática'], 'Original sources':['原始来源','Fuentes originales'], 'No hype':['拒绝炒作','Sin exageraciones'],
    'Loading…':['加载中…','Cargando…'], 'Price unavailable':['价格暂不可用','Precio no disponible'], '24h change unavailable':['24小时涨跌幅暂不可用','Variación de 24 h no disponible'],
    'Top Stories':['焦点新闻','Noticias destacadas'], 'Latest News':['最新新闻','Últimas noticias'],
    'Open a BlockBrief brief for a concise overview, then verify the full story with the original publisher.':['阅读 BlockBrief 简报了解要点，再前往原始发布方核实完整报道。','Abre un resumen de BlockBrief y consulta la noticia completa en la fuente original.'],
    'Loading top stories…':['正在加载焦点新闻…','Cargando noticias destacadas…'], 'Top stories temporarily unavailable.':['焦点新闻暂不可用。','Las noticias destacadas no están disponibles temporalmente.'],
    'Fetching the latest crypto headlines…':['正在获取最新加密货币新闻…','Buscando los últimos titulares cripto…'], 'Refreshing headlines…':['正在刷新新闻…','Actualizando titulares…'],
    'Loading live headlines…':['正在加载实时新闻…','Cargando titulares en tiempo real…'], 'Live feed temporarily unavailable.':['实时新闻暂不可用。','El feed no está disponible temporalmente.'],
    'No matching headlines right now.':['目前没有符合条件的新闻。','No hay titulares que coincidan en este momento.'],
    'All':['全部','Todas'], 'Refresh now':['立即刷新','Actualizar ahora'],
    'Open BlockBrief brief →':['阅读 BlockBrief 简报 →','Abrir resumen de BlockBrief →'], 'Read original ↗':['阅读原文 ↗','Leer original ↗'], 'Read original →':['阅读原文 →','Leer original →'],
    'Trusted Sources':['新闻来源','Fuentes de información'],
    'BlockBrief links back to the original publisher for verification and full context.':['BlockBrief 提供原始发布方链接，方便核实信息并了解完整背景。','BlockBrief enlaza al editor original para verificar la información y conocer el contexto completo.'],
    'About BlockBrief':['关于 BlockBrief','Acerca de BlockBrief'],
    'Independent crypto-news aggregation and digital intelligence':['独立加密货币新闻聚合与数字资讯','Agregación independiente de noticias cripto e información digital'],
    'Important crypto news should be easy to find and easy to verify. BlockBrief provides concise summaries and always links readers to the original reporting.':['重要的加密货币新闻应当易于查找和核实。BlockBrief 提供简明摘要，并始终附上原始报道链接。','Las noticias cripto importantes deben ser fáciles de encontrar y verificar. BlockBrief ofrece resúmenes breves y siempre enlaza a la información original.'],
    '© 2026 BlockBrief News · Crypto News Without the Noise':['© 2026 BlockBrief News · 远离喧嚣的加密货币新闻','© 2026 BlockBrief News · Noticias cripto sin ruido'],
    '© 2026 BlockBrief · Crypto News Without the Noise':['© 2026 BlockBrief · 远离喧嚣的加密货币新闻','© 2026 BlockBrief · Noticias cripto sin ruido'],
    '← All news':['← 全部新闻','← Todas las noticias'], '← Return to BlockBrief':['← 返回 BlockBrief','← Volver a BlockBrief'],
    'Bitcoin news':['比特币新闻','Noticias de Bitcoin'], 'Ethereum news':['以太坊新闻','Noticias de Ethereum'], 'Solana news':['Solana 新闻','Noticias de Solana'],
    'Crypto markets news':['加密货币市场新闻','Noticias del mercado cripto'], 'Crypto regulation news':['加密货币监管新闻','Noticias de regulación cripto'],
    'Live Bitcoin headlines, price-moving developments, regulation and infrastructure updates — all linked to original reporting.':['实时比特币新闻、影响价格的动态、监管和基础设施更新，均附原始报道链接。','Titulares de Bitcoin, novedades que afectan al precio, regulación e infraestructura, con enlaces a las fuentes originales.'],
    'Live Ethereum headlines, protocol developments, regulation and market updates — all linked to original reporting.':['实时以太坊新闻、协议进展、监管和市场更新，均附原始报道链接。','Titulares de Ethereum, avances del protocolo, regulación y mercados, con enlaces a las fuentes originales.'],
    'Live Solana headlines, ecosystem growth, protocol developments and market updates — all linked to original reporting.':['实时 Solana 新闻、生态发展、协议进展和市场更新，均附原始报道链接。','Titulares de Solana, crecimiento del ecosistema, avances del protocolo y mercados, con enlaces a las fuentes originales.'],
    'Live market-moving crypto headlines, ETFs, exchange developments and major price events — all linked to original reporting.':['实时加密货币市场新闻、ETF、交易所动态和重大价格事件，均附原始报道链接。','Noticias cripto que mueven el mercado, ETF, novedades de exchanges y precios, con enlaces a las fuentes originales.'],
    'Live digital asset regulation, enforcement, legislation and policy developments — with links to original reporting and official sources.':['实时数字资产监管、执法、立法和政策动态，附原始报道及官方来源链接。','Novedades sobre regulación, medidas legales, legislación y políticas de activos digitales, con enlaces a fuentes originales y oficiales.'],
    'Loading story…':['正在加载报道…','Cargando noticia…'], 'Original reporting':['原始报道','Información original'],
    "BlockBrief summarizes and organizes headlines. Read the publisher's original report for complete context, updates and supporting details.":['BlockBrief 汇总并整理新闻。请阅读发布方的原始报道，了解完整背景、后续更新和相关详情。','BlockBrief resume y organiza los titulares. Lee la noticia del editor original para conocer el contexto completo, las actualizaciones y los detalles.'],
    'BlockBrief does not republish the full article and does not replace the original publisher.':['BlockBrief 不转载完整文章，也不替代原始发布方。','BlockBrief no reproduce el artículo completo ni sustituye al editor original.'],
    'This story is no longer in the current live feed.':['这篇报道已不在当前实时新闻列表中。','Esta noticia ya no está en el feed actual.'],
    'AD':['广告','ANUNCIO'], 'Built by the community. Powered by the community.':['由社区共建，由社区驱动。','Creado por la comunidad. Impulsado por la comunidad.'],
    'Explore FRIED →':['了解 FRIED →','Descubre FRIED →'], 'Pause':['暂停','Pausar'], 'Resume':['继续','Reanudar'],
    'Pause scrolling FRIED advertisement':['暂停滚动 FRIED 广告','Pausar el anuncio de FRIED'], 'Resume scrolling FRIED advertisement':['继续滚动 FRIED 广告','Reanudar el anuncio de FRIED'],
    'FRIED advertisement':['FRIED 广告','Anuncio de FRIED'], 'Crypto news topics':['加密货币新闻主题','Temas de noticias cripto'], 'BlockBrief home':['BlockBrief 首页','Inicio de BlockBrief'],
    'Publisher headlines and articles remain in their original language.':['发布方的新闻标题和文章保留原文语言。','Los titulares y artículos de los editores se mantienen en su idioma original.']
  };
  const topics = {Bitcoin:['比特币','Bitcoin'], Ethereum:['以太坊','Ethereum'], Solana:['Solana','Solana'], market:['市场','mercados'], regulation:['监管','regulación']};
  for (const [topic, names] of Object.entries(topics)) {
    dictionary[`Loading ${topic} headlines…`] = [`正在加载${names[0]}新闻…`, `Cargando noticias de ${names[1]}…`];
    dictionary[`No ${topic} headlines right now. Check back shortly.`] = [`目前没有${names[0]}新闻，请稍后再查看。`, `No hay noticias de ${names[1]} en este momento. Vuelve pronto.`];
  }
  const supported = ['en','zh-CN','es'];
  let locale = 'en';
  try { const saved = localStorage.getItem('blockbrief-language'); if (supported.includes(saved)) locale = saved; } catch {}
  const nav = document.querySelector('.site-header .nav');
  if (!nav) return;
  const control = document.createElement('label');
  control.className = 'language-control';
  control.innerHTML = '<span aria-hidden="true">🌐</span><select aria-label="Language / 语言 / Idioma"><option value="en" lang="en">English</option><option value="zh-CN" lang="zh-CN">简体中文</option><option value="es" lang="es">Español</option></select>';
  nav.appendChild(control);
  const select = control.querySelector('select');
  select.value = locale;
  const feed = document.querySelector('#newsGrid, #grid, #story');
  const note = document.createElement('p');
  note.className = feed?.id === 'story' ? 'language-note wrap' : 'language-note';
  note.textContent = 'Publisher headlines and articles remain in their original language.';
  if (feed) feed.before(note);
  const texts = new WeakMap(), attributes = new WeakMap();
  // Publisher headlines and summaries are not UI strings and must stay intact.
  const skip = 'script,style,.language-control,.card h2,.card h3,.card p,.lead h2,.lead p,.mini h3,.story h1,.summary';
  function translate(value) {
    if (locale === 'en') return value;
    const i = locale === 'zh-CN' ? 0 : 1;
    const trimmed = value.trim().replace(/\s+/g, ' ');
    if (dictionary[trimmed]) return value.replace(value.trim(), dictionary[trimmed][i]);
    if (trimmed.startsWith('▤') || trimmed.startsWith('⚡')) {
      const label = trimmed.slice(1).trim();
      if (dictionary[label]) return trimmed[0] + ' ' + dictionary[label][i];
    }
    if (/^Live headlines · updated /.test(trimmed)) return trimmed.replace('Live headlines · updated ', i === 0 ? '实时新闻 · 更新于 ' : 'Noticias en directo · Actualizado a las ');
    if (/^Read original at .+ →$/.test(trimmed)) return trimmed.replace('Read original at ', i === 0 ? '阅读原文：' : 'Leer original en ');
    if (/^[+-]?[\d.]+% 24h$/.test(trimmed)) return trimmed.replace('24h', i === 0 ? '24小时' : '24 h');
    if (/^(Remove |Already added: |Add )/.test(trimmed)) return trimmed.replace(/^(Remove |Already added: |Add )/, p => ({'Remove ':['移除 ','Quitar '],'Already added: ':['已添加：','Ya añadida: '],'Add ':['添加 ','Añadir ']}[p][i]));
    if (/ added\.$/.test(trimmed)) return trimmed.replace(' added.', i === 0 ? ' 已添加。' : ': ciudad añadida.');
    return value.replace(/\b(\d+)([mhd]) ago\b/g, (_, n, unit) => i === 0 ? `${n}${{m:'分钟',h:'小时',d:'天'}[unit]}前` : `hace ${n} ${{m:'min',h:'h',d:'d'}[unit]}`);
  }
  function updateText(node) {
    if (node.parentElement?.closest(skip)) return;
    const previous = texts.get(node);
    const source = previous && node.nodeValue === previous.output ? previous.source : node.nodeValue;
    const output = translate(source);
    if (node.nodeValue !== output) node.nodeValue = output;
    texts.set(node, {source, output});
  }
  const observer = new MutationObserver(() => { if (!queued) { queued = true; requestAnimationFrame(apply); } });
  let queued = false;
  function apply() {
    queued = false;
    observer.disconnect();
    document.documentElement.lang = locale;
    note.hidden = locale === 'en';
    const roots = [document.body, ...Array.from(document.querySelectorAll('world-clock-widget')).map(el => el.shadowRoot).filter(Boolean)];
    for (const root of roots) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) updateText(walker.currentNode);
    for (const el of root.querySelectorAll('[aria-label], [placeholder]')) {
      if (el.closest('.language-control')) continue;
      for (const attr of ['aria-label', 'placeholder']) {
      if (!el.hasAttribute(attr)) continue;
      const cache = attributes.get(el) || {};
      const value = el.getAttribute(attr), previous = cache[attr];
      const source = previous && value === previous.output ? previous.source : value;
      const output = translate(source);
      if (value !== output) el.setAttribute(attr, output);
      cache[attr] = {source, output}; attributes.set(el, cache);
      }
    }
    observer.observe(root, {subtree:true, childList:true, characterData:true, attributes:true, attributeFilter:['aria-label','placeholder']});
    }
  }
  function changeLanguage() {
    document.documentElement.lang = locale;
    document.dispatchEvent(new CustomEvent('blockbrief-language-change'));
    apply();
  }
  select.addEventListener('change', () => {
    locale = supported.includes(select.value) ? select.value : 'en';
    try { localStorage.setItem('blockbrief-language', locale); } catch {}
    changeLanguage();
  });
  changeLanguage();
})();
