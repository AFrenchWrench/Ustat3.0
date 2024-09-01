import React from 'react';
import { Pagination, PaginationItem } from '@mui/material';

interface CustomPaginationProps {
    page: number;
    pageSize: number;
    rowCount: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
}

const CustomPagination: React.FC<CustomPaginationProps> = ({
    page,
    pageSize,
    rowCount,
    onPageChange,
    onPageSizeChange,
}) => {
    const totalPages = Math.ceil(rowCount / pageSize);

    const handleFirstPageButtonClick = () => {
        onPageChange(0);
    };

    const handleLastPageButtonClick = () => {
        onPageChange(totalPages - 1);
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', direction: 'ltr' }} className='paginationDivCustom'>
            <PaginationItem
                type="first"
                disabled={page === 0}
                onClick={handleFirstPageButtonClick}
                style={{ color: 'white' }}
            />
            <Pagination
                count={totalPages}
                page={page + 1} // MUI Pagination uses 1-based index, DataGrid uses 0-based
                onChange={(event, value) => onPageChange(value - 1)}
                showFirstButton
                showLastButton
                style={{ color: 'white' }}
            />
            <PaginationItem
                type="last"
                disabled={page >= totalPages - 1}
                onClick={handleLastPageButtonClick}
                style={{ color: 'white' }}
            />
        </div>
    );
};

export default CustomPagination;
