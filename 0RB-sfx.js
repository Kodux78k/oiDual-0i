/**
 * di_uiSfx.patch.js
 * Drop-in SFX patch para FusionOS
 * Colocar AFTER do script que define window.FusionOS
 *
 * Recursos:
 * - Espera FusionOS (polling leve)
 * - Preload seguro (com fallback blocked)
 * - Debounce/Throttle para hover/drag
 * - API exposta: window.DI_FusionSFX.{play,preload,setVolume,add}
 * - Usa FusionOS.getState() se existir; fallback DOM-detection para toggleAppVisibility
 *
 * URLs já configuradas para https://kodux78k.github.io/oiDual-0i/di_uiSfx/
 */

(function waitForFusion() {
  if (!window.FusionOS) {
    return setTimeout(waitForFusion, 60);
  }

  (function initSfxPatch() {
    // --- CONFIG ---
    const BASE = 'https://kodux78k.github.io/oiDual-0i/di_uiSfx/';
    const map = {
      // FUSION
      'fusion.enter': BASE + 'Uisounds_SümbüS_KB.m4a',
      'fusion.exit':  BASE + 'open.wav',

      // COMMANDS
      'command.accept': BASE + 'toggleBtn-sfx.wav',
      'command.reject': BASE + 'error.wav',

      // UPLOAD
      'upload.ok':   BASE + 'success.wav',
      'upload.fail': BASE + 'error.wav',

      // APPS (hide/show/remove)
      'app.hide':   BASE + 'back-action.wav',
      'app.show':   BASE + 'back-action.wav',
      'app.remove': BASE + 'back-action.wav',

      // RUNTIME (close)
      'runtime.close': BASE + 'back-action.wav',

      // UI extras
      'ui.drag':  BASE + 'drag.wav',
      'ui.hover': BASE + 'hover.wav'
    };

    // --- SFX ENGINE ---
    const FusionSFX = {
      map: { ...map },
      cache: {},
      volumes: {},   // per-sound volume overrides
      globalVolume: 0.9,
      // preload a single key (returns Promise)
      _preloadOne(key) {
        return new Promise((res) => {
          const url = this.map[key];
          if (!url) return res(false);
          try {
            const a = new Audio();
            a.preload = 'auto';
            a.src = url;
            // small play-then-pause step only if user gesture previously unlocked
            a.addEventListener('canplaythrough', () => {
              this.cache[key] = a;
              res(true);
            }, { once: true });
            // fallback: if canplaythrough never fires, consider loaded after short timeout
            setTimeout(() => {
              if (!this.cache[key]) { this.cache[key] = a; res(true); }
            }, 1200);
          } catch (e) {
            res(false);
          }
        });
      },
      preloadAll() {
        const keys = Object.keys(this.map);
        return Promise.all(keys.map(k => this._preloadOne(k)));
      },
      add(key, url) {
        this.map[key] = url;
        return this._preloadOne(key);
      },
      setVolume(key, vol) {
        this.volumes[key] = Math.max(0, Math.min(1, vol));
      },
      setGlobalVolume(vol) {
        this.globalVolume = Math.max(0, Math.min(1, vol));
      },
      play(key, volume = undefined) {
        try {
          const url = this.map[key];
          if (!url) return;
          const vol = (volume ?? this.volumes[key] ?? this.globalVolume);
          // If cached Audio exists, clone node for overlapping play
          let a;
          if (this.cache[key]) {
            a = this.cache[key].cloneNode();
            a.src = this.cache[key].src; // ensure src exists on clone
          } else {
            a = new Audio(url);
            a.preload = 'auto';
          }
          a.volume = vol;
          // attempt play, swallow promise rejection (autoplay policy)
          a.play().catch(() => { /* silent fail */ });
        } catch (e) { /* ignore */ }
      }
    };

    // --- iOS / Safari audio unlock (fire-once) ---
    let unlocked = false;
    function unlockAudioContextOnce() {
      if (unlocked) return;
      unlocked = true;
      // try to warm up by playing a tiny short sound (hover.wav) then pause immediately
      const probe = new Audio(FusionSFX.map['ui.hover']);
      probe.preload = 'auto';
      probe.volume = 0.0001;
      probe.play().then(() => { probe.pause(); }).catch(()=>{});
    }
    // Attach once on first user gesture anywhere
    ['pointerdown','click','keydown','touchstart'].forEach(ev => {
      window.addEventListener(ev, unlockAudioContextOnce, { once: true, passive: true });
    });

    // --- helpers to patch functions safely ---
    function patchBefore(obj, fn, handler) {
      if (!obj || !obj[fn]) return false;
      const original = obj[fn];
      obj[fn] = function (...args) {
        try { handler.apply(this, args); } catch(e) { console.warn('SFX before handler fail', e); }
        return original.apply(this, args);
      };
      return true;
    }
    function patchAfter(obj, fn, handler) {
      if (!obj || !obj[fn]) return false;
      const original = obj[fn];
      obj[fn] = function (...args) {
        const result = original.apply(this, args);
        try { handler.apply(this, args); } catch(e) { console.warn('SFX after handler fail', e); }
        return result;
      };
      return true;
    }
    function patchReplace(obj, fn, replacement) {
      if (!obj || !obj[fn]) return false;
      obj[fn] = replacement.bind(obj);
      return true;
    }

    // --- PATCHES ---

    // 1) register => fusion.enter
    patchAfter(window.FusionOS, 'register', function() {
      FusionSFX.play('fusion.enter', 0.92);
    });

    // 2) exitFusion => fusion.exit (after, so container is cleared)
    patchAfter(window.FusionOS, 'exitFusion', function() {
      FusionSFX.play('fusion.exit', 0.9);
    });

    // 3) closeRuntime => runtime.close
    patchAfter(window.FusionOS, 'closeRuntime', function() {
      FusionSFX.play('runtime.close', 0.65);
    });

    // 4) handleCommand => accept / reject (we replace wrapper to keep original behavior)
    if (window.FusionOS.handleCommand) {
      const originalHandle = window.FusionOS.handleCommand.bind(window.FusionOS);
      window.FusionOS.handleCommand = function (cmd) {
        const normalized = ('' + (cmd || '')).toUpperCase().trim();
        // Lookup: use code list from the core if possible
        let isBuiltin = false;
        try {
          // attempt to infer builtins from core if exposed
          const known = Object.keys(window.FusionOS?.handleCommand?.toString?.()?.matchAll?.(/\b'([A-Z0-9_]+)'\b/g) || {}) || [];
          // fallback to reasonable list
        } catch (e) {}
        // Heuristic: rely on existing builtins map inside function source? fallback to simple test
        // We'll check the DOM: if an acc-<cmd> exists OR cmd === 'RESET' treat as builtin
        const possibleElem = document.getElementById(`acc-${normalized}`);
        if (normalized === 'RESET' || possibleElem) isBuiltin = true;
        // If not sure, fallback to original logic: call original then inspect result? Simpler:
        // We call original and then decide: but original may call register -> fusion.enter etc.
        // To keep UX immediate, we'll play reject if no DOM element and not RESET.
        if (isBuiltin) {
          FusionSFX.play('command.accept', 0.86);
        } else {
          FusionSFX.play('command.reject', 0.94);
        }
        return originalHandle(normalized);
      };
    }

    // 5) handleUpload -> play upload.ok / upload.fail (after: because reader triggers async messages)
    // We'll patch BEFORE to check input object quickly, then rely on after to confirm success/fail
    patchBefore(window.FusionOS, 'handleUpload', function(inputEl) {
      // quick guess: if inputEl.files exist => likely ok (actual success depends on read)
      const maybeFile = inputEl && ((inputEl.files && inputEl.files[0]) || (inputEl instanceof File));
      if (!maybeFile) {
        // direct fail (no file selected)
        FusionSFX.play('upload.fail', 0.9);
      } else {
        // optimistic play — but quieter
        FusionSFX.play('upload.ok', 0.75);
      }
    });

    // 6) toggleAppVisibility: determine previous DOM presence to decide hide vs show
    patchBefore(window.FusionOS, 'toggleAppVisibility', function(id) {
      try {
        // If FusionOS exposes getState, use it
        let wasHidden = false;
        if (typeof window.FusionOS.getState === 'function') {
          try {
            const st = window.FusionOS.getState();
            wasHidden = st.hiddenApps && st.hiddenApps.includes(id);
          } catch (e) { wasHidden = false; }
        } else {
          // DOM heuristic: if acc-<id> exists in DOM, it was visible
          const acc = document.getElementById(`acc-${id}`);
          wasHidden = !acc; // if no acc element => previously hidden
        }
        // If it was hidden -> after toggle it will be shown => play 'app.show'
        FusionSFX.play(wasHidden ? 'app.show' : 'app.hide', 0.75);
      } catch (e) { /* ignore */ }
    });

    // 7) removeApp -> play after removal (confirm occurs inside original)
    patchAfter(window.FusionOS, 'removeApp', function(id) {
      FusionSFX.play('app.remove', 0.88);
    });

    // 8) launch(fusion) => when performing fusion (we can intercept performFusion)
    patchAfter(window.FusionOS, 'performFusion', function(module) {
      // performFusion triggers Utils.speak("Fusão iniciada.") in core — mirror with SFX
      FusionSFX.play('fusion.enter', 0.96);
    });

    // Safety: if performFusion not found but launch exists, patch launch to detect 'fusion' mode
    if (!window.FusionOS.performFusion && window.FusionOS.launch) {
      patchBefore(window.FusionOS, 'launch', function(code, mode) {
        if (String(mode) === 'fusion') FusionSFX.play('fusion.enter', 0.96);
      });
    }

    // --- UI helper bindings (optional) ---
    // Attach hover and drag sounds to common selectors (non-invasive)
    // Debounce hover to avoid spam
    const hoverDebounce = { t: 0, ms: 120 };
    function onHover(e) {
      const now = Date.now();
      if (now - hoverDebounce.t < hoverDebounce.ms) return;
      hoverDebounce.t = now;
      FusionSFX.play('ui.hover', 0.14);
    }
    // Attach to orb and important interactive elements if present
    const attachHoverTargets = () => {
      const orb = document.getElementById('orb-trigger');
      if (orb && !orb.__di_hover_attached) {
        orb.addEventListener('mouseenter', onHover);
        orb.__di_hover_attached = true;
      }
      // attach to tab buttons
      document.querySelectorAll('.tab-btn').forEach(btn => {
        if (!btn.__di_hover_attached) {
          btn.addEventListener('mouseenter', onHover);
          btn.__di_hover_attached = true;
        }
      });
    };
    attachHoverTargets();
    // also observe DOM for new tab-btns
    const obs = new MutationObserver(() => { attachHoverTargets(); });
    obs.observe(document.body, { childList: true, subtree: true });

    // Drag sound helper (user can call DI_FusionSFX.bindDrag on an element)
    function bindDrag(el) {
      if (!el) return;
      let dragging = false;
      el.addEventListener('dragstart', () => { dragging = true; FusionSFX.play('ui.drag', 0.45); });
      el.addEventListener('dragend', () => { dragging = false; });
    }

    // Expose a small API for runtime control and debugging
    window.DI_FusionSFX = {
      play: (k, v) => FusionSFX.play(k, v),
      preloadAll: () => FusionSFX.preloadAll(),
      preload: (k) => FusionSFX._preloadOne(k),
      add: (k, url) => FusionSFX.add(k, url),
      setVolume: (k, v) => FusionSFX.setVolume(k, v),
      setGlobalVolume: (v) => FusionSFX.setGlobalVolume(v),
      bindDrag,
      map: FusionSFX.map
    };

    // Try to preload (best-effort)
    try { FusionSFX.preloadAll(); } catch (e) { /* ignore */ }

    console.log('🔊 di_uiSfx.patch.js ativo — SFX pronto (exposed: window.DI_FusionSFX)');
  })();

})();
