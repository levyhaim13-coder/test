(() => {
  const basePath = '/test/';
  const menuUrl = new URL(basePath + 'menu.json', window.location.origin).toString();

  const revealMenu = () => {
    document.getElementById('shared-menu-loading-style')?.remove();
  };

  const ensureMenuLayoutStyles = () => {
    const styleId = 'shared-menu-layout-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = "\n#MenuBar2.MenuBarHorizontal {\n    display: flex !important;\n    flex-wrap: wrap !important;\n    align-items: stretch !important;\n    justify-content: center !important;\n    width: 100% !important;\n    height: auto !important;\n    min-height: 0 !important;\n    margin: 0 !important;\n    padding: 0 !important;\n    overflow: visible !important;\n    box-sizing: border-box !important;\n}\n\n#MenuBar2.MenuBarHorizontal::after {\n    content: none !important;\n}\n\n#MenuBar2.MenuBarHorizontal > li {\n    float: none !important;\n    flex: 0 0 auto !important;\n    width: auto !important;\n}\n\n#MenuBar2.MenuBarHorizontal > li > a {\n    display: flex !important;\n    align-items: center !important;\n    justify-content: center !important;\n    height: 100% !important;\n    box-sizing: border-box !important;\n    white-space: nowrap !important;\n}\n";
    document.head.appendChild(style);
  };

  const escapeHtml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const renderTitle = (value) => {
    const title = String(value ?? '');
    return /^\s*<div(?:\s[^>]*)?>/i.test(title) ? title : '<div>' + title + '</div>';
  };

  const renderMenu = (items, isRoot = true) => {
    const attrs = isRoot ? ' id="MenuBar2" class="MenuBarHorizontal"' : '';
    const children = items.map((item) => {
      const liId = item.id ? ' id="' + escapeHtml(item.id) + '"' : '';
      const liClass = item.className ? ' class="' + escapeHtml(item.className) + '"' : '';
      const aClass = item.aClass ? ' class="' + escapeHtml(item.aClass) + '"' : '';
      const href = escapeHtml(item.url || '#');
      const title = renderTitle(item.title);
      const nested = item.children && item.children.length ? renderMenu(item.children, false) : '';
      return '<li' + liId + liClass + '><a' + aClass + ' href="' + href + '">' + title + '</a>' + nested + '</li>';
    }).join('');
    return '<ul' + attrs + '>' + children + '</ul>';
  };

  ensureMenuLayoutStyles();

  fetch(menuUrl, { cache: 'no-cache' })
    .then((response) => {
      if (!response.ok) throw new Error('Menu fetch failed');
      return response.json();
    })
    .then((items) => {
      if (!Array.isArray(items)) return;
      const menu = document.getElementById('MenuBar2');
      if (!menu) return;
      menu.outerHTML = renderMenu(items);
      if (window.Spry && window.Spry.Widget && typeof window.Spry.Widget.MenuBar === 'function') {
        window.MenuBar2 = new window.Spry.Widget.MenuBar('MenuBar2', '');
      }
    })
    .catch((error) => {
      console.warn('Could not load shared menu:', error);
    })
    .finally(revealMenu);
})();