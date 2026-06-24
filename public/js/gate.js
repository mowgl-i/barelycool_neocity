// Construction gate — public sees "under construction"; friends punch in a
// numeric code on the keypad to reveal the work-in-progress site.
//
// SOFT GATE, NOT SECURITY: the code below ships in client JS, so a determined
// person can read it. Good enough to keep strangers out and let friends in —
// don't put anything truly private behind it.
//
// Change the code here. Any length works; the keypad adapts the number of dots.
const ACCESS_CODE = '2024';
const UNLOCK_KEY = 'bc-unlocked';

// The "under construction" block banner, same ANSI-shadow style as the site
// header — kept verbatim so the gate looks like the original splash page.
const CONSTRUCTION_BANNER =
` ██╗   ██╗███╗   ██╗██████╗ ███████╗██████╗
 ██║   ██║████╗  ██║██╔══██╗██╔════╝██╔══██╗
 ██║   ██║██╔██╗ ██║██║  ██║█████╗  ██████╔╝
 ██║   ██║██║╚██╗██║██║  ██║██╔══╝  ██╔══██╗
 ╚██████╔╝██║ ╚████║██████╔╝███████╗██║  ██║
  ╚═════╝ ╚═╝  ╚═══╝╚═════╝ ╚══════╝╚═╝  ╚═╝

 ██████╗ ██████╗ ███╗   ██╗███████╗████████╗
██╔════╝██╔═══██╗████╗  ██║██╔════╝╚══██╔══╝
██║     ██║   ██║██╔██╗ ██║███████╗   ██║
██║     ██║   ██║██║╚██╗██║╚════██║   ██║
╚██████╗╚██████╔╝██║ ╚████║███████║   ██║
 ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝╚══════╝   ╚═╝

██████╗ ██╗   ██╗██╗██╗     ██████╗ ██╗███╗   ██╗ ██████╗
██╔══██╗██║   ██║██║██║     ██╔══██╗██║████╗  ██║██╔════╝
██████╔╝██║   ██║██║██║     ██║  ██║██║██╔██╗ ██║██║  ███╗
██╔══██╗██║   ██║██║██║     ██║  ██║██║██║╚██╗██║██║   ██║
██████╔╝╚██████╔╝██║███████╗██████╔╝██║██║ ╚████║╚██████╔╝
╚═════╝  ╚═════╝ ╚═╝╚══════╝╚═════╝ ╚═╝╚═╝  ╚═══╝ ╚═════╝`;

function useGateIsMobile() {
  const q = '(max-width:640px)';
  const [m, setM] = React.useState(
    typeof window !== 'undefined' && window.matchMedia(q).matches
  );
  React.useEffect(() => {
    const mq = window.matchMedia(q);
    const on = (e) => setM(e.matches);
    mq.addEventListener('change', on);
    setM(mq.matches);
    return () => mq.removeEventListener('change', on);
  }, []);
  return m;
}

function Gate({ onUnlock }) {
  const green = '#39ff14';
  const dim = 'rgba(57,255,20,0.5)';
  const faint = 'rgba(57,255,20,0.22)';
  const isMobile = useGateIsMobile();
  const [code, setCode] = React.useState('');
  const [error, setError] = React.useState(false);

  const submit = React.useCallback((value) => {
    if (value === ACCESS_CODE) {
      try { localStorage.setItem(UNLOCK_KEY, '1'); } catch (e) {}
      onUnlock();
    } else {
      setError(true);
      setTimeout(() => { setError(false); setCode(''); }, 600);
    }
  }, [onUnlock]);

  const press = (n) => {
    if (error) return;
    setCode((c) => {
      if (c.length >= ACCESS_CODE.length) return c;
      const next = c + n;
      if (next.length === ACCESS_CODE.length) setTimeout(() => submit(next), 120);
      return next;
    });
  };
  const back = () => !error && setCode((c) => c.slice(0, -1));

  // Hardware keyboard support (desktop): digits, backspace, enter.
  React.useEffect(() => {
    const onKey = (e) => {
      if (/^[0-9]$/.test(e.key)) press(e.key);
      else if (e.key === 'Backspace') back();
      else if (e.key === 'Enter' && code.length) submit(code);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [code, error]);

  const keys = ['1','2','3','4','5','6','7','8','9','⌫','0','↵'];
  const onKeyTap = (k) => {
    if (k === '⌫') back();
    else if (k === '↵') { if (code.length) submit(code); }
    else press(k);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 5000, background: '#02040a',
      backgroundImage:
        'radial-gradient(ellipse at 50% 0%, rgba(57,255,20,0.06), transparent 50%),' +
        'radial-gradient(ellipse at 50% 100%, rgba(57,255,20,0.04), transparent 60%)',
      color: green, fontFamily: 'ui-monospace, "JetBrains Mono", monospace',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '24px 18px',
      overflowY: 'auto',
    }}>
      <div style={{ width: '100%', maxWidth: 360, textAlign: 'center' }}>
        <pre style={{
          margin: '0 auto', fontSize: isMobile ? 5.5 : 9, color: green, lineHeight: 1.05,
          textShadow: `0 0 6px ${green}`, display: 'inline-block', textAlign: 'left',
          whiteSpace: 'pre', overflow: 'hidden',
        }}>
{CONSTRUCTION_BANNER}
        </pre>

        <div style={{ fontSize: 12, color: dim, letterSpacing: 2, margin: '18px 0 6px' }}>
          [ barely.cool ▸ build in progress ]
        </div>
        <div style={{ fontSize: 13, color: green, marginBottom: 22,
          textShadow: `0 0 4px ${green}` }}>
          enter access code
        </div>

        {/* code dots */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 24,
          animation: error ? 'gateShake .45s' : 'none' }}>
          {ACCESS_CODE.split('').map((_, i) => {
            const filled = i < code.length;
            return (
              <div key={i} style={{
                width: 16, height: 16, borderRadius: '50%',
                border: `1.5px solid ${error ? '#ff5544' : filled ? green : faint}`,
                background: error ? '#ff5544' : filled ? green : 'transparent',
                boxShadow: filled && !error ? `0 0 8px ${green}` : 'none',
                transition: 'background .1s',
              }} />
            );
          })}
        </div>

        {/* keypad */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10,
        }}>
          {keys.map((k) => (
            <button key={k} onClick={() => onKeyTap(k)}
              style={{
                aspectRatio: '1 / 1', minHeight: 64,
                background: '#06080a', color: green,
                border: `1px solid ${faint}`,
                fontFamily: 'inherit', fontSize: 24, fontWeight: 700,
                textShadow: `0 0 4px ${green}`, cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent', userSelect: 'none',
                touchAction: 'manipulation',
              }}>
              {k}
            </button>
          ))}
        </div>

        <div style={{ fontSize: 11, color: error ? '#ff5544' : dim, marginTop: 18,
          minHeight: 14, letterSpacing: 1 }}>
          {error ? '▸ access denied' : 'ask mowgli for the code'}
        </div>
      </div>

      {/* CRT scanlines to match the site */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1,
        backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,.32) 0 1px, transparent 1px 3px)',
      }} />
      <style>{`@keyframes gateShake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-5px)}80%{transform:translateX(5px)}}`}</style>
    </div>
  );
}

function isUnlocked() {
  try { return localStorage.getItem(UNLOCK_KEY) === '1'; } catch (e) { return false; }
}

window.Gate = Gate;
window.isUnlocked = isUnlocked;
