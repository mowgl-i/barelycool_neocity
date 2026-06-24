// Flatlay shop — overlapping scattered items.
// Hover: lifts the item + reveals the price tag.
// Click: opens a detail card pinned near the item with sku, dims/sizes, add-to-cart.
// On mobile (<= 640px) the scatter collapses into a clean vertical stacked list.

// Shared viewport hook — used by both the shop and the page shell.
function useIsMobile(maxWidth = 640) {
  const query = `(max-width:${maxWidth}px)`;
  const [isMobile, setIsMobile] = React.useState(
    typeof window !== 'undefined' && window.matchMedia(query).matches
  );
  React.useEffect(() => {
    const mq = window.matchMedia(query);
    const on = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', on);
    setIsMobile(mq.matches);
    return () => mq.removeEventListener('change', on);
  }, [query]);
  return isMobile;
}
window.useIsMobile = useIsMobile;

// Fallback catalog used when the Storefront API is unreachable, so the flatlay
// never renders empty. Page reads this via window.FALLBACK_ITEMS too.
const FALLBACK_ITEMS = [
  { sku: 'WS-002', name: 'work_shirt_no2',  price: 45, stock: '7 left',   x: 4,  y: 22, w: 240, r: -6,  z: 3, kind: 'tee',
    glyph: 'WS', sizes: ['S','M','L','XL','2XL'], material: 'heavyweight cotton, garment dyed' },
  { sku: 'RT-001', name: 'rust_tee',        price: 35, stock: '12 left',  x: 6,  y: 60, w: 230, r: 10,  z: 3, kind: 'tee',
    glyph: 'RST', sizes: ['S','M','L','XL'], material: '6oz cotton, heather grey' },
  { sku: 'SI-001', name: 'clanker_sticker',  price: 5,  stock: 'in stock', x: 28, y: 40, w: 390, r: 8,   z: 4, kind: 'sticker',
    glyph: 'SI', dims: '2" × 3"', material: 'vinyl, weatherproof', image: 'img/stroked-image.png' },
];
window.FALLBACK_ITEMS = FALLBACK_ITEMS;

function FlatlayShop({ accent = '#39ff14', items = FALLBACK_ITEMS, loading = false, error = null }) {
  const green = accent;
  const dim = 'rgba(57,255,20,0.5)';
  const faint = 'rgba(57,255,20,0.22)';
  const shopLoading = loading;
  const shopError = error;

  const isMobile = useIsMobile();
  const [hover, setHover] = React.useState(null);
  const [open, setOpen] = React.useState(null);  // sku
  const [pop, setPop] = React.useState(null);
  const [size, setSize] = React.useState({});    // sku -> selected size
  const [containerWidth, setContainerWidth] = React.useState(null);
  const flatLayRef = React.useRef(null);

  // Track flatlay container width for responsive scaling
  React.useEffect(() => {
    const container = flatLayRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => {
      setContainerWidth(container.offsetWidth);
    });
    observer.observe(container);
    setContainerWidth(container.offsetWidth);
    return () => observer.disconnect();
  }, []);

  // Scale items based on container width (relative to 1100px baseline)
  const scaleFactor = containerWidth ? containerWidth / 1100 : 1;
  const scaledItems = items.map(it => ({
    ...it,
    w: Math.round(it.w * scaleFactor)
  }));

  // Close detail card on outside click / esc
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && setOpen(null);
    const onClick = (e) => {
      if (!e.target.closest('[data-bc-card], [data-bc-item]')) setOpen(null);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('click', onClick);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('click', onClick); };
  }, [open]);

  const add = (item, e) => {
    e.stopPropagation();
    if (item.stock === 'sold out') return;
    if (item.sizes && !size[item.sku]) return;
    setPop({ x: e.clientX, y: e.clientY, key: Date.now() });
    setTimeout(() => setPop(null), 700);
    const detail = { ...item };
    if (item.sizes) detail.size = size[item.sku];
    window.dispatchEvent(new CustomEvent('bc-cart-add', { detail }));
    setOpen(null);
  };

  // ── Mobile: clean vertical stacked list ──────────────────────────────
  if (isMobile) {
    return (
      <div ref={flatLayRef} style={{
        width: '100%', border: `1px solid ${faint}`, background: '#06080a',
        padding: 12, display: 'flex', flexDirection: 'column', gap: 12,
        fontFamily: 'ui-monospace, monospace',
      }}>
        <div style={{ fontSize: 10, color: dim, letterSpacing: 2 }}>
          FLATLAY ▸ SS26 ▸ {items.length} ITEMS ▸ tap to add
        </div>
        {items.map((it) => {
          const sold = it.stock === 'sold out';
          const needsSize = it.sizes && !size[it.sku];
          const disabled = sold || needsSize;
          return (
            <div key={it.sku} style={{
              border: `1px solid ${faint}`, background: '#0e1410',
              padding: 12, display: 'flex', gap: 12, alignItems: 'flex-start',
            }}>
              <div style={{ width: 88, flexShrink: 0 }}>
                <ItemPlaceholder kind={it.kind} glyph={it.glyph} accent={green} image={it.image} name={it.name} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between',
                  alignItems: 'baseline', gap: 8 }}>
                  <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>
                    {it.name.replace(/_/g, ' ')}
                  </span>
                  <span style={{ color: green, fontWeight: 900, fontSize: 14,
                    textShadow: `0 0 4px ${green}` }}>${it.price}</span>
                </div>
                <div style={{ color: dim, fontSize: 11, margin: '3px 0 8px' }}>
                  {it.sku} ▸ <span style={{ color: sold ? '#ff5544' : green }}>{it.stock}</span>
                  {it.dims ? ` ▸ ${it.dims}` : ''}
                </div>
                {it.sizes && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                    {it.sizes.map((s) => {
                      const on = size[it.sku] === s;
                      return (
                        <button key={s} onClick={(e) => { e.stopPropagation(); setSize((m) => ({ ...m, [it.sku]: s })); }}
                          style={{
                            padding: '5px 10px', minWidth: 32,
                            background: on ? green : 'transparent',
                            color: on ? '#000' : green,
                            border: `1px solid ${on ? green : faint}`,
                            fontFamily: 'inherit', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                          }}>{s}</button>
                      );
                    })}
                  </div>
                )}
                <button onClick={(e) => add(it, e)} disabled={disabled} style={{
                  width: '100%', padding: '9px', fontFamily: 'inherit',
                  fontWeight: 900, fontSize: 12, letterSpacing: 1,
                  background: disabled ? 'transparent' : green,
                  color: disabled ? dim : '#000',
                  border: `1px solid ${disabled ? faint : green}`,
                  cursor: disabled ? 'not-allowed' : 'pointer',
                }}>
                  {sold ? 'SOLD OUT' : needsSize ? 'PICK A SIZE FIRST' : '$ add to cart'}
                </button>
              </div>
            </div>
          );
        })}
        {pop && (
          <div key={pop.key} style={{
            position: 'fixed', left: pop.x, top: pop.y, zIndex: 9999, pointerEvents: 'none',
            color: green, fontWeight: 900, fontSize: 18,
            textShadow: `0 0 6px ${green}`, animation: 'popUp .7s ease-out forwards',
          }}>+1</div>
        )}
        <style>{`@keyframes popUp{0%{transform:translate(-50%,-10px);opacity:1}100%{transform:translate(-50%,-60px);opacity:0}}`}</style>
      </div>
    );
  }

  return (
    <div ref={flatLayRef} style={{
      position: 'relative', width: '100%', minHeight: 760,
      border: `1px solid ${faint}`, background: '#06080a',
      backgroundImage:
        `radial-gradient(circle at 20% 30%, rgba(57,255,20,.04), transparent 40%),` +
        `radial-gradient(circle at 80% 70%, rgba(57,255,20,.03), transparent 40%),` +
        `radial-gradient(${faint} 1px, transparent 1px)`,
      backgroundSize: 'auto, auto, 18px 18px',
    }}>
      {/* corner crop marks */}
      {[
        { top: 6, left: 6 }, { top: 6, right: 6 }, { bottom: 6, left: 6 }, { bottom: 6, right: 6 },
      ].map((p, i) => (
        <div key={i} style={{ position: 'absolute', width: 14, height: 14, ...p }}>
          <div style={{ position: 'absolute', inset: 0,
            borderTop: `1px solid ${green}`, borderLeft: `1px solid ${green}`,
            transform: i === 1 ? 'scaleX(-1)' : i === 2 ? 'scaleY(-1)' : i === 3 ? 'scale(-1,-1)' : 'none' }} />
        </div>
      ))}

      <div style={{
        position: 'absolute', top: 10, left: 14, fontSize: 10, color: dim,
        fontFamily: 'ui-monospace, monospace', letterSpacing: 2,
      }}>FLATLAY ▸ SS26 ▸ {items.length} ITEMS{shopLoading ? ' ▸ syncing…' : shopError ? ' ▸ offline' : ''}</div>
      <div style={{
        position: 'absolute', top: 10, right: 14, fontSize: 10, color: dim,
        fontFamily: 'ui-monospace, monospace', letterSpacing: 2,
      }}>// click any item to inspect</div>

      {/* items */}
      {scaledItems.map((it) => {
        const sold = it.stock === 'sold out';
        const isHover = hover === it.sku;
        const isOpen = open === it.sku;
        return (
          <div key={it.sku} data-bc-item={it.sku}
            onMouseEnter={() => setHover(it.sku)}
            onMouseLeave={() => setHover(null)}
            onClick={(e) => { e.stopPropagation(); setOpen(isOpen ? null : it.sku); }}
            style={{
              position: 'absolute', left: `${it.x}%`, top: `${it.y}%`, width: it.w,
              transform: `rotate(${it.r}deg) ${isHover || isOpen ? 'scale(1.04)' : 'scale(1)'}`,
              transformOrigin: 'center', transition: 'transform .2s',
              zIndex: isOpen ? 60 : isHover ? 50 : it.z, cursor: 'pointer',
            }}>
            <div style={{
              position: 'absolute', top: -32, left: '50%',
              transform: 'translateX(-50%)', zIndex: 2,
              fontSize: 16, fontWeight: 700, color: green,
              fontFamily: 'ui-monospace, monospace',
              textShadow: `0 0 8px ${green}, 0 0 16px ${green}55`,
              whiteSpace: 'nowrap', pointerEvents: 'none',
            }}>
              {it.name.replace(/_/g, ' ')}
            </div>
            <ItemPlaceholder kind={it.kind} glyph={it.glyph} accent={green} image={it.image} name={it.name} />
            <div style={{
              position: 'absolute', top: -14, right: -18, transform: `rotate(${-it.r + 6}deg)`,
              background: green, color: '#000', padding: '4px 8px 4px 14px',
              fontFamily: 'ui-monospace, monospace', fontSize: 12, fontWeight: 900,
              border: '1.5px solid #000', boxShadow: '2px 2px 0 #000',
              clipPath: 'polygon(0 50%, 8px 0, 100% 0, 100% 100%, 8px 100%)',
            }}>
              <div style={{ fontSize: 14, lineHeight: 1 }}>${it.price}</div>
              <div style={{ fontSize: 8, letterSpacing: 1, opacity: 0.7 }}>{it.sku}</div>
            </div>
            {sold && (
              <div style={{
                position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: '#ff5544', fontFamily: 'ui-monospace, monospace',
                fontSize: 18, fontWeight: 900, letterSpacing: 4, transform: 'rotate(-6deg)',
                pointerEvents: 'none',
              }}>SOLD OUT</div>
            )}
          </div>
        );
      })}

      {/* detail card — pinned near the open item, no rotation */}
      {open && (() => {
        const it = scaledItems.find((x) => x.sku === open);
        if (!it) return null;
        // anchor card relative to item; flip to left side if item is right of center
        const onRight = it.x > 50;
        const card = (
          <div data-bc-card onClick={(e) => e.stopPropagation()} style={{
            position: 'absolute',
            left: onRight ? `calc(${it.x}% - 280px)` : `calc(${it.x}% + ${it.w}px - 20px)`,
            top: `calc(${it.y}% + 20px)`,
            width: 270, zIndex: 80,
            background: '#06080a', border: `1px solid ${green}`,
            boxShadow: `0 0 18px ${green}55, 4px 4px 0 #000`,
            fontFamily: 'ui-monospace, monospace', color: green, fontSize: 12,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between',
              padding: '6px 8px', borderBottom: `1px solid ${faint}`, color: dim, fontSize: 10 }}>
              <span>// inspect ▸ {it.sku}</span>
              <button onClick={() => setOpen(null)} style={{
                background: 'transparent', border: 'none', color: dim, cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 12, padding: 0, lineHeight: 1,
              }}>[x]</button>
            </div>
            <div style={{ padding: 12 }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 14, marginBottom: 8,
                textShadow: `0 0 4px ${green}` }}>{it.name}</div>

              <Row k="price" v={`$${it.price}.00`} green={green} dim={dim} />
              <Row k="stock" v={it.stock} green={green} dim={dim}
                vColor={it.stock === 'sold out' ? '#ff5544' : it.stock === 'preorder' ? '#ffb800' : green} />
              {it.dims && <Row k="size"  v={it.dims} green={green} dim={dim} />}
              {it.material && <Row k="material" v={it.material} green={green} dim={dim} />}

              {it.sizes && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ color: dim, fontSize: 10, marginBottom: 4, letterSpacing: 1 }}>
                    SELECT SIZE
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {it.sizes.map((s) => {
                      const on = size[it.sku] === s;
                      return (
                        <button key={s} onClick={(e) => { e.stopPropagation(); setSize((m) => ({ ...m, [it.sku]: s })); }}
                          style={{
                            padding: '4px 10px', minWidth: 32,
                            background: on ? green : 'transparent',
                            color: on ? '#000' : green,
                            border: `1px solid ${on ? green : faint}`,
                            fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
                            cursor: 'pointer',
                            textShadow: on ? 'none' : `0 0 3px ${green}`,
                          }}>{s}</button>
                      );
                    })}
                  </div>
                </div>
              )}

              <button
                onClick={(e) => add(it, e)}
                disabled={it.sizes && !size[it.sku]}
                style={{
                  marginTop: 12, width: '100%', padding: '8px 10px',
                  background: (it.sizes && !size[it.sku]) ? 'transparent' : green,
                  color: (it.sizes && !size[it.sku]) ? dim : '#000',
                  border: `1px solid ${(it.sizes && !size[it.sku]) ? faint : green}`,
                  fontFamily: 'inherit', fontWeight: 900, fontSize: 12, letterSpacing: 2,
                  cursor: (it.sizes && !size[it.sku]) ? 'not-allowed' : 'pointer',
                }}>
                {it.sizes && !size[it.sku] ? 'PICK A SIZE FIRST' : `$ add ${it.sku}${size[it.sku] ? ` --size ${size[it.sku]}` : ''} --qty 1`}
              </button>
            </div>
          </div>
        );
        return card;
      })()}

      {pop && (
        <div key={pop.key} style={{
          position: 'fixed', left: pop.x, top: pop.y, zIndex: 9999, pointerEvents: 'none',
          color: green, fontFamily: 'ui-monospace, monospace', fontWeight: 900, fontSize: 18,
          textShadow: `0 0 6px ${green}`, animation: 'popUp .7s ease-out forwards',
        }}>+1</div>
      )}

      <style>{`@keyframes popUp{0%{transform:translate(-50%,-10px);opacity:1}100%{transform:translate(-50%,-60px);opacity:0}}`}</style>
    </div>
  );
}

function Row({ k, v, vColor, green, dim }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: 11 }}>
      <span style={{ color: dim }}>{k}</span>
      <span style={{ color: vColor || green }}>{v}</span>
    </div>
  );
}

function ItemPlaceholder({ kind, glyph, accent, image, name }) {
  const g = accent;
  const dropShadow = `drop-shadow(3px 4px 0 rgba(0,0,0,.6)) drop-shadow(0 0 8px rgba(57,255,20,.25))`;
  const ph = { fontFamily: 'ui-monospace, monospace', fontSize: 10, color: 'rgba(57,255,20,.55)',
    letterSpacing: 1, textAlign: 'center', textTransform: 'uppercase' };
  const label = (name || '').replace(/_/g, ' ');

  if (image) return (
    <div style={{ filter: dropShadow, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, color: 'rgba(57,255,20,.55)',
        letterSpacing: 1, textAlign: 'center', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
      <img src={image} style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 4 }} alt={label} />
    </div>
  );

  if (kind === 'tee') return (
    <div style={{ filter: dropShadow, position: 'relative' }}>
      <svg viewBox="0 0 200 220" width="100%" style={{ display: 'block' }}>
        <path d="M40 30 L80 10 L100 24 L120 10 L160 30 L185 70 L155 85 L155 200 L45 200 L45 85 L15 70 Z"
              fill="#0e1410" stroke={g} strokeWidth="1.5" />
        <path d="M80 10 L100 24 L120 10" fill="none" stroke={g} strokeWidth="1.5" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
        justifyContent: 'center', flexDirection: 'column', gap: 4 }}>
        <div style={{ fontFamily: '"Bodoni Moda", serif', fontWeight: 900, fontSize: 38,
          color: g, lineHeight: 1, textShadow: `0 0 6px ${g}`, letterSpacing: -1 }}>{glyph}</div>
        <div style={ph}>[ tee.png ]</div>
      </div>
    </div>
  );
  if (kind === 'patch') return (
    <div style={{ filter: dropShadow, position: 'relative', aspectRatio: '1 / 1' }}>
      <svg viewBox="0 0 100 100" width="100%" style={{ display: 'block' }}>
        <rect x="6" y="6" width="88" height="88" rx="6" fill="#0e1410" stroke={g} strokeWidth="1.5" strokeDasharray="2 2" />
        <rect x="12" y="12" width="76" height="76" rx="3" fill="none" stroke={g} strokeWidth="1" opacity="0.5" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
        justifyContent: 'center', flexDirection: 'column' }}>
        <div style={{ fontFamily: '"Bodoni Moda", serif', fontWeight: 900, fontSize: 30,
          color: g, lineHeight: 1, textShadow: `0 0 6px ${g}` }}>{glyph}</div>
        <div style={ph}>[ patch.png ]</div>
      </div>
    </div>
  );
  if (kind === 'sticker') return (
    <div style={{ filter: dropShadow, position: 'relative' }}>
      <svg viewBox="0 0 100 100" width="100%" style={{ display: 'block' }}>
        <circle cx="50" cy="50" r="44" fill="#0e1410" stroke={g} strokeWidth="1.5" strokeDasharray="3 3" />
        <circle cx="50" cy="50" r="38" fill="none" stroke={g} strokeWidth="0.8" opacity="0.5" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
        justifyContent: 'center', flexDirection: 'column' }}>
        <div style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 900, fontSize: 22,
          color: g, lineHeight: 1, textShadow: `0 0 4px ${g}` }}>{glyph}</div>
        <div style={{ ...ph, fontSize: 8 }}>[ sticker.png ]</div>
      </div>
    </div>
  );
  if (kind === 'banner') return (
    <div style={{ filter: dropShadow, position: 'relative' }}>
      <svg viewBox="0 0 300 70" width="100%" style={{ display: 'block' }}>
        <rect x="2" y="2" width="296" height="66" fill="#0e1410" stroke={g} strokeWidth="1.5" />
        <line x1="10" y1="10" x2="290" y2="10" stroke={g} strokeWidth="0.5" opacity="0.4" />
        <line x1="10" y1="60" x2="290" y2="60" stroke={g} strokeWidth="0.5" opacity="0.4" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
        justifyContent: 'center', gap: 12 }}>
        <div style={{ fontFamily: '"Bodoni Moda", serif', fontWeight: 900, fontSize: 32,
          color: g, lineHeight: 1, textShadow: `0 0 4px ${g}`, letterSpacing: -1 }}>{glyph}</div>
        <div style={ph}>[ banner.jpg ]</div>
      </div>
    </div>
  );
  return (
    <div style={{ filter: dropShadow, position: 'relative' }}>
      <svg viewBox="0 0 100 100" width="100%" style={{ display: 'block' }}>
        <circle cx="50" cy="50" r="40" fill="#0e1410" stroke={g} strokeWidth="2" />
        <circle cx="50" cy="50" r="34" fill="none" stroke={g} strokeWidth="0.6" opacity="0.6" />
        <circle cx="50" cy="50" r="3" fill={g} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
        justifyContent: 'center', flexDirection: 'column' }}>
        <div style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 900, fontSize: 20,
          color: g, lineHeight: 1, marginTop: 6 }}>{glyph}</div>
        <div style={{ ...ph, fontSize: 8 }}>[ pin.png ]</div>
      </div>
    </div>
  );
}

window.FlatlayShop = FlatlayShop;
