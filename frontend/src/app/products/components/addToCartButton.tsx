// components/AddToCartButton.js
import React from 'react';
import "./componentStyles.css";

interface AddToCartButtonProps {
    id: string;
    onAddToCart: (id: string) => void;
}

const AddToCartButton: React.FC<AddToCartButtonProps> = ({ id, onAddToCart }) => {
    return (
        <button className='add_button' onClick={() => onAddToCart(id)}>
            افزودن به سبد خرید
        </button>
    );
};

export default AddToCartButton;
