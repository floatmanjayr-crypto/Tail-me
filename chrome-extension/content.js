console.log('🦊 TAIL ME IS WORKING!');
alert('Tail Me loaded!');

// Create floating tail immediately
const tail = document.createElement('div');
tail.innerHTML = '🦊';
tail.style.cssText = 'position:fixed!important;bottom:30px!important;right:30px!important;width:60px!important;height:60px!important;background:red!important;border-radius:50%!important;display:flex!important;align-items:center!important;justify-content:center!important;font-size:30px!important;z-index:2147483647!important;cursor:pointer!important;';
tail.onclick = () => alert('Tail clicked!');
document.body.appendChild(tail);
console.log('🦊 Tail added to page!');
