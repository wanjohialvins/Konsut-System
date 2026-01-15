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
                    <p>Welcome to the Konsut Invoice System. This platform is designed to streamline your business operations, from quoting to cash collection.</p>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-6 mb-2">Navigation</h3>
                    <p>The sidebar on the left gives you access to all modules. Hover over icons to see tooltips if collapsed (on mobile).</p>
                    <ul className="list-disc pl-5 space-y-2 mt-4">
                        <li><strong>Dashboard:</strong> Your command center with vital KPIs.</li>
                        <li><strong>Intelligence:</strong> Reports and analytics.</li>
                        <li><strong>Sales:</strong> Create invoices and manage clients.</li>
                    </ul>
                </GuideSection>

                <GuideSection title="Invoicing" icon={FiFileText}>
                    <p>The core of the system. Creating an invoice works in three steps:</p>
                    <ol className="list-decimal pl-5 space-y-2 mt-4">
                        <li><strong>Select Client:</strong> Choose from existing or create new.</li>
                        <li><strong>Add Items:</strong> Search inventory or add ad-hoc items.</li>
                        <li><strong>Finalize:</strong> Add tax, discounts, and save.</li>
                    </ol>
                    <div className="bg-brand-50 dark:bg-brand-900/10 p-4 rounded-xl mt-6 border border-brand-100 dark:border-brand-900/20">
                        <p className="text-sm text-brand-700 dark:text-brand-300"><strong>Pro Tip:</strong> You can convert a Quotation to an Invoice with one click in the Invoices list.</p>
                    </div>
                </GuideSection>

                <GuideSection title="Clients" icon={FiUsers}>
                    <p>Manage your customer relationships here. The CRM module allows you to track:</p>
                    <ul className="list-disc pl-5 space-y-2 mt-4">
                        <li>Contact details and shipping addresses.</li>
                        <li>Purchase history and lifetime value.</li>
                        <li>Outstanding balances.</li>
                    </ul>
                </GuideSection>

                <GuideSection title="Inventory" icon={FiBox}>
                    <p>Keep track of your products/services. Toggle "Track Stock" to enable strict inventory counting. If disabled, you can sell unlimited quantities (good for services).</p>
                </GuideSection>

                <GuideSection title="Settings" icon={FiSettings}>
                    <p>Configure your company profile, logo, and invoice terms here. Changes reflect immediately on all new PDF generations.</p>
                </GuideSection>
            </div>
        </div>
    );
};

export default SystemGuide;
