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

const typeLabel = item => {
  const type = item?.type;

  if (type === 'OPENING' || type === 'OPENING_TRANSFER') return 'Opening Bank';
  if (type === 'TRANSFER_IN') return 'Transfer In';
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

const safeFilename = value =>
  clean(value || 'employee')
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, '-');

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

export function exportEmployeeTransactionPdf({
  employeeName,
  session,
  duration,
  summary = {},
  credits = [],
  expenses = []
}) {
  if (!session?.id) throw new Error('No active employee session to export.');

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 12;
  const contentWidth = pageWidth - (margin * 2);

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.setTextColor(30);
  doc.text('Employee Session Transaction Report', margin, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(95);
  doc.text(`Employee: ${clean(employeeName) || 'Employee'}`, margin, 22);
  doc.text(`Session: #${session.id}`, margin, 28);
  doc.text(`Started: ${dateTime(session.clockIn)}`, margin, 34);
  doc.text(`Duration: ${clean(duration) || '-'}`, margin, 40);

  // Main summary: three equal cards across A4 portrait.
  const summaryY = 48;
  const gap = 4;
  const cardWidth = (contentWidth - gap * 2) / 3;
  const cardHeight = 19;

  const summaryItems = [
    ['Total Credit', currency(summary.openingBank)],
    ['Total Expense', `-${currency(Math.abs(Number(summary.expenses || 0)))}`],
    ['Total Balance', currency(summary.balance)]
  ];

  summaryItems.forEach(([label, value], index) => {
    const x = margin + index * (cardWidth + gap);

    doc.setDrawColor(220);
    doc.setFillColor(248, 249, 251);
    doc.roundedRect(x, summaryY, cardWidth, cardHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(label, x + 4, summaryY + 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(30);
    doc.text(value, x + 4, summaryY + 14);
  });

  // Expense breakdown.
  autoTable(doc, {
    startY: summaryY + cardHeight + 6,
    margin: { left: margin, right: margin },
    tableWidth: contentWidth,
    theme: 'grid',
    head: [['Match Point', 'Extra Match', 'Raffle', 'Ticket Out', 'Bonus', 'Lucky Bird']],
    body: [[
      `-${currency(Math.abs(Number(summary.matchPointExpense || 0)))}`,
      `-${currency(Math.abs(Number(summary.extraMatchExpense || 0)))}`,
      `-${currency(Math.abs(Number(summary.raffleExpense || 0)))}`,
      `-${currency(Math.abs(Number(summary.ticketOutExpense || 0)))}`,
      `-${currency(Math.abs(Number(summary.bonusExpense || 0)))}`,
      `-${currency(Math.abs(Number(summary.luckyBirdExpense || 0)))}`
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
    dateTime(item.createdAt || item.eventAt),
    transactionNote(item),
    `+${currency(Math.abs(Number(item.amount || 0)))}`
  ]);

  const expenseRows = expenses.map(item => [
    typeLabel(item),
    dateTime(item.createdAt || item.eventAt),
    transactionNote(item),
    `-${currency(Math.abs(Number(item.amount || 0)))}`
  ]);

  let y = ensureRoom(doc, (doc.lastAutoTable?.finalY || 86) + 9, 34);

  // Credits - full width, vertically stacked.
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

  // Expenses - full width, after Credits.
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

  addPageNumbers(doc);

  doc.save(
    `${safeFilename(employeeName)}-session-${session.id}-transactions.pdf`
  );
}
