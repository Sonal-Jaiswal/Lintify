import JSZip from 'jszip';

interface FileInfo {
  name: string;
  content: string;
  path: string;
  formatted?: string;
}

function formatJavaScript(code: string): string {
  try {
    // Basic formatting rules
    return code
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        // Indent inside blocks
        const indentLevel = (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
        return '  '.repeat(Math.max(0, indentLevel)) + line;
      })
      .join('\n');
  } catch (error) {
    return code; // Return original if formatting fails
  }
}

function formatJava(code: string): string {
  // Similar to JavaScript but with Java-specific rules
  try {
    return code
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        const indentLevel = (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
        return '    '.repeat(Math.max(0, indentLevel)) + line;
      })
      .join('\n');
  } catch (error) {
    return code;
  }
}

function formatPython(code: string): string {
  try {
    return code
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        // Python uses 4 spaces for indentation
        const indentLevel = (line.match(/:/g) || []).length;
        return '    '.repeat(Math.max(0, indentLevel)) + line;
      })
      .join('\n');
  } catch (error) {
    return code;
  }
}

function formatC(code: string): string {
  try {
    return code
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        const indentLevel = (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
        return '    '.repeat(Math.max(0, indentLevel)) + line;
      })
      .join('\n');
  } catch (error) {
    return code;
  }
}

function getFormatter(filename: string): (code: string) => string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  
  const formatters: { [key: string]: (code: string) => string } = {
    js: formatJavaScript,
    jsx: formatJavaScript,
    ts: formatJavaScript,
    tsx: formatJavaScript,
    java: formatJava,
    py: formatPython,
    c: formatC,
    cpp: formatC,
    h: formatC,
    hpp: formatC
  };
  
  return formatters[ext] || ((code: string) => code);
}

export async function formatCode(file: File): Promise<FileInfo[]> {
  if (file.name.endsWith('.zip')) {
    const zip = new JSZip();
    const files: FileInfo[] = [];
    
    try {
      const zipContent = await zip.loadAsync(file);
      
      for (const [path, zipFile] of Object.entries(zipContent.files)) {
        if (!zipFile.dir) {
          const content = await zipFile.async('string');
          const name = path.split('/').pop() || '';
          const formatter = getFormatter(name);
          const formatted = formatter(content);
          
          files.push({ 
            name, 
            content, 
            path,
            formatted 
          });
        }
      }
      
      return files;
    } catch (error) {
      throw new Error('Failed to process ZIP file');
    }
  } else {
    // Handle single file
    const content = await file.text();
    const formatter = getFormatter(file.name);
    const formatted = formatter(content);
    
    return [{
      name: file.name,
      content,
      path: file.name,
      formatted
    }];
  }
}