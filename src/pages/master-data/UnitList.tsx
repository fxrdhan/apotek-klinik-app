import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from "../../lib/supabase";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Table, TableHead, TableBody, TableRow, TableCell, TableHeader } from "../../components/ui/Table";
import { Loading } from "../../components/ui/Loading";
import { useConfirmDialog } from "../../components/ui/ConfirmDialog";

interface Unit {
    id: string;
    name: string;
    description: string;
}

const UnitList = () => {
    const { openConfirmDialog } = useConfirmDialog();
    const queryClient = useQueryClient();

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

    return (
        <Card>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Daftar Satuan Item</h1>
                <Link to="/master-data/units/add">
                    <Button variant="primary" className="flex items-center">
                        <FaPlus className="mr-2" />
                        Tambah Satuan Baru
                    </Button>
                </Link>
            </div>

            {isLoading ? (
                <Loading />
            ) : isError ? (
                <div className="text-center p-6 text-red-500">Error: {queryError?.message || 'Gagal memuat data'}</div>
            ) : (
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableHeader>Nama Satuan</TableHeader>
                            <TableHeader>Deskripsi</TableHeader>
                            <TableHeader className="text-center">Aksi</TableHeader>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {units.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center text-gray-500">
                                    Tidak ada data satuan yang ditemukan
                                </TableCell>
                            </TableRow>
                        ) : (
                            units.map((unit) => (
                                <TableRow key={unit.id}>
                                    <TableCell>{unit.name}</TableCell>
                                    <TableCell>{unit.description || '-'}</TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex justify-center space-x-2">
                                            <Link to={`/master-data/units/edit/${unit.id}`}>
                                                <Button variant="secondary" size="sm">
                                                    <FaEdit />
                                                </Button>
                                            </Link>
                                            <Button 
                                                variant="danger"
                                                size="sm"
                                                onClick={() => handleDelete(unit)}
                                                disabled={deleteUnitMutation.isPending && deleteUnitMutation.variables === unit.id}
                                            >
                                                <FaTrash />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            )}
        </Card>
    );
};

export default UnitList;