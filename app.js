// ═══════════════════════════════════════════════════════
//  CONFIGURAÇÃO SUPABASE
// ═══════════════════════════════════════════════════════
const SUPABASE_URL = 'https://txedjzdznokdrjtpawaf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4ZWRqemR6bm9rZHJqdHBhd2FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3OTQ3OTMsImV4cCI6MjA5NDM3MDc5M30.ZLNvtExbctOdU2A_y2ElZbAmD-ev6FGeyzNrkGlL9T0';
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ═══════════════════════════════════════════════════════
//  TABELA DE BAIRROS PADRÃO
// ═══════════════════════════════════════════════════════
const BAIRROS_PADRAO = {
  "Acaiaca":10,"Alvorada":10,"Barreiro":25,"Bela Vista":15,"Bela Vista 3":15,
  "Belo Vale":12,"Bernardo Valadares":10,"Boa Vista":8,"Bom Jardim":8,
  "Bouganville I e II":20,"Brasília":10,"Braz Filizola":8,"Canaã":8,"Canadá":12,
  "Catarina":9,"CDI":10,"Cedro Cachoeira":8,"Centro":8,"Chácara do Paiva":8,
  "Cidade de Deus":20,"Dante Lanza":9,"Dona Dora":9,"Dona Silva":20,"Eldorado":10,
  "Emília":8,"Esmeraldas":15,"Esperança":8,"Fátima":8,"Flórida":10,
  "Funcionários":10,"Henrique Nery":8,"Indústrias":10,"Interlagos":10,"Iporanga":10,
  "Itapoã":12,"Jardim Arizona":8,"Jardim dos Pequis":15,"Jardim Cambuí":8,
  "Jardim Europa":8,"Jardim Primavera":15,"JK":10,"Luxemburgo":15,"Mangabeiras":8,
  "Manoa":8,"Mata Grande":9,"Monte Carlo":12,"Montreal":10,"Morro do Claro":9,
  "New York":8,"Nossa Senhora das Graças":8,"Nossa Senhora do Carmo":7,
  "Nova Cidade":10,"Olinto Alvim":8,"Orozimbo Macedo":10,"Padre Teodoro":10,
  "Panorama":8,"Papavento":8,"Piedade":8,"Planalto":10,"Progresso":9,
  "Portal da Serra":8,"Prudente de Morais":25,"Santa Felicidade":20,
  "Santa Helena":8,"Santa Luzia":8,"Santa Marcelina":8,"Santa Rita de Cássia":8,
  "Santa Rosa":10,"Santo Antônio":9,"São Cristovão":9,"São Dimas":9,
  "São Francisco":8,"São Geraldo":9,"São João":8,"São Pedro":8,"São Vicente":10,
  "Titamar":10,"Tamanduá":12,"Universitário":10,"Vale das Palmeiras":9,
  "Vapabuçu":9,"Varzea":9,"Vale do Sol":10,"Verde Vale":12
};

// Tabela ativa (começa com o padrão, pode ser substituída pelo perfil do usuário)
let BAIRROS = { ...BAIRROS_PADRAO };

// ═══════════════════════════════════════════════════════
//  ESTADO GLOBAL
// ═══════════════════════════════════════════════════════
let usuarioAtual    = null;
let perfilAtual     = null;
let entregas        = [];
let clientes        = [];
let registrosKM     = [];
let ganhos99        = [];
let graficoFat = null, graficoBairros = null, graficoQtd = null, graficoEmpresas = null;
let modoOnline      = false;
let nomeAppCorridas = '99App';  // valor padrão, atualizado pelo perfil

// ═══════════════════════════════════════════════════════
//  STORAGE LOCAL (fallback offline)
// ═══════════════════════════════════════════════════════
function chaveLocal(sufixo) {
  return 'ef_' + (usuarioAtual ? usuarioAtual.id.slice(0, 8) : 'anon') + '_' + sufixo;
}
function salvarLocal(chave, dados) { try { localStorage.setItem(chave, JSON.stringify(dados)); } catch(e){} }
function carregarLocal(chave, padrao) { try { return JSON.parse(localStorage.getItem(chave)) || padrao; } catch(e) { return padrao; } }

// ═══════════════════════════════════════════════════════
//  DATAS E FORMATAÇÃO
// ═══════════════════════════════════════════════════════
function hoje() { return new Date().toISOString().split('T')[0]; }
function mesAtual() { return new Date().toISOString().slice(0,7); }
function formatarData(d) { if(!d) return ''; const [a,m,di] = d.split('-'); return `${di}/${m}/${a}`; }
function formatarMoeda(v) { return 'R$ ' + Number(v||0).toFixed(2).replace('.',','); }

// ═══════════════════════════════════════════════════════
//  SYNC STATUS
// ═══════════════════════════════════════════════════════
function setSyncStatus(estado) {
  const dot = document.getElementById('sync-dot');
  const txt = document.getElementById('sync-txt');
  if(!dot || !txt) return;
  dot.className = 'sync-dot ' + estado;
  txt.textContent = estado === 'ok' ? 'nuvem ✓' : estado === 'sync' ? 'salvando...' : estado === 'erro' ? 'erro nuvem' : 'offline';
}

// ═══════════════════════════════════════════════════════
//  AUTENTICAÇÃO
// ═══════════════════════════════════════════════════════
function mostrarLogin() {
  document.getElementById('form-login-card').style.display = 'block';
  document.getElementById('form-cadastro-card').style.display = 'none';
  document.getElementById('login-erro').style.display = 'none';
}

function mostrarCadastro() {
  document.getElementById('form-login-card').style.display = 'none';
  document.getElementById('form-cadastro-card').style.display = 'block';
  document.getElementById('login-erro').style.display = 'none';
}

function mostrarErroLogin(msg) {
  const el = document.getElementById('login-erro');
  el.textContent = msg;
  el.style.display = 'block';
}

async function fazerLogin() {
  const email = document.getElementById('login-email').value.trim();
  const senha  = document.getElementById('login-senha').value;
  if(!email || !senha) { mostrarErroLogin('Preencha e-mail e senha.'); return; }

  const { data, error } = await db.auth.signInWithPassword({ email, password: senha });
  if(error) { mostrarErroLogin('❌ ' + traduzirErroAuth(error.message)); return; }
  await iniciarSessao(data.user);
}

async function fazerCadastro() {
  const nome   = document.getElementById('cad-nome').value.trim();
  const email  = document.getElementById('cad-email').value.trim();
  const senha  = document.getElementById('cad-senha').value;
  const senha2 = document.getElementById('cad-senha2').value;

  if(!nome || !email || !senha) { mostrarErroLogin('Preencha todos os campos.'); return; }
  if(senha !== senha2) { mostrarErroLogin('As senhas não coincidem.'); return; }
  if(senha.length < 6) { mostrarErroLogin('A senha precisa ter pelo menos 6 caracteres.'); return; }

  const { data, error } = await db.auth.signUp({
    email, password: senha,
    options: { data: { nome_exibicao: nome } }
  });
  if(error) { mostrarErroLogin('❌ ' + traduzirErroAuth(error.message)); return; }
  mostrarErroLogin('✅ Conta criada! Verifique seu e-mail e faça login.');
  mostrarLogin();
}

async function fazerLogout() {
  await db.auth.signOut();
  usuarioAtual = null;
  perfilAtual  = null;
  entregas = []; clientes = []; registrosKM = []; ganhos99 = [];
  document.getElementById('tela-app').style.display = 'none';
  document.getElementById('tela-login').style.display = 'flex';
}

function traduzirErroAuth(msg) {
  if(msg.includes('Invalid login')) return 'E-mail ou senha incorretos.';
  if(msg.includes('Email not confirmed')) return 'Confirme seu e-mail antes de entrar.';
  if(msg.includes('already registered')) return 'Este e-mail já está cadastrado.';
  if(msg.includes('Password should be')) return 'Senha muito fraca (mínimo 6 caracteres).';
  return msg;
}

async function iniciarSessao(user) {
  usuarioAtual = user;
  document.getElementById('tela-login').style.display = 'none';
  document.getElementById('tela-app').style.display = 'block';

  // Preencher info perfil no header
  const emailExib = document.getElementById('config-email-exibicao');
  const avatar    = document.getElementById('config-avatar');
  if(emailExib) emailExib.textContent = user.email;
  if(avatar) avatar.textContent = user.email[0].toUpperCase();

  // Inicializar campos de data
  document.getElementById('ent-data').value   = hoje();
  document.getElementById('km-data').value    = hoje();
  document.getElementById('app99-data').value = hoje();
  document.getElementById('filtro-mes-dash').value = mesAtual();

  const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const d = new Date();
  document.getElementById('badge-mes').textContent = meses[d.getMonth()] + ' ' + d.getFullYear();

  ['km-km','km-litros'].forEach(id => document.getElementById(id).addEventListener('input', calcularEficiencia));

  await carregarPerfil();
  await sincronizarDaCloud();
}

// ═══════════════════════════════════════════════════════
//  PERFIL DO USUÁRIO (app + bairros)
// ═══════════════════════════════════════════════════════
async function carregarPerfil() {
  if(!usuarioAtual) return;
  const { data, error } = await db.from('perfis').select('*').eq('id', usuarioAtual.id).single();

  if(error || !data) {
    // Perfil ainda não existe — criar
    await db.from('perfis').upsert({ id: usuarioAtual.id, nome_exibicao: usuarioAtual.email, app_corridas: '99App', bairros_custom: {} });
    perfilAtual = { app_corridas: '99App', bairros_custom: {} };
  } else {
    perfilAtual = data;
  }

  // Aplicar app de corridas
  nomeAppCorridas = perfilAtual.app_corridas || '99App';
  atualizarNomeApp();

  // Aplicar bairros personalizados (se existirem)
  const custom = perfilAtual.bairros_custom || {};
  if(Object.keys(custom).length > 0) {
    BAIRROS = custom;
  } else {
    BAIRROS = { ...BAIRROS_PADRAO };
  }

  // Preencher select de config
  const sel = document.getElementById('config-app-corridas');
  if(sel) {
    const opcoesConhecidas = ['99App','Uber','iFood','Rappi','Loggi','Lalamove','InDrive'];
    if(opcoesConhecidas.includes(nomeAppCorridas)) {
      sel.value = nomeAppCorridas;
      document.getElementById('config-app-custom-wrap').style.display = 'none';
    } else {
      sel.value = 'Outro';
      document.getElementById('config-app-custom-wrap').style.display = 'block';
      document.getElementById('config-app-custom').value = nomeAppCorridas;
    }
  }

  renderTabelaConfig();
}

function atualizarNomeApp() {
  const labels = [
    'nav-label-app99','titulo-app-corridas','titulo-app-corridas2',
    'label-app-hoje','label-app-mes','dash-label-99'
  ];
  labels.forEach(id => {
    const el = document.getElementById(id);
    if(el) el.textContent = nomeAppCorridas;
  });
  document.querySelectorAll('.label-app-dash').forEach(el => el.textContent = nomeAppCorridas);
}

function previewAppCorridas() {
  const sel = document.getElementById('config-app-corridas');
  const customWrap = document.getElementById('config-app-custom-wrap');
  customWrap.style.display = sel.value === 'Outro' ? 'block' : 'none';
}

async function salvarConfigApp() {
  const sel = document.getElementById('config-app-corridas');
  let nomeApp = sel.value === 'Outro'
    ? (document.getElementById('config-app-custom').value.trim() || '99App')
    : sel.value;

  const { error } = await db.from('perfis').update({ app_corridas: nomeApp }).eq('id', usuarioAtual.id);
  if(error) { mostrarToast('❌ Erro ao salvar: ' + error.message); return; }

  nomeAppCorridas = nomeApp;
  atualizarNomeApp();
  mostrarToast('✅ App atualizado para ' + nomeApp + '!');
}

// ═══════════════════════════════════════════════════════
//  BAIRROS PERSONALIZADOS
// ═══════════════════════════════════════════════════════
let bairrosEditados = {};  // cópia de trabalho durante edição

function renderTabelaConfig(filtro = '') {
  bairrosEditados = { ...BAIRROS };
  const tbody = document.getElementById('tbody-config-bairros');
  if(!tbody) return;

  const lista = Object.keys(bairrosEditados).sort().filter(b =>
    b.toLowerCase().includes(filtro.toLowerCase())
  );

  tbody.innerHTML = lista.map(b => `
    <tr>
      <td>${b}</td>
      <td>
        <input type="number" value="${bairrosEditados[b]}" step="0.01" min="0"
          style="width:80px;padding:4px 8px;border:1.5px solid var(--borda);border-radius:6px;font-size:13px;background:var(--cinza);"
          onchange="bairrosEditados['${b.replace(/'/g,"\\'")}'] = parseFloat(this.value)||0">
      </td>
      <td>
        <button class="btn-sm btn-danger" onclick="removerBairroConfig('${b.replace(/'/g,"\\'")}')">✕</button>
      </td>
    </tr>`).join('');
}

function filtrarTabelaConfig(q) {
  renderTabelaConfig(q);
}

function adicionarBairroCustom() {
  const nome  = document.getElementById('novo-bairro-nome').value.trim();
  const valor = parseFloat(document.getElementById('novo-bairro-valor').value) || 0;
  if(!nome) { mostrarToast('⚠️ Informe o nome do bairro'); return; }
  if(valor <= 0) { mostrarToast('⚠️ Informe um valor válido'); return; }

  BAIRROS[nome] = valor;
  bairrosEditados[nome] = valor;
  document.getElementById('novo-bairro-nome').value = '';
  document.getElementById('novo-bairro-valor').value = '';
  renderTabelaConfig(document.getElementById('busca-config-bairros').value || '');
  mostrarToast('✅ Bairro adicionado! Clique em Salvar tabela.');
}

function removerBairroConfig(nome) {
  delete BAIRROS[nome];
  delete bairrosEditados[nome];
  renderTabelaConfig(document.getElementById('busca-config-bairros').value || '');
}

async function salvarBairrosCustom() {
  // Capturar valores editados nos inputs
  const inputs = document.querySelectorAll('#tbody-config-bairros input[type="number"]');
  const nomes  = document.querySelectorAll('#tbody-config-bairros tr td:first-child');
  inputs.forEach((inp, i) => {
    const nome = nomes[i]?.textContent;
    if(nome) bairrosEditados[nome] = parseFloat(inp.value) || 0;
  });

  BAIRROS = { ...bairrosEditados };

  const { error } = await db.from('perfis').update({ bairros_custom: BAIRROS }).eq('id', usuarioAtual.id);
  if(error) { mostrarToast('❌ Erro ao salvar bairros: ' + error.message); return; }

  mostrarToast('✅ Tabela de bairros salva!');
  renderTabelaConfig();
}

function resetarBairrosParaPadrao() {
  if(!confirm('Restaurar a tabela padrão de Sete Lagoas? Suas modificações serão perdidas.')) return;
  BAIRROS = { ...BAIRROS_PADRAO };
  bairrosEditados = { ...BAIRROS_PADRAO };
  renderTabelaConfig();
  mostrarToast('↺ Tabela restaurada para o padrão. Clique em Salvar tabela para confirmar.');
}

// ═══════════════════════════════════════════════════════
//  SINCRONIZAÇÃO COM SUPABASE
// ═══════════════════════════════════════════════════════
async function sincronizarDaCloud() {
  setSyncStatus('sync');
  try {
    const uid = usuarioAtual.id;
    const [rEnt, rCli, rKM, r99] = await Promise.all([
      db.from('entregas').select('*').eq('user_id', uid).order('data', { ascending: false }),
      db.from('clientes').select('*').eq('user_id', uid).order('nome'),
      db.from('registros_km').select('*').eq('user_id', uid).order('data', { ascending: false }),
      db.from('ganhos_99').select('*').eq('user_id', uid).order('data', { ascending: false })
    ]);

    if(rEnt.error || rCli.error || rKM.error || r99.error) {
      throw new Error(JSON.stringify({ entregas: rEnt.error, clientes: rCli.error, km: rKM.error, app99: r99.error }));
    }

    entregas    = rEnt.data || [];
    clientes    = rCli.data || [];
    registrosKM = rKM.data  || [];
    ganhos99    = r99.data  || [];

    salvarLocal(chaveLocal('entregas'), entregas);
    salvarLocal(chaveLocal('clientes'), clientes);
    salvarLocal(chaveLocal('km'), registrosKM);
    salvarLocal(chaveLocal('99'), ganhos99);

    modoOnline = true;
    setSyncStatus('ok');
    atualizarInterface();
  } catch(e) {
    // Tentar carregar do cache local
    entregas    = carregarLocal(chaveLocal('entregas'), []);
    clientes    = carregarLocal(chaveLocal('clientes'), []);
    registrosKM = carregarLocal(chaveLocal('km'), []);
    ganhos99    = carregarLocal(chaveLocal('99'), []);
    modoOnline  = false;
    setSyncStatus('erro');
    console.error('Erro Supabase:', e);
    atualizarInterface();
  }
}

function atualizarInterface() {
  renderInicio();
  renderListaDia();
  renderListaKM();
  renderListaApp99();
  renderClientes();
  atualizarSelectClientes();
  if(document.getElementById('pg-dashboard').classList.contains('ativo')) renderDashboard();
}

// ═══════════════════════════════════════════════════════
//  NAVEGAÇÃO
// ═══════════════════════════════════════════════════════
function irPara(pg) {
  document.querySelectorAll('.pagina').forEach(p => p.classList.remove('ativo'));
  document.querySelectorAll('nav button').forEach(b => b.classList.remove('ativo'));
  document.getElementById('pg-' + pg).classList.add('ativo');
  const idx = ['inicio','nova','clientes','app99','km','dashboard','bairros','config'].indexOf(pg);
  if(idx >= 0) document.querySelectorAll('nav button')[idx].classList.add('ativo');
  if(pg === 'dashboard') renderDashboard();
  if(pg === 'inicio') renderInicio();
  if(pg === 'nova') renderListaDia();
  if(pg === 'config') renderTabelaConfig();
}

// ═══════════════════════════════════════════════════════
//  AUTOCOMPLETE BAIRROS
// ═══════════════════════════════════════════════════════
function filtrarBairros() {
  const val = document.getElementById('ent-bairro').value.trim().toLowerCase();
  const lista = document.getElementById('lista-bairros-auto');
  if(val.length < 1) { lista.classList.remove('aberto'); return; }
  const matches = Object.keys(BAIRROS).filter(b => b.toLowerCase().includes(val)).slice(0,8);
  if(!matches.length) { lista.classList.remove('aberto'); return; }
  lista.innerHTML = matches.map(b =>
    `<div class="autocomplete-item" onmousedown="selecionarBairro('${b.replace(/'/g,"\\'")}')">
      <span>${b}</span><span class="preco">R$ ${BAIRROS[b].toFixed(2).replace('.',',')}</span>
    </div>`).join('');
  lista.classList.add('aberto');
}
function selecionarBairro(b) {
  document.getElementById('ent-bairro').value = b;
  document.getElementById('ent-valor').value = BAIRROS[b] ? BAIRROS[b].toFixed(2) : '';
  document.getElementById('lista-bairros-auto').classList.remove('aberto');
}
function fecharListaDelay() { setTimeout(() => document.getElementById('lista-bairros-auto').classList.remove('aberto'), 200); }

// ═══════════════════════════════════════════════════════
//  SELECT DE CLIENTES NO FORMULÁRIO DE ENTREGA
// ═══════════════════════════════════════════════════════
function atualizarSelectClientes() {
  const sel = document.getElementById('ent-cliente-id');
  sel.innerHTML = '<option value="0">— Não cadastrado —</option>' +
    clientes.map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
}

// ═══════════════════════════════════════════════════════
//  SALVAR ENTREGA
// ═══════════════════════════════════════════════════════
async function salvarEntrega() {
  const nome      = document.getElementById('ent-nome').value.trim();
  const endereco  = document.getElementById('ent-endereco').value.trim();
  const bairro    = document.getElementById('ent-bairro').value.trim();
  const valor     = parseFloat(document.getElementById('ent-valor').value) || 0;
  const data      = document.getElementById('ent-data').value;
  const status    = document.getElementById('ent-status').value;
  const obs       = document.getElementById('ent-obs').value.trim();
  const clienteId = document.getElementById('ent-cliente-id').value;

  if(!bairro || !data) { mostrarToast('⚠️ Preencha bairro e data'); return; }

  const obj = {
    nome: nome || 'Destinatário não informado',
    endereco, bairro, valor, data, status, obs,
    cliente_id: clienteId === '0' ? null : parseInt(clienteId),
    pago: false,
    user_id: usuarioAtual.id
  };

  if(modoOnline) {
    setSyncStatus('sync');
    const { data: inserted, error } = await db.from('entregas').insert([obj]).select();
    if(error) { mostrarToast('❌ Erro ao salvar: ' + error.message); setSyncStatus('erro'); return; }
    entregas.unshift(inserted[0]);
    setSyncStatus('ok');
  } else {
    obj.id = Date.now();
    entregas.unshift(obj);
    salvarLocal(chaveLocal('entregas'), entregas);
  }

  ['ent-nome','ent-endereco','ent-bairro','ent-valor','ent-obs'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('ent-cliente-id').value = '0';
  mostrarToast('✅ Entrega registrada!');
  renderListaDia(); renderInicio();
}

// ═══════════════════════════════════════════════════════
//  SALVAR CLIENTE
// ═══════════════════════════════════════════════════════
async function salvarCliente() {
  const nome = document.getElementById('cli-nome').value.trim();
  const end  = document.getElementById('cli-end').value.trim();
  const tel  = document.getElementById('cli-tel').value.trim();
  const obs  = document.getElementById('cli-obs').value.trim();

  if(!nome) { mostrarToast('⚠️ Informe o nome da empresa'); return; }

  const obj = { nome, endereco: end, telefone: tel, observacoes: obs, user_id: usuarioAtual.id };

  if(modoOnline) {
    setSyncStatus('sync');
    const { data: inserted, error } = await db.from('clientes').insert([obj]).select();
    if(error) { mostrarToast('❌ Erro: ' + error.message); setSyncStatus('erro'); return; }
    clientes.push(inserted[0]);
    clientes.sort((a,b) => a.nome.localeCompare(b.nome));
    setSyncStatus('ok');
  } else {
    obj.id = Date.now();
    clientes.push(obj);
    clientes.sort((a,b) => a.nome.localeCompare(b.nome));
    salvarLocal(chaveLocal('clientes'), clientes);
  }

  ['cli-nome','cli-end','cli-tel','cli-obs'].forEach(id => document.getElementById(id).value = '');
  mostrarToast('✅ Empresa cadastrada!');
  renderClientes(); atualizarSelectClientes();
}

// ═══════════════════════════════════════════════════════
//  SALVAR APP CORRIDAS (99App / Uber / etc)
// ═══════════════════════════════════════════════════════
async function salvarApp99() {
  const valor = parseFloat(document.getElementById('app99-valor').value) || 0;
  const data  = document.getElementById('app99-data').value;
  const obs   = document.getElementById('app99-obs').value.trim();

  if(!data || valor === 0) { mostrarToast('⚠️ Informe o valor e a data'); return; }

  const obj = { valor, data, observacoes: obs, user_id: usuarioAtual.id };

  if(modoOnline) {
    setSyncStatus('sync');
    const { data: inserted, error } = await db.from('ganhos_99').insert([obj]).select();
    if(error) { mostrarToast('❌ Erro: ' + error.message); setSyncStatus('erro'); return; }
    ganhos99.unshift(inserted[0]);
    setSyncStatus('ok');
  } else {
    obj.id = Date.now();
    ganhos99.unshift(obj);
    salvarLocal(chaveLocal('99'), ganhos99);
  }

  document.getElementById('app99-valor').value = '';
  document.getElementById('app99-obs').value = '';
  mostrarToast('✅ Ganho ' + nomeAppCorridas + ' salvo!');
  renderListaApp99(); renderInicio();
}

// ═══════════════════════════════════════════════════════
//  SALVAR KM
// ═══════════════════════════════════════════════════════
async function salvarKM() {
  const data   = document.getElementById('km-data').value;
  const km     = parseFloat(document.getElementById('km-km').value) || 0;
  const litros = parseFloat(document.getElementById('km-litros').value) || 0;
  const valor  = parseFloat(document.getElementById('km-valor').value) || 0;

  if(!data || km === 0) { mostrarToast('⚠️ Informe a data e os KM'); return; }

  const obj = { data, km, litros, valor, user_id: usuarioAtual.id };

  if(modoOnline) {
    setSyncStatus('sync');
    const { data: inserted, error } = await db.from('registros_km').insert([obj]).select();
    if(error) { mostrarToast('❌ Erro: ' + error.message); setSyncStatus('erro'); return; }
    registrosKM.unshift(inserted[0]);
    setSyncStatus('ok');
  } else {
    obj.id = Date.now();
    registrosKM.unshift(obj);
    salvarLocal(chaveLocal('km'), registrosKM);
  }

  ['km-km','km-litros','km-valor'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('km-eficiencia').style.display = 'none';
  mostrarToast('✅ KM registrado!');
  renderListaKM();
}

function calcularEficiencia() {
  const km = parseFloat(document.getElementById('km-km').value) || 0;
  const litros = parseFloat(document.getElementById('km-litros').value) || 0;
  const el = document.getElementById('km-eficiencia');
  if(km > 0 && litros > 0) {
    el.textContent = `⛽ Eficiência: ${(km/litros).toFixed(1)} km/litro`;
    el.style.display = 'block';
  } else { el.style.display = 'none'; }
}

// ═══════════════════════════════════════════════════════
//  EXCLUIR / TOGGLE
// ═══════════════════════════════════════════════════════
async function excluirEntrega(id) {
  if(!confirm('Excluir esta entrega?')) return;
  if(modoOnline) await db.from('entregas').delete().eq('id', id).eq('user_id', usuarioAtual.id);
  entregas = entregas.filter(e => e.id !== id);
  salvarLocal(chaveLocal('entregas'), entregas);
  renderListaDia(); renderInicio();
  mostrarToast('🗑️ Entrega removida');
}

async function excluirKM(id) {
  if(modoOnline) await db.from('registros_km').delete().eq('id', id).eq('user_id', usuarioAtual.id);
  registrosKM = registrosKM.filter(r => r.id !== id);
  salvarLocal(chaveLocal('km'), registrosKM);
  renderListaKM();
  mostrarToast('🗑️ Registro removido');
}

async function excluirApp99(id) {
  if(modoOnline) await db.from('ganhos_99').delete().eq('id', id).eq('user_id', usuarioAtual.id);
  ganhos99 = ganhos99.filter(g => g.id !== id);
  salvarLocal(chaveLocal('99'), ganhos99);
  renderListaApp99(); renderInicio();
  mostrarToast('🗑️ Registro removido');
}

async function excluirCliente(id) {
  if(!confirm('Excluir esta empresa? As entregas vinculadas não serão apagadas.')) return;
  if(modoOnline) await db.from('clientes').delete().eq('id', id).eq('user_id', usuarioAtual.id);
  clientes = clientes.filter(c => c.id !== id);
  salvarLocal(chaveLocal('clientes'), clientes);
  renderClientes(); atualizarSelectClientes();
  mostrarToast('🗑️ Empresa removida');
}

async function toggleStatus(id) {
  const e = entregas.find(x => x.id === id);
  if(!e) return;
  e.status = e.status === 'entregue' ? 'pendente' : 'entregue';
  if(modoOnline) await db.from('entregas').update({ status: e.status }).eq('id', id).eq('user_id', usuarioAtual.id);
  salvarLocal(chaveLocal('entregas'), entregas);
  renderListaDia(); renderInicio();
}

async function togglePago(id) {
  const e = entregas.find(x => x.id === id);
  if(!e) return;
  e.pago = !e.pago;
  if(modoOnline) await db.from('entregas').update({ pago: e.pago }).eq('id', id).eq('user_id', usuarioAtual.id);
  salvarLocal(chaveLocal('entregas'), entregas);
  renderListaDia(); renderInicio(); renderClientes();
  mostrarToast(e.pago ? '✅ Marcada como paga!' : '⏳ Marcada como não paga');
}

async function marcarTodasPagas(clienteId, dia) {
  const pendentes = entregas.filter(e => e.cliente_id === clienteId && e.data === dia && !e.pago);
  if (!pendentes.length) return;
  for (const e of pendentes) {
    e.pago = true;
    if (modoOnline) await db.from('entregas').update({ pago: true }).eq('id', e.id).eq('user_id', usuarioAtual.id);
  }
  salvarLocal(chaveLocal('entregas'), entregas);
  renderListaDia(); renderInicio(); renderClientes();
  mostrarToast(`✅ ${pendentes.length} entrega${pendentes.length !== 1 ? 's' : ''} marcada${pendentes.length !== 1 ? 's' : ''} como paga${pendentes.length !== 1 ? 's' : ''}!`);
}

// ═══════════════════════════════════════════════════════
//  RENDERS
// ═══════════════════════════════════════════════════════
function renderInicio() {
  const hj  = hoje();
  const mes = mesAtual();
  const entHoje = entregas.filter(e => e.data === hj);
  const entMes  = entregas.filter(e => e.data && e.data.startsWith(mes));
  const valHoje = entHoje.reduce((s,e) => s + (e.valor||0), 0);
  const valMes  = entMes.reduce((s,e) => s + (e.valor||0), 0);

  const app99Hoje = ganhos99.filter(g => g.data === hj).reduce((s,g) => s + (g.valor||0), 0);
  const app99Mes  = ganhos99.filter(g => g.data && g.data.startsWith(mes)).reduce((s,g) => s + (g.valor||0), 0);

  document.getElementById('res-hoje').textContent     = entHoje.length;
  document.getElementById('res-hoje-val').textContent = formatarMoeda(valHoje);
  document.getElementById('res-hoje-99').textContent  = formatarMoeda(app99Hoje);
  document.getElementById('res-hoje-total').textContent = formatarMoeda(valHoje + app99Hoje);
  document.getElementById('res-mes').textContent      = entMes.length;
  document.getElementById('res-mes-val').textContent  = formatarMoeda(valMes);
  document.getElementById('res-mes-99').textContent   = formatarMoeda(app99Mes);
  document.getElementById('res-mes-total').textContent = formatarMoeda(valMes + app99Mes);

  // Card: valores a receber (entregas não pagas)
  const naoPatagos = entregas.filter(e => e.pago === false);
  const totalAReceber = naoPatagos.reduce((s,e) => s + (e.valor||0), 0);
  const cardReceber = document.getElementById('card-receber');
  if(totalAReceber > 0) {
    cardReceber.style.display = 'flex';
    document.getElementById('res-a-receber').textContent = formatarMoeda(totalAReceber);
    document.getElementById('res-a-receber-sub').textContent = naoPatagos.length + ' entrega' + (naoPatagos.length !== 1 ? 's' : '') + ' não paga' + (naoPatagos.length !== 1 ? 's' : '');
  } else {
    cardReceber.style.display = 'none';
  }

  const rec = document.getElementById('lista-recentes');
  const ult = entregas.slice(0,5);
  rec.innerHTML = ult.length ? ult.map(e => cartaoEntrega(e, false)).join('') : vazioHtml('Nenhuma entrega ainda');
}

function renderListaDia() {
  const hj = document.getElementById('ent-data').value || hoje();
  const lista = entregas.filter(e => e.data === hj);
  const el = document.getElementById('lista-dia');
  el.innerHTML = lista.length ? lista.map(e => cartaoEntrega(e, true)).join('') : vazioHtml('Sem entregas nesta data');
}

function cartaoEntrega(e, comAcoes) {
  const cli = clientes.find(c => c.id === e.cliente_id);
  const badgePago = e.pago
    ? `<button class="pago-badge pago" onclick="togglePago(${e.id})">✓ Pago</button>`
    : `<button class="pago-badge nao-pago" onclick="togglePago(${e.id})">$ A receber</button>`;
  return `<div class="entrega-item">
    <div class="entrega-info" style="flex:1;">
      <div class="nome">${e.nome || '—'}</div>
      ${cli ? `<div class="empresa-tag">🏢 ${cli.nome}</div>` : ''}
      <div class="endereco">${e.endereco || '—'}</div>
      <span class="bairro-tag">${e.bairro}</span>
      ${e.obs ? `<div style="font-size:11px;color:var(--cinza-texto);margin-top:4px;">${e.obs}</div>` : ''}
      ${comAcoes ? `<div class="entrega-acoes">
        <button class="btn-sm" onclick="toggleStatus(${e.id})" style="background:var(--verde-claro);color:var(--verde);">${e.status==='entregue'?'✓ Entregue':'⏳ Pendente'}</button>
        ${badgePago}
        <button class="btn-sm btn-danger" onclick="excluirEntrega(${e.id})">Excluir</button>
      </div>` : `<div style="display:flex;gap:6px;margin-top:5px;flex-wrap:wrap;align-items:center;">
        <span class="status ${e.status}">${e.status==='entregue'?'✓ Entregue':'⏳ Pendente'}</span>
        ${badgePago}
      </div>`}
    </div>
    <div class="entrega-valor">${formatarMoeda(e.valor)}</div>
  </div>`;
}

function renderClientes() {
  const el = document.getElementById('lista-clientes');
  if(!clientes.length) { el.innerHTML = vazioHtml('Nenhuma empresa cadastrada'); return; }
  el.innerHTML = clientes.map(c => {
    const entsCliente = entregas
      .filter(e => e.cliente_id === c.id)
      .sort((a,b) => {
        if(b.data !== a.data) return b.data.localeCompare(a.data);
        return b.id - a.id;
      });
    const totalRecebido = entsCliente.reduce((s,e) => s + (e.valor||0), 0);
    const totalAReceber = entsCliente.filter(e => !e.pago).reduce((s,e) => s + (e.valor||0), 0);

    // Agrupar por dia
    const porDia = {};
    entsCliente.forEach(e => {
      if(!porDia[e.data]) porDia[e.data] = [];
      porDia[e.data].push(e);
    });
    const diasOrdenados = Object.keys(porDia).sort((a,b) => b.localeCompare(a));

    const historicoHtml = diasOrdenados.map(dia => {
      const entsNoDia = porDia[dia];
      const totalDia  = entsNoDia.reduce((s,e) => s + (e.valor||0), 0);
      const itens     = entsNoDia.map(e => `
        <div class="hist-dia-item">
          <div class="hi-info">
            <div class="hi-bairro">${e.bairro}</div>
            <div class="hi-nome">${e.nome || '—'}${e.endereco ? ' · ' + e.endereco : ''}</div>
          </div>
          <div class="hi-direita">
            <span class="hi-valor">${formatarMoeda(e.valor)}</span>
            <button class="pago-badge ${e.pago ? 'pago' : 'nao-pago'}" onclick="togglePago(${e.id})">${e.pago ? '✓ Pago' : '$ A receber'}</button>
          </div>
        </div>`).join('');

      const todasPagas = entsNoDia.every(e => e.pago);
      return `<div class="hist-dia-grupo">
        <div class="hist-dia-titulo">
          <span>📅 ${formatarData(dia)} — ${entsNoDia.length} entrega${entsNoDia.length !== 1 ? 's' : ''}</span>
          <div style="display:flex;align-items:center;gap:8px;">
            ${!todasPagas ? `<button class="btn-marcar-pagas" onclick="marcarTodasPagas(${c.id}, '${dia}')">✅ Marcar todas pagas</button>` : ''}
            <span class="dia-total">${formatarMoeda(totalDia)}</span>
          </div>
        </div>
        ${itens}
      </div>`;
    }).join('');

    return `<div class="cliente-card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div>
          <div class="cli-nome">🏢 ${c.nome}</div>
          ${c.endereco ? `<div class="cli-end">📍 ${c.endereco}</div>` : ''}
          ${c.telefone ? `<div class="cli-end">📞 ${c.telefone}</div>` : ''}
          ${c.observacoes ? `<div class="cli-end" style="margin-top:4px;font-style:italic;">${c.observacoes}</div>` : ''}
        </div>
        <button class="btn-sm btn-danger" onclick="excluirCliente(${c.id})">Excluir</button>
      </div>
      <div class="cli-stats">
        <div class="cli-stat">Entregas<span>${entsCliente.length}</span></div>
        <div class="cli-stat">Total recebido<span>${formatarMoeda(totalRecebido)}</span></div>
        ${entsCliente.length ? `<div class="cli-stat">Ticket médio<span>${formatarMoeda(totalRecebido/entsCliente.length)}</span></div>` : ''}
        ${totalAReceber > 0 ? `<div class="cli-stat" style="background:var(--vermelho-claro);">A receber<span style="color:var(--vermelho);">${formatarMoeda(totalAReceber)}</span></div>` : ''}
      </div>
      ${entsCliente.length ? `
        <div class="cli-hist-btn" onclick="toggleHistorico(${c.id})">▼ Ver histórico de entregas (${entsCliente.length})</div>
        <div class="cli-historico" id="hist-${c.id}">
          ${historicoHtml}
        </div>` : ''}
    </div>`;
  }).join('');
}

function toggleHistorico(id) {
  const el = document.getElementById('hist-' + id);
  if(el) el.classList.toggle('aberto');
}

function renderListaApp99() {
  const el = document.getElementById('lista-app99');
  if(!ganhos99.length) { el.innerHTML = vazioHtml('Nenhum ganho registrado'); return; }
  el.innerHTML = ganhos99.slice(0,30).map(g => `
    <div class="app99-item">
      <div>
        <div style="font-size:13px;font-weight:600;">${formatarData(g.data)}</div>
        ${g.observacoes ? `<div style="font-size:12px;color:var(--cinza-texto);">${g.observacoes}</div>` : ''}
      </div>
      <div style="display:flex;align-items:center;gap:10px;">
        <div class="app99-valor">${formatarMoeda(g.valor)}</div>
        <button class="btn-sm btn-danger" onclick="excluirApp99(${g.id})">✕</button>
      </div>
    </div>`).join('');
}

function renderListaKM() {
  const el = document.getElementById('lista-km');
  if(!registrosKM.length) { el.innerHTML = vazioHtml('Nenhum registro ainda'); return; }
  el.innerHTML = registrosKM.slice(0,20).map(r => `
    <div class="km-item">
      <div>
        <div class="data">${formatarData(r.data)}</div>
        <div class="detalhes">${r.litros > 0 ? r.litros + 'L · ' + formatarMoeda(r.valor) : 'Sem abastecimento'}</div>
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        <div class="km-badge">
          <span class="badge azul">${r.km} km</span>
          ${r.litros > 0 ? `<span class="badge laranja">${(r.km/r.litros).toFixed(1)} km/L</span>` : ''}
        </div>
        <button class="btn-sm btn-danger" onclick="excluirKM(${r.id})">✕</button>
      </div>
    </div>`).join('');
}

// ═══════════════════════════════════════════════════════
//  DASHBOARD
// ═══════════════════════════════════════════════════════
function renderDashboard() {
  const mes      = document.getElementById('filtro-mes-dash').value || mesAtual();
  const entMes   = entregas.filter(e => e.data && e.data.startsWith(mes));
  const kmMes    = registrosKM.filter(r => r.data && r.data.startsWith(mes));
  const app99Mes = ganhos99.filter(g => g.data && g.data.startsWith(mes));

  const faturado    = entMes.reduce((s,e) => s + (e.valor||0), 0);
  const total99     = app99Mes.reduce((s,g) => s + (g.valor||0), 0);
  const custoComb   = kmMes.reduce((s,r) => s + (r.valor||0), 0);
  const totalKM     = kmMes.reduce((s,r) => s + (r.km||0), 0);
  const totalLitros = kmMes.reduce((s,r) => s + (r.litros||0), 0);
  const lucro       = faturado + total99 - custoComb;

  document.getElementById('dash-lucro').textContent  = formatarMoeda(lucro);
  document.getElementById('dash-fat').textContent    = formatarMoeda(faturado);
  document.getElementById('dash-99').textContent     = formatarMoeda(total99);
  document.getElementById('dash-comb').textContent   = formatarMoeda(custoComb);
  document.getElementById('dash-nent').textContent   = entMes.length;
  document.getElementById('dash-km').textContent     = totalKM + ' km';
  document.getElementById('dash-kml').textContent    = totalLitros > 0 ? (totalKM/totalLitros).toFixed(1)+' km/L' : '— km/L';
  document.getElementById('dash-custo').textContent  = entMes.length > 0 ? formatarMoeda(custoComb/entMes.length) : 'R$ 0';
  document.getElementById('dash-ticket').textContent = entMes.length > 0 ? formatarMoeda(faturado/entMes.length) : 'R$ 0';

  // Gráfico: faturamento por dia
  const diasMap = {};
  entMes.forEach(e => { diasMap[e.data] = (diasMap[e.data]||{ent:0,app99:0}); diasMap[e.data].ent += (e.valor||0); });
  app99Mes.forEach(g => { diasMap[g.data] = (diasMap[g.data]||{ent:0,app99:0}); diasMap[g.data].app99 += (g.valor||0); });
  const dias = Object.keys(diasMap).sort();

  if(graficoFat) graficoFat.destroy();
  graficoFat = new Chart(document.getElementById('grafico-fat'), {
    type: 'bar',
    data: {
      labels: dias.map(d => d.slice(8)),
      datasets: [
        { label: 'Entregas', data: dias.map(d => diasMap[d].ent||0), backgroundColor: '#1a7a4a', borderRadius: 4 },
        { label: nomeAppCorridas, data: dias.map(d => diasMap[d].app99||0), backgroundColor: '#8b5cf6', borderRadius: 4 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: true, position: 'top', labels: { font: { size: 11 } } } },
      scales: { y: { stacked: true, ticks: { callback: v => 'R$'+v } }, x: { stacked: true, ticks: { autoSkip: false, maxRotation: 0, font: { size: 10 } } } }
    }
  });

  // Gráfico: bairros
  const bairrosMap = {};
  entMes.forEach(e => { bairrosMap[e.bairro] = (bairrosMap[e.bairro]||0)+1; });
  const topBairros = Object.entries(bairrosMap).sort((a,b)=>b[1]-a[1]).slice(0,8);
  if(graficoBairros) graficoBairros.destroy();
  if(topBairros.length) {
    graficoBairros = new Chart(document.getElementById('grafico-bairros'), {
      type: 'bar',
      data: { labels: topBairros.map(b=>b[0]), datasets: [{ data: topBairros.map(b=>b[1]), backgroundColor: '#1a3a5c', borderRadius: 4 }] },
      options: { indexAxis:'y', responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{x:{ticks:{stepSize:1}}} }
    });
  }

  // Gráfico: qtd por dia
  const qtdMap = {};
  entMes.forEach(e => { qtdMap[e.data] = (qtdMap[e.data]||0)+1; });
  const diasQ = Object.keys(qtdMap).sort();
  if(graficoQtd) graficoQtd.destroy();
  if(diasQ.length) {
    graficoQtd = new Chart(document.getElementById('grafico-qtd'), {
      type: 'line',
      data: { labels: diasQ.map(d=>d.slice(8)), datasets: [{ data: diasQ.map(d=>qtdMap[d]), borderColor:'#e67e22', backgroundColor:'rgba(230,126,34,0.1)', fill:true, tension:0.3, pointRadius:4 }] },
      options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{ y:{ticks:{stepSize:1}}, x:{ticks:{autoSkip:false,maxRotation:0,font:{size:10}}} } }
    });
  }

  // Gráfico: faturamento por empresa
  const empMap = {};
  entMes.forEach(e => {
    const cli = clientes.find(c => c.id === e.cliente_id);
    const nome = cli ? cli.nome : 'Não cadastrado';
    empMap[nome] = (empMap[nome]||0) + (e.valor||0);
  });
  const topEmp = Object.entries(empMap).sort((a,b)=>b[1]-a[1]).slice(0,8);
  if(graficoEmpresas) graficoEmpresas.destroy();
  if(topEmp.length) {
    graficoEmpresas = new Chart(document.getElementById('grafico-empresas'), {
      type: 'bar',
      data: { labels: topEmp.map(e=>e[0]), datasets: [{ data: topEmp.map(e=>e[1]), backgroundColor: '#8b5cf6', borderRadius: 4 }] },
      options: { indexAxis:'y', responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{ x:{ ticks:{ callback: v => 'R$'+v } } } }
    });
  }
}

// ═══════════════════════════════════════════════════════
//  MODAL
// ═══════════════════════════════════════════════════════
function fecharModal() { document.getElementById('modal-historico').classList.remove('aberto'); }

// ═══════════════════════════════════════════════════════
//  UTILITÁRIOS
// ═══════════════════════════════════════════════════════
function vazioHtml(msg) {
  return `<div class="vazio"><svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/></svg><p>${msg}</p></div>`;
}
function mostrarToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// ═══════════════════════════════════════════════════════
//  INICIALIZAÇÃO — verifica sessão existente
// ═══════════════════════════════════════════════════════
window.onload = async () => {
  // Verificar se já tem sessão ativa (usuário já logado)
  const { data: { session } } = await db.auth.getSession();
  if(session && session.user) {
    await iniciarSessao(session.user);
  }
  // Se não tem sessão, a tela de login já está visível por padrão
};
