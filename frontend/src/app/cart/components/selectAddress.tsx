"use client"

import React, { useEffect, useState } from 'react';
import Style from "@/allStyles/orderStyles.module.css";
import Cookies from 'js-cookie';
import { MdAddLocationAlt } from 'react-icons/md';
import CreateNewAddress from './createNewAddress';

interface Address {
    id: string;
    title: string;
    address: string;
    postalCode: string;
}

interface ISelectAddress {
    selectedAddressId: (id: string) => void;
    selectedAddress: (address: string) => void;
    onClose: () => void;
}

const SelectAddress: React.FC<ISelectAddress> = ({ selectedAddressId, onClose, selectedAddress }) => {
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreateAddress, setShowCreateAddress] = useState<boolean>(false);

    useEffect(() => {
        const fetchAddresses = async () => {
            const Authorization = Cookies.get("Authorization");

            try {
                const response = await fetch('http://localhost/api/users/graphql/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': Authorization ? Authorization : '',
                    },
                    body: JSON.stringify({
                        query: `
                            query Addresses {
                                addresses {
                                    id
                                    title
                                    address
                                    postalCode
                                }
                            }
                        `,
                    }),
                });

                const result = await response.json();

                if (response.ok) {
                    setAddresses(result.data.addresses);
                } else {
                    setError(result.errors[0].message || 'Failed to fetch addresses');
                }
            } catch (err) {
                setError('An error occurred while fetching addresses');
            } finally {
                setLoading(false);
            }
        };

        fetchAddresses();
    }, []);

    const handleSelect = (id: string, address: string) => {
        selectedAddressId(id);
        selectedAddress(address);
        onClose();
    };

    const handleCreateAddressClose = (newAddress: { id: string; address: string }) => {
        // Refresh addresses or handle newly created address
        setAddresses((prevAddresses) => [
            { ...newAddress, title: '', postalCode: '' },
            ...prevAddresses
        ]);
        selectedAddressId(newAddress.id);
        selectedAddress(newAddress.address);
        onClose();
    };

    if (loading) {
        return null;
    }

    if (error) {
        return <p>Error: {error}</p>;
    }

    return (
        <div className={Style.addressesSection}>
            <div className={Style.addressesContainer}>
                {!showCreateAddress ? (
                    <>
                        <h2>یک آدرس انتخاب کنید</h2>
                        <ul>
                            {addresses && addresses.map((address) => (
                                <li key={address.id} onClick={() => handleSelect(address.id, address.address)}>
                                    <h3 className={Style.addressTitle}>{address.title}</h3>
                                    <p>کد پستی {`${address.postalCode.slice(0, 5)}-${address.postalCode.slice(5)}`}</p>
                                </li>
                            ))}
                        </ul>
                        <div className={Style.selectAddressButtons}>
                            <button className={Style.newAddressButton} onClick={() => setShowCreateAddress(true)}>
                                آدرس جدید <MdAddLocationAlt className={Style.addAddressButtonIcon} />
                            </button>
                            <button onClick={onClose}>بستن</button>
                        </div>
                    </>
                ) : (
                    <CreateNewAddress onClose={handleCreateAddressClose} />
                )}
            </div>
        </div>
    );
};

export default SelectAddress;
