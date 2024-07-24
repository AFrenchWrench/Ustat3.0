// Article.tsx
import React from "react";

interface ArticleProps {
  imageSrc: string;
  productName: string;
  description: string;
  price: string;
  productLink: string;
  type: string; // Adjust the type based on your requirements
}

const Article: React.FC<ArticleProps> = ({
  imageSrc,
  productName,
  description,
  price,
  productLink,
  type,
}) => {
  return (
    <div>
      <img src={imageSrc} alt={productName} />
      <h2>{productName}</h2>
      <p>{description}</p>
      <span>{price}</span>
      <a href={productLink}>View Product</a>
      <p>Type: {type}</p>
    </div>
  );
};

export default Article;
