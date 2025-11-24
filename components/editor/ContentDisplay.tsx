import 'ckeditor5/ckeditor5.css';

interface ContentDisplayProps {
    content: string;
    className?: string;
}

export default function ContentDisplay({ content, className = '' }: ContentDisplayProps) {
    if (!content) {
        return null;
    }

    return (
        <div
            className={`prose max-w-none ck-content ${className}`}
            dangerouslySetInnerHTML={{ __html: content }}
        />
    );
}