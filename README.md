# Spendit - Personal Expense Tracker

A simple, responsive personal expense tracker built with pure HTML, CSS, and vanilla JavaScript. All data is persisted locally in the browser using `localStorage`.

## Features

- **Transaction Management**:
  - Add, edit, and delete transactions.
  - Confirmation prompt before deletion.
  - Fields: Transaction Name, Amount, Type (Income or Expense), Category, and Date.
- **Categories**:
  - Food, Transport, Shopping, Bills, Entertainment, Health, Salary, Other.
- **Financial Overview**:
  - Available Balance, Total Income, and Total Expenses with clear color indicators.
  - Total transaction counter in header.
- **Monthly Summary**:
  - Monthly spending and income breakdown with category progress bars.
  - Filter by month.
- **Search & Filter**:
  - Search by transaction name.
  - Filter by Type (Income/Expense) and Category.
  - One-click filter reset.
- **Mobile Friendly & Clean UI**:
  - Fully responsive on mobile, tablet, and desktop screens.
  - Friendly empty states when no transactions are recorded.

## Getting Started

No build tools, server, or dependencies required. Simply open `index.html` in any modern web browser.

```bash
# Clone the repository
git clone <repo-url>

# Open in browser
open index.html # On macOS
start index.html # On Windows
```

## Tech Stack

- **HTML5**: Semantic elements and accessible modal dialogs.
- **CSS3**: Modern CSS variables, flexbox, and grid layouts.
- **JavaScript (ES6+)**: Pure vanilla JS with `localStorage` persistence.
