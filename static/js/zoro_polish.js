(function () {
  function genStrongPass(len) {
    const u = 'ABCDEFGHJKLMNPQRSTUVWXYZ', l = 'abcdefghijkmnopqrstuvwxyz', n = '23456789', s = '!@#$%^&*_-+=';
    const all = u + l + n + s, arr = new Uint32Array(len);
    crypto.getRandomValues(arr);
    const out = [u[arr[0] % u.length], l[arr[1] % l.length], n[arr[2] % n.length], s[arr[3] % s.length]];
    for (let i = 4; i < len; i++) out.push(all[arr[i] % all.length]);
    for (let i = out.length - 1; i > 0; i--) {
      const r = new Uint32Array(1); crypto.getRandomValues(r);
      const j = r[0] % (i + 1); [out[i], out[j]] = [out[j], out[i]];
    }
    return out.join('');
  }

  function enhanceInputs() {
    document.querySelectorAll('#page-text input[type="password"], #page-files input[type="password"]').forEach(inp => {
      if (inp.dataset.zoroQuick) return;
      inp.dataset.zoroQuick = '1';
      const bar = document.createElement('div');
      bar.style.cssText = 'display:flex;justify-content:flex-end;gap:6px;margin-top:6px;';
      const bGen = document.createElement('button');
      bGen.type = 'button';
      bGen.className = 'ghost-btn';
      bGen.style.cssText = 'font-size:11px;padding:4px 10px;white-space:nowrap;';
      bGen.textContent = '⚡ توليد كلمة سر قوية ونسخها';
      bGen.onclick = async () => {
        const pw = genStrongPass(16);
        inp.value = pw;
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        try { await navigator.clipboard.writeText(pw); } catch (_) {}
        if (typeof showToast === 'function') showToast('✓ تم توليد كلمة سر قوية ونسخها!');
      };
      bar.appendChild(bGen);
      inp.parentNode.insertBefore(bar, inp.nextSibling);
    });
  }

  window.addEventListener('load', () => setTimeout(enhanceInputs, 150));
})();
