import React, { useRef, useState, useEffect } from 'react';
import { Toolbar } from './Toolbar';
import { LetterheadWorkspace } from './LetterheadWorkspace';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { PDFDocument } from 'pdf-lib';
import { Toast } from '../../components/Toast';
import { MergeManager } from './MergeManager';
import { SaveLetterDialog } from '../../components/SaveLetterDialog';
import { LetterListDialog } from '../../components/LetterListDialog';
import { ImageGalleryDialog } from './ImageGalleryDialog';
import { letterService } from '../../services/LetterService';
import { serializeCurrentLetter, loadLetterToLocalStorage } from '../../utils/letterSerializer';

export function EditorMode() {
  const [zoom, setZoom] = useState(1);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showMergeManager, setShowMergeManager] = useState(false);
  const [showImageGallery, setShowImageGallery] = useState(false);

  // Generic Action State used to communicate from Toolbar to Workspace
  const [action, setAction] = useState<{ type: string; payload?: any } | null>(null);

  // Margins in pixels (Default approx 25.4mm = 1 inch = 96px, adjusting to 96)
  const [margins, setMargins] = useState(() => {
    try {
      const saved = localStorage.getItem('tajmir_settings_margins');
      return saved ? JSON.parse(saved) : { top: 96, right: 96, bottom: 96, left: 96 };
    } catch (e) {
      return { top: 96, right: 96, bottom: 96, left: 96 };
    }
  });

  useEffect(() => {
    localStorage.setItem('tajmir_settings_margins', JSON.stringify(margins));
  }, [margins]);

  // Reference to the Workspace container
  const workspaceRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 3.0));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.2));
  const handleZoomReset = () => setZoom(1);
  const handleZoomFit = () => {
    const containerWidth = window.innerWidth;
    const fitScale = (containerWidth - 32) / 794;
    setZoom(Math.min(Math.max(fitScale, 0.2), 2.0));
  };

  useEffect(() => {
    if (window.innerWidth < 1024) {
      handleZoomFit();
    }
  }, []);

  const handleAddText = () => {
    setAction({ type: 'ADD_TEXT', payload: Date.now() });
    showToast("Text block added");
  };

  const handleAddImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setAction({ type: 'ADD_IMAGE', payload: e.target.result });
        showToast("Image added");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectGalleryImage = (src: string) => {
    setAction({ type: 'ADD_IMAGE', payload: src });
    showToast("Image added to page");
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  /**
   * Generates the Letterhead PDF in-memory (as ArrayBuffer)
   */
  const generateLetterheadPDF = async (): Promise<ArrayBuffer> => {
    if (!workspaceRef.current) throw new Error("No workspace");

    // 1. Temporarily reset zoom to 1 for accurate capture
    const originalZoom = zoom;
    setZoom(1);
    await new Promise(resolve => setTimeout(resolve, 300)); // Wait for reflow

    const pages = workspaceRef.current.querySelectorAll('[id^="page-"]');
    if (pages.length === 0) throw new Error("No pages found");

    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    for (let i = 0; i < pages.length; i++) {
      const pageEl = pages[i] as HTMLElement;

      // Capture canvas
      const canvas = await html2canvas(pageEl, {
        scale: 2, // Good balance of quality/speed
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        onclone: (clonedDoc) => {
          // Remove UI elements if any, though pages should be clean
          const uiElements = clonedDoc.querySelectorAll('.no-print');
          uiElements.forEach(el => el.remove());
        }
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.85);

      if (i > 0) pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    }

    // Restore Zoom
    setZoom(originalZoom);

    return pdf.output('arraybuffer');
  };

  const handleExportPDF = async () => {
    if (!workspaceRef.current) return;
    setIsProcessing(true);

    try {
      const pdfBuffer = await generateLetterheadPDF();

      // Convert to Blob and download
      const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'tajmir-group-document.pdf';
      link.click();
      URL.revokeObjectURL(url);

      showToast("PDF Downloaded successfully");
    } catch (err) {
      console.error(err);
      showToast("Failed to generate PDF");
      // Ensure zoom is restored if error happens mid-generation
      setZoom(prev => prev);
    } finally {
      setIsProcessing(false);
    }
  };

  const [pendingMergeFile, setPendingMergeFile] = useState<File | null>(null);

  // Triggered by Toolbar button (now opens manager)
  const openMergeManager = (file?: File) => {
    if (file) setPendingMergeFile(file);
    setShowMergeManager(true);
  };

  // The logic to actually merge
  const executeMerge = async (externalFiles: File[]) => {
    if (!workspaceRef.current) return;
    setIsProcessing(true);
    setShowMergeManager(false); // Close modal
    setPendingMergeFile(null); // Reset

    try {
      showToast("Generating letterhead...");
      const letterheadBuffer = await generateLetterheadPDF();

      showToast("Merging documents...");
      const pdfDoc = await PDFDocument.create();

      // Load Letterhead
      const letterheadPdf = await PDFDocument.load(letterheadBuffer);
      const letterheadPages = await pdfDoc.copyPages(letterheadPdf, letterheadPdf.getPageIndices());
      letterheadPages.forEach((page) => pdfDoc.addPage(page));

      // Load External PDFs in order
      for (const file of externalFiles) {
        const externalArrayBuffer = await file.arrayBuffer();
        const externalPdf = await PDFDocument.load(externalArrayBuffer);
        const externalPages = await pdfDoc.copyPages(externalPdf, externalPdf.getPageIndices());
        externalPages.forEach((page) => pdfDoc.addPage(page));
      }

      // Save
      const mergedPdfBytes = await pdfDoc.save();
      const blob = new Blob([mergedPdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `tajmir-merged-${Date.now()}.pdf`;
      link.click();
      URL.revokeObjectURL(url);

      showToast("Merged PDF Downloaded!");

    } catch (err) {
      console.error(err);
      showToast("Failed to merge PDF. Ensure inputs are valid.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyImage = async () => {
    if (!workspaceRef.current) return;
    setIsProcessing(true);
    const originalZoom = zoom;

    try {
      setZoom(1);
      await new Promise(resolve => setTimeout(resolve, 300));

      const firstPage = workspaceRef.current.querySelector('[id^="page-"]');
      if (!firstPage) throw new Error("No page found");

      const canvas = await html2canvas(firstPage as HTMLElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      canvas.toBlob((blob) => {
        if (!blob) throw new Error("Canvas is empty");
        const item = new ClipboardItem({ 'image/png': blob });
        navigator.clipboard.write([item]).then(() => {
          showToast("Copied Page 1 to clipboard!");
        }).catch(() => {
          showToast("Clipboard write failed (browser limitation)");
        });
      });
    } catch (err) {
      console.error(err);
      showToast("Failed to copy image");
    } finally {
      setZoom(originalZoom);
      setIsProcessing(false);
    }
  };

  const handleNewPage = () => {
    if (confirm("Are you sure? This will remove all text and images and reset the document.")) {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('tajmir_doc_')) {
          localStorage.removeItem(key);
        }
      });
      window.location.reload();
    }
  };

  // Max lines per page (default 29)
  const [maxLines, setMaxLines] = useState(29);

  // Save/Load Letter State
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLetterList, setShowLetterList] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedShareModal, setSavedShareModal] = useState<{ url: string; name: string; copied: boolean } | null>(null);

  const handleSaveLetter = async (letterName: string) => {
    setIsSaving(true);
    try {
      const letterData = serializeCurrentLetter(letterName);
      const saved = await letterService.saveLetter(letterData);

      const appUrl = (import.meta.env.VITE_APP_URL || window.location.origin).replace(/\/$/, '');
      const shareLink = `${appUrl}/view/${saved.letterId}`;

      setShowSaveDialog(false);
      navigator.clipboard.writeText(shareLink).catch(() => {});
      setSavedShareModal({
        url: shareLink,
        name: letterName,
        copied: true
      });
    } catch (err) {
      showToast('Failed to save letter. Make sure your Worker is deployed.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadLetter = async (letterId: string) => {
    try {
      const letter = await letterService.getLetter(letterId);
      loadLetterToLocalStorage(letter);
      setShowLetterList(false);
      window.location.reload(); // Reload to apply loaded data
    } catch (err) {
      showToast('Failed to load letter');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#333] overflow-hidden font-sans">
      <Toolbar
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomFit={handleZoomFit}
        onZoomReset={handleZoomReset}
        onExportPDF={handleExportPDF}
        onMergePDF={openMergeManager}
        onCopyImage={handleCopyImage}
        onNewPage={handleNewPage}
        onAddText={handleAddText}
        onAddImage={handleAddImage}
        onOpenImageModal={() => setShowImageGallery(true)}
        isProcessing={isProcessing}
        margins={margins}
        onSetMargins={setMargins}
        maxLines={maxLines}
        onSetMaxLines={setMaxLines}
        onSaveLetter={() => setShowSaveDialog(true)}
        onLetterList={() => setShowLetterList(true)}
      />

      <LetterheadWorkspace
        zoom={zoom}
        ref={workspaceRef}
        onSetZoom={setZoom}
        action={action}
        margins={margins}
        maxLines={maxLines}
      />

      {toastMsg && <Toast message={toastMsg} />}

      {showMergeManager && (
        <MergeManager
          initialFiles={pendingMergeFile ? [pendingMergeFile] : []}
          onClose={() => { setShowMergeManager(false); setPendingMergeFile(null); }}
          onMerge={executeMerge}
        />
      )}

      <ImageGalleryDialog
        isOpen={showImageGallery}
        onClose={() => setShowImageGallery(false)}
        onSelectImage={handleSelectGalleryImage}
      />

      <SaveLetterDialog
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        onSave={handleSaveLetter}
        isSaving={isSaving}
      />

      <LetterListDialog
        isOpen={showLetterList}
        onClose={() => setShowLetterList(false)}
        onLoad={handleLoadLetter}
      />

      {/* ================= WEB POPUP: SAVED LETTER SHARE LINK ================= */}
      {savedShareModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[10000] p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-emerald-100 text-emerald-700 rounded-lg text-base">🎉</span>
                <div>
                  <h3 className="text-base font-bold text-gray-800">Letter Saved Successfully</h3>
                  <p className="text-xs text-gray-500 truncate max-w-[240px]">{savedShareModal.name}</p>
                </div>
              </div>
              <button
                onClick={() => setSavedShareModal(null)}
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
                Shareable link copied to clipboard!
              </div>

              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-2">
                <input
                  type="text"
                  readOnly
                  value={savedShareModal.url}
                  className="bg-transparent border-none text-xs text-gray-700 flex-1 outline-none font-mono selection:bg-blue-100"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(savedShareModal.url);
                    setSavedShareModal({ ...savedShareModal, copied: true });
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-sm transition-colors flex items-center gap-1 flex-shrink-0"
                >
                  {savedShareModal.copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <a
                href={savedShareModal.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-1"
              >
                Open Link ↗
              </a>
              <button
                onClick={() => setSavedShareModal(null)}
                className="px-4 py-2 text-xs font-semibold text-white bg-gray-800 hover:bg-gray-900 rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}