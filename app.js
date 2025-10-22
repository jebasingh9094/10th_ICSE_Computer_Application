// assets/js/app.js

document.addEventListener('DOMContentLoaded', () => {
  // 1. State
  const state = {
    view: 'materials',        // 'materials' | 'worksheets'
    layout: 'grid',           // 'grid' | 'list'
    subject: 'all',
    topic: 'all',
    format: 'all',
    search: ''
  };

  // 2. Toggle filters panel on mobile
  const toggleBtn = document.getElementById('toggleFilters');
  const filtersPanel = document.getElementById('filtersPanel');
  if (toggleBtn && filtersPanel) {
    toggleBtn.addEventListener('click', () => {
      const isActive = filtersPanel.classList.toggle('active');
      toggleBtn.setAttribute('aria-expanded', isActive);
    });
  }

  // 3. Cache DOM elements
  const els = {
    navBtns: document.querySelectorAll('.nav-btn'),
    contentTitle: document.getElementById('contentTitle'),
    layoutBtns: document.querySelectorAll('.view-btn'),
    cardsContainer: document.getElementById('cardsContainer'),
    subjectSelect: document.getElementById('subjectSelect'),
    topicSelect: document.getElementById('topicSelect'),
    formatSelect: document.getElementById('formatSelect'),
    searchInput: document.getElementById('searchInput'),
    clearFilters: document.getElementById('clearFilters')
  };

  // 4. Initialize filters and render
  initFilters();
  render();

  // 5. Bind events
  els.navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      state.view = btn.dataset.view;
      els.navBtns.forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
      els.contentTitle.textContent = state.view === 'materials' ? 'Study Materials' : 'Worksheets';
      render();
    });
  });


  const form = document.getElementById('reportForm');
  const status = document.getElementById('reportStatus');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const message = document.getElementById('reportMessage').value.trim();
    const email = document.getElementById('reportEmail').value.trim();

    if (!message) return;

    try {
      const response = await fetch("https://script.google.com/macros/s/AKfycbzAASPdbRxLodsTudXxbt4Ec9SvtgyUq3dmtbWsSgOxhNY-ne-nnkCprLdVPWimk3ynOA/exec", {
        method: "POST",
        body: JSON.stringify({ email, message })
      });

      if (response.ok) {
        status.textContent = "✅ Report submitted successfully!";
        form.reset();
      } else {
        status.textContent = "⚠️ Error submitting report. Try again.";
      }
    } catch (err) {
      status.textContent = "⚠️ Network error. Please try again.";
    }
  });


  els.layoutBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      state.layout = btn.dataset.layout;
      els.layoutBtns.forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
      els.cardsContainer.className = state.layout === 'grid' ? 'cards-grid' : 'cards-grid list';
      render();
    });
  });

  if (els.subjectSelect) {
    els.subjectSelect.addEventListener('change', e => {
      state.subject = e.target.value;
      syncTopics();
      render();
    });
  }

  if (els.topicSelect) {
    els.topicSelect.addEventListener('change', e => {
      state.topic = e.target.value;
      render();
    });
  }

  if (els.formatSelect) {
    els.formatSelect.addEventListener('change', e => {
      state.format = e.target.value;
      render();
    });
  }

  if (els.searchInput) {
    els.searchInput.addEventListener('input', e => {
      state.search = e.target.value.trim().toLowerCase();
      render();
    });
  }

  if (els.clearFilters) {
    els.clearFilters.addEventListener('click', () => {
      state.subject = 'all';
      state.topic = 'all';
      state.format = 'all';
      state.search = '';
      els.subjectSelect.value = 'all';
      syncTopics();
      els.topicSelect.value = 'all';
      els.formatSelect.value = 'all';
      els.searchInput.value = '';
      render();
    });
  }

  // --- Functions ---
  function initFilters() {
    if (!MATERIALS || !Array.isArray(MATERIALS)) return;
    const subjects = Array.from(new Set(MATERIALS.map(m => m.subject))).sort();
    els.subjectSelect.innerHTML = '<option value="all">All</option>';
    subjects.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s;
      opt.textContent = capitalize(s);
      els.subjectSelect.appendChild(opt);
    });
    syncTopics();
  }

  function syncTopics() {
    const base = state.view === 'materials' ? MATERIALS : WORKSHEETS;
    const filteredBySubject = state.subject === 'all' ? base : base.filter(i => i.subject === state.subject);
    const topics = Array.from(new Set(filteredBySubject.map(i => i.topic))).sort();

    els.topicSelect.innerHTML = '<option value="all">All</option>';
    topics.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t;
      opt.textContent = capitalize(t);
      els.topicSelect.appendChild(opt);
    });
  }

  function render() {
    const base = state.view === 'materials' ? MATERIALS : WORKSHEETS;
    if (!base) return;

    const items = base.filter(item => {
      const matchesSubject = state.subject === 'all' || item.subject === state.subject;
      const matchesTopic = state.topic === 'all' || item.topic === state.topic;
      const matchesFormat = state.format === 'all' || item.format === state.format;
      const matchesSearch = !state.search ||
        item.title.toLowerCase().includes(state.search) ||
        item.description.toLowerCase().includes(state.search);

      return matchesSubject && matchesTopic && matchesFormat && matchesSearch;
    });

    els.cardsContainer.innerHTML = items.map(toCardHTML).join('');
  }

  function toCardHTML(item) {
 //   const icon = item.format === 'doc' ? 'doc.svg' : 'pdf.svg';
    return `
      <article class="card" role="article">
        <div class="card-header">
          <img src="./pdf.svg"  alt="" aria-hidden="true" width="24" height="24">
          <h3 class="card-title">${escapeHTML(item.title)}</h3>
        </div>
        <div class="card-meta">
          <span class="badge">${capitalize(item.subject)}</span>
          <span>Topic: ${capitalize(item.topic)}</span>
          <span>Format: ${item.format.toUpperCase()}</span>
          <span>Size: ${item.size || '—'}</span>
        </div>
        <p>${escapeHTML(item.description)}</p>
        <div class="card-actions">
          <a class="download-btn" href="${item.url}" download>
            <img src="./download.svg" alt="" aria-hidden="true" width="18" height="18">
            Download
          </a>
        </div>
      </article>
    `;
  }

  function capitalize(str) {
    return str ? str.replace(/\b\w/g, c => c.toUpperCase()) : '';
  }

  function escapeHTML(str) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return String(str).replace(/[&<>"']/g, m => map[m]);
  }
});
