const express = require('express');
const multer = require('multer');
const { createAnalysisCourse, getAnalysisSummary } = require('../controllers/analysis/createAnalysisCourse');

const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

router.post('/', upload.single('file'), createAnalysisCourse);
router.post('/summary', upload.single('file'), getAnalysisSummary);

module.exports = router;