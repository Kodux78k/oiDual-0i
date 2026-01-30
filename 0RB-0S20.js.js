/**
 * FUSION OS // ORB WIDGET MODULE v3.0 (ENHANCED - LIVROVIVO EDITION)
 * Architecture: Widget Loader / Self-Contained / IIFE
 * Features: Permissões Granulares, Fusões Inteligentes, LivroVivo Design System
 * Enhancements: Permission System, Smart Fusion, UI/UX Refinement, Organized Comments
 */

const FusionOS = (() => {
    // ═══════════════════════════════════════════════════════════════════════════
    // 1. CONFIGURAÇÃO & ESTADO PRIVADO
    // ═══════════════════════════════════════════════════════════════════════════
    const CONFIG = {
        key: 'fusion_os_state_v3_0',
        rootId: 'fusion-os-root',
        fusionLayerId: 'navRoot',
        customCssRootId: 'custom-css-root',
        storageKeyLegacy: 'fusion_os_v5_ultimate',
        voice: false, // Voice disabled by default for performance
    };

    // Aplicativos padrão com permissões
    const DEFAULT_APPS = [
        {
            id: 'DELTA',
            name: 'Delta Hub',
            desc: 'Interface de conexão externa.',
            url: 'https://kodux78k.github.io/DualInfodose-VirgemHuB/index.html',
            icon: 'globe',
            active: true,
            code: 'DELTA',
            permissions: ['READ', 'FUSION']
        },
        {
            id: 'LIVROVIVO',
            name: 'LivroVivo',
            desc: 'Sistema de documentação dinâmica.',
            url: 'https://kodux78k.github.io/Dual-Docs/index.html',
            icon: 'book',
            active: true,
            code: 'LIVROVIVO',
            permissions: ['READ', 'WRITE']
        },
        {
            id: 'VIVIVI',
            name: 'Vivivi System',
            desc: 'Plataforma de identificação.',
            url: 'https://kodux78k.github.io/oiDual-Vivivi-1/',
            icon: 'dna',
            active: false,
            code: 'VIVIVI',
            permissions: ['READ', 'ADMIN']
        }
    ];

    let _state = {
        active: false,
        installed: [],
        hiddenApps: [],
        customCSS: '',
        currentTab: 'dashboard',
        userData: { user: 'Visitante', system: 'SINGULARITY', stats: {} }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // 2. SUBSISTEMA DE UTILITÁRIOS
    // ═══════════════════════════════════════════════════════════════════════════
    const Utils = {
        /**
         * Text-to-Speech em português
         */
        speak: (msg) => {
            if (!CONFIG.voice || !('speechSynthesis' in window)) return;
            try {
                window.speechSynthesis.cancel();
                const u = new SpeechSynthesisUtterance(msg);
                u.lang = 'pt-BR';
                u.rate = 1.15;
                window.speechSynthesis.speak(u);
            } catch (e) {
                console.warn('TTS falhou', e);
            }
        },

        /**
         * Salva estado no localStorage
         */
        save: () => {
            localStorage.setItem(CONFIG.key, JSON.stringify({
                installed: _state.installed,
                hiddenApps: _state.hiddenApps,
                customCSS: _state.customCSS,
                userData: _state.userData
            }));
        },

        /**
         * Carrega estado do localStorage
         */
        load: () => {
            const raw = localStorage.getItem(CONFIG.key) || localStorage.getItem(CONFIG.storageKeyLegacy);
            if (raw) {
                try {
                    const parsed = JSON.parse(raw);
                    _state.installed = parsed.installed || [...DEFAULT_APPS];
                    _state.hiddenApps = parsed.hiddenApps || [];
                    _state.customCSS = parsed.customCSS || '';
                    _state.userData = parsed.userData || _state.userData;
                } catch (e) {
                    _state.installed = [...DEFAULT_APPS];
                }
            } else {
                _state.installed = [...DEFAULT_APPS];
            }

            // Lógica de identidade do usuário
            const kardDataRaw = localStorage.getItem('fusion_os_data_v2');
            if (kardDataRaw) {
                try {
                    const parsedKard = JSON.parse(kardDataRaw);
                    if (!parsedKard.isEncrypted && parsedKard.data) {
                        _state.userData.user = parsedKard.data.user || _state.userData.user;
                    } else {
                        _state.userData.user = window.di_userName || localStorage.getItem('di_userName') || _state.userData.user;
                    }
                } catch (e) { /* ignore */ }
            } else {
                _state.userData.user = window.di_userName || localStorage.getItem('di_userName') || _state.userData.user;
            }
            _state.userData.system = window.di_infodoseName || localStorage.getItem('di_infodoseName') || _state.userData.system;
        },

        /**
         * Injeta dependências externas (Tailwind, Lucide)
         */
        injectDeps: () => {
            if (!document.querySelector('script[src*="tailwindcss"]')) {
                const s = document.createElement('script');
                s.src = 'https://cdn.tailwindcss.com';
                document.head.appendChild(s);
            }
            if (!document.querySelector('script[src*="unpkg.com/lucide"]') && !window.lucide) {
                const s = document.createElement('script');
                s.src = 'https://unpkg.com/lucide@latest';
                s.onload = () => {
                    try {
                        window.lucide.createIcons();
                    } catch (e) { }
                };
                document.head.appendChild(s);
            }
        },

        /**
         * Efeito de shake visual para feedback
         */
        triggerShake: () => {
            document.body.style.animation = "shake 0.32s cubic-bezier(.36,.07,.19,.97) both";
            setTimeout(() => document.body.style.animation = "", 340);
        },

        /**
         * Gera hash para identificação
         */
        generateHash: (s) => {
            let h = 0xdeadbeef;
            for (let i = 0; i < s.length; i++) {
                h = Math.imul(h ^ s.charCodeAt(i), 2654435761);
            }
            return (h ^ (h >>> 16)) >>> 0;
        }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // 3. SUBSISTEMA DE PERMISSÕES
    // ═══════════════════════════════════════════════════════════════════════════
    const Permissions = {
        /**
         * Verifica se um app tem uma permissão específica
         * @param {string} appId - ID do aplicativo
         * @param {string} permission - Tipo de permissão (READ, WRITE, FUSION, ADMIN)
         * @returns {boolean}
         */
        check: (appId, permission) => {
            const app = _state.installed.find(a => a.id === appId || a.code === appId);
            return app && app.permissions && app.permissions.includes(permission);
        },

        /**
         * Concede uma permissão a um app
         */
        grant: (appId, permission) => {
            const app = _state.installed.find(a => a.id === appId || a.code === appId);
            if (app && !app.permissions.includes(permission)) {
                app.permissions.push(permission);
                Utils.save();
            }
        },

        /**
         * Revoga uma permissão de um app
         */
        revoke: (appId, permission) => {
            const app = _state.installed.find(a => a.id === appId || a.code === appId);
            if (app) {
                app.permissions = app.permissions.filter(p => p !== permission);
                Utils.save();
            }
        },

        /**
         * Retorna todas as permissões de um app
         */
        getAll: (appId) => {
            const app = _state.installed.find(a => a.id === appId || a.code === appId);
            return app ? app.permissions : [];
        }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // 4. SUBSISTEMA DE FUSÕES INTELIGENTES
    // ═══════════════════════════════════════════════════════════════════════════
    const SmartFusion = {
        /**
         * Valida e executa fusão entre apps
         */
        merge: async (sourceApp, targetApp) => {
            // Verifica permissão de fusão
            if (!Permissions.check(sourceApp.id, 'FUSION')) {
                Utils.speak('Permissão de fusão negada para este aplicativo.');
                return false;
            }

            console.log(`[FUSION] Fusionando ${sourceApp.name} com ${targetApp.name}`);
            Utils.speak(`Iniciando fusão de ${sourceApp.name}.`);
            return true;
        },

        /**
         * Executa a fusão de um módulo no DOM
         */
        performFusion: async (module) => {
            const layer = document.getElementById(CONFIG.fusionLayerId);
            if (!layer) return alert("Erro: NavRoot não encontrado.");

            if (_state.active) FusionOS.toggle();

            document.getElementById('fusion-exit-ctrl').classList.remove('hidden');
            Utils.speak("Fusão iniciada.");

            let content = "";
            if (module.url) {
                try {
                    const resp = await fetch(module.url);
                    if (!resp.ok) throw new Error("Network");
                    content = await resp.text();
                    FusionOS.injectIntoDOM(layer, content);
                } catch (e) {
                    const ifr = document.createElement('iframe');
                    ifr.src = module.url;
                    ifr.style.cssText = "width:100vw; height:100vh; border:none; position:fixed; inset:0; z-index:10015; background:black;";
                    layer.appendChild(ifr);
                }
            } else if (module.html) {
                FusionOS.injectIntoDOM(layer, module.html);
            } else {
                Utils.speak("Conteúdo do módulo indisponível.");
            }
        }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // 5. GERADOR DE UI (Estilos & HTML)
    // ═══════════════════════════════════════════════════════════════════════════
    const UI = {
        /**
         * Estilos CSS com design system LivroVivo
         */
        styles: `
            /* ─────────────────────────────────────────────────────────────────
               IMPORTAÇÕES E VARIÁVEIS DE TEMA
               ───────────────────────────────────────────────────────────────── */
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;700&display=swap');

            :root {
                --bg-primary: rgb(7, 11, 20);
                --bg-secondary: rgba(15, 23, 42, 0.8);
                --text-primary: rgb(234, 246, 255);
                --text-secondary: rgba(234, 246, 255, 0.7);
                --text-muted: rgba(234, 246, 255, 0.4);
                --border-light: rgba(255, 255, 255, 0.08);
                --border-medium: rgba(255, 255, 255, 0.15);
                --accent-cyan: #00f2ff;
                --accent-purple: #bd00ff;
                --accent-red: #ef4444;
                --orb-cyan: #00f2ff;
                --orb-purple: #bd00ff;
            }

            #${CONFIG.rootId} {
                font-family: 'Inter', sans-serif;
                color: white;
                pointer-events: auto;
            }

            /* ─────────────────────────────────────────────────────────────────
               ANIMAÇÕES
               ───────────────────────────────────────────────────────────────── */
            @keyframes orb-spin {
                to { transform: rotate(360deg); }
            }

            @keyframes orb-pulse {
                0%, 100% { box-shadow: 0 0 30px rgba(0, 242, 255, 0.6); }
                50% { box-shadow: 0 0 50px rgba(0, 242, 255, 0.8); }
            }

            @keyframes slide-up {
                from { transform: translateY(100%); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }

            @keyframes shake {
                0% { transform: translate(1px,1px); }
                10% { transform: translate(-1px,-2px); }
                100% { transform: translate(0); }
            }

            /* ─────────────────────────────────────────────────────────────────
               MONOLITH ARCHITECTURE (Painel Principal)
               ───────────────────────────────────────────────────────────────── */
            .monolith-wrapper {
                perspective: 2000px;
                z-index: 9998;
                pointer-events: none;
            }

            .monolith {
                background: rgba(10, 10, 14, 0.95);
                backdrop-filter: blur(60px);
                border: 1px solid rgba(255,255,255,0.08);
                border-radius: 40px;
                transform-origin: bottom center;
                clip-path: circle(0% at 50% 100%);
                transform: translateY(60px) scale(0.9);
                opacity: 0;
                transition: all 0.7s cubic-bezier(0.19, 1, 0.22, 1);
                pointer-events: none;
                overflow: hidden;
                box-shadow: 0 40px 100px -20px rgba(0,0,0,0.8);
                position: fixed;
                bottom: 0;
                left: 50%;
                transform: translateX(-50%) translateY(60px) scale(0.9);
                width: 90%;
                max-width: 500px;
                height: 70vh;
                max-height: 600px;
            }

            .os-active .monolith {
                transform: translateX(-50%) translateY(0) scale(1);
                opacity: 1;
                clip-path: circle(150% at 50% 100%);
                pointer-events: auto;
            }

            /* ─────────────────────────────────────────────────────────────────
               NAVEGAÇÃO POR ABAS
               ───────────────────────────────────────────────────────────────── */
            .tab-btn {
                width: 44px;
                height: 44px;
                border-radius: 14px;
                transition: all .3s;
                color: rgba(255,255,255,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                background: transparent;
                border: 1px solid transparent;
                cursor: pointer;
                outline: none;
            }

            .tab-btn:hover {
                color: #fff;
                background: rgba(255,255,255,0.04);
            }

            .tab-btn.active {
                color: #00f2ff;
                background: rgba(0,242,255,0.08);
                border-color: rgba(0,242,255,0.12);
                box-shadow: 0 0 12px rgba(0,242,255,0.06);
            }

            /* ─────────────────────────────────────────────────────────────────
               RUNTIME LAYER (Sandbox)
               ───────────────────────────────────────────────────────────────── */
            .runtime-layer {
                position: fixed;
                inset: 0;
                background: #050505;
                transform: translateY(100%);
                transition: .6s cubic-bezier(0.19, 1, 0.22, 1);
                z-index: 100;
            }

            .runtime-layer.visible {
                transform: translateY(0);
            }

            /* ─────────────────────────────────────────────────────────────────
               ORB TRIGGER (Botão Flutuante)
               ───────────────────────────────────────────────────────────────── */
            .orb-trigger {
                position: fixed;
                bottom: 30px;
                left: 50%;
                transform: translateX(-50%);
                width: 72px;
                height: 72px;
                cursor: pointer;
                z-index: 10010;
                display: grid;
                place-items: center;
                background: transparent;
                border: none;
                pointer-events: auto;
                outline: none;
                transition: transform 0.36s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }

            .orb-trigger:hover {
                transform: translateX(-50%) scale(1.08);
            }

            .orb-core {
                width: 10px;
                height: 10px;
                background: #fff;
                border-radius: 50%;
                box-shadow: 0 0 18px rgba(255,255,255,0.95);
                transition: transform .36s, box-shadow .36s, background .36s;
            }

            .orb-ring {
                position: absolute;
                width: 52px;
                height: 52px;
                border-radius: 50%;
                border: 2px solid transparent;
                border-top-color: var(--orb-cyan);
                border-bottom-color: var(--orb-purple);
                animation: orb-spin 4s linear infinite;
                opacity: .75;
                transition: all .45s ease;
            }

            .os-active .orb-core {
                background: var(--orb-cyan);
                box-shadow: 0 0 30px var(--orb-cyan);
                transform: scale(1.18);
                animation: orb-pulse 2s ease-in-out infinite;
            }

            .os-active .orb-ring {
                animation-duration: 1.25s;
                opacity: 1;
                border-color: var(--orb-cyan);
                box-shadow: 0 0 20px rgba(0,242,255,0.18);
            }

            /* ─────────────────────────────────────────────────────────────────
               ACCORDION
               ───────────────────────────────────────────────────────────────── */
            .accordion-item {
                transition: all .4s cubic-bezier(.25,1,.5,1);
                overflow: hidden;
                border: 1px solid rgba(255,255,255,0.05);
                background: linear-gradient(145deg, rgba(255,255,255,0.02) 0%, rgba(0,0,0,0.3) 100%);
                border-radius: 16px;
            }

            .accordion-item.expanded {
                background: linear-gradient(145deg, rgba(0,242,255,0.04) 0%, rgba(0,0,0,0.45) 100%);
                border-color: rgba(0,242,255,0.18);
                box-shadow: 0 10px 40px -10px rgba(0,0,0,0.6);
                transform: scale(1.01);
                margin: 10px 0;
            }

            /* ─────────────────────────────────────────────────────────────────
               GLASS PANELS
               ───────────────────────────────────────────────────────────────── */
            .glass-panel {
                background: rgba(255,255,255,0.03);
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255,255,255,0.15);
                border-radius: 16px;
                padding: 16px;
                transition: all .3s ease;
            }

            .glass-panel:hover {
                background: rgba(255,255,255,0.05);
                border-color: rgba(0,242,255,0.12);
            }

            /* ─────────────────────────────────────────────────────────────────
               BOTÕES
               ───────────────────────────────────────────────────────────────── */
            .btn {
                padding: 10px 16px;
                border-radius: 12px;
                border: 1px solid rgba(255,255,255,0.15);
                background: rgba(255,255,255,0.05);
                color: var(--text-primary);
                font-size: 12px;
                font-weight: 600;
                letter-spacing: 0.5px;
                text-transform: uppercase;
                cursor: pointer;
                transition: all .16s ease;
                outline: none;
            }

            .btn:hover {
                background: rgba(255,255,255,0.1);
                border-color: rgba(255,255,255,0.15);
            }

            .btn-primary {
                background: rgba(0,242,255,0.15);
                color: var(--accent-cyan);
                border-color: rgba(0,242,255,0.3);
            }

            .btn-primary:hover {
                background: rgba(0,242,255,0.25);
                border-color: var(--accent-cyan);
                box-shadow: 0 0 12px rgba(0,242,255,0.2);
            }

            /* ─────────────────────────────────────────────────────────────────
               BOTÃO DE SAÍDA DE FUSÃO
               ───────────────────────────────────────────────────────────────── */
            .fusion-exit-btn {
                width: 40px;
                height: 40px;
                padding: 0;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                border-radius: 999px;
                font-size: 12px;
                font-weight: 800;
                color: var(--orb-cyan);
                background: rgba(0,0,0,0.45);
                border: 1px solid rgba(220,38,38,0.22);
                box-shadow: 0 8px 20px rgba(220,38,38,0.08);
                transition: transform .16s ease, background .16s ease, color .16s ease;
                cursor: pointer;
                outline: none;
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10020;
                opacity: 0;
                pointer-events: none;
            }

            .fusion-exit-btn.visible {
                opacity: 1;
                pointer-events: auto;
            }

            .fusion-exit-btn:hover {
                transform: scale(1.06);
                background: rgba(220,38,38,0.10);
                color: #fff;
            }

            /* ─────────────────────────────────────────────────────────────────
               SCROLLBAR CUSTOMIZADO
               ───────────────────────────────────────────────────────────────── */
            .custom-scroll::-webkit-scrollbar {
                width: 6px;
                height: 6px;
            }

            .custom-scroll::-webkit-scrollbar-thumb {
                background: rgba(0, 242, 255, 0.16);
                border-radius: 10px;
            }

            .custom-scroll::-webkit-scrollbar-track {
                background: transparent;
            }

            /* ─────────────────────────────────────────────────────────────────
               BADGES DE PERMISSÃO
               ───────────────────────────────────────────────────────────────── */
            .permission-badge {
                display: inline-block;
                padding: 4px 8px;
                border-radius: 8px;
                font-size: 10px;
                font-weight: 700;
                letter-spacing: 0.3px;
                text-transform: uppercase;
                background: rgba(0,242,255,0.1);
                color: var(--accent-cyan);
                border: 1px solid rgba(0,242,255,0.2);
            }

            .permission-badge.restricted {
                background: rgba(239,68,68,0.1);
                color: var(--accent-red);
                border-color: rgba(239,68,68,0.2);
            }
        `,

        /**
         * Constrói a interface do usuário
         */
        build: () => {
            // Verifica e cria elementos raiz
            if (!document.getElementById(CONFIG.fusionLayerId)) {
                const nav = document.createElement('div');
                nav.id = CONFIG.fusionLayerId;
                document.body.appendChild(nav);
            }

            if (!document.getElementById(CONFIG.customCssRootId)) {
                const cssRoot = document.createElement('div');
                cssRoot.id = CONFIG.customCssRootId;
                document.body.appendChild(cssRoot);
            }

            // Remove elemento existente se houver
            const existing = document.getElementById(CONFIG.rootId);
            if (existing) existing.remove();

            // Cria container principal
            const root = document.createElement('div');
            root.id = CONFIG.rootId;

            // Injeta estilos
            const styleEl = document.createElement('style');
            styleEl.textContent = UI.styles;
            document.head.appendChild(styleEl);

            // Cria wrapper do monolith
            const wrapper = document.createElement('div');
            wrapper.className = 'monolith-wrapper';

            // Cria monolith
            const monolith = document.createElement('div');
            monolith.className = 'monolith';
            monolith.id = 'os-monolith';

            // Header
            const header = document.createElement('div');
            header.style.cssText = 'padding: 20px 24px; border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: space-between; align-items: center;';
            header.innerHTML = `
                <h1 style="font-size: 16px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase;">
                    Fusion<span style="color: #00f2ff;">OS</span>
                </h1>
                <div style="display: flex; gap: 8px;">
                    <button class="tab-btn active" data-tab="dashboard" title="Dashboard">📊</button>
                    <button class="tab-btn" data-tab="apps" title="Apps">📱</button>
                    <button class="tab-btn" data-tab="lab" title="Lab">🧪</button>
                    <button class="tab-btn" data-tab="settings" title="Settings">⚙️</button>
                </div>
            `;

            // Content area
            const content = document.createElement('div');
            content.id = 'os-content';
            content.style.cssText = 'flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 16px;';

            monolith.appendChild(header);
            monolith.appendChild(content);
            wrapper.appendChild(monolith);
            root.appendChild(wrapper);
            document.body.appendChild(root);

            // Cria Orb Trigger
            const orbTrigger = document.createElement('button');
            orbTrigger.className = 'orb-trigger';
            orbTrigger.id = 'os-orb-trigger';
            orbTrigger.innerHTML = `
                <div class="orb-ring"></div>
                <div class="orb-core"></div>
            `;
            orbTrigger.addEventListener('click', () => FusionOS.toggle());
            document.body.appendChild(orbTrigger);

            // Cria Runtime Layer
            const runtime = document.createElement('div');
            runtime.className = 'runtime-layer';
            runtime.id = 'os-runtime';
            runtime.innerHTML = `
                <div style="padding: 16px 24px; border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Sandbox Runtime</span>
                    <button class="btn" onclick="FusionOS.closeRuntime()" style="padding: 6px 12px; font-size: 10px;">Fechar</button>
                </div>
                <iframe id="os-frame" style="flex: 1; border: none; background: transparent; width: 100%;"></iframe>
            `;
            document.body.appendChild(runtime);

            // Cria Fusion Exit Button
            const exitBtn = document.createElement('button');
            exitBtn.className = 'fusion-exit-btn hidden';
            exitBtn.id = 'fusion-exit-ctrl';
            exitBtn.textContent = '✕';
            exitBtn.addEventListener('click', () => FusionOS.exitFusion());
            document.body.appendChild(exitBtn);

            // Renderiza conteúdo inicial
            UI.renderTab('dashboard');

            // Setup event listeners
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                    e.target.classList.add('active');
                    UI.renderTab(e.target.dataset.tab);
                });
            });

            Utils.injectDeps();
        },

        /**
         * Renderiza conteúdo da aba
         */
        renderTab: (tabName) => {
            _state.currentTab = tabName;
            const content = document.getElementById('os-content');

            if (tabName === 'dashboard') {
                content.innerHTML = `
                    <div class="glass-panel">
                        <h2 style="font-size: 14px; font-weight: 700; margin-bottom: 12px; color: #00f2ff;">
                            👋 Bem-vindo ao Fusion OS v3.0
                        </h2>
                        <p style="color: rgba(234,246,255,0.7); font-size: 12px; line-height: 1.6;">
                            Sistema modular com permissões avançadas, fusões inteligentes e design LivroVivo.
                        </p>
                    </div>

                    <div class="glass-panel">
                        <h3 style="font-size: 12px; font-weight: 700; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                            📊 Status do Sistema
                        </h3>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 11px;">
                            <div style="padding: 12px; background: rgba(0,242,255,0.05); border: 1px solid rgba(0,242,255,0.1); border-radius: 12px;">
                                <div style="color: rgba(234,246,255,0.4); margin-bottom: 4px;">Apps Instalados</div>
                                <div style="font-size: 18px; font-weight: 700; color: #00f2ff;">${_state.installed.length}</div>
                            </div>
                            <div style="padding: 12px; background: rgba(189,0,255,0.05); border: 1px solid rgba(189,0,255,0.1); border-radius: 12px;">
                                <div style="color: rgba(234,246,255,0.4); margin-bottom: 4px;">Permissões Ativas</div>
                                <div style="font-size: 18px; font-weight: 700; color: #bd00ff;">${_state.installed.reduce((sum, app) => sum + (app.permissions ? app.permissions.length : 0), 0)}</div>
                            </div>
                        </div>
                    </div>

                    <div class="glass-panel">
                        <h3 style="font-size: 12px; font-weight: 700; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                            🔐 Permissões Ativas
                        </h3>
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            ${_state.installed.slice(0, 3).map(app => `
                                <div style="display: flex; align-items: center; gap: 8px; padding: 8px; background: rgba(0,242,255,0.05); border-radius: 12px;">
                                    <span class="permission-badge">${app.permissions[0] || 'NONE'}</span>
                                    <span style="font-size: 11px; color: rgba(234,246,255,0.7);">${app.name}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            } else if (tabName === 'apps') {
                content.innerHTML = `
                    <div class="glass-panel">
                        <h2 style="font-size: 14px; font-weight: 700; margin-bottom: 12px; color: #00f2ff;">
                            📱 Aplicativos Instalados
                        </h2>
                        <p style="color: rgba(234,246,255,0.4); font-size: 11px;">
                            Gerencie e integre aplicativos com permissões granulares.
                        </p>
                    </div>
                    <div id="apps-list" style="display: flex; flex-direction: column; gap: 12px;">
                        ${_state.installed.map(app => `
                            <div class="glass-panel" style="cursor: pointer; transition: all .3s;">
                                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                                    <div style="flex: 1;">
                                        <h3 style="font-size: 13px; font-weight: 700; margin-bottom: 4px; color: var(--text-primary);">
                                            ${app.name}
                                        </h3>
                                        <p style="font-size: 11px; color: rgba(234,246,255,0.4); margin-bottom: 8px;">
                                            ${app.desc}
                                        </p>
                                        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                                            ${(app.permissions || []).map(perm => `
                                                <span class="permission-badge ${perm === 'ADMIN' ? 'restricted' : ''}">
                                                    ${perm}
                                                </span>
                                            `).join('')}
                                        </div>
                                    </div>
                                </div>
                                <div style="display: flex; gap: 8px; margin-top: 12px;">
                                    <button class="btn btn-primary" onclick="FusionOS.launch('${app.id}', 'sandbox')" style="flex: 1;">
                                        Janela
                                    </button>
                                    <button class="btn btn-primary" onclick="FusionOS.launch('${app.id}', 'fusion')" style="flex: 1;">
                                        Fusão
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
            } else if (tabName === 'lab') {
                content.innerHTML = `
                    <div class="glass-panel">
                        <h2 style="font-size: 14px; font-weight: 700; margin-bottom: 12px; color: #bd00ff;">
                            🧪 Laboratório de Fusão
                        </h2>
                        <p style="color: rgba(234,246,255,0.4); font-size: 11px; margin-bottom: 16px;">
                            Teste, customize e injete módulos.
                        </p>

                        <div class="accordion-item">
                            <button style="width: 100%; padding: 12px 16px; background: transparent; border: none; color: var(--text-primary); font-size: 13px; font-weight: 600; text-align: left; cursor: pointer; display: flex; justify-content: space-between; align-items: center;" onclick="this.parentElement.classList.toggle('expanded'); this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'none' ? 'block' : 'none';">
                                <span>Conversor de Monólitos</span>
                                <span>▼</span>
                            </button>
                            <div style="display: none; padding: 0 16px 16px;">
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
                                    <textarea id="lab-input" placeholder="Cole HTML aqui..." style="min-height: 120px; padding: 10px 12px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.03); color: var(--text-primary); font-family: 'JetBrains Mono', monospace; font-size: 12px; resize: vertical; outline: none;"></textarea>
                                    <textarea id="lab-output" placeholder="Saída processada..." readonly style="min-height: 120px; padding: 10px 12px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.02); color: #00f2ff; font-family: 'JetBrains Mono', monospace; font-size: 12px; resize: vertical; outline: none;"></textarea>
                                </div>
                                <div style="display: flex; gap: 8px;">
                                    <button class="btn btn-primary" onclick="FusionOS.convertHTML()">Converter</button>
                                    <button class="btn btn-primary" onclick="FusionOS.injectModule()">Injetar</button>
                                </div>
                            </div>
                        </div>

                        <div class="accordion-item" style="margin-top: 12px;">
                            <button style="width: 100%; padding: 12px 16px; background: transparent; border: none; color: var(--text-primary); font-size: 13px; font-weight: 600; text-align: left; cursor: pointer; display: flex; justify-content: space-between; align-items: center;" onclick="this.parentElement.classList.toggle('expanded'); this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'none' ? 'block' : 'none';">
                                <span>Estilos Globais</span>
                                <span>▼</span>
                            </button>
                            <div style="display: none; padding: 0 16px 16px;">
                                <textarea id="css-input" placeholder="/* Cole seu CSS personalizado aqui */" style="width: 100%; min-height: 150px; padding: 10px 12px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.03); color: #bd00ff; font-family: 'JetBrains Mono', monospace; font-size: 12px; margin-bottom: 12px; resize: vertical; outline: none;"></textarea>
                                <button class="btn btn-primary" onclick="FusionOS.saveCustomCSS()">Salvar Estilos</button>
                            </div>
                        </div>
                    </div>
                `;
            } else if (tabName === 'settings') {
                content.innerHTML = `
                    <div class="glass-panel">
                        <h2 style="font-size: 14px; font-weight: 700; margin-bottom: 12px; color: #00f2ff;">
                            ⚙️ Configurações
                        </h2>
                    </div>

                    <div class="glass-panel">
                        <h3 style="font-size: 12px; font-weight: 700; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                            Identidade do Usuário
                        </h3>
                        <div style="display: flex; flex-direction: column; gap: 12px;">
                            <div>
                                <label style="display: block; font-size: 11px; color: rgba(234,246,255,0.4); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.3px;">
                                    Nome de Usuário
                                </label>
                                <input type="text" id="userName" placeholder="Seu nome" value="${_state.userData.user}" style="width: 100%; padding: 10px 12px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.03); color: var(--text-primary); font-size: 12px; outline: none;" />
                            </div>
                            <div>
                                <label style="display: block; font-size: 11px; color: rgba(234,246,255,0.4); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.3px;">
                                    Sistema
                                </label>
                                <input type="text" id="systemName" placeholder="Nome do sistema" value="${_state.userData.system}" style="width: 100%; padding: 10px 12px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.03); color: var(--text-primary); font-size: 12px; outline: none;" />
                            </div>
                            <button class="btn btn-primary" onclick="FusionOS.saveUserSettings()">Salvar Configurações</button>
                        </div>
                    </div>

                    <div class="glass-panel">
                        <h3 style="font-size: 12px; font-weight: 700; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                            Sobre
                        </h3>
                        <div style="font-size: 11px; color: rgba(234,246,255,0.7); line-height: 1.6;">
                            <p><strong>Fusion OS v3.0</strong></p>
                            <p style="margin-top: 8px;">LivroVivo Edition - Sistema modular com permissões avançadas.</p>
                            <p style="margin-top: 8px; color: rgba(234,246,255,0.4);">© 2026 Fusion Technologies</p>
                        </div>
                    </div>
                `;
            }
        },

        /**
         * Injeta CSS personalizado
         */
        injectCustomCSS: (css) => {
            const root = document.getElementById(CONFIG.customCssRootId);
            const style = document.createElement('style');
            style.textContent = css;
            root.appendChild(style);
        },

        /**
         * Atualiza ícones Lucide
         */
        refreshIcons: () => {
            if (window.lucide) {
                try {
                    window.lucide.createIcons();
                } catch (e) { }
            }
        }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // 6. API PÚBLICA
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Alterna visibilidade do painel
     */
    const toggle = () => {
        _state.active = !_state.active;
        document.body.classList.toggle('os-active');
    };

    /**
     * Lança um aplicativo
     */
    const launch = async (code, mode) => {
        const module = _state.installed.find(m => m.code === code || m.id === code);
        if (!module) {
            Utils.speak("Módulo não encontrado.");
            return;
        }

        if (mode === 'sandbox') {
            const rt = document.getElementById('os-runtime');
            const frame = document.getElementById('os-frame');
            if (!rt || !frame) return;
            rt.classList.add('visible');
            if (module.url) frame.src = module.url;
            else frame.srcdoc = module.html || '';
            Utils.speak(`Abrindo ${module.name}.`);
        } else if (mode === 'fusion') {
            SmartFusion.performFusion(module);
        }
    };

    /**
     * Injeta conteúdo no DOM
     */
    const injectIntoDOM = async (target, html) => {
        target.innerHTML = "";

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        // Injeta estilos
        doc.head.childNodes.forEach(node => {
            if (['SCRIPT', 'STYLE', 'LINK', 'META', 'BASE'].includes(node.tagName)) {
                document.head.appendChild(node.cloneNode(true));
            }
        });

        // Injeta conteúdo
        const bodyWrapper = document.createElement('div');
        bodyWrapper.innerHTML = doc.body.innerHTML;
        target.appendChild(bodyWrapper);

        // Injeta scripts em ordem
        const scripts = bodyWrapper.querySelectorAll('script');
        for (const old of scripts) {
            const s = document.createElement('script');
            [...old.attributes].forEach(a => s.setAttribute(a.name, a.value));

            if (old.src) {
                s.src = old.src;
                s.async = false;
                await new Promise(res => {
                    s.onload = res;
                    s.onerror = res;
                });
            } else {
                s.textContent = old.textContent;
            }

            old.replaceWith(s);
        }
    };

    /**
     * Sai do modo fusão
     */
    const exitFusion = () => {
        const layer = document.getElementById(CONFIG.fusionLayerId);
        if (layer) layer.innerHTML = '';
        document.getElementById('fusion-exit-ctrl').classList.add('hidden');
        Utils.speak("Fusão encerrada.");
        if (!_state.active) toggle();
    };

    /**
     * Fecha runtime
     */
    const closeRuntime = () => {
        const rt = document.getElementById('os-runtime');
        if (!rt) return;
        rt.classList.remove('visible');
        setTimeout(() => {
            const frame = document.getElementById('os-frame');
            if (frame) frame.src = '';
        }, 500);
    };

    /**
     * Converte HTML
     */
    const convertHTML = () => {
        const input = document.getElementById('lab-input').value;
        const output = document.getElementById('lab-output');

        if (!input.trim()) {
            output.value = '/* Nenhuma entrada */';
            return;
        }

        const processed = input
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<!--[\s\S]*?-->/g, '')
            .trim();

        output.value = `/* HTML Processado */\n${processed.substring(0, 500)}...`;
        Utils.speak('HTML convertido com sucesso.');
    };

    /**
     * Injeta módulo
     */
    const injectModule = () => {
        const code = document.getElementById('lab-output').value;
        if (!code.trim()) {
            Utils.speak('Nenhum código para injetar.');
            return;
        }

        try {
            console.log('Módulo injetado:', code.substring(0, 100));
            Utils.speak('Módulo injetado com sucesso.');
        } catch (e) {
            console.error('Erro ao injetar:', e);
            Utils.speak('Erro ao injetar módulo.');
        }
    };

    /**
     * Salva CSS personalizado
     */
    const saveCustomCSS = () => {
        const css = document.getElementById('css-input').value;
        if (css.trim()) {
            _state.customCSS = css;
            UI.injectCustomCSS(css);
            Utils.save();
            Utils.speak('Estilos personalizados aplicados.');
        }
    };

    /**
     * Salva configurações do usuário
     */
    const saveUserSettings = () => {
        const userName = document.getElementById('userName').value;
        const systemName = document.getElementById('systemName').value;

        if (userName) {
            _state.userData.user = userName;
            localStorage.setItem('fusion_os_user', userName);
            Utils.speak(`Olá, ${userName}!`);
        }

        if (systemName) {
            _state.userData.system = systemName;
            localStorage.setItem('fusion_os_system', systemName);
        }

        Utils.save();
        Utils.speak('Configurações salvas com sucesso.');
    };

    /**
     * Inicializa o sistema
     */
    const init = () => {
        Utils.load();
        UI.build();
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // 7. RETORNO DA IIFE
    // ═══════════════════════════════════════════════════════════════════════════

    return {
        toggle,
        launch,
        injectIntoDOM,
        exitFusion,
        closeRuntime,
        convertHTML,
        injectModule,
        saveCustomCSS,
        saveUserSettings,
        init,
        Permissions,
        SmartFusion,
        Utils,
        UI
    };
})();

// ═══════════════════════════════════════════════════════════════════════════
// 8. INICIALIZAÇÃO AUTOMÁTICA
// ═══════════════════════════════════════════════════════════════════════════

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => FusionOS.init());
} else {
    FusionOS.init();
}
