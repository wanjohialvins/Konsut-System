import { useState, useEffect, useMemo } from 'react';
import { 
    FiBookOpen, FiFileText, FiUsers, FiBox, FiSettings, 
    FiChevronRight, FiPieChart, FiGrid, FiTruck, FiFolder, 
    FiCheckSquare, FiMessageSquare, FiBell, FiShield, FiTerminal, 
    FiAward, FiUser, FiBriefcase, FiSliders, FiActivity, 
    FiDatabase, FiLock, FiLifeBuoy, FiPlus
} from 'react-icons/fi';
import { SystemManualSkeleton } from "../../components/skeletons/PageSkeletons";
import { usePermissions } from "../../hooks/usePermissions";
import { useAuth } from "../../contexts/AuthContext";

const GuideSection = ({ title, icon: Icon, children }: any) => (
    <div className="mb-12 scroll-mt-24" id={title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}>
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
    const { can, hasRole } = usePermissions();
    const { user } = useAuth();
    
    // Default the active section purely for visual state
    const [activeSection, setActiveSection] = useState('getting-started');
    const [initializing, setInitializing] = useState(true);

    // Simulate load
    useEffect(() => {
        const t = setTimeout(() => setInitializing(false), 600);
        return () => clearTimeout(t);
    }, []);

    // Build the dynamic navigation items mapped heavily to the Sidebar structure
    const navItems = useMemo(() => {
        const isAdmin = hasRole('admin') || hasRole('ceo');
        const canViewFinancials = can('/analytics') || isAdmin;
        const items = [];

        // Universal (Getting Started)
        items.push({ id: 'getting-started', label: 'Getting Started', icon: FiBookOpen });

        // Intelligence Category (Dashboard & Analytics)
        if (canViewFinancials) {
            items.push({ id: 'intelligence', label: 'Intelligence', icon: FiPieChart });
        }

        // Sales & Operations
        if (can('/new-invoice') || can('/invoices') || can('/clients') || isAdmin) {
            items.push({ id: 'sales-operations', label: 'Sales & Operations', icon: FiFileText });
        }

        // Resource Hub
        if (can('/stock/inventory') || can('/suppliers') || can('/documents') || isAdmin) {
            items.push({ id: 'resource-hub', label: 'Resource Hub', icon: FiBox });
        }

        // Team & Tasks
        if (can('/tasks') || can('/memos') || can('/notifications') || isAdmin) {
            items.push({ id: 'team-tasks', label: 'Team & Tasks', icon: FiCheckSquare });
        }

        // Governance (Admin Only)
        if (isAdmin) {
            items.push({ id: 'governance', label: 'Governance', icon: FiShield });
            items.push({ id: 'configuration', label: 'Configuration', icon: FiSettings });
            items.push({ id: 'core-intelligence', label: 'Core System', icon: FiDatabase });
        }

        // Resources & Support (Universal)
        items.push({ id: 'support-center', label: 'Support & Tickets', icon: FiLifeBuoy });

        return items;
    }, [can, hasRole]);

    if (initializing) return <SystemManualSkeleton />;

    const scrollTo = (id: string) => {
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
            setActiveSection(id);
        }
    };

    const isAdmin = hasRole('admin') || hasRole('ceo');
    const canViewFinancials = can('/analytics') || isAdmin;

    return (
        <div className="p-6 max-w-7xl mx-auto animate-fade-in flex flex-col lg:flex-row gap-8">
            <div className="lg:w-72 shrink-0">
                <div className="sticky top-24 bg-white dark:bg-midnight-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-midnight-800">
                    <h3 className="font-black text-xs uppercase tracking-widest text-gray-400 mb-4 px-2">Manual Sections</h3>
                    <nav className="space-y-1">
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => scrollTo(item.id)}
                                className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-sm font-medium transition-all ${activeSection === item.id
                                    ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 shadow-sm'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-midnight-800'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <item.icon size={18} className={activeSection === item.id ? 'text-brand-600' : 'text-gray-400'} />
                                    {item.label}
                                </div>
                                {activeSection === item.id && <FiChevronRight size={16} />}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            <div className="flex-1 bg-white dark:bg-midnight-900 rounded-[2.5rem] p-8 lg:p-12 shadow-sm border border-gray-100 dark:border-midnight-800 relative overflow-hidden">
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                <header className="mb-12 border-b border-gray-100 dark:border-midnight-800 pb-8 relative z-10">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-brand-100 dark:bg-brand-900/30 text-brand-600 rounded-2xl">
                            <FiBookOpen size={32} />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">System Manual</h1>
                            <p className="text-lg text-gray-500 dark:text-gray-400 font-medium">Personalized documentation based on your clearance level.</p>
                        </div>
                    </div>
                    
                    <div className="bg-brand-50 dark:bg-brand-900/10 border border-brand-100 dark:border-brand-900/20 rounded-2xl p-5 flex items-start gap-4">
                        <div className="p-2 bg-brand-600 text-white rounded-full shrink-0">
                            <FiCheckSquare size={16} />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 dark:text-white mb-1">Welcome, {user?.username}!</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                This manual explicitly adapts to your assigned role ({user?.role?.toUpperCase()}). 
                                If a section or page described here is not visible in your sidebar, it means your account does not have the required permissions.
                            </p>
                        </div>
                    </div>
                </header>

                <div className="relative z-10">
                    <GuideSection title="Getting Started" icon={FiBookOpen}>
                        <p>Welcome to the <strong>Konsut System</strong>, a professional-grade business management suite designed for high-performance teams.</p>
                        <ul className="list-disc pl-5 space-y-2 text-sm mt-4">
                            <li><strong>Navigation:</strong> The sidebar on your left provides access to all modules authorized for your role. Modals (like Quick Add or Quick Edit) can be triggered from within the active pages.</li>
                            <li><strong>Global Search:</strong> Press <code>Ctrl + K</code> anywhere to open the command palette to jump between pages instantly.</li>
                            <li><strong>Dark Mode:</strong> Switch application themes via your Account Settings or the global toggle.</li>
                        </ul>
                    </GuideSection>

                    {canViewFinancials && (
                        <GuideSection title="Intelligence" icon={FiPieChart}>
                            <p>The Intelligence suite encompasses your high-level overview and deep analytical insights.</p>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-6 mb-2">Command Center (/)</h3>
                            <ul className="list-disc pl-5 space-y-2 text-sm">
                                <li><strong>Overview:</strong> Provides daily snapshots of recent orders, client updates, and personal tasks.</li>
                                <li><strong>Widgets:</strong> View Unread Notifications and Active Projects directly from the home dashboard.</li>
                            </ul>
                            
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-6 mb-2">Financial Suite (/analytics)</h3>
                            <ul className="list-disc pl-5 space-y-2 text-sm">
                                <li><strong>Date Filters:</strong> Top right dropdown allows slicing data by 7 Days, 30 Days (Default), 90 Days, or Annually.</li>
                                <li><strong>Financial Pulse AI:</strong> Automatically scans transaction history to offer growth projections, market velocity indicators, and actionable advice below the main chart.</li>
                                <li><strong>Report Export Modal:</strong> Clicking "Export Report" opens a modal allowing you to generate a full-page PDF dossier summarizing the charts on-screen.</li>
                            </ul>
                        </GuideSection>
                    )}

                    {(can('/new-invoice') || can('/invoices') || can('/clients') || isAdmin) && (
                        <GuideSection title="Sales & Operations" icon={FiFileText}>
                            <p>This section drives revenue and maintains customer relationships.</p>

                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-6 mb-2">Create Document (/new-invoice)</h3>
                            <ul className="list-disc pl-5 space-y-2 text-sm">
                                <li><strong>Document Types:</strong> Select between Quotation, Proforma Invoice, or Tax Invoice at the top.</li>
                                <li><strong>Client Selection:</strong> Create a new client dynamically by typing their name, or select an existing one.</li>
                                <li><strong>Line Items Engine:</strong> Click "Add Blank Row" for completely distinct entries or "From Inventory" to open a modal syncing with Stock. Drag rows to reorder.</li>
                                <li><strong>Advanced Toggles:</strong> Include Bank Details, apply standard VAT (16%), or toggle the global currency between KES/USD before saving.</li>
                            </ul>

                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-6 mb-2">Orders & Sales (/invoices)</h3>
                            <ul className="list-disc pl-5 space-y-2 text-sm">
                                <li><strong>Conversion:</strong> In Quotations, click the 'Convert to Invoice' action to automatically generate a mirrored Tax Invoice, keeping the same numerical ID suffix.</li>
                                <li><strong>Quick Edit Modal:</strong> Click the pencil icon on any row to edit client info, update line items, or mark status (Paid/Overdue) without leaving the page.</li>
                                <li><strong>PDF Viewer Plugin:</strong> Clicking "View/Download" streams a live PDF buffer straight from the app's internal jsPDF engine using the global company branding.</li>
                            </ul>

                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-6 mb-2">Clients (/clients)</h3>
                            <p className="text-sm">Manage CRMs. The system auto-builds profiles every time an invoice is issued to a new client name.</p>
                        </GuideSection>
                    )}

                    {(can('/stock/inventory') || can('/suppliers') || can('/documents') || isAdmin) && (
                        <GuideSection title="Resource Hub" icon={FiBox}>
                            <p>The centralized control layer for physical goods, third-party logistics, and document compliance.</p>

                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-6 mb-2">Inventory Control (/stock/inventory)</h3>
                            <ul className="list-disc pl-5 space-y-2 text-sm">
                                <li><strong>Alerts & Status:</strong> Items hitting low thresholds (Quantity ≤ 5) emit visual alerts for reordering.</li>
                                <li><strong>Merge Tool Modal:</strong> Used to consolidate duplicate item entries cleanly across the database without breaking invoice bindings.</li>
                            </ul>

                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-6 mb-2">Vendors & Suppliers (/suppliers)</h3>
                            <p className="text-sm">Maintains active directories of external supply chains.</p>

                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-6 mb-2">Company Doc Vault (/documents)</h3>
                            <p className="text-sm">A highly secure filestore. Documents uploaded here are not publicly accessible and require explicit authorization. Used for storing NDAs, permits, and tax clearance forms.</p>
                        </GuideSection>
                    )}

                    {(can('/tasks') || can('/memos') || can('/notifications') || isAdmin) && (
                        <GuideSection title="Team & Tasks" icon={FiCheckSquare}>
                            <p>Facilitates internal dialogue and task dispatching operations.</p>
                            
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-6 mb-2">Team Task Board (/tasks)</h3>
                            <p className="text-sm mb-2">A Kanban-style project tracker. Drag and drop assignments between To-Do, In-Progress, and Completed columns. Clicking a task opens the <strong>Task Details Modal</strong>.</p>

                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-6 mb-2">Internal Communications (/memos)</h3>
                            <p className="text-sm mb-2">Broadcast company-wide text updates. Memos marked "High Priority" trigger system-wide push notifications to active sessions.</p>

                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-6 mb-2">Notifications (/notifications)</h3>
                            <p className="text-sm font-mono text-brand-600 bg-brand-50 inline-block px-2 py-1 rounded">Interactive Feature</p>
                            <p className="text-sm mt-1">Review triggered system alerts. You can execute quick actions directly from a notification (e.g., clicking a Low Stock notification auto-opens the Inventory view).</p>
                        </GuideSection>
                    )}

                    {isAdmin && (
                        <GuideSection title="Governance" icon={FiShield}>
                            <p className="text-red-500 font-bold text-sm uppercase mb-4 tracking-widest bg-red-50 inline-block px-3 py-1 rounded-full border border-red-100">Administrator Only Level</p>
                            
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">User Management (/users)</h3>
                            <ul className="list-disc pl-5 space-y-2 text-sm">
                                <li><strong>Access Control:</strong> Invite staff and designate strict roles (Viewer, Storekeeper, Exec, etc).</li>
                                <li><strong>Impersonation Modal:</strong> Allows Admins to securely 'Log In As' another target user to debug UI issues or force logout stale sessions.</li>
                            </ul>

                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-6 mb-2">Security Audit Tracker (/audit-logs)</h3>
                            <p className="text-sm mb-2">Immutable logging. Tracks every backend fetch, edit, or delete with IP Address marking and localized timestamps.</p>
                            
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-6 mb-2">Admin Toolbox & Accountability</h3>
                            <p className="text-sm">Raw execution layers for bulk data wiping, performance auditing, and viewing deep activity matrices for HR evaluations.</p>
                        </GuideSection>
                    )}

                    {isAdmin && (
                        <GuideSection title="Configuration" icon={FiSettings}>
                            <p className="text-red-500 font-bold text-sm uppercase mb-4 tracking-widest bg-red-50 inline-block px-3 py-1 rounded-full border border-red-100">Administrator Only Level</p>
                            
                            <p className="text-sm mb-4">Centralized control panels representing the `settings` database table. Any changes here propagate universally.</p>
                            <ul className="list-disc pl-5 space-y-2 text-sm">
                                <li><strong>Company Profile:</strong> Upload your official logo. The system uses advanced context streaming to dynamically update the Sidebar and PDF Generator instantaneously.</li>
                                <li><strong>Invoice Engine:</strong> Tweak PDF metadata grids, footer disclaimers, or layout parameters globally.</li>
                                <li><strong>Preferences:</strong> Personalize the application theme, density, and animation speeds.</li>
                            </ul>
                        </GuideSection>
                    )}

                    {isAdmin && (
                        <GuideSection title="Core System" icon={FiDatabase}>
                            <p className="text-red-500 font-bold text-sm uppercase mb-4 tracking-widest bg-red-50 inline-block px-3 py-1 rounded-full border border-red-100">Administrator / CEO Level</p>
                            
                            <p className="text-sm mb-4">Deep infrastructural access.</p>
                            <ul className="list-disc pl-5 space-y-2 text-sm">
                                <li><strong>System Vitals (/system/vitals):</strong> Live server load parameters and runtime environmental variables diagnostics.</li>
                                <li><strong>Data Core (/system/data):</strong> Used exclusively to trigger MySQL Dumps for system backups or database restoration via emergency SQL uploads.</li>
                                <li><strong>Security Protocols:</strong> Triggers the Global Logout 'Kill Switch', throwing all other sessions off the platform instantly in emergency scenarios.</li>
                            </ul>
                        </GuideSection>
                    )}
                    
                    <GuideSection title="Support & Tickets" icon={FiLifeBuoy}>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-6 mb-2">Help Center (/support)</h3>
                        <p className="text-sm mb-4">Access rapid FAQs, developer documentation links, and contact points for the IT implementation team.</p>
                        
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-6 mb-2">Ticket Support (/tickets)</h3>
                        <p className="text-sm mb-2">Instead of raw email, if you encounter bugs or want to request features, create a structured internal Ticket. The Development Team reads these queues to issue rapid fixes directly onto the server without pulling down operations.</p>
                    </GuideSection>

                </div>
            </div>
        </div>
    );
};

export default SystemGuide;
