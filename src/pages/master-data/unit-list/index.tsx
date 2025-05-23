import { FaPlus } from "react-icons/fa";
import {
    Card,
    Button,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    TableHeader,
    Pagination,
    SearchBar,
    PageTitle,
    AddEditModal
} from "@/components/modules";
import { useMasterDataManagement } from "@/handlers";

const UnitList = () => {
    const {
        isAddModalOpen,
        setIsAddModalOpen,
        isEditModalOpen,
        setIsEditModalOpen,
        editingItem: editingUnit,
        search,
        setSearch,
        data: units,
        totalItems: totalUnits,
        isLoading,
        isError,
        queryError,
        isFetching,
        handleEdit,
        handleModalSubmit,
        handlePageChange,
        handleItemsPerPageChange,
        totalPages,
        currentPage,
        itemsPerPage,
        addMutation: addUnitMutation,
        updateMutation: updateUnitMutation,
        deleteMutation: deleteUnitMutation,
        openConfirmDialog,
        debouncedSearch
    } = useMasterDataManagement("item_units", "Satuan");

    return (
        <>
            <Card
                className={
                    isFetching ? "opacity-75 transition-opacity duration-300" : ""
                }
            >
                <div className="mb-6">
                    <PageTitle title="Daftar Satuan Item" />
                </div>

                <div className="flex items-center">
                    <SearchBar
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari nama atau deskripsi satuan..."
                        className="flex-grow"
                    />
                    <Button
                        variant="primary"
                        className="flex items-center ml-4 mb-4"
                        onClick={() => setIsAddModalOpen(true)}
                    >
                        <FaPlus className="mr-2" />
                        Tambah Satuan Baru
                    </Button>
                </div>

                {isError ? (
                    <div className="text-center p-6 text-red-500">
                        Error: {queryError?.message || "Gagal memuat data"}
                    </div>
                ) : (
                    <>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableHeader className="w-[15%]">Nama Satuan</TableHeader>
                                    <TableHeader className="w-[85%]">Deskripsi</TableHeader>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {isLoading && (!units || units.length === 0) ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={2}
                                            className="text-center text-gray-500 py-10"
                                        >
                                            Memuat data satuan...
                                        </TableCell>
                                    </TableRow>
                                ) : units && units.length > 0 ? (
                                    units.map((unit) => (
                                        <TableRow
                                            key={unit.id}
                                            onClick={() => handleEdit(unit)}
                                            className="cursor-pointer hover:bg-blue-50"
                                        >
                                            <TableCell>{unit.name}</TableCell>
                                            <TableCell>{unit.description || "-"}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={2}
                                            className="text-center text-gray-500 py-10"
                                        >
                                            {debouncedSearch
                                                ? `Tidak ada satuan dengan kata kunci "${debouncedSearch}"`
                                                : "Tidak ada data satuan yang ditemukan"}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={totalUnits || 0}
                            itemsPerPage={itemsPerPage || 10}
                            itemsCount={units?.length || 0}
                            onPageChange={handlePageChange}
                            onItemsPerPageChange={handleItemsPerPageChange}
                        />
                    </>
                )}
            </Card>

            <AddEditModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSubmit={handleModalSubmit}
                isLoading={addUnitMutation.isPending}
                entityName="Satuan"
            />

            <AddEditModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSubmit={handleModalSubmit}
                initialData={editingUnit || undefined}
                onDelete={
                    editingUnit
                        ? (itemId) => {
                            openConfirmDialog({
                                title: "Konfirmasi Hapus",
                                message: `Apakah Anda yakin ingin menghapus satuan "${editingUnit.name}"?`,
                                variant: "danger",
                                confirmText: "Ya, Hapus",
                                onConfirm: async () => {
                                    await deleteUnitMutation.mutateAsync(itemId);
                                },
                            });
                        } : undefined
                }
                isLoading={updateUnitMutation.isPending}
                isDeleting={deleteUnitMutation.isPending}
                entityName="Satuan"
            />
        </>
    );
};

export default UnitList;
