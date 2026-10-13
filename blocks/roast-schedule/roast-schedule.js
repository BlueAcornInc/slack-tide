/**
 * Returns a cell's content as elements, wrapping bare text (single-paragraph cells
 * arrive as text) in a paragraph.
 * @param {Element} cell
 * @returns {Element[]}
 */
function cellElements(cell) {
  if (!cell) return [];
  if (cell.children.length) return [...cell.children];
  const text = cell.textContent.trim();
  if (!text) return [];
  const p = document.createElement('p');
  p.textContent = text;
  return [p];
}

/**
 * Roast schedule: a dated list of two to four coffees.
 * Each row is Date | Coffee (linked title + list of chips) | Notes | Price.
 * @param {Element} block The roast-schedule block element
 */
export default function decorate(block) {
  const ol = document.createElement('ol');

  [...block.children].forEach((row) => {
    const [dateCell, coffeeCell, notesCell, priceCell] = [...row.children];
    const li = document.createElement('li');

    // date: first line in Ink, the rest (ship day) in Ink soft
    const when = document.createElement('div');
    when.className = 'schedule-when';
    cellElements(dateCell).forEach((el, i) => {
      el.classList.add(i === 0 ? 'schedule-date' : 'schedule-ship');
      when.append(el);
    });

    // coffee: title as an h3, the list becomes chips
    const coffee = document.createElement('div');
    coffee.className = 'schedule-coffee';
    cellElements(coffeeCell).forEach((el) => {
      if (el.tagName === 'UL' || el.tagName === 'OL') {
        const chips = document.createElement('ul');
        chips.className = 'chips';
        [...el.children].forEach((item) => {
          const chip = document.createElement('li');
          chip.className = 'chip';
          chip.textContent = item.textContent.trim();
          chips.append(chip);
        });
        coffee.append(chips);
      } else if (!coffee.querySelector('h3') && el.textContent.trim()) {
        const h3 = document.createElement('h3');
        h3.append(...el.childNodes);
        coffee.append(h3);
      } else {
        coffee.append(el);
      }
    });
    const titleLink = coffee.querySelector('h3 a');
    const name = coffee.querySelector('h3')?.textContent.trim() || '';

    const notes = document.createElement('div');
    notes.className = 'schedule-notes';
    notes.append(...cellElements(notesCell));

    // price, then "See coffee" from the title's link
    const buy = document.createElement('div');
    buy.className = 'schedule-buy';
    cellElements(priceCell).forEach((el) => {
      el.classList.add('price');
      buy.append(el);
    });
    if (titleLink) {
      const see = document.createElement('a');
      see.href = titleLink.href;
      see.className = 'link-arrow';
      see.textContent = 'See coffee';
      if (name) see.setAttribute('aria-label', `See ${name}`);
      buy.append(see);
    }

    li.append(when, coffee, notes, buy);
    ol.append(li);
  });

  block.replaceChildren(ol);
}
