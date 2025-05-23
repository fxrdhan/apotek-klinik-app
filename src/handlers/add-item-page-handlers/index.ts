import { useRef, useState, ChangeEvent } from "react";
import { useParams, useLocation } from "react-router-dom";
import { useAddItemForm } from "@/hooks/add-item";
import { useBeforeUnload } from "@/handlers";

export const useAddItemPageHandlers = (expiryCheckboxRef?: React.RefObject<HTMLLabelElement | null>) => {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const initialSearchQuery = location.state?.searchQuery as string | undefined;
    const descriptionRef = useRef<HTMLDivElement>(null);
    const marginInputRef = useRef<HTMLInputElement>(null);
    const minStockInputRef = useRef<HTMLInputElement>(null);

    const addItemForm = useAddItemForm(id || undefined, initialSearchQuery);

    const [showDescription, setShowDescription] = useState(false);
    const [isDescriptionHovered, setIsDescriptionHovered] = useState(false);
    const [showFefoTooltip, setShowFefoTooltip] = useState(false);

    const handleSelectChange = (e: ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        addItemForm.handleSelectChange(e);

        if (name === "unit_id" && value) {
            const selectedUnit = addItemForm.units.find(unit => unit.id === value);
            if (selectedUnit) addItemForm.unitConversionHook.setBaseUnit(selectedUnit.name);
        }
    };

    const handleDropdownChange = (name: string, value: string) => {
        handleSelectChange({
            target: { name, value }
        } as ChangeEvent<HTMLSelectElement>);
    };

    const handleMarginChange = (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        addItemForm.setMarginPercentage(value);

        const margin = parseFloat(value);
        if (!isNaN(margin) && addItemForm.formData.base_price > 0) {
            addItemForm.updateFormData({ sell_price: addItemForm.calculateSellPriceFromMargin(margin) });
        }
    };

    const handleSellPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        addItemForm.handleChange(e);
        setTimeout(() => {
            const profit = addItemForm.calculateProfitPercentage();
            if (profit !== null) addItemForm.setMarginPercentage(profit.toFixed(1));
        }, 0);
    };

    const startEditingMargin = () => {
        const currentMargin = addItemForm.calculateProfitPercentage();
        addItemForm.setMarginPercentage(currentMargin !== null ? currentMargin.toFixed(1) : "0");
        addItemForm.setEditingMargin(true);

        setTimeout(() => {
            if (marginInputRef.current) {
                marginInputRef.current.focus();
                marginInputRef.current.select();
            }
        }, 10);
    };

    const stopEditingMargin = () => {
        addItemForm.setEditingMargin(false);

        const margin = parseFloat(addItemForm.marginPercentage);
        if (!isNaN(margin) && addItemForm.formData.base_price > 0) {
            addItemForm.updateFormData({ sell_price: addItemForm.calculateSellPriceFromMargin(margin) });
        }
    };

    const handleMarginKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            stopEditingMargin();

            const margin = parseFloat(addItemForm.marginPercentage);
            if (!isNaN(margin) && addItemForm.formData.base_price > 0) {
                addItemForm.updateFormData({ sell_price: addItemForm.calculateSellPriceFromMargin(margin) });
            }
        }
    };

    const startEditingMinStock = () => {
        addItemForm.setMinStockValue(String(addItemForm.formData.min_stock));
        addItemForm.setEditingMinStock(true);

        setTimeout(() => {
            if (minStockInputRef.current) {
                minStockInputRef.current.focus();
                minStockInputRef.current.select();
            }
        }, 10);
    };

    const stopEditingMinStock = () => {
        addItemForm.setEditingMinStock(false);

        const stockValue = parseInt(addItemForm.minStockValue, 10);
        if (!isNaN(stockValue) && stockValue >= 0) {
            addItemForm.updateFormData({ min_stock: stockValue });
        } else {
            addItemForm.setMinStockValue(String(addItemForm.formData.min_stock));
        }
    };

    const handleMinStockChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        addItemForm.setMinStockValue(e.target.value);
    };

    const handleMinStockKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            stopEditingMinStock();
            if (addItemForm.formData.is_medicine && expiryCheckboxRef?.current) {
                setTimeout(() => {
                    expiryCheckboxRef.current?.focus();
                }, 0);
            }
        }
    };

    useBeforeUnload(addItemForm.isDirty);

    return {
        ...addItemForm,
        id,
        descriptionRef,
        marginInputRef,
        minStockInputRef,
        showDescription, setShowDescription,
        isDescriptionHovered, setIsDescriptionHovered,
        showFefoTooltip, setShowFefoTooltip,
        handleSelectChange,
        handleDropdownChange,
        handleMarginChange,
        handleSellPriceChange,
        startEditingMargin,
        stopEditingMargin,
        handleMarginKeyDown,
        startEditingMinStock,
        stopEditingMinStock,
        handleMinStockChange,
        handleMinStockKeyDown,
        resetForm: addItemForm.resetForm,
    };
};