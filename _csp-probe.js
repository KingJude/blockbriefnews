document.getElementById('allowed').textContent='Allowed script: passed';
document.addEventListener('securitypolicyviolation',e=>{const item=document.createElement('li');item.textContent=e.effectiveDirective+': '+e.blockedURI;document.getElementById('violations').append(item)});
try{new Function('return 1')();document.getElementById('eval').textContent='Dynamic evaluation: FAILED'}catch{document.getElementById('eval').textContent='Dynamic evaluation: blocked'}
document.getElementById('try-handler').addEventListener('click',()=>{document.getElementById('attempt').textContent='Handler click: attempted'});
