import React, { useState, useCallback } from 'react';
import { inject } from '@vercel/speed-insights'; // Import Vercel Speed Insights
import { Upload, FileCode, FileDown, AlertCircle, Loader2, Code2 } from 'lucide-react';
import { formatCode } from './utils/formatter';
import { generateReadme } from './utils/readme-generator';

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    readme?: string;
    formatted?: { [key: string]: string };
    error?: string;
  } | null>(null);

  useEffect(() => {
    inject(); // This will inject the script when the component mounts
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      processFile(droppedFile);
    }
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      processFile(selectedFile);
    }
  }, []);

  const processFile = async (uploadedFile: File) => {
    setIsLoading(true);
    try {
      const files = await formatCode(uploadedFile);
      
      if (uploadedFile.name.endsWith('.zip')) {
        const readme = await generateReadme(files);
        setResult({ 
          readme,
          formatted: Object.fromEntries(
            files.map(f => [f.path, f.formatted || f.content])
          )
        });
      } else {
        setResult({
          formatted: {
            [uploadedFile.name]: files[0].formatted || files[0].content
          }
        });
      }
    } catch (error) {
      setResult({ error: 'Error processing file' });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadFile = useCallback((content: string, filename: string) => {
    const blob = new Blob([content], { 
      type: filename.endsWith('.md') ? 'text/markdown' : 'text/plain' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Code Formatter & Documentation Generator
          </h1>
          <p className="text-lg text-gray-600">
            Upload your code files or ZIP archive to format and analyze
          </p>
        </header>

        <div
          className={`border-2 border-dashed rounded-lg p-12 mb-8 text-center transition-colors
            ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'}
            ${result?.error ? 'border-red-300' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center gap-4">
            {isLoading ? (
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
            ) : (
              <Upload
                className={`w-12 h-12 ${
                  isDragging ? 'text-blue-500' : 'text-gray-400'
                }`}
              />
            )}
            <div className="space-y-2">
              <p className="text-lg font-medium text-gray-700">
                {isLoading ? 'Processing file...' : 'Drag and drop your file here'}
              </p>
              {!isLoading && (
                <>
                  <p className="text-sm text-gray-500">or</p>
                  <label className="inline-block">
                    <input
                      type="file"
                      onChange={handleFileInput}
                      className="hidden"
                    />
                    <span className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md cursor-pointer hover:bg-blue-600 transition-colors">
                      Browse Files
                    </span>
                  </label>
                </>
              )}
            </div>
          </div>
        </div>

        {result?.error && (
          <div className="flex items-center gap-2 text-red-500 bg-red-50 p-4 rounded-md mb-6">
            <AlertCircle className="w-5 h-5" />
            <p>{result.error}</p>
          </div>
        )}

        {result?.readme && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <FileCode className="w-5 h-5" />
                Generated Documentation
              </h2>
              <button
                onClick={() => downloadFile(result.readme!, 'README.md')}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-500 rounded-md hover:bg-green-600 transition-colors"
              >
                <FileDown className="w-4 h-4" />
                Download README
              </button>
            </div>
            <div className="prose max-w-none">
              <pre className="bg-gray-50 p-4 rounded-md overflow-x-auto whitespace-pre-wrap">
                {result.readme}
              </pre>
            </div>
          </div>
        )}

        {result?.formatted && Object.entries(result.formatted).map(([path, content]) => (
          <div key={path} className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Code2 className="w-5 h-5" />
                {path}
              </h2>
              <button
                onClick={() => downloadFile(content, `formatted_${path.split('/').pop()}`)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-500 rounded-md hover:bg-green-600 transition-colors"
              >
                <FileDown className="w-4 h-4" />
                Download Formatted File
              </button>
            </div>
            <div className="prose max-w-none">
              <pre className="bg-gray-50 p-4 rounded-md overflow-x-auto whitespace-pre-wrap">
                {content}
              </pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;