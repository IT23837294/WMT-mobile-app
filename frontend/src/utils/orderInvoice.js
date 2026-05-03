const PAYMENT_METHOD_LABELS = {
  cod: 'Cash on Delivery',
  card: 'Card Payment',
  online: 'Online Payment',
  bank_deposit: 'Bank Deposit'
};

export const formatOrderCurrency = (amount) => `LKR ${Number(amount || 0).toFixed(2)}`;

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const receiptLogoMarkup = `
  <div style="display:flex; align-items:center; gap:14px;">
    <svg width="44" height="44" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="customerInvoiceLogoBg" x1="10" y1="8" x2="54" y2="56" gradientUnits="userSpaceOnUse">
          <stop stop-color="#0F766E" />
          <stop offset="1" stop-color="#1D4ED8" />
        </linearGradient>
        <linearGradient id="customerInvoiceLogoCapsule" x1="22" y1="18" x2="43" y2="41" gradientUnits="userSpaceOnUse">
          <stop stop-color="#E0F2FE" />
          <stop offset="1" stop-color="#FFFFFF" />
        </linearGradient>
      </defs>
      <rect x="6" y="6" width="52" height="52" rx="18" fill="url(#customerInvoiceLogoBg)" />
      <path d="M17 32C17 23.716 23.716 17 32 17C40.284 17 47 23.716 47 32C47 40.284 40.284 47 32 47C23.716 47 17 40.284 17 32Z" fill="white" fill-opacity="0.14" />
      <path d="M39.778 19.561C43.846 20.684 47 24.772 47 29.503C47 34.857 42.971 39.315 37.741 39.91L36.594 41.922C35.926 43.094 34.68 43.818 33.33 43.818H30.67C29.32 43.818 28.074 43.094 27.406 41.922L26.259 39.91C21.029 39.315 17 34.857 17 29.503C17 24.772 20.154 20.684 24.222 19.561C25.684 19.157 26.986 20.564 26.467 21.988L24.629 27.037C24.324 27.875 24.749 28.795 25.582 29.114L30.209 30.887C31.358 31.328 32.642 31.328 33.791 30.887L38.418 29.114C39.251 28.795 39.676 27.875 39.371 27.037L37.533 21.988C37.014 20.564 38.316 19.157 39.778 19.561Z" fill="url(#customerInvoiceLogoCapsule)" />
      <path d="M31.999 23V35" stroke="#0F766E" stroke-width="3.5" stroke-linecap="round" />
      <path d="M26 29H38" stroke="#0F766E" stroke-width="3.5" stroke-linecap="round" />
      <path d="M42.5 16.5C45.1 16.9 47.2 18.9 47.8 21.5" stroke="#A7F3D0" stroke-width="2.5" stroke-linecap="round" />
    </svg>
    <div style="font-size:20px; font-weight:800; color:#18324b; letter-spacing:-0.02em;">PharmaCare</div>
  </div>
`;

export const buildCustomerInvoiceHtml = (order, customer = {}) => {
  const createdAt = order?.createdAt ? new Date(order.createdAt) : new Date();
  const safeOrderNumber = order?.orderNumber || order?._id || 'N/A';
  const address = order?.deliveryAddress
    ? [
        order.deliveryAddress.street,
        `${order.deliveryAddress.city || ''}, ${order.deliveryAddress.state || ''} ${order.deliveryAddress.zipCode || ''}`.trim(),
        order.deliveryAddress.country || 'Sri Lanka'
      ].filter(Boolean).join('<br />')
    : 'No address provided';
  const customerName = customer?.name || order?.user?.name || 'Customer';
  const customerEmail = customer?.email || order?.user?.email || 'No email provided';
  const customerPhone = order?.contactNumber || customer?.phone || order?.user?.phone || 'No contact';
  const itemsRows = (order?.items || []).map((item) => `
    <tr>
      <td style="text-align:center;">${escapeHtml(item.quantity || 0)}</td>
      <td>${escapeHtml(item.medicine?.name || 'Medicine')}</td>
      <td style="text-align:right;">${escapeHtml(formatOrderCurrency(item.price))}</td>
      <td style="text-align:right;font-weight:700;">${escapeHtml(formatOrderCurrency(item.total || (Number(item.price || 0) * Number(item.quantity || 0))))}</td>
    </tr>
  `).join('');

  return `
    <html>
      <head>
        <title>PharmaCare Invoice ${escapeHtml(safeOrderNumber)}</title>
        <style>
          body { margin:0; padding:24px 0; background:#eef5f7; color:#1e293b; font-family:Arial,sans-serif; }
          .receipt-shell { max-width:760px; margin:0 auto; background:#ffffff; border:4px solid #6aa6ae; overflow:hidden; position:relative; }
          .content { padding:34px 28px 18px; }
          .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:20px; }
          .title { font-size:34px; font-weight:800; color:#18324b; }
          .receipt-meta { text-align:right; color:#7c8a9a; font-size:13px; line-height:1.7; }
          .small-label { font-size:11px; font-weight:700; text-transform:uppercase; color:#64748b; margin-bottom:6px; }
          .info-text { font-size:13px; line-height:1.6; }
          .items-grid, .info-grid, .summary-grid { width:100%; border-collapse:collapse; }
          .items-grid thead tr { background:#dbe8ec; color:#334155; }
          .items-grid th { padding:10px 12px; font-size:12px; }
          .items-grid td { padding:10px 12px; font-size:12px; border-bottom:1px solid #e2e8f0; }
          .totals-box { border:1px solid #cbd5e1; }
          .totals-row { display:flex; justify-content:space-between; padding:9px 12px; font-size:12px; border-bottom:1px solid #cbd5e1; }
          .grand-total { display:flex; justify-content:space-between; padding:11px 12px; font-size:13px; background:#18324b; color:#ffffff; font-weight:700; }
          .signature { margin-top:42px; text-align:right; font-size:11px; color:#64748b; }
        </style>
      </head>
      <body>
        <div class="receipt-shell">
          <div class="content">
            <div class="header">
              <div>
                ${receiptLogoMarkup}
                <div class="title">PharmaCare Invoice</div>
              </div>
              <div class="receipt-meta">
                <div><strong>Receipt #</strong> ${escapeHtml(safeOrderNumber)}</div>
                <div><strong>Date</strong> ${escapeHtml(createdAt.toLocaleDateString())}</div>
                <div><strong>Time</strong> ${escapeHtml(createdAt.toLocaleTimeString())}</div>
              </div>
            </div>

            <table class="info-grid" style="margin-bottom:18px;">
              <tr>
                <td style="width:34%; vertical-align:top; padding-right:16px;">
                  <div class="small-label">Bill To</div>
                  <div class="info-text">
                    <strong>${escapeHtml(customerName)}</strong><br />
                    ${escapeHtml(customerEmail)}<br />
                    ${escapeHtml(customerPhone)}
                  </div>
                </td>
                <td style="width:33%; vertical-align:top; padding-right:16px;">
                  <div class="small-label">Ship To</div>
                  <div class="info-text">${address}</div>
                </td>
                <td style="width:33%; vertical-align:top;">
                  <div class="small-label">Receipt Info</div>
                  <div class="info-text">
                    <strong>Payment</strong> ${escapeHtml(PAYMENT_METHOD_LABELS[order?.paymentMethod] || order?.paymentMethod || 'N/A')}<br />
                    <strong>Status</strong> ${escapeHtml(order?.paymentStatus || 'N/A')}<br />
                    <strong>Reference</strong> ${escapeHtml(order?.paymentReference || order?.transactionId || 'N/A')}
                  </div>
                </td>
              </tr>
            </table>

            <table class="items-grid" style="margin-bottom:18px;">
              <thead>
                <tr>
                  <th style="text-align:center;">QTY</th>
                  <th style="text-align:left;">DESCRIPTION</th>
                  <th style="text-align:right;">PRICE</th>
                  <th style="text-align:right;">AMOUNT</th>
                </tr>
              </thead>
              <tbody>${itemsRows}</tbody>
            </table>

            <table class="summary-grid" style="margin-top:26px;">
              <tr>
                <td style="width:58%; vertical-align:bottom; padding-right:20px;">
                  <div class="small-label" style="color:#475569;">Term & Condition</div>
                  <div style="font-size:11px; color:#64748b; line-height:1.6; max-width:300px;">
                    This is a system-generated invoice from PharmaCare. Please retain this document as payment proof for your pharmacy order.
                  </div>
                  <div style="font-size:11px; font-weight:700; color:#18324b; margin-top:16px;">WWW.PHARMACARE.COM</div>
                </td>
                <td style="width:42%; vertical-align:top;">
                  <div class="totals-box">
                    <div class="totals-row"><span>Sub Total</span><strong>${escapeHtml(formatOrderCurrency(order?.totalAmount))}</strong></div>
                    <div class="totals-row"><span>Delivery Charge</span><strong>${escapeHtml(formatOrderCurrency(order?.deliveryCharge))}</strong></div>
                    <div class="totals-row"><span>Discount</span><strong>${escapeHtml(formatOrderCurrency(order?.discount))}</strong></div>
                    <div class="grand-total"><span>GRAND TOTAL</span><span>${escapeHtml(formatOrderCurrency(order?.finalAmount))}</span></div>
                  </div>
                  <div class="signature">
                    <div style="border-top:1px solid #94a3b8; width:170px; margin-left:auto; margin-bottom:6px;"></div>
                    Signature
                  </div>
                </td>
              </tr>
            </table>
          </div>
        </div>
      </body>
    </html>
  `;
};

export const downloadOrderInvoice = (order, customer = {}) => {
  const html = buildCustomerInvoiceHtml(order, customer);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `pharmacare-invoice-${order?.orderNumber || order?._id || 'order'}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

