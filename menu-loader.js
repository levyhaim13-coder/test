(() => {
  const basePath = '/test/';
  const menuUrl = new URL(basePath + 'menu.json', window.location.origin).toString();

  const escapeHtml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const renderMenu = (items, isRoot = true) => {
    const attrs = isRoot ? ' id="MenuBar2" class="MenuBarHorizontal"' : '';
    const children = items.map((item) => {
      const liId = item.id ? ' id="' + escapeHtml(item.id) + '"' : '';
      const liClass = item.className ? ' class="' + escapeHtml(item.className) + '"' : '';
      const aClass = item.aClass ? ' class="' + escapeHtml(item.aClass) + '"' : '';
      const href = escapeHtml(item.url || '#');
      const title = item.title || '';
      const nested = item.children && item.children.length ? renderMenu(item.children, false) : '';
      return '<li' + liId + liClass + '><a' + aClass + ' href="' + href + '">' + title + '</a>' + nested + '</li>';
    }).join('');
    return '<ul' + attrs + '>' + children + '</ul>';
  };

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
    });
})();