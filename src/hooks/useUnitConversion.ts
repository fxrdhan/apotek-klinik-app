import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

export interface UnitConversion {
    id: string;
    unit: {
        id: string;
        name: string;
    };
    conversion: number;
    basePrice: number;
}

export interface UseUnitConversionReturn {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    conversions: any;
    baseUnit: string;
    setBaseUnit: React.Dispatch<React.SetStateAction<string>>;
    basePrice: number;
    setBasePrice: React.Dispatch<React.SetStateAction<number>>;
    unitConversions: UnitConversion[];
    addUnitConversion: (unitConversion: Omit<UnitConversion, "id" | "basePrice">) => void;
    removeUnitConversion: (id: string) => void;
    unitConversionFormData: {
        unit: string;
        conversion: number;
    };
    setUnitConversionFormData: React.Dispatch<React.SetStateAction<{
        unit: string;
        conversion: number;
    }>>;
    recalculateBasePrices: () => void;
    availableUnits: UnitData[];
}

export interface UnitData {
    id: string;
    name: string;
}

export const useUnitConversion = (): UseUnitConversionReturn => {
    const [baseUnit, setBaseUnit] = useState<string>("");
    const [basePrice, setBasePrice] = useState<number>(0);
    const [unitConversions, setUnitConversions] = useState<UnitConversion[]>([]);
    const [availableUnits, setAvailableUnits] = useState<UnitData[]>([]);

    const [unitConversionFormData, setUnitConversionFormData] = useState({
        unit: "",
        conversion: 0,
    });

    // Fetch available units from database
    useEffect(() => {
        const fetchUnits = async () => {
            const { data } = await supabase
                .from("item_units")
                .select("id, name")
                .order("name");
            
            if (data) {
                setAvailableUnits(data);
            }
        };

        fetchUnits();
    }, []);

    // Fungsi untuk menambah konversi satuan
    const addUnitConversion = useCallback((unitConversion: Omit<UnitConversion, "id" | "basePrice">) => {
        // Hitung harga per unit kecil (misal: per tablet)
        // Jika 1 strip = 10 tablet dan harga strip 50.000,
        // maka harga per tablet = 50.000 / 10 = 5.000
        const calculatedBasePrice = basePrice / unitConversion.conversion;
        
        const newUnitConversion: UnitConversion = {
            ...unitConversion,
            id: Date.now().toString(),
            basePrice: calculatedBasePrice,
        };
        setUnitConversions(prevConversions => [...prevConversions, newUnitConversion]);
    }, [basePrice]);

    // Fungsi untuk menghapus konversi satuan
    const removeUnitConversion = useCallback((id: string) => {
        setUnitConversions(prevConversions => prevConversions.filter(uc => uc.id !== id));
    }, []);

    // Menghitung ulang harga pokok untuk semua konversi berdasarkan harga pokok dasar
    const recalculateBasePrices = useCallback(() => {
        if (basePrice <= 0 || unitConversions.length === 0) return;
        
        setUnitConversions(prevConversions => 
            prevConversions.map(uc => ({
                ...uc,
                basePrice: basePrice > 0 ? (basePrice / uc.conversion) : 0
            }))
        );
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [basePrice]);

    return {
        baseUnit,
        setBaseUnit,
        basePrice,
        setBasePrice,
        conversions: unitConversions,
        unitConversions,
        addUnitConversion,
        removeUnitConversion,
        unitConversionFormData,
        setUnitConversionFormData,
        recalculateBasePrices,
        availableUnits
    };
};