import React, { useState } from 'react';
import * as docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';

import {
  AppBar,
  Toolbar,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Select,
  MenuItem,
} from '@mui/material';

function Home() {
  const [textInput, setTextInput] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('text');
  const [file, setFile] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [generatedQuestions, setGeneratedQuestions] = useState([]);

  const handleTextInputChange = (event) => {
    setTextInput(event.target.value);
  };

  const handleFormatChange = (event) => {
    setSelectedFormat(event.target.value);
    // Clear extracted text when format is changed
    setExtractedText('');
  };

  const handleFileChange = async (event) => {
    const uploadedFile = event.target.files[0];
    setFile(uploadedFile);

    if (uploadedFile) {
      try {
        const text = await extractTextFromDoc(uploadedFile);
        setExtractedText(text);
      } catch (error) {
        console.error('Error extracting text from DOC:', error);
        setExtractedText('Error extracting text from DOC');
      }
    }
  };

  const extractTextFromDoc = async (docFile) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const arrayBuffer = event.target.result;
          const text = await extractText(arrayBuffer);
          resolve(text);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => {
        reject(error);
      };
      reader.readAsArrayBuffer(docFile);
    });
  };

  const extractText = async (arrayBuffer) => {
    return new Promise((resolve, reject) => {
      const zip = new PizZip(arrayBuffer);
      const doc = new docxtemplater().loadZip(zip);

      // Extract the text using docxtemplater
      const text = doc.getFullText();
      resolve(text);
    });
  };

  const handleGenerateQuestions = async () => {
    console.log('Generating questions...');
    console.log('Text Input:', textInput);
    console.log('Selected Format:', selectedFormat);
    console.log('Uploaded File:', file);

    try {
      let inputText = '';
      if (selectedFormat === 'doc' && file) {
        const text = await extractTextFromDoc(file);
        inputText = text;
      } else if (selectedFormat === 'text') {
        inputText = textInput;
      }

      // Send a POST request to the Flask server
      const response = await fetch('http://localhost:5000/post_data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: inputText,
        }),
      });

      if (response.ok) {
        const responseData = await response.text(); // Receive the response as text
        console.log('Received response from server:', responseData);

        // Use regular expressions to split the questions into an array and remove '\\n' characters
        const questionsArray = responseData
          .match(/\d+\.\s(.*?)(?=\d+\.\s|$)/g)
          .map((question) => question.replace(/\\n/g, ''))
          .filter((question) => question.trim() !== '');

        setGeneratedQuestions(questionsArray);
      } else {
        console.error('Failed to receive a response from the server');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const displayText = selectedFormat === 'doc' ? extractedText : textInput;

  return (
    <div>
      <AppBar position="static">
        <Toolbar>
          <Typography  style={{alignItems:"center"}} variant="h6">Questions Generator</Typography>
        </Toolbar>
      </AppBar>
      <div style={{ display: 'flex', height: '100vh' }}>
        <Card style={{ width: '50%', marginRight: '10px' }}>
          <CardContent>
            <Select
              value={selectedFormat}
              onChange={handleFormatChange}
              variant="outlined"
              fullWidth
            >
              <MenuItem value="text">Text</MenuItem>
              <MenuItem value="doc">DOC</MenuItem>
            </Select>
            {selectedFormat === 'text' && (
              <TextField
                variant="outlined"
                multiline
                rows={6}
                fullWidth
                placeholder="Enter text here..."
                value={textInput}
                onChange={handleTextInputChange}
                style={{ marginTop: '20px' }}
              />
            )}
            {selectedFormat === 'doc' && (
              <div style={{ marginTop: '20px' }}>
                <input type="file" accept=".doc, .docx" onChange={handleFileChange} />
              </div>
            )}
            <div style={{ marginTop: '20px' }}>
              <Button variant="contained" color="primary" onClick={handleGenerateQuestions}>
                Generate Questions
              </Button>
            </div>
            <div style={{ marginTop: '20px' }}>
              {generatedQuestions.length > 0 ? (
                <Typography variant="body1">
                  Generated Questions:
                </Typography>
              ) : null}
              {generatedQuestions.map((question, index) => (
                <div key={index}>
                  {question}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card style={{ width: '50%' }}>
          <CardContent>
            {displayText && (
              <div style={{ marginTop: '20px' }}>
                <Typography variant="body1">
                  Displayed Text:
                </Typography>
                <pre style={{ whiteSpace: 'pre-wrap' }}>{displayText}</pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Home;
