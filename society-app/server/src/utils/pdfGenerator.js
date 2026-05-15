const PDFDocument = require('pdfkit');

/**
 * Generate a premium professional payment receipt PDF
 * A5 size, portrait, with proper borders, styled table, watermark, and branding
 */
const generatePaymentReceipt = (payment, society, flat) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      margin: 0,
      size: 'A5',
      info: {
        Title: `Receipt_${payment.receiptNumber || payment._id}`,
        Author: society.name,
        Subject: 'Maintenance Payment Receipt'
      }
    });
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const W = doc.page.width;   // ~419
    const H = doc.page.height;  // ~595
    const M = 28;               // margin
    const CW = W - M * 2;       // content width

    // ─── COLORS ───
    const C = {
      brand: '#1e1b4b',      // deep indigo
      brandLight: '#4338ca',  // indigo
      accent: '#6366f1',      // purple accent
      dark: '#0f172a',
      text: '#1e293b',
      sub: '#64748b',
      muted: '#94a3b8',
      line: '#cbd5e1',
      lineFaint: '#e2e8f0',
      bg: '#f8fafc',
      white: '#ffffff',
      success: '#059669',
      row1: '#f8fafc',
      row2: '#ffffff',
    };

    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const monthName = months[(payment.month || 1) - 1];
    const totalAmount = (payment.amount || 0) + (payment.lateFee || 0);
    const paidDate = payment.paidDate ? new Date(payment.paidDate) : new Date();
    const receiptNo = payment.receiptNumber || `RCP-${payment._id.toString().slice(-8).toUpperCase()}`;

    // ═══════════════════════════════════════
    // OUTER BORDER (double-line effect)
    // ═══════════════════════════════════════
    doc.rect(10, 10, W - 20, H - 20).lineWidth(1.5).strokeColor(C.brand).stroke();
    doc.rect(14, 14, W - 28, H - 28).lineWidth(0.5).strokeColor(C.brandLight).stroke();

    // ═══════════════════════════════════════
    // HEADER BAND (gradient-like via two rects)
    // ═══════════════════════════════════════
    doc.rect(M, M, CW, 60).fill(C.brand);
    // Subtle lighter strip at top
    doc.rect(M, M, CW, 3).fill(C.accent);

    // Society name - large white text
    doc.fillColor(C.white).font('Helvetica-Bold').fontSize(16)
       .text((society.name || 'SOCIETY NAME').toUpperCase(), M, M + 12, { width: CW, align: 'center' });

    // Address line
    const addr = [society.address, society.city, society.state, society.pincode].filter(Boolean).join(', ');
    if (addr) {
      doc.font('Helvetica').fontSize(7).fillColor('#c7d2fe')
         .text(addr, M, M + 33, { width: CW, align: 'center' });
    }

    // Contact
    if (society.contactNumber) {
      doc.fontSize(7).fillColor('#c7d2fe')
         .text(`Contact: +91 ${society.contactNumber}`, M, M + 44, { width: CW, align: 'center' });
    }

    // ═══════════════════════════════════════
    // RECEIPT TITLE BAR
    // ═══════════════════════════════════════
    const titleY = M + 65;
    doc.rect(M, titleY, CW, 22).fill(C.bg);
    doc.rect(M, titleY, CW, 22).lineWidth(0.5).strokeColor(C.line).stroke();
    // Title text only, no decorators
    doc.fillColor(C.brand).font('Helvetica-Bold').fontSize(11)
       .text('MAINTENANCE RECEIPT', M, titleY + 5, { width: CW, align: 'center' });

    // ═══════════════════════════════════════
    // RECEIPT NO & DATE ROW
    // ═══════════════════════════════════════
    const infoY = titleY + 30;
    // Left: Receipt No
    doc.fillColor(C.sub).font('Helvetica').fontSize(8)
       .text('Receipt No.', M, infoY);
    doc.fillColor(C.dark).font('Helvetica-Bold').fontSize(9)
       .text(receiptNo, M, infoY + 11);

    // Right: Date
    doc.fillColor(C.sub).font('Helvetica').fontSize(8)
       .text('Date', W - M - 100, infoY, { width: 100, align: 'right' });
    doc.fillColor(C.dark).font('Helvetica-Bold').fontSize(9)
       .text(paidDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), W - M - 100, infoY + 11, { width: 100, align: 'right' });

    // Thin separator
    doc.moveTo(M, infoY + 26).lineTo(W - M, infoY + 26).lineWidth(0.5).strokeColor(C.lineFaint).stroke();

    // ═══════════════════════════════════════
    // RECEIVED FROM SECTION
    // ═══════════════════════════════════════
    const recY = infoY + 34;
    doc.fillColor(C.sub).font('Helvetica').fontSize(8).text('Received with thanks from', M, recY);
    doc.fillColor(C.dark).font('Helvetica-Bold').fontSize(12)
       .text(flat.ownerName || 'N/A', M, recY + 12);

    // Flat info badges
    const badgeY = recY + 30;
    const blockName = flat.blockId?.name || '';
    const flatNumber = flat.number || '';
    const flatLabel = blockName ? `${blockName} - ${flatNumber}` : flatNumber;

    // Block & Flat badge
    drawBadge(doc, M, badgeY, `Flat: ${flatLabel}`, C.brand);
    // Month badge
    const monthBadgeX = M + 80;
    drawBadge(doc, monthBadgeX, badgeY, `Period: ${monthName} ${payment.year}`, C.brandLight);

    doc.moveTo(M, badgeY + 24).lineTo(W - M, badgeY + 24).lineWidth(0.5).strokeColor(C.lineFaint).stroke();

    // ═══════════════════════════════════════
    // PAYMENT TABLE
    // ═══════════════════════════════════════
    const tableY = badgeY + 32;
    const colSN = M;
    const colDesc = M + 35;
    const colAmt = W - M - 80;
    const rowH = 24;

    // Table header
    doc.rect(M, tableY, CW, rowH).fill(C.brand);
    doc.fillColor(C.white).font('Helvetica-Bold').fontSize(8)
       .text('S.N.', colSN + 8, tableY + 8)
       .text('DESCRIPTION', colDesc + 5, tableY + 8)
       .text('AMOUNT (Rs.)', colAmt, tableY + 8, { width: 80, align: 'right' });

    // Table rows
    const rows = [
      { sn: '1', desc: `Maintenance Charges — ${monthName} ${payment.year}`, amt: payment.amount },
      { sn: '2', desc: 'Late Fee / Penalty', amt: payment.lateFee || 0 },
      { sn: '3', desc: 'Transfer Fee', amt: 0 },
      { sn: '4', desc: 'Other Charges', amt: 0 },
    ];

    let cy = tableY + rowH;
    rows.forEach((row, i) => {
      const bgColor = i % 2 === 0 ? C.row1 : C.row2;
      doc.rect(M, cy, CW, rowH).fill(bgColor);
      doc.rect(M, cy, CW, rowH).lineWidth(0.3).strokeColor(C.lineFaint).stroke();
      // Vertical lines
      doc.moveTo(colDesc - 2, cy).lineTo(colDesc - 2, cy + rowH).lineWidth(0.3).strokeColor(C.lineFaint).stroke();
      doc.moveTo(colAmt - 5, cy).lineTo(colAmt - 5, cy + rowH).lineWidth(0.3).strokeColor(C.lineFaint).stroke();

      doc.fillColor(C.sub).font('Helvetica').fontSize(8.5)
         .text(row.sn, colSN + 12, cy + 7);
      doc.fillColor(C.text).font('Helvetica').fontSize(8.5)
         .text(row.desc, colDesc + 5, cy + 7);
      
      if (row.amt > 0) {
        doc.fillColor(C.dark).font('Helvetica-Bold').fontSize(9)
           .text(formatINR(row.amt), colAmt, cy + 7, { width: 80, align: 'right' });
      } else {
        doc.fillColor(C.muted).font('Helvetica').fontSize(8.5)
           .text('—', colAmt + 35, cy + 7);
      }
      cy += rowH;
    });

    // ═══════════════════════════════════════
    // TOTAL ROW (highlighted)
    // ═══════════════════════════════════════
    doc.rect(M, cy, CW, 28).fill(C.brand);
    doc.fillColor(C.white).font('Helvetica-Bold').fontSize(10)
       .text('TOTAL AMOUNT', colDesc + 5, cy + 9)
       .fontSize(12)
       .text(formatINR(totalAmount), colAmt - 20, cy + 7, { width: 100, align: 'right' });
    cy += 28;

    // ═══════════════════════════════════════
    // PAYMENT DETAILS BOX
    // ═══════════════════════════════════════
    const detailY = cy + 12;
    doc.rect(M, detailY, CW, 48).lineWidth(0.5).strokeColor(C.line).stroke();
    doc.rect(M, detailY, CW, 48).fill('#fafafe');
    doc.rect(M, detailY, CW, 48).lineWidth(0.5).strokeColor(C.line).stroke();

    // Payment method
    const methodLabel = formatMethod(payment.paymentMethod);
    doc.fillColor(C.sub).font('Helvetica').fontSize(7.5).text('Payment Mode', M + 10, detailY + 6);
    doc.fillColor(C.dark).font('Helvetica-Bold').fontSize(9).text(methodLabel, M + 10, detailY + 17);

    // Amount paid
    doc.fillColor(C.sub).font('Helvetica').fontSize(7.5).text('Amount Paid', M + CW / 3, detailY + 6);
    doc.fillColor(C.success).font('Helvetica-Bold').fontSize(10)
       .text(formatINR(payment.paidAmount || totalAmount), M + CW / 3, detailY + 17);

    // Transaction ID / Status
    doc.fillColor(C.sub).font('Helvetica').fontSize(7.5).text('Status', M + (CW * 2) / 3, detailY + 6);
    const statusText = (payment.status || 'paid').toUpperCase();
    const statusColor = payment.status === 'paid' ? C.success : payment.status === 'partial' ? '#d97706' : '#dc2626';
    doc.fillColor(statusColor).font('Helvetica-Bold').fontSize(9).text(statusText, M + (CW * 2) / 3, detailY + 17);

    if (payment.transactionId) {
      doc.fillColor(C.muted).font('Helvetica').fontSize(7)
         .text(`Ref: ${payment.transactionId}`, M + 10, detailY + 33);
    }

    // ═══════════════════════════════════════
    // AMOUNT IN WORDS
    // ═══════════════════════════════════════
    const wordsY = detailY + 56;
    doc.fillColor(C.sub).font('Helvetica').fontSize(7).text('Amount in words:', M, wordsY);
    doc.fillColor(C.dark).font('Helvetica-BoldOblique').fontSize(8)
       .text(`Rupees ${numberToWords(totalAmount)} Only`, M, wordsY + 11);

    // ═══════════════════════════════════════
    // NOTES (if any)
    // ═══════════════════════════════════════
    let footerStartY = wordsY + 28;
    if (payment.notes) {
      doc.fillColor(C.sub).font('Helvetica').fontSize(7).text('Notes:', M, footerStartY);
      doc.fillColor(C.text).font('Helvetica').fontSize(7.5).text(payment.notes, M, footerStartY + 10, { width: CW });
      footerStartY += 25;
    }

    // ═══════════════════════════════════════
    // SIGNATURES & FOOTER
    // ═══════════════════════════════════════
    const sigY = Math.max(footerStartY + 8, H - 100);

    // Separator
    doc.moveTo(M, sigY).lineTo(W - M, sigY).lineWidth(0.3).strokeColor(C.lineFaint).stroke();

    // Left: Notes
    doc.fillColor(C.muted).font('Helvetica').fontSize(6.5)
       .text('Note:', M, sigY + 6)
       .text('1. Maintenance should be paid between 1st - 10th of every month.', M, sigY + 15)
       .text('2. This is a computer-generated receipt and does not require a physical signature.', M, sigY + 23);

    // Right: Authorized signature
    doc.moveTo(W - M - 120, sigY + 42).lineTo(W - M, sigY + 42).lineWidth(0.5).strokeColor(C.line).stroke();
    doc.fillColor(C.text).font('Helvetica-Bold').fontSize(7.5)
       .text('Authorized Signatory', W - M - 120, sigY + 46, { width: 120, align: 'center' });

    // ═══════════════════════════════════════
    // BOTTOM BRANDING BAR
    // ═══════════════════════════════════════
    const brandY = H - 32;
    doc.rect(M, brandY, CW, 18).fill(C.bg);
    doc.rect(M, brandY, CW, 18).lineWidth(0.3).strokeColor(C.lineFaint).stroke();
    doc.fillColor(C.muted).font('Helvetica').fontSize(6)
       .text('Generated by SocietySync — Smart Society Management Platform  |  Powered by Funkariya', M, brandY + 5, { width: CW, align: 'center' });

    // ═══════════════════════════════════════
    // WATERMARK (faint diagonal text)
    // ═══════════════════════════════════════
    if (payment.status === 'paid') {
      doc.save();
      doc.translate(W / 2, H / 2);
      doc.rotate(-35);
      doc.fillColor(C.success).opacity(0.04)
         .font('Helvetica-Bold').fontSize(70)
         .text('PAID', -80, -30);
      doc.restore();
    }

    doc.end();
  });
};

// ─── HELPERS ───

function formatINR(amount) {
  return 'Rs. ' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(amount || 0);
}

function formatMethod(method) {
  const map = { cash: 'Cash', upi: 'UPI', bank_transfer: 'Bank Transfer', cheque: 'Cheque', online: 'Online' };
  return map[method] || method || 'Cash';
}

function drawBadge(doc, x, y, text, color) {
  const w = text.length * 5.5 + 20;
  doc.roundedRect(x, y, w, 18, 9).fill(color);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(7.5)
     .text(text, x + 10, y + 4);
}

function numberToWords(num) {
  if (num === 0) return 'Zero';
  const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  
  const n = Math.floor(num);
  if (n < 0) return 'Minus ' + numberToWords(-n);

  let str = '';
  if (n >= 10000000) { str += numberToWords(Math.floor(n / 10000000)) + ' Crore '; }
  const rem1 = n % 10000000;
  if (rem1 >= 100000) { str += numberToWords(Math.floor(rem1 / 100000)) + ' Lakh '; }
  const rem2 = rem1 % 100000;
  if (rem2 >= 1000) { str += numberToWords(Math.floor(rem2 / 1000)) + ' Thousand '; }
  const rem3 = rem2 % 1000;
  if (rem3 >= 100) { str += ones[Math.floor(rem3 / 100)] + ' Hundred '; }
  const rem4 = rem3 % 100;
  if (rem4 > 0) {
    if (str) str += 'and ';
    if (rem4 < 20) { str += ones[rem4]; }
    else { str += tens[Math.floor(rem4 / 10)] + (rem4 % 10 ? ' ' + ones[rem4 % 10] : ''); }
  }
  return str.trim();
}

module.exports = {
  generatePaymentReceipt
};
