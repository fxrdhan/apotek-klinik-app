import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export interface UnitConversion {
    id: string;
    unit: string;
    conversion: number;
    basePrice: number;
}

export interface UseUnitConversionReturn {
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
    sortConversions: () => void;
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
    const addUnitConversion = (unitConversion: Omit<UnitConversion, "id" | "basePrice">) => {
        const calculatedBasePrice = basePrice / unitConversion.conversion;
        
        const newUnitConversion: UnitConversion = {
            ...unitConversion,
            id: Date.now().toString(),
            basePrice: calculatedBasePrice,
        };
        
        const updatedConversions = [...unitConversions, newUnitConversion];
        // Sort automatically after adding
        const sortedConversions = updatedConversions.sort((a, b) => b.conversion - a.conversion);
        
        setUnitConversions(sortedConversions);
    };

    // Fungsi untuk menghapus konversi satuan
    const removeUnitConversion = (id: string) => {
        setUnitConversions(unitConversions.filter((uc) => uc.id !== id));
    };

    // Menghitung ulang harga pokok untuk semua konversi berdasarkan harga pokok dasar
    const recalculateBasePrices = () => {
        const updatedConversions = unitConversions.map(uc => ({
            ...uc,
            basePrice: basePrice / uc.conversion
        }));
        
        setUnitConversions(updatedConversions);
    };

    // Mengurutkan konversi dari satuan terbesar ke terkecil (konversi terbesar ke terkecil)
    const sortConversions = () => {
        const sortedConversions = [...unitConversions].sort((a, b) => b.conversion - a.conversion);
        setUnitConversions(sortedConversions);
    };

    return {
        baseUnit,
        setBaseUnit,
        basePrice,
        setBasePrice,
        unitConversions,
        addUnitConversion,
        removeUnitConversion,
        unitConversionFormData,
        setUnitConversionFormData,
        recalculateBasePrices,
        sortConversions,
        availableUnits
    };
};