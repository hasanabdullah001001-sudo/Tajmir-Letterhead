import React, { useState, useEffect } from 'react';
import { letterService, LetterListItem } from '../services/LetterService';

interface LetterListDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onLoad: (letterId: string) => void;
}

export const LetterListDialog: React.FC<LetterListDialogProps> = ({
    isOpen,
    onClose,
    onLoad
}) => {
    const [letters, setLetters] = useState<LetterListItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Delete Confirmation Modal State
    const [letterToDelete, setLetterToDelete] = useState<{ id: string; name: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    // Share Link Modal State
    const [shareModal, setShareModal] = useState<{ url: string; name: string; copied: boolean } | null>(null);

    useEffect(() => {
        if (isOpen) {
            loadLetters();
        }
    }, [isOpen]);

    const loadLetters = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await letterService.listLetters();
            setLetters(data.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
        } catch (err) {
            setError('Failed to load letters. Make sure your Worker is deployed.');
        } finally {
            setLoading(false);
        }
    };

    const openDeleteConfirm = (id: string, name: string) => {
        setDeleteError(null);
        setLetterToDelete({ id, name });
    };

    const confirmDelete = async () => {
        if (!letterToDelete) return;
        setIsDeleting(true);
        setDeleteError(null);
        try {
            await letterService.deleteLetter(letterToDelete.id);
            setLetters(letters.filter(l => l.id !== letterToDelete.id));
            setLetterToDelete(null);
        } catch (err) {
            setDeleteError('Failed to delete letter. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    const copyShareLink = (id: string, name: string) => {
        const appUrl = (import.meta.env.VITE_APP_URL || window.location.origin).replace(/\/$/, '');
        const link = `${appUrl}/view/${id}`;
        navigator.clipboard.writeText(link).catch(() => {});
        setShareModal({
            url: link,
            name: name,
            copied: true,
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[80vh] flex flex-col relative">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Saved Letters</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                    >
                        ×
                    </button>
                </div>

                {loading && (
                    <div className="text-center py-8 text-gray-600">Loading...</div>
                )}

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                {!loading && !error && letters.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        No saved letters yet. Create your first letter!
                    </div>
                )}

                {!loading && !error && letters.length > 0 && (
                    <div className="overflow-y-auto flex-1">
                        <table className="w-full">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Name</th>
                                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Updated</th>
                                    <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {letters.map((letter) => (
                                    <tr key={letter.id} className="border-t hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => onLoad(letter.id)}
                                                className="text-blue-600 hover:text-blue-800 font-medium text-left"
                                            >
                                                {letter.name}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {new Date(letter.updatedAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={() => copyShareLink(letter.id, letter.name)}
                                                className="text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-md text-xs font-semibold mr-2 transition-colors inline-flex items-center gap-1"
                                                title="Copy shareable link"
                                            >
                                                <span>📋</span> Link
                                            </button>
                                            <button
                                                onClick={() => openDeleteConfirm(letter.id, letter.name)}
                                                className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1.5 rounded-md transition-colors"
                                                title="Delete"
                                            >
                                                🗑️
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="mt-4 pt-4 border-t">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 w-full"
                    >
                        Close
                    </button>
                </div>

                {/* ================= WEB POPUP: SHARE LINK ================= */}
                {shareModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[10000] p-4">
                        <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md border border-gray-100">
                            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                                <div className="flex items-center gap-2">
                                    <span className="p-2 bg-emerald-100 text-emerald-700 rounded-lg text-base">🔗</span>
                                    <div>
                                        <h3 className="text-base font-bold text-gray-800">Shareable Letter Link</h3>
                                        <p className="text-xs text-gray-500 truncate max-w-[240px]">{shareModal.name}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShareModal(null)}
                                    className="text-gray-400 hover:text-gray-600 text-xl font-bold w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100"
                                >
                                    &times;
                                </button>
                            </div>

                            <div className="my-4">
                                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-2 rounded-lg text-xs font-medium mb-3">
                                    <svg className="w-4 h-4 text-emerald-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    Link copied to clipboard!
                                </div>

                                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-2">
                                    <input
                                        type="text"
                                        readOnly
                                        value={shareModal.url}
                                        className="bg-transparent border-none text-xs text-gray-700 flex-1 outline-none font-mono selection:bg-blue-100"
                                        onClick={(e) => (e.target as HTMLInputElement).select()}
                                    />
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(shareModal.url);
                                            setShareModal({ ...shareModal, copied: true });
                                        }}
                                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-sm transition-colors flex items-center gap-1 flex-shrink-0"
                                    >
                                        {shareModal.copied ? '✓ Copied' : 'Copy'}
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                                <a
                                    href={shareModal.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-1"
                                >
                                    Open Link ↗
                                </a>
                                <button
                                    onClick={() => setShareModal(null)}
                                    className="px-4 py-2 text-xs font-semibold text-white bg-gray-800 hover:bg-gray-900 rounded-lg transition-colors"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ================= WEB POPUP: DELETE CONFIRMATION ================= */}
                {letterToDelete && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[10000] p-4">
                        <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm border border-gray-100 text-center">
                            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                </svg>
                            </div>

                            <h3 className="text-lg font-bold text-gray-900 mb-1">Delete Letter</h3>
                            <p className="text-sm text-gray-500 mb-4">
                                Are you sure you want to delete <span className="font-semibold text-gray-800">"{letterToDelete.name}"</span>? This action cannot be undone.
                            </p>

                            {deleteError && (
                                <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg mb-4 text-left">
                                    {deleteError}
                                </div>
                            )}

                            <div className="flex gap-2">
                                <button
                                    onClick={() => { setLetterToDelete(null); setDeleteError(null); }}
                                    disabled={isDeleting}
                                    className="flex-1 px-4 py-2.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    disabled={isDeleting}
                                    className="flex-1 px-4 py-2.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                                >
                                    {isDeleting ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
