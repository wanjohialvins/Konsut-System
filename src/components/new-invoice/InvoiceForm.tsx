
import React from 'react';
import { FaUser, FaRegCalendarAlt as FaCalendarAlt } from "react-icons/fa";
import type { InvoiceType } from '../../types/types';

interface InvoiceFormProps {
    customerName: string;
    setCustomerName: (val: string) => void;
    customerPhone: string;
    setCustomerPhone: (val: string) => void;
    customerEmail: string;
    setCustomerEmail: (val: string) => void;
    customerAddress: string;
    setCustomerAddress: (val: string) => void;
    customerKraPin: string;
    setCustomerKraPin: (val: string) => void;
    issuedDate: string;
    setIssuedDate: (val: string) => void;
    dueDate: string;
    setDueDate: (val: string) => void;
    activeDocumentType: InvoiceType;
    validationErrors: Record<string, string>;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    customerEmail,
    setCustomerEmail,
    customerAddress,
    setCustomerAddress,
    customerKraPin,
    setCustomerKraPin,
    issuedDate,
    setIssuedDate,
    dueDate,
    setDueDate,
    activeDocumentType,
    validationErrors,
}) => {
    return (
        <div className="bg-white dark:bg-midnight-900 p-8 rounded-3xl shadow-xl shadow-gray-200/40 dark:shadow-none border border-gray-100 dark:border-midnight-800">
            <h2 className="text-sm font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-6 flex items-center gap-2">
                <div className="p-2 bg-brand-50 dark:bg-brand-900/20 rounded-lg text-brand-600 dark:text-brand-400"><FaUser /></div>
                Customer Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="text-xs font-bold text-gray-400 ml-1 mb-1 block uppercase">Full Name</label>
                    <input
                        placeholder="John Doe"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className={`w-full bg-gray-50 dark:bg-midnight-950 border-none p-4 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 font-bold text-gray-900 dark:text-white ${validationErrors.customerName ? "ring-2 ring-red-500 bg-red-50 dark:bg-red-900/10" : ""}`}
                        autoComplete='off' />
                    {validationErrors.customerName && <span className="text-xs font-bold text-red-500 mt-1 block">{validationErrors.customerName}</span>}
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-400 ml-1 mb-1 block uppercase">Phone Number</label>
                    <input
                        placeholder="+254 7..."
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className={`w-full bg-gray-50 dark:bg-midnight-950 border-none p-4 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 font-bold text-gray-900 dark:text-white ${validationErrors.customerPhone ? "ring-2 ring-red-500 bg-red-50 dark:bg-red-900/10" : ""}`}
                        autoComplete='off'
                    />
                </div>

                <div>
                    <label className="text-xs font-bold text-gray-400 ml-1 mb-1 block uppercase">Email Address</label>
                    <input
                        placeholder="email@example.com"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        className={`w-full bg-gray-50 dark:bg-midnight-950 border-none p-4 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 font-bold text-gray-900 dark:text-white ${validationErrors.customerEmail ? "ring-2 ring-red-500 bg-red-50 dark:bg-red-900/10" : ""}`}
                        autoComplete='off'
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-400 ml-1 mb-1 block uppercase">Physical Address</label>
                    <input
                        placeholder="Location..."
                        value={customerAddress}
                        onChange={(e) => setCustomerAddress(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-midnight-950 border-none p-4 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 font-bold text-gray-900 dark:text-white"
                        autoComplete='off'
                    />
                </div>

                <div>
                    <label className="text-xs font-bold text-gray-400 ml-1 mb-1 block uppercase">KRA PIN</label>
                    <input
                        placeholder="P0..."
                        value={customerKraPin}
                        onChange={(e) => setCustomerKraPin(e.target.value)}
                        className={`w-full bg-gray-50 dark:bg-midnight-950 border-none p-4 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 font-bold text-gray-900 dark:text-white ${validationErrors.customerKraPin ? "ring-2 ring-red-500 bg-red-50 dark:bg-red-900/10" : ""}`}
                        autoComplete='off'
                    />
                    {validationErrors.customerKraPin && <span className="text-xs font-bold text-red-500 mt-1 block">{validationErrors.customerKraPin}</span>}
                </div>

                {/* Dates */}
                <div className="md:col-span-2 grid grid-cols-2 gap-6 mt-2 pt-6 border-t border-gray-100 dark:border-midnight-800">
                    <label className="block">
                        <span className="text-xs font-bold text-gray-400 ml-1 mb-1 block uppercase">Issued Date</span>
                        <div className="relative">
                            <FaCalendarAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input type="date" value={issuedDate} onChange={(e) => setIssuedDate(e.target.value)} className="w-full bg-gray-50 dark:bg-midnight-950 border-none pl-12 p-3 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 font-bold text-gray-700 dark:text-gray-300" />
                        </div>
                    </label>
                    <label className="block">
                        <span className="text-xs font-bold text-gray-400 ml-1 mb-1 block uppercase">
                            {activeDocumentType === 'quotation' ? 'Valid Until' : 'Due Date'}
                        </span>
                        <div className="relative">
                            <FaCalendarAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={`w-full bg-gray-50 dark:bg-midnight-950 border-none pl-12 p-3 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 font-bold text-gray-700 dark:text-gray-300 ${validationErrors.dueDate ? "ring-2 ring-red-500" : ""}`} />
                        </div>
                        {validationErrors.dueDate && <span className="text-xs font-bold text-red-500 mt-1 block">{validationErrors.dueDate}</span>}
                    </label>
                </div>
            </div>
        </div>
    );
};

export default InvoiceForm;
