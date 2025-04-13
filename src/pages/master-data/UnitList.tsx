import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from "../../lib/supabase";
import { FaPlus } from "react-icons/fa";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Table, TableHead, TableBody, TableRow, TableCell, TableHeader } from "../../components/ui/Table";
import { Loading } from "../../components/ui/Loading";
import { useConfirmDialog } from "../../components/ui/ConfirmDialog";
import { AddCategoryModal } from "../../components/ui/AddEditModal";

interface Unit {
    id: string;
    name: string;
    description: string;
}

const UnitList = () => {
    const { openConfirmDialog } = useConfirmDialog();
    const queryClient = useQueryClient();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingUnit, setEditingUnit] = useState<Unit | null>(null);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (!isEditModalOpen && editingUnit) {
            timer = setTimeout(() => {
                setEditingUnit(null);
            }, 300); // Delay to allow modal close animation
        }
        return () => clearTimeout(timer);
    }, [editingUnit, isEditModalOpen]);

    const fetchUnits = async () => {
        const { data, error } = await supabase
            .from("item_units")
            .select("id, name, description")
            .order("name");

        if (error) throw error;
        return data || [];
    };

    const { data: units = [], isLoading, isError, error } = useQuery<Unit[]>({
        queryKey: ['units'],
        queryFn: fetchUnits,
        staleTime: 30 * 1000,
        refetchOnMount: true,
    });

    const queryError = error instanceof Error ? error : null;

    const deleteUnitMutation = useMutation({
        mutationFn: async (unitId: string) => {
            const { error } = await supabase.from("item_units").delete().eq("id", unitId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['units'] });
        },
        onError: (error) => {
            console.error("Error deleting unit:", error);
            alert(`Gagal menghapus satuan item: ${error.message}`);
        },
    });

    const addUnitMutation = useMutation({
        mutationFn: async (newUnit: { name: string; description: string }) => {
            const { error } = await supabase.from("item_units").insert(newUnit);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['units'] });
            setIsAddModalOpen(false);
        },
        onError: (error) => {
            alert(`Gagal menambahkan satuan: ${error.message}`);
        },
    });

    const updateUnitMutation = useMutation({
        mutationFn: async (updatedUnit: { id: string; name: string; description: string }) => {
            const { id, ...updateData } = updatedUnit;
            const { error } = await supabase
                .from("item_units")
                .update(updateData)
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['units'] });
            setIsEditModalOpen(false);
            setEditingUnit(null);
        },
        onError: (error) => {
            alert(`Gagal memperbarui satuan: ${error.message}`);
        },
    });

    const handleDelete = (unit: Unit) => {
        openConfirmDialog({
            title: "Konfirmasi Hapus",
            message: `Apakah Anda yakin ingin menghapus satuan item "${unit.name}"? Data yang terhubung mungkin akan terpengaruh.`,
            variant: 'danger',
            confirmText: "Hapus",
            onConfirm: () => {
                deleteUnitMutation.mutate(unit.id);
            }
        });
    };

    const handleEdit = (unit: Unit) => {
        setEditingUnit(unit);
        setIsEditModalOpen(true);
    };

    const handleModalSubmit = async (unitData: { id?: string; name: string; description: string }) => {
        if (unitData.id) {
            await updateUnitMutation.mutateAsync(unitData as { id: string; name: string; description: string });
        } else {
            await addUnitMutation.mutateAsync(unitData);
        }
    };

    return (
        <>
            <Card>
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 text-center flex-grow">Daftar Satuan Item</h1>
                    <Button
                        variant="primary"
                        className="flex items-center"
                        onClick={() => setIsAddModalOpen(true)}
                    >
                        <FaPlus className="mr-2" />
                        Tambah Satuan Baru
                    </Button>
                </div>

                {isLoading ? (
                    <Loading message="Memuat satuan..." />
                ) : isError ? (
                    <div className="text-center p-6 text-red-500">Error: {queryError?.message || 'Gagal memuat data'}</div>
                ) : (
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableHeader>Nama Satuan</TableHeader>
                                <TableHeader>Deskripsi</TableHeader>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {units.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={2} className="text-center text-gray-500">
                                        Tidak ada data satuan yang ditemukan
                                    </TableCell>
                                </TableRow>
                            ) : (
                                units.map((unit) => (
                                    <TableRow
                                        key={unit.id}
                                        onClick={() => handleEdit(unit)}
                                        className="cursor-pointer"
                                    >
                                        <TableCell>{unit.name}</TableCell>
                                        <TableCell>{unit.description || '-'}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                )}
            </Card>

            <AddCategoryModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSubmit={handleModalSubmit}
                isLoading={addUnitMutation.isPending}
                entityName="Satuan"
            />

            <AddCategoryModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSubmit={handleModalSubmit}
                initialData={editingUnit || undefined}
                onDelete={editingUnit ? (unitId) => handleDelete({ id: unitId, name: editingUnit.name, description: editingUnit.description }) : undefined}
                isLoading={updateUnitMutation.isPending}
                isDeleting={deleteUnitMutation.isPending}
                entityName="Satuan"
            />
        </>
    );
};

export default UnitList;