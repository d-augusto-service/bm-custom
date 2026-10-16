/* B’M Custom — front-end (cabeçalho/rodapé, loja, produto, carrinho, checkout). Preços e stock vêm SEMPRE do servidor. */
(async()=>{'use strict';
const $=(s,e=document)=>e.querySelector(s),$$=(s,e=document)=>[...e.querySelectorAll(s)];
const E=(t,p={},k=[])=>{const{aria,...r}=p,e=Object.assign(document.createElement(t),r);if(aria)e.setAttribute('aria-label',aria);e.append(...k);return e};
const kz=n=>String(n).replace(/\B(?=(\d{3})+(?!\d))/g,'.')+' Kz';
const DAT=window.DADOS,PR=window.PRODUTOS.filter(p=>p.publicado).map(p=>({...p,preco_final:p.preco_promo??p.preco}));
const nrm=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const api=async(u,b)=>{ // versão sem servidor: lê os dados de dados.js e produtos.js
  if(u==='/api/definicoes')return DAT;
  if(u.startsWith('/api/produtos/')){const p=PR.find(x=>x.slug===decodeURIComponent(u.slice(14)));if(!p)throw new Error('Produto não encontrado.');return p}
  if(u.startsWith('/api/produtos')){const f=Object.fromEntries(new URLSearchParams(u.split('?')[1]||''));
    return PR.filter(p=>(!f.cat||p.categoria===f.cat)&&(!f.q||nrm(p.nome+' '+p.descricao).includes(nrm(f.q)))&&(!f.min||p.preco_final>=+f.min)&&(!f.max||p.preco_final<=+f.max)
      &&(!f.tam||p.variantes.some(v=>v.tamanho===f.tam&&(!f.disp||v.stock>0)))&&(!f.cor||p.variantes.some(v=>v.cor===f.cor&&(!f.disp||v.stock>0)))&&(!f.disp||p.variantes.some(v=>v.stock>0)))}
  if(u==='/api/carrinho')return b.itens.map(({v,q})=>{const p=PR.find(x=>x.variantes.some(y=>y.id===v)),y=p&&p.variantes.find(z=>z.id===v);
    if(!y)throw new Error('Produto indisponível.');return{v,nome:p.nome,slug:p.slug,tamanho:y.tamanho,cor:y.cor,imagem:p.imagens[0]||null,preco:p.preco_final,q,stock:y.stock,ok:y.stock>=q}});
  throw new Error('Pedido inválido.')};
const page=document.body.dataset.page,Q=new URLSearchParams(location.search),IMG='assets/images/';
const CATS={virgens:'Camisetas virgens',personalizadas:'Camisetas personalizadas','marca-propria':'Camisetas da marca própria'};
const tt=$('#toast');let tm;const toast=t=>{tt.textContent=t;tt.classList.add('show');clearTimeout(tm);tm=setTimeout(()=>tt.classList.remove('show'),2400)};
addEventListener('error',e=>{if(e.target.tagName==='IMG')e.target.classList.add('x')},true);
let cart=[];try{cart=JSON.parse(localStorage.getItem('bm-carrinho'))||[]}catch(e){}
const save=()=>{try{localStorage.setItem('bm-carrinho',JSON.stringify(cart))}catch(e){}badge()};
const badge=()=>{const n=cart.reduce((a,i)=>a+i.q,0),b=$('#bdg');if(b){b.textContent=n;b.hidden=!n}};
let D={zonas:[],taxa_entrega:0,tamanhos:[],cores:[],promocao:{}};try{D=await api('/api/definicoes')}catch(e){}
const wa=t=>D.whatsapp_indicativo?`https://wa.me/${D.whatsapp_indicativo}${D.whatsapp}?text=${encodeURIComponent(t)}`:null; // só existe depois de confirmar o indicativo
const svg=d=>`<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`,cur=page==='produto'?'loja':page;
$('#hdr').outerHTML=`${D.promocao.ativa?`<div class="promo"><a href="${D.promocao.link||'loja.html'}"><strong>${D.promocao.titulo||''}</strong> ${D.promocao.texto||''}</a></div>`:''}<header class="hdr"><div class="c hin"><a class="logo" href="index.html" aria-label="B’M Custom - Início"><img src="${IMG}marca/logotipo.png" alt="B’M Custom" width="150" height="50"></a>
<nav class="nav" id="nav" aria-label="Principal"><a href="index.html"${cur==='index'?' aria-current="page"':''}>Início</a><a href="loja.html"${cur==='loja'?' aria-current="page"':''}>Loja</a><a href="index.html#categorias">Categorias</a></nav>
<button class="ib" id="st" type="button" aria-label="Pesquisar" aria-expanded="false" aria-controls="sf">${svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>')}</button>
<a class="ib" href="carrinho.html" aria-label="Carrinho">${svg('<path d="M6 7h13l-1.5 8H8z"/><path d="M6 7 5 3H2"/><circle cx="9" cy="20" r="1"/><circle cx="17" cy="20" r="1"/>')}<span class="bdg" id="bdg">0</span></a>
<button class="ib bg" id="bg" type="button" aria-label="Abrir menu" aria-expanded="false" aria-controls="nav">${svg('<path d="M4 7h16M4 12h16M4 17h16"/>')}</button></div>
<div class="sf" id="sf"><div class="c"><form action="loja.html" role="search"><label class="sr" for="hq">Pesquisar</label><input id="hq" name="q" type="search" placeholder="Pesquisar camisetas..."><button class="btn">Pesquisar</button></form></div></div></header>`;
const w=wa('Olá! Gostaria de falar com a B’M Custom.');
$('#ftr').outerHTML=`<footer><div class="c"><div class="fg"><div><img src="${IMG}marca/logotipo.png" alt="B’M Custom"><p><strong>Veste a tua ideia.</strong></p></div>
<div><h3>Loja</h3><ul><li><a href="loja.html">Todas as camisetas</a></li><li><a href="carrinho.html">Carrinho</a></li></ul></div>
<div><h3>Entregas</h3><p class="mut">${D.zonas.join(' e ')||'Zonas por definir'} · ${kz(D.taxa_entrega||0)}${D.horario?' · '+D.horario:''}</p>${D.regras_mesmo_dia?`<p class="mut">${D.regras_mesmo_dia}</p>`:''}${w?`<p><a href="${w}" target="_blank" rel="noopener noreferrer"><strong>Falar no WhatsApp</strong></a></p>`:''}</div></div>
<p class="cp">© ${new Date().getFullYear()} B’M Custom. Todos os direitos reservados.</p></div></footer>`;
badge();const nav=$('#nav'),bg=$('#bg'),sf=$('#sf'),st=$('#st');
const setNav=o=>{nav.classList.toggle('open',o);bg.setAttribute('aria-expanded',o)},setSf=o=>{sf.classList.toggle('open',o);st.setAttribute('aria-expanded',o);if(o)$('#hq').focus()};
bg.onclick=()=>setNav(!nav.classList.contains('open'));st.onclick=()=>setSf(!sf.classList.contains('open'));nav.onclick=e=>{if(e.target.closest('a'))setNav(false)};
addEventListener('keydown',e=>{if(e.key==='Escape'){setNav(false);setSf(false)}});

const empty=(t,d,a)=>E('div',{className:'empty'},[E('h3',{textContent:t}),E('p',{className:'mut',textContent:d}),...(a?[a]:[])]);
const link=(h,t,o)=>E('a',{className:'btn'+(o?' o':''),href:h,textContent:t});
const card=p=>{const em=p.variantes.length&&!p.variantes.some(v=>v.stock>0);
  return E('a',{className:'card',href:'produto.html?s='+encodeURIComponent(p.slug)},[E('div',{className:'ph'},[...(p.imagens[0]?[E('img',{src:p.imagens[0],alt:p.nome,loading:'lazy',width:480,height:600})]:[]),...(em?[E('span',{className:'tag',textContent:'Esgotado'})]:p.novo?[E('span',{className:'tag',textContent:'Novo'})]:[])]),
  E('h3',{textContent:p.nome}),E('p',{className:'pr'},[p.preco_final?kz(p.preco_final):'Preço em breve',...(p.preco_promo!=null?[E('s',{textContent:kz(p.preco)})]:[])])])};
const errBox=(el,e)=>el.replaceChildren(empty('Não foi possível carregar',e.message,link('loja.html','Voltar à loja',1)));

if(page==='index'){
  const cg=$('#cg');Object.entries(CATS).forEach(([k,n])=>cg.append(E('a',{className:'cat',href:'loja.html?cat='+k},[E('img',{src:IMG+'categorias/'+k+'.jpg',alt:'',loading:'lazy',width:400,height:300}),E('span',{textContent:n})])));
  try{const ps=await api('/api/produtos'),d=ps.filter(p=>p.destaque),l=(d.length?d:ps).slice(0,4);const g=$('#dest');
    l.length?l.forEach(p=>g.append(card(p))):g.append(empty('Coleção em breve','Os produtos aparecem aqui assim que forem publicados no painel.'))}catch(e){errBox($('#dest'),e)}
}
if(page==='loja'){
  const f=$('#fl'),g=$('#grid'),c=$('#cnt');
  f.cat.append(...Object.entries(CATS).map(([k,n])=>E('option',{value:k,textContent:n})));f.tam.append(...D.tamanhos.map(x=>E('option',{value:x,textContent:x})));f.cor.append(...D.cores.map(x=>E('option',{value:x,textContent:x})));
  f.q.value=Q.get('q')||'';f.cat.value=Q.get('cat')||'';
  const draw=async()=>{const p=new URLSearchParams();[...new FormData(f)].forEach(([k,v])=>{if(v)p.set(k,v)});
    try{const ps=await api('/api/produtos?'+p);g.replaceChildren();c.textContent=ps.length+(ps.length===1?' produto':' produtos');
      if(!ps.length){const b=E('button',{type:'button',className:'btn o',textContent:'Limpar filtros'});b.onclick=()=>{f.reset();draw()};g.append(empty('Nenhum produto encontrado','Experimente outros filtros ou limpe a pesquisa.',b))}else ps.forEach(x=>g.append(card(x)))}catch(e){errBox(g,e)}};
  f.oninput=draw;f.onsubmit=e=>{e.preventDefault();draw()};f.onreset=()=>setTimeout(draw);draw();
}
if(page==='produto'){
  const el=$('#prod');let p;try{p=await api('/api/produtos/'+encodeURIComponent(Q.get('s')||''))}catch(e){errBox(el,e)}
  if(p){document.title=p.nome+' | B’M Custom';const vs=p.variantes;let tam='',cor='',q=1;
    const pic=E('div',{className:'ph'}),show=s=>pic.replaceChildren(E('img',{src:s,alt:p.nome,width:800,height:1000}));if(p.imagens[0])show(p.imagens[0]);
    const th=p.imagens.length>1?E('div',{className:'th'},p.imagens.map((s,i)=>{const b=E('button',{type:'button',aria:'Ver foto '+(i+1)},[E('img',{src:s,alt:'',width:64,height:64})]);b.setAttribute('aria-pressed',i===0);b.onclick=()=>{show(s);$$('button',th).forEach(x=>x.setAttribute('aria-pressed',x===b))};return b})):'';
    const av=(t,c)=>vs.some(v=>(!t||v.tamanho===t)&&(!c||v.cor===c)&&v.stock>0),cv=()=>vs.find(v=>v.tamanho===tam&&v.cor===cor);
    const tams=[...new Set(vs.map(v=>v.tamanho))],cores=[...new Set(vs.map(v=>v.cor))],box=E('div'),msg=E('p',{className:'msg',role:'status'}),out=E('output',{textContent:1});
    const add=E('button',{className:'btn',type:'button',textContent:'Adicionar ao carrinho'});
    const grp=(lab,list,get,set,ok)=>E('fieldset',{},[E('legend',{textContent:lab}),E('div',{className:'opt'},list.map(v=>{const b=E('button',{type:'button',textContent:v,disabled:!ok(v)});b.setAttribute('aria-pressed',get()===v);b.onclick=()=>{set(get()===v?'':v);q=1;out.textContent=1;paint()};return b}))]);
    const paint=()=>{const v=cv();box.replaceChildren(grp('Tamanho',tams,()=>tam,x=>tam=x,x=>av(x,cor)),grp('Cor',cores,()=>cor,x=>cor=x,x=>av(tam,x)));
      msg.className='msg';msg.textContent=v?(v.stock>0?(v.stock<=5?'Restam '+v.stock+' em stock.':'Em stock.'):'Esgotado.'):(tam&&cor?'Combinação não disponível.':'Escolha o tamanho e a cor.');add.disabled=!v||v.stock<1};
    const mk=(t,d,l)=>{const b=E('button',{type:'button',textContent:t,aria:l});b.onclick=()=>{const v=cv();q=Math.min(v?v.stock:1,Math.max(1,q+d));out.textContent=q};return b};
    add.onclick=()=>{const v=cv();if(!v||v.stock<1)return;const x=cart.find(i=>i.v===v.id);const n=Math.min(v.stock,(x?x.q:0)+q);x?x.q=n:cart.push({v:v.id,q:n});save();msg.className='msg ok';msg.textContent='Adicionado ao carrinho.';toast('Adicionado ao carrinho')};
    const w2=wa(`Olá! Tenho uma dúvida sobre "${p.nome}" (${location.href}).`);
    paint();el.append(E('div',{},[pic,th]),E('div',{},[E('small',{className:'mut',textContent:CATS[p.categoria]}),E('h1',{textContent:p.nome}),E('p',{className:'pr',style:'font-size:1.4rem;margin:.5rem 0'},[p.preco_final?kz(p.preco_final):'Preço em breve',...(p.preco_promo!=null?[E('s',{textContent:kz(p.preco)})]:[])]),
      ...(p.descricao?[E('p',{className:'mut',textContent:p.descricao})]:[]),box,E('div',{className:'acts'},[E('div',{className:'qty'},[mk('−',-1,'Diminuir quantidade'),out,mk('+',1,'Aumentar quantidade')]),add]),msg,
      E('p',{className:'mut',textContent:'Entrega em '+(D.zonas.join(' e ')||'zonas por definir')+' · '+kz(D.taxa_entrega||0)+'.'}),...(w2?[E('a',{className:'btn o',href:w2,target:'_blank',rel:'noopener noreferrer',textContent:'Dúvidas? WhatsApp'})]:[])]));}
}
const PAG=window.PAGAMENTO||{metodos:{}},MET=Object.entries(PAG.metodos||{}).map(([id,m])=>({id,...m}));
const novoCodigo=()=>{const A='ABCDEFGHJKMNPQRSTUVWXYZ23456789';let r='';try{r=[...crypto.getRandomValues(new Uint8Array(6))].map(b=>A[b%A.length]).join('')}catch(x){for(let i=0;i<6;i++)r+=A[Math.floor(Math.random()*A.length)]}return'BM-'+r};
const copiar=async t=>{try{await navigator.clipboard.writeText(t);return true}catch(x){const a=E('textarea',{value:t});a.style.cssText='position:fixed;opacity:0';document.body.append(a);a.select();let ok=false;try{ok=document.execCommand('copy')}catch(y){}a.remove();return ok}};
const resolver=async()=>(await Promise.all(cart.map(i=>api('/api/carrinho',{itens:[i]}).then(r=>r[0]).catch(()=>null)))); // item que já não existe vem como null
if(page==='carrinho'||page==='checkout'){
  const el=$('#cart'),draw=async()=>{
    const ls=await resolver(),gone=ls.filter(l=>!l).length;cart=cart.filter((i,n)=>ls[n]);save();const L=ls.filter(Boolean);el.replaceChildren();
    if(!L.length){el.append(empty('O carrinho está vazio','Explore a loja e escolha as suas camisetas.',link('loja.html','Explorar coleção')));if(page==='checkout')$('#co').hidden=true;return}
    const sub=L.reduce((a,l)=>a+l.preco*l.q,0),tot=sub+D.taxa_entrega,bad=L.some(l=>!l.ok);
    const upd=(i,d)=>{i.q=Math.min(99,i.q+d);if(i.q<1)cart.splice(cart.indexOf(i),1);save();draw()};
    const rows=E('ul',{className:'rows'},L.map(l=>{const i=cart.find(x=>x.v===l.v),b=(t,d,a)=>{const x=E('button',{type:'button',textContent:t,aria:a});x.onclick=()=>upd(i,d);return x},rm=E('button',{type:'button',className:'rm',textContent:'Remover',aria:'Remover '+l.nome});rm.onclick=()=>upd(i,-99);
      return E('li',{className:'row'},[E('div',{className:'ph'},l.imagem?[E('img',{src:l.imagem,alt:'',width:72,height:72})]:[]),E('div',{className:'rd'},[E('a',{href:'produto.html?s='+l.slug,textContent:l.nome}),E('small',{className:'mut',textContent:l.tamanho+' · '+l.cor+' · '+kz(l.preco)}),...(l.ok?[]:[E('small',{className:'err',textContent:'Stock insuficiente: restam '+l.stock+'.'})])]),
        ...(page==='carrinho'?[E('div',{className:'qty'},[b('−',-1,'Diminuir'),E('output',{textContent:l.q}),b('+',1,'Aumentar')]),rm]:[E('span',{textContent:l.q+'×'})]),E('strong',{textContent:kz(l.preco*l.q)})])}));
    const s=E('div',{className:'sum'},[E('div',{},[E('span',{textContent:'Subtotal'}),E('span',{textContent:kz(sub)})]),E('div',{},[E('span',{textContent:'Entrega'}),E('span',{textContent:kz(D.taxa_entrega)})]),E('div',{className:'tot'},[E('span',{textContent:'Total'}),E('span',{textContent:kz(tot)})]),
      ...(gone?[E('p',{className:'err',textContent:'Alguns produtos já não estão disponíveis e foram removidos.'})]:[]),...(page==='carrinho'?[bad?E('p',{className:'err',textContent:'Ajuste as quantidades acima para continuar.'}):E('a',{className:'btn',href:'checkout.html',textContent:'Finalizar encomenda'}),link('loja.html','Continuar a comprar',1)]:[])]);
    if(page==='carrinho')el.append(rows,E('div',{style:'margin-top:1.5rem'},[s]));else{el.append(rows,s);const z=$('#fz');if(z.options.length<2)z.append(...D.zonas.map(x=>E('option',{value:x,textContent:x})));$('#go').disabled=bad}
  };
  await draw();
  if(page==='checkout'){
    const pm=$('#pm');
    MET.forEach(m=>pm.append(E('label',{className:'pmc'},[E('input',{type:'radio',name:'metodo',value:m.id,required:true}),E('span',{},[E('strong',{textContent:m.nome}),E('small',{className:'mut',textContent:m.descricao||''})])])));
    if(!MET.length)pm.append(E('p',{className:'err',textContent:'Métodos de pagamento indisponíveis de momento. Contacte-nos pelo WhatsApp.'}));
    $('#co').onsubmit=async e=>{e.preventDefault();const m=$('#cm'),v=Object.fromEntries(new FormData(e.target)),ls=(await resolver()).filter(Boolean);
      if(!ls.length||ls.some(l=>!l.ok)){m.className='msg err';m.textContent='Reveja o carrinho: há produtos indisponíveis.';return}
      if(!/^\+?\d{9,15}$/.test(String(v.telefone).replace(/[\s-]/g,''))){m.className='msg err';m.textContent='Número de telefone inválido.';return}
      if(!Object.hasOwn(PAG.metodos||{},v.metodo||'')){m.className='msg err';m.textContent='Escolha um método de pagamento.';return}
      const sub=ls.reduce((a,l)=>a+l.preco*l.q,0),cod=novoCodigo();
      const enc={codigo:cod,metodo:v.metodo,itens:ls.map(l=>({nome:l.nome,tamanho:l.tamanho,cor:l.cor,q:l.q,preco:l.preco})),subtotal:sub,entrega:D.taxa_entrega,total:sub+D.taxa_entrega,nome:v.nome,telefone:v.telefone,zona:v.zona,endereco:v.endereco,obs:v.obs||'',criado:new Date().toISOString()};
      try{localStorage.setItem('bm-enc-'+cod,JSON.stringify(enc))}catch(x){m.className='msg err';m.textContent='Não foi possível guardar a encomenda neste navegador. Desative o modo privado ou contacte-nos pelo WhatsApp.';return}
      cart=[];save();location.href='confirmacao.html?c='+encodeURIComponent(cod)};
  }
}
if(page==='confirmacao'){
  const el=$('#cf'),cod=Q.get('c')||'-';let e=null;try{e=JSON.parse(localStorage.getItem('bm-enc-'+cod)||'null')}catch(x){}
  const w0=wa('Olá, B’M Custom! Fiz uma encomenda no site'+(cod!=='-'?' (código '+cod+')':'')+'.');
  if(!e||!e.itens)el.append(empty('Encomenda não encontrada neste dispositivo','Esta página só funciona no mesmo telemóvel ou computador onde a encomenda foi feita. Se já fez o pedido, fale connosco pelo WhatsApp com o código da encomenda.',w0?E('a',{className:'btn',href:w0,target:'_blank',rel:'noopener noreferrer',textContent:'Falar pelo WhatsApp'}):link('loja.html','Voltar à loja',1)));
  else{
    const guardar=()=>{try{localStorage.setItem('bm-enc-'+cod,JSON.stringify(e))}catch(x){}};
    const draw=()=>{
      const p=(PAG.metodos||{})[e.metodo],mostrar=PAG.mostrarDados!==false,row=(k,v,x)=>E('div',{className:'kv'},[E('span',{className:'mut',textContent:k}),E('strong',{textContent:v,className:x||''})]);
      const msg='Olá, B’M Custom!\n\nQuero fazer esta encomenda.\n\nCódigo da encomenda: '+e.codigo+'\n'+e.itens.map(i=>'- '+i.q+'x '+i.nome+' ('+i.tamanho+', '+i.cor+') — '+kz(i.preco*i.q)).join('\n')+'\nSubtotal: '+kz(e.subtotal)+'\nEntrega: '+kz(e.entrega)+'\nTotal: '+kz(e.total)+'\nMétodo de pagamento: '+(p?p.nome:'-')+'\n\nNome: '+e.nome+'\nTelefone: '+e.telefone+'\nZona: '+e.zona+'\nEndereço: '+e.endereco+(e.obs?'\nObs: '+e.obs:'')+'\n\nVou enviar o comprovativo do pagamento nesta conversa.\nObrigado!';
      const w3=wa(msg),dados=p?(mostrar?'Titular: '+PAG.titular+'\nMétodo: '+p.nome+'\n'+p.campo+': '+p.valor+'\nValor a pagar: '+kz(e.total)+'\nCódigo da encomenda: '+e.codigo:''):'';
      const fb=E('p',{className:'msg',role:'status'});
      const sw=MET.length>1?E('div',{className:'opt',role:'group',aria:'Mudar o método de pagamento'},MET.map(m=>{const b=E('button',{type:'button',textContent:m.nome});b.setAttribute('aria-pressed',m.id===e.metodo);b.onclick=()=>{if(m.id===e.metodo)return;e.metodo=m.id;guardar();draw()};return b})):null;
      const kids=[E('h1',{textContent:'Quase lá! Falta enviar o pedido'}),E('p',{className:'pr',style:'font-size:1.4rem',textContent:'Código: '+e.codigo}),
        E('p',{className:'mut',textContent:'O pedido só chega à B’M Custom quando o enviares pelo WhatsApp (botão abaixo).'}),
        E('h2',{textContent:'Instruções de pagamento',style:'margin:1rem 0 0'})];
      if(sw)kids.push(E('p',{className:'mut',textContent:'Método escolhido (podes mudar sem recomeçar):'}),sw);
      if(p){
        kids.push(E('div',{className:'payb'},[row('Método',p.nome),...(mostrar?[row('Titular',PAG.titular),row(p.campo,p.valor,'big')]:[]),row('Valor a pagar',kz(e.total),'big'),row('Código da encomenda',e.codigo)]));
        kids.push(mostrar?E('ol',{className:'steps'},(p.passos||[]).map(t=>E('li',{textContent:t}))):E('p',{textContent:'Os dados para o pagamento (titular e '+p.campo+') são enviados por WhatsApp, depois de enviares o pedido.'}));
      }
      kids.push(E('div',{className:'attn',role:'note'},[E('strong',{textContent:'ATENÇÃO'}),
        E('p',{textContent:'1. Envia o pedido pelo WhatsApp. Só assim a B’M Custom recebe a tua encomenda.'}),
        E('p',{textContent:'2. Depois de pagares, envia o comprovativo na mesma conversa, com o código da encomenda.'}),
        E('p',{textContent:'3. O pagamento só é considerado confirmado depois de verificarmos a entrada do dinheiro. A disponibilidade e a entrega são confirmadas por chamada ou mensagem.'}),
        E('p',{textContent:'4. Guarda o código da tua encomenda até à conclusão da entrega.'})]));
      const acts=[];
      if(w3)acts.push(E('a',{className:'btn',href:w3,target:'_blank',rel:'noopener noreferrer',textContent:'Enviar pedido pelo WhatsApp'}));
      if(dados){const cp=E('button',{type:'button',className:'btn o',textContent:'Copiar dados de pagamento'});cp.onclick=async()=>{const ok=await copiar(dados);fb.className='msg '+(ok?'ok':'err');fb.textContent=ok?'Dados de pagamento copiados com sucesso.':'Não foi possível copiar automaticamente. Selecione os dados e copie manualmente.';if(ok)toast('Dados de pagamento copiados.')};acts.push(cp)}
      acts.push(link('loja.html','Continuar a comprar',1));
      kids.push(fb,E('div',{className:'acts'},acts));
      el.replaceChildren(...kids)};
    draw();
  }
}
})();
