import 'ckeditor5/ckeditor5.css';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface ContentDisplayProps {
    content: string;
    className?: string;
}

export default function ContentDisplay({ content, className = '' }: ContentDisplayProps) {
    if (!content) {
        return null;
    }

    // Detect if content is HTML or LaTeX/Markdown
    const isHTML = content.trim().startsWith('<') || content.includes('</');

    if (isHTML) {
        // Render as HTML (from CKEditor)
        return (
            <div
                className={`prose max-w-none ck-content ${className}`}
                dangerouslySetInnerHTML={{ __html: content }}
            />
        );
    } else {
        // Render as Markdown/LaTeX (from sample data)
        return (
            <div className={`prose prose-sm max-w-none ${className}`}>
                <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                >
                    {content}
                </ReactMarkdown>
            </div>
        );
    }
}