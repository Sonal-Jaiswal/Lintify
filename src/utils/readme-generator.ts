interface FileInfo {
  name: string;
  content: string;
  path: string;
}

function getFileType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const typeMap: { [key: string]: string } = {
    js: 'JavaScript',
    jsx: 'React JSX',
    ts: 'TypeScript',
    tsx: 'React TypeScript',
    css: 'CSS',
    scss: 'SCSS',
    html: 'HTML',
    json: 'JSON',
    md: 'Markdown',
    py: 'Python',
    java: 'Java',
    cpp: 'C++',
    c: 'C',
    go: 'Go',
    rs: 'Rust',
    php: 'PHP',
    rb: 'Ruby'
  };
  
  return typeMap[ext] || 'Plain text';
}

function buildFileTree(files: FileInfo[]): { [key: string]: any } {
  const tree: { [key: string]: any } = {};
  
  files.forEach(file => {
    const parts = file.path.split('/');
    let current = tree;
    
    parts.forEach((part, index) => {
      if (index === parts.length - 1) {
        current[part] = { type: getFileType(part), size: file.content.length };
      } else {
        current[part] = current[part] || {};
        current = current[part];
      }
    });
  });
  
  return tree;
}

function generateTreeMarkdown(tree: { [key: string]: any }, prefix = ''): string {
  let result = '';
  const entries = Object.entries(tree);
  
  entries.forEach(([name, value], index) => {
    const isLast = index === entries.length - 1;
    const connector = isLast ? '└── ' : '├── ';
    const newPrefix = prefix + (isLast ? '    ' : '│   ');
    
    result += prefix + connector + name + (value.type ? ` (${value.type})\n` : '\n');
    
    if (!value.type) {
      result += generateTreeMarkdown(value, newPrefix);
    }
  });
  
  return result;
}

function analyzeCodebase(files: FileInfo[]): { [key: string]: number } {
  const stats: { [key: string]: number } = {};
  
  files.forEach(file => {
    const type = getFileType(file.name);
    stats[type] = (stats[type] || 0) + 1;
  });
  
  return stats;
}

function detectFrameworks(files: FileInfo[]): string[] {
  const frameworks: string[] = [];
  const allContent = files.map(f => f.content.toLowerCase()).join(' ');
  const packageJson = files.find(f => f.name === 'package.json')?.content || '';
  
  // Framework detection logic
  if (packageJson.includes('"react"')) frameworks.push('React');
  if (packageJson.includes('"vue"')) frameworks.push('Vue.js');
  if (packageJson.includes('"@angular/core"')) frameworks.push('Angular');
  if (allContent.includes('django')) frameworks.push('Django');
  if (allContent.includes('flask')) frameworks.push('Flask');
  if (allContent.includes('express')) frameworks.push('Express.js');
  if (allContent.includes('spring-boot')) frameworks.push('Spring Boot');
  
  return frameworks;
}

function findMainFile(files: FileInfo[]): FileInfo | null {
  const mainFilePatterns = [
    'index.ts', 'index.js', 'main.py', 'app.py',
    'server.js', 'app.js', 'index.html'
  ];
  
  for (const pattern of mainFilePatterns) {
    const mainFile = files.find(f => f.name.toLowerCase() === pattern);
    if (mainFile) return mainFile;
  }
  
  return null;
}

export async function generateReadme(files: FileInfo[]): Promise<string> {
  const tree = buildFileTree(files);
  const stats = analyzeCodebase(files);
  const frameworks = detectFrameworks(files);
  const mainFile = findMainFile(files);
  
  const template = `# Project Documentation

## 📁 Project Structure
\`\`\`
${generateTreeMarkdown(tree)}
\`\`\`

## 🔍 Project Overview
This project contains ${files.length} files across various technologies:
${Object.entries(stats)
  .map(([type, count]) => `- ${type}: ${count} file${count > 1 ? 's' : ''}`)
  .join('\n')}

${frameworks.length ? `## 🛠 Technologies Used
This project uses the following frameworks/libraries:
${frameworks.map(f => `- ${f}`).join('\n')}` : ''}

## 🚀 Getting Started
1. Clone the repository
2. Install dependencies:
   \`\`\`bash
   npm install
   # or
   yarn install
   \`\`\`
3. Run the project:
   \`\`\`bash
   npm start
   # or
   yarn start
   \`\`\`

## 📌 Main Entry Point
${mainFile ? `The main entry point is \`${mainFile.path}\`:

\`\`\`${mainFile.name.split('.').pop()}
${mainFile.content.split('\n').slice(0, 10).join('\n')}${mainFile.content.split('\n').length > 10 ? '\n...' : ''}
\`\`\`` : 'No clear entry point detected.'}

## 📚 Project Structure Explanation
${Object.entries(tree).map(([dir, content]) => {
  if (typeof content === 'object' && !content.type) {
    return `### /${dir}
Contains ${Object.keys(content).length} files/directories for ${dir.toLowerCase()} related functionality.`;
  }
  return '';
}).filter(Boolean).join('\n\n')}

## 🔧 Configuration Files
${files.filter(f => f.name.includes('config') || f.name.includes('.rc') || f.name.endsWith('.json'))
  .map(f => `- \`${f.path}\`: ${f.name.includes('package.json') ? 'Project dependencies and scripts' : 'Configuration settings'}`)
  .join('\n')}

## 💡 Additional Notes
- The project uses a ${frameworks.length ? 'modern stack with ' + frameworks.join(', ') : 'custom stack'}
- File organization follows ${files.some(f => f.path.includes('src/')) ? 'a src-based' : 'a flat'} structure
- ${stats['TypeScript'] ? 'TypeScript is used for type safety' : 'JavaScript is used as the primary language'}

## 🤝 Contributing
1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## 📝 License
This project is licensed under the terms specified in the LICENSE file, if present.
`;

  return template;
}