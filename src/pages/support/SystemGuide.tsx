import { useState } from 'react';
import { FiBookOpen, FiFileText, FiUsers, FiBox, FiSettings, FiChevronRight } from 'react-icons/fi';

const GuideSection = ({ title, icon: Icon, children }: any) => (
    <div className="mb-12 scroll-mt-24" id={title.toLowerCase().replace(/\s+/g, '-')}>
        <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-brand-100 dark:bg-brand-900/20 text-brand-600 rounded-lg">
                <Icon size={24} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
        </div>
        <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-400">
            {children}
        </div>
    </div>
);

const SystemGuide = () => {
    const [activeSection, setActiveSection] = useState('getting-started');

    const scrollTo = (id: string) => {
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
            setActiveSection(id);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto animate-fade-in flex flex-col lg:flex-row gap-8">
            <div className="lg:w-64 shrink-0">
                <div className="sticky top-24 bg-white dark:bg-midnight-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-midnight-800">
                    <h3 className="font-black text-xs uppercase tracking-widest text-gray-400 mb-4 px-2">Contents</h3>
                    <nav className="space-y-1">
                        {[
                            { id: 'getting-started', label: 'Getting Started', icon: FiBookOpen },
                            { id: 'invoicing', label: 'Invoicing', icon: FiFileText },
                            { id: 'clients', label: 'Clients', icon: FiUsers },
                            { id: 'inventory', label: 'Inventory', icon: FiBox },
                            { id: 'settings', label: 'Settings', icon: FiSettings },
                        ].map((item) => (
                            <button
                                key={item.id}
                                onClick={() => scrollTo(item.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeSection === item.id
                                    ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-midnight-800'
                                    }`}
                            >
                                <item.icon size={16} />
                                {item.label}
                                {activeSection === item.id && <FiChevronRight className="ml-auto" />}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            <div className="flex-1 bg-white dark:bg-midnight-900 rounded-[2.5rem] p-8 lg:p-12 shadow-sm border border-gray-100 dark:border-midnight-800">
                <header className="mb-12 border-b border-gray-100 dark:border-midnight-800 pb-8">
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-4">User Manual</h1>
                    <p className="text-lg text-gray-500">Comprehensive documentation for the Konsut Invoice System.</p>
                </header>

                <GuideSection title="Getting Started" icon={FiBookOpen}>
                    <p>Welcome to the <strong>KONSUT Invoice System</strong>, a professional-grade business management suite designed for high-performance teams.</p>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-6 mb-2">Accessing the System</h3>
                    <ul className="list-disc pl-5 space-y-2 text-sm">
                        <li><strong>Login:</strong> Use your secure administrative credentials to access the portal.</li>
                        <li><strong>First Run:</strong> Navigate to <em>Settings &gt; Company Profile</em>. The system will auto-populate with defaults (KONSUT LTD). Verify your PIN and Address, then click <strong>Synchronize Identity</strong>.</li>
                        <li><strong>Command Palette:</strong> Press <code>Ctrl + K</code> anywhere to open the global search tool to jump between pages instantly.</li>
                    </ul>
                </GuideSection>

                <GuideSection title="Invoicing" icon={FiFileText}>
                    <p>The core engine (`/new-invoice`) unifies <strong>Quotations</strong>, <strong>Proforma Invoices</strong>, and <strong>Tax Invoices</strong> into one interface.</p>

                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-6 mb-2">Workflow</h3>
                    <ol className="list-decimal pl-5 space-y-2 text-sm">
                        <li><strong>Drafting:</strong> Select Document Type. Choose a client (or type a new one to auto-create). Add items from Products/Services inventory.</li>
                        <li><strong>Math & Tax:</strong> VAT (16%) is calculated automatically if enabled in Settings. Toggle currency between <strong>KES</strong> and <strong>USD</strong> instantly.</li>
                        <li><strong>Saving:</strong> Drafts auto-save to your device. Click <em>Save to Cloud</em> to persist the document to the database.</li>
                    </ol>

                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-6 mb-2">Advanced Features</h3>
                    <ul className="list-disc pl-5 space-y-2 text-sm">
                        <li><strong>One-Click Conversion:</strong> Convert a <em>Quotation</em> to an <em>Invoice</em> instantly. The system preserves the ID suffix (e.g., <code>QUO-001</code> becomes <code>INV-001</code>).</li>
                        <li><strong>PDF Generation:</strong> Generates high-resolution prints with your Logo, Bank Details, and QR Code.</li>
                        <li><strong>Legal:</strong> Toggle <em>Client Responsibilities</em> to add standard disclaimers about site access and permits.</li>
                    </ul>
                </GuideSection>

                <GuideSection title="Inventory" icon={FiBox}>
                    <p>Manage physical and intangible assets (`/stock/inventory`). The system tracks quantity, unit prices (USD/KES), and low-stock alerts.</p>

                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-6 mb-2">Capabilities</h3>
                    <ul className="list-disc pl-5 space-y-2 text-sm">
                        <li><strong>Categories:</strong> Products (Physical), Mobilization (Logistics), Services (Labor).</li>
                        <li><strong>Smart Tools:</strong>
                            <ul className="list-disc pl-5 mt-1 text-gray-500">
                                <li><em>Merge Duplicates:</em> Intelligently combines items with identical names.</li>
                                <li><em>Export CSV:</em> Download inventory for external backup.</li>
                            </ul>
                        </li>
                        <li><strong>Alerts:</strong> Items with quantity <strong>≤ 5</strong> are flagged red for reordering.</li>
                    </ul>
                </GuideSection>

                <GuideSection title="Clients" icon={FiUsers}>
                    <p>The CRM module (`/clients`) builds a profile for every customer automatically when you invoice them.</p>
                    <ul className="list-disc pl-5 space-y-2 text-sm mt-4">
                        <li><strong>Analysis:</strong> View "Lifetime Value" to see your top spending clients.</li>
                        <li><strong>Data:</strong> Stores KRA PIN, Email, Phone, and Physical Address.</li>
                        <li><strong>Search:</strong> Find clients instantly by any field.</li>
                    </ul>
                </GuideSection>

                <GuideSection title="Settings" icon={FiSettings}>
                    <p>Configure global logic at `/settings/system`. Changes here affect all future documents.</p>
                    <ul className="list-disc pl-5 space-y-2 text-sm mt-4">
                        <li><strong>Company Profile:</strong> Set your Legal Entity name and Logo.</li>
                        <li><strong>Financials:</strong> Set global VAT rate (16%) and USD Exchange Rate (Default: 130).</li>
                        <li><strong>System Health:</strong> Monitor database integrity and server status.</li>
                    </ul>
                    <div className="bg-brand-50 dark:bg-brand-900/10 p-4 rounded-xl mt-6 border border-brand-100 dark:border-brand-900/20">
                        <p className="text-sm text-brand-700 dark:text-brand-300"><strong>Data Security:</strong> Use the <em>Document Vault</em> to store sensitive contracts. Files are hashed and secured.</p>
                    </div>
                </GuideSection>
            </div>
        </div>
    );
};

export default SystemGuide;
