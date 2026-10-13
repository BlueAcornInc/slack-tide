/**
 * Steps variant: in the last column, each heading and the text under it becomes a
 * numbered step.
 * @param {Element} col The column holding the steps
 */
function buildSteps(col) {
  const headings = [...col.querySelectorAll(':scope > h2, :scope > h3, :scope > h4')];
  if (headings.length < 2) return;
  const ol = document.createElement('ol');
  ol.className = 'steps-list';
  headings.forEach((heading, i) => {
    const li = document.createElement('li');
    const number = document.createElement('span');
    number.className = 'step-number';
    number.setAttribute('aria-hidden', 'true');
    number.textContent = i + 1;
    const text = document.createElement('div');
    text.className = 'step-text';
    const next = headings[i + 1];
    const nodes = [heading];
    let el = heading.nextElementSibling;
    while (el && el !== next) {
      nodes.push(el);
      el = el.nextElementSibling;
    }
    text.append(...nodes);
    li.append(number, text);
    ol.append(li);
  });
  col.append(ol);
}

export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('columns-img-col');
        }
      }
    });
    if (block.classList.contains('steps') && row.lastElementChild) buildSteps(row.lastElementChild);
  });
}
