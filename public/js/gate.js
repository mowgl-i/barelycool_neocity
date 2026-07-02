// Entry intro — no longer a passcode gate. Every visit opens on a CRT terminal
// that asks "do you wish to enter?". A [ yes ] button (or the y/Enter keys)
// types the `yes` command, then the ASCII coilover streams into stdout
// line-by-line like a `cat` printout before the intro cross-fades into the
// site. Purely a splash: nothing is remembered, nothing is gated.
//
// The boot/prompt phase is framed inside a CSS "CRT monitor" (bezel + curved
// green glass + glow + scanlines) on wider/landscape screens — inspired by
// crtterminal.png. On narrow portrait phones, and once the coilover starts
// streaming, it renders full-bleed so the art gets the whole screen.

const GATE_PROMPT = 'mowgli@barely.cool:~$ ';

// Boot lines printed above the prompt when the intro first renders.
const GATE_BOOT = [
  'mowgli@barely.cool:~$ ./enter.sh',
  '> establishing connection...',
  '> do you wish to enter?',
];

function useMedia(query) {
  const [m, setM] = React.useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches
  );
  React.useEffect(() => {
    const mq = window.matchMedia(query);
    const on = (e) => setM(e.matches);
    mq.addEventListener('change', on);
    setM(mq.matches);
    return () => mq.removeEventListener('change', on);
  }, [query]);
  return m;
}

function Gate({ onUnlock }) {
  const green = '#39ff14';
  const dim = 'rgba(57,255,20,0.5)';

  // phase: prompt → typing → streaming → exiting
  const [phase, setPhase] = React.useState('prompt');
  const [typed, setTyped] = React.useState('');      // chars of "yes" shown so far
  const [stdout, setStdout] = React.useState([]);     // coilover lines printed so far
  const [exiting, setExiting] = React.useState(false);

  const linesRef = React.useRef([]);   // full coilover.txt split into lines
  const logRef = React.useRef(null);

  // Frame the whole intro (boot → prompt → coilover) in the CRT monitor on
  // wider screens; go full-bleed on narrow/portrait phones. When framed, the
  // coilover streams inside the glass and scrolls; when full-bleed it fills the
  // viewport. Coilover font sizes to the glass width (cqw) so it fits without
  // horizontal scroll, and to the viewport (vw) when full-bleed.
  const wide = useMedia('(min-width: 700px)');
  const framed = wide;
  const coiloverFont = framed ? 'min(1.46cqw, 14px)' : 'clamp(3px, 1.4vw, 14px)';

  // Preload the coilover art so it's ready the moment the user commits.
  React.useEffect(() => {
    fetch('coilover.txt')
      .then((r) => r.text())
      .then((t) => { linesRef.current = t.replace(/\s+$/, '').split('\n'); })
      .catch(() => { linesRef.current = ['[ coilover.txt unavailable ]']; });
  }, []);

  // Keep the terminal scrolled to the newest output.
  React.useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [stdout, typed, phase, framed]);

  const enter = React.useCallback(() => {
    setPhase((p) => (p === 'prompt' ? 'typing' : p));
  }, []);

  // Keyboard: y / Enter commit while at the prompt.
  React.useEffect(() => {
    if (phase !== 'prompt') return;
    const onKey = (e) => {
      if (e.key === 'Enter' || e.key.toLowerCase() === 'y') enter();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, enter]);

  // Typewriter: type "yes" one char at a time (28ms), then start streaming.
  React.useEffect(() => {
    if (phase !== 'typing') return;
    const full = 'yes';
    let i = 0;
    let timer;
    const tick = () => {
      i += 1;
      setTyped(full.slice(0, i));
      if (i < full.length) timer = setTimeout(tick, 28);
      else timer = setTimeout(() => setPhase('streaming'), 260);
    };
    timer = setTimeout(tick, 120);
    return () => clearTimeout(timer);
  }, [phase]);

  // Stream the coilover into stdout, one line per tick (~22ms).
  React.useEffect(() => {
    if (phase !== 'streaming') return;
    const lines = linesRef.current.length
      ? linesRef.current
      : ['[ coilover.txt unavailable ]'];
    setStdout(['> initializing ...']);
    let i = 0;
    let timer;
    const tick = () => {
      setStdout((s) => [...s, lines[i]]);
      i += 1;
      if (i < lines.length) timer = setTimeout(tick, 22);
      else timer = setTimeout(() => setPhase('exiting'), 600); // hold, then fade
    };
    timer = setTimeout(tick, 22);
    return () => clearTimeout(timer);
  }, [phase]);

  // Fade out, then hand off to the site once the transition finishes.
  React.useEffect(() => {
    if (phase !== 'exiting') return;
    setExiting(true);
    const t = setTimeout(onUnlock, 550);
    return () => clearTimeout(t);
  }, [phase, onUnlock]);

  const cursor = (
    <span style={{
      display: 'inline-block', width: 7, height: 13, background: green,
      marginLeft: 2, animation: 'blink 1s steps(2) infinite', verticalAlign: 'middle',
    }} />
  );

  // Shared terminal content (boot lines → prompt/yes → streamed coilover).
  const body = (
    <React.Fragment>
      {/* boot lines */}
      {GATE_BOOT.map((l, i) => (
        <div key={i} style={{ color: i === 0 ? '#fff' : dim }}>{l}</div>
      ))}

      {/* prompt line — carries the typed `yes` in phases after prompt */}
      {phase !== 'streaming' && phase !== 'exiting' ? (
        <div style={{ color: '#fff', marginTop: 8 }}>
          {GATE_PROMPT}{typed}
          {phase === 'prompt' ? cursor : null}
        </div>
      ) : (
        <div style={{ color: '#fff', marginTop: 8 }}>{GATE_PROMPT}yes</div>
      )}

      {/* [ yes ] button — only at the prompt */}
      {phase === 'prompt' && (
        <button
          onClick={enter}
          autoFocus
          style={{
            marginTop: 16, padding: '8px 22px',
            background: '#06080a', color: green,
            border: `1px solid ${green}`, borderRadius: 2,
            fontFamily: 'inherit', fontSize: '1em', fontWeight: 700, letterSpacing: 2,
            textShadow: `0 0 4px ${green}`, cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent', userSelect: 'none',
            touchAction: 'manipulation',
          }}>
          [ yes ]
        </button>
      )}

      {/* streamed coilover */}
      {stdout.length > 0 && (
        <pre style={{
          margin: '10px 0 0', color: green, lineHeight: 1,
          // 114-col art scaled to fill the available width (glass or viewport)
          // so it fits without horizontal scroll on any screen.
          fontSize: coiloverFont, whiteSpace: 'pre',
          textShadow: `0 0 3px ${green}`,
        }}>
          {stdout.join('\n')}
        </pre>
      )}
    </React.Fragment>
  );

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 5000, background: '#02040a',
      backgroundImage:
        'radial-gradient(ellipse at 50% 0%, rgba(57,255,20,0.06), transparent 50%),' +
        'radial-gradient(ellipse at 50% 100%, rgba(57,255,20,0.04), transparent 60%)',
      color: green, fontFamily: 'ui-monospace, "JetBrains Mono", monospace',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: 'clamp(8px, 2.5vw, 24px)',
      opacity: exiting ? 0 : 1, transition: 'opacity .5s ease',
    }}
      onTransitionEnd={() => { if (exiting) onUnlock(); }}
    >
      {framed ? (
        /* CSS CRT monitor — bezel + curved green glass, inspired by crtterminal.png */
        <div style={{
          width: 'min(92vw, calc(90vh * 1.6), 900px)', aspectRatio: '16 / 10',
          borderRadius: 24, boxSizing: 'border-box', padding: '4.5%',
          background: 'linear-gradient(155deg, #2b312b 0%, #10140f 55%, #05080a 100%)',
          boxShadow: '0 24px 70px rgba(0,0,0,.72), inset 0 2px 6px rgba(150,170,150,.28), inset 0 -3px 10px rgba(0,0,0,.6)',
          animation: 'gatePower .45s ease-out',
        }}>
          <div style={{
            position: 'relative', width: '100%', height: '100%',
            borderRadius: 16, overflow: 'hidden', boxSizing: 'border-box',
            padding: '5% 6%', display: 'flex', flexDirection: 'column',
            background: 'radial-gradient(ellipse at 50% 44%, rgba(57,255,20,0.20), rgba(6,20,8,0.97) 68%, #010402 100%)',
            boxShadow: 'inset 0 0 42px rgba(0,0,0,.9), inset 0 0 100px rgba(57,255,20,.10)',
          }}>
            {/* live terminal on the glass */}
            <div ref={logRef} style={{
              position: 'relative', zIndex: 2, width: '100%', maxHeight: '100%',
              overflow: 'auto', containerType: 'inline-size',
              fontSize: 'clamp(12px, 1.7vw, 19px)', lineHeight: 1.6,
              textShadow: `0 0 4px ${green}`,
            }}>
              {body}
            </div>
            {/* screen curvature/vignette + scanlines */}
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 3,
              background: 'radial-gradient(ellipse at center, transparent 52%, rgba(0,0,0,.55) 100%)',
            }} />
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 3,
              backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,.30) 0 1px, transparent 1px 3px)',
            }} />
          </div>
        </div>
      ) : (
        /* full-bleed terminal — portrait phones + the coilover payoff */
        <div ref={logRef} style={{
          width: '100%', maxWidth: 1200, maxHeight: '92vh', overflow: 'auto',
          fontSize: 'clamp(13px, 2vw, 22px)', lineHeight: 1.6,
          textShadow: `0 0 4px ${green}`,
        }}>
          {body}
        </div>
      )}

      {/* full-viewport scanlines — only when not framed (framed glass has its own) */}
      {!framed && (
        <div style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1,
          backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,.32) 0 1px, transparent 1px 3px)',
        }} />
      )}
      <style>{`@keyframes blink{50%{opacity:0}}@keyframes gatePower{0%{transform:scale(.96);opacity:0}60%{opacity:1}100%{transform:scale(1)}}`}</style>
    </div>
  );
}

window.Gate = Gate;
