import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';

const currency = value =>
  Number(value || 0).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD'
  });

const clean = value => String(value ?? '').replace(/\s+/g, ' ').trim();

const dateTime = value =>
  value
    ? new Date(value).toLocaleString([], {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })
    : '-';

const safeFilename = value =>
  clean(value || 'employee')
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, '-');

const signedVariance = value => {
  const amount = Number(value || 0);
  if (amount > 0) return `+${currency(amount)}`;
  if (amount < 0) return `-${currency(Math.abs(amount))}`;
  return currency(0);
};

const shortOverLabel = value => {
  const amount = Number(value || 0);
  if (amount > 0) return 'Over';
  if (amount < 0) return 'Short';
  return 'Short / Over';
};

const typeLabel = item => {
  const type = item?.type;

  if (type === 'OPENING' || type === 'OPENING_TRANSFER') return 'Opening Bank';
  if (type === 'TRANSFER_IN') return 'Opening Bank';
  if (type === 'TRANSFER_OUT') return 'Transfer to Employee';
  if (type === 'CASH_RECEIVED') {
    return item?.creditTypeName ? `Add Bank - ${item.creditTypeName}` : 'Add Bank';
  }
  if (type === 'EXPENSE') return item?.expenseTypeName || 'Expense';
  if (type === 'MATCH_POINT') return 'Match Point';
  if (type === 'EXTRA_MATCH') return 'Extra Match';
  if (type === 'RAFFLE') return 'Raffle';
  if (type === 'TICKET_OUT') return 'Ticket Out';
  if (type === 'OWNER_WITHDRAWAL') return 'Owner / Admin Withdrawal';

  return item?.expenseTypeName || item?.creditTypeName || clean(type) || 'Transaction';
};

const transactionNote = item => {
  const parts = [];
  if (item?.takenBy) parts.push(`Taken by ${item.takenBy}`);
  if (item?.notes) parts.push(clean(item.notes));
  return parts.join(' - ');
};

const addPageNumbers = doc => {
  const pages = doc.getNumberOfPages();

  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    const width = doc.internal.pageSize.getWidth();
    const height = doc.internal.pageSize.getHeight();

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(140);
    doc.text(`Page ${page} of ${pages}`, width - 12, height - 7, { align: 'right' });
  }
};

const ensureRoom = (doc, y, needed = 24) => {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y + needed <= pageHeight - 15) return y;

  doc.addPage('a4', 'portrait');
  return 18;
};

export function exportShiftReportPdf({
  session,
  duration,
  summary = {},
  credits = [],
  expenses = [],
  closing = null
}) {
  if (!session?.id) throw new Error('Shift session is required to export the PDF.');

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 12;
  const contentWidth = pageWidth - (margin * 2);

  // Header.
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.setTextColor(30);
  doc.text('Employee Shift Report', margin, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(95);
  doc.text(`Employee: ${clean(session.employeeName) || 'Employee'}`, margin, 22);
  doc.text(`Session: #${session.id}`, margin, 28);
  doc.text(`Clock In: ${dateTime(session.clockIn)}`, margin, 34);
  doc.text(`Clock Out: ${session.clockOut ? dateTime(session.clockOut) : 'In Progress'}`, margin, 40);
  doc.text(`Duration: ${clean(duration) || '-'}`, margin, 46);

  const shortOver = Number(closing?.variance || 0);

  // Four summary cards in a 2 x 2 grid so they remain readable on A4 portrait.
  const summaryY = 54;
  const gapX = 5;
  const gapY = 5;
  const cardWidth = (contentWidth - gapX) / 2;
  const cardHeight = 18;

  const summaryItems = [
    ['Total Credit', currency(summary.openingBank), null],
    ['Total Expense', `-${currency(Math.abs(Number(summary.expenses || 0)))}`, null],
    ['Total Balance', currency(summary.balance), null],
    [shortOverLabel(shortOver), signedVariance(shortOver), shortOver]
  ];

  summaryItems.forEach(([label, value, variance], index) => {
    const row = Math.floor(index / 2);
    const col = index % 2;
    const x = margin + col * (cardWidth + gapX);
    const y = summaryY + row * (cardHeight + gapY);

    doc.setDrawColor(220);
    doc.setFillColor(248, 249, 251);
    doc.roundedRect(x, y, cardWidth, cardHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(label, x + 4, y + 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);

    if (variance > 0) doc.setTextColor(40, 135, 90);
    else if (variance < 0) doc.setTextColor(195, 70, 70);
    else doc.setTextColor(30);

    doc.text(value, x + 4, y + 14);
  });

  const breakdownY =
    summaryY + (cardHeight * 2) + gapY + 7;

  autoTable(doc, {
    startY: breakdownY,
    margin: { left: margin, right: margin },
    tableWidth: contentWidth,
    theme: 'grid',
    head: [['Match Point', 'Extra Match', 'Raffle', 'Ticket Out', 'Bonus']],
    body: [[
      `-${currency(Math.abs(Number(summary.matchPointExpense || 0)))}`,
      `-${currency(Math.abs(Number(summary.extraMatchExpense || 0)))}`,
      `-${currency(Math.abs(Number(summary.raffleExpense || 0)))}`,
      `-${currency(Math.abs(Number(summary.ticketOutExpense || 0)))}`,
      `-${currency(Math.abs(Number(summary.bonusExpense || 0)))}`
    ]],
    styles: {
      fontSize: 7.5,
      cellPadding: 2.5,
      halign: 'center',
      overflow: 'linebreak'
    },
    headStyles: {
      fillColor: [245, 246, 248],
      textColor: [70, 70, 70],
      fontStyle: 'bold'
    }
  });

  const creditRows = credits.map(item => [
    typeLabel(item),
    dateTime(item.eventAt || item.createdAt),
    transactionNote(item),
    `+${currency(Math.abs(Number(item.amount || 0)))}`
  ]);

  const expenseRows = expenses.map(item => [
    typeLabel(item),
    dateTime(item.eventAt || item.createdAt),
    transactionNote(item),
    `-${currency(Math.abs(Number(item.amount || 0)))}`
  ]);

  let y = ensureRoom(doc, (doc.lastAutoTable?.finalY || 105) + 9, 34);

  // Credits - full width.
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30);
  doc.text('Credits', margin, y);

  autoTable(doc, {
    startY: y + 3,
    margin: { left: margin, right: margin, bottom: 15 },
    tableWidth: contentWidth,
    theme: 'grid',
    head: [['Type', 'Date / Time', 'Details', 'Amount']],
    body: creditRows.length ? creditRows : [['No credits yet', '', '', '']],
    styles: {
      fontSize: 8,
      cellPadding: 2.2,
      overflow: 'linebreak',
      valign: 'middle'
    },
    headStyles: {
      fillColor: [230, 247, 243],
      textColor: [36, 91, 78],
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 39 },
      1: { cellWidth: 42 },
      2: { cellWidth: 75 },
      3: { cellWidth: 30, halign: 'right', fontStyle: 'bold' }
    },
    showHead: 'everyPage',
    pageBreak: 'auto',
    rowPageBreak: 'avoid'
  });

  y = ensureRoom(doc, (doc.lastAutoTable?.finalY || 20) + 10, 34);

  // Expenses - full width.
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30);
  doc.text('Expenses', margin, y);

  autoTable(doc, {
    startY: y + 3,
    margin: { left: margin, right: margin, bottom: 15 },
    tableWidth: contentWidth,
    theme: 'grid',
    head: [['Type', 'Date / Time', 'Details', 'Amount']],
    body: expenseRows.length ? expenseRows : [['No expenses yet', '', '', '']],
    styles: {
      fontSize: 8,
      cellPadding: 2.2,
      overflow: 'linebreak',
      valign: 'middle'
    },
    headStyles: {
      fillColor: [253, 236, 239],
      textColor: [122, 48, 63],
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 39 },
      1: { cellWidth: 42 },
      2: { cellWidth: 75 },
      3: { cellWidth: 30, halign: 'right', fontStyle: 'bold' }
    },
    showHead: 'everyPage',
    pageBreak: 'auto',
    rowPageBreak: 'avoid'
  });

  // Reconciliation always follows the ledgers, starting a new page only if required.
  y = ensureRoom(doc, (doc.lastAutoTable?.finalY || 20) + 11, 90);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(30);
  doc.text('Cash Reconciliation', margin, y);

  const reconciliation = [
    ['Total Credit', `+${currency(Math.abs(Number(summary.openingBank || 0)))}`],
    ['Manual Expense', `-${currency(Math.abs(Number(summary.regularExpense || 0)))}`],
    ['Match Point', `-${currency(Math.abs(Number(summary.matchPointExpense || 0)))}`],
    ['Extra Match', `-${currency(Math.abs(Number(summary.extraMatchExpense || 0)))}`],
    ['Raffle', `-${currency(Math.abs(Number(summary.raffleExpense || 0)))}`],
    ['Ticket Out', `-${currency(Math.abs(Number(summary.ticketOutExpense || 0)))}`]
  ];

  if (Number(summary.transferOut || 0)) {
    reconciliation.push([
      'Transfer to Employee',
      `-${currency(Math.abs(Number(summary.transferOut)))}`
    ]);
  }

  if (Number(summary.ownerWithdrawals || 0)) {
    reconciliation.push([
      'Owner / Admin Withdrawal',
      `-${currency(Math.abs(Number(summary.ownerWithdrawals)))}`
    ]);
  }

  reconciliation.push(
    ['Total Expense', `-${currency(Math.abs(Number(summary.expenses || 0)))}`],
    ['Calculated Balance', currency(summary.balance)]
  );

  if (closing) {
    reconciliation.push(
      ['Cash Counted', currency(closing.actualCash)],
      [shortOverLabel(shortOver), signedVariance(shortOver)]
    );
  }

  autoTable(doc, {
    startY: y + 4,
    margin: { left: margin, right: margin, bottom: 15 },
    tableWidth: contentWidth,
    theme: 'grid',
    head: [['Item', 'Amount']],
    body: reconciliation,
    styles: {
      fontSize: 9,
      cellPadding: 3
    },
    headStyles: {
      fillColor: [245, 246, 248],
      textColor: [70, 70, 70],
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 130 },
      1: { cellWidth: 56, halign: 'right', fontStyle: 'bold' }
    },
    showHead: 'everyPage',
    pageBreak: 'auto',
    rowPageBreak: 'avoid'
  });

  addPageNumbers(doc);

  doc.save(
    `${safeFilename(session.employeeName)}-session-${session.id}-shift-report.pdf`
  );
}
