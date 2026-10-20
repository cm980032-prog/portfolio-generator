const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const app = document.getElementById('app');
const standaloneLogin = /(?:^|\/)login\.html$/.test(window.location.pathname);
let session = null;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const lines = s => (s || '').split('\n').map(x => x.trim()).filter(Boolean);
const parts = l => l.split('|').map(x => x.trim());
const url = u => /^https?:\/\//i.test(u) ? esc(u) : '#';

function toast(msg, bad) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = 'show' + (bad ? ' bad' : '');
  setTimeout(() => t.className = '', 4000);
}

const FRIENDLY = {
  email_format: 'Proper email format is required (example: name@gmail.com).',
  phone_format: 'Proper contact number is required (at least 11 digits, example: 09225812345).',
  name_no_numbers: 'Full name cannot contain numbers.'
};
const fail = e => {
  console.error(e);
  const msg = e.message || '', key = Object.keys(FRIENDLY).find(k => msg.includes(k));
  toast(key ? FRIENDLY[key] : (msg || 'Something went wrong.'), true);
};

/* ---------- Database ---------- */
const getTemplates = async () => { const { data, error } = await db.from('templates').select('*').order('id'); if (error) throw error; return data; };
const getPortfolio = async id => { const { data, error } = await db.from('portfolios').select('*').eq('id', id).single(); if (error) throw error; return data; };
const getTemplate = async id => { const { data, error } = await db.from('templates').select('*').eq('id', id).single(); if (error) throw error; return data; };

/* ---------- Navigation (changes when logged in) ---------- */
function renderNav() {
  const nav = document.querySelector('.nav nav');
  if (!nav) return;
  nav.innerHTML = standaloneLogin
    ? (session
      ? `<a href="index.html">Home</a><a href="index.html#/manage">Manage</a><span class="who">${esc(session.user.email)}</span><button class="btn ghost sm" id="logout">Log out</button>`
      : `<a href="index.html">Home</a>`)
    : (session
      ? `<a href="#/">Home</a><a href="#/form">Create</a><a href="#/manage">Manage</a><span class="who">${esc(session.user.email)}</span><button class="btn ghost sm" id="logout">Log out</button>`
      : `<a href="#/">Home</a><a href="login.html" target="_blank" rel="noopener">Log in</a><a href="#/signup">Sign up</a>`);
  const out = document.getElementById('logout');
  if (out) out.onclick = async () => {
    out.disabled = true;
    try {
      const { error } = await db.auth.signOut();
      if (error) throw error;
      session = null;
      renderNav();
      toast('You have been logged out.');
      if (standaloneLogin) location.href = 'index.html';
      else {
        if (!location.hash || location.hash === '#/') await route();
        else location.hash = '#/';
      }
    } catch (error) {
      out.disabled = false;
      fail(error);
    }
  };
}

// Keep the shared navigation in sync with Supabase session changes (including
// sign-out from another tab). The explicit logout handler still checks errors.
db.auth.onAuthStateChange((event, nextSession) => {
  session = nextSession;
  renderNav();
});

/* ---------- Router ---------- */
async function route() {
  const { data, error: sessionError } = await db.auth.getSession();
  if (sessionError) {
    console.error('Unable to read Supabase session:', sessionError);
    fail(sessionError);
    return;
  }
  session = data.session;
  renderNav();
  const [, page = '', id] = location.hash.split('/');
  window.scrollTo(0, 0);
  app.onclick = null;
  if (standaloneLogin) {
    if (session) { app.innerHTML = '<section class="wrap auth auth-page"><h1>You are already logged in.</h1><p><a class="btn" href="index.html#/manage">Manage portfolios</a></p></section>'; return; }
    authPage('login');
    return;
  }
  if (!session && !['', 'login', 'signup'].includes(page)) { location.hash = '#/login'; return; }
  if (session && (page === 'login' || page === 'signup')) { location.hash = '#/manage'; return; }
  try {
    if (page === 'login' || page === 'signup') authPage(page);
    else if (page === 'form') await formPage(id);
    else if (page === 'templates') await templatesPage(id);
    else if (page === 'preview') await previewPage(id);
    else if (page === 'manage') await managePage();
    else homePage();
  } catch (e) {
    console.error('PortNova route/database request failed:', e);
    const networkHint = e instanceof TypeError && /fetch/i.test(e.message)
      ? '<p class="error-help">The browser could not reach Supabase. Check your internet connection, the project URL and publishable key in index.html, and whether the Supabase project is active. If those are correct, inspect the browser Network tab for the failed request.</p>'
      : '';
    app.innerHTML = `<section class="wrap"><h1>Something went wrong</h1><p>${esc(e.message || 'Request failed')}</p>${networkHint}<a class="btn" href="#/">Back to home</a></section>`;
  }
}
addEventListener('hashchange', route);
addEventListener('DOMContentLoaded', route);

/* ---------- Home ---------- */
function homePage() {
  app.innerHTML = `
    <section class="home-hero">
      <div class="hero-grid" aria-hidden="true"></div>
      <div class="hero-content">
        <span class="eyebrow">YOUR WORK. YOUR STORY. YOUR SPACE.</span>
        <h1>Make your work <span>impossible to ignore.</span></h1>
        <p class="hero-copy">Build a polished online portfolio in minutes. Add your experience, choose a style that feels like you, and keep everything organized in one place.</p>
        <div class="hero-actions">
          ${session
            ? '<a class="btn big" href="#/form">Create Portfolio</a>'
            : '<a class="btn big" href="#/signup">Create Portfolio</a><a class="btn ghost big" href="login.html" target="_blank" rel="noopener">Log in</a>'}
        </div>
        <p class="hero-note">SIMPLE SETUP · THREE DISTINCT DESIGNS · YOUR PORTFOLIO, YOUR WAY</p>
      </div>
      <aside class="hero-showcase" aria-label="Example portfolio preview">
        <div class="showcase-top"><span>PORTNOVA / LIVE PREVIEW</span><span class="preview-status">● READY TO CREATE</span></div>
        <div class="showcase-body">
          <div class="mock-profile"><div class="mock-avatar">PN</div><div><strong>Your Name</strong><p>Designer · Developer · Creator</p></div></div>
          <div class="mock-intro"><span>HELLO, WORLD</span><h2>Your next chapter starts here.</h2><p>A home for your best work, ideas, and achievements.</p></div>
          <div class="mock-projects">
            <div class="mock-project"><span>01</span><strong>Selected Work</strong><small>Projects that tell your story</small></div>
            <div class="mock-project"><span>02</span><strong>Your Journey</strong><small>Skills, learning, and growth</small></div>
          </div>
        </div>
      </aside>
    </section>
    <section class="home-templates">
      <span class="eyebrow">FIND YOUR STYLE</span>
      <h2>Three templates. <span>One you.</span></h2>
      <p>Start with a layout that fits the way you want to present your work.</p>
      <div class="style-cards">
        <article class="style-card"><div class="style-icon">01</div><h3>Simple</h3><p>Clean, focused, and professional. Let your experience speak for itself.</p><span class="card-link">Minimal and clear ↗</span></article>
        <article class="style-card"><div class="style-icon">02</div><h3>Modern</h3><p>A structured, contemporary layout for projects, skills, and achievements.</p><span class="card-link">Sharp and polished ↗</span></article>
        <article class="style-card"><div class="style-icon">03</div><h3>Creative</h3><p>A bold layout with personality for a portfolio that stands out.</p><span class="card-link">Express yourself ↗</span></article>
      </div>
    </section>`;
}

/* ---------- Log in / Sign up ---------- */
function authPage(mode) {
  const login = mode === 'login';
  app.innerHTML = `<section class="wrap auth auth-page"><a class="auth-home-link" href="${standaloneLogin ? 'index.html' : '#/'}">← Back to PortNova home</a><div class="auth-brand">PORT<span>NOVA</span></div><h1>${login ? 'Welcome back.' : 'Create your account'}</h1>
  <p class="sub">${login ? 'Log in to see your portfolios.' : 'Sign up so only you can see and edit your portfolios.'}</p>
  <form id="af">
    <label>Email<input type="email" name="email" required autocomplete="email"></label>
    <label>Password${login ? '' : '<small>At least 6 characters</small>'}<input type="password" name="password" required minlength="6" autocomplete="${login ? 'current-password' : 'new-password'}"></label>
    <button class="btn big" type="submit">${login ? 'Log in' : 'Sign up'}</button>
  </form>
  <p>${login ? 'No account yet? <a href="index.html#/signup">Sign up</a>' : 'Already have an account? <a href="login.html" target="_blank" rel="noopener">Log in</a>'}</p></section>`;
  document.getElementById('af').onsubmit = async e => {
    e.preventDefault();
    const { email, password } = Object.fromEntries(new FormData(e.target));
    try {
      if (login) {
        const { error } = await db.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast('Welcome back');
        if (standaloneLogin) location.href = 'index.html#/manage';
        else location.hash = '#/manage';
      } else {
        const { data, error } = await db.auth.signUp({ email, password });
        if (error) throw error;
        if (data.session) { toast('Account created'); if (standaloneLogin) location.href = 'index.html#/manage'; else location.hash = '#/manage'; }
        else toast('Check your email to confirm your account, then log in.');
      }
    } catch (err) { fail(err); }
  };
}

/* ---------- Form ---------- */
async function formPage(id) {
  const p = id ? await getPortfolio(id) : {};
  const f = (name, label, type = 'input', hint = '') => `<label>${label}${hint ? `<small>${hint}</small>` : ''}` +
    (type === 'textarea' ? `<textarea name="${name}" rows="4">${esc(p[name])}</textarea>` : `<input name="${name}" value="${esc(p[name])}" ${name === 'full_name' ? 'required pattern="[^0-9]+" title="Letters only, no numbers" maxlength="80"' : ''}>`) + `</label>`;
  app.innerHTML = `<section class="wrap narrow"><h1>${id ? 'Edit' : 'Create'} portfolio</h1>
  <form id="f">
    <h2>Personal information</h2>
    <div class="photo"><img id="pimg" alt="" src="${esc(p.photo || '')}" ${p.photo ? '' : 'hidden'}>
      <label class="btn ghost">Choose profile picture<input type="file" id="pfile" accept="image/*" hidden></label></div>
    ${f('full_name', 'Full name *', 'input', 'Letters only, no numbers')}${f('email', 'Email')}${f('phone', 'Contact number')}${f('address', 'Address')}
    ${f('about', 'About me', 'textarea')}
    <h2>Education</h2>${f('education', 'Educational background', 'textarea', 'One per line: Degree | School | Years')}
    <h2>Skills</h2>${f('skills', 'Skills', 'input', 'Separate with commas')}
    <h2>Projects</h2>${f('projects', 'Projects', 'textarea', 'One per line: Title | Description | Link (optional)')}
    <h2>Experience</h2>${f('experience', 'Work experience', 'textarea', 'One per line: Role | Company | Years')}
    <h2>Links</h2>${f('links', 'Social media / website links', 'textarea', 'One per line: Label | https://link')}
    <div class="actions"><button class="btn big" type="submit">Save and choose template</button><a class="btn ghost big" href="#/manage">Cancel</a></div>
  </form></section>`;

  let photo = p.photo || null;
  const nameBox = document.querySelector('[name="full_name"]');
  nameBox.oninput = () => { nameBox.value = nameBox.value.replace(/[0-9]/g, ''); };
  document.getElementById('pfile').onchange = e => resizeImage(e.target.files[0]).then(d => {
    photo = d; const i = document.getElementById('pimg'); i.src = d; i.hidden = false;
  }).catch(fail);

  document.getElementById('f').onsubmit = async e => {
    e.preventDefault();
    const rec = Object.fromEntries(new FormData(e.target)); rec.photo = photo;
    rec.full_name = rec.full_name.trim().replace(/\s+/g, ' ');
    if (!rec.full_name) return toast('Please enter your full name.', true);
    if (/[0-9]/.test(rec.full_name)) return toast('Full name cannot contain numbers.', true);
    try {
      const q = id ? db.from('portfolios').update(rec).eq('id', id) : db.from('portfolios').insert(rec);
      const { data, error } = await q.select().single();
      if (error) throw error;
      toast('Saved'); location.hash = `#/templates/${data.id}`;
    } catch (err) { fail(err); }
  };
}

function resizeImage(file) {
  return new Promise((res, rej) => {
    if (!file) return rej(new Error('No image selected.'));
    const img = new Image(), r = new FileReader();
    r.onload = () => { img.src = r.result; };
    img.onerror = () => rej(new Error('That file is not a valid image.'));
    img.onload = () => {
      const s = Math.min(1, 400 / Math.max(img.width, img.height)), c = document.createElement('canvas');
      c.width = img.width * s; c.height = img.height * s;
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      res(c.toDataURL('image/jpeg', 0.8));
    };
    r.readAsDataURL(file);
  });
}

/* ---------- Templates (loaded from Supabase) ---------- */
const avatar = p => p.photo ? `<img class="avatar" src="${esc(p.photo)}" alt="">` : `<div class="avatar ph">${esc((p.full_name || '?')[0])}</div>`;
const contact = p => [p.email, p.phone, p.address].filter(Boolean).map(esc);
const chips = p => (p.skills || '').split(',').map(s => s.trim()).filter(Boolean).map(s => `<span class="chip">${esc(s)}</span>`).join('');
const eduHTML = p => lines(p.education).map(l => { const [a, b, c] = parts(l); return `<div class="item"><b>${esc(a)}</b> ${esc(b)} <em>${esc(c)}</em></div>`; }).join('');
const expHTML = p => lines(p.experience).map(l => { const [a, b, c] = parts(l); return `<div class="item"><b>${esc(a)}</b> ${esc(b)} <em>${esc(c)}</em></div>`; }).join('');
const projHTML = p => lines(p.projects).map(l => { const [a, b, c] = parts(l); return `<div class="item card"><b>${esc(a)}</b><p>${esc(b)}</p>${c ? `<a href="${url(c)}" target="_blank" rel="noopener">View project</a>` : ''}</div>`; }).join('');
const linkHTML = p => lines(p.links).map(l => { const [a, b] = parts(l); return `<a href="${url(b || a)}" target="_blank" rel="noopener">${esc(a)}</a>`; }).join('');
const sec = (title, html) => html ? `<section><h2>${title}</h2>${html}</section>` : '';

const LAYOUTS = {
  simple: p => `<header>${avatar(p)}<h1>${esc(p.full_name)}</h1><p>${contact(p).join(' | ')}</p></header>
    ${sec('About', p.about && `<p>${esc(p.about)}</p>`)}${sec('Education', eduHTML(p))}${sec('Experience', expHTML(p))}
    ${sec('Skills', chips(p))}${sec('Projects', projHTML(p))}${sec('Links', linkHTML(p) && `<div class="links">${linkHTML(p)}</div>`)}`,
  modern: p => `<header>${avatar(p)}<div><h1>${esc(p.full_name)}</h1><p>${contact(p).join(' | ')}</p></div></header>
    <div class="grid">${sec('About', p.about && `<p>${esc(p.about)}</p>`)}${sec('Skills', chips(p))}${sec('Education', eduHTML(p))}
    ${sec('Experience', expHTML(p))}${sec('Projects', projHTML(p))}${sec('Links', linkHTML(p) && `<div class="links">${linkHTML(p)}</div>`)}</div>`,
  creative: p => `<aside>${avatar(p)}<h1>${esc(p.full_name)}</h1>${contact(p).map(c => `<p>${c}</p>`).join('')}
    ${chips(p) ? `<h3>Skills</h3>${chips(p)}` : ''}${linkHTML(p) ? `<h3>Links</h3><div class="links">${linkHTML(p)}</div>` : ''}</aside>
    <div class="body">${p.about ? `<p class="lead">${esc(p.about)}</p>` : ''}${sec('Experience', expHTML(p))}${sec('Projects', projHTML(p))}${sec('Education', eduHTML(p))}</div>`
};
const renderPortfolio = (p, t) => `<div class="portfolio ${t.layout}" style="--bg:${esc(t.bg)};--text:${esc(t.color)};--accent:${esc(t.accent)};font-family:${esc(t.font)}">${LAYOUTS[t.layout](p)}</div>`;

async function templatesPage(id) {
  const [p, templates] = await Promise.all([getPortfolio(id), getTemplates()]);
  app.innerHTML = `<section class="wrap"><h1>Choose a template</h1><p class="sub">Pick a design for ${esc(p.full_name)}.</p>
  <div class="tgrid">${templates.map(t => `<article class="tcard ${p.template_id === t.id ? 'on' : ''}">
    <div class="thumb">${renderPortfolio(p, t)}</div><h3>${esc(t.name)}</h3><p>${esc(t.description)}</p>
    <button class="btn" data-pick="${t.id}">Use ${esc(t.name)}</button></article>`).join('')}</div>
  <a href="#/form/${id}">Back to edit information</a></section>`;
  app.onclick = async e => {
    const n = e.target.dataset.pick; if (!n) return;
    const { error } = await db.from('portfolios').update({ template_id: +n }).eq('id', id);
    if (error) return fail(error);
    location.hash = `#/preview/${id}`;
  };
}

/* ---------- Preview ---------- */
async function previewPage(id) {
  const p = await getPortfolio(id), t = await getTemplate(p.template_id || 1);
  app.innerHTML = `<div class="bar"><span>Template: ${esc(t.name)}</span><span class="actions">
    <a class="btn ghost sm" href="#/templates/${id}">Change template</a><a class="btn ghost sm" href="#/form/${id}">Edit</a><a class="btn sm" href="#/manage">Done</a></span></div>
    ${renderPortfolio(p, t)}`;
}

/* ---------- Manage ---------- */
async function managePage() {
  const { data: rows, error } = await db.from('portfolios').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  app.innerHTML = `<section class="wrap"><div class="head"><h1>Manage portfolios</h1><a class="btn" href="#/form">New portfolio</a></div>
  ${rows.length ? rows.map(r => `<article class="li"><div class="grow"><h3>${esc(r.full_name)}</h3><p>${esc(r.email || 'No email')}</p></div>
    <div class="actions"><a class="btn sm" href="#/preview/${r.id}">View</a><a class="btn ghost sm" href="#/form/${r.id}">Edit</a>
    <button class="btn danger sm" data-del="${r.id}" data-name="${esc(r.full_name)}">Delete</button></div></article>`).join('')
    : `<div class="empty"><p>No portfolios yet.</p><a class="btn" href="#/form">Create portfolio</a></div>`}</section>`;
  app.onclick = async e => {
    const id = e.target.dataset.del; if (!id) return;
    if (!confirm(`Delete the portfolio for ${e.target.dataset.name}? This cannot be undone.`)) return;
    const { error } = await db.from('portfolios').delete().eq('id', id);
    if (error) return fail(error);
    toast('Deleted'); managePage();
  };
}
