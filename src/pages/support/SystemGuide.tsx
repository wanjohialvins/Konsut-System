import { useEffect, useState } from 'react';
import { SystemManualSkeleton } from "../../components/skeletons/PageSkeletons";
import ManualContent from "../../components/support/ManualContent";

const SystemGuide = () => {
    const [initializing, setInitializing] = useState(true);

    useEffect(() => {
        const t = setTimeout(() => setInitializing(false), 500);
        return () => clearTimeout(t);
    }, []);

    if (initializing) return <SystemManualSkeleton />;

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] p-6 animate-fade-in">
            <div className="flex-1 overflow-hidden rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-midnight-800">
                <ManualContent />
            </div>
        </div>
    );
};

export default SystemGuide;
