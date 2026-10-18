# Claude Mods Gallery

A Claude Code mod that adds a `/gallery` command. The command opens one pane that draws
every element a mod can draw, so you can see each one in your own terminal and theme.

## Run it

```bash
git clone https://github.com/shelmecha/claude-mods-gallery
claude --plugin-dir ./claude-mods-gallery
```

At the Claude Code prompt, run `/gallery`. Press Esc to close the pane. Use a wide,
fullscreen terminal and scroll inside the pane.

## What the pane shows

- `Text` styles: bold, italic, underline, strikethrough, dim, inverse, wrap, theme colors
- `Markdown`, `Link`, `Code` and a diff
- `Box` with all 10 border styles
- `Button`, `Input` and `Select`
- `Raster`, `Image`, `Client` and `Svg`
- A Nerd Font icon directory: all 10,995 glyphs of Nerd Fonts 3.5.1, with a set filter, a name or hex code search and pages. Click a glyph, or move to it with Tab and press Enter, to copy it to the clipboard

## Notes

- The controls (Save, Next, Skip, Title, Format) do nothing. They show how each control looks.
- The icons show as boxes unless your terminal uses a [Nerd Font](https://www.nerdfonts.com).
- The copy uses a clipboard tool on your machine or the terminal's OSC 52 write. Some terminals and tmux block OSC 52.
- The icon data is `hooks/nerdfont-data.js`. To build it again, download [`glyphnames.json`](https://raw.githubusercontent.com/ryanoasis/nerd-fonts/master/glyphnames.json) and run `node scripts/build-nerdfont-data.mjs <path to glyphnames.json>`.
- Colors use theme keys, so they follow your theme. The `Raster` and `Image` use fixed colors.
- `Image` draws in kitty 0.28+ and Ghostty, and not inside tmux. Other terminals show dim alt text.
- `Svg` draws in the Desktop app only. The terminal shows a note.
- Built against the Claude Code mods reference (v2.1.290). Check with `claude plugin validate .`

## Reference

- [Mods reference](https://code.claude.com/docs/en/plugins/mods/reference)
- [Interface gallery](https://code.claude.com/docs/en/plugins/mods/gallery)

## Licence

MIT
