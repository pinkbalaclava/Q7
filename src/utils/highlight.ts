export function highlightGroup(groupKey?: string, colorHex?: string) {
  // clear
  document.querySelectorAll('.card.kpi-link').forEach(el=>{
    el.classList.remove('is-hot');
    if (colorHex) (el as HTMLElement).style.removeProperty('--accent');
  });
  if (!groupKey) return;

  const card = document.querySelector<HTMLElement>(`.card.kpi-link[data-group="${groupKey}"]`);
  if (card) {
    if (colorHex) card.style.setProperty('--accent', colorHex);
    card.classList.add('is-hot');
  }
}