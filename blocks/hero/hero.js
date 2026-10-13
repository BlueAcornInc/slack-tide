/**
 * Hero: one row with a copy cell and an image cell, in either order.
 * Paragraphs above the headline become the kicker.
 * @param {Element} block The hero block element
 */
export default function decorate(block) {
  const cells = [...block.querySelectorAll(':scope > div > div')];
  const media = cells.find((cell) => cell.querySelector('picture') && !cell.querySelector('h1, h2, h3'));
  const copy = cells.find((cell) => cell !== media) || document.createElement('div');

  copy.className = 'hero-content hero-reveal';
  const heading = copy.querySelector('h1, h2, h3');
  if (heading) {
    let el = heading.previousElementSibling;
    while (el) {
      if (el.tagName === 'P') el.classList.add('kicker');
      el = el.previousElementSibling;
    }
  }

  const children = [copy];
  if (media) {
    const figure = document.createElement('figure');
    figure.className = 'hero-media';
    figure.append(media.querySelector('picture'));
    children.push(figure);
  }
  block.replaceChildren(...children);
}
