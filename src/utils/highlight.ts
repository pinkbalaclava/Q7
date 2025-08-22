export function highlightGroup(groupKey?: string, colorHex?: string) {
  // clear
  document.querySelectorAll('.kpi-link').forEach(el=>{
    el.classList.remove('is-hot');
    (el as HTMLElement).style.removeProperty('--accent');
  });
  if (!groupKey) return;

  const card = document.querySelector<HTMLElement>(`.kpi-link[data-group="${groupKey}"]`);
  if (card) {
    if (colorHex) card.style.setProperty('--accent', colorHex);
    card.classList.add('is-hot');
  }
}