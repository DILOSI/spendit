/**
 * Spendit - Personal Expense Tracker
 * Local-only, responsive expense tracking web application.
 */

(function () {
  'use strict';

  // --- Constants & Storage Key ---
  const STORAGE_KEY = 'spendit_transactions_v1';

  // Category Icon Mapping
  const CATEGORY_ICONS = {
    Food: '🍔',
    Transport: '🚗',
    Shopping: '🛍️',
    Bills: '📄',
    Entertainment: '🎬',
    Health: '💊',
    Salary: '💰',
    Other: '📦'
  };

  // Category Color Palette for progress bars
  const CATEGORY_COLORS = {
    Food: '#f97316',
    Transport: '#0284c7',
    Shopping: '#ec4899',
    Bills: '#eab308',
    Entertainment: '#8b5cf6',
    Health: '#10b981',
    Salary: '#059669',
    Other: '#64748b'
  };

  // --- State ---
  let transactions = [];
  let deleteTargetId = null;

  // --- DOM Elements ---
  const form = document.getElementById('transaction-form');
  const editIdInput = document.getElementById('edit-id');
  const nameInput = document.getElementById('tx-name');
  const amountInput = document.getElementById('tx-amount');
  const categorySelect = document.getElementById('tx-category');
  const dateInput = document.getElementById('tx-date');
  const submitBtn = document.getElementById('submit-btn');
  const cancelEditBtn = document.getElementById('cancel-edit-btn');
  const formHeading = document.getElementById('form-heading');
  const formSubheading = document.getElementById('form-subheading');

  const nameError = document.getElementById('name-error');
  const amountError = document.getElementById('amount-error');
  const dateError = document.getElementById('date-error');

  const totalTxCountEl = document.getElementById('total-tx-count');
  const statBalanceEl = document.getElementById('stat-balance');
  const statIncomeEl = document.getElementById('stat-income');
  const statExpenseEl = document.getElementById('stat-expense');

  const monthlyFilterInput = document.getElementById('monthly-filter-input');
  const monthlyTotalExpenseEl = document.getElementById('monthly-total-expense');
  const monthlyTotalIncomeEl = document.getElementById('monthly-total-income');
  const monthlyNetSavingsEl = document.getElementById('monthly-net-savings');
  const monthlyCategoryBreakdownEl = document.getElementById('monthly-category-breakdown');

  const searchInput = document.getElementById('search-input');
  const filterTypeSelect = document.getElementById('filter-type');
  const filterCategorySelect = document.getElementById('filter-category');
  const resetFiltersBtn = document.getElementById('reset-filters-btn');
  const filterInfoBar = document.getElementById('filter-info-bar');
  const filterCountText = document.getElementById('filter-count-text');
  const transactionsContainer = document.getElementById('transactions-container');

  const confirmModal = document.getElementById('confirm-modal');
  const modalMessage = document.getElementById('modal-message');
  const modalCancelBtn = document.getElementById('modal-cancel-btn');
  const modalConfirmBtn = document.getElementById('modal-confirm-btn');

  // --- Helper Functions ---

  function getTodayString() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  function getCurrentMonthString() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    return `${yyyy}-${mm}`;
  }

  function formatCurrency(amount) {
    const num = Math.abs(Number(amount) || 0);
    return num.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function formatDate(dateString) {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-').map(Number);
    if (!year || !month || !day) return dateString;
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  function escapeHTML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // --- Local Storage Management ---

  function loadTransactions() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        transactions = JSON.parse(stored);
        if (!Array.isArray(transactions)) {
          transactions = [];
        }
      } else {
        transactions = [];
      }
    } catch (e) {
      console.error('Failed to load transactions from localStorage:', e);
      transactions = [];
    }
  }

  function saveTransactions() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    } catch (e) {
      console.error('Failed to save transactions to localStorage:', e);
      alert('Could not save data. Local storage might be full or disabled.');
    }
  }

  // --- Calculation Functions ---

  function calculateTotals(items) {
    let income = 0;
    let expense = 0;

    items.forEach(tx => {
      const amt = Number(tx.amount) || 0;
      if (tx.type === 'Income') {
        income += amt;
      } else {
        expense += amt;
      }
    });

    return {
      income,
      expense,
      balance: income - expense
    };
  }

  function updateOverviewStats() {
    const { income, expense, balance } = calculateTotals(transactions);

    totalTxCountEl.textContent = transactions.length;

    statBalanceEl.textContent = (balance < 0 ? '-' : '') + formatCurrency(balance);
    if (balance < 0) {
      statBalanceEl.className = 'stat-value text-expense';
    } else {
      statBalanceEl.className = 'stat-value';
    }

    statIncomeEl.textContent = '+' + formatCurrency(income);
    statExpenseEl.textContent = '-' + formatCurrency(expense);
  }

  function updateMonthlySummary() {
    const selectedMonth = monthlyFilterInput.value || getCurrentMonthString();
    
    // Filter transactions belonging to this YYYY-MM
    const monthTx = transactions.filter(tx => tx.date && tx.date.startsWith(selectedMonth));
    const { income, expense, balance } = calculateTotals(monthTx);

    monthlyTotalExpenseEl.textContent = '-' + formatCurrency(expense);
    monthlyTotalIncomeEl.textContent = '+' + formatCurrency(income);
    
    if (balance > 0) {
      monthlyNetSavingsEl.textContent = '+' + formatCurrency(balance);
      monthlyNetSavingsEl.className = 'metric-amount text-income';
    } else if (balance < 0) {
      monthlyNetSavingsEl.textContent = '-' + formatCurrency(Math.abs(balance));
      monthlyNetSavingsEl.className = 'metric-amount text-expense';
    } else {
      monthlyNetSavingsEl.textContent = '$0.00';
      monthlyNetSavingsEl.className = 'metric-amount';
    }

    // Category breakdown for expenses this month
    const categoryTotals = {};
    let totalExpenseThisMonth = 0;

    monthTx.forEach(tx => {
      if (tx.type === 'Expense') {
        const amt = Number(tx.amount) || 0;
        categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + amt;
        totalExpenseThisMonth += amt;
      }
    });

    const categoryEntries = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

    if (categoryEntries.length === 0) {
      monthlyCategoryBreakdownEl.innerHTML = `
        <div class="category-empty-hint">
          No expenses recorded for ${formatMonthLabel(selectedMonth)}.
        </div>
      `;
      return;
    }

    let breakdownHtml = '';
    categoryEntries.forEach(([cat, amount]) => {
      const percentage = totalExpenseThisMonth > 0 
        ? Math.round((amount / totalExpenseThisMonth) * 100) 
        : 0;
      const icon = CATEGORY_ICONS[cat] || '🏷️';
      const color = CATEGORY_COLORS[cat] || '#6366f1';

      breakdownHtml += `
        <div class="category-bar-item">
          <div class="category-bar-info">
            <span class="category-name-badge">
              <span>${icon}</span>
              <span>${escapeHTML(cat)}</span>
            </span>
            <span class="category-amount-details">
              <strong>${formatCurrency(amount)}</strong> (${percentage}%)
            </span>
          </div>
          <div class="category-bar-track">
            <div 
              class="category-bar-fill" 
              style="width: ${percentage}%; background-color: ${color};"
              role="progressbar"
              aria-valuenow="${percentage}"
              aria-valuemin="0"
              aria-valuemax="100"
            ></div>
          </div>
        </div>
      `;
    });

    monthlyCategoryBreakdownEl.innerHTML = breakdownHtml;
  }

  function formatMonthLabel(yyyyMm) {
    if (!yyyyMm) return '';
    const [year, month] = yyyyMm.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  // --- Filter and Search ---

  function getFilteredTransactions() {
    const searchTerm = (searchInput.value || '').trim().toLowerCase();
    const typeFilter = filterTypeSelect.value;
    const categoryFilter = filterCategorySelect.value;

    return transactions
      .filter(tx => {
        // Search filter
        if (searchTerm && !tx.name.toLowerCase().includes(searchTerm)) {
          return false;
        }
        // Type filter
        if (typeFilter !== 'ALL' && tx.type !== typeFilter) {
          return false;
        }
        // Category filter
        if (categoryFilter !== 'ALL' && tx.category !== categoryFilter) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        // Sort descending by date, then by creation
        if (b.date !== a.date) {
          return b.date.localeCompare(a.date);
        }
        return (b.createdAt || 0) - (a.createdAt || 0);
      });
  }

  function renderTransactionList() {
    const filtered = getFilteredTransactions();
    const hasFiltersActive = (
      (searchInput.value || '').trim() !== '' ||
      filterTypeSelect.value !== 'ALL' ||
      filterCategorySelect.value !== 'ALL'
    );

    // Show or hide reset filters button
    if (hasFiltersActive) {
      resetFiltersBtn.classList.remove('hidden');
      filterInfoBar.classList.remove('hidden');
      filterCountText.textContent = `Showing ${filtered.length} of ${transactions.length} transactions`;
    } else {
      resetFiltersBtn.classList.add('hidden');
      filterInfoBar.classList.add('hidden');
    }

    // Empty states
    if (transactions.length === 0) {
      transactionsContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">✨</div>
          <div class="empty-title">No transactions yet!</div>
          <p class="empty-desc">
            Start tracking your personal finances by adding your first income or expense above.
          </p>
        </div>
      `;
      return;
    }

    if (filtered.length === 0) {
      transactionsContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <div class="empty-title">No matching transactions</div>
          <p class="empty-desc">
            No transactions matched your current search or filter criteria.
          </p>
          <button type="button" class="btn btn-secondary" onclick="window.SpenditApp.resetFilters()">
            Clear Filters
          </button>
        </div>
      `;
      return;
    }

    // Render list items
    let html = '';
    filtered.forEach(tx => {
      const isIncome = tx.type === 'Income';
      const icon = CATEGORY_ICONS[tx.category] || '🏷️';
      const sign = isIncome ? '+' : '-';
      const amountClass = isIncome ? 'text-income' : 'text-expense';
      const itemClass = isIncome ? 'tx-income' : 'tx-expense';
      const tagClass = isIncome ? 'tag-income' : 'tag-expense';

      html += `
        <article class="tx-item ${itemClass}" data-id="${tx.id}">
          <div class="tx-left">
            <div class="tx-icon-badge" aria-hidden="true">${icon}</div>
            <div class="tx-info">
              <span class="tx-title" title="${escapeHTML(tx.name)}">${escapeHTML(tx.name)}</span>
              <div class="tx-meta">
                <span class="tx-category-tag">${escapeHTML(tx.category)}</span>
                <span class="tx-type-tag ${tagClass}">${escapeHTML(tx.type)}</span>
                <span class="tx-date">&bull; ${formatDate(tx.date)}</span>
              </div>
            </div>
          </div>
          
          <div class="tx-right">
            <div class="tx-amount ${amountClass}">
              ${sign}${formatCurrency(tx.amount)}
            </div>
            <div class="tx-actions">
              <button 
                type="button" 
                class="action-btn btn-edit" 
                aria-label="Edit transaction ${escapeHTML(tx.name)}" 
                title="Edit transaction"
                data-action="edit" 
                data-id="${tx.id}">
                ✏️
              </button>
              <button 
                type="button" 
                class="action-btn btn-delete" 
                aria-label="Delete transaction ${escapeHTML(tx.name)}" 
                title="Delete transaction"
                data-action="delete" 
                data-id="${tx.id}">
                🗑️
              </button>
            </div>
          </div>
        </article>
      `;
    });

    transactionsContainer.innerHTML = html;
  }

  function renderAll() {
    updateOverviewStats();
    updateMonthlySummary();
    renderTransactionList();
  }

  // --- Form & Edit Logic ---

  function getSelectedType() {
    const checked = form.querySelector('input[name="tx-type"]:checked');
    return checked ? checked.value : 'Expense';
  }

  function setSelectedType(type) {
    const radio = form.querySelector(`input[name="tx-type"][value="${type}"]`);
    if (radio) radio.checked = true;
  }

  function clearValidationErrors() {
    nameError.classList.remove('visible');
    amountError.classList.remove('visible');
    dateError.classList.remove('visible');
  }

  function resetForm() {
    form.reset();
    editIdInput.value = '';
    setSelectedType('Expense');
    categorySelect.value = 'Food';
    dateInput.value = getTodayString();
    submitBtn.textContent = 'Add Transaction';
    cancelEditBtn.classList.add('hidden');
    formHeading.textContent = 'Add Transaction';
    formSubheading.textContent = 'Record a new income or expense';
    clearValidationErrors();
  }

  function startEdit(id) {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;

    editIdInput.value = tx.id;
    nameInput.value = tx.name;
    amountInput.value = tx.amount;
    setSelectedType(tx.type);
    categorySelect.value = tx.category;
    dateInput.value = tx.date;

    submitBtn.textContent = 'Save Changes';
    cancelEditBtn.classList.remove('hidden');
    formHeading.textContent = 'Edit Transaction';
    formSubheading.textContent = `Updating: ${tx.name}`;

    clearValidationErrors();
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    nameInput.focus();
  }

  function handleFormSubmit(e) {
    e.preventDefault();
    clearValidationErrors();

    const name = nameInput.value.trim();
    const amountVal = parseFloat(amountInput.value);
    const type = getSelectedType();
    const category = categorySelect.value;
    const date = dateInput.value;
    const editId = editIdInput.value;

    let hasError = false;

    if (!name) {
      nameError.classList.add('visible');
      hasError = true;
    }

    if (isNaN(amountVal) || amountVal <= 0) {
      amountError.classList.add('visible');
      hasError = true;
    }

    if (!date) {
      dateError.classList.add('visible');
      hasError = true;
    }

    if (hasError) return;

    if (editId) {
      // Edit existing transaction
      const idx = transactions.findIndex(t => t.id === editId);
      if (idx !== -1) {
        transactions[idx] = {
          ...transactions[idx],
          name,
          amount: amountVal,
          type,
          category,
          date,
          updatedAt: Date.now()
        };
      }
    } else {
      // Create new transaction
      const newTx = {
        id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        name,
        amount: amountVal,
        type,
        category,
        date,
        createdAt: Date.now()
      };
      transactions.unshift(newTx);
    }

    saveTransactions();
    resetForm();
    renderAll();
  }

  // --- Deletion Flow with Confirmation ---

  function requestDelete(id) {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;

    deleteTargetId = id;
    modalMessage.textContent = `Are you sure you want to delete "${tx.name}" (${formatCurrency(tx.amount)})? This cannot be undone.`;
    confirmModal.classList.remove('hidden');
    modalConfirmBtn.focus();
  }

  function closeDeleteModal() {
    deleteTargetId = null;
    confirmModal.classList.add('hidden');
  }

  function confirmDelete() {
    if (!deleteTargetId) return;

    transactions = transactions.filter(t => t.id !== deleteTargetId);
    saveTransactions();

    // If currently editing this deleted transaction, reset form
    if (editIdInput.value === deleteTargetId) {
      resetForm();
    }

    closeDeleteModal();
    renderAll();
  }

  // --- Reset All Filters ---
  function resetFilters() {
    searchInput.value = '';
    filterTypeSelect.value = 'ALL';
    filterCategorySelect.value = 'ALL';
    renderTransactionList();
  }

  // --- Event Listeners Initialization ---

  function initEventListeners() {
    // Form submit
    form.addEventListener('submit', handleFormSubmit);

    // Cancel edit
    cancelEditBtn.addEventListener('click', resetForm);

    // Input clears error on typing
    nameInput.addEventListener('input', () => nameError.classList.remove('visible'));
    amountInput.addEventListener('input', () => amountError.classList.remove('visible'));
    dateInput.addEventListener('change', () => dateError.classList.remove('visible'));

    // Search and filter triggers
    searchInput.addEventListener('input', renderTransactionList);
    filterTypeSelect.addEventListener('change', renderTransactionList);
    filterCategorySelect.addEventListener('change', renderTransactionList);
    resetFiltersBtn.addEventListener('click', resetFilters);

    // Month picker change
    monthlyFilterInput.addEventListener('change', updateMonthlySummary);

    // Transaction list action delegation (Edit & Delete)
    transactionsContainer.addEventListener('click', e => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;

      const action = btn.dataset.action;
      const id = btn.dataset.id;

      if (action === 'edit') {
        startEdit(id);
      } else if (action === 'delete') {
        requestDelete(id);
      }
    });

    // Delete modal buttons
    modalCancelBtn.addEventListener('click', closeDeleteModal);
    modalConfirmBtn.addEventListener('click', confirmDelete);

    // Close modal on backdrop click or ESC key
    confirmModal.addEventListener('click', e => {
      if (e.target === confirmModal) {
        closeDeleteModal();
      }
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !confirmModal.classList.contains('hidden')) {
        closeDeleteModal();
      }
    });
  }

  // --- App Initialization ---

  function init() {
    // Set default date inputs
    dateInput.value = getTodayString();
    monthlyFilterInput.value = getCurrentMonthString();

    loadTransactions();
    initEventListeners();
    renderAll();
  }

  // Expose resetFilters for inline onclick empty state button
  window.SpenditApp = {
    resetFilters
  };

  // Run on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

