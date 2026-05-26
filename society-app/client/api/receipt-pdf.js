import PDFDocument from 'pdfkit';
import { createClient } from '@supabase/supabase-js';

// Helper for INR currency formatting
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

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: 'Payment ID is required' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    return res.status(500).json({ error: 'Supabase configuration missing' });
  }
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // 1. Fetch payment
    const { data: payment, error: pErr } = await supabase
      .from('payments')
      .select('*')
      .eq('id', id)
      .single();

    if (pErr || !payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // 2. Fetch society
    const { data: society, error: sErr } = await supabase
      .from('societies')
      .select('*')
      .eq('id', payment.society_id)
      .single();

    // 3. Fetch flat
    const { data: flat, error: fErr } = await supabase
      .from('flats')
      .select('*, block:blocks(name)')
      .eq('id', payment.flat_id)
      .single();

    if (!society || !flat) {
      return res.status(404).json({ error: 'Associated society or flat not found' });
    }

    // Generate PDFKit document
    const doc = new PDFDocument({
      margin: 0,
      size: 'A5',
      info: {
        Title: `Receipt_${payment.receipt_number || payment.id}`,
        Author: society.name,
        Subject: 'Maintenance Payment Receipt'
      }
    });

    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(buffers);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=Receipt_${payment.month}_${payment.year}.pdf`);
      res.status(200).send(pdfBuffer);
    });

    const W = doc.page.width;   // ~419
    const H = doc.page.height;  // ~595
    const M = 28;               // margin
    const CW = W - M * 2;       // content width

    const C = {
      brand: '#1e1b4b',
      brandLight: '#4338ca',
      accent: '#6366f1',
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
    const totalAmount = (payment.amount || 0) + (payment.late_fee || 0);
    const paidDate = payment.paid_date ? new Date(payment.paid_date) : new Date();
    const receiptNo = payment.receipt_number || `RCP-${payment.id.toString().slice(-8).toUpperCase()}`;

    // Outer borders
    doc.rect(10, 10, W - 20, H - 20).lineWidth(1.5).strokeColor(C.brand).stroke();
    doc.rect(14, 14, W - 28, H - 28).lineWidth(0.5).strokeColor(C.brandLight).stroke();

    // Header band
    doc.rect(M, M, CW, 60).fill(C.brand);
    doc.rect(M, M, CW, 3).fill(C.accent);

    doc.fillColor(C.white).font('Helvetica-Bold').fontSize(16)
       .text((society.name || 'SOCIETY NAME').toUpperCase(), M, M + 12, { width: CW, align: 'center' });

    const addr = [society.address, society.city, society.state, society.pincode].filter(Boolean).join(', ');
    if (addr) {
      doc.font('Helvetica').fontSize(7).fillColor('#c7d2fe')
         .text(addr, M, M + 33, { width: CW, align: 'center' });
    }

    if (society.contact_number) {
      doc.fontSize(7).fillColor('#c7d2fe')
         .text(`Contact: +91 ${society.contact_number}`, M, M + 44, { width: CW, align: 'center' });
    }

    // Title bar
    const titleY = M + 65;
    doc.rect(M, titleY, CW, 22).fill(C.bg);
    doc.rect(M, titleY, CW, 22).lineWidth(0.5).strokeColor(C.line).stroke();
    doc.fillColor(C.brand).font('Helvetica-Bold').fontSize(11)
       .text('MAINTENANCE RECEIPT', M, titleY + 5, { width: CW, align: 'center' });

    // Receipt info row
    const infoY = titleY + 30;
    doc.fillColor(C.sub).font('Helvetica').fontSize(8).text('Receipt No.', M, infoY);
    doc.fillColor(C.dark).font('Helvetica-Bold').fontSize(9).text(receiptNo, M, infoY + 11);

    doc.fillColor(C.sub).font('Helvetica').fontSize(8).text('Date', W - M - 100, infoY, { width: 100, align: 'right' });
    doc.fillColor(C.dark).font('Helvetica-Bold').fontSize(9)
       .text(paidDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), W - M - 100, infoY + 11, { width: 100, align: 'right' });

    doc.moveTo(M, infoY + 26).lineTo(W - M, infoY + 26).lineWidth(0.5).strokeColor(C.lineFaint).stroke();

    // Received from
    const recY = infoY + 34;
    doc.fillColor(C.sub).font('Helvetica').fontSize(8).text('Received with thanks from', M, recY);
    doc.fillColor(C.dark).font('Helvetica-Bold').fontSize(12).text(flat.owner_name || 'N/A', M, recY + 12);

    const badgeY = recY + 30;
    const blockName = flat.block?.name || '';
    const flatNumber = flat.number || '';
    const flatLabel = blockName ? `${blockName} - ${flatNumber}` : flatNumber;

    drawBadge(doc, M, badgeY, `Flat: ${flatLabel}`, C.brand);
    drawBadge(doc, M + 80, badgeY, `Period: ${monthName} ${payment.year}`, C.brandLight);

    doc.moveTo(M, badgeY + 24).lineTo(W - M, badgeY + 24).lineWidth(0.5).strokeColor(C.lineFaint).stroke();

    // Table
    const tableY = badgeY + 32;
    const colSN = M;
    const colDesc = M + 35;
    const colAmt = W - M - 80;
    const rowH = 24;

    doc.rect(M, tableY, CW, rowH).fill(C.brand);
    doc.fillColor(C.white).font('Helvetica-Bold').fontSize(8)
       .text('S.N.', colSN + 8, tableY + 8)
       .text('DESCRIPTION', colDesc + 5, tableY + 8)
       .text('AMOUNT (Rs.)', colAmt, tableY + 8, { width: 80, align: 'right' });

    const rows = [
      { sn: '1', desc: `Maintenance Charges — ${monthName} ${payment.year}`, amt: payment.amount },
      { sn: '2', desc: 'Late Fee / Penalty', amt: payment.late_fee || 0 },
      { sn: '3', desc: 'Transfer Fee', amt: 0 },
      { sn: '4', desc: 'Other Charges', amt: 0 },
    ];

    let cy = tableY + rowH;
    rows.forEach((row, i) => {
      const bgColor = i % 2 === 0 ? C.row1 : C.row2;
      doc.rect(M, cy, CW, rowH).fill(bgColor);
      doc.rect(M, cy, CW, rowH).lineWidth(0.3).strokeColor(C.lineFaint).stroke();
      doc.moveTo(colDesc - 2, cy).lineTo(colDesc - 2, cy + rowH).lineWidth(0.3).strokeColor(C.lineFaint).stroke();
      doc.moveTo(colAmt - 5, cy).lineTo(colAmt - 5, cy + rowH).lineWidth(0.3).strokeColor(C.lineFaint).stroke();

      doc.fillColor(C.sub).font('Helvetica').fontSize(8.5).text(row.sn, colSN + 12, cy + 7);
      doc.fillColor(C.text).font('Helvetica').fontSize(8.5).text(row.desc, colDesc + 5, cy + 7);
      
      if (row.amt > 0) {
        doc.fillColor(C.dark).font('Helvetica-Bold').fontSize(9).text(formatINR(row.amt), colAmt, cy + 7, { width: 80, align: 'right' });
      } else {
        doc.fillColor(C.muted).font('Helvetica').fontSize(8.5).text('—', colAmt + 35, cy + 7);
      }
      cy += rowH;
    });

    // Total Row
    doc.rect(M, cy, CW, 28).fill(C.brand);
    doc.fillColor(C.white).font('Helvetica-Bold').fontSize(10)
       .text('TOTAL AMOUNT', colDesc + 5, cy + 9)
       .fontSize(12)
       .text(formatINR(totalAmount), colAmt - 20, cy + 7, { width: 100, align: 'right' });
    cy += 28;

    // Details box
    const detailY = cy + 12;
    doc.rect(M, detailY, CW, 48).lineWidth(0.5).strokeColor(C.line).stroke();
    doc.rect(M, detailY, CW, 48).fill('#fafafe');
    doc.rect(M, detailY, CW, 48).lineWidth(0.5).strokeColor(C.line).stroke();

    doc.fillColor(C.sub).font('Helvetica').fontSize(7.5).text('Payment Mode', M + 10, detailY + 6);
    doc.fillColor(C.dark).font('Helvetica-Bold').fontSize(9).text(formatMethod(payment.payment_method), M + 10, detailY + 17);

    doc.fillColor(C.sub).font('Helvetica').fontSize(7.5).text('Amount Paid', M + CW / 3, detailY + 6);
    doc.fillColor(C.success).font('Helvetica-Bold').fontSize(10).text(formatINR(payment.paid_amount || totalAmount), M + CW / 3, detailY + 17);

    doc.fillColor(C.sub).font('Helvetica').fontSize(7.5).text('Status', M + (CW * 2) / 3, detailY + 6);
    const statusText = (payment.status || 'paid').toUpperCase();
    const statusColor = payment.status === 'paid' ? C.success : payment.status === 'partial' ? '#d97706' : '#dc2626';
    doc.fillColor(statusColor).font('Helvetica-Bold').fontSize(9).text(statusText, M + (CW * 2) / 3, detailY + 17);

    if (payment.transaction_id) {
      doc.fillColor(C.muted).font('Helvetica').fontSize(7).text(`Ref: ${payment.transaction_id}`, M + 10, detailY + 33);
    }

    // Amount in words
    const wordsY = detailY + 56;
    doc.fillColor(C.sub).font('Helvetica').fontSize(7).text('Amount in words:', M, wordsY);
    doc.fillColor(C.dark).font('Helvetica-BoldOblique').fontSize(8).text(`Rupees ${numberToWords(totalAmount)} Only`, M, wordsY + 11);

    let footerStartY = wordsY + 28;
    if (payment.notes) {
      doc.fillColor(C.sub).font('Helvetica').fontSize(7).text('Notes:', M, footerStartY);
      doc.fillColor(C.text).font('Helvetica').fontSize(7.5).text(payment.notes, M, footerStartY + 10, { width: CW });
      footerStartY += 25;
    }

    const sigY = Math.max(footerStartY + 8, H - 100);
    doc.moveTo(M, sigY).lineTo(W - M, sigY).lineWidth(0.3).strokeColor(C.lineFaint).stroke();

    doc.fillColor(C.muted).font('Helvetica').fontSize(6.5)
       .text('Note:', M, sigY + 6)
       .text('1. Maintenance should be paid between 1st - 10th of every month.', M, sigY + 15)
       .text('2. This is a computer-generated receipt and does not require a physical signature.', M, sigY + 23);

    doc.moveTo(W - M - 120, sigY + 42).lineTo(W - M, sigY + 42).lineWidth(0.5).strokeColor(C.line).stroke();
    doc.fillColor(C.text).font('Helvetica-Bold').fontSize(7.5).text('Authorized Signatory', W - M - 120, sigY + 46, { width: 120, align: 'center' });

    const brandY = H - 32;
    doc.rect(M, brandY, CW, 18).fill(C.bg);
    doc.rect(M, brandY, CW, 18).lineWidth(0.3).strokeColor(C.lineFaint).stroke();
    doc.fillColor(C.muted).font('Helvetica').fontSize(6)
       .text('Generated by SocietySync — Smart Society Management Platform  |  Powered by Funkariya', M, brandY + 5, { width: CW, align: 'center' });

    if (payment.status === 'paid') {
      doc.save();
      doc.translate(W / 2, H / 2);
      doc.rotate(-35);
      doc.fillColor(C.success).opacity(0.04).font('Helvetica-Bold').fontSize(70).text('PAID', -80, -30);
      doc.restore();
    }

    doc.end();
  } catch (error) {
    console.error('Serverless PDF Error:', error);
    res.status(500).json({ error: 'Serverless PDF generation failed', details: error.message });
  }
}
