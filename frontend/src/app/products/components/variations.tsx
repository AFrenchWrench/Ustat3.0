import React from 'react';
import "./componentStyles.css";


interface Ivariation {
    id: string
    name: string;
    fabric: string;
    thumbnail: string;
    price: number;
    color: string;
}

interface Ivariations {
    variations?: Ivariation[];
    onSelectVariation: (id: string) => void;
    active: string | string[]
}

const Variations: React.FC<Ivariations> = ({ variations, onSelectVariation, active }) => {



    return (
        <div className='variation_container'>
            {variations && variations.map((variation, index) => (
                <div style={variation.id === active ? { backgroundColor: 'rgb(36,36,36)' } : { backgroundColor: 'rgb(27,27,27)' }} onClick={() => onSelectVariation(variation.id)} key={index} className='variation_item'>
                    <img src={`/media/${variation.thumbnail}`} alt={variation.name} />
                    <div>
                        <h3 className='variation_name'>{variation.name}</h3>
                        <span>
                            <p>پارچه : {variation.fabric}</p>
                            <p>رنگ :{variation.color}</p>
                        </span>
                        <p className='variation_price'>{Number(variation.price).toLocaleString("en-US")} تومان</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default Variations;
