/* B’M Custom — painel do administrador.
   Fala diretamente com o Supabase (sem bibliotecas externas). Todo o texto que vem da base de dados
   é inserido com textContent, nunca como HTML. A segurança real está nas regras da base de dados (RLS). */
(() => {
'use strict';
const $ = (s, e = document) => e.querySelector(s);
const E = (t, p = {}, k = []) => { const { aria, ...r } = p, e = Object.assign(document.createElement(t), r); if (aria) e.setAttribute('aria-label', aria); e.append(...k.filter(x => x != null && x !== false)); return e; };
const kz = n => String(n ?? 0).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' Kz';
const digits = s => String(s || '').replace(/\D/g, '');
const CFG = window.SUPABASE || {}, BASE = String(CFG.url || '').replace(/\/+$/, '');
const KEY = 'bm-admin-sessao';
const CATS = { virgens: 'Camisetas virgens', personalizadas: 'Camisetas personalizadas', 'marca-propria': 'Camisetas da marca própria' };
const ESTADOS = ['nova', 'em preparação', 'em entrega', 'entregue', 'cancelada'];
const app = $('#app');
let S = null, DEF = null, PAGD = null, tab = 'encomendas', EMAIL = '';

/* ---------- sessão e pedidos ---------- */
const loadS = () => { try { S = JSON.parse(localStorage.getItem(KEY)); } catch (e) { S = null; } };
const saveS = () => { try { S ? localStorage.setItem(KEY, JSON.stringify(S)) : localStorage.removeItem(KEY); } catch (e) {} };
const raw = async (path, o = {}) => {
  const r = await fetch(BASE + path, { ...o, headers: { apikey: CFG.key, ...(o.headers || {}) } });
  const t = await r.text(); let d = null; try { d = t ? JSON.parse(t) : null; } catch (e) { d = t; }
  if (!r.ok) { const er = new Error((d && (d.message || d.msg || d.error_description || d.error)) || 'Erro ' + r.status); er.status = r.status; throw er; }
  return d;
};
const setS = d => { S = { access_token: d.access_token, refresh_token: d.refresh_token, expires_at: Date.now() + (d.expires_in || 3600) * 1000, email: (d.user && d.user.email) || (S && S.email) || '' }; saveS(); };
const refresh = async () => {
  if (!S) throw Object.assign(new Error('Sessão terminada.'), { status: 401 });
  try { setS(await raw('/auth/v1/token?grant_type=refresh_token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: S.refresh_token }) })); }
  catch (e) { S = null; saveS(); throw e; }
};
const authed = async (path, o = {}, retry = true) => {
  if (!S) throw Object.assign(new Error('Sessão terminada.'), { status: 401 });
  if (S.expires_at - Date.now() < 60000) await refresh();
  try { return await raw(path, { ...o, headers: { Authorization: 'Bearer ' + S.access_token, ...(o.headers || {}) } }); }
  catch (e) { if (e.status === 401 && retry) { await refresh(); return authed(path, o, false); } throw e; }
};
const rest = (p, o = {}) => authed('/rest/v1/' + p, { ...o, headers: { 'Content-Type': 'application/json', ...(o.headers || {}) } });
const rpc = (fn, args) => rest('rpc/' + fn, { method: 'POST', body: JSON.stringify(args) });
const logout = async () => { try { if (S) await authed('/auth/v1/logout', { method: 'POST' }, false); } catch (e) {} S = null; saveS(); DEF = PAGD = null; login(); };

let tt; const toast = (t, err) => { document.querySelectorAll('.tst').forEach(x => x.remove()); const n = E('div', { className: 'tst' + (err ? ' err' : ''), role: 'status', textContent: t }); document.body.append(n); clearTimeout(tt); tt = setTimeout(() => n.remove(), err ? 6000 : 2600); };
const fail = e => { if (e && e.status === 401) { S = null; saveS(); login('A sessão terminou. Entre outra vez.'); return; } toast(e && e.message ? e.message : 'Algo correu mal.', true); };
const slugify = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'produto';
const lista = t => [...new Set(String(t).split(/[\n,;]+/).map(x => x.trim()).filter(Boolean))];
const field = (label, input, hint) => E('div', {}, [E('label', { textContent: label }), input, hint ? E('small', { className: 'hint', textContent: hint }) : null]);

/* ---------- entrada ---------- */
function login(msg) {
  if (!BASE || !CFG.key) { app.replaceChildren(E('div', { className: 'box login' }, [E('h1', { textContent: 'Painel por ligar' }), E('p', { className: 'mut', textContent: 'Falta preencher o ficheiro js/config.js com o endereço e a chave do Supabase.' })])); return; }
  const m = E('p', { className: 'msg err', role: 'alert', textContent: msg || '' });
  const em = E('input', { type: 'email', required: true, autocomplete: 'username', value: EMAIL }), pw = E('input', { type: 'password', required: true, autocomplete: 'current-password' });
  const bt = E('button', { className: 'btn', type: 'submit', textContent: 'Entrar' });
  const f = E('form', { className: 'box login' }, [E('h1', { textContent: 'Painel B’M Custom' }), field('E-mail', em), field('Palavra-passe', pw), bt, m]);
  f.onsubmit = async e => {
    e.preventDefault(); bt.disabled = true; m.textContent = ''; EMAIL = em.value.trim();
    try { setS(await raw('/auth/v1/token?grant_type=password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: EMAIL, password: pw.value }) })); await entrar(); }
    catch (x) { m.textContent = /invalid login/i.test(x.message) ? 'E-mail ou palavra-passe incorretos.' : (x instanceof TypeError ? 'Sem ligação à internet.' : x.message); bt.disabled = false; }
  };
  app.replaceChildren(f); em.focus();
}

async function entrar() {
  try {
    const adm = await rest('admins?select=user_id');
    if (!Array.isArray(adm) || !adm.length) { S = null; saveS(); login('Esta conta não tem permissão de administrador.'); return; }
    const [d, p] = await Promise.all([rest('definicoes?select=dados&id=eq.1'), rest('pagamento?select=dados&id=eq.1')]);
    DEF = (d[0] && d[0].dados) || {}; PAGD = (p[0] && p[0].dados) || {};
    shell();
  } catch (e) { fail(e); if (S) login(e.message); }
}

/* ---------- estrutura ---------- */
function shell() {
  const nav = E('div', { className: 'tabs', role: 'tablist' });
  const body = E('div', { id: 'corpo' });
  const defs = [['encomendas', 'Encomendas'], ['produtos', 'Produtos'], ['definicoes', 'Definições']];
  const mark = () => nav.querySelectorAll('button').forEach(b => b.setAttribute('aria-current', b.dataset.t === tab));
  defs.forEach(([k, n]) => { const b = E('button', { type: 'button', textContent: n }); b.dataset.t = k; b.onclick = () => { tab = k; mark(); show(body); }; nav.append(b); });
  const sair = E('button', { className: 'btn o sm', type: 'button', textContent: 'Sair' }); sair.onclick = logout;
  app.replaceChildren(E('div', { className: 'top' }, [E('div', {}, [E('h1', { textContent: 'Painel B’M Custom' }), E('small', { textContent: S && S.email ? 'Sessão: ' + S.email : '' })]), E('div', { className: 'lin' }, [E('a', { className: 'btn o sm', href: '../index.html', target: '_blank', rel: 'noopener', textContent: 'Ver a loja' }), sair])]), nav, body);
  mark(); show(body);
}
const show = b => { b.replaceChildren(E('p', { className: 'mut', textContent: 'A carregar…' })); ({ encomendas: vEnc, produtos: vProd, definicoes: vDef })[tab](b).catch(fail); };

/* ---------- encomendas ---------- */
let fEstado = 'ativas', fBusca = '';
async function vEnc(b) {
  const lst = await rest('encomendas?select=*,itens(*),historico(*)&order=criado_em.desc&limit=300');
  const novas = lst.filter(e => e.estado === 'nova').length;
  const sel = E('select', { aria: 'Filtrar por estado' }, [['ativas', 'Por tratar'], ['todas', 'Todas'], ['pendente', 'Pagamento pendente'], ...ESTADOS.map(x => [x, x[0].toUpperCase() + x.slice(1)])].map(([v, t]) => E('option', { value: v, textContent: t, selected: v === fEstado })));
  const q = E('input', { type: 'search', placeholder: 'Procurar por código, nome ou telefone', value: fBusca, aria: 'Procurar' });
  const rf = E('button', { className: 'btn o sm', type: 'button', textContent: 'Atualizar' });
  const out = E('div');
  const filtra = e => (fEstado === 'todas' || (fEstado === 'ativas' ? !['entregue', 'cancelada'].includes(e.estado) : fEstado === 'pendente' ? e.estado_pagamento === 'pendente' && e.estado !== 'cancelada' : e.estado === fEstado))
    && (!fBusca || (e.codigo + ' ' + e.nome + ' ' + e.telefone).toLowerCase().includes(fBusca.toLowerCase()));
  const desenha = () => {
    const v = lst.filter(filtra);
    out.replaceChildren(...(v.length ? v.map(cartao) : [E('div', { className: 'box' }, [E('p', { className: 'mut', textContent: 'Sem encomendas neste filtro.' })])]));
  };
  const agir = async (id, estado, pag, ok) => { try { await rpc('admin_atualizar_encomenda', { p_id: id, p_estado: estado, p_pagamento: pag }); toast(ok); show(b); } catch (e) { fail(e); } };
  const cartao = e => {
    const sw = E('select', { aria: 'Estado da encomenda', disabled: e.estado === 'cancelada' }, ESTADOS.map(x => E('option', { value: x, textContent: x[0].toUpperCase() + x.slice(1), selected: x === e.estado })));
    sw.onchange = () => {
      if (sw.value === 'cancelada' && !confirm('Cancelar a encomenda ' + e.codigo + '? O stock volta ao produto e não é possível reabrir.')) { sw.value = e.estado; return; }
      agir(e.id, sw.value, null, 'Estado atualizado.');
    };
    const pago = E('button', { className: 'btn sm', type: 'button', textContent: 'Marcar pagamento recebido' });
    pago.onclick = () => { if (confirm('Confirma que o dinheiro da encomenda ' + e.codigo + ' (' + kz(e.total) + ') já entrou?')) agir(e.id, null, 'pago', 'Pagamento confirmado.'); };
    const tel = digits(e.telefone), indic = digits(DEF.whatsapp_indicativo || '244');
    const wnum = tel.length === 9 ? indic + tel : tel;
    const itens = (e.itens || []).slice().sort((a, c) => a.id - c.id);
    const hist = (e.historico || []).slice().sort((a, c) => a.id - c.id);
    return E('article', { className: 'box ped ' + e.estado }, [
      E('header', {}, [E('strong', { textContent: e.codigo + ' · ' + new Date(e.criado_em).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' }) }),
        E('span', { className: 'lin' }, [E('span', { className: 'bdgx' + (e.estado === 'nova' ? ' nova' : e.estado === 'cancelada' ? ' no' : e.estado === 'entregue' ? ' ok' : ''), textContent: e.estado }), E('span', { className: 'bdgx' + (e.estado_pagamento === 'pago' ? ' ok' : ''), textContent: e.estado_pagamento === 'pago' ? 'Pago' : 'Pagamento pendente' })])]),
      E('div', {}, [E('div', { textContent: e.nome }), E('div', { className: 'lin' }, [E('a', { href: 'tel:+' + wnum, textContent: e.telefone }), wnum ? E('a', { className: 'btn o sm', href: 'https://wa.me/' + wnum, target: '_blank', rel: 'noopener noreferrer', textContent: 'WhatsApp' }) : null]), E('div', { className: 'mut', textContent: e.zona + ' · ' + e.endereco }), e.obs ? E('div', { className: 'mut', textContent: 'Obs.: ' + e.obs }) : null]),
      E('ul', {}, itens.map(i => E('li', {}, [E('span', { textContent: i.qtd + '× ' + i.nome + ' (' + i.tamanho + ', ' + i.cor + ')' }), E('span', { textContent: kz(i.preco_unit * i.qtd) })]))),
      E('div', { className: 'lin', style: 'justify-content:space-between' }, [E('span', { className: 'mut', textContent: 'Entrega ' + kz(e.entrega) + ' · ' + ({ multicaixa: 'Multicaixa Express', paypay: 'PayPay África', iban: 'Transferência IBAN' }[e.metodo] || e.metodo) }), E('strong', { textContent: 'Total ' + kz(e.total) })]),
      E('div', { className: 'lin' }, [E('label', { textContent: 'Estado:' }), sw, e.estado_pagamento !== 'pago' && e.estado !== 'cancelada' ? pago : null]),
      hist.length ? E('details', {}, [E('summary', { className: 'mut', textContent: 'Histórico' }), E('ul', {}, hist.map(h => E('li', {}, [E('span', { textContent: h.evento }), E('small', { textContent: new Date(h.criado_em).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' }) })])))]) : null,
    ]);
  };
  sel.onchange = () => { fEstado = sel.value; desenha(); }; q.oninput = () => { fBusca = q.value.trim(); desenha(); }; rf.onclick = () => show(b);
  b.replaceChildren(E('h2', { textContent: 'Encomendas' + (novas ? ' · ' + novas + ' nova' + (novas > 1 ? 's' : '') : '') }), E('p', { className: 'hint', textContent: 'Quando o cliente paga, confira a entrada do dinheiro e carregue em “Marcar pagamento recebido”. Cancelar devolve o stock.' }), E('div', { className: 'bar' }, [sel, q, rf]), out);
  desenha();
}

/* ---------- produtos ---------- */
async function vProd(b) {
  const lst = await rest('produtos?select=id,nome,preco,preco_promo,imagens,publicado,categoria,variantes(stock)&order=id.desc');
  const nrel = {}; try { (await rest('produtos_relacionados?select=produto_id')).forEach(r => { nrel[r.produto_id] = (nrel[r.produto_id] || 0) + 1; }); } catch (e) { /* tabela ainda não criada */ }
  const novo = E('button', { className: 'btn', type: 'button', textContent: 'Novo produto' }); novo.onclick = () => editar(b, null);
  b.replaceChildren(E('div', { className: 'bar' }, [E('h2', { style: 'margin:0;flex:1', textContent: 'Produtos' }), novo]),
    ...(lst.length ? lst.map(p => {
      const total = (p.variantes || []).reduce((a, v) => a + v.stock, 0), img = (p.imagens || [])[0];
      const ed = E('button', { className: 'btn o sm', type: 'button', textContent: 'Editar' }); ed.onclick = () => editar(b, p.id);
      return E('div', { className: 'pl' }, [img ? E('img', { src: foto(img), alt: '', loading: 'lazy' }) : E('div', { className: 'nofoto' }),
        E('div', { className: 'info' }, [E('strong', { textContent: p.nome }), E('small', { textContent: (CATS[p.categoria] || p.categoria) + ' · ' + kz(p.preco_promo || p.preco) + (p.preco_promo ? ' (promoção)' : '') }), E('small', { textContent: 'Stock total: ' + total + (total === 0 ? ' — esgotado' : '') + ' · Relacionados: ' + (nrel[p.id] || 0) })]),
        E('span', { className: 'bdgx' + (p.publicado ? ' ok' : ''), textContent: p.publicado ? 'Visível' : 'Escondido' }), ed]);
    }) : [E('div', { className: 'box' }, [E('p', { className: 'mut', textContent: 'Ainda não há produtos.' })])]));
}
const foto = u => /^https:\/\//.test(u) ? u : '../' + u;

const reduzir = file => new Promise((res, rej) => {
  const img = new Image(), u = URL.createObjectURL(file);
  img.onload = () => { URL.revokeObjectURL(u); const k = Math.min(1, 1400 / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); c.toBlob(x => x ? res(x) : rej(new Error('Imagem inválida.')), 'image/jpeg', .85); };
  img.onerror = () => { URL.revokeObjectURL(u); rej(new Error('Não foi possível ler a imagem.')); };
  img.src = u;
});
const enviarFoto = async blob => {
  const caminho = 'p/' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8) + '.jpg';
  await authed('/storage/v1/object/produtos/' + caminho, { method: 'POST', headers: { 'Content-Type': 'image/jpeg', 'x-upsert': 'false' }, body: blob });
  return BASE + '/storage/v1/object/public/produtos/' + caminho;
};

async function editar(b, id) {
  let P = { id: null, nome: '', categoria: 'virgens', descricao: '', preco: 0, preco_promo: null, imagens: [], publicado: false, destaque: false, novo: false, variantes: [] };
  if (id) { const r = await rest('produtos?id=eq.' + id + '&select=*,variantes(*)'); if (!r[0]) { toast('Produto não encontrado.', true); return show(b); } P = r[0]; }
  const stock = {}; (P.variantes || []).forEach(v => { stock[v.tamanho + '|' + v.cor] = v.stock; });
  let fotos = [...(P.imagens || [])];
  const tams = [...new Set([...(DEF.tamanhos || []), ...(P.variantes || []).map(v => v.tamanho)])];
  const cores = [...new Set([...(DEF.cores || []), ...(P.variantes || []).map(v => v.cor)])];
  const nome = E('input', { value: P.nome, maxLength: 120, required: true }), cat = E('select', {}, Object.entries(CATS).map(([k, n]) => E('option', { value: k, textContent: n, selected: k === P.categoria })));
  const desc = E('textarea', { value: P.descricao, maxLength: 2000, rows: 4 });
  const preco = E('input', { type: 'number', min: 0, step: 1, inputMode: 'numeric', value: P.preco || '' }), promo = E('input', { type: 'number', min: 0, step: 1, inputMode: 'numeric', value: P.preco_promo || '', placeholder: 'sem promoção' });
  const ck = (t, v) => { const i = E('input', { type: 'checkbox', checked: !!v }); return [E('label', { className: 'ck' }, [i, t]), i]; };
  const [lPub, iPub] = ck('Visível na loja', P.publicado), [lDes, iDes] = ck('Destaque na página inicial', P.destaque), [lNov, iNov] = ck('Mostrar etiqueta “Novo”', P.novo);
  const fw = E('div', { className: 'fotos' });
  const pintaFotos = () => fw.replaceChildren(...fotos.map((u, i) => {
    const mv = (d, t, a) => { const x = E('button', { type: 'button', textContent: t, aria: a, disabled: i + d < 0 || i + d >= fotos.length }); x.onclick = () => { [fotos[i], fotos[i + d]] = [fotos[i + d], fotos[i]]; pintaFotos(); }; return x; };
    const rm = E('button', { type: 'button', textContent: '✕', aria: 'Remover fotografia' }); rm.onclick = () => { fotos.splice(i, 1); pintaFotos(); };
    return E('div', { className: 'foto' }, [E('img', { src: foto(u), alt: '' }), i === 0 ? E('span', { className: 'pri', textContent: 'Principal' }) : null, E('div', { className: 'lin' }, [mv(-1, '←', 'Mover para trás'), mv(1, '→', 'Mover para a frente'), rm])]);
  }));
  const file = E('input', { type: 'file', accept: 'image/*', multiple: true }), fm = E('small', { className: 'hint', textContent: 'A primeira fotografia é a principal. As imagens são reduzidas automaticamente.' });
  file.onchange = async () => {
    const fs = [...file.files]; if (!fs.length) return;
    if (fotos.length + fs.length > 10) { toast('No máximo 10 fotografias.', true); file.value = ''; return; }
    for (const [n, f] of fs.entries()) { fm.textContent = 'A enviar ' + (n + 1) + ' de ' + fs.length + '…'; try { fotos.push(await enviarFoto(await reduzir(f))); pintaFotos(); } catch (e) { fail(e); break; } }
    fm.textContent = 'A primeira fotografia é a principal. As imagens são reduzidas automaticamente.'; file.value = '';
  };
  const grelha = E('table', {}, [E('thead', {}, [E('tr', {}, [E('th', { textContent: 'Cor' }), ...tams.map(t => E('th', { textContent: t }))])]),
    E('tbody', {}, cores.map(c => E('tr', {}, [E('td', { textContent: c }), ...tams.map(t => { const i = E('input', { type: 'number', min: 0, max: 999999, step: 1, inputMode: 'numeric', value: stock[t + '|' + c] ?? '', aria: c + ' ' + t }); i.dataset.k = t + '|' + c; return E('td', {}, [i]); })])))]);
  const msg = E('p', { className: 'msg err', role: 'alert' });
  const guardar = E('button', { className: 'btn', type: 'button', textContent: 'Guardar produto' }), voltar = E('button', { className: 'btn o', type: 'button', textContent: 'Voltar' });
  voltar.onclick = () => show(b);
  const apagar = id ? E('button', { className: 'btn o', type: 'button', textContent: 'Apagar produto' }) : null;
  if (apagar) apagar.onclick = async () => { if (!confirm('Apagar “' + P.nome + '” para sempre? O histórico das encomendas mantém-se. Se só quer retirá-lo da loja, desmarque “Visível na loja”.')) return; try { await rest('produtos?id=eq.' + id, { method: 'DELETE' }); toast('Produto apagado.'); show(b); } catch (e) { fail(e); } };
  guardar.onclick = async () => {
    msg.textContent = '';
    const pr = Math.round(+preco.value || 0), pm = promo.value === '' ? null : Math.round(+promo.value);
    if (nome.value.trim().length < 2) { msg.textContent = 'Indique o nome do produto.'; return; }
    if (iPub.checked && pr < 1) { msg.textContent = 'Defina o preço antes de tornar o produto visível.'; return; }
    if (pm != null && (pm < 1 || pm >= pr)) { msg.textContent = 'O preço de promoção tem de ser inferior ao preço normal.'; return; }
    const variantes = []; grelha.querySelectorAll('input').forEach(i => { if (i.value !== '') { const [t, c] = i.dataset.k.split('|'); variantes.push({ tamanho: t, cor: c, stock: Math.max(0, Math.round(+i.value || 0)) }); } });
    if (iPub.checked && !variantes.length) { msg.textContent = 'Indique o stock de pelo menos uma cor e tamanho (pode ser 0).'; return; }
    guardar.disabled = true;
    try {
      await rpc('admin_guardar_produto', { p: { id: P.id, slug: P.id ? undefined : slugify(nome.value), nome: nome.value.trim(), categoria: cat.value, descricao: desc.value.trim(), preco: pr, preco_promo: pm == null ? '' : pm, imagens: fotos, publicado: iPub.checked, destaque: iDes.checked, novo: iNov.checked, variantes } });
      const nt = [...new Set([...(DEF.tamanhos || []), ...variantes.map(v => v.tamanho)])], nc = [...new Set([...(DEF.cores || []), ...variantes.map(v => v.cor)])];
      if (nt.length !== (DEF.tamanhos || []).length || nc.length !== (DEF.cores || []).length) { DEF = { ...DEF, tamanhos: nt, cores: nc }; await rest('definicoes?id=eq.1', { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ dados: DEF }) }); }
      if (id && relOk && relMudou) await guardaRel();
      toast('Produto guardado.'); show(b);
    } catch (e) { guardar.disabled = false; if (e.status === 401) fail(e); else msg.textContent = e.message; }
  };
  /* --- produtos relacionados («Ver mais modelos») --- */
  let outros = [], rel = [], relOk = true, relMudou = false, recip = false;
  if (id) {
    try {
      outros = (await rest('produtos?select=id,nome,imagens,publicado,categoria&id=neq.' + id + '&order=nome.asc'));
      rel = (await rest('produtos_relacionados?select=relacionado_id,ordem&produto_id=eq.' + id + '&order=ordem.asc')).map(r => r.relacionado_id);
    } catch (e) { if (e.status === 401) { fail(e); return; } relOk = false; }
  }
  const byId = n => outros.find(o => o.id === n);
  const relLista = E('div'), relSel = E('select', { 'aria-label': 'Produto a adicionar' }), relAdd = E('button', { className: 'btn o sm', type: 'button', textContent: 'Adicionar' });
  const relMsg = E('small', { className: 'hint' });
  const [lRec, iRec] = ck('Os produtos escolhidos também sugerem este produto (opcional)', false);
  iRec.onchange = () => { recip = iRec.checked; relMudou = true; };
  const pintaRel = () => {
    relLista.replaceChildren(...(rel.length ? rel.map((n, i) => {
      const o = byId(n); if (!o) return null;
      const mv = (d, t, a) => { const x = E('button', { type: 'button', className: 'sm', textContent: t, aria: a, disabled: i + d < 0 || i + d >= rel.length }); x.onclick = () => { [rel[i], rel[i + d]] = [rel[i + d], rel[i]]; relMudou = true; pintaRel(); }; return x; };
      const rm = E('button', { type: 'button', className: 'sm', textContent: '✕ Remover', aria: 'Remover ' + o.nome }); rm.onclick = () => { rel.splice(i, 1); relMudou = true; pintaRel(); };
      const img = (o.imagens || [])[0];
      return E('div', { className: 'pl', 'data-rel': n }, [img ? E('img', { src: foto(img), alt: '', loading: 'lazy' }) : E('div', { className: 'nofoto' }),
        E('div', { className: 'info' }, [E('strong', { textContent: (i + 1) + '. ' + o.nome }), E('small', { textContent: CATS[o.categoria] || o.categoria })]),
        E('span', { className: 'bdgx' + (o.publicado ? ' ok' : ''), textContent: o.publicado ? 'Visível' : 'Escondido — não aparece na loja' }),
        E('div', { className: 'lin' }, [mv(-1, '↑', 'Subir'), mv(1, '↓', 'Descer'), rm])]);
    }) : [E('p', { className: 'mut', textContent: 'Nenhum produto escolhido. Enquanto estiver vazio, a loja mostra automaticamente outros produtos da mesma categoria.' })]));
    relSel.replaceChildren(E('option', { value: '', textContent: 'Escolher produto…' }), ...outros.filter(o => !rel.includes(o.id)).map(o => E('option', { value: o.id, textContent: o.nome + (o.publicado ? '' : ' (escondido)') })));
    relMsg.textContent = rel.length + (rel.length === 1 ? ' produto relacionado' : ' produtos relacionados') + (relMudou ? ' — alterações por guardar.' : '.');
  };
  relAdd.onclick = () => { const n = +relSel.value; if (!n || rel.includes(n)) return; if (rel.length >= 24) { toast('No máximo 24 produtos relacionados.', true); return; } rel.push(n); relMudou = true; pintaRel(); };
  const guardaRel = async () => { await rpc('admin_guardar_relacionados', { p_produto: id, p_ids: rel, p_reciproco: recip }); relMudou = false; };
  const relSave = E('button', { className: 'btn o sm', type: 'button', textContent: 'Guardar relacionados' });
  relSave.onclick = async () => { relSave.disabled = true; try { await guardaRel(); toast('Produtos relacionados guardados.'); pintaRel(); } catch (e) { fail(e); } relSave.disabled = false; };
  const relBox = E('div', { className: 'box', id: 'rel-box' }, [E('h2', { textContent: 'Produtos relacionados' }),
    E('p', { className: 'hint', textContent: 'Aparecem na página deste produto, em «Mais modelos para ti», quando o cliente clica em «Ver mais modelos». Só aparecem os que estão visíveis e com stock.' }),
    ...(!id ? [E('p', { className: 'mut', textContent: 'Guarde primeiro o produto. Depois volte a abri-lo para escolher os produtos relacionados.' })]
      : !relOk ? [E('p', { className: 'err', textContent: 'Falta ativar esta função na base de dados: execute o ficheiro 4-produtos-relacionados.sql no Supabase (veja o guia).' })]
      : [relLista, E('div', { className: 'lin' }, [relSel, relAdd]), lRec, E('div', { className: 'lin' }, [relSave, relMsg])])]);
  if (id && relOk) pintaRel();
  pintaFotos();
  b.replaceChildren(E('h2', { textContent: id ? 'Editar produto' : 'Novo produto' }),
    E('div', { className: 'box' }, [field('Nome', nome), E('div', { className: 'f3' }, [field('Categoria', cat), field('Preço (Kz)', preco), field('Preço em promoção (Kz)', promo, 'Deixe vazio se não houver')]), field('Descrição', desc), lPub, lDes, lNov]),
    E('div', { className: 'box' }, [E('h2', { textContent: 'Fotografias' }), fw, file, fm]),
    E('div', { className: 'box' }, [E('h2', { textContent: 'Stock por cor e tamanho' }), E('p', { className: 'hint', textContent: 'Escreva quantas unidades tem de cada combinação. Deixe vazio as combinações que não vende. Novas cores e tamanhos adicionam-se em Definições.' }), E('div', { className: 'gw' }, [grelha]),
      E('p', { className: 'hint', textContent: 'O stock desce sozinho quando entra uma encomenda e volta se a encomenda for cancelada. Antes de mudar o stock, abra o produto a partir da lista, para ver os números mais recentes.' })]),
    relBox,
    E('div', { className: 'lin' }, [guardar, voltar, apagar]), msg);
  window.scrollTo(0, 0);
}

/* ---------- definições ---------- */
async function vDef(b) {
  const d = DEF || {}, pg = PAGD || {}, pr = d.promocao || {}, vl = pg.valores || {};
  const taxa = E('input', { type: 'number', min: 0, step: 1, value: d.taxa_entrega ?? 0 }), zonas = E('textarea', { rows: 3, value: (d.zonas || []).join('\n') });
  const hor = E('input', { value: d.horario || '', maxLength: 120 }), reg = E('textarea', { rows: 3, value: d.regras_mesmo_dia || '', maxLength: 400 });
  const ind = E('input', { inputMode: 'numeric', value: d.whatsapp_indicativo || '244', maxLength: 4 }), wa = E('input', { inputMode: 'numeric', value: d.whatsapp || '', maxLength: 15 });
  const tam = E('input', { value: (d.tamanhos || []).join(', ') }), cor = E('textarea', { rows: 2, value: (d.cores || []).join(', ') });
  const pAt = E('input', { type: 'checkbox', checked: !!pr.ativa }), pT = E('input', { value: pr.titulo || '', maxLength: 80 }), pX = E('input', { value: pr.texto || '', maxLength: 160 }), pL = E('input', { value: pr.link || 'loja.html', maxLength: 200 });
  const tit = E('input', { value: pg.titular || '', maxLength: 120 }), mc = E('input', { value: vl.multicaixa || '', maxLength: 40 }), pp = E('input', { value: vl.paypay || '', maxLength: 40 }), ib = E('input', { value: vl.iban || '', maxLength: 40 });
  const msg = E('p', { className: 'msg err', role: 'alert' }), bt = E('button', { className: 'btn', type: 'button', textContent: 'Guardar definições' });
  bt.onclick = async () => {
    msg.textContent = '';
    const z = lista(zonas.value), t = lista(tam.value), c = lista(cor.value), w = digits(wa.value), i = digits(ind.value);
    if (!z.length) { msg.textContent = 'Indique pelo menos uma zona de entrega.'; return; }
    if (!t.length || !c.length) { msg.textContent = 'Indique pelo menos um tamanho e uma cor.'; return; }
    if (w && (w.length < 9 || w.length > 15)) { msg.textContent = 'Número de WhatsApp inválido (só dígitos, sem o indicativo).'; return; }
    if (!/^(https:\/\/|[a-z0-9_.\/?=&#-]+$)/i.test(pL.value.trim() || 'loja.html')) { msg.textContent = 'A ligação do banner tem de ser uma página do site (ex.: loja.html) ou começar por https://.'; return; }
    bt.disabled = true;
    try {
      const nd = { ...d, taxa_entrega: Math.max(0, Math.round(+taxa.value || 0)), zonas: z, horario: hor.value.trim(), regras_mesmo_dia: reg.value.trim(), whatsapp: w, whatsapp_indicativo: i, tamanhos: t, cores: c, promocao: { ativa: pAt.checked, titulo: pT.value.trim(), texto: pX.value.trim(), link: pL.value.trim() || 'loja.html' } };
      const np = { ...pg, titular: tit.value.trim(), valores: { multicaixa: mc.value.trim(), paypay: pp.value.trim(), iban: ib.value.trim() } };
      await rest('definicoes?id=eq.1', { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ dados: nd }) });
      await rest('pagamento?id=eq.1', { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ dados: np }) });
      DEF = nd; PAGD = np; toast('Definições guardadas.');
    } catch (e) { if (e.status === 401) fail(e); else msg.textContent = e.message; }
    bt.disabled = false;
  };
  const p1 = E('input', { type: 'password', autocomplete: 'new-password', minLength: 8 }), pm = E('p', { className: 'msg', role: 'status' }), pb = E('button', { className: 'btn o', type: 'button', textContent: 'Alterar palavra-passe' });
  pb.onclick = async () => {
    if (p1.value.length < 8) { pm.className = 'msg err'; pm.textContent = 'Use pelo menos 8 caracteres.'; return; }
    try { await authed('/auth/v1/user', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: p1.value }) }); p1.value = ''; pm.className = 'msg ok'; pm.textContent = 'Palavra-passe alterada.'; }
    catch (e) { if (e.status === 401) fail(e); else { pm.className = 'msg err'; pm.textContent = e.message; } }
  };
  b.replaceChildren(E('h2', { textContent: 'Definições da loja' }),
    E('div', { className: 'box' }, [E('h2', { textContent: 'Entrega' }), E('div', { className: 'f2' }, [field('Taxa de entrega (Kz)', taxa), field('Horário de entrega', hor)]), field('Zonas de entrega (uma por linha)', zonas), field('Regra de entrega', reg)]),
    E('div', { className: 'box' }, [E('h2', { textContent: 'WhatsApp' }), E('div', { className: 'f2' }, [field('Indicativo', ind, 'Angola: 244'), field('Número (sem indicativo)', wa)])]),
    E('div', { className: 'box' }, [E('h2', { textContent: 'Tamanhos e cores' }), field('Tamanhos (separados por vírgula)', tam), field('Cores (separadas por vírgula)', cor, 'Estas listas aparecem nos filtros da loja e na tabela de stock.')]),
    E('div', { className: 'box' }, [E('h2', { textContent: 'Faixa promocional (topo do site)' }), E('label', { className: 'ck' }, [pAt, 'Mostrar a faixa']), E('div', { className: 'f2' }, [field('Título', pT), field('Texto', pX)]), field('Ligação (ex.: loja.html)', pL)]),
    E('div', { className: 'box' }, [E('h2', { textContent: 'Dados de pagamento' }), E('p', { className: 'hint', textContent: 'Aparecem aos clientes na página da encomenda (site público).' }), field('Titular', tit), E('div', { className: 'f3' }, [field('Multicaixa Express', mc), field('PayPay África', pp), field('IBAN', ib)])]),
    E('div', { className: 'lin' }, [bt]), msg,
    E('div', { className: 'box', style: 'margin-top:1.2rem' }, [E('h2', { textContent: 'A minha conta' }), field('Nova palavra-passe', p1, 'Mínimo 8 caracteres.'), pb, pm]));
}

/* ---------- arranque ---------- */
loadS();
if (S && S.refresh_token) entrar(); else login();
})();
