(() => {
  if (window.__CHECKBOX_EXPORTER__) return;
  window.__CHECKBOX_EXPORTER__ = true;

  // Create export bubble
  const exportBubble = document.createElement("div");
  exportBubble.textContent = "⬇";
  exportBubble.style.cssText = `
    position:fixed;
    bottom:20px;
    right:20px;
    width:56px;
    height:56px;
    border-radius:50%;
    background:linear-gradient(135deg,#2563eb,#1e40af);
    color:white;
    font-size:26px;
    display:flex;
    align-items:center;
    justify-content:center;
    cursor:pointer;
    z-index:2147483647;
    box-shadow:0 20px 40px rgba(0,0,0,.4);
  `;
  document.body.appendChild(exportBubble);

  // Get closest row container
  function getRowContainer(el) {
    return el.closest("tr, li, article, section, div.row, div.list-item") || el.parentElement;
  }

  // Build table from rows
  function buildTable(rows) {
    const parsed = rows.map(row => {
      const cells = [...row.children]
        .filter(el => el.innerText && el.offsetParent)
        .map(el => {
          const r = el.getBoundingClientRect();
          return { text: el.innerText.trim(), x: Math.round(r.left) };
        })
        .sort((a, b) => a.x - b.x);

      const grouped = [];
      const gap = 25;
      cells.forEach(c => {
        const last = grouped[grouped.length - 1];
        if (!last || Math.abs(last.x - c.x) > gap) grouped.push({ x: c.x, text: c.text });
        else last.text += " " + c.text;
      });

      return grouped.map(g => g.text);
    });

    const max = Math.max(...parsed.map(r => r.length));
    parsed.forEach(r => { while (r.length < max) r.push(""); });

    const headerCandidate = parsed[0];
    const dataRows = parsed.slice(1);

    const isHeader = headerCandidate.every(v => v.length < 40 && !/\d{3,}/.test(v));
    const header = isHeader
      ? headerCandidate
      : Array.from({ length: max }, (_, i) => `Column ${i + 1}`);

    return isHeader ? [header, ...dataRows] : [header, ...parsed];
  }

  // Export CSV
  function exportCSV(rows) {
    const csv = rows.map(r =>
      r.map(v => `"${v.replace(/"/g,'""')}"`).join(",")
    ).join("\n");

    const blob = new Blob(["\ufeff" + csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "checkbox_export.csv";
    a.click();
  }

  // On click: find all selected checkboxes and export
  exportBubble.onclick = () => {
    const checkboxes = [...document.querySelectorAll("input[type='checkbox']:checked")];
    const ariaCheckboxes = [...document.querySelectorAll("[role='checkbox'][aria-checked='true']")];

    const allSelected = [...checkboxes, ...ariaCheckboxes];

    if (!allSelected.length) {
      alert("No checkboxes selected on this page.");
      return;
    }

    const rows = allSelected.map(cb => getRowContainer(cb)).filter(Boolean);
    if (!rows.length) {
      alert("Could not detect row containers for selected checkboxes.");
      return;
    }

    const table = buildTable(rows);
    exportCSV(table);
  };
})();
