import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from "../../lib/supabase";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Table, TableHead, TableBody, TableRow, TableCell, TableHeader } from "../../components/ui/Table";
import { Loading } from "../../components/ui/Loading";
import { useConfirmDialog } from "../../components/ui/ConfirmDialog";

interface ItemType {
    id: string;
    name: string;
    description: string;
}

const TypeList = () => {
    const { openConfirmDialog } = useConfirmDialog();
    const queryClient = useQueryClient();

    const fetchTypes = async () => {
        try {
            const { data, error } = await supabase
                .from("item_types")
                .select("id, name, description")
                .order("name");
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error("Error fetching item types:", error);
            throw error;
        }
    };

    const { data: types = [], isLoading, isError, error } = useQuery<ItemType[]>({
        queryKey: ['types'],
        queryFn: fetchTypes,
        staleTime: 30 * 1000,
        refetchOnMount: true,
    });

    const queryError = error instanceof Error ? error : null;

    const deleteTypeMutation = useMutation({
        mutationFn: async (typeId: string) => {
            const { error } = await supabase.from("item_types").delete().eq("id", typeId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['types'] });
            console.log("Jenis item berhasil dihapus, cache diinvalidasi.");
        },
        onError: (error) => {
            console.error("Error deleting item type:", error);
            alert(`Gagal menghapus jenis item: ${error.message}`);
        },
    });

    const handleDelete = async (type: ItemType) => {
        openConfirmDialog({
            title: "Konfirmasi Hapus",
            message: `Apakah Anda yakin ingin menghapus jenis item "${type.name}"? Data yang terhubung mungkin akan terpengaruh.`,
            variant: 'danger',
            confirmText: "Hapus",
            onConfirm: () => {
                deleteTypeMutation.mutate(type.id);
            }
        });
    };

    return (
        <Card>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Daftar Jenis Item</h1>
                <Link to="/master-data/types/add">
                    <Button variant="primary">
                        <FaPlus className="mr-2" />
                        Tambah Jenis Item Baru
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
                            <TableHeader>Nama Jenis</TableHeader>
                            <TableHeader>Deskripsi</TableHeader>
                            <TableHeader className="text-center">Aksi</TableHeader>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {types.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center text-gray-500">
                                    Tidak ada data jenis item yang ditemukan
                                </TableCell>
                            </TableRow>
                        ) : (
                            types.map((type) => (
                                <TableRow key={type.id}>
                                    <TableCell>{type.name}</TableCell>
                                    <TableCell>{type.description}</TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex justify-center space-x-2">
                                            <Link to={`/master-data/types/edit/${type.id}`}>
                                                <Button variant="secondary" size="sm">
                                                    <FaEdit />
                                                </Button>
                                            </Link>
                                            <Button 
                                                variant="danger"
                                                size="sm"
                                                onClick={() => handleDelete(type)}
                                                disabled={deleteTypeMutation.isPending && deleteTypeMutation.variables === type.id}
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

export default TypeList;
