const mongoose = require('mongoose');

const flatSchema = new mongoose.Schema({
  number: {
    type: String,
    required: [true, 'Flat number is required'],
    trim: true
  },
  blockId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Block',
    required: true
  },
  societyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Society',
    required: true
  },
  floor: {
    type: Number,
    required: true
  },
  ownerName: {
    type: String,
    trim: true,
    default: 'Vacant'
  },
  ownerPhone: {
    type: String,
    trim: true,
    default: ''
  },
  ownerEmail: {
    type: String,
    trim: true,
    default: ''
  },
  tenantName: {
    type: String,
    trim: true,
    default: ''
  },
  tenantPhone: {
    type: String,
    trim: true,
    default: ''
  },
  area: {
    type: Number,
    default: 0
  },
  type: {
    type: String,
    enum: ['1BHK', '2BHK', '3BHK', '4BHK', 'Studio', 'Penthouse', 'Other'],
    default: '2BHK'
  },
  isOccupied: {
    type: Boolean,
    default: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  currentMonthStatus: {
    type: String,
    enum: ['paid', 'pending', 'partial'],
    default: 'pending'
  },
  currentMonth: {
    type: Number,
    default: () => new Date().getMonth() + 1
  },
  currentYear: {
    type: Number,
    default: () => new Date().getFullYear()
  }
}, { timestamps: true });

module.exports = mongoose.model('Flat', flatSchema);
