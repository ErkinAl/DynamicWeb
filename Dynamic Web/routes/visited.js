const express = require('express');
const router = express.Router();
const VisitedLandmark = require('../models/VisitedLandmark');
const mongoose = require('mongoose'); // Add mongoose import to handle ObjectId

// Tüm ziyaretleri getir
router.get('/', async (req, res) => {
    try {
        console.log('GET /api/visited - Retrieving all visits');
        const visits = await VisitedLandmark.find().populate('landmark_id');
        
        // Check if notes field exists for debugging
        const visitStats = visits.map(v => ({
            id: v._id,
            hasNotes: !!v.notes,
            notesLength: v.notes ? v.notes.length : 0,
            notes: v.notes
        }));
        console.log('Visits being returned (notes info):', JSON.stringify(visitStats, null, 2));
        
        res.json(visits);
    } catch (err) {
        console.error('Error retrieving visits:', err);
        res.status(500).json({ message: err.message });
    }
});

// Yeni ziyaret ekle
router.post('/', async (req, res) => {
    try {
        console.log('POST /api/visited - Creating new visit record');
        console.log('Request body:', JSON.stringify(req.body, null, 2));
        
        // Validate that required fields are present
        if (!req.body.landmark_id) {
            return res.status(400).json({ message: 'landmark_id is required' });
        }
        
        // Debug the notes field specifically
        console.log('Notes received in request:', {
            notes: req.body.notes,
            type: typeof req.body.notes,
            nullCheck: req.body.notes === null,
            undefinedCheck: req.body.notes === undefined,
            emptyStringCheck: req.body.notes === '',
            length: req.body.notes ? req.body.notes.length : 'N/A'
        });
        
        // Make sure notes is explicitly set to a string, even if undefined or null
        const notesValue = (req.body.notes !== undefined && req.body.notes !== null) 
            ? String(req.body.notes) 
            : '';
            
        console.log('Notes value after processing:', notesValue);
        
        // Create the visit record with explicit string for notes
        const visit = new VisitedLandmark({
            landmark_id: req.body.landmark_id,
            visitor_name: req.body.visitor_name || 'User',
            notes: notesValue,
            plan_name: req.body.plan_name || null,
            plan_description: req.body.plan_description || null
        });

        console.log('Constructed visit object:', JSON.stringify(visit, null, 2));
        
        const newVisit = await visit.save();
        console.log('Visit saved to database:', JSON.stringify(newVisit, null, 2));
        
        // Verify that notes were saved correctly
        if (notesValue !== newVisit.notes) {
            console.warn('⚠️ WARNING: Notes mismatch after save!');
            console.warn(`Original: "${notesValue}"`);
            console.warn(`Saved: "${newVisit.notes}"`);
        }
        
        // Return the populated visit with landmark data, but also include direct access to the notes
        const populatedVisit = await VisitedLandmark.findById(newVisit._id).populate('landmark_id');
        
        // Debug the final response
        console.log('Final response being sent:', JSON.stringify({
            _id: populatedVisit._id,
            notes: populatedVisit.notes,
            hasNotes: !!populatedVisit.notes,
            notesType: typeof populatedVisit.notes,
            fullObject: populatedVisit
        }, null, 2));
        
        // Send the response with notes included at the top level for easy access
        res.status(201).json({
            ...populatedVisit.toObject(),
            notesDirectAccess: populatedVisit.notes // Extra field for debugging
        });
    } catch (err) {
        console.error('Error saving visit:', err);
        res.status(400).json({ message: err.message });
    }
});

// Belirli bir landmarkın ziyaret geçmişini getir
router.get('/landmark/:id', async (req, res) => {
    try {
        const visits = await VisitedLandmark.find({ landmark_id: req.params.id }).populate('landmark_id');
        res.json(visits);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Plan adına göre ziyaretleri getir
router.get('/plan/:name', async (req, res) => {
    try {
        const planName = req.params.name;
        const visits = await VisitedLandmark.find({ plan_name: planName }).populate('landmark_id');
        res.json(visits);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Delete all visit records for a specific landmark
router.delete('/landmark/:id/all', async (req, res) => {
    try {
        console.log(`DELETE /api/visited/landmark/${req.params.id}/all - Deleting all visit records for landmark`);
        
        const result = await VisitedLandmark.deleteMany({ landmark_id: req.params.id });
        
        console.log(`Deleted ${result.deletedCount} visit records`);
        
        res.json({ 
            success: true, 
            message: `Successfully deleted ${result.deletedCount} visit records for landmark ${req.params.id}`,
            deletedCount: result.deletedCount
        });
    } catch (err) {
        console.error('Error deleting visit records:', err);
        res.status(500).json({ message: err.message });
    }
});

// Also add a simpler version of the route as a fallback
router.delete('/landmark/:id', async (req, res) => {
    try {
        console.log(`DELETE /api/visited/landmark/${req.params.id} - Deleting all visit records for landmark (fallback route)`);
        
        const result = await VisitedLandmark.deleteMany({ landmark_id: req.params.id });
        
        console.log(`Deleted ${result.deletedCount} visit records`);
        
        res.json({ 
            success: true, 
            message: `Successfully deleted ${result.deletedCount} visit records for landmark ${req.params.id}`,
            deletedCount: result.deletedCount
        });
    } catch (err) {
        console.error('Error deleting visit records:', err);
        res.status(500).json({ message: err.message });
    }
});

// Handle different operations on the main visited endpoint
router.delete('/', async (req, res) => {
    try {
        // Check if this is a request to delete all visits for a specific landmark
        if (req.query.delLandmark) {
            const landmarkId = req.query.delLandmark;
            console.log(`DELETE /api/visited?delLandmark=${landmarkId} - Deleting all visit records for landmark`);
            console.log('Received query parameters:', req.query);
            
            // Ensure proper ObjectId format if it's a valid ObjectId
            let landmarkObjectId;
            try {
                if (mongoose.Types.ObjectId.isValid(landmarkId)) {
                    landmarkObjectId = new mongoose.Types.ObjectId(landmarkId);
                    console.log('Converted to ObjectId:', landmarkObjectId);
                } else {
                    console.log('Invalid ObjectId format, will use as string');
                    landmarkObjectId = landmarkId;
                }
            } catch (err) {
                console.warn('Error converting to ObjectId, will use as string:', err);
                landmarkObjectId = landmarkId;
            }
            
            // Log before deletion to see if any records match
            const matchingRecords = await VisitedLandmark.find({ landmark_id: landmarkObjectId });
            console.log(`Found ${matchingRecords.length} matching records before deletion:`, 
                matchingRecords.map(r => ({ id: r._id, landmark_id: r.landmark_id })));
            
            // Try alternate query formats if no records found
            if (matchingRecords.length === 0) {
                console.log('No records found with direct match, trying string comparison...');
                const stringMatches = await VisitedLandmark.find({ 
                    landmark_id: landmarkId.toString() 
                });
                console.log(`Found ${stringMatches.length} string matches`);
                
                if (stringMatches.length > 0) {
                    // Delete using string comparison if records found
                    const stringResult = await VisitedLandmark.deleteMany({ 
                        landmark_id: landmarkId.toString() 
                    });
                    console.log(`Deleted ${stringResult.deletedCount} records using string comparison`);
                    
                    return res.json({
                        success: true,
                        message: `Successfully deleted ${stringResult.deletedCount} visit records for landmark ${landmarkId}`,
                        deletedCount: stringResult.deletedCount,
                        method: 'string-comparison'
                    });
                }
            }
            
            // Perform the deletion with ObjectId (if available)
            const result = await VisitedLandmark.deleteMany({ landmark_id: landmarkObjectId });
            console.log(`Deletion result:`, result);
            console.log(`Deleted ${result.deletedCount} visit records for landmark ${landmarkId}`);
            
            // Verify deletion was successful
            const remainingRecords = await VisitedLandmark.find({ landmark_id: landmarkObjectId });
            console.log(`Remaining records after deletion: ${remainingRecords.length}`);
            
            return res.json({ 
                success: true, 
                message: `Successfully deleted ${result.deletedCount} visit records for landmark ${landmarkId}`,
                deletedCount: result.deletedCount,
                originalMatchCount: matchingRecords.length,
                remainingCount: remainingRecords.length,
                method: 'object-id'
            });
        }
        
        // Handle other possible DELETE operations here
        res.status(400).json({ message: 'Missing required parameters for DELETE operation' });
    } catch (err) {
        console.error('Error processing DELETE request:', err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router; 