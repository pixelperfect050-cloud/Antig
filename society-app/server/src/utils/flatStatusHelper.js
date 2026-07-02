const Payment = require('../models/Payment');
const Flat = require('../models/Flat');

async function updateFlatStatus(flatId) {
  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Check if there are ANY pending or partial payments for this flat
    const pendingPayments = await Payment.findOne({
      flatId,
      status: { $in: ['pending', 'partial'] }
    });

    let newStatus = 'paid';

    if (pendingPayments) {
      newStatus = 'pending';
      const onlyPartial = await Payment.findOne({
        flatId,
        status: 'pending'
      });
      if (!onlyPartial) {
        newStatus = 'partial';
      }
    } else {
      const currentMonthBill = await Payment.findOne({
        flatId,
        month: currentMonth,
        year: currentYear
      });

      if (!currentMonthBill) {
         newStatus = 'paid'; 
      } else {
         newStatus = currentMonthBill.status;
      }
    }

    await Flat.findByIdAndUpdate(flatId, { currentMonthStatus: newStatus });
    console.log(`[FlatStatus] Updated flat ${flatId} status to: ${newStatus}`);
  } catch (error) {
    console.error('[FlatStatus] Error updating flat status:', error.message);
  }
}

module.exports = { updateFlatStatus };
