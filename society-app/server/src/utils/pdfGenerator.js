const PDFDocument = require('pdfkit');

/**
 * Generate a payment receipt PDF matching the requested layout
 * Inspired by the physical receipt format: MARJAN RESIDENCY
 */
const generatePaymentReceipt = (payment, society, flat) => {
  return new Promise((resolve, reject) => {
    // A5 size is common for receipts. Portrait orientation.
    const doc = new PDFDocument({ 
      margin: 30, 
      size: 'A5',
      info: {
        Title: `Receipt_${payment._id}`,
        Author: society.name
      }
    }); 
    const buffers = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const pageWidth = doc.page.width;
    const contentWidth = pageWidth - 60;

    // --- LOGO / SOCIETY NAME ---
    doc.fillColor('#1a365d') // Premium dark blue
       .fontSize(24)
       .font('Helvetica-Bold')
       .text(society.name.toUpperCase(), { align: 'center' });

    // --- ADDRESS & CONTACT INFO ---
    doc.fillColor('#444444')
       .fontSize(8)
       .font('Helvetica')
       .text(`${society.address || ''}`, { align: 'center' });
    
    const cityLine = `${society.city || ''}${society.state ? ', ' + society.state : ''}${society.pincode ? ' - ' + society.pincode : ''}`;
    if (cityLine) {
        doc.text(cityLine, { align: 'center' });
    }
    
    if (society.contactNumber) {
        doc.fillColor('#1a365d').font('Helvetica-Bold').text(`M.: +91 ${society.contactNumber}`, { align: 'center' });
    }
    doc.moveDown(0.5);

    // --- MAINTENANCE RECEIPT BAR ---
    const headerY = doc.y;
    doc.rect(30, headerY, contentWidth, 25).fill('#1a365d');
    doc.fillColor('#ffffff')
       .fontSize(12)
       .font('Helvetica-Bold')
       .text('MAINTENANCE RECEIPT', 30, headerY + 7, { width: contentWidth, align: 'center' });
    
    doc.moveDown(1.5);
    doc.fillColor('#000000').font('Helvetica');

    // --- RECEIPT NO & DATE ---
    const infoY = doc.y;
    doc.fontSize(10)
       .font('Helvetica').text(`Receipt No : `, 30, infoY)
       .font('Helvetica-Bold').text(`${payment._id.toString().slice(-6).toUpperCase()}`, 95, infoY)
       .font('Helvetica').text(`Date : `, pageWidth - 140, infoY)
       .font('Helvetica-Bold').text(`${new Date(payment.paidDate || Date.now()).toLocaleDateString('en-IN')}`, pageWidth - 105, infoY);

    doc.moveDown(0.8);

    // --- RECEIVED WITH THANKS FROM ---
    const receivedY = doc.y;
    doc.font('Helvetica').text(`Received with thanks from : `, 30, receivedY);
    
    // Name value with underline
    doc.font('Helvetica-Bold').fontSize(11).text(`${flat.ownerName}`, 160, receivedY);
    doc.moveTo(160, receivedY + 12).lineTo(pageWidth - 30, receivedY + 12).lineWidth(0.5).stroke('#000000');

    doc.moveDown(1.2);

    // --- BLOCK & HOUSE NO ---
    const blockY = doc.y;
    doc.fontSize(10).font('Helvetica').text(`BLOCK & HOUSE No. : `, 30, blockY);
    
    // Stylized box for the house number
    doc.rect(145, blockY - 5, 110, 22).lineWidth(1).stroke('#1a365d');
    doc.fillColor('#1a365d').font('Helvetica-Bold').fontSize(11).text(`${flat.blockId?.name || ''} - ${flat.number}`, 150, blockY);
    doc.fillColor('#000000');

    doc.moveDown(1.8);

    // --- MAIN TABLE ---
    const tableTop = doc.y;
    const col1 = 30;  // SN
    const col2 = 60;  // Description
    const col3 = pageWidth - 100; // Amount
    const tableWidth = contentWidth;

    // Header Row
    doc.rect(col1, tableTop, tableWidth, 20).fill('#f8fafc').stroke('#cbd5e1');
    doc.fillColor('#1e293b').fontSize(9).font('Helvetica-Bold')
       .text('S.N.', col1 + 5, tableTop + 6)
       .text('DESCRIPTION', col2 + 20, tableTop + 6)
       .text('AMOUNT', col3 + 10, tableTop + 6);

    // Data Rows
    const rowHeight = 25;
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthName = months[payment.month - 1];

    const rows = [
      { sn: '1', desc: `Maintenance Pay of Month : ${monthName} ${payment.year}`, amt: payment.amount },
      { sn: '2', desc: 'Late Fee Penalty', amt: payment.lateFee || 0 },
      { sn: '3', desc: 'Transfer Fee', amt: 0 },
      { sn: '4', desc: 'Other Charges', amt: 0 }
    ];

    let currentY = tableTop + 20;
    rows.forEach((row, i) => {
      doc.rect(col1, currentY, tableWidth, rowHeight).stroke('#cbd5e1');
      // Vertical separators
      doc.moveTo(col2, currentY).lineTo(col2, currentY + rowHeight).stroke('#cbd5e1');
      doc.moveTo(col3, currentY).lineTo(col3, currentY + rowHeight).stroke('#cbd5e1');

      doc.fillColor('#000000').font('Helvetica').fontSize(10)
         .text(row.sn, col1 + 10, currentY + 8)
         .text(row.desc, col2 + 10, currentY + 8);
      
      if (row.amt > 0) {
          doc.font('Helvetica-Bold').text(`₹ ${row.amt.toFixed(2)}`, col3 + 5, currentY + 8, { width: 65, align: 'right' });
      } else {
          doc.text('-', col3 + 30, currentY + 8);
      }
      
      currentY += rowHeight;
    });

    // --- PAYMENT SUMMARY & TOTAL ---
    // Bottom box for payment mode and total
    doc.rect(col1, currentY, tableWidth, 50).stroke('#cbd5e1');
    doc.moveTo(col3, currentY).lineTo(col3, currentY + 50).stroke('#cbd5e1');

    // Payment Mode Section
    doc.fontSize(9).font('Helvetica-Bold').text('Payment Mode :', col1 + 10, currentY + 12);
    
    const modeX = col1 + 90;
    const modes = ['Cash', 'Cheque', 'Online'];
    modes.forEach((mode, i) => {
        const isSelected = payment.paymentMethod.toLowerCase() === mode.toLowerCase();
        // Checkbox
        doc.rect(modeX + (i * 65), currentY + 10, 10, 10).stroke('#475569');
        if (isSelected) {
            doc.fillColor('#1a365d').text('X', modeX + (i * 65) + 2, currentY + 11).fillColor('#000000');
        }
        doc.font('Helvetica').text(mode, modeX + (i * 65) + 15, currentY + 12);
    });

    if (payment.transactionId) {
        doc.fontSize(8).font('Helvetica-Oblique').text(`Ref/Cheque No.: ${payment.transactionId}`, col1 + 90, currentY + 28);
    }

    // Total Amount Section
    const totalAmount = payment.amount + (payment.lateFee || 0);
    doc.fontSize(10).font('Helvetica-Bold')
       .text('Total Amount', col3 - 85, currentY + 18)
       .fillColor('#1a365d')
       .text(`₹ ${totalAmount.toFixed(2)} /-`, col3 + 5, currentY + 18, { width: 65, align: 'right' });

    doc.fillColor('#000000');
    currentY += 70;

    // --- SIGNATURES / FOOTER ---
    const footerY = currentY;
    
    // Left side: Computer generated note
    doc.fontSize(8).font('Helvetica-Oblique').fillColor('#64748b')
       .text('Note:', 30, footerY)
       .text('1. Maintenance should be paid between 1st to 10th of every month.', 30, footerY + 12)
       .text('2. This is a computer generated receipt.', 30, footerY + 22);

    // Right side: Signature
    doc.fillColor('#000000').font('Helvetica-Bold').fontSize(10)
       .text('Receiver\'s Signature', pageWidth - 150, footerY + 40, { align: 'right' });
    doc.moveTo(pageWidth - 160, footerY + 35).lineTo(pageWidth - 30, footerY + 35).lineWidth(0.5).stroke('#cbd5e1');

    doc.end();
  });
};

module.exports = {
  generatePaymentReceipt
};
