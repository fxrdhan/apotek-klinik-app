// src/pages/purchases/ViewPurchase.tsx
import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Loading } from "../../components/ui/Loading";
import { formatRupiah } from "../../lib/formatters";
import { FaArrowLeft, FaPrint, FaFilePdf } from "react-icons/fa";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface PurchaseData {
    id: string;
    invoice_number: string;
    date: string;
    due_date: string | null;
    so_number: string | null;
    total: number;
    payment_status: string;
    payment_method: string;
    vat_percentage: number;
    is_vat_included: boolean;
    vat_amount: number;
    notes: string | null;
    supplier: {
        name: string;
        address: string | null;
        contact_person: string | null;
    };
    customer_name?: string;
    customer_address?: string;
    checked_by?: string;
}

interface PurchaseItem {
    id: string;
    item_id: string;
    item: {
        name: string;
        code: string;
    };
    quantity: number;
    price: number;
    discount: number;
    subtotal: number;
    vat_percentage: number;
    unit: string;
    batch_no: string | null;
    expiry_date: string | null;
}

const ViewPurchase = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const printRef = useRef<HTMLDivElement>(null);

    const [purchase, setPurchase] = useState<PurchaseData | null>(null);
    const [items, setItems] = useState<PurchaseItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetchPurchaseData(id);
        }
    }, [id]);

    const fetchPurchaseData = async (purchaseId: string) => {
        try {
            setLoading(true);

            // Fetch purchase data with supplier information
            const { data: purchaseData, error: purchaseError } = await supabase
                .from("purchases")
                .select(`
          *,
          supplier:suppliers(
            name,
            address,
            contact_person
          )
        `)
                .eq("id", purchaseId)
                .single();

            if (purchaseError) throw purchaseError;

            // Fetch purchase items with item information
            const { data: itemsData, error: itemsError } = await supabase
                .from("purchase_items")
                .select(`
          *,
          item:items(
            name,
            code
          )
        `)
                .eq("purchase_id", purchaseId)
                .order("id");

            if (itemsError) throw itemsError;

            setPurchase(purchaseData);
            setItems(itemsData || []);
        } catch (error) {
            console.error("Error fetching purchase data:", error);
        } finally {
            setLoading(false);
        }
    };

    // Calculate subtotals
    const calculateSubtotals = () => {
        // Base prices total (before discounts and VAT)
        const baseTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // Total discounts
        const discountTotal = items.reduce((sum, item) => {
            const itemTotal = item.price * item.quantity;
            const discountAmount = (itemTotal * item.discount) / 100;
            return sum + discountAmount;
        }, 0);

        // Total after discounts
        const afterDiscountTotal = baseTotal - discountTotal;

        // Total VAT
        const vatTotal = purchase?.is_vat_included
            ? 0 // If VAT included, it's already in the item prices
            : items.reduce((sum, item) => {
                const itemTotal = item.price * item.quantity;
                const afterDiscount = itemTotal - (itemTotal * item.discount / 100);
                const vatAmount = afterDiscount * (item.vat_percentage / 100);
                return sum + vatAmount;
            }, 0);

        // Grand total
        const grandTotal = purchase?.is_vat_included
            ? afterDiscountTotal // If VAT included, no need to add VAT
            : afterDiscountTotal + vatTotal;

        return {
            baseTotal,
            discountTotal,
            afterDiscountTotal,
            vatTotal,
            grandTotal
        };
    };

    const handlePrint = () => {
        if (printRef.current) {
            window.print();
        }
    };

    const handleGeneratePDF = async () => {
        if (!printRef.current) return;

        const element = printRef.current;
        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            logging: false
        });

        const imgData = canvas.toDataURL('image/png');

        // F4 dimensions: 215 x 330 mm
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: [215, 330]
        });

        const imgWidth = 215;
        const imgHeight = canvas.height * imgWidth / canvas.width;

        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        pdf.save(`purchase-${purchase?.invoice_number}.pdf`);
    };

    if (loading) {
        return <Loading message="Memuat data pembelian..." />;
    }

    if (!purchase) {
        return (
            <div className="text-center p-6">
                <p className="text-red-500 mb-4">Data pembelian tidak ditemukan</p>
                <Button onClick={() => navigate("/purchases")}>
                    <FaArrowLeft className="mr-2" /> Kembali ke Daftar Pembelian
                </Button>
            </div>
        );
    }

    const {
        baseTotal,
        discountTotal,
        afterDiscountTotal,
        vatTotal,
        grandTotal
    } = calculateSubtotals();

    return (
        <Card>
            <div className="flex justify-between items-center mb-4 print:hidden">
                <Button onClick={() => navigate("/purchases")} variant="outline">
                    <FaArrowLeft className="mr-2" /> Kembali
                </Button>

                <div className="flex space-x-3">
                    <Button onClick={handlePrint} variant="secondary">
                        <FaPrint className="mr-2" /> Cetak
                    </Button>
                    <Button onClick={handleGeneratePDF}>
                        <FaFilePdf className="mr-2" /> Download PDF
                    </Button>
                </div>
            </div>

            <div
                ref={printRef}
                className="bg-white p-6 shadow print:shadow-none"
                style={{ width: "215mm", minHeight: "330mm", margin: "0 auto" }}
            >
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-center mb-2">FAKTUR PEMBELIAN</h1>
                    <div className="border-b-2 border-gray-400 mb-4"></div>

                    <div className="flex justify-between gap-4">
                        <div className="w-1/2">
                            {/* Supplier Info */}
                            <div className="text-left mb-4">
                                <h2 className="font-bold text-lg text-gray-800">{purchase.supplier?.name || 'Supplier'}</h2>
                                <div className="text-sm text-gray-600">
                                    <p>{purchase.supplier?.address || ''}</p>
                                </div>
                            </div>
                            
                            {/* Customer Info */}
                            <div className="text-left">
                                <h2 className="font-bold text-lg text-gray-800">Customer:</h2>
                                <div className="text-sm text-gray-600">
                                    <p>{purchase.customer_name || 'Apotek & Klinik'}</p>
                                    <p>{purchase.customer_address || 'Alamat belum tersedia'}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="w-1/2">
                            {/* Faktur Info */}
                            <div className="bg-gray-50 p-3 rounded">
                                <p className="text-sm mb-1"><strong>No. Faktur:</strong> {purchase.invoice_number}</p>
                                <p className="text-sm mb-1"><strong>Tanggal:</strong> {new Date(purchase.date).toLocaleDateString('id-ID')}</p>
                                <p className="text-sm mb-1"><strong>Jatuh Tempo:</strong> {purchase.due_date ? new Date(purchase.due_date).toLocaleDateString('id-ID') : '-'}</p>
                                {purchase.so_number && (
                                    <p className="text-sm mb-1"><strong>No. SO:</strong> {purchase.so_number}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mb-8">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-100 text-xs">
                                <th className="border p-1 text-left">No.</th>
                                <th className="border p-1 text-left">Kode</th>
                                <th className="border p-1 text-left">Nama Item</th>
                                <th className="border p-1 text-center">Batch</th>
                                <th className="border p-1 text-center">Exp</th>
                                <th className="border p-1 text-center">Qty</th>
                                <th className="border p-1 text-center">Satuan</th>
                                <th className="border p-1 text-right">Harga</th>
                                <th className="border p-1 text-right">Disc %</th>
                                {!purchase.is_vat_included && (
                                    <th className="border p-1 text-right">PPN %</th>
                                )}
                                <th className="border p-1 text-right">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.length === 0 ? (
                                <tr>
                                    <td colSpan={purchase.is_vat_included ? 10 : 11} className="border p-2 text-center text-gray-500 text-xs">
                                        Tidak ada item
                                    </td>
                                </tr>
                            ) : (
                                items.map((item, index) => (
                                    <tr key={item.id} className="hover:bg-gray-50 text-xs">
                                        <td className="border p-1 text-center">{index + 1}</td>
                                        <td className="border p-1">{item.item?.code || '-'}</td>
                                        <td className="border p-1">{item.item?.name || 'Item tidak ditemukan'}</td>
                                        <td className="border p-1 text-center">{item.batch_no || '-'}</td>
                                        <td className="border p-1 text-center">
                                            {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit' }) : '-'}
                                        </td>
                                        <td className="border p-1 text-center">{item.quantity}</td>
                                        <td className="border p-1 text-center">{item.unit}</td>
                                        <td className="border p-1 text-right">{formatRupiah(item.price)}</td>
                                        <td className="border p-1 text-right">{item.discount > 0 ? `${item.discount}%` : '-'}</td>
                                        {!purchase.is_vat_included && (
                                            <td className="border p-1 text-right">{item.vat_percentage > 0 ? `${item.vat_percentage}%` : '-'}</td>
                                        )}
                                        <td className="border p-1 text-right">{formatRupiah(item.subtotal)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-between">
                    <div className="max-w-md">
                        <p className="text-sm mb-2"><strong>Diperiksa oleh:</strong> {purchase.supplier?.contact_person || purchase.checked_by || '-'}</p>
                        
                        <p className="text-sm mb-2"><strong>Status Pembayaran: </strong>
                            <span className={`${purchase.payment_status === 'paid' ? 'text-green-600' :
                                    purchase.payment_status === 'partial' ? 'text-orange-600' : 'text-red-600'
                                }`}>
                                {purchase.payment_status === 'paid' ? 'Lunas' :
                                    purchase.payment_status === 'partial' ? 'Sebagian' : 'Belum Dibayar'}
                            </span>
                        </p>
                        <p className="text-sm mb-2"><strong>Metode Pembayaran:</strong> {
                            purchase.payment_method === 'cash' ? 'Tunai' :
                                purchase.payment_method === 'transfer' ? 'Transfer' :
                                    purchase.payment_method === 'credit' ? 'Kredit' : purchase.payment_method
                        }</p>
                        
                        <p className="text-sm mb-2"><strong>Catatan:</strong> {purchase.notes || '-'}</p>
                        {purchase.is_vat_included && (
                            <p className="text-sm mt-2">* PPN sudah termasuk dalam harga</p>
                        )}
                    </div>

                    <div className="border p-4 min-w-[250px]">
                        <div className="flex justify-between mb-2">
                            <span>Subtotal:</span>
                            <span>{formatRupiah(baseTotal)}</span>
                        </div>

                        <div className="flex justify-between mb-2">
                            <span>Diskon:</span>
                            <span>({formatRupiah(discountTotal)})</span>
                        </div>

                        <div className="flex justify-between mb-2">
                            <span>Setelah Diskon:</span>
                            <span>{formatRupiah(afterDiscountTotal)}</span>
                        </div>

                        {!purchase.is_vat_included && (
                            <div className="flex justify-between mb-2">
                                <span>PPN ({purchase.vat_percentage}%):</span>
                                <span>{formatRupiah(vatTotal)}</span>
                            </div>
                        )}

                        <div className="border-t pt-2 flex justify-between font-bold">
                            <span>TOTAL:</span>
                            <span>{formatRupiah(grandTotal)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default ViewPurchase;