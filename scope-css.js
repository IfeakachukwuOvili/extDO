// scope-css.js
const fs = require('fs');
const path = 'content.css';
const SCOPE = '#task-manager-sidebar';

let css = fs.readFileSync(path, 'utf8');

// Scope selectors, including comma-separated and multi-line
css = css.replace(/(^|})\s*([^{@}]+){/g, (match, before, selector) => {
  // Don't double-scope or scope keyframes/media
  if (selector.includes(SCOPE) || selector.trim().startsWith('@')) return match;
  // Split selectors by comma, scope each, and join back
  const scoped = selector
    .split(',')
    .map(sel => {
      sel = sel.trim();
      if (sel.startsWith(SCOPE) || sel.startsWith('@')) return sel;
      return `${SCOPE} ${sel}`;
    })
    .join(', ');
  return `${before}\n${scoped} {`;
});

fs.writeFileSync(path, css, 'utf8');
console.log('All selectors have been scoped to', SCOPE);