import Link from 'next/link';
import React, { useState } from 'react';
import "./componentStyles.css";
import AddToCartButton from './addToCartButton';
import SelectOrder from './SelectOrder';

interface ArticleProps {
  imageSrc: string;
  productName: string;
  description: string;
  price: string;
  productLink: string;
  type: string;
}

const Article: React.FC<ArticleProps> = ({ imageSrc, productName, description, price, productLink, type }) => {

  const [showSelectOrder, setShowSelectOrder] = useState(false);

  const handleAddToCart = (id: string) => {
    console.log('Adding to cart:', id);
    if (!showSelectOrder) {
      setShowSelectOrder(true);
    }
  };

  const handleRemoveOrder = () => {
    setShowSelectOrder(false);
  };



  return (
    <article className='article'>
      <div className='top_section'>
        <picture className='picture'>
          <img src={imageSrc} alt={productName} />
        </picture>
        <div className='top_left_section'>
          <p className='product_name'><strong>{productName}</strong></p>
          <p className='description'>{description}</p>
          <p dir='ltr' className='price'>{price}</p>
        </div>
      </div>
      <div className='buttons_section'>
        <Link className='more' href={`/products/${type}/${productLink}`}>مشاهده محصول</Link>
        <AddToCartButton id={productLink} onAddToCart={handleAddToCart} />
        {showSelectOrder && <SelectOrder id={productLink} onRemove={handleRemoveOrder} />}
      </div>
    </article>
  );
}

export default Article;
