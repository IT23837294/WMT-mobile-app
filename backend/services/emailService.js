const axios = require('axios');

const PAYMENT_METHOD_LABELS = {
  cod: 'Cash on Delivery',
  card: 'Card Payment',
  online: 'Online Payment',
  bank_deposit: 'Bank Deposit'
};

const formatCurrency = (amount) => `LKR ${Number(amount || 0).toFixed(2)}`;

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');
const getReceiptImageSources = (items = []) => (
  items
    .map((item) => item?.medicine?.image)
    .filter(Boolean)
    .slice(0, 3)
);
const receiptLogoMarkup = `
  <div style="display:flex; align-items:center; gap:14px;">
    <svg width="44" height="44" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="emailInvoiceLogoBg" x1="10" y1="8" x2="54" y2="56" gradientUnits="userSpaceOnUse">
          <stop stop-color="#0F766E" />
          <stop offset="1" stop-color="#1D4ED8" />
        </linearGradient>
        <linearGradient id="emailInvoiceLogoCapsule" x1="22" y1="18" x2="43" y2="41" gradientUnits="userSpaceOnUse">
          <stop stop-color="#E0F2FE" />
          <stop offset="1" stop-color="#FFFFFF" />
        </linearGradient>
      </defs>
      <rect x="6" y="6" width="52" height="52" rx="18" fill="url(#emailInvoiceLogoBg)" />
      <path d="M17 32C17 23.716 23.716 17 32 17C40.284 17 47 23.716 47 32C47 40.284 40.284 47 32 47C23.716 47 17 40.284 17 32Z" fill="white" fill-opacity="0.14" />
      <path d="M39.778 19.561C43.846 20.684 47 24.772 47 29.503C47 34.857 42.971 39.315 37.741 39.91L36.594 41.922C35.926 43.094 34.68 43.818 33.33 43.818H30.67C29.32 43.818 28.074 43.094 27.406 41.922L26.259 39.91C21.029 39.315 17 34.857 17 29.503C17 24.772 20.154 20.684 24.222 19.561C25.684 19.157 26.986 20.564 26.467 21.988L24.629 27.037C24.324 27.875 24.749 28.795 25.582 29.114L30.209 30.887C31.358 31.328 32.642 31.328 33.791 30.887L38.418 29.114C39.251 28.795 39.676 27.875 39.371 27.037L37.533 21.988C37.014 20.564 38.316 19.157 39.778 19.561Z" fill="url(#emailInvoiceLogoCapsule)" />
      <path d="M31.999 23V35" stroke="#0F766E" stroke-width="3.5" stroke-linecap="round" />
      <path d="M26 29H38" stroke="#0F766E" stroke-width="3.5" stroke-linecap="round" />
      <path d="M42.5 16.5C45.1 16.9 47.2 18.9 47.8 21.5" stroke="#A7F3D0" stroke-width="2.5" stroke-linecap="round" />
    </svg>
    <div style="font-size:20px; font-weight:800; color:#18324b; letter-spacing:-0.02em;">PharmaCare</div>
  </div>
`;

const isEmailConfigured = () => (
  process.env.BREVO_API_KEY
);

const sendViaBrevoApi = async (to, subject, htmlContent) => {
  if (!isEmailConfigured()) {
    throw new Error('Email service is not configured. Please set BREVO_API_KEY in your .env file.');
  }

  const senderEmail = process.env.MAIL_FROM || 'noreply@pharmacare.com';
  const senderName = process.env.MAIL_FROM_NAME || 'PharmaCare';

  await axios.post(
    'https://api.brevo.com/v3/smtp/email',
    {
      sender: { email: senderEmail, name: senderName },
      to: [{ email: to }],
      subject,
      htmlContent
    },
    {
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json'
      }
    }
  );
};

const buildReceiptHtml = (order) => {
  const itemsHtml = order.items.map((item) => `
    <tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(item.medicine?.name || 'Medicine')}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">${formatCurrency(item.price)}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 700;">${formatCurrency(item.total)}</td>
    </tr>
  `).join('');

  const deliveryAddress = order.deliveryAddress
    ? [
      order.deliveryAddress.street,
      `${order.deliveryAddress.city}, ${order.deliveryAddress.state} ${order.deliveryAddress.zipCode}`,
      order.deliveryAddress.country || 'Sri Lanka'
    ].filter(Boolean).join('<br />')
    : 'No delivery address provided';
  const backgroundImages = getReceiptImageSources(order.items);

  return `
    <div style="font-family: Arial, sans-serif; background: #eef5f7; padding: 24px 0; color: #1e293b;">
      <div style="max-width: 760px; margin: 0 auto; background: #ffffff; border: 4px solid #6aa6ae; position: relative; overflow: hidden;">
        <div style="position: absolute; top: 18px; right: 32px; width: 160px; height: 56px; transform: skew(-28deg); background: rgba(106,166,174,0.12);"></div>
        <div style="position: absolute; top: 0; right: 86px; width: 20px; height: 70px; transform: skew(-28deg); background: rgba(106,166,174,0.16);"></div>
        <div style="position: absolute; bottom: 18px; left: 26px; width: 76px; height: 24px; transform: skew(-28deg); border: 2px solid rgba(106,166,174,0.18);"></div>
        <div style="position: absolute; bottom: 18px; right: 26px; width: 90px; height: 24px; transform: skew(-28deg); border: 2px solid rgba(106,166,174,0.18);"></div>

        <div style="position:absolute; inset:0; pointer-events:none; z-index:0;">
          ${backgroundImages[0] ? `<img src="${escapeHtml(backgroundImages[0])}" alt="" style="position:absolute; top:150px; right:18px; width:170px; height:170px; object-fit:contain; opacity:0.08; filter:grayscale(100%); transform:rotate(-18deg);" />` : ''}
          ${backgroundImages[1] ? `<img src="${escapeHtml(backgroundImages[1])}" alt="" style="position:absolute; bottom:120px; left:22px; width:170px; height:170px; object-fit:contain; opacity:0.08; filter:grayscale(100%); transform:rotate(14deg);" />` : ''}
          ${backgroundImages[2] ? `<img src="${escapeHtml(backgroundImages[2])}" alt="" style="position:absolute; top:360px; left:240px; width:170px; height:170px; object-fit:contain; opacity:0.08; filter:grayscale(100%); transform:rotate(-10deg);" />` : ''}
        </div>
        <div style="padding: 34px 28px 18px; position: relative; z-index: 1;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
            <div>
              ${receiptLogoMarkup}
              <div style="font-size: 34px; font-weight: 800; letter-spacing: 0.02em; color: #18324b;">Pharmacare Invoice</div>
            </div>
            <div style="text-align: right; color: #7c8a9a; font-size: 13px; line-height: 1.7;">
              <div><strong>Receipt #</strong> ${escapeHtml(order.orderNumber)}</div>
              <div><strong>Date</strong> ${new Date().toLocaleDateString()}</div>
              <div><strong>Time</strong> ${new Date().toLocaleTimeString()}</div>
            </div>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 18px;">
            <tr>
              <td style="width: 34%; vertical-align: top; padding-right: 16px;">
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 6px;">Bill To</div>
                <div style="font-size: 13px; line-height: 1.6;">
                  <strong>${escapeHtml(order.user?.name || 'Customer')}</strong><br />
                  ${escapeHtml(order.receiptEmail || order.user?.email || 'No email')}<br />
                  ${escapeHtml(order.contactNumber || 'No contact')}
                </div>
              </td>
              <td style="width: 33%; vertical-align: top; padding-right: 16px;">
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 6px;">Ship To</div>
                <div style="font-size: 13px; line-height: 1.6;">${deliveryAddress}</div>
              </td>
              <td style="width: 33%; vertical-align: top;">
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 6px;">Receipt Info</div>
                <div style="font-size: 13px; line-height: 1.6;">
                  <strong>Payment</strong> ${escapeHtml(PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod)}<br />
                  <strong>Status</strong> ${escapeHtml(order.paymentStatus)}<br />
                  <strong>Order Date</strong> ${new Date(order.createdAt).toLocaleDateString()}
                </div>
              </td>
            </tr>
          </table>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 18px;">
            <thead>
              <tr style="background: #dbe8ec; color: #334155;">
                <th style="padding: 10px 12px; text-align: center; font-size: 12px;">QTY</th>
                <th style="padding: 10px 12px; text-align: left; font-size: 12px;">DESCRIPTION</th>
                <th style="padding: 10px 12px; text-align: right; font-size: 12px;">PRICE</th>
                <th style="padding: 10px 12px; text-align: right; font-size: 12px;">AMOUNT</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>

          <table style="width: 100%; border-collapse: collapse; margin-top: 26px;">
            <tr>
              <td style="width: 58%; vertical-align: bottom; padding-right: 20px;">
                <div style="font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; margin-bottom: 8px;">Term & Condition</div>
                <div style="font-size: 11px; color: #64748b; line-height: 1.6; max-width: 300px;">
                  This is a system-generated invoice from PharmaCare. Please retain this document as payment proof for your pharmacy order.
                </div>
                <div style="font-size: 11px; font-weight: 700; color: #18324b; margin-top: 16px;">WWW.PHARMACARE.COM</div>
              </td>
              <td style="width: 42%; vertical-align: top;">
                <div style="border: 1px solid #cbd5e1;">
                  <div style="display: flex; justify-content: space-between; padding: 9px 12px; font-size: 12px; border-bottom: 1px solid #cbd5e1;">
                    <span>Sub Total</span>
                    <strong>${formatCurrency(order.totalAmount)}</strong>
                  </div>
                  <div style="display: flex; justify-content: space-between; padding: 9px 12px; font-size: 12px; border-bottom: 1px solid #cbd5e1;">
                    <span>Delivery Charge</span>
                    <strong>${formatCurrency(order.deliveryCharge)}</strong>
                  </div>
                  <div style="display: flex; justify-content: space-between; padding: 9px 12px; font-size: 12px; border-bottom: 1px solid #cbd5e1;">
                    <span>Discount</span>
                    <strong>${formatCurrency(order.discount)}</strong>
                  </div>
                  <div style="display: flex; justify-content: space-between; padding: 11px 12px; font-size: 13px; background: #18324b; color: #ffffff; font-weight: 700;">
                    <span>GRAND TOTAL</span>
                    <span>${formatCurrency(order.finalAmount)}</span>
                  </div>
                </div>
                <div style="margin-top: 42px; text-align: right; font-size: 11px; color: #64748b;">
                  <div style="border-top: 1px solid #94a3b8; width: 170px; margin-left: auto; margin-bottom: 6px;"></div>
                  Signature
                </div>
              </td>
            </tr>
          </table>
        </div>
      </div>
    </div>
  `;
};

const sendOrderReceiptEmail = async (order) => {
  const recipient = order.receiptEmail || order.user?.email;

  if (!recipient) {
    throw new Error('No receipt email is registered for this order');
  }

  await sendViaBrevoApi(
    recipient,
    `PharmaCare Receipt for ${order.orderNumber}`,
    buildReceiptHtml(order)
  );
};

const buildPaymentConfirmationHtml = (order) => `
  <div style="font-family: Arial, sans-serif; background: #eef5f7; padding: 40px 0; color: #1e293b;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="width: 64px; height: 64px; background: #10b981; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <h1 style="font-size: 24px; font-weight: 700; color: #18324b; margin: 0 0 8px;">Payment Confirmed!</h1>
        <p style="color: #64748b; margin: 0;">Thank you for your order, ${escapeHtml(order.user?.name || 'Customer')}</p>
      </div>
      
      <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <table style="width: 100%;">
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Order Number</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600;">${escapeHtml(order.orderNumber)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Amount Paid</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #10b981;">${formatCurrency(order.finalAmount)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Payment Method</td>
            <td style="padding: 8px 0; text-align: right;">${escapeHtml(PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod)}</td>
          </tr>
        </table>
      </div>

      <p style="text-align: center; color: #64748b; font-size: 14px; margin: 0;">
        Your order is now being processed. We'll send you updates as your order is shipped.
      </p>
    </div>
  </div>
`;

const buildOrderShippedHtml = (order) => `
  <div style="font-family: Arial, sans-serif; background: #eef5f7; padding: 40px 0; color: #1e293b;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="width: 64px; height: 64px; background: #3b82f6; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <rect x="1" y="3" width="15" height="13"></rect>
            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
            <circle cx="5.5" cy="18.5" r="2.5"></circle>
            <circle cx="18.5" cy="18.5" r="2.5"></circle>
          </svg>
        </div>
        <h1 style="font-size: 24px; font-weight: 700; color: #18324b; margin: 0 0 8px;">Order Shipped!</h1>
        <p style="color: #64748b; margin: 0;">Your order is on its way, ${escapeHtml(order.user?.name || 'Customer')}</p>
      </div>
      
      <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <table style="width: 100%;">
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Order Number</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600;">${escapeHtml(order.orderNumber)}</td>
          </tr>
          ${order.trackingNumber ? `
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Tracking Number</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600;">${escapeHtml(order.trackingNumber)}</td>
          </tr>
          ` : ''}
          ${order.trackingCarrier ? `
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Carrier</td>
            <td style="padding: 8px 0; text-align: right;">${escapeHtml(order.trackingCarrier)}</td>
          </tr>
          ` : ''}
        </table>
      </div>

      <p style="text-align: center; color: #64748b; font-size: 14px; margin: 0;">
        Track your order using the tracking number above. Expected delivery soon!
      </p>
    </div>
  </div>
`;

const buildOrderDeliveredHtml = (order) => `
  <div style="font-family: Arial, sans-serif; background: #eef5f7; padding: 40px 0; color: #1e293b;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="width: 64px; height: 64px; background: #10b981; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <h1 style="font-size: 24px; font-weight: 700; color: #18324b; margin: 0 0 8px;">Order Delivered!</h1>
        <p style="color: #64748b; margin: 0;">Your order has been delivered, ${escapeHtml(order.user?.name || 'Customer')}</p>
      </div>
      
      <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <table style="width: 100%;">
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Order Number</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600;">${escapeHtml(order.orderNumber)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Total Amount</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600;">${formatCurrency(order.finalAmount)}</td>
          </tr>
        </table>
      </div>

      <p style="text-align: center; color: #64748b; font-size: 14px; margin: 0;">
        Thank you for shopping with PharmaCare! We hope to see you again soon.
      </p>
    </div>
  </div>
`;

const buildRefundApprovedHtml = (order) => `
  <div style="font-family: Arial, sans-serif; background: #eef5f7; padding: 40px 0; color: #1e293b;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="width: 64px; height: 64px; background: #10b981; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <polyline points="19 12 12 19 5 12"></polyline>
          </svg>
        </div>
        <h1 style="font-size: 24px; font-weight: 700; color: #18324b; margin: 0 0 8px;">Refund Approved!</h1>
        <p style="color: #64748b; margin: 0;">Your refund has been processed, ${escapeHtml(order.user?.name || 'Customer')}</p>
      </div>
      
      <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <table style="width: 100%;">
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Order Number</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600;">${escapeHtml(order.orderNumber)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Refund Amount</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #10b981;">${formatCurrency(order.refundAmount)}</td>
          </tr>
          ${order.refundReason ? `
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Reason</td>
            <td style="padding: 8px 0; text-align: right;">${escapeHtml(order.refundReason)}</td>
          </tr>
          ` : ''}
        </table>
      </div>

      <p style="text-align: center; color: #64748b; font-size: 14px; margin: 0;">
        The refund has been processed to your original payment method. It may take 5-10 business days to reflect in your account.
      </p>
    </div>
  </div>
`;

const buildSupplierApplicationSubmittedHtml = (supplier) => `
  <div style="font-family: Arial, sans-serif; background: #eef5f7; padding: 40px 0; color: #1e293b;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="font-size: 24px; font-weight: 700; color: #18324b; margin: 0 0 8px;">Application Received!</h1>
        <p style="color: #64748b; margin: 0;">Thank you for applying to become a supplier for PharmaCare</p>
      </div>
      
      <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <table style="width: 100%;">
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Application Date</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600;">${new Date().toLocaleDateString()}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Supplier Name</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600;">${escapeHtml(supplier.name)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Status</td>
            <td style="padding: 8px 0; text-align: right;"><span style="background: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">Pending Review</span></td>
          </tr>
        </table>
      </div>

      <p style="text-align: center; color: #64748b; font-size: 14px; margin: 0;">
        Our team will review your application and get back to you soon. You'll receive an email once your application is approved.
      </p>
    </div>
  </div>
`;

const buildSupplierApprovedHtml = (supplier) => `
  <div style="font-family: Arial, sans-serif; background: #eef5f7; padding: 40px 0; color: #1e293b;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="width: 64px; height: 64px; background: #10b981; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <h1 style="font-size: 24px; font-weight: 700; color: #18324b; margin: 0 0 8px;">Application Approved!</h1>
        <p style="color: #64748b; margin: 0;">Congratulations! Your supplier application has been approved</p>
      </div>
      
      <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <table style="width: 100%;">
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Supplier Name</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600;">${escapeHtml(supplier.name)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Email</td>
            <td style="padding: 8px 0; text-align: right;">${escapeHtml(supplier.contact?.email || 'N/A')}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Status</td>
            <td style="padding: 8px 0; text-align: right;"><span style="background: #d1fae5; color: #065f46; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">Active</span></td>
          </tr>
        </table>
      </div>

      <p style="text-align: center; color: #64748b; font-size: 14px; margin: 0;">
        You can now start supplying medicines to PharmaCare. Login to your supplier portal to manage your products.
      </p>
    </div>
  </div>
`;

const sendPaymentConfirmationEmail = async (order) => {
  const recipient = order.user?.email;
  if (!recipient) return;
  await sendViaBrevoApi(recipient, `Payment Confirmed - Order ${order.orderNumber}`, buildPaymentConfirmationHtml(order));
};

const sendOrderShippedEmail = async (order) => {
  const recipient = order.user?.email;
  if (!recipient) return;
  await sendViaBrevoApi(recipient, `Order Shipped - ${order.orderNumber}`, buildOrderShippedHtml(order));
};

const sendOrderDeliveredEmail = async (order) => {
  const recipient = order.user?.email;
  if (!recipient) return;
  await sendViaBrevoApi(recipient, `Order Delivered - ${order.orderNumber}`, buildOrderDeliveredHtml(order));
};

const sendRefundApprovedEmail = async (order) => {
  const recipient = order.user?.email;
  if (!recipient) return;
  await sendViaBrevoApi(recipient, `Refund Approved - Order ${order.orderNumber}`, buildRefundApprovedHtml(order));
};

const sendSupplierApplicationSubmittedEmail = async (supplier) => {
  const recipient = supplier.contact?.email;
  if (!recipient) return;
  await sendViaBrevoApi(recipient, 'Supplier Application Received - PharmaCare', buildSupplierApplicationSubmittedHtml(supplier));
};

const sendSupplierApprovedEmail = async (supplier) => {
  const recipient = supplier.contact?.email;
  if (!recipient) return;
  await sendViaBrevoApi(recipient, 'Supplier Application Approved - PharmaCare', buildSupplierApprovedHtml(supplier));
};

module.exports = {
  isEmailConfigured,
  sendOrderReceiptEmail,
  sendPaymentConfirmationEmail,
  sendOrderShippedEmail,
  sendOrderDeliveredEmail,
  sendRefundApprovedEmail,
  sendSupplierApplicationSubmittedEmail,
  sendSupplierApprovedEmail
};
