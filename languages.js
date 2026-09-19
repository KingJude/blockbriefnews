(() => {
  'use strict';
  const dictionary = {
    "Reading guide":["阅读指南", "Guía de lectura"],
    "What to check in a headline":["阅读新闻时应核实什么", "Qué comprobar en una noticia"],
    "Primary reference:":["一手参考资料：", "Referencia primaria:"],
    "Explore related coverage":["浏览相关报道", "Explora noticias relacionadas"],
    "Follow overlapping stories across assets, markets and policy.":["关注资产、市场和政策之间相互关联的新闻。", "Sigue noticias que conectan activos, mercados y políticas."],
    "Reading Bitcoin headlines":["如何阅读比特币新闻", "Cómo leer las noticias de Bitcoin"],
    "Bitcoin coverage spans BTC trading, mining, payments and policy. Mining confirms pending transactions in blocks; an exchange price move measures a different kind of activity. Read the original report to see which part of the Bitcoin story a headline describes.":["比特币报道涵盖 BTC 交易、挖矿、支付和政策。挖矿通过将待处理交易纳入区块来确认交易；交易所价格的变化则反映另一类活动。阅读原始报道，了解标题具体涉及比特币的哪个方面。", "La cobertura de Bitcoin abarca la compraventa de BTC, la minería, los pagos y las políticas. La minería confirma transacciones pendientes en bloques; un cambio de precio en un exchange refleja otro tipo de actividad. Lee la fuente original para identificar de qué trata el titular."],
    "Bitcoin transaction basics":["比特币交易基础", "Fundamentos de las transacciones de Bitcoin"],
    "For price and ETF headlines, check the currency, measurement period and publication time.":["阅读价格和 ETF 新闻时，核对计价货币、统计区间和发布时间。", "En noticias de precios y ETF, comprueba la moneda, el período de medición y la hora de publicación."],
    "For network updates, distinguish a proposal from a change that is already active.":["阅读网络更新时，区分提案与已经生效的变更。", "En actualizaciones de la red, distingue una propuesta de un cambio ya activo."],
    "Use the markets and regulation pages to follow the wider context around BTC.":["通过市场和监管页面，了解 BTC 相关事件的更广泛背景。", "Consulta las páginas de mercados y regulación para entender el contexto de BTC."],
    "Reading Ethereum headlines":["如何阅读以太坊新闻", "Cómo leer las noticias de Ethereum"],
    "An Ethereum headline may concern the mainnet, a layer 2 network or an application. Layer 2 systems process transactions outside mainnet, and their security models can differ. Identify the network before comparing activity, fees or an upgrade announcement.":["以太坊新闻可能涉及主网、二层网络或应用。二层系统在主网之外处理交易，其安全模型可能各不相同。在比较活动量、费用或升级公告前，先确定报道涉及哪个网络。", "Una noticia de Ethereum puede referirse a la red principal, una red de capa 2 o una aplicación. Los sistemas de capa 2 procesan transacciones fuera de la red principal y sus modelos de seguridad pueden variar. Identifica la red antes de comparar actividad, comisiones o anuncios de actualización."],
    "Ethereum scaling documentation":["以太坊扩容文档", "Documentación sobre escalabilidad de Ethereum"],
    "Check whether an upgrade is proposed, being tested or active on the network named in the report.":["核对升级是处于提案、测试阶段，还是已在报道所述网络上启用。", "Comprueba si la actualización está propuesta, en pruebas o activa en la red mencionada."],
    "For fee comparisons, look for the transaction type, network and observation period.":["比较费用时，注意交易类型、所在网络和观察区间。", "Al comparar comisiones, revisa el tipo de transacción, la red y el período observado."],
    "Separate protocol developments from ETH trading and broader market commentary.":["区分协议进展、ETH 交易动态和更广泛的市场评论。", "Distingue los avances del protocolo de la compraventa de ETH y los comentarios generales del mercado."],
    "Reading Solana headlines":["如何阅读 Solana 新闻", "Cómo leer las noticias de Solana"],
    "Solana reporting can cover the network, SOL trading or individual applications and tokens. A transaction can contain several instructions, so transaction counts and individual actions are not interchangeable. Check what an activity figure actually measures before comparing reports.":["Solana 报道可能涉及网络、SOL 交易或具体应用和代币。一笔交易可以包含多条指令，因此交易笔数与单个操作的数量不能直接等同。比较报道之前，先核实活动数据具体衡量的是什么。", "La información sobre Solana puede tratar de la red, la compraventa de SOL o aplicaciones y tokens concretos. Una transacción puede contener varias instrucciones, por lo que el número de transacciones no equivale al de acciones individuales. Comprueba qué mide cada cifra antes de comparar noticias."],
    "Solana transaction documentation":["Solana 交易文档", "Documentación sobre transacciones de Solana"],
    "For activity and performance claims, look for the measurement period and whether transactions succeeded or failed.":["阅读活动量和性能相关说法时，查看统计区间，以及交易是成功还是失败。", "En datos de actividad y rendimiento, revisa el período y si las transacciones tuvieron éxito o fallaron."],
    "Identify whether an announcement comes from the network, an application team or an exchange.":["确认公告来自网络方面、应用团队还是交易所。", "Identifica si el anuncio procede de la red, del equipo de una aplicación o de un exchange."],
    "For token stories, verify the named asset and original source instead of relying on a ticker alone.":["阅读代币新闻时，核实资产名称和原始来源，不要只依据交易代码。", "En noticias de tokens, verifica el activo y la fuente original; no te guíes solo por el símbolo."],
    "Putting crypto market moves in context":["理解加密货币市场变化的背景", "Cómo contextualizar los movimientos del mercado cripto"],
    "Price, trading volume and market capitalization describe different aspects of a market. Compare reports using the same asset, quote currency and time window. A 24-hour change describes a past interval; it does not establish what will happen next.":["价格、交易量和市值反映市场的不同方面。比较报道时，应采用相同的资产、计价货币和时间区间。24 小时变化描述的是过去一段时间的情况，并不能确定接下来会发生什么。", "El precio, el volumen negociado y la capitalización describen aspectos distintos del mercado. Compara informes sobre el mismo activo, moneda de cotización e intervalo. La variación de 24 horas describe un período pasado; no determina lo que ocurrirá después."],
    "CoinGecko market data reference":["CoinGecko 市场数据参考", "Referencia de datos de mercado de CoinGecko"],
    "Check the data provider and update time when a headline quotes a price or percentage.":["标题引用价格或百分比时，核对数据提供方和更新时间。", "Comprueba el proveedor de datos y la hora de actualización cuando un titular cite precios o porcentajes."],
    "Distinguish an exchange or fund announcement from measured trading activity.":["区分交易所或基金的公告与实际统计的交易活动。", "Distingue los anuncios de exchanges o fondos de los datos de negociación observados."],
    "Follow asset-specific coverage for network context and regulation coverage for policy context.":["通过具体资产的新闻了解网络背景，通过监管新闻了解政策背景。", "Consulta las noticias de cada activo para el contexto de la red y las de regulación para el contexto normativo."],
    "Reading crypto policy and enforcement news":["如何阅读加密货币政策与执法新闻", "Cómo leer noticias sobre políticas y medidas regulatorias cripto"],
    "A policy headline needs a jurisdiction, an issuing authority and a date. Read the linked source to identify whether it describes a proposal, an adopted rule or an enforcement action. For U.S. securities rulemaking, the SEC publishes separate proposed and final rules.":["阅读政策新闻，需要明确司法管辖区、发布机构和日期。查阅链接中的原始来源，确认报道描述的是提案、已通过的规则还是执法行动。对于美国证券规则制定，SEC 分别发布拟议规则和最终规则。", "Una noticia sobre políticas necesita una jurisdicción, una autoridad emisora y una fecha. Lee la fuente enlazada para identificar si describe una propuesta, una norma adoptada o una medida de cumplimiento. En la regulación de valores de EE. UU., la SEC publica por separado las normas propuestas y las definitivas."],
    "SEC rules and regulations (United States)":["SEC 规则与法规（美国）", "Normas y reglamentos de la SEC (Estados Unidos)"],
    "Check the effective date and the activities or organizations named in the source.":["核对生效日期，以及来源中明确涉及的活动或机构。", "Comprueba la fecha de entrada en vigor y las actividades u organizaciones mencionadas en la fuente."],
    "Distinguish allegations from findings, and follow subsequent decisions or updates.":["区分指控与认定的事实，并关注后续裁决或更新。", "Distingue las alegaciones de los hechos determinados y sigue las decisiones o actualizaciones posteriores."],
    "Keep each jurisdiction in context; a development in one country does not establish the rules elsewhere.":["结合各司法管辖区的具体背景理解新闻；一个国家的动态并不能确定其他地区的规则。", "Ten en cuenta cada jurisdicción: una novedad en un país no determina las normas de otros lugares."],
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
