const form = document.querySelector('[data-form]');
const publicationsList = document.querySelector('[data-publications-list]');
const emptyState = document.querySelector('[data-empty-state]');

const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const escapeHtml = (string) => string
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

function paragraphize(text) {
  return text
    .split(/\n\s*\n?/)
    .filter(Boolean)
    .map((paragraph) => `<p>${paragraph.trim()}</p>`)
    .join('');
}

function redactContent(content, sensitiveTerms = []) {
  let safeText = escapeHtml(content);

  sensitiveTerms.forEach((term) => {
    if (!term) return;
    const padded = term.trim();
    if (!padded) return;
    const regex = new RegExp(escapeRegExp(padded), 'gi');
    const mask = '█'.repeat(Math.min(14, Math.max(padded.length, 4)));
    safeText = safeText.replace(regex, `<span class="redaction" title="Dado ocultado">${mask}</span>`);
  });

  return paragraphize(safeText || '');
}

function renderPublication({ title, type, content, sensitiveTerms }) {
  const article = document.createElement('article');
  article.className = 'publication-card';

  const redacted = redactContent(content, sensitiveTerms);
  const original = paragraphize(escapeHtml(content));

  article.innerHTML = `
    <header>
      <div>
        <p class="pill">${type}</p>
        <h3>${escapeHtml(title)}</h3>
        <p class="meta">Versão anonimizável • ${sensitiveTerms.length ? 'Tarjas aplicadas' : 'Sem termos sensíveis'}</p>
      </div>
      <span class="status">${new Date().toLocaleDateString('pt-BR')}</span>
    </header>
    <div class="publication-content" data-mode="redacted">${redacted}</div>
    <div class="publication-content is-hidden" data-mode="original">${original}</div>
    <div class="card__actions">
      <button class="button inline" type="button" data-toggle>Alternar anonimização</button>
      <button class="button inline" type="button" data-copy>Copiar versão atual</button>
    </div>
  `;

  const toggleButton = article.querySelector('[data-toggle]');
  const copyButton = article.querySelector('[data-copy]');
  const redactedBlock = article.querySelector('[data-mode="redacted"]');
  const originalBlock = article.querySelector('[data-mode="original"]');

  toggleButton.addEventListener('click', () => {
    const showingRedacted = !redactedBlock.classList.contains('is-hidden');
    redactedBlock.classList.toggle('is-hidden', showingRedacted);
    originalBlock.classList.toggle('is-hidden', !showingRedacted);
    toggleButton.textContent = showingRedacted ? 'Voltar à versão anonimizada' : 'Alternar anonimização';
  });

  copyButton.addEventListener('click', async () => {
    const activeBlock = redactedBlock.classList.contains('is-hidden') ? originalBlock : redactedBlock;
    const temp = document.createElement('div');
    temp.innerHTML = activeBlock.innerHTML;
    const textToCopy = temp.innerText;

    try {
      await navigator.clipboard.writeText(textToCopy);
      copyButton.textContent = 'Copiado!';
      setTimeout(() => (copyButton.textContent = 'Copiar versão atual'), 1600);
    } catch (error) {
      copyButton.textContent = 'Não foi possível copiar';
      setTimeout(() => (copyButton.textContent = 'Copiar versão atual'), 2000);
    }
  });

  publicationsList.prepend(article);
}

function handleSubmit(event) {
  event.preventDefault();
  const formData = new FormData(form);
  const title = formData.get('titulo').trim();
  const type = formData.get('tipo');
  const content = formData.get('conteudo').trim();
  const sensitiveTerms = (formData.get('sensivel') || '')
    .split(',')
    .map((term) => term.trim())
    .filter(Boolean);

  if (!title || !content) return;

  renderPublication({ title, type, content, sensitiveTerms });
  emptyState?.remove();
  form.reset();
}

form?.addEventListener('submit', handleSubmit);

console.log('Portfólio carregado com anonimização ativa.');
