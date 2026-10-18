import { NF_SETS, NF_VERSION } from './nerdfont-data.js'

const noop = () => {}
let picked = 'md'

// Nerd Font directory: set filter, name search, page, last copy
const nf = { set: 'all', query: '', page: 0, copied: null }
const NF_ROWS = 8, NF_SLOT = 2, NF_GAP = 3
let nfAll, nfCount
function nfGlyphs() {
  if (nfAll) return nfAll
  nfAll = []
  nfCount = {}
  for (const [set, data] of Object.entries(NF_SETS)) {
    const parts = data.split(' ')
    nfCount[set] = parts.length / 2
    for (let i = 0; i < parts.length; i += 2)
      nfAll.push({ set, name: parts[i + 1], id: `${set}-${parts[i + 1]}`, hex: parts[i].toUpperCase(), char: String.fromCodePoint(parseInt(parts[i], 16)) })
  }
  return nfAll
}
function nfFilter() {
  const q = nf.query.trim().toLowerCase().replace(/^u\+/, '')
  return nfGlyphs().filter((g) => (nf.set === 'all' || g.set === nf.set) && (!q || g.id.includes(q) || g.hex.toLowerCase() === q))
}

const DEFAULT_COLOR = 0x01000000
function cellsOf(rows) {
  const numbers = rows.flat().flatMap(([char, color]) => [char.codePointAt(0), color, DEFAULT_COLOR])
  return new Uint8Array(Uint32Array.from(numbers).buffer).toBase64()
}

// 32 by 8 RGBA pixels, blue on the left fading to red on the right
function gradient() {
  const px = new Uint8Array(32 * 8 * 4)
  for (let y = 0; y < 8; y++) for (let x = 0; x < 32; x++) {
    const i = (y * 32 + x) * 4
    px[i] = Math.round((x / 31) * 255); px[i + 1] = 40; px[i + 2] = Math.round((1 - x / 31) * 255); px[i + 3] = 255
  }
  return px.toBase64()
}

export function register(on) {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'gallery', description: 'Show every mod element' })
    return next(e)
  })

  on('command.run', { command: 'gallery' }, async ($) => {
    await $.ui.open({ id: 'gallery', focus: true, closeOnEscape: true })
    return {}
  })

  on('ui.render', { component: 'Pane' }, async ($, e, next) => {
    if (e.requestId !== 'gallery') return next(e)
    const { Box, Text, Button, Input, Select, Link, Markdown, Code, Raster, Image, Svg, Client } = $.ui.resolve(e)
    const head = (t) => Text({ bold: true, color: 'claude', children: [t] })
    const redraw = () => $.ui.invalidate('ui.render')
    const cols = Math.max(1, Math.floor(((e.props.bodyColumns ?? 80) - 2 + NF_GAP) / (NF_SLOT + NF_GAP)))
    const perPage = cols * NF_ROWS
    const found = nfFilter()
    const pages = Math.max(1, Math.ceil(found.length / perPage))
    nf.page = Math.min(nf.page, pages - 1)
    const shown = found.slice(nf.page * perPage, (nf.page + 1) * perPage)
    const copy = async (g, press) => {
      const r = await $.ui.copy({ text: g.char, surface: press.surface })
      nf.copied = { g, ...r }
      redraw()
    }
    const glyphRows = []
    for (let i = 0; i < shown.length; i += cols)
      glyphRows.push(Box({ flexDirection: 'row', columnGap: NF_GAP, children: shown.slice(i, i + cols).map((g) =>
        Box({ width: NF_SLOT, children: [Button({ key: `nf:${g.id}`, label: g.char, plain: true, onPress: (p) => copy(g, p) })] })) }))
    const c = nf.copied
    return Box({
      flexDirection: 'column',
      gap: 1,
      children: [
        Box({ flexDirection: 'column', children: [
          head('TEXT STYLES'),
          Text({ children: ['plain'] }),
          Text({ bold: true, children: ['bold'] }),
          Text({ italic: true, children: ['italic'] }),
          Text({ underline: true, children: ['underline'] }),
          Text({ strikethrough: true, children: ['strikethrough'] }),
          Text({ dimColor: true, children: ['dim'] }),
          Text({ inverse: true, children: ['inverse'] }),
          Text({ color: 'warning', children: ["theme key: warning"] }),
          Text({ color: 'suggestion', children: ['theme key: suggestion'] }),
          Text({ color: 'permission', children: ['theme key: permission'] }),
          Text({ color: 'fastMode', children: ['theme key: fastMode'] }),
          Text({ color: 'inactive', children: ['theme key: inactive'] }),
          Text({ backgroundColor: 'userMessageBackground', children: ['theme background: userMessageBackground'] }),
          Text({ wrap: 'truncate-end', children: ['wrap truncate-end: this long line is cut off at the pane edge so it never wraps onto a second row'] }),
        ] }),
        Box({ flexDirection: 'column', children: [
          head('MARKDOWN AND LINK'),
          Markdown({ text: '## Heading\n\nSome **bold** and `code`:\n\n- one\n- two\n\n> a quote' }),
          Link({ href: 'https://code.claude.com/docs', label: 'Claude Code docs' }),
        ] }),
        Box({ flexDirection: 'column', children: [
          head('CODE AND DIFF'),
          Code({ language: 'javascript', startLine: 1, source: "const name = 'mods'\nconsole.log('hello ' + name)" }),
          Code({ format: 'diff', source: '@@ -1,3 +1,3 @@\n # Mods\n-A mod is a plugin.\n+A mod is a plugin that runs code.\n Read on.' }),
        ] }),
        Box({ flexDirection: 'column', children: [
          head('BOX BORDERS'),
          ...['single', 'double', 'round', 'bold', 'singleDouble', 'doubleSingle', 'classic', 'arrow', 'dashed', 'quote'].map((s) =>
            Box({ borderStyle: s, paddingX: 1, children: [Text({ children: [`borderStyle: '${s}'`] })] })),
        ] }),
        Box({ flexDirection: 'column', children: [
          head('CONTROLS (Tab moves between them)'),
          Button({ key: 'save', label: 'Save', onPress: noop }),
          Button({ key: 'next', label: 'Next', hotkey: 'n', plain: true, onPress: noop }),
          Button({ key: 'skip', label: 'Skip', dimColor: true, onPress: noop }),
          Input({ key: 'title', label: 'Title', placeholder: 'Type and press Enter', value: '', submitLabel: 'save', onSubmit: noop }),
          Select({ key: 'format', label: 'Format', value: picked,
            options: [{ value: 'md', label: 'Markdown' }, { value: 'html', label: 'HTML' }, { value: 'txt', label: 'Plain text' }],
            onSelect: (v) => { picked = v } }),
        ] }),
        Box({ flexDirection: 'column', children: [
          head('RASTER (colored cells)'),
          Raster({ key: 'grid', columns: 3, rows: 2, cells: cellsOf([
            [['█', 0x2e7d32], ['█', 0xf9a825], ['█', 0xc62828]],
            [['█', 0x2e7d32], ['█', 0x2e7d32], ['█', 0xf9a825]],
          ]) }),
        ] }),
        Box({ flexDirection: 'column', children: [
          head('IMAGE (kitty or Ghostty terminals only; else dim alt text)'),
          Image({ key: 'pic', columns: 16, rows: 4, alt: 'a blue to red gradient',
            source: { rgba: gradient(), width: 32, height: 8 } }),
        ] }),
        Box({ flexDirection: 'column', children: [
          head('CLIENT (own module, ticks twice a second)'),
          Client({ key: 'ticker', module: './client/ticker.js', props: { label: 'ticks' } }),
        ] }),
        Box({ flexDirection: 'column', children: [
          head('SVG (Desktop app only)'),
          e.surface === 'desktop'
            ? Svg({ alt: 'three bars', width: 120, height: 60,
                source: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 60"><rect x="10" y="40" width="20" height="20" fill="#2e7d32"/><rect x="50" y="25" width="20" height="35" fill="#f9a825"/><rect x="90" y="5" width="20" height="55" fill="#c62828"/></svg>' })
            : Text({ dimColor: true, children: ['Svg draws in the Desktop app, not the terminal'] }),
        ] }),
        Box({ flexDirection: 'column', gap: 1, children: [
          head(`NERD FONT ICONS (Nerd Fonts ${NF_VERSION})`),
          Text({ dimColor: true, children: ['Click a glyph, or Tab to it and press Enter, to copy it. Glyphs show as boxes unless the terminal uses a Nerd Font.'] }),
          Box({ flexDirection: 'row', columnGap: 3, flexWrap: 'wrap', children: [
            Select({ key: 'nf-set', label: 'Set', value: nf.set,
              options: [{ value: 'all', label: `All (${nfGlyphs().length})` },
                ...Object.keys(NF_SETS).map((k) => ({ value: k, label: `${k} (${nfCount[k]})` }))],
              onSelect: (v) => { nf.set = v; nf.page = 0; redraw() } }),
            Input({ key: 'nf-search', label: 'Search', placeholder: 'name or hex code', value: nf.query, submitLabel: 'search',
              onInput: (v) => { nf.query = v; nf.page = 0; redraw() }, onSubmit: (v) => { nf.query = v; nf.page = 0; redraw() } }),
          ] }),
          Box({ flexDirection: 'row', columnGap: 2, children: [
            Button({ key: 'nf-prev', label: 'Prev', dimColor: nf.page === 0, onPress: () => { nf.page = Math.max(0, nf.page - 1); redraw() } }),
            Button({ key: 'nf-next', label: 'Next page', dimColor: nf.page >= pages - 1, onPress: () => { nf.page = Math.min(pages - 1, nf.page + 1); redraw() } }),
            Text({ dimColor: true, children: [`page ${nf.page + 1} of ${pages} · ${found.length} icons`] }),
          ] }),
          !c ? Text({ dimColor: true, children: ['Nothing copied yet'] })
            : c.isCopied ? Text({ color: 'success', children: [`Copied  ${c.g.char}  ${c.g.id}  U+${c.g.hex}`] })
            : Text({ dimColor: true, children: [`Not copied (${c.reason}): ${c.g.char}  ${c.g.id}  U+${c.g.hex}`] }),
          shown.length
            ? Box({ flexDirection: 'column', rowGap: 1, paddingX: 1, children: glyphRows })
            : Text({ dimColor: true, children: ['No icon matches'] }),
        ] }),
      ],
    })
  })
}
