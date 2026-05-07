const PDFDocument = require('pdfkit');

/**
 * Generate a payment receipt PDF
 */
const generatePaymentReceipt = (payment, society, flat) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A5' }); // A5 is good for receipts
    const buffers = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    // --- Header ---
    doc.fillColor('#444444')
       .fontSize(20)
       .text(society.name.toUpperCase(), { align: 'center' })
       .fontSize(10)
       .text(society.address, { align: 'center' })
       .moveDown();

    doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke('#eeeeee');
    doc.moveDown();

    // --- Receipt Info ---
    doc.fillColor('#000000')
       .fontSize(14)
       .text('PAYMENT RECEIPT', { align: 'center', underline: true })
       .moveDown();

    if (payment.status === 'paid') {
      doc.save();
      doc.rotate(-20, { origin: [doc.page.width - 100, 100] });
      doc.rect(doc.page.width - 150, 80, 80, 30).lineWidth(2).stroke('#10b981');
      doc.fillColor('#10b981').fontSize(16).font('Helvetica-Bold')
         .text('PAID', doc.page.width - 150, 87, { width: 80, align: 'center' });
      doc.restore();
    }

    const top = doc.y;
    doc.fontSize(10)
       .text(`Receipt No: REC-${payment._id.toString().slice(-6).toUpperCase()}`, 50, top)
       .text(`Date: ${new Date(payment.paidDate || Date.now()).toLocaleDateString()}`, 50, top + 15);

    doc.moveDown();

    // --- Bill To ---
    doc.fontSize(11).font('Helvetica-Bold').text('Bill To:', 50, doc.y);
    doc.font('Helvetica').fontSize(10)
       .text(`Name: ${flat.ownerName}`)
       .text(`Flat: ${flat.number} (${flat.blockId?.name || ''})`)
       .moveDown();

    // --- Table ---
    const tableTop = doc.y;
    doc.rect(50, tableTop, doc.page.width - 100, 20).fill('#f6f6f6');
    doc.fillColor('#333333').font('Helvetica-Bold')
       .text('Description', 60, tableTop + 5)
       .text('Amount (₹)', doc.page.width - 120, tableTop + 5, { align: 'right' });

    doc.fillColor('#000000').font('Helvetica')
       .text(`Maintenance for ${new Date(payment.year, payment.month - 1).toLocaleString('default', { month: 'long' })} ${payment.year}`, 60, tableTop + 25)
       .text(`${payment.amount.toFixed(2)}`, doc.page.width - 120, tableTop + 25, { align: 'right' });

    if (payment.lateFee > 0) {
      doc.text('Late Fee', 60, tableTop + 40)
         .text(`${payment.lateFee.toFixed(2)}`, doc.page.width - 120, tableTop + 40, { align: 'right' });
    }

    doc.moveTo(50, tableTop + 60).lineTo(doc.page.width - 50, tableTop + 60).stroke('#eeeeee');

    // --- Total ---
    doc.font('Helvetica-Bold')
       .text('Total Amount:', 60, tableTop + 70)
       .text(`₹${(payment.amount + payment.lateFee).toFixed(2)}`, doc.page.width - 120, tableTop + 70, { align: 'right' });

    doc.fillColor('#10b981')
       .text('Amount Paid:', 60, tableTop + 85)
       .text(`₹${payment.paidAmount.toFixed(2)}`, doc.page.width - 120, tableTop + 85, { align: 'right' });

    doc.fillColor('#000000')
       .fontSize(9)
       .text(`Payment Method: ${payment.paymentMethod.toUpperCase()}`, 60, tableTop + 105);
    
    if (payment.transactionId) {
      doc.text(`Transaction ID: ${payment.transactionId}`, 60, tableTop + 115);
    }

    // --- Footer ---
    const footerTop = doc.page.height - 70;
    doc.moveTo(50, footerTop).lineTo(doc.page.width - 50, footerTop).stroke('#eeeeee');
    doc.fontSize(8).fillColor('#888888')
       .text('This is a computer generated receipt and does not require a signature.', 50, footerTop + 10, { align: 'center' })
       .text(`Generated via ${society.name} Management System`, 50, footerTop + 20, { align: 'center' });

    doc.end();
  });
};

module.exports = {
  generatePaymentReceipt
};
