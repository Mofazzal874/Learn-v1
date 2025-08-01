'use client';

import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Label } from './label';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  className?: string;
  height?: string;
}

interface RichTextEditorRef {
  focus: () => void;
  blur: () => void;
}

const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(({
  value,
  onChange,
  placeholder = 'Enter description...',
  label,
  required = false,
  className = '',
  height = '200px'
}, ref) => {
  const quillRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => {
      if (quillRef.current) {
        quillRef.current.focus();
      }
    },
    blur: () => {
      if (quillRef.current) {
        quillRef.current.blur();
      }
    }
  }));

  useEffect(() => {
    let quill: any = null;

    const initializeQuill = async () => {
      try {
        // Dynamic import to avoid SSR issues
        const { default: Quill } = await import('quill');
        
        if (containerRef.current && !quillRef.current) {
          // Create editor container
          const editorDiv = document.createElement('div');
          containerRef.current.appendChild(editorDiv);

          // Initialize Quill
          quill = new Quill(editorDiv, {
            theme: 'snow',
            placeholder,
            modules: {
              toolbar: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                [{ 'color': [] }, { 'background': [] }],
                [{ 'align': [] }],
                ['link', 'blockquote', 'code-block'],
                ['clean']
              ]
            }
          });

          quillRef.current = quill;

          // Set initial content
          if (value) {
            quill.root.innerHTML = value;
          }

          // Listen for text changes
          quill.on('text-change', () => {
            const html = quill.root.innerHTML;
            // Only call onChange if content actually changed
            if (html !== value) {
              onChange(html);
            }
          });

          // Apply custom styling
          const editor = editorDiv.querySelector('.ql-editor') as HTMLElement;
          if (editor) {
            editor.style.minHeight = height;
            editor.style.backgroundColor = '#f9fafb';
            editor.style.color = '#111827';
            editor.style.border = '1px solid #374151';
            editor.style.borderRadius = '6px';
          }

          const toolbar = editorDiv.querySelector('.ql-toolbar') as HTMLElement;
          if (toolbar) {
            toolbar.style.backgroundColor = '#141414';
            toolbar.style.borderColor = '#374151';
            toolbar.style.borderTopLeftRadius = '6px';
            toolbar.style.borderTopRightRadius = '6px';
          }

          // Style toolbar buttons
          const buttons = editorDiv.querySelectorAll('.ql-toolbar button, .ql-toolbar .ql-picker');
          buttons.forEach((button: any) => {
            button.style.color = '#9ca3af';
          });
        }
      } catch (error) {
        console.error('Failed to load Quill editor:', error);
      }
    };

    // Only initialize if we're in the browser
    if (typeof window !== 'undefined') {
      initializeQuill();
    }

    return () => {
      if (quillRef.current && containerRef.current) {
        // Clean up
        containerRef.current.innerHTML = '';
        quillRef.current = null;
      }
    };
  }, []); // Empty dependency array - only run once

  // Update content when value prop changes externally
  useEffect(() => {
    if (quillRef.current && value !== quillRef.current.root.innerHTML) {
      quillRef.current.root.innerHTML = value || '';
    }
  }, [value]);

  // Load Quill CSS
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Load Quill CSS
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdn.quilljs.com/1.3.6/quill.snow.css';
      document.head.appendChild(link);

      // Add custom CSS for light editor with dark toolbar
      const style = document.createElement('style');
      style.textContent = `
        .ql-editor {
          background-color: #f9fafb !important;
          color: #111827 !important;
        }
        .ql-toolbar {
          background-color: #141414 !important;
          border-color: #374151 !important;
        }
        .ql-toolbar button:hover,
        .ql-toolbar button:focus {
          color: #ffffff !important;
        }
        .ql-toolbar .ql-picker-label:hover,
        .ql-toolbar .ql-picker-label:focus {
          color: #ffffff !important;
        }
        .ql-container {
          border-color: #374151 !important;
        }
        .ql-tooltip {
          background-color: #1f2937 !important;
          border-color: #374151 !important;
          color: #ffffff !important;
        }
        .ql-tooltip input {
          background-color: #f9fafb !important;
          color: #111827 !important;
          border-color: #374151 !important;
        }
      `;
      document.head.appendChild(style);

      return () => {
        // Don't remove the CSS on cleanup as it might be used by other instances
      };
    }
  }, []);

  return (
    <div className={className}>
      {label && (
        <Label className="text-white mb-2 block">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      <div 
        ref={containerRef} 
        className="rich-text-editor"
        style={{ minHeight: `calc(${height} + 42px)` }} // Account for toolbar height
      />
    </div>
  );
});

RichTextEditor.displayName = 'RichTextEditor';

export default RichTextEditor;