import { motion, AnimatePresence } from 'framer-motion';
import ManualContent from './ManualContent';

interface SystemManualModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SystemManualModal({ isOpen, onClose }: SystemManualModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-4 md:inset-10 lg:inset-20 bg-white dark:bg-midnight-900 z-[101] rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 flex flex-col"
                    >
                        <ManualContent isModal onClose={onClose} />
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
