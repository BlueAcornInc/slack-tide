import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * Splits the first footer section into columns: everything before the first heading is the
 * brand column, then each heading starts a link group.
 * @param {Element} section The first footer section
 */
function buildColumns(section) {
  const content = section.querySelector('.default-content-wrapper') || section;
  const columns = document.createElement('div');
  columns.className = 'footer-columns';
  let current = document.createElement('div');
  current.className = 'footer-brand';
  columns.append(current);
  [...content.children].forEach((el) => {
    if (/^H[1-6]$/.test(el.tagName)) {
      current = document.createElement('div');
      current.className = 'footer-group';
      columns.append(current);
    }
    current.append(el);
  });
  const brand = columns.querySelector('.footer-brand > p');
  if (brand) brand.classList.add('footer-wordmark');
  content.replaceChildren(columns);
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);

  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  const sections = [...footer.children];
  if (sections.length > 1) sections[sections.length - 1].classList.add('footer-bottom');
  if (sections[0] && sections.length > 1) buildColumns(sections[0]);

  block.append(footer);
}
