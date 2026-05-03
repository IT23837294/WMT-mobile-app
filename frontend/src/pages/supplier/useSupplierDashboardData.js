import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { BadgeDollarSign, CheckCircle, Package, Truck } from 'lucide-react';
import { formatCurrency } from './supplierDashboardUtils';

const useSupplierDashboardData = () => {
  const [supplierData, setSupplierData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    const fetchDashboard = async () => {
      setError('');
      setLoading(true);

      try {
        const response = await axios.get('/api/suppliers/me');
        setSupplierData(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load supplier dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [refreshToken]);

  const supplier = supplierData?.supplier;
  const medicines = supplierData?.medicines || [];
  const orders = supplierData?.orders || [];
  const monthlyStatements = supplier?.monthlyStatements || [];
  const invoices = supplier?.invoices || [];
  const performance = supplier?.performance || {};

  const stats = useMemo(() => {
    const supplierStats = supplierData?.stats || {};

    return [
      {
        label: 'Catalog items',
        value: supplierStats.catalogItems ?? 0,
        icon: Package,
        tone: 'bg-cyan-50 text-cyan-700'
      },
      {
        label: 'Active medicines',
        value: supplierStats.activeMedicines ?? 0,
        icon: CheckCircle,
        tone: 'bg-emerald-50 text-emerald-700'
      },
      {
        label: 'Open orders',
        value: supplierStats.openOrders ?? 0,
        icon: Truck,
        tone: 'bg-amber-50 text-amber-700'
      },
      {
        label: 'Outstanding balance',
        value: formatCurrency(supplierStats.outstandingBalance ?? 0),
        icon: BadgeDollarSign,
        tone: 'bg-rose-50 text-rose-700'
      }
    ];
  }, [supplierData]);

  const orderStats = useMemo(() => {
    const totalValue = orders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
    const statusCounts = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});

    return {
      ordersCount: orders.length,
      totalValue,
      statusCounts,
      latestOrder: orders[0] || null
    };
  }, [orders]);

  useEffect(() => {
    if (!selectedOrderId && orderStats.latestOrder?._id) {
      setSelectedOrderId(orderStats.latestOrder._id);
    }
  }, [orderStats.latestOrder, selectedOrderId]);

  const selectedOrder = useMemo(
    () => orders.find((order) => order._id === selectedOrderId) || orderStats.latestOrder,
    [orders, orderStats.latestOrder, selectedOrderId]
  );

  return {
    supplierData,
    supplier,
    medicines,
    orders,
    monthlyStatements,
    invoices,
    performance,
    stats,
    orderStats,
    selectedOrder,
    selectedOrderId,
    setSelectedOrderId,
    loading,
    error,
    refresh: () => setRefreshToken((value) => value + 1)
  };
};

export default useSupplierDashboardData;
