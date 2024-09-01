"use client";

import Link from 'next/link';
import React, { useState } from 'react';
import "./componentStyles.css";
import AddToCartButton from './addToCartButton';
import SelectOrder from './SelectOrder';

import Cookies from 'js-cookie';

interface OrderItems {
  id: string;
  type: string;
  name: string;
  price: number;
  quantity: number;
}

interface DisplayOrder {
  id: string;
  dueDate: string;
  creationDate: string;
  orderNumber: string;
  status: string;
  items: OrderItems[];
}

interface ArticleProps {
  imageSrc: string;
  productName: string;
  price: string;
  productLink: string;
  type: string;
  orderData: DisplayOrder[];
  onOrderUpdate: (newOrderData: DisplayOrder[]) => void;
}

const Article: React.FC<ArticleProps> = ({ imageSrc, productName, price, productLink, type, orderData, onOrderUpdate }) => {
  const [showSelectOrder, setShowSelectOrder] = useState(false);

  const handleAddToCart = (id: string) => {
    const token = Cookies.get('Authorization');
    if (token) {
      setShowSelectOrder(true);
    } else {
      window.location.href = '/auth'; // Redirect to authentication page
    }
  };

  const handleRemoveOrder = () => {
    setShowSelectOrder(false);
  };

  return (
    <article className='article'>
      <div className='top_section'>
        <picture className='picture'>
          <Link href={`/products/${type}/${productLink}`}>
            <img src={imageSrc} alt={productName} />
          </Link>
        </picture>
        <div className='top_right_section'>
          <p className='product_name'><strong>{productName}</strong></p>
          <p dir='ltr' className='price'>{Number(price).toLocaleString('en-US')} تومان</p>
        </div>
      </div>
      <div className='buttons_section'>
        <Link className='more' href={`/products/${type}/${productLink}`}>مشاهده محصول</Link>
        <AddToCartButton id={productLink} onAddToCart={handleAddToCart} />
      </div>
      {showSelectOrder && <SelectOrder id={productLink} orderData={orderData} onRemove={handleRemoveOrder} onOrderUpdate={onOrderUpdate} />}
    </article>
  );
};

export default Article;
