import React from 'react';
import "./componentStyles.css";

import { useRouter } from 'next/navigation';

interface Ivariation {
    id: string
    name: string;
    fabric: string;
    thumbnail: string;
    price: number;
    color: string;
}

interface Ivariations {
    variations: Ivariation[];
    onSelectVariation: (id: string) => void;
    active: string | string[]
}

const Variations: React.FC<Ivariations> = ({ variations, onSelectVariation, active }) => {

    const { push } = useRouter()


    return (
        <div className='variation_container'>
            {variations && variations.map((variation, index) => (
                <div style={variation.id === active ? { backgroundColor: 'rgb(36,36,36)' } : { backgroundColor: 'rgb(27,27,27)' }} onClick={() => onSelectVariation(variation.id)} key={index} className='variation_item'>
                    <img src={`/media/${variation.thumbnail}`} alt={variation.name} />
                    <div>
                        <h3>{variation.name}</h3>
                        <span>
                            <p>{variation.fabric}</p>
                            <p>{variation.color}</p>
                        </span>
                        <p>${variation.price.toFixed(2)}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default Variations;
