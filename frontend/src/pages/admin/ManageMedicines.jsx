import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import BrandLogo from '../../components/BrandLogo';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Eye,
  FileDown,
  Filter,
  MoreVertical,
  Package,
  Pill,
  Plus,
  Search,
  ShieldAlert,
  ShoppingCart,
  Trash2,
} from 'lucide-react';

const formatCurrency = (amount) => `LKR ${Number(amount || 0).toFixed(2)}`;
const PAGE_SIZE = 5;
const DISCOUNTS_STORAGE_KEY = 'admin_discounts';
const escapeCsvValue = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
const escapePdfText = (value) =>
  String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
const formatPdfDate = (value) => {
  if (!value) {
    return '-';
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return '-';
  }

  return parsedDate.toLocaleDateString();
};

const getToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const getMedicineGroupKey = (medicine) => [
  medicine.name || '',
  medicine.category || '',
  medicine.subCategory || ''
].join('::');

const getExpiryStatus = (expiryDate) => {
  if (!expiryDate) {
    return 'No expiry';
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);

  if (expiry < today) {
    return 'Expired';
  }

  const thirtyDaysFromNow = new Date(today);
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  if (expiry <= thirtyDaysFromNow) {
    return 'Near expiry';
  }

  return 'Valid';
};

const getStockStatus = (medicine) => {
  const quantity = Number(medicine.stockQuantity ?? 0);

  if (!medicine.isActive || quantity <= 0) {
    return 'Out of stock';
  }

  if (quantity <= 10) {
    return 'Low stock';
  }

  return 'In stock';
};

const getStatusClasses = (status) => {
  switch (status) {
    case 'In stock':
    case 'Active':
    case 'Valid':
      return 'bg-emerald-50 text-emerald-700';
    case 'Low stock':
    case 'Near expiry':
      return 'bg-amber-50 text-amber-700';
    case 'Out of stock':
    case 'Expired':
    case 'Inactive':
      return 'bg-rose-50 text-rose-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
};

const summarizeMedicineGroups = (batches) => {
  const today = getToday();
  const grouped = new Map();

  batches.forEach((batch) => {
    const key = getMedicineGroupKey(batch);
    const expiryDate = batch.expiryDate ? new Date(batch.expiryDate) : null;
    const isValidBatch = expiryDate && !Number.isNaN(expiryDate.getTime()) && expiryDate >= today;
    const existing = grouped.get(key);

    if (!existing) {
      grouped.set(key, {
        ...batch,
        batchIds: [batch._id],
        batches: [{
          _id: batch._id,
          batchNo: batch.batchNo || 'No batch no',
          expiryDate: batch.expiryDate,
          stockQuantity: Number(batch.stockQuantity || 0)
        }],
        stockQuantity: isValidBatch ? Number(batch.stockQuantity || 0) : 0,
        expiryDate: isValidBatch ? batch.expiryDate : null,
        batchCount: 1
      });
      return;
    }

    existing.batchIds.push(batch._id);
    existing.batchCount += 1;
    existing.batches.push({
      _id: batch._id,
      batchNo: batch.batchNo || 'No batch no',
      expiryDate: batch.expiryDate,
      stockQuantity: Number(batch.stockQuantity || 0)
    });

    if (isValidBatch) {
      existing.stockQuantity += Number(batch.stockQuantity || 0);

      if (!existing.expiryDate || new Date(batch.expiryDate) < new Date(existing.expiryDate)) {
        existing.expiryDate = batch.expiryDate;
        existing._id = batch._id;
        existing.image = batch.image || existing.image;
        existing.price = batch.price ?? existing.price;
        existing.sellingPrice = batch.sellingPrice ?? existing.sellingPrice;
      }
    }
  });

  return Array.from(grouped.values()).map((medicine) => ({
    ...medicine,
    batches: medicine.batches.sort((left, right) => {
      if (!left.expiryDate) return 1;
      if (!right.expiryDate) return -1;
      return new Date(left.expiryDate) - new Date(right.expiryDate);
    })
  }));
};

const downloadCsv = (rows) => {
  const headers = [
    'Medicine',
    'Category',
    'Manufacturer',
    'Stock',
    'Price',
    'Prescription Required',
    'Expiry Date',
    'Status',
  ];

  const csvRows = rows.map((medicine) => ([
    medicine.name || '',
    medicine.category || '',
    medicine.manufacturer || '',
    medicine.stockQuantity ?? 0,
    medicine.price ?? 0,
    medicine.requiresPrescription ? 'Yes' : 'No',
    medicine.expiryDate ? new Date(medicine.expiryDate).toLocaleDateString() : '',
    medicine.isActive ? 'Active' : 'Inactive',
  ]));

  const csvContent = [headers, ...csvRows]
    .map((row) => row.map((value) => escapeCsvValue(value)).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'medicines.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const downloadMonthlyMedicinePdfReport = (rows, cartSummary = { medicines: [] }) => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const reportLabel = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const medicinesAddedThisMonth = rows.filter((medicine) => {
    if (!medicine.createdAt) {
      return false;
    }

    const createdAt = new Date(medicine.createdAt);
    return !Number.isNaN(createdAt.getTime()) && createdAt >= monthStart && createdAt < nextMonthStart;
  });

  const pageHeight = 792;
  const pageWidth = 612;
  const marginBottom = 48;
  const leftMargin = 40;
  const rightMargin = 40;
  const rowHeight = 18;
  const reportId = `MDR${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const totalQuantity = medicinesAddedThisMonth.reduce((sum, medicine) => sum + Number(medicine.stockQuantity ?? 0), 0);
  const subtotalValue = medicinesAddedThisMonth.reduce(
    (sum, medicine) => sum + (Number(medicine.sellingPrice ?? medicine.price ?? 0) * Number(medicine.stockQuantity ?? 0)),
    0
  );
  const activeMedicinesCount = medicinesAddedThisMonth.filter((medicine) => medicine.isActive !== false).length;
  const lowStockCount = medicinesAddedThisMonth.filter((medicine) => getStockStatus(medicine) === 'Low stock').length;
  const outOfStockCount = medicinesAddedThisMonth.filter((medicine) => getStockStatus(medicine) === 'Out of stock').length;
  const nearExpiryCount = medicinesAddedThisMonth.filter((medicine) => getExpiryStatus(medicine.expiryDate) === 'Near expiry').length;
  const prescriptionRequiredCount = medicinesAddedThisMonth.filter((medicine) => medicine.requiresPrescription === true).length;
  const cartSummaryByMedicine = new Map(
    (cartSummary.medicines || []).map((item) => [String(item.medicineId), item])
  );
  const totalReservedQuantity = Number(cartSummary.totalReservedQuantity || 0);
  const totalCartValue = Number(cartSummary.totalCartValue || 0);
  const topReservedMedicines = [...(cartSummary.medicines || [])]
    .sort((left, right) => Number(right.reservedQuantity || 0) - Number(left.reservedQuantity || 0))
    .slice(0, 3);
  const reportInfoLeft = [
    ['REPORT FOR', reportLabel],
    ['GENERATED BY', 'PharmaCare Admin'],
    ['CREATED AT', now.toLocaleString()],
  ];
  const reportInfoMiddle = [
    ['TOTAL MEDICINES', String(medicinesAddedThisMonth.length)],
    ['ACTIVE ITEMS', String(activeMedicinesCount)],
    ['TOTAL STOCK QTY', String(totalQuantity)],
    ['LOW STOCK', String(lowStockCount)],
  ];
  const reportInfoRight = [
    ['REPORT ID', reportId],
    ['NEAR EXPIRY', String(nearExpiryCount)],
    ['VALUE', formatCurrency(subtotalValue)],
  ];

  const columnDefs = [
    { key: 'index', label: 'QTY', width: 34 },
    { key: 'name', label: 'DESCRIPTION', width: 124 },
    { key: 'category', label: 'CATEGORY', width: 94 },
    { key: 'reserved', label: 'CART', width: 44 },
    { key: 'status', label: 'STATUS', width: 74 },
    { key: 'price', label: 'PRICE', width: 76 },
    { key: 'amount', label: 'AMOUNT', width: 86 },
  ];

  const truncatePdfText = (value, maxLength) => {
    const text = String(value ?? '');
    if (text.length <= maxLength) {
      return text;
    }

    return `${text.slice(0, Math.max(0, maxLength - 3))}...`;
  };

  const tableRows = medicinesAddedThisMonth.map((medicine, index) => ({
    index: String(medicine.stockQuantity ?? 0),
    name: truncatePdfText(medicine.name || '-', 30),
    category: truncatePdfText(medicine.category || '-', 16),
    reserved: String(Number(cartSummaryByMedicine.get(String(medicine._id))?.reservedQuantity || 0)),
    status: truncatePdfText(getStockStatus(medicine), 12),
    price: truncatePdfText(formatCurrency(medicine.sellingPrice ?? medicine.price ?? 0), 14),
    amount: truncatePdfText(
      formatCurrency(Number(medicine.sellingPrice ?? medicine.price ?? 0) * Number(medicine.stockQuantity ?? 0)),
      14
    ),
  }));

  const pages = [];
  let rowPointer = 0;

  while (rowPointer < Math.max(tableRows.length, 1)) {
    const isFirstPage = pages.length === 0;
    const pageRows = [];
    const reservedHeight = isFirstPage ? 390 : 120;
    const availableHeight = pageHeight - marginBottom - reservedHeight;
    const rowsPerPage = Math.max(1, Math.floor(availableHeight / rowHeight) - 2);

    if (tableRows.length === 0 && isFirstPage) {
      pageRows.push({
        index: '',
        name: 'No medicines added this month',
        category: '-',
        reserved: '-',
        price: '-',
        status: '-',
        amount: '-',
      });
      rowPointer = 1;
    } else {
      for (let index = 0; index < rowsPerPage && rowPointer < tableRows.length; index += 1) {
        pageRows.push(tableRows[rowPointer]);
        rowPointer += 1;
      }
    }

    pages.push({ isFirstPage, rows: pageRows });
  }

  const objects = [];
  const addObject = (content) => {
    objects.push(content);
    return objects.length;
  };

  const fontObjectId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const pageObjectIds = [];

  pages.forEach((page, pageIndex) => {
    const contentCommands = [];
    const drawText = (text, x, y, fontSize = 11, color = [0, 0, 0]) => {
      contentCommands.push('BT');
      contentCommands.push(`${color[0]} ${color[1]} ${color[2]} rg`);
      contentCommands.push(`/F1 ${fontSize} Tf`);
      contentCommands.push(`1 0 0 1 ${x} ${y} Tm`);
      contentCommands.push(`(${escapePdfText(text)}) Tj`);
      contentCommands.push('ET');
    };
    const drawLine = (x1, y1, x2, y2) => {
      contentCommands.push(`${x1} ${y1} m`);
      contentCommands.push(`${x2} ${y2} l`);
      contentCommands.push('S');
    };
    const setStrokeColor = (r, g, b) => {
      contentCommands.push(`${r} ${g} ${b} RG`);
    };
    const setFillColor = (r, g, b) => {
      contentCommands.push(`${r} ${g} ${b} rg`);
    };
    const drawFilledRect = (x, y, width, height, fillColor) => {
      setFillColor(fillColor[0], fillColor[1], fillColor[2]);
      contentCommands.push(`${x} ${y} ${width} ${height} re`);
      contentCommands.push('f');
    };
    const drawStrokedRect = (x, y, width, height, strokeColor) => {
      setStrokeColor(strokeColor[0], strokeColor[1], strokeColor[2]);
      contentCommands.push(`${x} ${y} ${width} ${height} re`);
      contentCommands.push('S');
    };
    contentCommands.push('0.2 w');

    setStrokeColor(0.35, 0.63, 0.67);
    drawStrokedRect(18, 108, pageWidth - 36, pageHeight - 126, [0.35, 0.63, 0.67]);

    drawText(formatPdfDate(now), 18, pageHeight - 14, 8);
    drawText(
      `PharmaCare Medicine Report ${reportId}`,
      pageWidth / 2 - 90,
      pageHeight - 14,
      8
    );

    drawFilledRect(leftMargin, pageHeight - 88, 22, 22, [0.13, 0.39, 0.75]);
    setStrokeColor(1, 1, 1);
    contentCommands.push('1.7 w');
    drawLine(leftMargin + 7, pageHeight - 77, leftMargin + 15, pageHeight - 77);
    drawLine(leftMargin + 11, pageHeight - 81, leftMargin + 11, pageHeight - 73);
    drawText('PharmaCare', leftMargin + 32, pageHeight - 82, 15, [0.07, 0.20, 0.37]);
    drawText('PharmaCare Advanced Monthly PDF', leftMargin, pageHeight - 112, 22, [0.07, 0.20, 0.37]);

    drawText(`Report # ${reportId}`, pageWidth - 170, pageHeight - 70, 10, [0.12, 0.12, 0.12]);
    drawText(`Date ${formatPdfDate(now)}`, pageWidth - 170, pageHeight - 86, 10, [0.12, 0.12, 0.12]);
    drawText(`Time ${now.toLocaleTimeString()}`, pageWidth - 170, pageHeight - 102, 10, [0.12, 0.12, 0.12]);

    let currentY = pageHeight - 146;

    if (page.isFirstPage) {
      const drawInfoBlock = (title, items, x, y) => {
        drawText(title, x, y, 8.5, [0.18, 0.18, 0.18]);
        let infoY = y - 18;
        items.forEach(([label, value]) => {
          drawText(label, x, infoY, 7.5, [0.35, 0.35, 0.35]);
          drawText(value, x, infoY - 12, 9.5, [0.07, 0.20, 0.37]);
          infoY -= 30;
        });
      };

      drawInfoBlock('REPORT INFO', reportInfoLeft, leftMargin, currentY);
      drawInfoBlock('SUMMARY', reportInfoMiddle, leftMargin + 185, currentY);
      drawInfoBlock('REFERENCE', reportInfoRight, leftMargin + 360, currentY);

      currentY -= 112;

      drawText('ADVANCED SNAPSHOT', leftMargin, currentY, 8.5, [0.18, 0.18, 0.18]);
      currentY -= 18;

      const snapshotItems = [
        ['Out of Stock', String(outOfStockCount)],
        ['Prescription Only', String(prescriptionRequiredCount)],
        ['Cart Reserved Qty', String(totalReservedQuantity)],
        ['Cart Reserved Value', formatCurrency(totalCartValue)],
      ];

      snapshotItems.forEach(([label, value], index) => {
        const cardX = leftMargin + index * 132;
        drawFilledRect(cardX, currentY - 34, 118, 38, [0.985, 0.992, 0.995]);
        drawStrokedRect(cardX, currentY - 34, 118, 38, [0.84, 0.90, 0.94]);
        drawText(label.toUpperCase(), cardX + 8, currentY - 10, 6.8, [0.40, 0.45, 0.48]);
        drawText(value, cardX + 8, currentY - 25, 10, [0.07, 0.20, 0.37]);
      });

      currentY -= 58;

      drawText('TOP CART RESERVED MEDICINES', leftMargin, currentY, 8.5, [0.18, 0.18, 0.18]);
      currentY -= 18;

      if (topReservedMedicines.length === 0) {
        drawText('No cart reservations were active when this report was generated.', leftMargin, currentY, 8.5, [0.40, 0.40, 0.40]);
        currentY -= 18;
      } else {
        topReservedMedicines.forEach((item, index) => {
          drawText(`${index + 1}. ${truncatePdfText(item.name || 'Medicine', 34)}`, leftMargin, currentY, 8.5, [0.07, 0.20, 0.37]);
          drawText(
            `Reserved ${item.reservedQuantity || 0} ${item.unit || 'units'} across ${item.activeCarts || 0} cart(s)`,
            leftMargin + 170,
            currentY,
            8.5,
            [0.35, 0.35, 0.35]
          );
          currentY -= 14;
        });
      }

      currentY -= 10;
    }

    const tableWidth = columnDefs.reduce((total, column) => total + column.width, 0);
    drawFilledRect(leftMargin, currentY - 4, tableWidth, rowHeight, [0.95, 0.97, 0.99]);
    let currentX = leftMargin;
    columnDefs.forEach((column) => {
      drawText(column.label, currentX + 2, currentY + 5, 9);
      currentX += column.width;
    });

    const tableTopY = currentY + 14;
    currentY -= 8;
    const tableLeft = leftMargin;
    const tableRight = Math.min(pageWidth - rightMargin, tableLeft + tableWidth);
    const totalTableHeight = rowHeight * (page.rows.length + 1);

    setStrokeColor(0.82, 0.86, 0.90);
    drawLine(tableLeft, tableTopY, tableRight, tableTopY);

    page.rows.forEach((row, rowIndex) => {
      const rowY = currentY - rowHeight * rowIndex;
      let rowX = leftMargin;

      if (rowIndex % 2 === 0) {
        drawFilledRect(tableLeft, rowY - 10, tableWidth, rowHeight, [0.985, 0.985, 0.985]);
      }

      columnDefs.forEach((column) => {
        drawText(row[column.key] || '', rowX + 2, rowY, 8.5);
        rowX += column.width;
      });

      drawLine(tableLeft, rowY - 6, tableRight, rowY - 6);
    });

    let verticalX = tableLeft;
    columnDefs.forEach((column, index) => {
      drawLine(verticalX, tableTopY, verticalX, tableTopY - totalTableHeight);
      verticalX += column.width;

      if (index === columnDefs.length - 1) {
        drawLine(verticalX, tableTopY, verticalX, tableTopY - totalTableHeight);
      }
    });

    if (pageIndex === pages.length - 1) {
      const totalsBoxX = pageWidth - 220;
      const totalsBoxY = 190;
      const totalsBoxWidth = 180;
      const totalsRowHeight = 22;
      const totals = [
        ['Items Added', String(medicinesAddedThisMonth.length)],
        ['Total Stock Qty', String(totalQuantity)],
        ['Near Expiry', String(nearExpiryCount)],
        ['Cart Reserved Qty', String(totalReservedQuantity)],
        ['Grand Total', formatCurrency(subtotalValue)],
      ];

      drawStrokedRect(totalsBoxX, totalsBoxY, totalsBoxWidth, totalsRowHeight * totals.length, [0.82, 0.86, 0.90]);
      totals.forEach(([label, value], index) => {
        const rowY = totalsBoxY + totalsRowHeight * (totals.length - index - 1);
        drawLine(totalsBoxX, rowY, totalsBoxX + totalsBoxWidth, rowY);
        drawText(label, totalsBoxX + 8, rowY + 8, 9, [0.35, 0.35, 0.35]);
        drawText(
          value,
          totalsBoxX + 105,
          rowY + 8,
          index === totals.length - 1 ? 10 : 9,
          index === totals.length - 1 ? [0.07, 0.20, 0.37] : [0, 0, 0]
        );
      });

      drawText('ADVANCED REPORT NOTES', leftMargin, 150, 8, [0.35, 0.35, 0.35]);
      drawText('This PDF combines medicine stock, expiry pressure, and live cart reservation context.', leftMargin, 134, 8.5);
      drawText('Use reserved cart quantity to spot overselling risk before final order conversion.', leftMargin, 122, 8.5);
      drawText('WWW.PHARMACARE.COM', leftMargin, 94, 8.5, [0.07, 0.20, 0.37]);
    }

    drawText(
      `Generated from PharmaCare on ${now.toLocaleString()}`,
      leftMargin,
      28,
      9,
      [0.4, 0.4, 0.4]
    );

    const contentStream = contentCommands.join('\n');
    const contentObjectId = addObject(`<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream`);
    const pageObjectId = addObject(
      `<< /Type /Page /Parent PAGES_ID 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontObjectId} 0 R >> >> /Contents ${contentObjectId} 0 R >>`
    );
    pageObjectIds.push(pageObjectId);
  });

  const pagesObjectId = addObject(
    `<< /Type /Pages /Count ${pageObjectIds.length} /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(' ')}] >>`
  );

  pageObjectIds.forEach((pageObjectId) => {
    objects[pageObjectId - 1] = objects[pageObjectId - 1].replace('PAGES_ID', String(pagesObjectId));
  });

  const catalogObjectId = addObject(`<< /Type /Catalog /Pages ${pagesObjectId} 0 R >>`);

  let pdf = '%PDF-1.4\n';
  const offsets = [0];

  objects.forEach((objectContent, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${objectContent}\nendobj\n`;
  });

  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let index = 1; index <= objects.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogObjectId} 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  const blob = new Blob([pdf], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute(
    'download',
    `advanced-monthly-medicine-report-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}.pdf`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const StatCard = ({ icon: Icon, label, value, tone, helper }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="mt-3 text-3xl font-semibold text-slate-900">{value}</p>
        <p className="mt-2 text-xs text-slate-400">{helper}</p>
      </div>
      <div className={`rounded-xl p-3 ${tone}`}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  </div>
);

const ManageMedicines = () => {
  const location = useLocation();
  const basePath = location.pathname.startsWith('/pharmacist') ? '/pharmacist/medicines' : '/admin/medicines';
  const [medicines, setMedicines] = useState([]);
  const [cartSummary, setCartSummary] = useState({
    activeCarts: 0,
    totalCartItems: 0,
    totalReservedQuantity: 0,
    totalCartValue: 0,
    medicines: []
  });
  const [discounts, setDiscounts] = useState([]);
  const [discountInputs, setDiscountInputs] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchBy, setSearchBy] = useState('brandName');
  const [currentPage, setCurrentPage] = useState(1);
  const [draftFilters, setDraftFilters] = useState({
    category: 'all',
    stockStatus: 'all',
    prescription: 'all',
    expiryRange: 'all',
  });
  const [appliedFilters, setAppliedFilters] = useState({
    category: 'all',
    stockStatus: 'all',
    prescription: 'all',
    expiryRange: 'all',
  });

  useEffect(() => {
    fetchMedicines();
    syncDiscounts();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, searchBy, appliedFilters]);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const [medicinesResponse, cartSummaryResponse] = await Promise.all([
        axios.get('/api/medicines'),
        axios.get('/api/cart/summary').catch(() => ({ data: { summary: null } }))
      ]);

      setMedicines(medicinesResponse.data.medicines || []);
      setCartSummary(
        cartSummaryResponse.data.summary || {
          activeCarts: 0,
          totalCartItems: 0,
          totalReservedQuantity: 0,
          totalCartValue: 0,
          medicines: []
        }
      );
      setError('');
    } catch (err) {
      setError('Failed to load medicines');
      console.error('Error fetching medicines:', err);
    } finally {
      setLoading(false);
    }
  };

  const syncDiscounts = () => {
    const storedDiscounts = JSON.parse(localStorage.getItem(DISCOUNTS_STORAGE_KEY) || '[]');
    setDiscounts(storedDiscounts);

    const nextInputs = {};
    storedDiscounts.forEach((discount) => {
      const medicineId = discount.applicableMedicines?.[0];
      if (medicineId) {
        nextInputs[medicineId] = String(discount.value ?? '');
      }
    });
    setDiscountInputs((prev) => ({ ...nextInputs, ...prev }));
  };

  const deleteMedicine = async (id) => {
    if (!window.confirm('Are you sure you want to delete this medicine?')) return;

    try {
      await axios.delete(`/api/medicines/${id}`);
      fetchMedicines();
    } catch (err) {
      setError('Failed to delete medicine');
    }
  };

  const addNearExpiryDiscount = (medicine) => {
    const expiryStatus = getExpiryStatus(medicine.expiryDate);

    if (expiryStatus !== 'Near expiry') {
      setError('Only near expiry medicines can be added to discounts.');
      return;
    }

    const existingDiscounts = JSON.parse(localStorage.getItem(DISCOUNTS_STORAGE_KEY) || '[]');
    const existingMedicineDiscount = existingDiscounts.find((discount) =>
      discount.applicableMedicines?.includes(medicine._id) &&
      discount.name?.startsWith('Near Expiry')
    );
    const discountValue = Number.parseFloat(discountInputs[medicine._id] || existingMedicineDiscount?.value || '');

    if (!Number.isFinite(discountValue) || discountValue <= 0 || discountValue > 100) {
      setError('Please enter a valid discount percentage between 1 and 100.');
      return;
    }

    if (existingMedicineDiscount) {
      const updatedDiscounts = existingDiscounts.map((discount) =>
        discount._id === existingMedicineDiscount._id
          ? {
              ...discount,
              value: discountValue,
              endDate: medicine.expiryDate
                ? new Date(medicine.expiryDate).toISOString().split('T')[0]
                : discount.endDate,
            }
          : discount
      );

      localStorage.setItem(DISCOUNTS_STORAGE_KEY, JSON.stringify(updatedDiscounts));
      setDiscounts(updatedDiscounts);
      setError('');
      syncDiscounts();
      return;
    }

    const today = new Date();
    const endDate = medicine.expiryDate
      ? new Date(medicine.expiryDate).toISOString().split('T')[0]
      : new Date(today.setDate(today.getDate() + 30)).toISOString().split('T')[0];

    const newDiscount = {
      _id: `near-expiry-${medicine._id}`,
      code: `EXP${String(medicine.name || 'MED').replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6)}`,
      name: `Near Expiry - ${medicine.name}`,
      type: 'percentage',
      value: discountValue,
      minOrderAmount: 0,
      maxDiscount: 0,
      applicableMedicines: [medicine._id],
      startDate: new Date().toISOString().split('T')[0],
      endDate,
      isActive: true,
      usageCount: 0
    };

    localStorage.setItem(
      DISCOUNTS_STORAGE_KEY,
      JSON.stringify([...existingDiscounts, newDiscount])
    );
    setDiscounts([...existingDiscounts, newDiscount]);

    setError('');
    syncDiscounts();
  };

  const getMedicineDiscount = (medicineId) =>
    discounts.find((discount) => discount.applicableMedicines?.includes(medicineId) && discount.name?.startsWith('Near Expiry'));

  const getDiscountedPrice = (medicine, discount) => {
    if (!discount) {
      return Number(medicine.price || 0);
    }

    return Number(medicine.price || 0) * (1 - Number(discount.value || 0) / 100);
  };

  const groupedMedicines = useMemo(() => summarizeMedicineGroups(medicines), [medicines]);

  const cartSummaryByMedicine = useMemo(() => {
    const summaryByBatchId = new Map(
      (cartSummary.medicines || []).map((item) => [String(item.medicineId), item])
    );

    const summaryByGroupedMedicineId = new Map();

    groupedMedicines.forEach((medicine) => {
      const matchingItems = (medicine.batchIds || [])
        .map((batchId) => summaryByBatchId.get(String(batchId)))
        .filter(Boolean);

      if (matchingItems.length === 0) {
        return;
      }

      const aggregated = matchingItems.reduce(
        (accumulator, item) => ({
          medicineId: String(medicine._id),
          name: medicine.name,
          unit: item.unit || accumulator.unit || 'units',
          price: Number(item.price || accumulator.price || medicine.price || 0),
          stockQuantity: Number(medicine.stockQuantity ?? 0),
          reservedQuantity: accumulator.reservedQuantity + Number(item.reservedQuantity || 0),
          activeCarts: accumulator.activeCarts + Number(item.activeCarts || 0)
        }),
        {
          medicineId: String(medicine._id),
          name: medicine.name,
          unit: medicine.unit || 'units',
          price: Number(medicine.price || 0),
          stockQuantity: Number(medicine.stockQuantity ?? 0),
          reservedQuantity: 0,
          activeCarts: 0
        }
      );

      summaryByGroupedMedicineId.set(String(medicine._id), aggregated);
    });

    return summaryByGroupedMedicineId;
  }, [cartSummary.medicines, groupedMedicines]);

  const categoryOptions = useMemo(
    () => [...new Set(groupedMedicines.map((medicine) => medicine.category).filter(Boolean))].sort(),
    [groupedMedicines]
  );

  const summary = useMemo(() => {
    const totalMedicines = groupedMedicines.length;
    const activeMedicines = groupedMedicines.filter((medicine) => medicine.isActive !== false).length;
    const lowStockItems = groupedMedicines.filter((medicine) => getStockStatus(medicine) === 'Low stock').length;
    const nearExpiryItems = groupedMedicines.filter((medicine) => getExpiryStatus(medicine.expiryDate) === 'Near expiry').length;

    return {
      totalMedicines,
      activeMedicines,
      lowStockItems,
      nearExpiryItems,
    };
  }, [groupedMedicines]);

  const filteredMedicines = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    return groupedMedicines.filter((medicine) => {
      if (normalizedSearchTerm) {
        const searchField = searchBy === 'category'
          ? medicine.category || ''
          : medicine.name || '';

        if (!searchField.toLowerCase().includes(normalizedSearchTerm)) {
          return false;
        }
      }

      if (appliedFilters.category !== 'all' && medicine.category !== appliedFilters.category) {
        return false;
      }

      const stockStatus = getStockStatus(medicine);
      if (appliedFilters.stockStatus !== 'all') {
        const matchesStock =
          (appliedFilters.stockStatus === 'inStock' && stockStatus === 'In stock') ||
          (appliedFilters.stockStatus === 'lowStock' && stockStatus === 'Low stock') ||
          (appliedFilters.stockStatus === 'outOfStock' && stockStatus === 'Out of stock');

        if (!matchesStock) {
          return false;
        }
      }

      if (appliedFilters.prescription !== 'all') {
        const needsPrescription = medicine.requiresPrescription === true;
        if (appliedFilters.prescription === 'required' && !needsPrescription) {
          return false;
        }
        if (appliedFilters.prescription === 'otc' && needsPrescription) {
          return false;
        }
      }

      if (appliedFilters.expiryRange !== 'all') {
        const expiryStatus = getExpiryStatus(medicine.expiryDate);
        const matchesExpiry =
          (appliedFilters.expiryRange === 'valid' && expiryStatus === 'Valid') ||
          (appliedFilters.expiryRange === 'nearExpiry' && expiryStatus === 'Near expiry') ||
          (appliedFilters.expiryRange === 'expired' && expiryStatus === 'Expired');

        if (!matchesExpiry) {
          return false;
        }
      }

      return true;
    });
  }, [appliedFilters, groupedMedicines, searchBy, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredMedicines.length / PAGE_SIZE));
  const paginatedMedicines = filteredMedicines.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const startIndex = filteredMedicines.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endIndex = Math.min(currentPage * PAGE_SIZE, filteredMedicines.length);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-medical-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200/80 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
        <div className="relative overflow-hidden rounded-3xl bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.22),_transparent_32%),linear-gradient(135deg,#f8fafc_0%,#ecfeff_45%,#f0fdfa_100%)] p-6">
          <div className="absolute -right-10 top-0 h-28 w-28 rounded-full bg-cyan-200/30 blur-2xl" />
          <div className="absolute bottom-0 left-1/3 h-24 w-24 rounded-full bg-emerald-200/30 blur-2xl" />
          <div className="relative">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="mb-4">
              <BrandLogo compact className="mb-3" />
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
                <Pill className="h-3.5 w-3.5" />
                PharmaCare Admin
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Medicine Management</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
                Manage medicines, inventory, categories, filters, and stock-sensitive items from one workspace.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => downloadCsv(filteredMedicines)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
            >
              <FileDown className="h-4 w-4" />
              Export
            </button>
            <button
              type="button"
              onClick={() => downloadMonthlyMedicinePdfReport(filteredMedicines, cartSummary)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
            >
              <FileDown className="h-4 w-4" />
              Advanced Monthly PDF
            </button>
            <Link
              to={`${basePath}/new`}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-cyan-700"
            >
              <Plus className="h-4 w-4" />
              Add Medicine
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={Package}
            label="Total Medicines"
            value={summary.totalMedicines.toLocaleString()}
            helper="All products currently in the catalog"
            tone="bg-cyan-50 text-cyan-700"
          />
          <StatCard
            icon={CheckCircle2}
            label="Active Medicines"
            value={summary.activeMedicines.toLocaleString()}
            helper="Products available for regular operations"
            tone="bg-emerald-50 text-emerald-700"
          />
          <StatCard
            icon={AlertTriangle}
            label="Low Stock Items"
            value={summary.lowStockItems.toLocaleString()}
            helper="Items at or below the low-stock threshold"
            tone="bg-amber-50 text-amber-700"
          />
          <StatCard
            icon={ShieldAlert}
            label="Near Expiry (30d)"
            value={summary.nearExpiryItems.toLocaleString()}
            helper="Medicines expiring within 30 days"
            tone="bg-rose-50 text-rose-700"
          />
        </div>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <section className="rounded-3xl border border-cyan-100 bg-[linear-gradient(135deg,#f0fdfa_0%,#f8fafc_100%)] p-5 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">
              <ShoppingCart className="h-3.5 w-3.5" />
              Cart Connection
            </div>
            <h2 className="mt-4 text-xl font-bold text-slate-900">Inventory to cart connection</h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              This shows the real quantities already reserved in customer carts so you can compare demand against available medicine stock before overselling happens.
            </p>
          </div>

          <div className="grid w-full gap-4 sm:grid-cols-2 xl:max-w-3xl xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-500">Active Carts</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{cartSummary.activeCarts}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-500">Cart Line Items</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{cartSummary.totalCartItems}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-500">Reserved Quantity</p>
              <p className="mt-2 text-2xl font-bold text-cyan-700">{cartSummary.totalReservedQuantity}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-500">Cart Value</p>
              <p className="mt-2 text-2xl font-bold text-emerald-700">{formatCurrency(cartSummary.totalCartValue)}</p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          {(cartSummary.medicines || []).length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 px-6 py-8 text-center text-slate-500">
              <ShoppingCart className="mx-auto mb-3 h-10 w-10 text-slate-300" />
              <p className="font-medium text-slate-700">No active cart reservations yet</p>
              <p className="mt-1 text-sm">Customer cart quantities will appear here after medicines are added to carts.</p>
            </div>
          ) : (
            <div className="grid gap-3 xl:grid-cols-2">
              {cartSummary.medicines.slice(0, 6).map((item) => {
                const availableQuantity = Number(item.stockQuantity || 0);
                const remainingQuantity = Math.max(availableQuantity - Number(item.reservedQuantity || 0), 0);

                return (
                  <div key={item.medicineId} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-900">{item.name}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          Reserved in carts: {item.reservedQuantity} {item.unit || 'units'}
                        </p>
                        <p className="text-sm text-slate-500">Active carts: {item.activeCarts}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-emerald-700">{formatCurrency(Number(item.price || 0) * Number(item.reservedQuantity || 0))}</p>
                        <p className="mt-1 text-sm text-slate-500">Stock: {availableQuantity} {item.unit || 'units'}</p>
                        <p className={`text-sm ${availableQuantity >= Number(item.reservedQuantity || 0) ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {availableQuantity >= Number(item.reservedQuantity || 0)
                            ? `Remaining after carts: ${remainingQuantity} ${item.unit || 'units'}`
                            : 'Reserved quantity exceeds stock'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 xl:grid-cols-[repeat(4,minmax(0,1fr))_280px]">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Category</label>
            <select
              value={draftFilters.category}
              onChange={(e) => setDraftFilters((prev) => ({ ...prev, category: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-cyan-400"
            >
              <option value="all">All Categories</option>
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Stock Status</label>
            <select
              value={draftFilters.stockStatus}
              onChange={(e) => setDraftFilters((prev) => ({ ...prev, stockStatus: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-cyan-400"
            >
              <option value="all">All Status</option>
              <option value="inStock">In Stock</option>
              <option value="lowStock">Low Stock</option>
              <option value="outOfStock">Out of Stock</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Prescription</label>
            <select
              value={draftFilters.prescription}
              onChange={(e) => setDraftFilters((prev) => ({ ...prev, prescription: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-cyan-400"
            >
              <option value="all">All Types</option>
              <option value="required">Required</option>
              <option value="otc">OTC</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Expiry Range</label>
            <select
              value={draftFilters.expiryRange}
              onChange={(e) => setDraftFilters((prev) => ({ ...prev, expiryRange: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-cyan-400"
            >
              <option value="all">All Dates</option>
              <option value="valid">Valid</option>
              <option value="nearExpiry">Near Expiry</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={() => setAppliedFilters(draftFilters)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              <Filter className="h-4 w-4" />
              Apply Filters
            </button>
          </div>
        </div>

        <div className="mt-5">
          <label className="mb-2 block text-sm font-medium text-slate-700">Search for products</label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={searchBy === 'category' ? 'Search by Category' : 'Search by Medicine Name or Category'}
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm text-slate-700 outline-none transition focus:border-cyan-400"
            />
          </div>

          <div className="mt-3">
            <select
              value={searchBy}
              onChange={(e) => setSearchBy(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-cyan-400"
            >
              <option value="brandName">Search by: Medicine Name</option>
              <option value="category">Search by: Category</option>
            </select>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <p className="text-sm text-slate-500">
            {filteredMedicines.length.toLocaleString()} medicines
          </p>
          <p className="text-sm text-slate-400">Inventory list</p>
        </div>

        {paginatedMedicines.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Package className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">No medicines found</h3>
            <p className="mt-2 text-sm text-slate-500">Try a different search term or filter combination.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-slate-50">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-4">Medicine</th>
                    <th className="px-5 py-4">Category</th>
                    <th className="px-5 py-4">Cart Reserve</th>
                    <th className="px-5 py-4">Price</th>
                    <th className="px-5 py-4">Discount</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {paginatedMedicines.map((medicine) => {
                    const stockStatus = getStockStatus(medicine);
                    const activityStatus = medicine.isActive === false ? 'Inactive' : 'Active';
                    const expiryStatus = getExpiryStatus(medicine.expiryDate);
                    const medicineDiscount = getMedicineDiscount(medicine._id);
                    const discountedPrice = getDiscountedPrice(medicine, medicineDiscount);
                    const cartItem = cartSummaryByMedicine.get(String(medicine._id));
                    const reservedQuantity = Number(cartItem?.reservedQuantity || 0);
                    const stockQuantity = Number(medicine.stockQuantity ?? 0);
                    const remainingAfterCarts = Math.max(stockQuantity - reservedQuantity, 0);

                    return (
                      <tr key={medicine._id} className="transition hover:bg-slate-50/80">
                        <td className="px-5 py-4">
                          <div className="flex items-start gap-3">
                            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                              {medicine.image ? (
                                <img
                                  src={medicine.image}
                                  alt={medicine.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <Package className="h-5 w-5 text-slate-400" />
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">{medicine.name}</p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {medicine.batches?.map((batch) => (
                                  <span
                                    key={batch._id}
                                    className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                                  >
                                    {batch.batchNo}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-600">{medicine.category || 'Uncategorized'}</td>
                        <td className="px-5 py-4">
                          {cartItem ? (
                            <>
                              <p className="text-sm font-semibold text-cyan-700">{reservedQuantity.toLocaleString()} {cartItem.unit || ''}</p>
                              <p className={`mt-1 text-xs ${reservedQuantity > stockQuantity ? 'text-rose-600' : 'text-slate-500'}`}>
                                {reservedQuantity > stockQuantity
                                  ? 'Reserved quantity exceeds stock'
                                  : `Remaining: ${remainingAfterCarts.toLocaleString()} ${cartItem.unit || ''}`}
                              </p>
                            </>
                          ) : (
                            <p className="text-sm text-slate-400">No cart reservations</p>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-rose-700">{formatCurrency(discountedPrice)}</p>
                          {medicineDiscount ? (
                            <>
                              <p className="mt-1 text-xs text-slate-400 line-through">{formatCurrency(medicine.price)}</p>
                              <p className="mt-1 text-xs font-medium text-amber-700">
                                Near Expiry Discount ({medicineDiscount.value}% off)
                              </p>
                            </>
                          ) : (
                            <p className="mt-1 text-xs text-slate-500">
                              {medicine.expiryDate ? new Date(medicine.expiryDate).toLocaleDateString() : 'No expiry'}
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          {expiryStatus === 'Near expiry' ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="1"
                                max="100"
                                value={discountInputs[medicine._id] ?? medicineDiscount?.value ?? ''}
                                onChange={(e) => setDiscountInputs((prev) => ({ ...prev, [medicine._id]: e.target.value }))}
                                className="w-24 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-cyan-400"
                              />
                              <span className="text-sm text-slate-500">%</span>
                              <button
                                type="button"
                                onClick={() => addNearExpiryDiscount(medicine)}
                                className="rounded-xl bg-amber-100 px-3 py-2 text-sm font-medium text-amber-800 transition hover:bg-amber-200"
                              >
                                Save
                              </button>
                            </div>
                          ) : (
                            <p className="text-sm text-slate-400">Only for near expiry</p>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-2">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClasses(activityStatus)}`}>
                              {activityStatus}
                            </span>
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClasses(expiryStatus)}`}>
                              {expiryStatus}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              to={`${basePath}/edit/${medicine._id}?tab=batches`}
                              className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                              title="Open batches"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                            <Link
                              to={`${basePath}/edit/${medicine._id}`}
                              className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                              title="Edit"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Link>
                            <button
                              type="button"
                              onClick={() => deleteMedicine(medicine._id)}
                              className="rounded-lg p-2 text-rose-500 transition hover:bg-rose-50 hover:text-rose-700"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                              title="More"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-4 border-t border-slate-200 px-5 py-4 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
              <p>
                Showing {startIndex} to {endIndex} of {filteredMedicines.length.toLocaleString()} medicines
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={currentPage === 1}
                  className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {Array.from({ length: totalPages }, (_, index) => index + 1).slice(0, 3).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`min-w-9 rounded-lg px-3 py-2 text-sm font-medium transition ${
                      currentPage === page
                        ? 'bg-cyan-600 text-white'
                        : 'border border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                {totalPages > 3 && <span className="px-1 text-slate-400">...</span>}

                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default ManageMedicines;
