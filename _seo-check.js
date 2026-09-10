(async()=>{
 const checks=await Promise.all(['','bitcoin','ethereum','solana','markets','regulation'].map(async topic=>{
  const response=await fetch('/feed.xml'+(topic?'?topic='+topic:''));const body=await response.text();const doc=new DOMParser().parseFromString(body,'application/xml');const items=[...doc.querySelectorAll('item')];
  return {topic:topic||'all',status:response.status,mime:response.headers.get('content-type'),valid:!doc.querySelector('parsererror')&&!!doc.querySelector('rss channel'),items:items.length,newestFirst:items.every((x,i)=>!i||Date.parse(items[i-1].querySelector('pubDate').textContent)>=Date.parse(x.querySelector('pubDate').textContent)),matchingTopic:!topic||items.every(x=>[...x.querySelectorAll('category')].some(c=>c.textContent===topic))};
 }));document.getElementById('results').textContent=JSON.stringify(checks,null,2);
})().catch(e=>{document.getElementById('results').textContent=e.message});
