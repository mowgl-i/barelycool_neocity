// Shopify Storefront API client + React hook.
// Pulls live products from the store and normalizes them into the shape
// FlatlayShop expects. Layout-only bits (scatter position, rotation, kind,
// glyph) can't come from Shopify, so they live in LAYOUT below, keyed by the
// product's handle, and get merged onto the fetched product.
//
// The public Storefront token is read-only and safe to ship in client code.

const SHOPIFY_CONFIG = {
  domain: 'z58x35-nw.myshopify.com',
  token: '588186ca0987d27ea3b1a307620e7588', // public Storefront access token
  apiVersion: '2025-01',
};
window.SHOPIFY_CONFIG = SHOPIFY_CONFIG;

// Per-product presentation overrides, keyed by Shopify product handle.
// `image` here wins over Shopify's featured image when set (lets us keep
// hand-made art like stroked-image.png). Unknown handles fall back to the
// SCATTER pool below so any new product still lands somewhere sensible.
const LAYOUT = {
  'chrome-nup':      { kind: 'tee',     glyph: 'CN', x: 4,  y: 22, w: 240, r: -6, z: 3 },
  'clanker-sticker': { kind: 'sticker', glyph: 'SI', x: 28, y: 40, w: 390, r: 8,  z: 4 },
};

// Position presets handed out, in order, to products with no LAYOUT entry.
const SCATTER = [
  { x: 6,  y: 60, w: 230, r: 10, z: 3 },
  { x: 50, y: 18, w: 220, r: -8, z: 3 },
  { x: 60, y: 55, w: 250, r: 5,  z: 3 },
  { x: 30, y: 8,  w: 210, r: 12, z: 3 },
];

const PRODUCTS_QUERY = `
  query Products {
    products(first: 30) {
      edges {
        node {
          id
          handle
          title
          description
          availableForSale
          featuredImage { url altText }
          options { name values }
          variants(first: 50) {
            edges {
              node {
                id
                sku
                title
                availableForSale
                price { amount currencyCode }
                selectedOptions { name value }
              }
            }
          }
          priceRange { minVariantPrice { amount currencyCode } }
        }
      }
    }
  }
`;

// gid://shopify/ProductVariant/4567 -> "4567" (needed for cart permalinks)
function variantNumericId(gid) {
  const m = /(\d+)\s*$/.exec(gid || '');
  return m ? m[1] : null;
}

function stockLabel(node) {
  // The public token lacks the inventory scope, so we only know in/out of stock.
  return node.availableForSale ? 'in stock' : 'sold out';
}

function normalizeProduct(node, index) {
  const layout = LAYOUT[node.handle] || SCATTER[index % SCATTER.length];
  const variants = (node.variants?.edges || []).map((e) => e.node);
  const first = variants[0];

  // A "Size" option turns into the size picker; map each size to its variant id.
  const sizeOption = (node.options || []).find((o) => /size/i.test(o.name));
  const sizes = sizeOption ? sizeOption.values : null;
  const variantBySize = {};
  if (sizeOption) {
    variants.forEach((v) => {
      const sel = (v.selectedOptions || []).find((o) => /size/i.test(o.name));
      if (sel) variantBySize[sel.value] = variantNumericId(v.id);
    });
  }

  const price = Math.round(parseFloat(node.priceRange?.minVariantPrice?.amount || '0'));

  return {
    sku: (first && first.sku) || node.handle.toUpperCase(),
    handle: node.handle,
    name: node.title.replace(/\s+/g, '_'),
    price,
    stock: stockLabel(node),
    image: layout.image || node.featuredImage?.url || null,
    material: node.description || '',
    kind: layout.kind || 'sticker',
    glyph: layout.glyph || node.title.slice(0, 2).toUpperCase(),
    x: layout.x, y: layout.y, w: layout.w, r: layout.r, z: layout.z,
    sizes,
    variantBySize,
    variantId: first ? variantNumericId(first.id) : null,
  };
}

async function fetchShopifyProducts() {
  const url = `https://${SHOPIFY_CONFIG.domain}/api/${SHOPIFY_CONFIG.apiVersion}/graphql.json`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': SHOPIFY_CONFIG.token,
    },
    body: JSON.stringify({ query: PRODUCTS_QUERY }),
  });
  if (!res.ok) throw new Error(`Storefront API ${res.status}`);
  const json = await res.json();
  if (json.errors) throw new Error(json.errors.map((e) => e.message).join('; '));
  const edges = json.data?.products?.edges || [];
  return edges.map((e, i) => normalizeProduct(e.node, i));
}
window.fetchShopifyProducts = fetchShopifyProducts;

// React hook: { items, loading, error }. Returns [] items until loaded.
function useShopifyProducts() {
  const [state, setState] = React.useState({ items: [], loading: true, error: null });
  React.useEffect(() => {
    let alive = true;
    fetchShopifyProducts()
      .then((items) => alive && setState({ items, loading: false, error: null }))
      .catch((error) => alive && setState({ items: [], loading: false, error }));
    return () => { alive = false; };
  }, []);
  return state;
}
window.useShopifyProducts = useShopifyProducts;
