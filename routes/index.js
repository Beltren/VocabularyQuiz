const express = require('express');
const multer = require('multer');
const path = require('path');
const csv = require('csv-parser');
const fs = require('fs');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

let words = [];
let results = [];
let currentWordIndex = 0;

// Helper function to normalize keys
function normalizeRow(row) {
    return {
        Word: row.word || row.Word,
        Speak: row.speak || row.Speak,
        Slang: row.slang || row.Slang,
        Written: row.written || row.Written
    };
}

// Route for the home page
router.get('/', (req, res) => {
    res.render('index');
});

// Route to handle CSV upload
router.post('/upload', upload.single('csvFile'), (req, res) => {
    const filePath = path.join(__dirname, '../', req.file.path);
    words = [];
    results = [];
    currentWordIndex = 0;

    console.log('Starting to parse CSV file:', filePath);

    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
            const normalizedRow = normalizeRow(row);
            console.log('Parsed row:', normalizedRow);
            words.push(normalizedRow);
        })
        .on('end', () => {
            console.log('Finished parsing CSV file. Parsed rows:', words.length);
            fs.unlinkSync(filePath); // Clean up the uploaded file
            res.redirect('/quiz');
        })
        .on('error', (error) => {
            console.error('Error parsing CSV file:', error);
            res.status(500).send('Error parsing CSV file.');
        });
});

// Route to display quiz
router.get('/quiz', (req, res) => {
    if (currentWordIndex >= words.length) {
        return res.redirect('/results');
    }

    const word = words[currentWordIndex];
    res.render('quiz', { word });
});

// Route to handle quiz submission
router.post('/quiz', (req, res) => {
    const { word, speak, slang, written, userAnswer } = req.body;
    const parsedWord = JSON.parse(word);
    let correctAnswer = '';

    if (speak) correctAnswer = speak;
    if (slang) correctAnswer = slang;
    if (written) correctAnswer = written;

    const isCorrect = userAnswer.trim() === correctAnswer.trim();
    results.push({
        word: parsedWord,
        userAnswer,
        correctAnswer,
        isCorrect
    });

    currentWordIndex++;

    if (currentWordIndex >= words.length) {
        return res.redirect('/results');
    } else {
        res.redirect('/quiz');
    }
});

// Route to display results
router.get('/results', (req, res) => {
    res.render('results', { results });
});

module.exports = router;
