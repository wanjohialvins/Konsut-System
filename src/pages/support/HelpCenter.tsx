import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { FiSearch, FiBook, FiMessageCircle, FiChevronRight, FiHelpCircle } from 'react-icons/fi';

const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border border-gray-100 dark:border-midnight-800 rounded-2xl overflow-hidden transition-all duration-200">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-5 text-left bg-white dark:bg-midnight-900 hover:bg-gray-50 dark:hover:bg-midnight-800 transition-colors"
            >
                <span className="font-bold text-gray-900 dark:text-white">{question}</span>
                <FiChevronRight className={`transition-transform text-gray-400 ${isOpen ? 'rotate-90' : ''}`} />
            </button>
            {isOpen && (
                <div className="p-5 bg-gray-50 dark:bg-midnight-950 border-t border-gray-100 dark:border-midnight-800 text-gray-600 dark:text-gray-400 leading-relaxed text-sm">
                    {answer}
                </div>
            )}
        </div>
    );
};

const HelpCenter = () => {
    const [search, setSearch] = useState("");

    const faqs = [
        { q: "How do I create a new invoice?", a: "Navigate to 'Create New' in the sidebar or from the Dashboard quick actions. Select a client, add items, and click Finalize to generate the PDF." },
        { q: "Can I edit an invoice after saving?", a: "Yes. Go to the Invoices list, click 'Edit' on the invoice row. Note that changing a finalized invoice might affect tax reports." },
        { q: "How do I add my company logo?", a: "Go to Settings > Company Profile. You can upload your logo there, which will appear on all generated PDFs." },
        { q: "What happens if I delete a client?", a: "Deleting a client is soft-restricted if they have active invoices to preserve financial integrity. Archive them instead." },
        { q: "Is my data backed up?", a: "Yes, if you use the System Control 'Backup' feature, you can download a full JSON manifest of your data." },
    ];

    const filteredFaqs = faqs.filter(f =>
        f.q.toLowerCase().includes(search.toLowerCase()) ||
        f.a.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-6 max-w-6xl mx-auto animate-fade-in space-y-12">
            <div className="text-center py-12">
                <h1 className="text-5xl font-black text-gray-900 dark:text-white mb-6 tracking-tight">How can we help?</h1>
                <div className="relative max-w-2xl mx-auto">
                    <FiSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search for answers..."
                        className="w-full pl-14 pr-6 py-5 rounded-[2rem] shadow-2xl shadow-indigo-100 dark:shadow-none bg-white dark:bg-midnight-900 border-2 border-transparent focus:border-indigo-500 text-lg font-medium outline-none transition-all dark:text-white"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <NavLink to="/support/guide" className="group p-8 bg-indigo-600 rounded-[2.5rem] text-white relative overflow-hidden shadow-xl shadow-indigo-600/20 hover:scale-[1.02] transition-transform">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="relative z-10">
                        <div className="p-4 bg-white/10 w-fit rounded-2xl mb-6 backdrop-blur-sm">
                            <FiBook size={32} />
                        </div>
                        <h3 className="text-2xl font-black mb-2">User Guide</h3>
                        <p className="text-indigo-100 font-medium mb-6">Read the full documentation on system capabilities.</p>
                        <span className="inline-flex items-center gap-2 font-bold uppercase tracking-widest text-xs bg-white text-indigo-600 px-4 py-2 rounded-xl">Read Docs <FiChevronRight /></span>
                    </div>
                </NavLink>

                <NavLink to="/support/contact" className="group p-8 bg-white dark:bg-midnight-900 border border-gray-100 dark:border-midnight-800 rounded-[2.5rem] relative overflow-hidden shadow-xl hover:scale-[1.02] transition-transform">
                    <div className="relative z-10 h-full flex flex-col items-start">
                        <div className="p-4 bg-gray-100 dark:bg-midnight-800 w-fit rounded-2xl mb-6 text-gray-600 dark:text-gray-300">
                            <FiMessageCircle size={32} />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Contact Support</h3>
                        <p className="text-gray-500 font-medium mb-6">Facing a technical issue? Submit a ticket to the admin team.</p>
                        <span className="mt-auto inline-flex items-center gap-2 font-bold uppercase tracking-widest text-xs bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2 rounded-xl">Open Ticket <FiChevronRight /></span>
                    </div>
                </NavLink>
            </div>

            <div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                    <FiHelpCircle className="text-indigo-500" />
                    Frequently Asked Questions
                </h2>
                <div className="space-y-4">
                    {filteredFaqs.map((faq, i) => (
                        <FAQItem key={i} question={faq.q} answer={faq.a} />
                    ))}
                    {filteredFaqs.length === 0 && (
                        <div className="p-8 text-center text-gray-400">
                            No results found for "{search}"
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HelpCenter;
