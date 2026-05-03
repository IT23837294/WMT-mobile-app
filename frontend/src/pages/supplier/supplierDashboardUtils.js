export const formatCurrency = (value) => `LKR ${Number(value || 0).toFixed(2)}`;

export const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString();
};

export const formatCount = (value) => Number(value || 0).toLocaleString('en-US');

export const formatBoolean = (value) => (value ? 'Yes' : 'No');

export const getStatusClass = (status) => {
  switch (status) {
    case 'active':
    case 'paid':
    case 'completed':
      return 'bg-emerald-100 text-emerald-800';
    case 'pending':
    case 'partially_paid':
    case 'suggested':
    case 'approved':
    case 'sent':
      return 'bg-amber-100 text-amber-800';
    case 'overdue':
    case 'cancelled':
      return 'bg-rose-100 text-rose-800';
    case 'inactive':
      return 'bg-slate-100 text-slate-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
};

export const getOrderStatusLabel = (status) => {
  switch (status) {
    case 'suggested':
      return 'Suggested';
    case 'approved':
      return 'Approved';
    case 'sent':
      return 'Sent';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status || 'Unknown';
  }
};
