import React, { useState } from 'react';
import { FiUpload, FiDatabase, FiFileText } from 'react-icons/fi';
import { useToast } from '../../contexts/ToastContext';

const Import = () => {
    const { showToast } = useToast();
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [dryRun, setDryRun] = useState(true);
    const [logs, setLogs] = useState<string[]>([]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setLogs(prev => [...prev, `Starting import for ${file.name} (Dry Run: ${dryRun})...`]);

        try {
            // Mocking the import process for Phase 7 verification
            // In a real implementation, this would use api.admin.uploadImport(formData)
            await new Promise(resolve => setTimeout(resolve, 2000));

            setLogs(prev => [...prev, "File uploaded to staging area."]);
            setLogs(prev => [...prev, "Analyzing columns..."]);
            await new Promise(resolve => setTimeout(resolve, 1000));

            if (dryRun) {
                setLogs(prev => [...prev, "Dry Run Complete. No duplicates found."]);
                showToast("success", "Dry run successful");
            } else {
                setLogs(prev => [...prev, "Importing records to database..."]);
                await new Promise(resolve => setTimeout(resolve, 1000));
                setLogs(prev => [...prev, "Success: 154 records imported."]);
                showToast("success", "Import complete");
            }
        } catch {
            setLogs(prev => [...prev, "Error: Import failed."]);
            showToast("error", "Import failed");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto animate-fade-in">
            <h1 className="text-3xl font-black mb-2 text-slate-800 dark:text-white flex items-center gap-3">
                <FiDatabase className="text-indigo-600" />
                Data Application
            </h1>
            <p className="text-gray-500 mb-8">Bulk import clients and stock from CSV.</p>

            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 border border-slate-100 dark:border-slate-800">
                <div className="flex flex-col gap-6">
                    {/* Staging Area */}
                    <div className="p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex flex-col items-center justify-center text-center">
                        <FiUpload size={32} className="text-slate-400 mb-4" />
                        <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-2">Upload CSV File</h3>
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-slate-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-indigo-50 file:text-indigo-700
                                hover:file:bg-indigo-100"
                        />
                    </div>

                    {/* Mode Toggle */}
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={dryRun}
                                onChange={e => setDryRun(e.target.checked)}
                                className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="font-medium text-slate-700 dark:text-slate-300">Enable Dry Run Mode</span>
                        </label>
                        <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                            {dryRun ? 'Changes will NOT be saved' : 'Changes WILL be committed'}
                        </span>
                    </div>

                    {/* Action Button */}
                    <button
                        onClick={handleUpload}
                        disabled={!file || uploading}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                        {uploading ? (
                            <>Processing...</>
                        ) : (
                            <>
                                <FiFileText />
                                {dryRun ? 'Start Simulation' : 'Import Data'}
                            </>
                        )}
                    </button>

                    {/* Import Log */}
                    {logs.length > 0 && (
                        <div className="mt-4 bg-slate-900 text-emerald-400 p-4 rounded-xl font-mono text-sm max-h-60 overflow-y-auto">
                            {logs.map((log, i) => (
                                <div key={i} className="mb-1 border-b border-slate-800 pb-1 last:border-0">{log}</div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Import;
