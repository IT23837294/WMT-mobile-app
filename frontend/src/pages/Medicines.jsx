import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Pill, Search, Filter, Package } from 'lucide-react';

const Medicines = () => {
  const [medicines, setMedicines] = useState([]);
  const [filteredMedicines, setFilteredMedicines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [prescriptionFilter, setPrescriptionFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMedicines();
    fetchCategories();
  }, []);

  useEffect(() => {
    let filtered = medicines;
    
    if (searchTerm) {
      filtered = filtered.filter(m => 
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(m => m.category === categoryFilter);
    }
    
    if (prescriptionFilter !== 'all') {
      filtered = filtered.filter(m => 
        prescriptionFilter === 'required' ? m.requiresPrescription : !m.requiresPrescription
      );
    }
    
    setFilteredMedicines(filtered);
  }, [medicines, searchTerm, categoryFilter, prescriptionFilter]);

  const fetchMedicines = async () => {
    try {
      const response = await axios.get('/api/medicines?summary=true');
      setMedicines(response.data.medicines || []);
      setFilteredMedicines(response.data.medicines || []);
    } catch (err) {
      console.error('Error fetching medicines:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/medicines/categories');
      setCategories(response.data.categories);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Medicines</h1>
        <p className="text-gray-600 mt-1">
          Browse our collection of quality medicines
        </p>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search medicines..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          <div className="flex gap-4">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="input w-48"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <select
              value={prescriptionFilter}
              onChange={(e) => setPrescriptionFilter(e.target.value)}
              className="input w-48"
            >
              <option value="all">All Types</option>
              <option value="required">Prescription Required</option>
              <option value="otc">Over the Counter</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <p className="text-sm text-gray-600 mb-4">
        Showing {filteredMedicines.length} of {medicines.length} medicines
      </p>

      {/* Medicines Grid */}
      {filteredMedicines.length === 0 ? (
        <div className="card text-center py-12">
          <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Pill className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No medicines found
          </h3>
          <p className="text-gray-600">
            Try adjusting your search or filters
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredMedicines.map((medicine) => (
            <Link
              key={medicine._id}
              to={`/medicines/${medicine._id}`}
              className="card hover:shadow-lg transition-shadow"
            >
              <div className="bg-gray-100 w-full h-48 rounded-lg flex items-center justify-center mb-4">
                {medicine.image ? (
                  <img
                    src={medicine.image}
                    alt={medicine.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <Package className="h-16 w-16 text-gray-400" />
                )}
              </div>
              
              <h3 className="font-semibold text-gray-900 mb-1">{medicine.name}</h3>
              <p className="text-sm text-gray-500 mb-2">{medicine.category}</p>
              
              <div className="flex justify-between items-center mt-4">
                <span className="font-bold text-medical-600">LKR {Number(medicine.price || 0).toFixed(2)}</span>
                <span className={`text-xs px-2 py-1 rounded ${
                  medicine.totalStock > 0
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {medicine.stockStatus}
                </span>
              </div>

              <div className="mt-2 text-xs text-gray-500 space-y-1">
                <p>Total Stock: {medicine.totalStock}</p>
                <p>
                  Nearest Expiry:{' '}
                  {medicine.nearestExpiry
                    ? new Date(medicine.nearestExpiry).toLocaleDateString()
                    : 'N/A'}
                </p>
              </div>
              
              {medicine.requiresPrescription && (
                <span className="inline-block mt-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                  Prescription Required
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Medicines;
