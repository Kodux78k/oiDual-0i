/**
 * FUSION OS // UTOPIA PRO — Kernel JS (v1.0)
 * - Converteu o HTML fornecido para um único .js (IIFE)
 * - Injeta estilos, DOM, dependências (Tailwind + Lucide) automáticamente
 * - Exporta global `App` com a mesma API do HTML original
 * - Mantém safe-area, orb, cinebox, runtime, lab e tabs
 */

const App = (() => {
    // --- CONFIG & STATE ---
    const CONFIG = {
        rootId: 'os-root',
        styleId: 'utopia-pro-styles',
        deps: {
            tailwind: 'https://cdn.tailwindcss.com',
            lucide: 'https://unpkg.com/lucide@latest'
        }
    };

    let state = {
        active: false,
        currentTab: 'apps',
        user: 'VISITANTE',
        system: 'SINGULARITY',
        apps: [
            { name: 'OiDual System', icon: 'zap', url: 'https://kodux78k.github.io/oiDual-dip-0/', desc: 'Sistemas de comunicação mística quântica.' },
            { name: 'Vivivi Core', icon: 'activity', url: 'https://kodux78k.github.io/oiDual-Vivivi-1/', desc: 'Fluxos de dados de alta densidade.' },
            { name: 'Alpha Kernel', icon: 'cpu', url: 'https://kodux78k.github.io/dual-core-alpha/', desc: 'Processamento de arquitetura Alpha.' }
        ]
    };

    // --- UTIL ---
    const Utils = {
        injectDeps: () => {
            if (!document.querySelector(`script[src*="tailwindcss"]`)) {
                const s = document.createElement('script');
                s.src = CONFIG.deps.tailwind;
                document.head.appendChild(s);
            }
            if (!window.lucide && !document.querySelector(`script[src*="unpkg.com/lucide"]`)) {
                const s = document.createElement('script');
                s.src = CONFIG.deps.lucide;
                s.onload = () => { try { window.lucide.createIcons(); } catch (e) {} };
                document.head.appendChild(s);
            }
        },
        speak: (msg) => {
            try {
                if (!('speechSynthesis' in window)) return;
                window.speechSynthesis.cancel();
                const u = new SpeechSynthesisUtterance(msg);
                u.lang = 'pt-BR'; u.rate = 1.05; u.pitch = 0.95;
                window.speechSynthesis.speak(u);
            } catch (e) { /* noisy environments ignore */ }
        },
        createStyleIfMissing: (css) => {
            const existing = document.getElementById(CONFIG.styleId);
            if (existing) existing.remove();
            const s = document.createElement('style');
            s.id = CONFIG.styleId;
            s.innerHTML = css;
            document.head.appendChild(s);
        }
    };

    // --- STYLES (copiado do HTML) ---
    const STYLES = `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800;900&family=JetBrains+Mono:wght@400;700&display=swap');

        :root {
            --accent: #00f2ff;
            --accent-glow: rgba(0, 242, 255, 0.5);
            --bg-deep: #050508;
            --z-orb: 40000;
            --z-exit: 35000;
            --z-runtime: 30000;
            --z-monolith: 20000;
        }
        html, body {
            height: 100%;
            margin: 0;
            padding: 0;
            background: var(--bg-deep);
            color: #fff;
            font-family: 'Inter', sans-serif;
            -webkit-font-smoothing: antialiased;
            -webkit-text-size-adjust: 100%;
            -webkit-overflow-scrolling: touch;
        }
        body {
            padding-top: env(safe-area-inset-top);
            padding-right: env(safe-area-inset-right);
            padding-bottom: env(safe-area-inset-bottom);
            padding-left: env(safe-area-inset-left);
            overflow: hidden;
        }
        .orb-core { --core-offset: -34px; transform: translateY(calc(var(--core-offset))); }
        .host-bg { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; background: radial-gradient(circle at center, #0d0d1a 0%, #000 100%); z-index: -1; pointer-events: none; }
        .host-bg h1 { font-size: 15vw; font-weight: 900; letter-spacing: -0.05em; background: linear-gradient(to bottom, rgba(255,255,255,0.05), transparent); -webkit-background-clip: text; -webkit-text-fill-color: transparent; user-select: none; margin: 0; }
        @keyframes rotate-ring { from { transform: rotate(0deg); } to   { transform: rotate(360deg); } }
        .orb-portal { position: fixed; bottom: calc(30px + env(safe-area-inset-bottom)); left: 50%; transform: translateX(-50%); width: 70px; height: 70px; z-index: var(--z-orb); cursor: pointer; display: grid; place-items: center; transition: transform 0.45s cubic-bezier(0.19, 1, 0.22, 1), filter 0.25s; pointer-events: auto; }
        .orb-portal:hover { transform: translateX(-50%) scale(1.12); filter: brightness(1.15); }
        .orb-ring { width: 48px; height: 48px; border: 2px solid transparent; border-top-color: var(--accent); border-bottom-color: #bd00ff; border-radius: 50%; animation: rotate-ring 3s linear infinite; filter: drop-shadow(0 0 10px var(--accent-glow)); pointer-events: none; transform-origin: center center; will-change: transform, width, height; }
        .orb-core { width: 10px; height: 10px; background: #fff; border-radius: 50%; box-shadow: 0 0 20px #fff; transition: width 0.25s ease, height 0.25s ease, background 0.25s ease, box-shadow 0.25s ease; pointer-events: none; }
        .os-active .orb-ring { width: 60px; height: 60px; border-width: 3px; }
        .os-active .orb-core { width: 16px; height: 16px; background: var(--accent); box-shadow: 0 0 30px var(--accent); }
        .monolith-container { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; padding-top: calc(20px + env(safe-area-inset-top)); padding-right: calc(20px + env(safe-area-inset-right)); padding-bottom: calc(20px + env(safe-area-inset-bottom)); padding-left: calc(20px + env(safe-area-inset-left)); pointer-events: none; z-index: var(--z-monolith); }
        .monolith { width: 100%; max-width: 1100px; height: calc(100vh - (20px + env(safe-area-inset-top)) - (20px + env(safe-area-inset-bottom))); box-sizing: border-box; background: rgba(8, 8, 12, 0.9); backdrop-filter: blur(50px) saturate(160%); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 28px; opacity: 0; transform: translateY(18px) scale(0.99); transition: opacity 0.6s cubic-bezier(0.19, 1, 0.22, 1), transform 0.6s cubic-bezier(0.19, 1, 0.22, 1); overflow: hidden; display: flex; flex-direction: column; pointer-events: none; box-shadow: 0 40px 120px rgba(0,0,0,0.8); min-height: 280px; max-height: 1600px; }
        .os-active .monolith { opacity: 1; transform: translateY(0) scale(1); pointer-events: auto; }
        .monolith header { padding-left: calc(18px + env(safe-area-inset-left)); padding-right: calc(18px + env(safe-area-inset-right)); border-bottom: 1px solid rgba(255,255,255,0.03); background: linear-gradient(180deg, rgba(255,255,255,0.02), transparent); }
        .monolith header .h-24 { height: 64px; }
        .monolith main { -webkit-overflow-scrolling: touch; overflow-y: auto; padding: 24px; flex: 1 1 auto; }
        .exit-fusion-btn { position: fixed; top: calc(20px + env(safe-area-inset-top)); right: calc(20px + env(safe-area-inset-right)); width: 36px; height: 36px; background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); backdrop-filter: blur(10px); border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: var(--z-exit); color: rgba(255,255,255,0.5); transition: transform 0.18s ease, background 0.18s ease, border-color 0.18s ease; opacity: 0; transform: scale(0.85); pointer-events: none; }
        .exit-fusion-btn.visible { opacity: 1; transform: scale(1); pointer-events: auto; }
        .exit-fusion-btn:hover { background: rgba(239, 68, 68, 0.12); border-color: rgba(239, 68, 68, 0.25); color: #ef4444; transform: scale(1.05); }
        .cinebox-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 50000; opacity: 0; pointer-events: none; transition: opacity 0.4s ease; display: flex; align-items: center; justify-content: center; padding: calc(12px + env(safe-area-inset-top)) calc(12px + env(safe-area-inset-right)) calc(12px + env(safe-area-inset-bottom)) calc(12px + env(safe-area-inset-left)); box-sizing: border-box; }
        .cinebox-overlay.active { opacity: 1; pointer-events: auto; }
        .cinebox-frame { width: min(920px, calc(100% - 48px)); height: min(860px, calc(100% - 48px)); background: #000; border-radius: 18px; border: 8px solid #111; box-shadow: 0 60px 140px rgba(0,0,0,0.9); position: relative; overflow: hidden; transform: scale(0.92); transition: transform 0.5s cubic-bezier(0.19, 1, 0.22, 1); }
        .cinebox-overlay.active .cinebox-frame { transform: scale(1); }
        .runtime-container { position: fixed; inset: 0; z-index: var(--z-runtime); background: #000; transform: translateY(100%); transition: transform 0.45s cubic-bezier(0.19, 1, 0.22, 1); padding-top: env(safe-area-inset-top); padding-bottom: env(safe-area-inset-bottom); padding-left: env(safe-area-inset-left); padding-right: env(safe-area-inset-right); box-sizing: border-box; }
        .runtime-container.active { transform: translateY(0); }
        .custom-scroll::-webkit-scrollbar { height: 6px; width: 6px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: rgba(0, 242, 255, 0.18); border-radius: 10px; }
        .custom-scroll::-webkit-scrollbar-thumb:hover { background: var(--accent); }
        .nav-btn { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; transition: all 0.22s ease; color: rgba(255,255,255,0.25); }
        .nav-btn.active { color: var(--accent); background: rgba(0, 242, 255, 0.06); border: 1px solid rgba(0, 242, 255, 0.08); }
        .app-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.04); border-radius: 20px; padding: 20px; transition: transform 0.28s ease, box-shadow 0.28s ease; cursor: pointer; }
        .app-card:hover { transform: translateY(-6px); box-shadow: 0 30px 60px rgba(0,0,0,0.6); }
        @media (max-width: 640px) {
            .host-bg h1 { font-size: 22vw; }
            .monolith { border-radius: 18px; }
            .cinebox-frame { border-radius: 14px; }
        }
    `;

    // --- UI BUILD ---
    const UI = {
        build: () => {
            // avoid building twice
            if (document.getElementById(CONFIG.rootId)) return;

            // inject styles
            Utils.createStyleIfMissing(STYLES);

            // root container
            const root = document.createElement('div');
            root.id = CONFIG.rootId;
            root.className = '';

            // host-bg
            const hostBg = document.createElement('div');
            hostBg.className = 'host-bg';
            hostBg.innerHTML = `<h1 id="bg-text">FUSION</h1>`;

            // global exit button
            const exitBtn = document.createElement('div');
            exitBtn.id = 'global-exit';
            exitBtn.className = 'exit-fusion-btn';
            exitBtn.title = 'Encerrar Sessão';
            exitBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M18.36 6.64a9 9 0 11-12.73 0" /><path d="M12 2v6" /></svg>`;
            exitBtn.addEventListener('click', () => App.closeRuntime());

            // os-root structure
            const monolithContainer = document.createElement('div');
            monolithContainer.className = 'monolith-container';
            monolithContainer.innerHTML = `
                <div class="monolith" role="dialog" aria-modal="true" aria-hidden="true">
                    <header class="h-24 border-b border-white/5 flex items-center justify-between px-4 relative z-50 shrink-0">
                        <div class="flex items-center gap-2">
                            <button id="btn-apps" class="nav-btn active" title="Apps"><i data-lucide="layout-grid" class="w-5 h-5"></i></button>
                            <button id="btn-lab" class="nav-btn" title="Laboratório"><i data-lucide="flask-conical" class="w-5 h-5"></i></button>
                            <button id="btn-auth" class="nav-btn" title="Ativações"><i data-lucide="key" class="w-5 h-5"></i></button>
                        </div>

                        <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span id="sys-title" class="text-[9px] font-black tracking-[0.6em] text-white/20 uppercase">SINGULARITY PRO</span>
                            <div class="flex items-center gap-4 mt-1">
                                <div class="w-8 h-[1px] bg-white/10"></div>
                                <span id="tab-label" class="text-[10px] text-cyan-400 font-mono tracking-widest font-bold">MODULES</span>
                                <div class="w-8 h-[1px] bg-white/10"></div>
                            </div>
                        </div>

                        <div class="flex items-center gap-4">
                            <div class="text-right">
                                <p class="text-[7px] text-white/20 uppercase font-bold tracking-widest">Operator</p>
                                <p id="user-display" class="text-[10px] text-cyan-400 font-mono font-bold tracking-tight">CORE_USER</p>
                            </div>
                        </div>
                    </header>

                    <main id="main-content" class="flex-1 overflow-y-auto custom-scroll p-6 relative z-10"></main>
                </div>
            `;

            // cinebox
            const cinebox = document.createElement('div');
            cinebox.id = 'cinebox';
            cinebox.className = 'cinebox-overlay';
            cinebox.innerHTML = `
                <div class="cinebox-frame">
                    <iframe id="cinebox-iframe" class="w-full h-full border-none"></iframe>
                </div>
            `;
            cinebox.addEventListener('click', () => App.closeCinebox());
            cinebox.querySelector('.cinebox-frame').addEventListener('click', (e) => e.stopPropagation());

            // orb
            const orb = document.createElement('div');
            orb.className = 'orb-portal';
            orb.id = 'master-orb';
            orb.innerHTML = `<div class="orb-ring"></div><div class="orb-core"></div>`;
            orb.addEventListener('click', () => App.toggle());

            // runtime container
            const runtime = document.createElement('div');
            runtime.id = 'runtime';
            runtime.className = 'runtime-container';
            runtime.setAttribute('aria-hidden', 'true');
            runtime.innerHTML = `<iframe id="runtime-frame" class="w-full h-full border-none bg-black"></iframe>`;

            // append nodes to body
            document.body.appendChild(hostBg);
            document.body.appendChild(exitBtn);
            root.appendChild(monolithContainer);
            root.appendChild(cinebox);
            root.appendChild(orb);
            document.body.appendChild(root);
            document.body.appendChild(runtime);

            // wire nav buttons (delegated)
            const btnApps = document.getElementById('btn-apps');
            const btnLab = document.getElementById('btn-lab');
            const btnAuth = document.getElementById('btn-auth');
            if (btnApps) btnApps.addEventListener('click', () => App.setTab('apps'));
            if (btnLab) btnLab.addEventListener('click', () => App.setTab('lab'));
            if (btnAuth) btnAuth.addEventListener('click', () => App.setTab('auth'));

            // ensure lucide icons render
            setTimeout(() => { try { if (window.lucide) window.lucide.createIcons(); } catch (e) {} }, 120);
        }
    };

    // --- PARSER / LAB converter (same logic as original) ---
    const Parser = {
        convertFromHtml: (inputHtml) => {
            if (!inputHtml) return '';
            const doc = new DOMParser().parseFromString(inputHtml, 'text/html');
            const styles = Array.from(doc.querySelectorAll('style')).map(s => s.innerHTML).join('\n');
            const body = doc.body.innerHTML.replace(/`/g, '\\`');
            const scripts = Array.from(doc.querySelectorAll('script')).map(s => s.innerHTML).join('\n');
            const output = `/* FUSION PRO GENERATED */\n(function(){\n  const css = \`${styles}\`;\n  const s = document.createElement('style'); s.innerHTML = css; document.head.appendChild(s);\n  const d = document.createElement('div'); d.innerHTML = \`${body}\`; document.body.appendChild(d);\n  try { ${scripts} } catch(e) { console.error(e); }\n})();`;
            return output;
        }
    };

    // --- RENDER & LOGIC (public API preserved) ---
    const render = () => {
        const main = document.getElementById('main-content');
        if (!main) return;
        if (state.currentTab === 'apps') {
            main.innerHTML = `
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    ${state.apps.map(app => `
                        <div class="app-card group" data-url="${app.url}">
                            <div class="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <i data-lucide="${app.icon}" class="w-5 h-5 text-cyan-400"></i>
                            </div>
                            <h3 class="font-bold text-lg mb-1 tracking-tight">${app.name}</h3>
                            <p class="text-[11px] text-white/30 leading-relaxed font-light">${app.desc}</p>
                            <div class="mt-8 pt-4 border-t border-white/5 flex justify-between items-center opacity-40 group-hover:opacity-100 transition-opacity">
                                <span class="text-[8px] font-mono tracking-widest uppercase">Kernel Verified</span>
                                <i data-lucide="arrow-up-right" class="w-3 h-3 text-cyan-400"></i>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
            // wire clicks for the dynamically created cards
            setTimeout(() => {
                document.querySelectorAll('.app-card').forEach(card => {
                    card.addEventListener('click', (e) => {
                        const url = card.getAttribute('data-url');
                        if (url) App.launch(url);
                    });
                });
            }, 40);
        } else if (state.currentTab === 'lab') {
            main.innerHTML = `
                <div class="flex flex-col h-full gap-6">
                    <div class="flex items-center justify-between shrink-0">
                        <div>
                            <h2 class="text-2xl font-bold tracking-tighter">Inject Lab</h2>
                            <p class="text-[10px] text-white/30 uppercase tracking-widest mt-1">Transformação de código bruto</p>
                        </div>
                        <div class="flex gap-3">
                            <button id="preview-cinebox-btn" class="px-5 py-2.5 bg-white/5 rounded-2xl text-[10px] font-bold hover:bg-white/10 transition-all uppercase tracking-widest border border-white/10">Preview Cinebox</button>
                            <button id="process-lab-btn" class="px-6 py-2.5 bg-cyan-500 text-black font-black rounded-2xl text-[10px] hover:bg-white transition-all uppercase tracking-widest">Processar</button>
                        </div>
                    </div>
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
                        <textarea id="lab-input" placeholder="Cole o código fonte aqui..." class="bg-black/40 border border-white/5 rounded-3xl p-6 font-mono text-[10px] text-white/40 outline-none focus:border-cyan-500/30 custom-scroll resize-none"></textarea>
                        <div class="relative flex flex-col h-full">
                            <textarea id="lab-output" readonly placeholder="Output refinado..." class="flex-1 bg-cyan-500/5 border border-cyan-500/10 rounded-3xl p-6 font-mono text-[10px] text-cyan-400 outline-none custom-scroll resize-none"></textarea>
                            <button id="copy-lab-btn" class="absolute bottom-6 right-6 p-4 bg-cyan-500 text-black rounded-2xl hover:scale-110 active:scale-95 transition-all shadow-xl shadow-cyan-500/20">
                                <i data-lucide="copy" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            setTimeout(() => {
                const previewBtn = document.getElementById('preview-cinebox-btn');
                const processBtn = document.getElementById('process-lab-btn');
                const copyBtn = document.getElementById('copy-lab-btn');
                if (previewBtn) previewBtn.addEventListener('click', () => App.openCinebox(document.getElementById('lab-input').value));
                if (processBtn) processBtn.addEventListener('click', () => App.processLab());
                if (copyBtn) copyBtn.addEventListener('click', () => App.copyLab());
            }, 40);
        } else {
            main.innerHTML = `
                <div class="flex flex-col items-center justify-center h-full max-w-md mx-auto text-center">
                    <div class="w-20 h-20 rounded-3xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-10">
                        <i data-lucide="unlock" class="w-8 h-8 text-cyan-400"></i>
                    </div>
                    <h2 class="text-2xl font-bold mb-4">Selo de Ativação</h2>
                    <p class="text-[12px] text-white/40 mb-10 leading-relaxed font-light uppercase tracking-widest">Insira seu código de kernel para desbloquear novas frequências de aplicação.</p>
                    <input type="text" id="auth-code" placeholder="____-____-____" class="w-full bg-black/40 border border-white/10 rounded-3xl py-5 px-8 text-center font-mono text-lg tracking-[0.5em] focus:border-cyan-500/50 outline-none transition-all mb-4">
                    <button id="sync-proto-btn" class="w-full bg-white/5 border border-white/10 py-5 rounded-3xl text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-white hover:text-black transition-all">Sincronizar Protocolo</button>
                </div>
            `;
            setTimeout(() => {
                const syncBtn = document.getElementById('sync-proto-btn');
                if (syncBtn) syncBtn.addEventListener('click', () => Utils.speak('Código invalidado pelo servidor Alpha'));
            }, 40);
        }

        // re-render icons
        setTimeout(() => { try { if (window.lucide) window.lucide.createIcons(); } catch (e) {} }, 120);
    };

    // --- ACTIONS (public API) ---
    const toggle = () => {
        const runtimeEl = document.getElementById('runtime');
        if (runtimeEl && runtimeEl.classList.contains('active')) {
            closeRuntime();
            return;
        }

        state.active = !state.active;
        const root = document.getElementById(CONFIG.rootId);
        if (root) root.classList.toggle('os-active', state.active);

        const mon = document.querySelector('.monolith');
        if (mon) mon.setAttribute('aria-hidden', (!state.active).toString());

        if (state.active) {
            render();
            Utils.speak("Conexão Utopiana estabelecida.");
        } else {
            Utils.speak("Sistema em standby.");
        }
    };

    const setTab = (tab) => {
        state.currentTab = tab;
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        const btn = document.getElementById(`btn-${tab}`);
        if (btn) btn.classList.add('active');
        const tabLabel = document.getElementById('tab-label');
        if (tabLabel) tabLabel.innerText = tab === 'auth' ? 'ACTIVATION' : tab.toUpperCase();
        render();
    };

    const launch = (url) => {
        const rt = document.getElementById('runtime');
        const frame = document.getElementById('runtime-frame');
        const exit = document.getElementById('global-exit');

        if (!rt || !frame) return;
        frame.src = url;
        rt.classList.add('active');
        exit.classList.add('visible');

        // Oculta o Monolith mas mantem o orb visível
        state.active = false;
        const root = document.getElementById(CONFIG.rootId);
        if (root) root.classList.remove('os-active');
        Utils.speak("Fusão iniciada.");
    };

    const closeRuntime = () => {
        const rt = document.getElementById('runtime');
        const exit = document.getElementById('global-exit');
        if (rt) rt.classList.remove('active');
        if (exit) exit.classList.remove('visible');
        state.active = true;
        const root = document.getElementById(CONFIG.rootId);
        if (root) root.classList.add('os-active');
        setTimeout(() => {
            const frame = document.getElementById('runtime-frame');
            if (frame) frame.src = '';
        }, 600);
    };

    const openCinebox = (code) => {
        const cine = document.getElementById('cinebox');
        const frame = document.getElementById('cinebox-iframe');
        if (!cine || !frame) return;
        const fullHtml = `<html><head><meta name="viewport" content="width=device-width,initial-scale=1"/><style>body{margin:0;overflow:hidden;background:#000;color:#fff}</style></head><body>${code}</body></html>`;
        const blob = new Blob([fullHtml], { type: 'text/html' });
        frame.src = URL.createObjectURL(blob);
        cine.classList.add('active');
    };

    const closeCinebox = () => {
        const cine = document.getElementById('cinebox');
        const frame = document.getElementById('cinebox-iframe');
        if (!cine || !frame) return;
        cine.classList.remove('active');
        try { URL.revokeObjectURL(frame.src); } catch (e) {}
        frame.src = '';
    };

    const processLab = () => {
        const input = document.getElementById('lab-input');
        if (!input) return Utils.speak("Nenhum código no Lab.");
        const source = input.value;
        if (!source) return Utils.speak("Nenhum código no Lab.");
        const output = Parser.convertFromHtml(source);
        const outEl = document.getElementById('lab-output');
        if (outEl) outEl.value = output;
        Utils.speak("Módulo refinado com sucesso.");
    };

    const copyLab = () => {
        const out = document.getElementById('lab-output');
        if (!out) return;
        out.select();
        try {
            document.execCommand('copy');
            Utils.speak("Código copiado.");
        } catch (e) {
            Utils.speak("Falha ao copiar.");
        }
    };

    // --- INIT / BOOT ---
    const init = () => {
        Utils.injectDeps();
        UI.build();

        // hydrate user/system from localStorage if present
        const u = localStorage.getItem('di_userName');
        const s = localStorage.getItem('di_infodoseName');
        if (u) state.user = u;
        if (s) state.system = s;

        const userDisplay = document.getElementById('user-display');
        const bgText = document.getElementById('bg-text');
        const sysTitle = document.getElementById('sys-title');
        if (userDisplay) userDisplay.innerText = state.user;
        if (bgText) bgText.innerText = state.system;
        if (sysTitle) sysTitle.innerText = `${state.system} PRO`;

        // initial render
        render();

        // ensure icons draw
        setTimeout(() => { try { if (window.lucide) window.lucide.createIcons(); } catch (e) {} }, 200);
    };

    // expose public API (keeps names from HTML)
    return {
        toggle, setTab, launch, closeRuntime, processLab, copyLab, openCinebox, closeCinebox, init
    };
})();

// auto-init on load like original
window.addEventListener('load', () => App.init());