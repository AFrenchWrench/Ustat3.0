"use client"

import React, { useState, useEffect } from 'react';
import styles from "@/allStyles/addItemStyles.module.css";
import AddDisplayItem from './addDisplayItem';
import CreateDisplayItem from './addItem';
import { Pagination } from '@mui/material';
import EditDisplayItem from './editDisplayItem';

import { TiEdit } from "react-icons/ti";
import { MdDelete } from 'react-icons/md';
import DeleteDisplayItem from './deleteDisplayItem';
import EditVariation from './editVariation';
import DeleteVariation from './deleteVariation';

interface DisplayItem {
    id: string;
    type: string;
    name: string;
}
interface Ivariations {
    id: string,
    name: string,
    dimensions: string,
    description: string,
    price: number,
    fabric: string,
    color: string,
    woodColor: string,
    showInFirstPage: boolean,
    isForBusiness: boolean,
    thumbnail: string,
    slider1: string,
    slider2: string,
    slider3: string,
}

const AddItemTable: React.FC = () => {
    const [showPopup, setShowPopup] = useState(false);
    const [showPopupV, setShowPopupV] = useState(false);

    const [showEdit, setShowEdit] = useState(false);
    const [showEditV, setShowEditV] = useState(false);

    const [showDelete, setShowDelete] = useState(false)
    const [showDeleteV, setShowDeleteV] = useState(false)

    const [displayItems, setDisplayItems] = useState<DisplayItem[]>([]);

    const [displayVariations, setDisplayVariations] = useState<Ivariations[]>([]);

    const [activeId, setActiveId] = useState<string>("");
    const [itemType, setType] = useState<string>("");
    const [itemName, setItemName] = useState<string>("")
    const [itemVariationData, setItemVariationData] = useState<Ivariations | null>(null)
    const [itemVariationId, setItemVariationId] = useState<string>("")

    const [activeItemId, setActiveItemId] = useState<string | null>(null);

    const [totalPages, setTotalPages] = useState<number | undefined>(undefined)
    const [currentPage, setCurrentPage] = useState<number>(1);


    // Filters for display items
    const [filterType, setFilterType] = useState<string | null>(null);
    const [filterName, setFilterName] = useState<string | null>(null);

    // Filters for item variations
    const [filterVariantName, setFilterVariantName] = useState<string | null>(null);
    const [filterPriceLte, setFilterPriceLte] = useState<number | null>(null);
    const [filterPriceGte, setFilterPriceGte] = useState<number | null>(null);
    const [filterFabric, setFilterFabric] = useState<string | null>(null);
    const [filterColor, setFilterColor] = useState<string | null>(null);
    const [filterWoodColor, setFilterWoodColor] = useState<string | null>(null);
    const [filterIsForBusiness, setFilterIsForBusiness] = useState<string | null>(null);

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
    const handleCloseEdit = () => {
        setShowEdit(false)
    }
    const handleCloseDelete = () => {
        setShowDelete(false)
    }
    const handleCloseEditV = () => {
        setShowEditV(false)
    }
    const handleCloseDeleteV = () => {
        setShowDeleteV(false)
    }

    // Handlers for filters
    const handleFilterTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFilterType(e.target.value || null);
    };

    const handleFilterNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilterName(e.target.value || null);
    };

    const handleFilterVariantNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilterVariantName(e.target.value || null);
    };

    const handleFilterPriceLteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilterPriceLte(e.target.value ? Number(e.target.value) : null);
    };

    const handleFilterPriceGteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilterPriceGte(e.target.value ? Number(e.target.value) : null);
    };

    const handleFilterFabricChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilterFabric(e.target.value || null);
    };

    const handleFilterColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilterColor(e.target.value || null);
    };

    const handleFilterWoodColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilterWoodColor(e.target.value || null);
    };

    const handleFilterIsForBusinessChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFilterIsForBusiness(e.target.value || null);
    };

    const handleDisplayItemsFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchData(currentPage);
    };

    const handleVariationsFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (activeId) {
            fetchVariations(activeId);
        }
    };

    const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
        setCurrentPage(value);
        fetchData(value);
    };

    const fetchData = async (page: number) => {
        const query = `
            query DisplayItems {
                displayItems (
                    page: ${page},
                    perPage: 8 ,
                    filter: {
                        ${filterType ? `type: "${filterType}"` : ""},
                        ${filterName ? `name_Icontains: "${filterName}"` : ""}
                    }
                ) {
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

            if (result.data && result.data.displayItems.items) {
                setDisplayItems(result.data.displayItems.items);
                setTotalPages(result.data.displayItems.totalPages)
            }

        } catch (error) {
            console.error("Error fetching display items:", error);
        }
    };

    const fetchVariations = async (id: string) => {
        const query = `
            query ItemVariants {
                itemVariants(
                    filter: {
                        displayItem_Id: ${id},
                        ${filterVariantName ? `name_Icontains: "${filterVariantName}"` : ""},
                        ${filterPriceLte !== null ? `price_Lte: ${filterPriceLte}` : ""},
                        ${filterPriceGte !== null ? `price_Gte: ${filterPriceGte}` : ""},
                        ${filterFabric ? `fabric_Icontains: "${filterFabric}"` : ""},
                        ${filterColor ? `color: "${filterColor}"` : ""},
                        ${filterWoodColor ? `woodColor: "${filterWoodColor}"` : ""},
                        ${filterIsForBusiness ? `isForBusiness: ${filterIsForBusiness}` : ""}
                    }
                ) {
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
                    thumbnail
                    slider1
                    slider2
                    slider3
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

            if (result.data && result.data.itemVariants) {
                setDisplayVariations(result.data.itemVariants);
            }

        } catch (error) {
            console.error("Error fetching item variations:", error);
        }
    };

    useEffect(() => {
        fetchData(currentPage);
    }, [showPopup, currentPage, showEdit, showDelete]);

    useEffect(() => {
        activeId ? fetchVariations(activeId) : "";
    }, [showEditV, showDeleteV])

    const handleVariations = (id: string, type: string) => {
        setActiveId(id);
        setType(type);
        setActiveItemId(id);
        fetchVariations(id);
    };
    const handleDisplayItemEdit = (id: string, name: string) => {
        setActiveId(id);
        setItemName(name);
        setShowEdit(true);
    }
    const handleDisplayItemDelete = (id: string) => {
        setActiveId(id)
        setShowDelete(true)
    }
    const handleVariationEdit = (item: Ivariations) => {
        setItemVariationData(item)
        setShowEditV(true)
    }
    const handleVariationDelete = (id: string) => {
        setItemVariationId(id)
        setShowDeleteV(true)
    }

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
            {/* Form for filtering display items */}
            <form onSubmit={handleDisplayItemsFilterSubmit} className={styles.filterForm}>
                <h3>فیلتر محصولات</h3>
                <div className={styles.filterRow}>
                    <label htmlFor="typeFilter">نوع محصول:</label>
                    <select id="typeFilter" value={filterType || ''} onChange={handleFilterTypeChange}>
                        <option value="">همه</option>
                        <option value="s">مبل</option>
                        <option value="b">سرویس خواب</option>
                        <option value="m">میز و صندلی</option>
                        <option value="j">جلومبلی عسلی</option>
                        <option value="c">آینه کنسول</option>
                    </select>
                </div>
                <div className={styles.filterRow}>
                    <label htmlFor="nameFilter">نام محصول:</label>
                    <input
                        id="nameFilter"
                        type="text"
                        value={filterName || ''}
                        onChange={handleFilterNameChange}
                    />
                </div>
                <button type="submit">اعمال فیلتر</button>
            </form>

            <div className={styles.table}>
                <div className={styles.tableDisplayItems}>
                    <p>نوع محصول</p>
                    <div className={styles.tableQueryDisplayItems}>
                        {displayItems.map((item) => (
                            <div
                                onClick={() => handleVariations(item.id, item.type)}
                                key={item.id}
                                className={`${styles.item} ${activeItemId === item.id ? styles.activeItem : ''}`}
                                style={{
                                    backgroundColor: activeItemId === item.id ? 'white' : '',
                                    color: activeItemId === item.id ? 'black' : '',
                                }}
                            >
                                <p>{item.name} - {handleType(item.type)}</p>
                                <div className={styles.editDeleteButtons}>
                                    <button onClick={() => handleDisplayItemEdit(item.id, item.name)}><TiEdit className={styles.editIcon} /></button>
                                    <button onClick={() => handleDisplayItemDelete(item.id)}><MdDelete color='white' className={styles.editIconD} /></button>
                                </div>
                            </div>
                        ))}
                    </div>


                    <Pagination
                        dir='ltr'
                        count={totalPages}
                        page={currentPage}
                        onChange={handlePageChange}
                        size="small"
                        sx={{
                            '& .MuiPaginationItem-root': {
                                color: 'white', // Text color for pagination items
                            },
                            '& .Mui-selected': {
                                color: 'white', // Text color for selected pagination item
                                backgroundColor: 'rgb(211, 47, 47)', // Background color for selected pagination item
                            },
                            '& .MuiPaginationItem-root:hover': {
                                backgroundColor: 'rgba(255, 0, 0, 0.1)', // Hover effect for pagination items
                            },
                        }}
                    />


                    <button
                        onClick={handleOpenPopup}
                        disabled={showPopup || showPopupV}
                        className='disabled:bg-red-400'
                    >
                        اضافه کردن
                    </button>
                </div>

                <div className={styles.tableItems}>
                    <p>محصول</p>
                    <div className={styles.tableQueryItems}>
                        {displayVariations.map((item) => (
                            <div className={styles.item} key={item.id}>
                                <p>{item.name}</p>
                                <p>{item.price}</p>
                                <p>{item.color}</p>
                                <div className={styles.editDeleteButtons}>
                                    <button onClick={() => handleVariationEdit(item)}><TiEdit className={styles.editIcon} /></button>
                                    <button onClick={() => handleVariationDelete(item.id)}><MdDelete color='white' className={styles.editIconD} /></button>
                                </div>
                            </div>
                        ))}

                    </div>
                    <button
                        onClick={handleOpenPopupV}
                        disabled={showPopup || showPopupV}
                        className='disabled:bg-red-400'
                    >اضافه کردن</button>
                </div>
            </div>

            {/* Form for filtering item variations */}
            <form onSubmit={handleVariationsFilterSubmit} className={styles.filterForm}>
                <h3>فیلتر انواع محصول</h3>
                <div className={styles.filterRow}>
                    <label htmlFor="variantNameFilter">نام :</label>
                    <input
                        id="variantNameFilter"
                        type="text"
                        value={filterVariantName || ''}
                        onChange={handleFilterVariantNameChange}
                    />
                </div>
                <div className={styles.filterRow}>
                    <label htmlFor="priceGteFilter">حداقل قیمت:</label>
                    <input
                        id="priceGteFilter"
                        type="number"
                        dir='ltr'
                        value={filterPriceGte !== null ? filterPriceGte : ''}
                        onChange={handleFilterPriceGteChange}
                    />
                </div>
                <div className={styles.filterRow}>
                    <label htmlFor="priceLteFilter">حداکثر قیمت:</label>
                    <input
                        dir='ltr'
                        id="priceLteFilter"
                        type="number"
                        value={filterPriceLte !== null ? filterPriceLte : ''}
                        onChange={handleFilterPriceLteChange}
                    />
                </div>
                <div className={styles.filterRow}>
                    <label htmlFor="fabricFilter">جنس:</label>
                    <input
                        id="fabricFilter"
                        type="text"
                        value={filterFabric || ''}
                        onChange={handleFilterFabricChange}
                    />
                </div>
                <div className={styles.filterRow}>
                    <label htmlFor="colorFilter">رنگ:</label>
                    <input
                        id="colorFilter"
                        type="text"
                        value={filterColor || ''}
                        onChange={handleFilterColorChange}
                    />
                </div>
                <div className={styles.filterRow}>
                    <label htmlFor="woodColorFilter">رنگ چوب:</label>
                    <input
                        id="woodColorFilter"
                        type="text"
                        value={filterWoodColor || ''}
                        onChange={handleFilterWoodColorChange}
                    />
                </div>
                <div className={styles.filterRow}>
                    <label htmlFor="isForBusinessFilter">مناسب برای شرکت:</label>
                    <select id="isForBusinessFilter" value={filterIsForBusiness || ''} onChange={handleFilterIsForBusinessChange}>
                        <option value="">همه</option>
                        <option value="true">بله</option>
                        <option value="false">خیر</option>
                    </select>
                </div>
                <button type="submit">اعمال فیلتر</button>
            </form>

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
            {showEdit && (
                <div className={styles.popupOverlay}>
                    <EditDisplayItem onClose={handleCloseEdit} id={activeId} type={itemType} name={itemName} />
                </div>
            )}
            {showEditV && (
                <div className={styles.popupOverlay}>
                    <EditVariation onClose={handleCloseEditV} data={itemVariationData} type={itemType} />
                </div>
            )}
            {showDelete && (
                <div className={styles.popupOverlay}>
                    <DeleteDisplayItem onClose={handleCloseDelete} id={activeId} />
                </div>
            )}
            {showDeleteV && (
                <div className={styles.popupOverlay}>
                    <DeleteVariation onClose={handleCloseDeleteV} id={itemVariationId} />
                </div>
            )}
        </section>
    );
};

export default AddItemTable;
