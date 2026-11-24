import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import postcss from 'postcss'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'
import baseConfig from '../tailwind.config.js'

// Blog pages are rendered here, not by Vite, so they get their own stylesheet built from
// the portfolio's Tailwind tokens plus the shared article styles. Built once per process.
const views = fileURLToPath(new URL('./views.js', import.meta.url)).replace(/\\/g, '/')
let css

export async function blogCss() {
  if (!css) {
    const prose = await readFile(new URL('../src/prose.css', import.meta.url), 'utf8')
    const input = `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n${prose}`
    const result = await postcss([tailwindcss({ ...baseConfig, content: [views] }), autoprefixer]).process(input, {
      from: undefined,
    })
    css = result.css
  }
  return css
}
