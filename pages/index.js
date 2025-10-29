import React, { useState, useMemo } from "react";

// Single-file React component for a cafe closing form
// Usage: paste into a Next.js page (e.g. pages/index.tsx or app/page.tsx) or into a create-react-app/Vite project.
// Tailwind CSS classes are used for styling. On Vercel deploy a Next.js app with Tailwind configured.

const FOOD_ITEMS = [
  "Indomie Goreng Telur",
  "Indomie Rebus Telur",
  "Kentang Goreng",
  "Mie Goreng WaShanghai",
  "Mie Kuah WaShanghai",
  "Nasi Ayam Chilli Padi",
  "Nasi Ayam Rempah Melayu",
  "Nasi Ayam Ungkep WaShanghai",
  "Nasi Goreng WaShanghai",
  "Nasi Soto Ayam",
  "Nasi Soto Daging",
  "Nugget Goreng",
  "Sosis Goreng",
  "Nasi Ayam Goreng Saus Mayo",
  "Nasi Ayam Goreng Saus Mentega",
  "Nasi Soto Paru",
];

// All food items have a fixed potongan (dompet kecil) per item: 2500
const FOOD_POTONGAN = 2500;

// Additional items with their potongan per unit (IDR)
const ADDITIONAL_ITEMS = [
  { key: "Beer", label: "Beer (potongan 5000)", potongan: 5000 },
  { key: "Nasi Telur Barendo", label: "Nasi Telur Barendo (potongan 2000)", potongan: 2000 },
  { key: "Teh Telur", label: "Teh Telur (potongan 2000)", potongan: 2000 },
  { key: "Teh Telur PT", label: "Teh Telur PT (potongan 2000)", potongan: 2000 },
  { key: "Telur Barendo", label: "Telur Barendo (potongan 2000)", potongan: 2000 },
];

function formatIDR(number) {
  if (!number && number !== 0) return "-";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(number);
}

export default function CafeClosingForm() {
  // counts for each food item
  const [foodCounts, setFoodCounts] = useState(() => FOOD_ITEMS.map(() => ""));
  // counts for additional items
  const [addCounts, setAddCounts] = useState(() => ADDITIONAL_ITEMS.map(() => ""));

  // The user still inputs gross totals coming from POS / cashier
  const [grossFood, setGrossFood] = useState(0);
  const [grossAdditional, setGrossAdditional] = useState(0);
  const [openFoodTotal, setOpenFoodTotal] = useState(0); // open food amount

  // phone number for WhatsApp (in international format without +, e.g. 628123...)
  const [waNumber, setWaNumber] = useState("");
  
  // tanggal closing (default: hari ini)
  const [closingDate, setClosingDate] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  // computed DK for food and additional
  const dkFood = useMemo(() => {
    let total = 0;
    foodCounts.forEach((v) => {
      const n = parseInt(String(v || 0)) || 0;
      total += n * FOOD_POTONGAN;
    });
    return total;
  }, [foodCounts]);

  const dkAdditional = useMemo(() => {
    let total = 0;
    addCounts.forEach((v, idx) => {
      const n = parseInt(String(v || 0)) || 0;
      total += n * ADDITIONAL_ITEMS[idx].potongan;
    });
    return total;
  }, [addCounts]);

  const dkTotal = dkFood + dkAdditional;

  const grossTotal = Number(grossFood || 0) + Number(grossAdditional || 0) + Number(openFoodTotal || 0);
  const netDapur = grossTotal - dkTotal;

  function updateFoodCount(index, value) {
    const newArr = [...foodCounts];
    // allow only integers
    newArr[index] = value.replace(/[^0-9]/g, "");
    setFoodCounts(newArr);
  }

  function updateAddCount(index, value) {
    const newArr = [...addCounts];
    newArr[index] = value.replace(/[^0-9]/g, "");
    setAddCounts(newArr);
  }

  function buildWhatsAppMessage() {
    const lines = [];
    lines.push("*CLOSING DAPUR - (otomatis)*");
    
    // Format tanggal dari input
    const dateObj = new Date(closingDate + 'T00:00:00');
    const formattedDate = dateObj.toLocaleDateString("id-ID", { 
      weekday: "long", 
      year: "numeric", 
      month: "long", 
      day: "numeric" 
    });
    
    lines.push(`Tanggal: ${formattedDate}`);
    lines.push("");
    lines.push("-- Dompet Kecil (DK) dari Food --");
    FOOD_ITEMS.forEach((label, i) => {
      const cnt = parseInt(foodCounts[i] || 0) || 0;
      if (cnt > 0) lines.push(`${label}: ${cnt} x ${formatIDR(FOOD_POTONGAN)} = ${formatIDR(cnt * FOOD_POTONGAN)}`);
    });
    lines.push(`*Total DK Food: ${formatIDR(dkFood)}*`);
    lines.push("");
    lines.push("-- Dompet Kecil (DK) dari Additional --");
    ADDITIONAL_ITEMS.forEach((it, i) => {
      const cnt = parseInt(addCounts[i] || 0) || 0;
      if (cnt > 0) lines.push(`${it.label}: ${cnt} x ${formatIDR(it.potongan)} = ${formatIDR(cnt * it.potongan)}`);
    });
    lines.push(`*Total DK Additional: ${formatIDR(dkAdditional)}*`);
    lines.push("");
    lines.push("-- Total Penjualan --");
    lines.push(`Gross Food (POS): ${formatIDR(Number(grossFood || 0))}`);
    lines.push(`Gross Additional (POS): ${formatIDR(Number(grossAdditional || 0))}`);
    lines.push(`Open Food: ${formatIDR(Number(openFoodTotal || 0))}`);
    lines.push(`*Total Gross: ${formatIDR(grossTotal)}*`);
    lines.push("");
    lines.push(`*Total DK: ${formatIDR(dkTotal)}*`);
    lines.push("");
    lines.push(`*PENDAPATAN BERSIH DAPUR = ${formatIDR(netDapur)}*`);

    return encodeURIComponent(lines.join("\n"));
  }

  function handleSendWA() {
    if (!waNumber) {
      alert("Masukkan nomor WhatsApp penerima (format internasional tanpa +, contoh: 628123...) terlebih dahulu.");
      return;
    }
    const msg = buildWhatsAppMessage();
    const href = `https://wa.me/6281378351320?text=${msg}`;
    window.open(href, "_blank");
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex items-start justify-center">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow p-6">
        <h1 className="text-2xl font-semibold mb-4">Form Closing — Dapur (coffeeshop terpisah)</h1>
        <p className="text-sm text-gray-600 mb-6">Masukkan jumlah terjual tiap menu (untuk menghitung DK), lalu masukkan Total Gross dari POS untuk menghasilkan Pendapatan Bersih Dapur. Tekan "Kirim ke WhatsApp" untuk mengirim ringkasan.</p>

        {/* Input Tanggal Closing */}
        <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Closing</label>
          <input 
            type="date" 
            className="w-full md:w-64 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
            value={closingDate} 
            onChange={(e) => setClosingDate(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="font-medium mb-2">Food — masukkan jumlah terjual</h2>
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-auto pr-2">
              {FOOD_ITEMS.map((label, i) => (
                <div key={i} className="flex items-center gap-2 border p-2 rounded">
                  <div className="flex-1 text-sm">{label}</div>
                  <input
                    className="w-20 p-1 border rounded text-right"
                    value={foodCounts[i]}
                    onChange={(e) => updateFoodCount(i, e.target.value)}
                    placeholder="0"
                  />
                </div>
              ))}
            </div>
            <div className="mt-3 text-sm text-gray-700">Potongan per item: {formatIDR(FOOD_POTONGAN)} — Total DK Food: <span className="font-semibold">{formatIDR(dkFood)}</span></div>
          </div>

          <div>
            <h2 className="font-medium mb-2">Additional — jumlah terjual</h2>
            <div className="grid gap-2 max-h-64 overflow-auto pr-2">
              {ADDITIONAL_ITEMS.map((it, i) => (
                <div key={it.key} className="flex items-center gap-2 border p-2 rounded">
                  <div className="flex-1 text-sm">{it.label}</div>
                  <input
                    className="w-20 p-1 border rounded text-right"
                    value={addCounts[i]}
                    onChange={(e) => updateAddCount(i, e.target.value)}
                    placeholder="0"
                  />
                </div>
              ))}
            </div>
            <div className="mt-3 text-sm text-gray-700">Total DK Additional: <span className="font-semibold">{formatIDR(dkAdditional)}</span></div>

            <div className="mt-6">
              <label className="block text-sm text-gray-600">Gross Food (dari POS)</label>
              <input type="number" className="w-full p-2 border rounded mt-1" value={grossFood} onChange={(e) => setGrossFood(Number(e.target.value))} />

              <label className="block text-sm text-gray-600 mt-3">Gross Additional (dari POS)</label>
              <input type="number" className="w-full p-2 border rounded mt-1" value={grossAdditional} onChange={(e) => setGrossAdditional(Number(e.target.value))} />

              <label className="block text-sm text-gray-600 mt-3">Open Food (jika ada)</label>
              <input type="number" className="w-full p-2 border rounded mt-1" value={openFoodTotal} onChange={(e) => setOpenFoodTotal(Number(e.target.value))} />
            </div>
          </div>
        </div>

        <div className="mt-6 border-t pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-600">Total DK</div>
            <div className="text-xl font-semibold">{formatIDR(dkTotal)}</div>
          </div>

          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-600">Total Gross</div>
            <div className="text-xl font-semibold">{formatIDR(grossTotal)}</div>
          </div>

          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-600">Pendapatan Bersih Dapur</div>
            <div className="text-xl font-semibold text-green-600">{formatIDR(netDapur)}</div>
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm text-gray-600">Nomor WhatsApp penerima (contoh: 628123456789)</label>
          <div className="flex gap-2 mt-2">
            <input className="flex-1 p-2 border rounded" value={waNumber} onChange={(e) => setWaNumber(e.target.value.replace(/[^0-9]/g, ""))} placeholder="628..." />
            <button onClick={handleSendWA} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Kirim ke WhatsApp</button>
          </div>
          <p className="text-xs text-gray-500 mt-2">Tombol akan membuka WhatsApp web/Applikasi dengan ringkasan otomatis. Pastikan nomor benar.</p>
        </div>

        <div className="mt-6 text-sm text-gray-500">Catatan: Jika Anda ingin menghitung DK langsung dari jumlah penjualan (nilai rupiah per item), kita bisa menambah input harga per item. Saat ini komponen menghitung DK dari jumlah unit x potongan yang telah ditentukan (2500 untuk food, nilai berbeda pada additional).</div>
      </div>
    </div>
  );
}