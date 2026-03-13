import hljs from 'highlight.js';
import { extname } from 'node:path';

/**
 * A text token with an optional Ink foreground colour.
 */
export interface SyntaxToken {
  text: string;
  color: string | undefined;
}

/**
 * Maps highlight.js CSS class names to terminal colour names
 * (Ink / chalk compatible).
 */
const CLASS_TO_COLOR: Record<string, string> = {
  'hljs-keyword': 'magenta',
  'hljs-built_in': 'cyan',
  'hljs-type': 'cyan',
  'hljs-literal': 'yellow',
  'hljs-number': 'yellow',
  'hljs-regexp': 'red',
  'hljs-string': 'green',
  'hljs-subst': 'white',
  'hljs-symbol': 'yellow',
  'hljs-class': 'blue',
  'hljs-function': 'blue',
  'hljs-title': 'blue',
  'hljs-params': 'white',
  'hljs-comment': 'gray',
  'hljs-doctag': 'gray',
  'hljs-meta': 'gray',
  'hljs-attr': 'cyan',
  'hljs-variable': 'white',
  'hljs-selector-tag': 'blue',
  'hljs-selector-id': 'yellow',
  'hljs-selector-class': 'green',
  'hljs-template-tag': 'magenta',
  'hljs-template-variable': 'magenta',
  'hljs-addition': 'green',
  'hljs-deletion': 'red',
};

/**
 * Extension → language mapping for highlight.js.
 */
const EXT_TO_LANG: Record<string, string> = {
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.mjs': 'javascript',
  '.cjs': 'javascript',
  '.py': 'python',
  '.rb': 'ruby',
  '.go': 'go',
  '.rs': 'rust',
  '.java': 'java',
  '.kt': 'kotlin',
  '.cs': 'csharp',
  '.cpp': 'cpp',
  '.c': 'c',
  '.h': 'c',
  '.sh': 'bash',
  '.bash': 'bash',
  '.zsh': 'bash',
  '.json': 'json',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.toml': 'ini',
  '.md': 'markdown',
  '.html': 'xml',
  '.xml': 'xml',
  '.css': 'css',
  '.scss': 'scss',
  '.sql': 'sql',
  '.dockerfile': 'dockerfile',
  '.tf': 'hcl',
};

/**
 * Detects the highlight.js language from a file path.
 * Returns undefined if unknown — hljs auto-detect will be used.
 */
export function detectLanguage(filePath: string): string | undefined {
  const ext = extname(filePath).toLowerCase();
  return EXT_TO_LANG[ext];
}

/**
 * Tokenises a line of code using highlight.js and returns an array of
 * SyntaxTokens (text + colour) suitable for Ink's <Text color=...> rendering.
 *
 * Falls back to a single plain-text token if highlighting fails.
 */
export function tokenise(line: string, filePath: string): SyntaxToken[] {
  const lang = detectLanguage(filePath);
  try {
    const result = lang ? hljs.highlight(line, { language: lang }) : hljs.highlightAuto(line);
    return parseSpans(result.value);
  } catch {
    return [{ text: line, color: undefined }];
  }
}

/**
 * Parses the HTML span output from highlight.js into SyntaxToken[].
 * Handles simple (non-nested) spans — good enough for single lines.
 */
function parseSpans(html: string): SyntaxToken[] {
  const tokens: SyntaxToken[] = [];
  // Regex to match <span class="...">content</span> or plain text between spans
  const re = /<span class="([^"]+)">([^<]*(?:<(?!\/span>)[^<]*)*)<\/span>|([^<]+)/g;
  let match: RegExpExecArray | null;

  while ((match = re.exec(html)) !== null) {
    if (match[3] !== undefined) {
      // Plain text node
      tokens.push({ text: unescapeHtml(match[3]), color: undefined });
    } else if (match[1] && match[2] !== undefined) {
      // Span with class
      const className = match[1].split(' ')[0] ?? '';
      const color = CLASS_TO_COLOR[className];
      tokens.push({ text: unescapeHtml(match[2]), color });
    }
  }

  return tokens.length > 0 ? tokens : [{ text: html, color: undefined }];
}

function unescapeHtml(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
