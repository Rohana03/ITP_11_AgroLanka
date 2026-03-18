const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const { protect } = require('../middleware/authMiddleware');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// @desc    Detect disease from rice leaf image
// @route   POST /api/ai/detect-rice-leaf
// @access  Private
router.post('/detect-rice-leaf', protect, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No image uploaded' });
        }

        // Prepare the form data to send to the Flask API
        const form = new FormData();
        form.append('file', req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype,
        });

        // Forward to Flask AI API (running on port 5001)
        const response = await axios.post('http://localhost:5001/predict', form, {
            headers: {
                ...form.getHeaders(),
            },
        });

        // Return the prediction results to the frontend
        res.json(response.data);

    } catch (error) {
        console.error('AI Proxy Error:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            return res.status(503).json({ 
                message: 'AI Service is currently offline. Please ensure the Flask API is running.' 
            });
        }

        res.status(500).json({ 
            message: 'Error processing image with AI model.',
            details: error.message 
        });
    }
});

module.exports = router;
