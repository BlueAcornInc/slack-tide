import {
  loadHeader,
  loadFooter,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
  buildBlock,
} from './aem.js';

if (window.trustedTypes && window.trustedTypes.createPolicy) {
  const innerTT = window.trustedTypes.createPolicy('tt-inner', {
    createHTML: (s) => s, // avoid stack overflow
  });

  window.trustedTypes.createPolicy('default', {
    createHTML: (input, type, sink) => {
      let processedInput = input;
      if (/srcdoc\s*=/i.test(processedInput)) {
        const doc = new DOMParser().parseFromString(innerTT.createHTML(processedInput), 'text/html');
        doc.querySelectorAll('iframe[srcdoc]').forEach((el) => el.removeAttribute('srcdoc'));
        processedInput = doc.body.innerHTML;
      }
      if (sink.includes('createContextualFragment') || sink.includes('Document write')) {
        const doc = new DOMParser().parseFromString(innerTT.createHTML(processedInput), 'text/html');
        doc.querySelectorAll('script').forEach((el) => el.remove());
        processedInput = doc.body.innerHTML;
      }
      return processedInput;
    },
    createScriptURL: (input) => input,
    createScript: (input) => input,
  });
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Turns `/widgets/...` links into widget blocks.
 * @param {Element} main The container element
 */
function buildWidgetAutoBlocks(main) {
  const widgetLinks = [...main.querySelectorAll('a[href*="/widgets/"]')];
  widgetLinks.forEach((link) => {
    if (link.closest('.widget')) return;
    const newLink = link.cloneNode(true);
    const widgetBlock = buildBlock('widget', { elems: [newLink] });
    const p = link.closest('p');
    if (
      p
      && p.querySelectorAll('a').length === 1
      && p.querySelector('a') === link
      && p.textContent.trim() === link.textContent.trim()
    ) {
      p.replaceWith(widgetBlock);
    } else {
      link.replaceWith(widgetBlock);
    }
  });
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    // auto load `*/fragments/*` references
    const fragments = [...main.querySelectorAll('a[href*="/fragments/"]')].filter((f) => !f.closest('.fragment'));
    if (fragments.length > 0) {
      // eslint-disable-next-line import/no-cycle
      import('../blocks/fragment/fragment.js').then(({ loadFragment }) => {
        fragments.forEach(async (fragment) => {
          try {
            const { pathname } = new URL(fragment.href);
            const frag = await loadFragment(pathname);
            fragment.parentElement.replaceWith(...frag.children);
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Fragment loading failed', error);
          }
        });
      });
    }
    buildWidgetAutoBlocks(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates formatted links to style them as buttons.
 * @param {HTMLElement} main The main container element
 */
function decorateButtons(main) {
  main.querySelectorAll('p a[href]').forEach((a) => {
    a.title = a.title || a.textContent;
    const p = a.closest('p');
    const text = a.textContent.trim();

    // quick structural checks
    if (a.querySelector('img') || p.textContent.trim() !== text) return;

    // skip URL display links
    try {
      if (new URL(a.href).href === new URL(text, window.location).href) return;
    } catch { /* continue */ }

    // require authored formatting for buttonization
    const strong = a.closest('strong');
    const em = a.closest('em');
    if (!strong && !em) {
      // a plain link alone in its paragraph is a "view all" arrow link
      p.classList.add('link-arrow-wrapper');
      a.classList.add('link-arrow');
      return;
    }

    p.className = 'button-wrapper';
    a.className = 'button';
    if (strong && em) { // high-impact call-to-action
      a.classList.add('accent');
      const outer = strong.contains(em) ? strong : em;
      outer.replaceWith(a);
    } else if (strong) {
      a.classList.add('primary');
      strong.replaceWith(a);
    } else {
      a.classList.add('secondary');
      em.replaceWith(a);
    }
  });
}

/**
 * Wraps runs of adjacent button paragraphs so they sit side by side.
 * @param {HTMLElement} main The main container element
 */
function groupButtons(main) {
  main.querySelectorAll('p.button-wrapper').forEach((p) => {
    if (p.parentElement.classList.contains('button-group')) return;
    const prev = p.previousElementSibling;
    if (prev && prev.classList.contains('button-group')) {
      prev.append(p);
      return;
    }
    const next = p.nextElementSibling;
    if (!next || !next.classList.contains('button-wrapper')) return;
    const group = document.createElement('div');
    group.className = 'button-group';
    p.before(group);
    group.append(p);
  });
}

/**
 * Turns a short bold-only paragraph right after a heading into the roast badge,
 * and lays out section heads: heading text on the left, a "view all" link on the right.
 * @param {HTMLElement} main The main container element
 */
function decorateSectionHeads(main) {
  main.querySelectorAll('h2 + p, h3 + p').forEach((p) => {
    const strong = p.querySelector(':scope > strong');
    if (!strong || p.childElementCount !== 1 || p.querySelector('a')) return;
    const text = p.textContent.trim();
    if (!text || text !== strong.textContent.trim() || text.length > 24) return;
    const heading = p.previousElementSibling;
    const row = document.createElement('div');
    row.className = 'heading-row';
    heading.before(row);
    const badge = document.createElement('span');
    badge.className = 'badge';
    badge.textContent = text;
    row.append(heading, badge);
    p.remove();
  });

  main.querySelectorAll('.default-content-wrapper').forEach((wrapper) => {
    const last = wrapper.lastElementChild;
    if (!last || !last.classList.contains('link-arrow-wrapper')) return;
    if (!wrapper.querySelector(':scope > h2, :scope > .heading-row')) return;
    const text = document.createElement('div');
    text.className = 'section-head-text';
    [...wrapper.children].filter((el) => el !== last).forEach((el) => text.append(el));
    wrapper.prepend(text);
    wrapper.classList.add('section-head');
  });
}

const iconSources = {};

/**
 * Swaps the <img> that decorateIcons adds for the SVG itself,
 * so stroke="currentColor" icons pick up the surrounding text color.
 * @param {Element} element Element containing icons
 */
function inlineIcons(element) {
  element.querySelectorAll('span.icon > img[data-icon-name]').forEach(async (img) => {
    const { iconName } = img.dataset;
    try {
      iconSources[iconName] = iconSources[iconName]
        || fetch(img.src).then((resp) => (resp.ok ? resp.text() : ''));
      const svg = await iconSources[iconName];
      if (!svg.startsWith('<svg') || !img.isConnected) return;
      const span = img.parentElement;
      span.innerHTML = svg;
      span.firstElementChild.setAttribute('aria-hidden', 'true');
      span.firstElementChild.setAttribute('focusable', 'false');
    } catch (e) {
      // keep the <img>
    }
  });
}

/**
 * Decorates and inlines any icon spans inside an element (for markup built by blocks).
 * @param {Element} element Element containing span.icon elements
 */
export function decorateBlockIcons(element) {
  decorateIcons(element);
  inlineIcons(element);
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
export function decorateMain(main) {
  decorateIcons(main);
  inlineIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
  decorateButtons(main);
  groupButtons(main);
  decorateSectionHeads(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  loadHeader(doc.querySelector('body > header'));

  const main = doc.querySelector('main');
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadFooter(doc.querySelector('body > footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  import('./consent-check.js');
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
