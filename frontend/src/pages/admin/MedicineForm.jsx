import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, AlertCircle, CheckCircle, Clock3, ImagePlus, Layers, PencilLine, Plus, Trash2, X } from 'lucide-react';

const getTodayDateString = () => new Date().toISOString().split('T')[0];
const medicineCategories = [
  'Pain Relief & Fever',
  'Antibiotics',
  'Allergy & Antihistamines',
  'Cough, Cold & Flu',
  'Gastric & Digestion',
  'Diabetes',
  'Heart & Blood Pressure',
  'Respiratory',
  'Skin Care & Dermatology',
  'Eye / Ear / Nose (ENT)',
  'Vitamins & Supplements',
  'Women’s Health',
  'Men’s Health',
  'Children’s Medicines',
  'Fungal / Anti-parasitic',
  'Mental Health',
  'First Aid & Wound Care',
  'Medical Devices & Accessories',
  'Personal Care',
  'Emergency / Injectable'
];
const dosageOptions = ['Tablet', 'Capsule', 'Syrup', 'Cream', 'Injection', 'Drops'];
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
const medicineCategoryMap = {
  'Pain Relief & Fever (Analgesics / Antipyretics)': [
    'Paracetamol',
    'Ibuprofen',
    'Diclofenac',
    'Muscle pain gels'
  ],
  'Antibiotics': [
    'Penicillins (Amoxicillin)',
    'Cephalosporins',
    'Macrolides (Azithromycin)',
    'Topical antibiotics (ointment)'
  ],
  'Allergy & Antihistamines': [
    'Cetirizine',
    'Loratadine',
    'Chlorpheniramine',
    'Allergy nasal sprays'
  ],
  'Cough, Cold & Flu': [
    'Cough syrups',
    'Decongestants',
    'Throat lozenges',
    'Flu combo tablets'
  ],
  'Gastric & Digestion': [
    'Antacids',
    'PPIs (Omeprazole)',
    'H2 blockers',
    'Anti-diarrheal',
    'Laxatives'
  ],
  'Diabetes': [
    'Metformin',
    'Insulin',
    'Glucose strips',
    'Diabetic supplements'
  ],
  'Heart & Blood Pressure (Cardiovascular)': [
    'Amlodipine',
    'Losartan',
    'Aspirin (low dose)',
    'Cholesterol medicines (Statins)'
  ],
  'Respiratory (Asthma / COPD)': [
    'Inhalers',
    'Nebulizer solutions',
    'Steroid inhalers',
    'Anti-allergy inhalers'
  ],
  'Skin Care & Dermatology': [
    'Creams & ointments',
    'Anti-fungal creams',
    'Anti-acne products',
    'Scabies treatments'
  ],
  'Eye / Ear / Nose (ENT)': [
    'Eye drops',
    'Ear drops',
    'Nasal sprays',
    'Saline solutions'
  ],
  'Vitamins & Supplements': [
    'Multivitamins',
    'Vitamin C / D / B complex',
    'Calcium & Iron',
    'Herbal supplements'
  ],
  "Women's Health": [
    'Pregnancy vitamins',
    'Contraceptives',
    'PCOS / period pain medicines',
    'Feminine hygiene products'
  ],
  "Men's Health": [
    'Prostate health',
    'Erectile dysfunction (Rx)',
    "Men's supplements"
  ],
  "Children's Medicines (Pediatrics)": [
    'Syrups',
    'Drops',
    'Pediatric vitamins',
    'Teething gels'
  ],
  'Fungal / Anti-parasitic': [
    'Antifungal tablets / creams',
    'Deworming tablets (Albendazole)',
    'Anti-scabies lotions'
  ],
  'Mental Health (Psychiatric)': [
    'Antidepressants (Rx)',
    'Anxiety medicines (Rx)',
    'Sleep aids (Rx)'
  ],
  'First Aid & Wound Care': [
    'Bandages & gauze',
    'Antiseptics',
    'Burn creams',
    'Pain relief sprays'
  ],
  'Medical Devices & Accessories': [
    'Thermometers',
    'BP monitors',
    'Glucometers',
    'Nebulizers'
  ],
  'Personal Care': [
    'Soaps & shampoos',
    'Oral care (toothpaste / mouthwash)',
    'Hand sanitizers'
  ],
  'Emergency / Injectable': [
    'Emergency injections (Rx)',
    'IV fluids (hospital use)',
    'Syringes / needles (policy based)'
  ]
};
const medicineCategoryOptions = Object.keys(medicineCategoryMap);
const medicineSuggestionCatalog = [
  {
    name: 'Paracetamol',
    category: 'Pain Relief & Fever (Analgesics / Antipyretics)',
    subCategory: 'Paracetamol',
    aliases: ['paracetamol', 'panadol', 'opandol', 'calpol']
  },
  {
    name: 'Ibuprofen',
    category: 'Pain Relief & Fever (Analgesics / Antipyretics)',
    subCategory: 'Ibuprofen',
    aliases: ['ibuprofen', 'brufen', 'advil', 'nurofen']
  },
  {
    name: 'Cetirizine',
    category: 'Allergy & Antihistamines',
    subCategory: 'Cetirizine',
    aliases: ['cetirizine', 'zyrtec']
  },
  {
    name: 'Loratadine',
    category: 'Allergy & Antihistamines',
    subCategory: 'Loratadine',
    aliases: ['loratadine', 'claritin']
  },
  {
    name: 'Amoxicillin',
    category: 'Antibiotics',
    subCategory: 'Penicillins (Amoxicillin)',
    aliases: ['amoxicillin', 'amoxil']
  },
  {
    name: 'Azithromycin',
    category: 'Antibiotics',
    subCategory: 'Macrolides (Azithromycin)',
    aliases: ['azithromycin', 'zithromax']
  },
  {
    name: 'Omeprazole',
    category: 'Gastric & Digestion',
    subCategory: 'PPIs (Omeprazole)',
    aliases: ['omeprazole', 'losec']
  },
  {
    name: 'Metformin',
    category: 'Diabetes',
    subCategory: 'Metformin',
    aliases: ['metformin', 'glucophage']
  },
  {
    name: 'Amlodipine',
    category: 'Heart & Blood Pressure (Cardiovascular)',
    subCategory: 'Amlodipine',
    aliases: ['amlodipine', 'norvasc']
  },
  {
    name: 'Vitamin C',
    category: 'Vitamins & Supplements',
    subCategory: 'Vitamin C / D / B complex',
    aliases: ['vitamin c', 'vit c', 'ascorbic acid', 'cee']
  },
  {
    name: 'Vitamin D',
    category: 'Vitamins & Supplements',
    subCategory: 'Vitamin C / D / B complex',
    aliases: ['vitamin d', 'vit d', 'cholecalciferol']
  },
  {
    name: 'B Complex',
    category: 'Vitamins & Supplements',
    subCategory: 'Vitamin C / D / B complex',
    aliases: ['b complex', 'vitamin b complex', 'becosules']
  }
];

const normalizeSuggestionText = (value) =>
  value
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const getMedicineSuggestions = (medicineName) => {
  const normalizedName = normalizeSuggestionText(medicineName);

  if (!normalizedName) {
    return [];
  }

  const nameWords = normalizedName.split(' ').filter(Boolean);

  return medicineSuggestionCatalog
    .map((entry) => {
      const candidates = [entry.name, ...(entry.aliases || [])].map(normalizeSuggestionText);
      let bestScore = 0;

      for (const candidate of candidates) {
        if (!candidate) {
          continue;
        }

        if (candidate === normalizedName) {
          bestScore = Math.max(bestScore, 100);
          continue;
        }

        if (candidate.startsWith(normalizedName) || normalizedName.startsWith(candidate)) {
          bestScore = Math.max(bestScore, 92);
        }

        const candidateWords = candidate.split(' ').filter(Boolean);
        const overlapCount = nameWords.filter((word) => candidateWords.includes(word)).length;

        if (overlapCount > 0) {
          const coverageScore = overlapCount / nameWords.length;
          const candidateCoverageScore = overlapCount / candidateWords.length;
          const score = coverageScore * 70 + candidateCoverageScore * 30;
          bestScore = Math.max(bestScore, score);
        }
      }

      return {
        ...entry,
        score: bestScore
      };
    })
    .filter((entry) => entry.score >= 60)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
};
const getBatchExpiryStatus = (expiryDate) => {
  if (!expiryDate) {
    return { label: 'No expiry', classes: 'bg-slate-100 text-slate-600' };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);

  if (expiry < today) {
    return { label: 'Expired', classes: 'bg-rose-100 text-rose-700' };
  }

  const soon = new Date(today);
  soon.setDate(soon.getDate() + 30);

  if (expiry <= soon) {
    return { label: 'Expires soon', classes: 'bg-amber-100 text-amber-700' };
  }

  return { label: 'Fresh batch', classes: 'bg-emerald-100 text-emerald-700' };
};

const getProfitMetrics = (costPrice, sellingPrice) => {
  const parsedCostPrice = Number(costPrice);
  const parsedSellingPrice = Number(sellingPrice);

  if (!Number.isFinite(parsedCostPrice) || !Number.isFinite(parsedSellingPrice)) {
    return { profitAmount: 0, profitMargin: 0 };
  }

  const profitAmount = parsedSellingPrice - parsedCostPrice;
  const profitMargin = parsedCostPrice > 0 ? (profitAmount / parsedCostPrice) * 100 : 0;

  return {
    profitAmount,
    profitMargin,
  };
};

const normalizeMoneyValue = (value) => {
  if (value === '') {
    return '';
  }

  const parsedValue = Number(value);
  if (!Number.isFinite(parsedValue)) {
    return value;
  }

  return parsedValue.toFixed(2);
};

const MedicineForm = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isEdit = Boolean(id);
  const minExpiryDate = getTodayDateString();
  const activeTab = isEdit && searchParams.get('tab') === 'batches' ? 'batches' : 'details';
  const basePath = location.pathname.startsWith('/pharmacist') ? '/pharmacist/medicines' : '/admin/medicines';
  
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    subCategory: '',
    description: '',
    costPrice: '',
    sellingPrice: '',
    stockQuantity: '',
    expiryDate: '',
    manufacturer: '',
    supplier: '',
    requiresPrescription: false,
    dosage: '',
    strength: '',
    batchNo: '',
    image: null,
    sideEffects: ''
  });

  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [imageError, setImageError] = useState('');
  const [medicineSuggestions, setMedicineSuggestions] = useState([]);
  const [batches, setBatches] = useState([]);
  const [batchesLoading, setBatchesLoading] = useState(false);
  const [batchActionLoading, setBatchActionLoading] = useState(false);
  const [batchMessage, setBatchMessage] = useState('');
  const [newBatch, setNewBatch] = useState({
    batchNo: '',
    expiryDate: '',
    stockQuantity: ''
  });
  const [batchEdits, setBatchEdits] = useState({});

  useEffect(() => {
    fetchSuppliers();
    if (isEdit) {
      fetchMedicine();
    }
  }, [id]);

  const fetchSuppliers = async () => {
    try {
      const response = await axios.get('/api/suppliers', { params: { status: 'active' } });
      setSuppliers(response.data.suppliers || []);
    } catch (err) {
      console.error('Error fetching suppliers:', err);
      setError(err.response?.data?.message || 'Failed to load available suppliers');
    }
  };

  const fetchMedicine = async () => {
    try {
      const response = await axios.get(`/api/medicines/${id}`);
      const medicine = response.data.medicine;
      setFormData({
        name: medicine.name,
        category: medicine.category,
        subCategory: medicine.subCategory || '',
        description: medicine.description || '',
        costPrice: medicine.costPrice?.toString() || '',
        sellingPrice: (medicine.sellingPrice ?? medicine.price)?.toString() || '',
        stockQuantity: medicine.stockQuantity.toString(),
        expiryDate: medicine.expiryDate ? new Date(medicine.expiryDate).toISOString().split('T')[0] : '',
        manufacturer: medicine.manufacturer || '',
        supplier: medicine.supplier?._id || medicine.supplier,
        requiresPrescription: medicine.requiresPrescription,
        dosage: medicine.dosage || '',
        strength: medicine.strength || '',
        batchNo: medicine.batchNo || '',
        image: null,
        sideEffects: medicine.sideEffects || ''
      });
      setImagePreview(medicine.image || '');
    } catch (err) {
      setError('Failed to load medicine data');
    }
  };

  useEffect(() => {
    if (isEdit && activeTab === 'batches') {
      fetchBatches();
    }
  }, [activeTab, id, isEdit]);

  useEffect(() => {
    return () => {
      if (formData.image && imagePreview?.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [formData.image, imagePreview]);

  const fetchBatches = async () => {
    try {
      setBatchesLoading(true);
      const response = await axios.get(`/api/medicines/${id}/batches`);
      const nextBatches = response.data.batches || [];
      setBatches(nextBatches);
      setBatchEdits(
        nextBatches.reduce((acc, batch) => {
          acc[batch._id] = {
            stockQuantity: String(batch.stockQuantity ?? 0)
          };
          return acc;
        }, {})
      );
      setBatchMessage('');
    } catch (err) {
      setBatchMessage(err.response?.data?.message || 'Failed to load medicine batches');
    } finally {
      setBatchesLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === 'name') {
      const suggestions = getMedicineSuggestions(value);
      const topSuggestion = suggestions[0];

      setMedicineSuggestions(suggestions);
      setFormData((prev) => ({
        ...prev,
        name: value,
        category: prev.category || topSuggestion?.category || '',
        subCategory: prev.subCategory || topSuggestion?.subCategory || ''
      }));
      return;
    }

    if (name === 'category') {
      setMedicineSuggestions([]);
      setFormData((prev) => ({
        ...prev,
        category: value,
        subCategory: ''
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const applyMedicineSuggestion = (suggestion) => {
    setFormData((prev) => ({
      ...prev,
      name: suggestion.name,
      category: suggestion.category,
      subCategory: suggestion.subCategory || ''
    }));
    setMedicineSuggestions([]);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0] || null;

    if (!file) {
      return;
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setImageError('Please upload a JPG or PNG image only.');
      e.target.value = '';
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setImageError('Image size must be 5 MB or less.');
      e.target.value = '';
      return;
    }

    setImageError('');

    if (imagePreview?.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }

    setFormData((prev) => ({
      ...prev,
      image: file
    }));

    setImagePreview(URL.createObjectURL(file));
  };

  const removeSelectedImage = () => {
    if (imagePreview?.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }

    setFormData((prev) => ({
      ...prev,
      image: null
    }));
    setImagePreview('');
    setImageError('');
  };

  const handleMoneyBlur = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: normalizeMoneyValue(value)
    }));
  };

  const switchTab = (tab) => {
    if (tab === 'details') {
      setSearchParams({});
      return;
    }

    setSearchParams({ tab });
  };

  const handleNewBatchChange = (e) => {
    const { name, value } = e.target;
    setNewBatch((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBatchQtyChange = (batchId, value) => {
    setBatchEdits((prev) => ({
      ...prev,
      [batchId]: {
        ...prev[batchId],
        stockQuantity: value
      }
    }));
  };

  const addBatch = async () => {
    if (!newBatch.batchNo || !newBatch.expiryDate || newBatch.stockQuantity === '') {
      setBatchMessage('Batch number, expiry date, and quantity are required.');
      return;
    }

    try {
      setBatchActionLoading(true);
      await axios.post(`/api/medicines/${id}/batches`, {
        batchNo: newBatch.batchNo,
        expiryDate: newBatch.expiryDate,
        stockQuantity: Number.parseInt(newBatch.stockQuantity, 10)
      });
      setNewBatch({
        batchNo: '',
        expiryDate: '',
        stockQuantity: ''
      });
      setBatchMessage('New batch added successfully.');
      fetchBatches();
    } catch (err) {
      setBatchMessage(err.response?.data?.message || 'Failed to add batch');
    } finally {
      setBatchActionLoading(false);
    }
  };

  const saveBatchQty = async (batchId) => {
    try {
      setBatchActionLoading(true);
      await axios.put(`/api/medicines/${id}/batches/${batchId}`, {
        stockQuantity: Number.parseInt(batchEdits[batchId]?.stockQuantity || '0', 10)
      });
      setBatchMessage('Batch quantity updated successfully.');
      fetchBatches();
    } catch (err) {
      setBatchMessage(err.response?.data?.message || 'Failed to update batch quantity');
    } finally {
      setBatchActionLoading(false);
    }
  };

  const deactivateBatch = async (batchId) => {
    if (!window.confirm('Deactivate this batch? It will be removed from active stock.')) {
      return;
    }

    try {
      setBatchActionLoading(true);
      await axios.delete(`/api/medicines/${id}/batches/${batchId}`);
      setBatchMessage('Batch deactivated successfully.');
      fetchBatches();
    } catch (err) {
      setBatchMessage(err.response?.data?.message || 'Failed to deactivate batch');
    } finally {
      setBatchActionLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.expiryDate < minExpiryDate) {
      setError('Expiry date cannot be in the past.');
      setLoading(false);
      return;
    }

    if (formData.image && formData.image.size > MAX_IMAGE_SIZE_BYTES) {
      setError('Image size must be 5 MB or less.');
      setLoading(false);
      return;
    }

    const parsedCostPrice = parseFloat(formData.costPrice);
    const parsedSellingPrice = parseFloat(formData.sellingPrice);

    if (Number.isNaN(parsedCostPrice) || Number.isNaN(parsedSellingPrice)) {
      setError('Cost price and selling price are required.');
      setLoading(false);
      return;
    }

    if (parsedSellingPrice < parsedCostPrice) {
      setError('Selling price cannot be lower than cost price.');
      setLoading(false);
      return;
    }

    const { profitAmount, profitMargin } = getProfitMetrics(parsedCostPrice, parsedSellingPrice);

    const data = new FormData();
    data.append('name', formData.name);
    data.append('category', formData.category);
    data.append('subCategory', formData.subCategory);
    data.append('description', formData.description);
    data.append('costPrice', parsedCostPrice);
    data.append('sellingPrice', parsedSellingPrice);
    data.append('price', parsedSellingPrice);
    data.append('profitAmount', profitAmount);
    data.append('profitMargin', profitMargin);
    data.append('stockQuantity', parseInt(formData.stockQuantity, 10));
    data.append('expiryDate', formData.expiryDate);
    data.append('manufacturer', formData.manufacturer);
    data.append('supplier', formData.supplier);
    data.append('requiresPrescription', formData.requiresPrescription);
    data.append('dosage', formData.dosage);
    data.append('strength', formData.strength);
    data.append('batchNo', formData.batchNo);
    data.append('sideEffects', formData.sideEffects);

    if (formData.image) {
      data.append('image', formData.image);
    }

    try {
      if (isEdit) {
        await axios.put(`/api/medicines/${id}`, data);
      } else {
        await axios.post('/api/medicines', data);
      }
      
      setSuccess(true);
      setTimeout(() => {
        navigate(basePath);
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save medicine');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center">
          <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Medicine {isEdit ? 'Updated' : 'Created'} Successfully!
          </h2>
        </div>
      </div>
    );
  }

  const { profitAmount, profitMargin } = getProfitMetrics(formData.costPrice, formData.sellingPrice);
  const subCategoryOptions = medicineCategoryMap[formData.category] || [];

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => navigate(basePath)}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-5 w-5 mr-2" />
        Back to Medicines
      </button>

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {isEdit ? 'Edit Medicine' : 'Add New Medicine'}
        </h1>
        <p className="text-gray-600 mt-1">
          {isEdit ? 'Update medicine details' : 'Fill in the medicine information'}
        </p>
      </div>

      {isEdit && (
        <div className="mb-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => switchTab('details')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
              activeTab === 'details'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300'
            }`}
          >
            <PencilLine className="h-4 w-4" />
            Details
          </button>
          <button
            type="button"
            onClick={() => switchTab('batches')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
              activeTab === 'batches'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300'
            }`}
          >
            <Layers className="h-4 w-4" />
            Batches
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}

      {isEdit && activeTab === 'batches' ? (
        <div className="space-y-6">
          {batchMessage && (
            <div className={`rounded-lg px-4 py-3 text-sm ${batchMessage.toLowerCase().includes('failed') || batchMessage.toLowerCase().includes('required') ? 'border border-rose-200 bg-rose-50 text-rose-700' : 'border border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
              {batchMessage}
            </div>
          )}

          <div className="card space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Batch Management</h2>
              <p className="mt-1 text-sm text-slate-500">
                Add and manage stock batches for {formData.name || 'this medicine'}.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div>
                <label className="label">Batch No</label>
                <input
                  type="text"
                  name="batchNo"
                  value={newBatch.batchNo}
                  onChange={handleNewBatchChange}
                  className="input"
                  placeholder="B123"
                />
              </div>
              <div>
                <label className="label">Expiry Date</label>
                <input
                  type="date"
                  name="expiryDate"
                  value={newBatch.expiryDate}
                  onChange={handleNewBatchChange}
                  min={minExpiryDate}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Qty</label>
                <input
                  type="number"
                  name="stockQuantity"
                  value={newBatch.stockQuantity}
                  onChange={handleNewBatchChange}
                  min="0"
                  className="input"
                  placeholder="100"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={addBatch}
                  disabled={batchActionLoading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-cyan-700 disabled:opacity-60"
                >
                  <Plus className="h-4 w-4" />
                  Add Batch
                </button>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Active Batches</h3>
                <p className="text-sm text-slate-500">Track FEFO-ready stock and batches that expire soon.</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                {batches.length} active batch{batches.length === 1 ? '' : 'es'}
              </span>
            </div>

            {batchesLoading ? (
              <div className="py-10 text-center text-sm text-slate-500">Loading batches...</div>
            ) : batches.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-500">
                No active batches found for this medicine yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <th className="px-4 py-3">Batch</th>
                      <th className="px-4 py-3">Expiry</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Qty</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {batches.map((batch) => {
                      const expiryMeta = getBatchExpiryStatus(batch.expiryDate);

                      return (
                        <tr key={batch._id} className="align-top">
                          <td className="px-4 py-4">
                            <div className="font-semibold text-slate-900">{batch.batchNo || 'No batch number'}</div>
                            <div className="mt-1 text-xs text-slate-500">{formData.name || batch.name}</div>
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-600">
                            {batch.expiryDate ? new Date(batch.expiryDate).toLocaleDateString() : 'No expiry'}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${expiryMeta.classes}`}>
                                {expiryMeta.label}
                              </span>
                              {expiryMeta.label === 'Expires soon' && <Clock3 className="h-4 w-4 text-amber-500" />}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <input
                              type="number"
                              min="0"
                              value={batchEdits[batch._id]?.stockQuantity ?? ''}
                              onChange={(e) => handleBatchQtyChange(batch._id, e.target.value)}
                              className="input max-w-[120px]"
                            />
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => saveBatchQty(batch._id)}
                                disabled={batchActionLoading}
                                className="rounded-xl bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-800 transition hover:bg-emerald-200 disabled:opacity-60"
                              >
                                Save Qty
                              </button>
                              <button
                                type="button"
                                onClick={() => deactivateBatch(batch._id)}
                                disabled={batchActionLoading}
                                className="inline-flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
                              >
                                <Trash2 className="h-4 w-4" />
                                Deactivate
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
        </div>
      ) : (
      <form onSubmit={handleSubmit} className="card space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="label">Upload Medicine Image</label>
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-cyan-100 p-3 text-cyan-700">
                    <ImagePlus className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Upload Medicine Image</p>
                    <p className="mt-1 text-sm text-slate-500">
                      JPG or PNG only. Maximum upload file size 5 MB.
                    </p>
                  </div>
                </div>
                <label className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-cyan-700">
                  Choose Image
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>

              {imageError && (
                <div className="mt-4 flex items-center rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  <AlertCircle className="mr-2 h-4 w-4" />
                  {imageError}
                </div>
              )}

              {imagePreview && (
                <div className="mt-4 flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4">
                  <img
                    src={imagePreview}
                    alt="Medicine preview"
                    className="h-28 w-28 rounded-xl border border-slate-200 object-cover"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">
                      {formData.image?.name || 'Current medicine image'}
                    </p>
                    {formData.image && (
                      <p className="mt-1 text-sm text-slate-500">
                        {(formData.image.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    )}
                  </div>
                  {formData.image && (
                    <button
                      type="button"
                      onClick={removeSelectedImage}
                      className="inline-flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
                    >
                      <X className="h-4 w-4" />
                      Remove
                    </button>
                  )}
                </div>
              )}
              {!imagePreview && (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
                  No image selected yet.
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="label">Medicine Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="input"
              required
            />
            {medicineSuggestions.length > 0 && (
              <div className="mt-3 rounded-xl border border-slate-200 bg-white shadow-sm">
                {medicineSuggestions.map((suggestion) => (
                  <button
                    key={`${suggestion.name}-${suggestion.category}`}
                    type="button"
                    onClick={() => applyMedicineSuggestion(suggestion)}
                    className="flex w-full items-start justify-between gap-3 border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50 last:border-b-0"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{suggestion.name}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {suggestion.category}
                        {suggestion.subCategory ? ` • ${suggestion.subCategory}` : ''}
                      </p>
                    </div>
                    <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-medium text-cyan-700">
                      {Math.round(suggestion.score)}%
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="label">Category *</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="input"
              required
            >
              <option value="">Select Category</option>
              {!medicineCategoryOptions.includes(formData.category) && formData.category && (
                <option value={formData.category}>{formData.category}</option>
              )}
              {medicineCategoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Sub Category</label>
            <select
              name="subCategory"
              value={formData.subCategory}
              onChange={handleChange}
              className="input"
              disabled={!formData.category}
            >
              <option value="">
                {formData.category ? 'Select Sub Category' : 'Select Category First'}
              </option>
              {!subCategoryOptions.includes(formData.subCategory) && formData.subCategory && (
                <option value={formData.subCategory}>{formData.subCategory}</option>
              )}
              {subCategoryOptions.map((subCategory) => (
                <option key={subCategory} value={subCategory}>
                  {subCategory}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Cost Price (LKR) *</label>
            <input
              type="number"
              name="costPrice"
              value={formData.costPrice}
              onChange={handleChange}
              onBlur={handleMoneyBlur}
              className="input"
              placeholder="LKR"
              min="0"
              step="0.01"
              required
            />
          </div>

          <div>
            <label className="label">Selling Price (LKR) *</label>
            <input
              type="number"
              name="sellingPrice"
              value={formData.sellingPrice}
              onChange={handleChange}
              onBlur={handleMoneyBlur}
              className="input"
              placeholder="LKR"
              min="0"
              step="0.01"
              required
            />
          </div>

          <div>
            <label className="label">Stock Quantity *</label>
            <input
              type="number"
              name="stockQuantity"
              value={formData.stockQuantity}
              onChange={handleChange}
              className="input"
              min="0"
              required
            />
          </div>

          <div>
            <label className="label">Profit</label>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4">
              <p className="text-lg font-semibold text-emerald-800">
                LKR {profitAmount.toFixed(2)}
              </p>
              <p className="mt-1 text-sm text-emerald-600">
                Profit %: {profitMargin.toFixed(2)}%
              </p>
            </div>
          </div>

          <div>
            <label className="label">Expiry Date *</label>
            <input
              type="date"
              name="expiryDate"
              value={formData.expiryDate}
              onChange={handleChange}
              className="input"
              min={minExpiryDate}
              required
            />
          </div>

          <div>
            <label className="label">Manufacturer</label>
            <input
              type="text"
              name="manufacturer"
              value={formData.manufacturer}
              onChange={handleChange}
              className="input"
            />
          </div>

          <div>
            <label className="label">Supplier *</label>
            <select
              name="supplier"
              value={formData.supplier}
              onChange={handleChange}
              className="input"
              required
            >
              <option value="">Select Supplier</option>
              {suppliers.map((supplier) => (
                <option key={supplier._id} value={supplier._id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Dosage</label>
            <select
              name="dosage"
              value={formData.dosage}
              onChange={handleChange}
              className="input"
            >
              <option value="">Select Dosage</option>
              {!dosageOptions.includes(formData.dosage) && formData.dosage && (
                <option value={formData.dosage}>{formData.dosage}</option>
              )}
              {dosageOptions.map((dosage) => (
                <option key={dosage} value={dosage}>
                  {dosage}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Strength</label>
            <input
              type="text"
              name="strength"
              value={formData.strength}
              onChange={handleChange}
              className="input"
              placeholder="e.g., 500mg, 250mg, 5ml"
            />
          </div>

          <div>
            <label className="label">Batch No / Lot No</label>
            <input
              type="text"
              name="batchNo"
              value={formData.batchNo}
              onChange={handleChange}
              className="input"
              placeholder="Enter batch or lot number"
            />
          </div>
        </div>

        <div>
          <label className="label">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="input h-24"
            placeholder="Enter medicine description"
          />
        </div>

        <div>
          <label className="label">Side Effects</label>
          <textarea
            name="sideEffects"
            value={formData.sideEffects}
            onChange={handleChange}
            className="input h-20"
            placeholder="List known side effects"
          />
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="requiresPrescription"
            name="requiresPrescription"
            checked={formData.requiresPrescription}
            onChange={handleChange}
            className="h-4 w-4 text-medical-600 focus:ring-medical-500 border-gray-300 rounded"
          />
          <label htmlFor="requiresPrescription" className="text-sm text-gray-700">
            Requires Prescription
          </label>
        </div>

        <div className="flex space-x-4 pt-4">
          <button
            type="button"
            onClick={() => navigate(basePath)}
            className="flex-1 btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 btn-primary"
          >
            {loading ? 'Saving...' : (isEdit ? 'Update Medicine' : 'Create Medicine')}
          </button>
        </div>
      </form>
      )}
    </div>
  );
};

export default MedicineForm;
