import { addToCart } from '../../scripts/cart.js';
import { decorateBlockIcons } from '../../scripts/scripts.js';

const ADDED_MS = 2000;
const ADDING_MS = 300;
let titleCount = 0;

function textOf(cell) {
  return cell ? cell.textContent.trim() : '';
}

/**
 * Sets the button label, optionally with a leading icon.
 * @param {HTMLButtonElement} button
 * @param {string} label
 * @param {string} [icon]
 */
function setLabel(button, label, icon) {
  button.textContent = '';
  if (icon) {
    const span = document.createElement('span');
    span.className = `icon icon-${icon}`;
    button.append(span);
    decorateBlockIcons(button);
  }
  button.append(label);
}

/**
 * Add to cart confirms in place: Adding (busy), then Added for two seconds.
 * @param {HTMLButtonElement} button
 * @param {object} item
 * @param {Element} status live region
 */
function wireAddToCart(button, item, status) {
  button.addEventListener('click', () => {
    if (button.disabled || button.classList.contains('added')) return;
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    setLabel(button, 'Adding');
    setTimeout(() => {
      addToCart(item);
      button.disabled = false;
      button.removeAttribute('aria-busy');
      button.classList.add('added');
      setLabel(button, 'Added', 'check');
      status.textContent = `Added ${item.name} to cart`;
      setTimeout(() => {
        button.classList.remove('added');
        setLabel(button, 'Add to cart');
      }, ADDED_MS);
    }, ADDING_MS);
  });
}

/**
 * Product cards: each row is Image | Details (linked title, meta, tasting notes) | Price.
 * The top half of the card is one link; add to cart sits below it.
 * @param {Element} block The product-cards block element
 */
export default function decorate(block) {
  const ul = document.createElement('ul');
  const status = document.createElement('p');
  status.className = 'visually-hidden';
  status.setAttribute('aria-live', 'polite');

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    const imageCell = cells.find((cell) => cell.querySelector('picture'));
    const rest = cells.filter((cell) => cell !== imageCell);
    const detailsCell = rest.find((cell) => cell.querySelector('h1, h2, h3, h4, a')) || rest[0];
    let priceText = textOf(rest.find((cell) => cell !== detailsCell));

    const li = document.createElement('li');
    const article = document.createElement('article');

    // details: title (link removed, the card link carries it), meta, notes
    const details = document.createElement('div');
    details.className = 'product-details';
    let href = '';
    let name = '';
    if (detailsCell) {
      const kids = detailsCell.children.length ? [...detailsCell.children] : [];
      if (!kids.length && textOf(detailsCell)) {
        const p = document.createElement('p');
        p.textContent = textOf(detailsCell);
        kids.push(p);
      }
      kids.forEach((el, i) => {
        const link = el.querySelector('a');
        const isTitle = !name && (/^H[1-6]$/.test(el.tagName) || (i === 0 && link));
        if (isTitle) {
          href = link ? link.href : '';
          name = el.textContent.trim();
          const h3 = document.createElement('h3');
          h3.className = 'product-title';
          titleCount += 1;
          h3.id = `product-title-${titleCount}`;
          h3.textContent = name;
          details.append(h3);
        } else if (!priceText && /^\$\s?\d/.test(el.textContent.trim())) {
          priceText = el.textContent.trim();
        } else {
          details.append(el);
        }
      });
    }
    const meta = details.querySelector('.product-title + p');
    if (meta) meta.classList.add('product-meta');

    const top = document.createElement(href ? 'a' : 'div');
    top.className = 'product-link';
    if (href) top.href = href;
    if (imageCell) {
      const figure = document.createElement('figure');
      figure.append(imageCell.querySelector('picture'));
      top.append(figure);
    }
    top.append(details);

    // price and add to cart
    const buy = document.createElement('div');
    buy.className = 'product-buy';
    if (priceText) {
      const price = document.createElement('p');
      price.className = 'price';
      price.textContent = priceText;
      buy.append(price);
    }
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'button secondary';
    setLabel(button, 'Add to cart');
    const title = details.querySelector('.product-title');
    if (title) button.setAttribute('aria-describedby', title.id);
    const sku = (href ? new URL(href).pathname : name).replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
    wireAddToCart(button, {
      sku, name, price: priceText, url: href,
    }, status);
    buy.append(button);

    article.append(top, buy);
    li.append(article);
    ul.append(li);
  });

  block.replaceChildren(ul, status);
}
