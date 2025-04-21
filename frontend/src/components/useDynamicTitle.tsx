
import { useEffect } from 'react';
import { useTitle } from '@/components/TitleContext';

const useDynamicTitle = () => {
    const { title } = useTitle();

    useEffect(() => {
        document.title = title;
    }, [title]);
};

export default useDynamicTitle;
