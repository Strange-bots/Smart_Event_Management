import { useState } from "react";
import DashboardLayout from "../../components/dashboard/dashboard";
import {
  CreditCard,
  Download,
  Calendar,
  DollarSign,
  Receipt as ReceiptIcon,
  Eye,
  X,
} from "lucide-react";

// ── mock data ─────────────────────────────────────────────────────────────────
const MOCK_RECEIPTS = [
  {
    id: "RCP-2024-001",
    eventTitle: "Annual Technology Summit 2024",
    amount: 50.0,
    paymentDate: "March 10, 2024",
    paymentMethod: "Visa •••• 4242",
  },
  {
    id: "RCP-2024-002",
    eventTitle: "Business Analytics Workshop",
    amount: 30.0,
    paymentDate: "March 5, 2024",
    paymentMethod: "Mastercard •••• 8888",
  },
  {
    id: "RCP-2024-003",
    eventTitle: "AI & Machine Learning Seminar",
    amount: 75.0,
    paymentDate: "February 28, 2024",
    paymentMethod: "Visa •••• 4242",
  },
];

// ── toast ─────────────────────────────────────────────────────────────────────
const useToast = () => {
  const [msg, setMsg] = useState(null);
  const show = (text) => {
    setMsg(text);
    setTimeout(() => setMsg(null), 2500);
  };
  return { msg, show };
};

// ── component ─────────────────────────────────────────────────────────────────
const UserPayments = () => {
  const receipts = MOCK_RECEIPTS;
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const { msg, show } = useToast();

  const totalSpent = receipts.reduce((sum, r) => sum + r.amount, 0);

  const handleDownloadReceipt = (receipt) => {
    show(`Receipt ${receipt.id} downloaded!`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Toast */}
        {msg && (
          <div className="fixed top-5 right-5 z-50 bg-[#1f4e79] text-white text-sm px-4 py-2.5 rounded-lg shadow-lg">
            {msg}
          </div>
        )}

        {/* Page Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1f4e79]">
            Payments &amp; Receipts
          </h1>
          <p className="text-gray-500 mt-1">
            View your payment history and download receipts
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl shadow-sm bg-white p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <DollarSign size={24} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">${totalSpent.toFixed(2)}</p>
              <p className="text-sm text-gray-500">Total Spent</p>
            </div>
          </div>

          <div className="rounded-xl shadow-sm bg-white p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
              <ReceiptIcon size={24} className="text-[#1f4e79]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{receipts.length}</p>
              <p className="text-sm text-gray-500">Total Receipts</p>
            </div>
          </div>

          <div className="rounded-xl shadow-sm bg-white p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
              <CreditCard size={24} className="text-[#f36f21]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{receipts.length}</p>
              <p className="text-sm text-gray-500">Paid Events</p>
            </div>
          </div>
        </div>

        {/* Receipts Table */}
        {receipts.length > 0 ? (
          <div className="rounded-xl shadow-sm bg-white">
            <div className="px-6 pt-5 pb-3">
              <h2 className="text-lg font-semibold text-gray-900">Payment History</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-t border-gray-100">
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-6 py-3">Receipt ID</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-6 py-3">Event</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-6 py-3">Amount</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-6 py-3">Date</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-6 py-3">Method</th>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wide px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {receipts.map((receipt) => (
                    <tr key={receipt.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-mono text-sm text-gray-700">{receipt.id}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">{receipt.eventTitle}</td>
                      <td className="px-6 py-4">
                        <span className="bg-green-100 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full">
                          ${receipt.amount.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-gray-500">
                          <Calendar size={14} />
                          {receipt.paymentDate}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <CreditCard size={14} className="text-gray-400" />
                          {receipt.paymentMethod}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => setSelectedReceipt(receipt)}
                            className="h-8 w-8 flex items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 transition-colors"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleDownloadReceipt(receipt)}
                            className="h-8 w-8 flex items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 transition-colors"
                          >
                            <Download size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="rounded-xl shadow-sm bg-white p-12 text-center">
            <ReceiptIcon size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">No payments yet</h3>
            <p className="text-gray-500">
              Your payment history and receipts will appear here after you register for paid events
            </p>
          </div>
        )}
      </div>

      {/* Receipt Detail Modal */}
      {selectedReceipt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setSelectedReceipt(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Payment Receipt</h2>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="h-8 w-8 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="text-center pb-4 border-b border-gray-200">
                <p className="text-sm text-gray-500">Receipt ID</p>
                <p className="font-mono text-lg font-bold text-gray-900">{selectedReceipt.id}</p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Event</span>
                  <span className="font-medium text-gray-900 text-right max-w-[60%]">{selectedReceipt.eventTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Amount</span>
                  <span className="font-bold text-green-600">${selectedReceipt.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Date</span>
                  <span className="text-gray-900">{selectedReceipt.paymentDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment Method</span>
                  <span className="text-gray-900">{selectedReceipt.paymentMethod}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleDownloadReceipt(selectedReceipt)}
                  className="w-full flex items-center justify-center gap-2 bg-[#f36f21] text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-[#e05e10] transition-colors"
                >
                  <Download size={18} />
                  Download Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default UserPayments;
