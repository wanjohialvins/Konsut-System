import { useState, useMemo } from 'react';
import { 
    FiBookOpen, FiFileText, FiPieChart, FiBox, FiCheckSquare, 
    FiShield, FiSettings, FiDatabase, FiLifeBuoy, FiChevronRight,
    FiCheckCircle, FiExternalLink, FiPlus, FiArrowRight, FiInfo,
    FiGrid, FiUsers, FiTruck, FiActivity, FiLock, FiSliders, FiUser, FiBriefcase,
    FiTerminal, FiAward, FiMessageSquare, FiBell, FiFolder
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from "../../hooks/usePermissions";
import { useAuth } from "../../contexts/AuthContext";

const StepItem = ({ number, title, children, link, badge }: any) => {
    const navigate = useNavigate();
    return (
        <div className="flex gap-4 mb-6 group animate-fade-in-right" style={{ animationDelay: `${number * 0.1}s` }}>
            <div className="w-8 h-8 shrink-0 bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 rounded-full flex items-center justify-center font-bold text-sm shadow-sm">
                {number}
            </div>
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <h4 className="font-bold text-gray-900 dark:text-white leading-none">{title}</h4>
                    {badge && (
                        <span className="px-2 py-0.5 bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 text-[10px] font-black uppercase tracking-tighter rounded border border-brand-100 dark:border-brand-900/50">
                            {badge}
                        </span>
                    )}
                    {link && (
                        <button 
                            onClick={() => navigate(link)}
                            className="bg-brand-500/10 hover:bg-brand-500/20 text-brand-600 dark:text-brand-400 px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-widest flex items-center gap-1 transition-all"
                        >
                            <FiArrowRight /> OPEN PAGE
                        </button>
                    )}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2 leading-relaxed">
                    {children}
                </div>
            </div>
        </div>
    );
};

const SubSection = ({ title, children, icon: Icon }: any) => (
    <div className="mt-10 mb-8 scroll-mt-20">
        <h3 className="text-xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-3 border-b border-gray-100 dark:border-midnight-800 pb-3">
            <div className="p-1.5 bg-gray-50 dark:bg-midnight-800 rounded-lg text-brand-500">
                {Icon ? <Icon size={18} /> : <FiChevronRight size={18} />}
            </div>
            {title}
        </h3>
        <div className="lg:pl-6 border-l-2 border-transparent lg:border-gray-50 lg:dark:border-midnight-800 transition-colors hover:border-brand-500/20">
            {children}
        </div>
    </div>
);

export default function ManualContent({ isModal = false, onClose }: { isModal?: boolean; onClose?: () => void }) {
    const { can, hasRole } = usePermissions();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('getting-started');

    const isAdmin = hasRole('admin') || hasRole('ceo');
    const canViewFinancials = can('/analytics') || isAdmin;

    const tabs = useMemo(() => {
        const items = [];
        items.push({ id: 'getting-started', label: 'Start', icon: FiBookOpen });

        if (canViewFinancials) {
            items.push({ id: 'intelligence', label: 'Intelligence', icon: FiPieChart });
        }
        if (can('/new-invoice') || can('/invoices') || can('/clients') || isAdmin) {
            items.push({ id: 'sales-operations', label: 'Sales & Ops', icon: FiFileText });
        }
        if (can('/stock/inventory') || can('/suppliers') || can('/documents') || isAdmin) {
            items.push({ id: 'resource-hub', label: 'Resources', icon: FiBox });
        }
        if (can('/tasks') || can('/memos') || can('/notifications') || isAdmin) {
            items.push({ id: 'team-tasks', label: 'Team', icon: FiCheckSquare });
        }
        if (isAdmin) {
            items.push({ id: 'governance', label: 'Governance', icon: FiShield });
            items.push({ id: 'configuration', label: 'Config', icon: FiSettings });
            items.push({ id: 'core-system', label: 'Core', icon: FiDatabase });
        }
        items.push({ id: 'support-center', label: 'Support', icon: FiLifeBuoy });

        return items;
    }, [can, hasRole, isAdmin, canViewFinancials]);

    const contentClasses = isModal 
        ? "flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10" 
        : "flex-1 bg-white dark:bg-midnight-900 rounded-[2rem] p-6 lg:p-12 shadow-sm border border-gray-100 dark:border-midnight-800 overflow-y-auto custom-scrollbar relative";

    return (
        <div className={`flex flex-col h-full bg-white dark:bg-midnight-900 ${isModal ? '' : 'animate-fade-in'}`}>
            <header className={`shrink-0 border-b border-gray-100 dark:border-midnight-800 ${isModal ? 'p-5 px-8 flex flex-col gap-4' : 'mb-8 pb-6'}`}>
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-brand-100 dark:bg-brand-900/30 text-brand-600 rounded-2xl shadow-inner">
                            <FiBookOpen size={window.innerWidth < 768 ? 20 : 28} />
                        </div>
                        <div>
                            <h1 className={`${isModal ? 'text-xl md:text-2xl' : 'text-3xl'} font-black text-gray-900 dark:text-white tracking-tight`}>
                                {isModal ? 'Quick Help Manual' : 'System Manual'}
                            </h1>
                            {!isModal && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                                    Step-by-step guidance tailored for <span className="text-brand-600 font-bold uppercase">{user?.role}</span>
                                </p>
                            )}
                        </div>
                    </div>
                    {isModal && onClose && (
                        <button 
                            onClick={onClose} 
                            className="w-10 h-10 flex items-center justify-center bg-gray-50 hover:bg-red-50 dark:bg-midnight-800 dark:hover:bg-red-900/20 rounded-full text-gray-400 hover:text-red-500 transition-all border border-gray-100 dark:border-midnight-700"
                        >
                            &times;
                        </button>
                    )}
                </div>

                <div className="flex gap-2 overflow-x-auto pb-4 pt-2 mask-linear-right custom-scrollbar">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                                    activeTab === tab.id
                                        ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20 scale-105 z-10'
                                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-midnight-800 border border-transparent hover:border-gray-100 dark:hover:border-midnight-700'
                                }`}
                            >
                                <Icon size={16} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </header>

            <div className={contentClasses}>
                
                {/* 1. GETTING STARTED */}
                {activeTab === 'getting-started' && (
                    <div className="animate-fade-in-up">
                        <div className="mb-8 p-6 bg-brand-50 dark:bg-brand-900/10 rounded-3xl border border-brand-100 dark:border-brand-900/20 flex gap-4">
                            <div className="p-3 bg-brand-600 text-white rounded-2xl h-fit shadow-lg"><FiInfo size={24} /></div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Dynamic Clearance Protocol</h2>
                                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                    This manual automatically hides sections that your current role (<span className="text-brand-600 font-bold">{user?.role}</span>) cannot access. 
                                    If something mentioned by a teammate is missing here, you likely need a role upgrade.
                                </p>
                            </div>
                        </div>

                        <SubSection title="Core Navigation" icon={FiGrid}>
                            <StepItem number="1" title="The Sidebar Flow">
                                <p>Modules are grouped by function. Clicking the top-left logo always returns you to the Dashboard.</p>
                            </StepItem>
                            <StepItem number="2" title="Command Center" link="/">
                                <p>On the home dashboard, your personal <strong>To-Do</strong> list and <strong>Recent Updates</strong> are prioritized.</p>
                            </StepItem>
                            <StepItem number="3" title="Theme Switching">
                                <p>Toggle between Light and Dark modes in the Topbar for optimal visual performance.</p>
                            </StepItem>
                            <StepItem number="4" title="System Status" badge="LIVE INDICATOR">
                                <p>Watch the pulse in the Topbar. A <span className="text-green-500">Green Pulsing Circle</span> indicates you are successfully connected to the cloud synchronization engine.</p>
                            </StepItem>
                        </SubSection>
                    </div>
                )}

                {/* 2. INTELLIGENCE */}
                {activeTab === 'intelligence' && canViewFinancials && (
                    <div className="animate-fade-in-up">
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6">Intelligence Suite</h2>
                        
                        <SubSection title="Command Center (/)" icon={FiGrid}>
                            <StepItem number="1" title="Revenue Overview" link="/">
                                <p>The top row of cards provides an instant summary of your Total Revenue, Active Invoices, and Total Users.</p>
                            </StepItem>
                            <StepItem number="2" title="Activity Tracking">
                                <p>The dashboard lists your most recent invoices and orders, allowing you to jump into any record directly from the landing page.</p>
                            </StepItem>
                        </SubSection>

                        <SubSection title="Deep Analytics" icon={FiPieChart}>
                            <StepItem number="3" title="Configuring the Timeframe" link="/analytics">
                                <p>Open Analytics. At the top right, select the <strong>Date Picker</strong>. This controls all charts on the page simultaneously.</p>
                            </StepItem>
                            <StepItem number="4" title="Reading Financial Pulse" badge="AI POWERED">
                                <p>Scroll past the revenue graphs to find the AI analysis. It calculates growth rates and provides specific business advice.</p>
                            </StepItem>
                            <StepItem number="5" title="Exporting the Dossier" badge="MODAL ACTION">
                                <p>Click <strong>Export Report</strong>. A popup will ask for options. This compiles all data into a PDF with your official logo.</p>
                            </StepItem>
                        </SubSection>
                    </div>
                )}

                {/* 3. SALES & OPS */}
                {activeTab === 'sales-operations' && (
                    <div className="animate-fade-in-up">
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6">Sales & Operations</h2>

                        <SubSection title="Document Generation Engine" icon={FiPlus}>
                            <StepItem number="1" title="Initiating a Quote/Invoice" link="/new-invoice">
                                <p>Go to <strong>Create Document</strong>. Select the radio button for the document type (Quotation, Proforma, or Tax Invoice).</p>
                            </StepItem>
                            <StepItem number="2" title="The Client Auto-Save CRM">
                                <p>Type a client name. If they aren't in the system, fill their details once. They will be saved permanently upon submission.</p>
                            </StepItem>
                            <StepItem number="3" title="Inventory Syncing" badge="MODAL POPUP">
                                <p>Instead of manual entry, click <strong>From Inventory</strong>. Search and select items from your real stock database to avoid errors.</p>
                            </StepItem>
                            <StepItem number="4" title="Line Item Reordering">
                                <p>Use the drag-handles on the left of each row to move items up or down. Click the trash icon to remove a row.</p>
                            </StepItem>
                            <StepItem number="5" title="Finalizing PDF Layout">
                                <p>Use the toggles for VAT (16%) and Bank Details. Click <strong>Save to Cloud</strong> to generate the definitive PDF.</p>
                            </StepItem>
                        </SubSection>

                        <SubSection title="Document Lifecycle Management" icon={FiFileText}>
                            <StepItem number="6" title="The High-Speed Edit" link="/invoices" badge="MODAL ACTION">
                                <p>On the Orders list, click the <strong>Pencil</strong> icon. A modal appears for instant edits to amounts, clients, or status without page reloads.</p>
                            </StepItem>
                            <StepItem number="7" title="One-Click Conversion">
                                <p>Click the <strong>Convert</strong> (Sync) icon on any Quote to instantly generate the corresponding Tax Invoice.</p>
                            </StepItem>
                            <StepItem number="8" title="PDF Live Stream">
                                <p>The eye icon launches a real-time PDF buffer. These are generated on-the-fly with the latest company branding and a security QR code.</p>
                            </StepItem>
                        </SubSection>

                        <SubSection title="Client CRM (/clients)" icon={FiUsers}>
                            <StepItem number="9" title="Managing Relationship Data" link="/clients">
                                <p>View every client automatically indexed by the system. Click on a row to see their total historical involvement and lifetime value.</p>
                            </StepItem>
                        </SubSection>
                    </div>
                )}

                {/* 4. RESOURCE HUB */}
                {activeTab === 'resource-hub' && (
                    <div className="animate-fade-in-up">
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6">Resource Hub</h2>

                        <SubSection title="Inventory & Stock" icon={FiBox}>
                            <StepItem number="1" title="Cataloging Items" link="/stock/inventory" badge="MODAL ACTION">
                                <p>Click <strong>Add Item</strong>. Assign a name, category, and minimum threshold. items below 5 units turn red.</p>
                            </StepItem>
                            <StepItem number="2" title="The Precision Merge Tool" badge="POPUP WIZARD">
                                <p>If you have duplicates, use the <strong>Merge Tools</strong> button. Select the record to keep and the one to delete; the system re-links all historical invoices to the correct ID.</p>
                            </StepItem>
                            <StepItem number="3" title="Bulk Import/Export">
                                <p>Use the Export button to download your entire stock list as a CSV for physical counting audits.</p>
                            </StepItem>
                        </SubSection>

                        <SubSection title="Supply Chain Management" icon={FiTruck}>
                            <StepItem number="4" title="Vendor Management" link="/suppliers">
                                <p>Keep a database of your reliable suppliers. Tag them with categories to quickly find who provides specific materials.</p>
                            </StepItem>
                        </SubSection>

                        <SubSection title="Secure Filestore" icon={FiFolder}>
                            <StepItem number="5" title="The Document Vault" link="/documents">
                                <p>Upload KRA pins, NDAs, or contracts. Files are stored in a non-public, authorized-only server directory.</p>
                            </StepItem>
                        </SubSection>
                    </div>
                )}

                {/* 5. TEAM & TASKS */}
                {activeTab === 'team-tasks' && (
                    <div className="animate-fade-in-up">
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6">Team & Tasks</h2>

                        <SubSection title="Collaborative Workspace" icon={FiCheckSquare}>
                            <StepItem number="1" title="Kanban Operations" link="/tasks">
                                <p>Drag task cards between columns. Move from <strong>To-Do</strong> to <strong>Completed</strong> to notify the supervisor.</p>
                            </StepItem>
                            <StepItem number="2" title="Assigning Benchmarks">
                                <p>Attach due dates and priority levels to tasks. High-priority tasks pulse in the task board to gain attention.</p>
                            </StepItem>
                        </SubSection>

                        <SubSection title="Internal Communications" icon={FiMessageSquare}>
                            <StepItem number="3" title="Priority Memos" link="/memos">
                                <p>Post updates. Marking them <strong>High Priority</strong> broadcasts them to the dashboard of every active team member.</p>
                            </StepItem>
                        </SubSection>

                        <SubSection title="System Notifications" icon={FiBell}>
                            <StepItem number="4" title="Real-time Alerts" link="/notifications">
                                <p>Review historical alerts. Clicking an alert row opens the relevant document or stock item instantly.</p>
                            </StepItem>
                        </SubSection>
                    </div>
                )}

                {/* 6. GOVERNANCE (ADMIN) */}
                {activeTab === 'governance' && isAdmin && (
                    <div className="animate-fade-in-up">
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6">Governance Layer</h2>

                        <SubSection title="User Orchestration" icon={FiUsers}>
                            <StepItem number="1" title="Access Control" link="/users">
                                <p>Create accounts and assign roles. Toggle the <strong>Active</strong> switch to instantly revoke system access.</p>
                            </StepItem>
                            <StepItem number="2" title="Impersonation Protocol" badge="MODAL ACTION">
                                <p>Click the <strong>Mask</strong> icon next to a staff member to see the system through their permissions level. Excellent for debugging.</p>
                            </StepItem>
                            <StepItem number="3" title="Security Force-Quit" badge="POPUP ACTION">
                                <p>The <strong>Eject</strong> icon kills all active sessions for a specific user ID instantly.</p>
                            </StepItem>
                        </SubSection>

                        <SubSection title="Security & Compliance" icon={FiShield}>
                            <StepItem number="4" title="The Audit Matrix" link="/audit-logs">
                                <p>Review immutable logs of every backend action, including IP addresses and precise timestamps.</p>
                            </StepItem>
                            <StepItem number="5" title="Accountability Dash" link="/accountability">
                                <p>Check individual performance metrics, login frequency, and document error rates for the entire staff.</p>
                            </StepItem>
                        </SubSection>

                        <SubSection title="System Engineering" icon={FiTerminal}>
                            <StepItem number="6" title="Admin Toolbox" link="/admin-toolbox">
                                <p>Execute heavy maintenance tasks like bulk-deleting notifications or performance optimization queries.</p>
                            </StepItem>
                        </SubSection>
                    </div>
                )}

                {/* 7. CONFIGURATION (ADMIN) */}
                {activeTab === 'configuration' && isAdmin && (
                    <div className="animate-fade-in-up">
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6">System Configuration</h2>

                        <SubSection title="Global Settings" icon={FiSettings}>
                            <StepItem number="1" title="Account Personalization" link="/settings/profile">
                                <p>Update your display name, secure password, and upload a profile picture for the global team feed.</p>
                            </StepItem>
                            <StepItem number="2" title="Brand Synthesis" link="/settings/company">
                                <p>Update your company name and address. Click <strong>Synchronize Identity</strong> to push changes to all PDF templates.</p>
                            </StepItem>
                            <StepItem number="3" title="Logo Injection">
                                <p>Click the upload zone. The app will swap your logo across the entire interface (sidebar, topbar) and PDFs without a refresh.</p>
                            </StepItem>
                            <StepItem number="4" title="Financial Engine" link="/settings/invoice">
                                <p>Set the master VAT rate and the global KES/USD exchange rate used by the invoicing engine.</p>
                            </StepItem>
                            <StepItem number="5" title="Interface Preferences" link="/settings/preferences">
                                <p>Toggle application density, animation speeds, and accent colors to match your workplace preference.</p>
                            </StepItem>
                        </SubSection>
                    </div>
                )}

                {/* 8. CORE SYSTEM (ADMIN) */}
                {activeTab === 'core-system' && isAdmin && (
                    <div className="animate-fade-in-up">
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6">Core Infrastructure</h2>

                        <SubSection title="Infrastructural Control" icon={FiDatabase}>
                            <StepItem number="1" title="Data Restoration" link="/system/data" badge="CRITICAL ACTION">
                                <p>Upload SQL dumps to restore the database. <strong>Caution:</strong> This overwrites all current data.</p>
                            </StepItem>
                            <StepItem number="2" title="System Reliability" link="/system/vitals">
                                <p>Verify backend server health, memory usage, and database connection latency.</p>
                            </StepItem>
                            <StepItem number="3" title="Emergency Lock-down" link="/system/security" badge="MASTER KILL SWITCH">
                                <p>The <strong>Global Logout</strong> button terminates every session in the entire database instantly.</p>
                            </StepItem>
                            <StepItem number="4" title="System Broadcast" link="/system/broadcast">
                                <p>Issue system-wide emergency alerts that appear as persistent banners to all logged-in staff.</p>
                            </StepItem>
                        </SubSection>
                    </div>
                )}

                {/* 9. SUPPORT */}
                {activeTab === 'support-center' && (
                    <div className="animate-fade-in-up">
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6">Support & Resources</h2>

                        <SubSection title="Help Center Overview" icon={FiLifeBuoy}>
                            <StepItem number="1" title="The Resource Library" link="/support">
                                <p>Access external documentation, video tutorials, and common FAQ answers provided by the IT team.</p>
                            </StepItem>
                            <StepItem number="2" title="Viewing this Manual">
                                <p>You are here! This manual can also be launched via the help icon in the topbar at any time.</p>
                            </StepItem>
                        </SubSection>
                        
                        <SubSection title="Development Liaison" icon={FiMessageSquare}>
                            <StepItem number="3" title="The Ticketing Flow" link="/tickets">
                                <p>Don't email bugs! Create a ticket here. You can chat with the dev team in a dedicated thread until the issue is solved.</p>
                            </StepItem>
                            <StepItem number="4" title="Requesting Features" link="/tickets/new">
                                <p>Submit a formal request for new functionality. Select the 'Feature Request' category to prioritize it for the next sprint.</p>
                            </StepItem>
                        </SubSection>
                    </div>
                )}
            </div>
            
            {!isModal && (
                <div className="p-8 shrink-0 border-t border-gray-100 dark:border-midnight-800 bg-gray-50/30 dark:bg-midnight-900/30">
                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em]">
                            Konsut Operating System &bull; Documentation Node v2.5.0
                        </p>
                        <div className="flex items-center gap-6">
                            <span className="text-[10px] text-brand-600 dark:text-brand-400 font-bold uppercase tracking-widest flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-pulse"></span>
                                Live Sync Active
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
