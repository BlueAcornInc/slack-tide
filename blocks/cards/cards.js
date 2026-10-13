import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Cards. With an image, a card is one link (brew guides): 4:3 photo, title, meta.
 * Without one it is a text item (journal): a kicker line, a linked title, an excerpt.
 * @param {Element} block The cards block element
 */
export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    let image;
    let body;
    [...row.children].forEach((cell) => {
      if (!image && cell.querySelector('picture') && !cell.querySelector('h1, h2, h3, h4, h5, h6')) {
        cell.className = 'cards-card-image';
        image = cell;
      } else {
        if (!cell.children.length && cell.textContent.trim()) {
          const p = document.createElement('p');
          p.textContent = cell.textContent.trim();
          cell.replaceChildren(p);
        }
        cell.className = 'cards-card-body';
        body = body || cell;
        if (body !== cell) body.append(...cell.childNodes);
      }
    });
    if (!body) {
      body = document.createElement('div');
      body.className = 'cards-card-body';
    }

    const heading = body.querySelector('h1, h2, h3, h4, h5, h6');
    if (heading) {
      heading.classList.add('cards-card-title');
      let el = heading.previousElementSibling;
      while (el) {
        if (el.tagName === 'P') el.classList.add('kicker');
        el = el.previousElementSibling;
      }
    }

    const titleLink = heading && heading.querySelector('a');
    if (image && titleLink) {
      // the whole card is the link: move the title link out to wrap the card
      const link = document.createElement('a');
      link.className = 'cards-card-link';
      link.href = titleLink.href;
      titleLink.replaceWith(...titleLink.childNodes);
      link.append(image, body);
      li.append(link);
    } else {
      if (image) li.append(image);
      li.append(body);
    }
    li.classList.add(image ? 'cards-card-media' : 'cards-card-text');
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }])));
  block.replaceChildren(ul);
}
