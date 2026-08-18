import React, { useRef, useState } from 'react';
import { Camera, Check, Download, ExternalLink, FileText, Trash2, Upload, X } from 'lucide-react';
import {
  deleteSignedTerms,
  filesToPdf,
  getSignedTermsUrl,
  uploadSignedTerms,
  type SignedTermsRecord,
} from '../../lib/signedTerms';
import { useToast } from '../ui/ToastContainer';

interface SignedTermsDialogProps {
  invoiceNumber: string;
  customerName: string;
  existing?: SignedTermsRecord;
  onClose: () => void;
  /** Called after an upload or removal so the caller can refresh its list. */
  onChanged: () => void;
}

interface PendingPage {
  id: string;
  file: File;
  previewUrl: string;
}

const SignedTermsDialog: React.FC<SignedTermsDialogProps> = ({
  invoiceNumber,
  customerName,
  existing,
  onClose,
  onChanged,
}) => {
  const { showToast } = useToast();
  const [pages, setPages] = useState<PendingPage[]>([]);
  const [busy, setBusy] = useState(false);
  const cameraInput = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const addFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(event.target.files ?? []);
    setPages((prev) => [
      ...prev,
      ...picked.map((file) => ({
        id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
      })),
    ]);
    // Reset so picking the same file twice in a row still fires a change event.
    event.target.value = '';
  };

  const removePage = (id: string) => {
    setPages((prev) => {
      const page = prev.find((candidate) => candidate.id === id);
      if (page?.previewUrl) URL.revokeObjectURL(page.previewUrl);
      return prev.filter((candidate) => candidate.id !== id);
    });
  };

  const discardPages = () => {
    pages.forEach((page) => page.previewUrl && URL.revokeObjectURL(page.previewUrl));
    setPages([]);
  };

  const save = async () => {
    setBusy(true);
    try {
      const pdf = await filesToPdf(pages.map((page) => page.file));
      const uploaded = await uploadSignedTerms(invoiceNumber, pdf);

      if (!uploaded) {
        showToast('Could not save the signed terms. Please try again.', 'error');
        return;
      }

      showToast(`Signed terms saved for ${invoiceNumber}`, 'success');
      discardPages();
      onChanged();
      onClose();
    } catch (error) {
      console.error('Failed to build the signed terms PDF:', error);
      showToast(error instanceof Error ? error.message : 'Could not save the signed terms.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const open = async (mode: 'preview' | 'download') => {
    setBusy(true);
    const url = await getSignedTermsUrl(
      invoiceNumber,
      mode === 'download' ? `${invoiceNumber} - Signed Terms.pdf` : undefined,
    );
    setBusy(false);

    if (!url) {
      showToast('Could not open the signed terms. Please try again.', 'error');
      return;
    }

    if (mode === 'download') {
      const link = document.createElement('a');
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const remove = async () => {
    setBusy(true);
    const removed = await deleteSignedTerms(invoiceNumber);
    setBusy(false);

    if (!removed) {
      showToast('Could not remove the signed terms. Please try again.', 'error');
      return;
    }

    showToast(`Signed terms removed from ${invoiceNumber}`, 'success');
    onChanged();
    onClose();
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      <div className="w-full sm:max-w-lg bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-xl shadow-xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3 p-5 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Signed Terms</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {invoiceNumber}
              {customerName ? ` \u00B7 ${customerName}` : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 -m-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {existing && pages.length === 0 && (
            <div className="rounded-lg border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/40 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-green-800 dark:text-green-300">
                <Check className="w-4 h-4" />
                <span>Attached</span>
              </div>
              <p className="mt-1 text-xs text-green-700 dark:text-green-400">
                {existing.updatedAt
                  ? new Date(existing.updatedAt).toLocaleString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Stored'}
                {existing.size ? ` \u00B7 ${formatSize(existing.size)}` : ''}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => open('preview')}
                  disabled={busy}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  <ExternalLink className="w-4 h-4" />
                  View
                </button>
                <button
                  onClick={() => open('download')}
                  disabled={busy}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={remove}
                  disabled={busy}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove
                </button>
              </div>
            </div>
          )}

          {pages.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {pages.length === 1 ? '1 page ready' : `${pages.length} pages ready`}
              </p>
              <ul className="space-y-2">
                {pages.map((page, index) => (
                  <li
                    key={page.id}
                    className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 p-2"
                  >
                    {page.previewUrl ? (
                      <img
                        src={page.previewUrl}
                        alt={`Page ${index + 1}`}
                        className="w-12 h-16 object-cover rounded border border-gray-200 dark:border-gray-600"
                      />
                    ) : (
                      <div className="w-12 h-16 flex items-center justify-center rounded bg-gray-100 dark:bg-gray-700">
                        <FileText className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        Page {index + 1}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{page.file.name}</p>
                    </div>
                    <button
                      onClick={() => removePage(page.id)}
                      className="p-2 text-gray-400 hover:text-red-600"
                      title="Remove page"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => cameraInput.current?.click()}
              disabled={busy}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg btn-glass-red text-white font-semibold disabled:opacity-50"
            >
              <Camera className="w-5 h-5" />
              {pages.length > 0 ? 'Add another photo' : 'Take photo'}
            </button>
            <button
              onClick={() => fileInput.current?.click()}
              disabled={busy}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              <Upload className="w-5 h-5" />
              Choose file
            </button>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            Photos are combined into one PDF in the order added. For the cleanest result, use your
            phone's Files app to scan the pages first, then attach that PDF with Choose file.
          </p>

          <input
            ref={cameraInput}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            onChange={addFiles}
            className="hidden"
          />
          <input
            ref={fileInput}
            type="file"
            accept="application/pdf,image/*"
            multiple
            onChange={addFiles}
            className="hidden"
          />
        </div>

        <div className="flex items-center justify-between gap-3 p-5 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => {
              discardPages();
              onClose();
            }}
            className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={busy || pages.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg btn-glass-red text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                {existing ? 'Replace' : 'Save'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignedTermsDialog;
