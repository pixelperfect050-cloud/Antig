const express = require('express');
const router = express.Router();
const Block = require('../models/Block');
const Flat = require('../models/Flat');
const Society = require('../models/Society');
const { auth, adminOnly } = require('../middleware/auth');

// Create block (auto-creates flats)
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { name, societyId, totalFloors, flatsPerFloor, description } = req.body;

    const block = new Block({ name, societyId, totalFloors, flatsPerFloor, description });
    await block.save();

    // Auto-create flats for this block
    const flats = [];
    for (let floor = 1; floor <= totalFloors; floor++) {
      for (let flatNum = 1; flatNum <= flatsPerFloor; flatNum++) {
        const flatNumber = `${name}-${floor}${String(flatNum).padStart(2, '0')}`;
        flats.push({
          number: flatNumber,
          blockId: block._id,
          societyId,
          floor
        });
      }
    }

    await Flat.insertMany(flats);

    // Update society counts
    const totalBlocks = await Block.countDocuments({ societyId });
    const totalFlatsCount = await Flat.countDocuments({ societyId });
    await Society.findByIdAndUpdate(societyId, { totalBlocks, totalFlats: totalFlatsCount });

    const createdFlats = await Flat.find({ blockId: block._id });
    res.status(201).json({ block, flats: createdFlats });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUBLIC: Get blocks by societyId (for join flow - no auth required)
router.get('/public/:societyId', async (req, res) => {
  try {
    const blocks = await Block.find({ societyId: req.params.societyId }).select('name _id description');
    res.json(blocks);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all blocks of a society
router.get('/society/:societyId', auth, async (req, res) => {
  try {
    const blocks = await Block.find({ societyId: req.params.societyId });

    // Get flat counts and status summary for each block
    const blocksWithStats = await Promise.all(
      blocks.map(async (block) => {
        const flats = await Flat.find({ blockId: block._id });
        const paid = flats.filter(f => f.currentMonthStatus === 'paid').length;
        const pending = flats.filter(f => f.currentMonthStatus === 'pending').length;
        const partial = flats.filter(f => f.currentMonthStatus === 'partial').length;

        return {
          ...block.toJSON(),
          flatStats: { total: flats.length, paid, pending, partial }
        };
      })
    );

    res.json(blocksWithStats);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single block
router.get('/:id', auth, async (req, res) => {
  try {
    const block = await Block.findById(req.params.id);
    if (!block) return res.status(404).json({ message: 'Block not found' });
    res.json(block);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update block
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const block = await Block.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!block) return res.status(404).json({ message: 'Block not found' });
    res.json(block);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete block and its flats
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const block = await Block.findById(req.params.id);
    if (!block) return res.status(404).json({ message: 'Block not found' });

    await Flat.deleteMany({ blockId: block._id });
    await Block.findByIdAndDelete(req.params.id);

    // Update society counts
    const totalBlocks = await Block.countDocuments({ societyId: block.societyId });
    const totalFlats = await Flat.countDocuments({ societyId: block.societyId });
    await Society.findByIdAndUpdate(block.societyId, { totalBlocks, totalFlats });

    res.json({ message: 'Block and associated flats deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
