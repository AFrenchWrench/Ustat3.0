import React, { useState, useEffect } from 'react';
import styles from "@/allStyles/addItemStyles.module.css";
import AddDisplayItem from './addDisplayItem';
import CreateDisplayItem from './addItem';

interface DisplayItem {
    id: string;
    type: string;
    name: string;
}

interface Ivariations {
    id: string,
    name: string,
    price: number,
    fabric: string,
    color: string,
    woodColor: string,
    showInFirstPage: string,
    isForBusiness: string,
}

const AddItemTable: React.FC = () => {
    const [showPopup, setShowPopup] = useState(false);
    const [showPopupV, setShowPopupV] = useState(false);
    const [displayItems, setDisplayItems] = useState<DisplayItem[]>([]);
    const [displayVariations, setDisplayVariations] = useState<Ivariations[]>([]);
    const [activeId, setActiveId] = useState<string>("");
    const [itemType, setType] = useState<string>("");
    const [activeItemId, setActiveItemId] = useState<string | null>(null);

    const handleOpenPopup = () => {
        setShowPopup(true);
    };

    const handleOpenPopupV = () => {
        if (!activeId) {
            return;
        }
        setShowPopupV(true);
    };

    const handleClosePopupV = () => {
        setShowPopupV(false);
    };

    const handleClosePopup = () => {
        setShowPopup(false);
    };

    useEffect(() => {
        const fetchData = async () => {
            const query = `
                query DisplayItems {
                        displayItems {
                            totalPages
                            totalItems
                            items {
                                id
                                type
                                name
                            }
                        }
                }
            `;
            try {
                const response = await fetch('http://localhost/api/sales/graphql/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ query }),
                });

                const result = await response.json();
                console.log(result);

                if (result.data && result.data.displayItems.items) {
                    setDisplayItems(result.data.displayItems.items);
                }

            } catch (error) {
                console.error("Error fetching display items:", error);
            }
        };

        fetchData();
    }, [showPopup]);

    const handleVariations = async (id: string, type: string) => {
        setActiveId(id);
        setType(type)
        setActiveItemId(id); // Set the active item id
        const query = `
                query DisplayItem {
                    displayItem(id: "${id}") {
                        id
                        type
                        name
                        variants {
                            id
                            name
                            dimensions
                            price
                            description
                            fabric
                            color
                            woodColor
                            showInFirstPage
                            isForBusiness
                        }
                    }
                }
        `;
        try {
            const response = await fetch('/api/sales/graphql/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query }),
            });
            const result = await response.json();
            console.log(result);

            if (!result) {
                console.log("bad net");
            }

            if (result.error) {
                console.log(result.error);
            }
            if (result.data.displayItem.variants) {
                setDisplayVariations(result.data.displayItem.variants);
            }

        } catch (error) {
            console.log(error);
        }
    };

    const handleType = (type: string) => {
        switch (type) {
            case "S":
                return "مبل";
            case "B":
                return "سرویس خواب";
            case "M":
                return "میز و صندلی";
            case "J":
                return "جلومبلی عسلی";
            case "C":
                return "آینه کنسول";
            default:
                return "نامشخص";
        }
    };

    return (
        <section className={styles.tableSection}>
            <div className={styles.table}>
                <div className={styles.tableDisplayItems}>
                    <p>نوع محصول</p>
                    <div className={styles.tableQueryDisplayItems}>
                        {displayItems.map((item) => (
                            <div
                                onClick={() => handleVariations(item.id, item.type)}
                                key={item.id}
                                className={`${styles.item} ${activeItemId === item.id ? styles.activeItem : ''}`} // Conditionally add the active class
                                style={{
                                    backgroundColor: activeItemId === item.id ? 'white' : '',
                                    color: activeItemId === item.id ? 'black' : '',
                                }}
                            >
                                <p>{item.name} - {handleType(item.type)}</p>
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={handleOpenPopup}
                        disabled={showPopup || showPopupV}
                        className='disabled:bg-red-400'
                    >
                        add displayItem
                    </button>
                </div>

                <div className={styles.tableItems}>
                    <p>محصول</p>
                    <div className={styles.tableQueryItems}>
                        {
                            displayVariations.map((item) => (
                                <div className={styles.item} key={item.id}>
                                    <p>{item.name}</p>
                                    <p>{item.price}</p>
                                    <p>{item.color}</p>
                                </div>
                            ))
                        }
                    </div>
                    <button
                        onClick={handleOpenPopupV}
                        disabled={showPopup || showPopupV}
                        className='disabled:bg-red-400'
                    >add</button>
                </div>
            </div>

            {showPopup && (
                <div className={styles.popupOverlay}>
                    <AddDisplayItem onClose={handleClosePopup} />
                </div>
            )}
            {showPopupV && (
                <div className={styles.popupOverlay}>
                    <CreateDisplayItem onClose={handleClosePopupV} id={activeId} type={itemType} />
                </div>
            )}
        </section>
    );
};

export default AddItemTable;
