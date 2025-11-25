import 'ckeditor5/ckeditor5.css';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';

interface ContentDisplayProps {
    content: string;
    className?: string;
}

export default function ContentDisplay({ content, className = '' }: ContentDisplayProps) {
    if (!content) {
        return null;
    }

    // Detect if content is rich HTML (from CKEditor with complex tags)
    const isRichHTML = content.trim().startsWith('<p>') ||
                       content.trim().startsWith('<div>') ||
                       content.includes('</p>') ||
                       content.includes('class=');

    if (isRichHTML) {
        // Render as HTML (from CKEditor)
        return (
            <div
                className={`prose max-w-none ck-content ${className}`}
                dangerouslySetInnerHTML={{ __html: content }}
            />
        );
    } else {
        // Render as Markdown/LaTeX with HTML support (for <br> tags etc.)
        return (
            <div className={`prose prose-sm max-w-none ${className}`}>
                <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeRaw, rehypeKatex]}
                >
                    {content}
                </ReactMarkdown>
            </div>
        );
    }
}