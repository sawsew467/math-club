'use client';

import { useState, useEffect } from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import {
    ClassicEditor,
    Bold,
    Essentials,
    Italic,
    List,
    Paragraph,
    RemoveFormat,
    Subscript,
    Superscript,
    Underline,
    Undo,
    Image,
    ImageInsert,
    ImageUpload,
    ImageResize,
    Base64UploadAdapter
} from 'ckeditor5';
import MathType from '@wiris/mathtype-ckeditor5/dist/index.js';
import 'ckeditor5/ckeditor5.css';
import './CustomEditor.css';

interface CustomEditorProps {
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    minHeight?: string;
}

export default function CustomEditor({
    value = '',
    onChange,
    placeholder = 'Nhập nội dung...',
    minHeight = '200px'
}: CustomEditorProps) {
    const [isLayoutReady, setIsLayoutReady] = useState(false);

    useEffect(() => {
        setIsLayoutReady(true);
    }, []);

    if (!isLayoutReady) {
        return <div className="p-4 text-sm text-gray-500">Đang tải trình soạn thảo...</div>;
    }

    return (
        <div className="w-full">
            <div className="editor-container" style={{ '--editor-min-height': minHeight } as React.CSSProperties}>
                <CKEditor
                    editor={ClassicEditor}
                    data={value}
                    config={{
                        licenseKey: 'GPL',
                        plugins: [
                            Bold,
                            Essentials,
                            Italic,
                            List,
                            MathType,
                            Paragraph,
                            RemoveFormat,
                            Subscript,
                            Superscript,
                            Underline,
                            Undo,
                            Image,
                            ImageInsert,
                            ImageUpload,
                            ImageResize,
                            Base64UploadAdapter
                        ],
                        toolbar: {
                            items: [
                                'undo',
                                'redo',
                                '|',
                                'bold',
                                'italic',
                                'underline',
                                '|',
                                'subscript',
                                'superscript',
                                '|',
                                'bulletedList',
                                'numberedList',
                                '|',
                                'MathType',
                                'ChemType',
                                '|',
                                'insertImage',
                                '|',
                                'removeFormat'
                            ],
                            shouldNotGroupWhenFull: true
                        },
                        image: {
                            insert: {
                                type: 'inline'
                            },
                            resizeUnit: 'px',
                            resizeOptions: [
                                {
                                    name: 'resizeImage:original',
                                    value: null,
                                    label: 'Original'
                                },
                                {
                                    name: 'resizeImage:200',
                                    value: '200',
                                    label: '200px'
                                },
                                {
                                    name: 'resizeImage:400',
                                    value: '400',
                                    label: '400px'
                                }
                            ]
                        },
                        placeholder: placeholder
                    }}
                    onChange={(event, editor) => {
                        const data = editor.getData();
                        onChange?.(data);
                    }}
                />
            </div>
        </div>
    );
}
