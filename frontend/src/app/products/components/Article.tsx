import Link from 'next/link';
import React from 'react';
import "./componentStyles.css";

interface ArticleProps {
  imageSrc: string;
  productName: string;
  description: string;
  price: string;
  productLink: string;
  type: string;
}

const Article: React.FC<ArticleProps> = ({ imageSrc, productName, description, price, productLink, type }) => {
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
        <button className='add_button'>افزودن به سبد خرید</button>
      </div>
    </article>
  );
}

export default Article;
