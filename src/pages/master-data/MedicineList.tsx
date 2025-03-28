import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { FaPlus, FaEdit, FaTrash, FaSearch } from "react-icons/fa";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Table, TableHead, TableBody, TableRow, TableCell, TableHeader } from "../../components/ui/Table";
import { Loading } from "../../components/ui/Loading";

interface Medicine {
    id: string;
    name: string;
    category: { name: string };
    type: { name: string };
    unit: { name: string };
    buy_price: number;
    sell_price: number;
    stock: number;
}

const MedicineList = () => {
    const [medicines, setMedicines] = useState<Medicine[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState(""); 
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Efek untuk debounce pencarian
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setCurrentPage(1); // Reset ke halaman pertama saat pencarian berubah
        }, 500);
        
        return () => clearTimeout(timer);
    }, [search]);

    // Efek untuk mengambil data saat parameter berubah
    useEffect(() => {
        fetchMedicines(currentPage, debouncedSearch, itemsPerPage);
    }, [currentPage, debouncedSearch, itemsPerPage]);

    const fetchMedicines = async (page = 1, searchTerm = '', limit = 10) => {
        try {
            setLoading(true);

            // Buat query dasar
            let query = supabase
                .from("medicines")
                .select(`
                id, 
                name, 
                buy_price, 
                sell_price, 
                stock,
                category_id,
                type_id,
                unit_id
                `);

            // Tambahkan pencarian jika ada
            if (searchTerm) {
                query = query.ilike('name', `%${searchTerm}%`);
            }

            // Ambil total jumlah item untuk pagination
            // Membuat query terpisah untuk menghitung total item
            let countQuery = supabase
                .from("medicines")
                .select('id', { count: 'exact' });
                
            // Tambahkan pencarian jika ada
            if (searchTerm) {
                countQuery = countQuery.ilike('name', `%${searchTerm}%`);
            }
                
            const { count, error: countError } = await countQuery;
            if (countError) throw countError;

            // Tambahkan pagination
            const from = (page - 1) * limit;
            const to = from + limit - 1;
            
            const { data, error } = await query
                .order('name')
                .range(from, to);

            if (error) {
                console.error("Error fetching medicines:", error);
                throw error;
            }
            
            // Ambil data referensi
            const { data: categories } = await supabase.from("medicine_categories").select("id, name");
            const { data: types } = await supabase.from("medicine_types").select("id, name");
            const { data: units } = await supabase.from("medicine_units").select("id, name");
            
            // Gabungkan data
            const completedData = (data || []).map(item => ({
                id: item.id,
                name: item.name,
                buy_price: item.buy_price,
                sell_price: item.sell_price,
                stock: item.stock,
                category: { 
                    name: categories?.find(cat => cat.id === item.category_id)?.name || "" },
                type: { name: types?.find(t => t.id === item.type_id)?.name || "" },
                unit: { name: units?.find(u => u.id === item.unit_id)?.name || "" }
            }));

            setTotalItems(count || 0);
            setMedicines(completedData);
        } catch (error) {
            console.error("Error fetching medicines:", error);
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
    };

    const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setItemsPerPage(Number(e.target.value));
        setCurrentPage(1); // Reset ke halaman pertama
    };

    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const Pagination = () => {
        const pageNumbers = [];
        const maxPageDisplay = 5;
        
        let startPage = Math.max(1, currentPage - Math.floor(maxPageDisplay / 2));
        const endPage = Math.min(totalPages, startPage + maxPageDisplay - 1);
        
        if (endPage - startPage + 1 < maxPageDisplay) {
            startPage = Math.max(1, endPage - maxPageDisplay + 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }
        
        return (
            <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-gray-600">
                    Menampilkan {medicines.length} dari {totalItems} obat
                </div>
                
                <div className="flex items-center">
                    <div className="mr-4">
                        <select 
                            value={itemsPerPage} 
                            onChange={handleItemsPerPageChange}
                            className="border rounded-md p-2"
                        >
                            <option value={5}>5 per halaman</option>
                            <option value={10}>10 per halaman</option>
                            <option value={20}>20 per halaman</option>
                            <option value={50}>50 per halaman</option>
                        </select>
                    </div>
                    
                    <div className="flex">
                        <button
                            onClick={() => handlePageChange(1)}
                            disabled={currentPage === 1}
                            className="px-3 py-2 mx-1 rounded-md border disabled:opacity-50"
                        >
                            &laquo;
                        </button>
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-3 py-2 mx-1 rounded-md border disabled:opacity-50"
                        >
                            &lt;
                        </button>
                        
                        {pageNumbers.map(number => (
                            <button
                                key={number}
                                onClick={() => handlePageChange(number)}
                                className={`px-3 py-2 mx-1 rounded-md border ${
                                    currentPage === number ? 'bg-primary text-emerald-500' : ''
                                }`}
                            >
                                {number}
                            </button>
                        ))}
                        
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="px-3 py-2 mx-1 rounded-md border disabled:opacity-50"
                        >
                            &gt;
                        </button>
                        <button
                            onClick={() => handlePageChange(totalPages)}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="px-3 py-2 mx-1 rounded-md border disabled:opacity-50"
                        >
                            &raquo;
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <Card>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Daftar Obat</h1>

                <Link
                    to="/master-data/medicines/add"
                >
                    <Button variant="primary">
                        <FaPlus className="mr-2" />
                        Tambah Obat Baru
                    </Button>
                </Link>
            </div>

            <div className="mb-4 relative">
                <input
                    type="text"
                    placeholder="Cari obat..."
                    className="w-full p-3 border rounded-md pl-10"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <FaSearch className="absolute left-3 top-3.5 text-gray-400" />
            </div>

            {loading ? (
                <Loading />
            ) : (
                <>
                  <Table>
                    <TableHead>
                        <TableRow>
                            <TableHeader>Nama Obat</TableHeader>
                            <TableHeader>Kategori</TableHeader>
                            <TableHeader>Jenis</TableHeader>
                            <TableHeader>Satuan</TableHeader>
                            <TableHeader className="text-right">Harga Beli</TableHeader>
                            <TableHeader className="text-right">Harga Jual</TableHeader>
                            <TableHeader className="text-right">Stok</TableHeader>
                            <TableHeader className="text-center">Aksi</TableHeader>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {medicines.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={8}
                                    className="text-center text-gray-600"
                                >
                                    {debouncedSearch ? `Tidak ada obat dengan nama "${debouncedSearch}"` : "Tidak ada data obat yang ditemukan"}
                                </TableCell>
                            </TableRow>
                        ) : (
                            medicines.map((medicine) => (
                                <TableRow key={medicine.id}>
                                    <TableCell>{medicine.name}</TableCell>
                                    <TableCell>{medicine.category.name}</TableCell>
                                    <TableCell>{medicine.type.name}</TableCell>
                                    <TableCell>{medicine.unit.name}</TableCell>
                                    <TableCell className="text-right">
                                        {medicine.buy_price.toLocaleString("id-ID", {
                                            style: "currency",
                                            currency: "IDR",
                                        })}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {medicine.sell_price.toLocaleString("id-ID", {
                                            style: "currency",
                                            currency: "IDR",
                                        })}
                                    </TableCell>
                                    <TableCell className="text-right">{medicine.stock}</TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex justify-center space-x-2">
                                            <Link
                                                to={`/master-data/medicines/edit/${medicine.id}`}
                                            >
                                                <Button variant="secondary" size="sm">
                                                    <FaEdit />
                                                </Button>
                                            </Link>
                                            <Button 
                                                variant="danger" 
                                                size="sm"
                                                onClick={() => handleDelete(medicine.id)}
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
                
                <Pagination />
                </>
            )}
        </Card>
    );
    
    async function handleDelete(id: string) {
        if (window.confirm("Apakah Anda yakin ingin menghapus obat ini?")) {
            try {
                const { error } = await supabase
                    .from("medicines")
                    .delete()
                    .eq("id", id);
                
                if (error) throw error;
                
                // Refresh data
                fetchMedicines(currentPage, debouncedSearch, itemsPerPage);
            } catch (error) {
                console.error("Error deleting medicine:", error);
                alert("Gagal menghapus obat. Silakan coba lagi.");
            }
        }
    }
};

export default MedicineList;