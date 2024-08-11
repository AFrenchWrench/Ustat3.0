// components/AddToCartButton.js
import React from 'react';
import "./componentStyles.css";

interface AddToCartButtonProps {
    id: string;
    onAddToCart: (id: string) => void;
    className?: string
}

const AddToCartButton: React.FC<AddToCartButtonProps> = ({ id, onAddToCart, className }) => {
    return (
        <button className={`add_button ${className}`} onClick={() => onAddToCart(id)}>
            افزودن به سبد خرید
        </button>
    );
};

export default AddToCartButton;
