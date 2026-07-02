const Society = require('../models/Society');
const Flat = require('../models/Flat');

let lastCheckTime = 0;

/**
 * Checks all societies and resets occupied flats' payment status to 'pending'
 * if a new month has started.
 */
const checkAndResetMonthlyStatuses = async () => {
  try {
    const nowTime = Date.now();
    // Throttle checks to once every 60 seconds to avoid DB spam
    if (nowTime - lastCheckTime < 60000) {
      return;
    }
    lastCheckTime = nowTime;

    const now = new Date();
    // Use IST/Local time for comparison
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentYear = now.getFullYear();

    console.log(`[MonthlyReset] Running check for ${currentMonth}/${currentYear}...`);

    const societies = await Society.find({});
    
    for (const society of societies) {
      const needsReset = 
        society.lastPaymentResetMonth !== currentMonth || 
        society.lastPaymentResetYear !== currentYear;

      if (needsReset) {
        console.log(`[MonthlyReset] Resetting occupied flats for society: ${society.name} (${society._id})`);
        
        // Reset occupied flats to pending. Vacant flats are left as is.
        const result = await Flat.updateMany(
          {
            societyId: society._id,
            isOccupied: true,
            ownerName: { $ne: 'Vacant' }
          },
          {
            currentMonthStatus: 'pending',
            currentMonth: currentMonth,
            currentYear: currentYear
          }
        );

        console.log(`[MonthlyReset] Reset completed. Modified ${result.modifiedCount} flats.`);

        // Update society reset timestamp
        society.lastPaymentResetMonth = currentMonth;
        society.lastPaymentResetYear = currentYear;
        await society.save();
      }
    }
  } catch (error) {
    console.error('[MonthlyReset] Error in checkAndResetMonthlyStatuses:', error.message);
  }
};

module.exports = {
  checkAndResetMonthlyStatuses
};
