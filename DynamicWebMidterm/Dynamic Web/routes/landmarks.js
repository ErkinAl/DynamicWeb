const express = require('express');
const router = express.Router();
const Landmark = require('../models/Landmark');
const VisitedLandmark = require('../models/VisitedLandmark');
const mongoose = require('mongoose');

// Tüm landmarkları getir
router.get('/', async (req, res) => {
    try {
        const landmarks = await Landmark.find();
        res.json(landmarks);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Yeni landmark ekle
router.post('/', async (req, res) => {
    console.log('POST request received with body:', req.body);
    
    try {
        // Create new landmark with all fields, including notes if provided
        const landmark = new Landmark({
            name: req.body.name,
            location: req.body.location,
            description: req.body.description,
            category: req.body.category,
            notes: req.body.notes || '' // Include notes if provided, otherwise empty string
        });

        const newLandmark = await landmark.save();
        console.log('New landmark saved:', newLandmark);
        res.status(201).json(newLandmark);
    } catch (err) {
        console.error('Error saving landmark:', err);
        res.status(400).json({ message: err.message });
    }
});


// Belirli bir landmarkı getir
router.get('/:id', async (req, res) => {
    try {
        const landmark = await Landmark.findById(req.params.id);
        if (!landmark) {
            return res.status(404).json({ message: 'Landmark bulunamadı' });
        }
        res.json(landmark);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Landmark güncelle
router.put('/:id', async (req, res) => {
    try {
        console.log(`Updating landmark ID: ${req.params.id} with data:`, req.body);
        
        // Check if the ID is valid
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid landmark ID format' });
        }
        
        const landmark = await Landmark.findById(req.params.id);
        if (!landmark) {
            return res.status(404).json({ message: 'Landmark bulunamadı' });
        }

        // Update only the fields that are provided
        if (req.body.name) landmark.name = req.body.name;
        if (req.body.description) landmark.description = req.body.description;
        if (req.body.category) landmark.category = req.body.category;
        if (req.body.location) landmark.location = req.body.location;
        
        // Notes can be set to empty string
        if (req.body.notes !== undefined) landmark.notes = req.body.notes;

        const updatedLandmark = await landmark.save();
        console.log('Landmark updated successfully:', updatedLandmark);
        res.json(updatedLandmark);
    } catch (err) {
        console.error('Error updating landmark:', err);
        res.status(400).json({ message: err.message });
    }
});

// Landmark sil
router.delete('/:id', async (req, res) => {
    try {
        console.log(`Attempting to delete landmark with ID: ${req.params.id}`);
        console.log('Query parameters:', req.query);
        
        // First check if the ID is valid
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            console.log('Invalid ObjectID format');
            return res.status(400).json({ message: 'Invalid landmark ID format' });
        }
        
        const landmarkId = req.params.id;
        let visitRecordsDeleted = 0;
        
        // Always perform cascade delete to avoid orphaned records
        // This ensures VisitedLandmarks are deleted even if cascade=true is not explicitly set
        try {
            // Find all visit records for this landmark
            const matchingRecords = await VisitedLandmark.find({ landmark_id: landmarkId });
            console.log(`Found ${matchingRecords.length} visit records associated with this landmark`);
            
            if (matchingRecords.length > 0) {
                // Delete the visit records
                const deleteResult = await VisitedLandmark.deleteMany({ landmark_id: landmarkId });
                visitRecordsDeleted = deleteResult.deletedCount;
                console.log(`Deleted ${visitRecordsDeleted} visit records`);
                
                // Check if any remaining
                const remainingRecords = await VisitedLandmark.find({ landmark_id: landmarkId });
                if (remainingRecords.length > 0) {
                    console.warn(`Some visit records (${remainingRecords.length}) could not be deleted`);
                }
            }
        } catch (visitErr) {
            console.error('Error deleting visit records:', visitErr);
            // Continue with landmark deletion even if visit deletion fails
        }
        
        // Step 2: Find the landmark
        const landmark = await Landmark.findById(landmarkId);
        console.log('Found landmark:', landmark);
        
        if (!landmark) {
            console.log('Landmark not found');
            return res.status(404).json({ 
                message: 'Landmark not found',
                visitRecordsDeleted
            });
        }

        // Step 3: Delete the landmark
        try {
            const result = await Landmark.deleteOne({ _id: landmarkId });
            console.log('Delete result:', result);
            
            if (result.deletedCount === 0) {
                return res.status(404).json({ 
                    message: 'Landmark deletion failed - not found',
                    visitRecordsDeleted 
                });
            }
            
            res.json({ 
                message: 'Landmark and associated records deleted successfully', 
                visitRecordsDeleted,
                landmarkDeleted: true
            });
        } catch (deleteErr) {
            console.error('Error in deleteOne operation:', deleteErr);
            
            // Try alternative method as fallback
            try {
                await Landmark.findByIdAndDelete(landmarkId);
                res.json({ 
                    message: 'Landmark deleted (fallback method)',
                    visitRecordsDeleted,
                    landmarkDeleted: true
                });
            } catch (fallbackErr) {
                console.error('Fallback deletion also failed:', fallbackErr);
                throw fallbackErr;
            }
        }
    } catch (err) {
        console.error('Overall error in delete endpoint:', err);
        res.status(500).json({ 
            message: err.message,
            stack: process.env.NODE_ENV === 'production' ? null : err.stack
        });
    }
});

// Delete all visited landmarks for a specific landmark
router.delete('/:id/visited', async (req, res) => {
    try {
        console.log(`Attempting to delete all visit records for landmark ID: ${req.params.id}`);
        
        // Check if the ID is valid
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid landmark ID format' });
        }
        
        const landmarkId = req.params.id;
        
        // Find and count all visit records for this landmark
        const matchingRecords = await VisitedLandmark.find({ landmark_id: landmarkId });
        console.log(`Found ${matchingRecords.length} visit records associated with this landmark`);
        
        if (matchingRecords.length === 0) {
            return res.json({ 
                message: 'No visit records found for this landmark',
                deletedCount: 0
            });
        }
        
        // Delete all visit records
        const deleteResult = await VisitedLandmark.deleteMany({ landmark_id: landmarkId });
        const deletedCount = deleteResult.deletedCount;
        console.log(`Deleted ${deletedCount} visit records`);
        
        // Check if any remaining
        const remainingRecords = await VisitedLandmark.find({ landmark_id: landmarkId });
        if (remainingRecords.length > 0) {
            console.warn(`Some visit records (${remainingRecords.length}) could not be deleted`);
            return res.status(500).json({
                message: 'Some visit records could not be deleted',
                deletedCount,
                remainingCount: remainingRecords.length
            });
        }
        
        res.json({ 
            message: 'All visit records deleted successfully',
            deletedCount
        });
    } catch (err) {
        console.error('Error deleting visit records:', err);
        res.status(500).json({ 
            message: err.message,
            stack: process.env.NODE_ENV === 'production' ? null : err.stack
        });
    }
});

module.exports = router; 