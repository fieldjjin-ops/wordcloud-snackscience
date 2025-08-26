import React, { useState, useCallback } from 'react';
import { FileUploader } from './components/FileUploader';
import { WordCloudDisplay } from './components/WordCloudDisplay';
import { extractTextFromImage, extractKeywordsFromText } from './services/geminiService';
import type { Word } from './types';

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');
  
  const handleFileChange = (selectedFile: File) => {
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setWords([]);
      setError(null);
    }
  };

  const handleGenerateClick = useCallback(async () => {
    if (!file) {
      setError('Please upload a file first.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setWords([]);

    try {
      setStatus('Reading file...');
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64String = (reader.result as string).split(',')[1];

        try {
          setStatus('Extracting text from image...');
          const extractedText = await extractTextFromImage(base64String);

          if (!extractedText || extractedText.trim().length === 0) {
            throw new Error('Could not extract any text from the image. The image might be blurry or contain no text.');
          }
          
          setStatus('Identifying keywords...');
          const extractedWords = await extractKeywordsFromText(extractedText);
          
          setWords(extractedWords);
        } catch (apiError: any) {
            console.error(apiError);
            setError(`An error occurred during analysis: ${apiError.message || 'Unknown error'}`);
        } finally {
            setIsLoading(false);
            setStatus('');
        }
      };
      reader.onerror = () => {
        setError('Failed to read the file.');
        setIsLoading(false);
      }
    } catch (e: any) {
      setError(e.message);
      setIsLoading(false);
    }
  }, [file]);

  const handleReset = () => {
    setFile(null);
    setPreviewUrl(null);
    setWords([]);
    setError(null);
    setIsLoading(false);
    setStatus('');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-800 tracking-tight">
            Worksheet Word Cloud
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Upload a worksheet image to automatically generate a word cloud of key terms.
          </p>
        </header>

        <main className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
          {!previewUrl && !isLoading && (
            <FileUploader onFileSelect={handleFileChange} />
          )}

          {previewUrl && (
            <div className="flex flex-col items-center">
              <div className="w-full max-w-md mb-6 border-4 border-dashed border-gray-200 rounded-lg p-2">
                <img src={previewUrl} alt="Worksheet preview" className="w-full h-auto object-contain rounded-md" />
              </div>
              
              <div className="flex space-x-4">
                <button
                  onClick={handleGenerateClick}
                  disabled={isLoading}
                  className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition-transform transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:scale-100"
                >
                  {isLoading ? 'Generating...' : 'Generate Word Cloud'}
                </button>
                 <button
                  onClick={handleReset}
                  disabled={isLoading}
                  className="px-6 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75 transition-colors disabled:opacity-50"
                >
                  Reset
                </button>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="text-center p-8">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-lg font-semibold text-gray-700">{status}</p>
            </div>
          )}

          {error && (
            <div className="mt-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center">
              <p className="font-bold">Error</p>
              <p>{error}</p>
            </div>
          )}

          {words.length > 0 && !isLoading && (
            <div className="mt-8">
              <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">Generated Word Cloud</h2>
              <WordCloudDisplay words={words} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
