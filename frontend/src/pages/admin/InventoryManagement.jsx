import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Package,
  Plus,
  AlertTriangle,
  Trash2,
  Edit2,
  Search,
  Filter,
  BarChart3,
  RefreshCw,
  X,
  Save,
  ShoppingCart,
  ArrowUp,
  ArrowDown,
  CalendarDays,
  History
} from 'lucide-react';
import AdminPageHeader from '../../components/AdminPageHeader';

const formatCurrency = (amount) => `LKR ${Number(amount || 0).toFixed(2)}`;
const escapePdfText = (value = '') => String(value)
  .replace(/\\/g, '\\\\')
  .replace(/\(/g, '\\(')
  .replace(/\)/g, '\\)');
const buildSimplePdf = (objects) => {
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

  return { pdf, xrefStart };
};

const InventoryManagement = () => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [reportMonth, setReportMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [showModal, setShowModal] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    genericName: '',
    manufacturer: '',
    category: '',
    description: '',
    price: '',
    quantity: '',
    thresholdValue: '',
    expiryDate: '',
    isDiscontinued: false,
    unit: 'tablet'
  });
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [stockUpdate, setStockUpdate] = useState({
    type: 'refill',
    transactionType: 'PURCHASE_IN',
    quantity: '',
    reason: '',
    createNewBatch: false,
    batchNo: '',
    expiryDate: ''
  });
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [stockMovements, setStockMovements] = useState([]);
  const [ledgerMedicine, setLedgerMedicine] = useState(null);
  const [showCartModal, setShowCartModal] = useState(false);
  const [cartSummary, setCartSummary] = useState({
    activeCarts: 0,
    totalCartItems: 0,
    totalReservedQuantity: 0,
    totalCartValue: 0,
    medicines: []
  });

  const categories = [
    'Tablet', 'Capsule', 'Syrup', 'Injection',
    'Ointment', 'Drops', 'Inhaler', 'Suppository'
  ];

  const units = ['tablet', 'capsule', 'bottle', 'vial', 'tube', 'ml', 'mg', 'g'];

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/medicines');
      const sorted = (response.data.medicines || []).slice().sort((a, b) => {
        const dateA = a.expiryDate ? new Date(a.expiryDate).getTime() : Infinity;
        const dateB = b.expiryDate ? new Date(b.expiryDate).getTime() : Infinity;
        return dateA - dateB;
      });
      setMedicines(sorted);
      setError('');
    } catch (err) {
      setError('Failed to fetch medicines: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchStockMovements = async (medicineId = '') => {
    try {
      const response = await axios.get('/api/medicines/stock-movements', {
        params: medicineId ? { medicineId } : {}
      });
      setStockMovements(response.data.movements || []);
    } catch (err) {
      setError('Failed to load stock ledger: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity, 10),
        thresholdValue: parseInt(formData.thresholdValue, 10)
      };

      if (editingMedicine) {
        await axios.put(`/api/medicines/${editingMedicine._id}`, data);
      } else {
        await axios.post('/api/medicines', data);
      }

      fetchMedicines();
      closeModal();
    } catch (err) {
      setError('Failed to save medicine: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleStockUpdate = async (e) => {
    e.preventDefault();
    if (!selectedMedicine) return;

    try {
      const currentQuantity = Number(selectedMedicine.quantity || selectedMedicine.stockQuantity || 0);
      const quantityChange = parseInt(stockUpdate.quantity, 10);

      if (stockUpdate.type === 'refill' && stockUpdate.createNewBatch) {
        if (!stockUpdate.batchNo.trim() || !stockUpdate.expiryDate) {
          setError('Batch / LOT number and expiry date are required for new batch stock-in');
          return;
        }

        await axios.post(`/api/medicines/${selectedMedicine._id}/stock-adjustments`, {
          transactionType: stockUpdate.transactionType,
          quantity: quantityChange,
          reason: stockUpdate.reason.trim(),
          createNewBatch: true,
          batchNo: stockUpdate.batchNo.trim(),
          expiryDate: stockUpdate.expiryDate
        });

        fetchMedicines();
        closeStockModal();
        return;
      }

      const newQuantity = stockUpdate.type === 'refill'
        ? currentQuantity + quantityChange
        : currentQuantity - quantityChange;

      if (newQuantity < 0) {
        setError('Insufficient stock for this operation');
        return;
      }

      if (!stockUpdate.reason.trim()) {
        setError('Reason is required for audit purposes');
        return;
      }

      await axios.post(`/api/medicines/${selectedMedicine._id}/stock-adjustments`, {
        transactionType: stockUpdate.transactionType,
        quantity: quantityChange,
        reason: stockUpdate.reason.trim(),
        batchId: selectedMedicine._id
      });

      const threshold = Number(selectedMedicine.thresholdValue || 10);
      if (newQuantity <= threshold) {
        setError(`Alert: Low stock for ${selectedMedicine.name}. Current quantity: ${newQuantity}`);
      }

      fetchMedicines();
      closeStockModal();
    } catch (err) {
      setError('Failed to update stock: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this medicine from inventory?')) return;

    try {
      await axios.delete(`/api/medicines/${id}`);
      fetchMedicines();
    } catch (err) {
      setError('Failed to delete medicine: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDiscontinue = async (medicine) => {
    try {
      await axios.put(`/api/medicines/${medicine._id}`, {
        ...medicine,
        isDiscontinued: !medicine.isDiscontinued
      });
      fetchMedicines();
    } catch (err) {
      setError('Failed to update status: ' + (err.response?.data?.message || err.message));
    }
  };

  const openAddModal = () => {
    setEditingMedicine(null);
    setFormData({
      name: '',
      genericName: '',
      manufacturer: '',
      category: '',
      description: '',
      price: '',
      quantity: '',
      thresholdValue: '',
      expiryDate: '',
      isDiscontinued: false,
      unit: 'tablet'
    });
    setShowModal(true);
  };

  const openEditModal = (medicine) => {
    setEditingMedicine(medicine);
    setFormData({
      name: medicine.name || '',
      genericName: medicine.genericName || '',
      manufacturer: medicine.manufacturer || '',
      category: medicine.category || '',
      description: medicine.description || '',
      price: medicine.price || '',
      quantity: medicine.quantity ?? medicine.stockQuantity ?? '',
      thresholdValue: medicine.thresholdValue || '',
      expiryDate: medicine.expiryDate ? medicine.expiryDate.split('T')[0] : '',
      isDiscontinued: medicine.isDiscontinued || false,
      unit: medicine.unit || 'tablet'
    });
    setShowModal(true);
  };

  const openStockModal = (medicine) => {
    setSelectedMedicine(medicine);
    setStockUpdate({
      type: 'refill',
      transactionType: 'PURCHASE_IN',
      quantity: '',
      reason: '',
      createNewBatch: false,
      batchNo: '',
      expiryDate: ''
    });
    setShowStockModal(true);
  };

  const openCartModal = async () => {
    try {
      const response = await axios.get('/api/cart/summary');
      setCartSummary(response.data.summary || {
        activeCarts: 0,
        totalCartItems: 0,
        totalReservedQuantity: 0,
        totalCartValue: 0,
        medicines: []
      });
    } catch (err) {
      setCartSummary({
        activeCarts: 0,
        totalCartItems: 0,
        totalReservedQuantity: 0,
        totalCartValue: 0,
        medicines: []
      });
      setError('Failed to load cart summary: ' + (err.response?.data?.message || err.message));
    } finally {
      setShowCartModal(true);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingMedicine(null);
    setError('');
  };

  const closeStockModal = () => {
    setShowStockModal(false);
    setSelectedMedicine(null);
    setStockUpdate({
      type: 'refill',
      transactionType: 'PURCHASE_IN',
      quantity: '',
      reason: '',
      createNewBatch: false,
      batchNo: '',
      expiryDate: ''
    });
    setError('');
  };

  const openLedgerModal = async (medicine = null) => {
    setLedgerMedicine(medicine);
    await fetchStockMovements(medicine?._id || '');
    setShowLedgerModal(true);
  };

  const closeLedgerModal = () => {
    setShowLedgerModal(false);
    setLedgerMedicine(null);
    setStockMovements([]);
  };

  const closeCartModal = () => {
    setShowCartModal(false);
  };

  const filteredMedicines = medicines.filter((medicine) => {
    const quantity = Number(medicine.quantity ?? medicine.stockQuantity ?? 0);
    const threshold = Number(medicine.thresholdValue || 10);
    const matchesSearch =
      medicine.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      medicine.genericName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || medicine.category === filterCategory;
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && !medicine.isDiscontinued) ||
      (filterStatus === 'discontinued' && medicine.isDiscontinued) ||
      (filterStatus === 'lowstock' && quantity <= threshold);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalMedicines = medicines.length;
  const lowStockCount = medicines.filter((medicine) => {
    const quantity = Number(medicine.quantity ?? medicine.stockQuantity ?? 0);
    const threshold = Number(medicine.thresholdValue || 10);
    return quantity <= threshold && !medicine.isDiscontinued;
  }).length;
  const discontinuedCount = medicines.filter((medicine) => medicine.isDiscontinued).length;
  const totalQuantity = medicines.reduce((sum, medicine) => sum + Number(medicine.quantity ?? medicine.stockQuantity ?? 0), 0);

  const downloadInventoryValuationReport = () => {
    const now = new Date();
    const pageWidth = 595;
    const pageHeight = 842;
    const leftMargin = 42;
    const topY = 792;
    const objects = [];
    const addObject = (content) => {
      objects.push(content);
      return objects.length;
    };
    const fontObjectId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
    const reportRows = filteredMedicines.map((medicine) => {
      const quantity = Number(medicine.quantity ?? medicine.stockQuantity ?? 0);
      const unitCost = Number(medicine.costPrice || 0);
      const sellingPrice = Number(medicine.price || 0);
      return {
        ...medicine,
        quantity,
        unitCost,
        sellingPrice,
        costValue: quantity * unitCost,
        retailValue: quantity * sellingPrice
      };
    });
    const totalCostValue = reportRows.reduce((sum, item) => sum + item.costValue, 0);
    const totalRetailValue = reportRows.reduce((sum, item) => sum + item.retailValue, 0);
    const potentialMargin = totalRetailValue - totalCostValue;
    const contentCommands = [];
    const drawText = (text, x, y, size = 11) => {
      contentCommands.push(`BT /F1 ${size} Tf 1 0 0 1 ${x} ${y} Tm (${escapePdfText(text)}) Tj ET`);
    };
    const drawLine = (x1, y1, x2, y2) => {
      contentCommands.push(`${x1} ${y1} m ${x2} ${y2} l S`);
    };
    const drawFilledRect = (x, y, width, height, rgb = [0.93, 0.96, 0.98]) => {
      contentCommands.push(`q ${rgb[0]} ${rgb[1]} ${rgb[2]} rg ${x} ${y} ${width} ${height} re f Q`);
    };

    drawFilledRect(leftMargin, topY - 18, 510, 42, [0.91, 0.96, 0.98]);
    drawText('PharmaCare', leftMargin + 12, topY, 22);
    drawText('Inventory Valuation Report', leftMargin + 12, topY - 22, 15);
    drawText(`Generated: ${now.toLocaleString()}`, pageWidth - 190, topY - 10, 9);
    drawLine(leftMargin, topY - 64, pageWidth - leftMargin, topY - 64);

    drawFilledRect(leftMargin, topY - 150, 510, 70);
    drawText(`Total Items: ${reportRows.length}`, leftMargin + 12, topY - 104, 10);
    drawText(`Units on Hand: ${reportRows.reduce((sum, item) => sum + item.quantity, 0)}`, leftMargin + 180, topY - 104, 10);
    drawText(`Cost Value: ${formatCurrency(totalCostValue)}`, leftMargin + 12, topY - 128, 10);
    drawText(`Retail Value: ${formatCurrency(totalRetailValue)}`, leftMargin + 180, topY - 128, 10);
    drawText(`Potential Margin: ${formatCurrency(potentialMargin)}`, leftMargin + 360, topY - 128, 10);

    const tableTop = topY - 190;
    const rowHeight = 22;
    drawFilledRect(leftMargin, tableTop, 510, rowHeight, [0.86, 0.91, 0.95]);
    const columns = [
      ['Medicine', leftMargin + 4],
      ['Qty', leftMargin + 180],
      ['Unit Cost', leftMargin + 230],
      ['Cost Value', leftMargin + 320],
      ['Retail Value', leftMargin + 430]
    ];
    columns.forEach(([label, x]) => drawText(label, x, tableTop + 7, 8.5));
    drawLine(leftMargin, tableTop, pageWidth - leftMargin, tableTop);
    drawLine(leftMargin, tableTop + rowHeight, pageWidth - leftMargin, tableTop + rowHeight);

    reportRows.slice(0, 22).forEach((item, index) => {
      const rowY = tableTop - rowHeight * (index + 1);
      drawLine(leftMargin, rowY, pageWidth - leftMargin, rowY);
      drawText(String(item.name || '').slice(0, 28), leftMargin + 4, rowY + 7, 8);
      drawText(String(item.quantity), leftMargin + 180, rowY + 7, 8);
      drawText(formatCurrency(item.unitCost), leftMargin + 230, rowY + 7, 8);
      drawText(formatCurrency(item.costValue), leftMargin + 320, rowY + 7, 8);
      drawText(formatCurrency(item.retailValue), leftMargin + 430, rowY + 7, 8);
    });

    drawText('This report shows current inventory valuation based on cost and selling price.', leftMargin, 70, 8.5);
    drawText('WWW.PHARMACARE.COM', leftMargin, 50, 8.5);

    const contentStream = contentCommands.join('\n');
    const contentObjectId = addObject(`<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream`);
    const pageObjectId = addObject(`<< /Type /Page /Parent PAGES_ID 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontObjectId} 0 R >> >> /Contents ${contentObjectId} 0 R >>`);
    const pagesObjectId = addObject(`<< /Type /Pages /Count 1 /Kids [${pageObjectId} 0 R] >>`);
    objects[pageObjectId - 1] = objects[pageObjectId - 1].replace('PAGES_ID', String(pagesObjectId));
    const catalogObjectId = addObject(`<< /Type /Catalog /Pages ${pagesObjectId} 0 R >>`);
    const { pdf: pdfBase, xrefStart } = buildSimplePdf(objects);
    const pdf = `${pdfBase}trailer\n<< /Size ${objects.length + 1} /Root ${catalogObjectId} 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
    const blob = new Blob([pdf], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `inventory-valuation-report-${reportMonth}.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadExpiredDamagedLossReport = async () => {
    try {
      const response = await axios.get('/api/medicines/stock-movements');
      const movements = response.data.movements || [];
      const now = new Date();
      const [selectedYear, selectedMonth] = reportMonth.split('-').map(Number);
      const reportRows = movements.filter((movement) => {
        const createdAt = new Date(movement.createdAt);
        return createdAt.getFullYear() === selectedYear
          && createdAt.getMonth() === selectedMonth - 1
          && ['DAMAGED_WRITEOFF', 'EXPIRED_WRITEOFF'].includes(movement.transactionType);
      }).map((movement) => {
        const medicine = medicines.find((item) => item._id === movement.batch?._id || item._id === movement.medicine?._id);
        const unitCost = Number(medicine?.costPrice || medicine?.price || 0);
        return {
          ...movement,
          estimatedLoss: unitCost * Number(movement.quantity || 0)
        };
      });

      const totalLoss = reportRows.reduce((sum, row) => sum + row.estimatedLoss, 0);
      const damagedLoss = reportRows
        .filter((row) => row.transactionType === 'DAMAGED_WRITEOFF')
        .reduce((sum, row) => sum + row.estimatedLoss, 0);
      const expiredLoss = reportRows
        .filter((row) => row.transactionType === 'EXPIRED_WRITEOFF')
        .reduce((sum, row) => sum + row.estimatedLoss, 0);

      const pageWidth = 595;
      const pageHeight = 842;
      const leftMargin = 42;
      const topY = 792;
      const objects = [];
      const addObject = (content) => {
        objects.push(content);
        return objects.length;
      };
      const fontObjectId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
      const contentCommands = [];
      const drawText = (text, x, y, size = 11) => {
        contentCommands.push(`BT /F1 ${size} Tf 1 0 0 1 ${x} ${y} Tm (${escapePdfText(text)}) Tj ET`);
      };
      const drawLine = (x1, y1, x2, y2) => {
        contentCommands.push(`${x1} ${y1} m ${x2} ${y2} l S`);
      };
      const drawFilledRect = (x, y, width, height, rgb = [0.98, 0.94, 0.94]) => {
        contentCommands.push(`q ${rgb[0]} ${rgb[1]} ${rgb[2]} rg ${x} ${y} ${width} ${height} re f Q`);
      };

      drawFilledRect(leftMargin, topY - 18, 510, 42, [0.98, 0.95, 0.95]);
      drawText('PharmaCare', leftMargin + 12, topY, 22);
      drawText('Expired / Damaged Loss Report', leftMargin + 12, topY - 22, 15);
      drawText(`Generated: ${now.toLocaleString()}`, pageWidth - 190, topY - 10, 9);
      drawLine(leftMargin, topY - 64, pageWidth - leftMargin, topY - 64);

      drawFilledRect(leftMargin, topY - 150, 510, 70, [0.99, 0.96, 0.94]);
      drawText(`Transactions: ${reportRows.length}`, leftMargin + 12, topY - 104, 10);
      drawText(`Expired Loss: ${formatCurrency(expiredLoss)}`, leftMargin + 180, topY - 104, 10);
      drawText(`Damaged Loss: ${formatCurrency(damagedLoss)}`, leftMargin + 340, topY - 104, 10);
      drawText(`Total Profit Impact: ${formatCurrency(totalLoss)}`, leftMargin + 12, topY - 128, 10);

      const tableTop = topY - 190;
      const rowHeight = 22;
      drawFilledRect(leftMargin, tableTop, 510, rowHeight, [0.94, 0.89, 0.89]);
      [
        ['Date', leftMargin + 4],
        ['Medicine', leftMargin + 80],
        ['Type', leftMargin + 250],
        ['Qty', leftMargin + 360],
        ['Reason', leftMargin + 400],
        ['Loss', leftMargin + 500]
      ].forEach(([label, x]) => drawText(label, x, tableTop + 7, 8.5));
      drawLine(leftMargin, tableTop, pageWidth - leftMargin, tableTop);
      drawLine(leftMargin, tableTop + rowHeight, pageWidth - leftMargin, tableTop + rowHeight);

      reportRows.slice(0, 22).forEach((row, index) => {
        const rowY = tableTop - rowHeight * (index + 1);
        drawLine(leftMargin, rowY, pageWidth - leftMargin, rowY);
        drawText(new Date(row.createdAt).toLocaleDateString(), leftMargin + 4, rowY + 7, 8);
        drawText(String(row.medicine?.name || '').slice(0, 26), leftMargin + 80, rowY + 7, 8);
        drawText(String(row.transactionType).replace('_', ' ').slice(0, 15), leftMargin + 250, rowY + 7, 8);
        drawText(String(row.quantity), leftMargin + 360, rowY + 7, 8);
        drawText(String(row.reason || '').slice(0, 15), leftMargin + 400, rowY + 7, 8);
        drawText(formatCurrency(row.estimatedLoss), leftMargin + 500, rowY + 7, 8);
      });

      drawText('This report estimates inventory loss impact from expired and damaged write-offs.', leftMargin, 70, 8.5);
      drawText('WWW.PHARMACARE.COM', leftMargin, 50, 8.5);

      const contentStream = contentCommands.join('\n');
      const contentObjectId = addObject(`<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream`);
      const pageObjectId = addObject(`<< /Type /Page /Parent PAGES_ID 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontObjectId} 0 R >> >> /Contents ${contentObjectId} 0 R >>`);
      const pagesObjectId = addObject(`<< /Type /Pages /Count 1 /Kids [${pageObjectId} 0 R] >>`);
      objects[pageObjectId - 1] = objects[pageObjectId - 1].replace('PAGES_ID', String(pagesObjectId));
      const catalogObjectId = addObject(`<< /Type /Catalog /Pages ${pagesObjectId} 0 R >>`);
      const { pdf: pdfBase, xrefStart } = buildSimplePdf(objects);
      const pdf = `${pdfBase}trailer\n<< /Size ${objects.length + 1} /Root ${catalogObjectId} 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
      const blob = new Blob([pdf], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `expired-damaged-loss-report-${reportMonth}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to generate loss report: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <AdminPageHeader
        title="Inventory Management"
        subtitle="Control medicine quantities, low-stock thresholds, cart reservations, and stock movements from one branded operations workspace."
        icon={Package}
        action={(
          <div className="flex flex-wrap gap-3">
            <button
              onClick={downloadInventoryValuationReport}
              className="btn-secondary flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Valuation Report
            </button>
            <button
              onClick={downloadExpiredDamagedLossReport}
              className="btn-secondary flex items-center gap-2"
            >
              <AlertTriangle className="h-4 w-4" />
              Loss Report
            </button>
            <button
              onClick={() => openLedgerModal()}
              className="btn-secondary flex items-center gap-2"
            >
              <History className="h-4 w-4" />
              Stock Ledger
            </button>
            <button
              onClick={openCartModal}
              className="btn-secondary flex items-center gap-2"
            >
              <ShoppingCart className="h-4 w-4" />
              Cart Connection
            </button>
          </div>
        )}
      />

      <div className="mb-8">
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="card bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Medicines</p>
                <p className="text-2xl font-bold text-gray-900">{totalMedicines}</p>
              </div>
              <Package className="h-8 w-8 text-medical-600" />
            </div>
          </div>
          <div className="card bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-red-600">{lowStockCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <div className="card bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Discontinued</p>
                <p className="text-2xl font-bold text-gray-600">{discontinuedCount}</p>
              </div>
              <X className="h-8 w-8 text-gray-600" />
            </div>
          </div>
          <div className="card bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Quantity</p>
                <p className="text-2xl font-bold text-blue-600">{totalQuantity}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="card mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-64 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search medicines..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-500" />
            <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
              <CalendarDays className="h-4 w-4 text-gray-500" />
              <input
                type="month"
                value={reportMonth}
                onChange={(e) => setReportMonth(e.target.value)}
                className="bg-transparent text-sm text-gray-700 outline-none"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="input w-40"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input w-40"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="discontinued">Discontinued</option>
              <option value="lowstock">Low Stock</option>
            </select>
            <button
              onClick={fetchMedicines}
              className="btn-secondary p-2"
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        <span className="font-semibold">FEFO (First Expired, First Out):</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">Use First</span>
        <span className="text-blue-700">= Oldest expiry - sell this batch first</span>
        <span className="mx-2 text-blue-300">|</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">2nd in queue</span>
        <span className="text-blue-700">= Next batch to use after Use First is empty</span>
        <span className="mx-2 text-blue-300">|</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500">Expired</span>
        <span className="text-blue-700">= Must not be sold</span>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading medicines...</div>
        ) : filteredMedicines.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No medicines found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Medicine</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch / LOT</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">FEFO Order</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiry</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Threshold</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredMedicines.map((medicine) => {
                  const quantity = Number(medicine.quantity ?? medicine.stockQuantity ?? 0);
                  const threshold = Number(medicine.thresholdValue || 10);
                  const expiryDate = medicine.expiryDate ? new Date(medicine.expiryDate) : null;
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const normalizedExpiry = expiryDate ? new Date(expiryDate) : null;
                  if (normalizedExpiry) normalizedExpiry.setHours(0, 0, 0, 0);
                  const isExpiredBatch = normalizedExpiry ? normalizedExpiry < today : false;
                  const sameMedicineBatches = filteredMedicines.filter(
                    (m) => m.name === medicine.name && m.category === medicine.category && !m.isDiscontinued
                  );
                  const validBatches = sameMedicineBatches
                    .filter((m) => {
                      const exp = m.expiryDate ? new Date(m.expiryDate) : null;
                      if (exp) exp.setHours(0, 0, 0, 0);
                      return exp && exp >= today;
                    })
                    .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
                  const fefoRank = validBatches.findIndex((m) => m._id === medicine._id);

                  return (
                    <tr
                      key={medicine._id}
                      className={`
                        hover:bg-gray-50
                        ${medicine.isDiscontinued ? 'opacity-50' : ''}
                        ${fefoRank === 0 && !isExpiredBatch ? 'bg-emerald-50/40 ring-1 ring-inset ring-emerald-200' : ''}
                      `}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-lg bg-medical-100 flex items-center justify-center">
                            <Package className="h-5 w-5 text-medical-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{medicine.name}</div>
                            <div className="text-sm text-gray-500">{medicine.genericName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {medicine.batchNo || 'Main Batch'}
                      </td>
                      <td className="px-6 py-4">
                        {isExpiredBatch ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
                            Expired
                          </span>
                        ) : fefoRank === 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                            Use First
                          </span>
                        ) : fefoRank === 1 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                            2nd in queue
                          </span>
                        ) : fefoRank > 1 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500">
                            #{fefoRank + 1} in queue
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-400">
                            N/A
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{medicine.category}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {medicine.expiryDate ? new Date(medicine.expiryDate).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${
                            (quantity <= threshold || isExpiredBatch) && !medicine.isDiscontinued ? 'text-red-600' : 'text-gray-900'
                          }`}>
                            {quantity} {medicine.unit}
                          </span>
                          {isExpiredBatch && (
                            <span className="px-2 py-1 bg-rose-100 text-rose-700 text-xs rounded">
                              Expired
                            </span>
                          )}
                          {quantity <= threshold && !medicine.isDiscontinued && (
                            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
                              Low
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {threshold} {medicine.unit}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatCurrency(medicine.price)}
                      </td>
                      <td className="px-6 py-4">
                        {medicine.isDiscontinued ? (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            Discontinued
                          </span>
                        ) : isExpiredBatch ? (
                          <span className="px-2 py-1 bg-rose-100 text-rose-700 text-xs rounded">
                            Auto-blocked Expired
                          </span>
                        ) : quantity === 0 ? (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">
                            Out of Stock
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                            Available
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openStockModal(medicine)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Update Stock"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openLedgerModal(medicine)}
                            className="p-1 text-slate-600 hover:bg-slate-100 rounded"
                            title="View Ledger"
                          >
                            <History className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(medicine)}
                            className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDiscontinue(medicine)}
                            className="p-1 text-yellow-600 hover:bg-yellow-50 rounded"
                            title={medicine.isDiscontinued ? 'Mark Available' : 'Discontinue'}
                          >
                            <X className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(medicine._id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">
                {editingMedicine ? 'Edit Medicine' : 'Add Medicine'}
              </h2>
              <button onClick={closeModal} className="p-1 hover:bg-gray-100 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Medicine Name *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="input w-full" required />
                </div>
                <div>
                  <label className="label">Generic Name</label>
                  <input type="text" name="genericName" value={formData.genericName} onChange={handleInputChange} className="input w-full" />
                </div>
                <div>
                  <label className="label">Manufacturer</label>
                  <input type="text" name="manufacturer" value={formData.manufacturer} onChange={handleInputChange} className="input w-full" />
                </div>
                <div>
                  <label className="label">Category *</label>
                  <select name="category" value={formData.category} onChange={handleInputChange} className="input w-full" required>
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Unit</label>
                  <select name="unit" value={formData.unit} onChange={handleInputChange} className="input w-full">
                    {units.map((unit) => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Price (LKR) *</label>
                  <input type="number" name="price" value={formData.price} onChange={handleInputChange} className="input w-full" step="0.01" required />
                </div>
                <div>
                  <label className="label">Initial Quantity *</label>
                  <input type="number" name="quantity" value={formData.quantity} onChange={handleInputChange} className="input w-full" min="0" required />
                </div>
                <div>
                  <label className="label">Threshold Value *</label>
                  <input type="number" name="thresholdValue" value={formData.thresholdValue} onChange={handleInputChange} className="input w-full" min="1" required />
                </div>
                <div>
                  <label className="label">Expiry Date</label>
                  <input type="date" name="expiryDate" value={formData.expiryDate} onChange={handleInputChange} className="input w-full" />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input type="checkbox" name="isDiscontinued" checked={formData.isDiscontinued} onChange={handleInputChange} className="h-4 w-4" />
                  <label className="text-sm">Mark as Discontinued</label>
                </div>
              </div>
              <div>
                <label className="label">Description</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} className="input w-full" rows="3" />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={closeModal} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  {editingMedicine ? 'Update Medicine' : 'Add Medicine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showStockModal && selectedMedicine && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="card w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Update Stock</h2>
              <button onClick={closeStockModal} className="p-1 hover:bg-gray-100 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <p className="font-medium">{selectedMedicine.name}</p>
              <p className="text-sm text-gray-600">
                Current: {selectedMedicine.quantity ?? selectedMedicine.stockQuantity ?? 0} {selectedMedicine.unit} |
                Threshold: {selectedMedicine.thresholdValue || 10} {selectedMedicine.unit}
              </p>
            </div>
            <form onSubmit={handleStockUpdate} className="space-y-4">
              <div>
                <label className="label">Operation</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="type"
                      value="refill"
                      checked={stockUpdate.type === 'refill'}
                      onChange={(e) => setStockUpdate({ ...stockUpdate, type: e.target.value, transactionType: 'PURCHASE_IN' })}
                      className="h-4 w-4"
                    />
                    <ArrowUp className="h-4 w-4 text-green-600" />
                    Refill
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="type"
                      value="sale"
                      checked={stockUpdate.type === 'sale'}
                      onChange={(e) => setStockUpdate({ ...stockUpdate, type: e.target.value, transactionType: 'MANUAL_ADJUSTMENT_OUT' })}
                      className="h-4 w-4"
                    />
                    <ArrowDown className="h-4 w-4 text-red-600" />
                    Sale
                  </label>
                </div>
              </div>
              <div>
                <label className="label">Transaction Type</label>
                <select
                  value={stockUpdate.transactionType}
                  onChange={(e) => setStockUpdate({ ...stockUpdate, transactionType: e.target.value })}
                  className="input w-full"
                >
                  {stockUpdate.type === 'refill' ? (
                    <>
                      <option value="PURCHASE_IN">Purchase IN</option>
                      <option value="CUSTOMER_RETURN_IN">Customer Return IN</option>
                      <option value="MANUAL_ADJUSTMENT_IN">Manual Adjustment IN</option>
                    </>
                  ) : (
                    <>
                      <option value="SALE_OUT">Sale OUT</option>
                      <option value="CUSTOMER_RETURN_OUT">Customer Return OUT</option>
                      <option value="DAMAGED_WRITEOFF">Damaged Write-off</option>
                      <option value="EXPIRED_WRITEOFF">Expired Write-off</option>
                      <option value="MANUAL_ADJUSTMENT_OUT">Manual Adjustment OUT</option>
                    </>
                  )}
                </select>
              </div>
              <div>
                <label className="label">Quantity</label>
                <input
                  type="number"
                  value={stockUpdate.quantity}
                  onChange={(e) => setStockUpdate({ ...stockUpdate, quantity: e.target.value })}
                  className="input w-full"
                  min="1"
                  required
                />
              </div>
              {stockUpdate.type === 'refill' && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-4">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={stockUpdate.createNewBatch}
                      onChange={(e) => setStockUpdate({ ...stockUpdate, createNewBatch: e.target.checked })}
                      className="h-4 w-4"
                    />
                    Record as New Batch / LOT stock-in
                  </label>

                  {stockUpdate.createNewBatch && (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="label">Batch / LOT No</label>
                        <input
                          type="text"
                          value={stockUpdate.batchNo}
                          onChange={(e) => setStockUpdate({ ...stockUpdate, batchNo: e.target.value })}
                          className="input w-full"
                          placeholder="Enter batch number"
                        />
                      </div>
                      <div>
                        <label className="label">Expiry Date</label>
                        <input
                          type="date"
                          value={stockUpdate.expiryDate}
                          onChange={(e) => setStockUpdate({ ...stockUpdate, expiryDate: e.target.value })}
                          className="input w-full"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div>
                <label className="label">Reason / Notes</label>
                <input
                  type="text"
                  value={stockUpdate.reason}
                  onChange={(e) => setStockUpdate({ ...stockUpdate, reason: e.target.value })}
                  className="input w-full"
                  placeholder="Reason is required for audit trail"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={closeStockModal} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Update Stock</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCartModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="card w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Cart Integration
              </h2>
              <button onClick={closeCartModal} className="p-1 hover:bg-gray-100 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-900">Inventory-Cart Connection</h3>
                <p className="text-sm text-blue-700 mt-1">
                  This shows the real cart quantities reserved by customers so you can compare them with available stock.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-white border rounded-lg">
                  <p className="text-sm text-gray-500">Active Carts</p>
                  <p className="text-2xl font-bold text-gray-900">{cartSummary.activeCarts}</p>
                </div>
                <div className="p-4 bg-white border rounded-lg">
                  <p className="text-sm text-gray-500">Reserved Quantity</p>
                  <p className="text-2xl font-bold text-blue-600">{cartSummary.totalReservedQuantity}</p>
                </div>
                <div className="p-4 bg-white border rounded-lg">
                  <p className="text-sm text-gray-500">Cart Value</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(cartSummary.totalCartValue)}</p>
                </div>
              </div>

              {cartSummary.medicines.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No active cart items found</p>
                  <p className="text-sm mt-1">
                    Customer cart quantities will appear here after medicines are added to carts.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {cartSummary.medicines.map((item) => {
                    const availableQuantity = Number(item.stockQuantity || 0);
                    const remainingQuantity = Math.max(availableQuantity - item.reservedQuantity, 0);
                    return (
                      <div key={item.medicineId} className="p-4 border rounded-lg flex items-center justify-between gap-4">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-gray-500">
                            Reserved in carts: {item.reservedQuantity} {item.unit}
                          </p>
                          <p className="text-sm text-gray-500">
                            Active carts: {item.activeCarts}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(item.price * item.reservedQuantity)}</p>
                          <p className="text-sm text-gray-500">Stock: {availableQuantity} {item.unit}</p>
                          <p className={`text-sm ${availableQuantity >= item.reservedQuantity ? 'text-green-600' : 'text-red-600'}`}>
                            {availableQuantity >= item.reservedQuantity
                              ? `Remaining after carts: ${remainingQuantity} ${item.unit}`
                              : 'Reserved quantity exceeds stock'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Inventory Integration Features:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>- Real-time stock validation during cart checkout</li>
                  <li>- Automatic quantity reduction on order completion</li>
                  <li>- Low stock alerts help prevent overselling</li>
                  <li>- Discontinued items are blocked from cart</li>
                </ul>
              </div>

              <div className="flex justify-end pt-4">
                <button onClick={closeCartModal} className="btn-secondary">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showLedgerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="card w-full max-w-6xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Stock Movement Ledger + Audit Trail
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {ledgerMedicine ? `Showing movements for ${ledgerMedicine.name}` : 'Showing recent inventory movements across all medicines'}
                </p>
              </div>
              <button onClick={closeLedgerModal} className="p-1 hover:bg-gray-100 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>

            {stockMovements.length === 0 ? (
              <div className="py-10 text-center text-gray-500">
                No stock transactions found yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Medicine</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Direction</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Before</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">After</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Changed By</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {stockMovements.map((movement) => (
                      <tr key={movement._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(movement.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {movement.medicine?.name || 'Medicine'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {movement.batchNo || movement.batch?.batchNo || 'Main Batch'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{movement.transactionType}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs rounded ${
                            movement.direction === 'IN'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {movement.direction}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{movement.quantity}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{movement.beforeQuantity}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{movement.afterQuantity}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {movement.changedBy?.name || 'System'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {movement.reason}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-6 rounded-lg bg-slate-50 p-4">
              <h4 className="font-medium mb-2">Tracked transaction types</h4>
              <p className="text-sm text-gray-600">
                Purchase IN, Sale OUT, Customer Return IN/OUT, Damaged/Expired write-off, and Manual Adjustments are all recorded with user, timestamp, quantity, and reason.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManagement;
