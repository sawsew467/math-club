'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';

const CustomEditor = dynamic(() => import('./CustomEditor'), { ssr: false });

interface CustomEditorDynamicProps {
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    minHeight?: string;
}

export default function CustomEditorDynamic(props: CustomEditorDynamicProps) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return <div className="p-4 text-sm text-gray-500">Đang tải trình soạn thảo...</div>;
    }

    return <CustomEditor {...props} />;
}
