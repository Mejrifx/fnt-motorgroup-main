import React, { useRef, useState } from 'react';
import { Camera, ChevronLeft, ChevronRight, Clock, Images, Upload, X } from 'lucide-react';
import { prepareProofPhoto } from '../../lib/proofPhotos';
import { MAX_PROOF_PHOTOS } from '../../lib/pdf/proofOfWork';
import { useToast } from '../ui/ToastContainer';

/** A photo held in the form, whether just picked or loaded from a saved invoice. */
export interface EditableProofPhoto {
  id: string;
  bytes: Uint8Array;
  caption: string;
  /** Capture time from the photo's own metadata, when it carried one. */
  takenAt?: string;
  previewUrl: string;
}

interface ProofOfWorkPhotosProps {
  photos: EditableProofPhoto[];
  onChange: (photos: EditableProofPhoto[]) => void;
  /** Descriptions from the work table, offered as captions. */
  captionSuggestions: string[];
  disabled?: boolean;
}

const CAPTION_LIST_ID = 'proof-caption-suggestions';

function formatTakenAt(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const ProofOfWorkPhotos: React.FC<ProofOfWorkPhotosProps> = ({
  photos,
  onChange,
  captionSuggestions,
  disabled,
}) => {
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);
  const cameraInput = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const addFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (picked.length === 0) return;

    const room = MAX_PROOF_PHOTOS - photos.length;
    if (room <= 0) {
      showToast(`A proof of work can hold up to ${MAX_PROOF_PHOTOS} photos.`, 'error');
      return;
    }
    if (picked.length > room) {
      showToast(`Only the first ${room} of those were added \u2014 the limit is ${MAX_PROOF_PHOTOS}.`, 'info');
    }

    setBusy(true);
    const added: EditableProofPhoto[] = [];

    for (const file of picked.slice(0, room)) {
      try {
        const { bytes, takenAt } = await prepareProofPhoto(file);
        added.push({
          id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
          bytes,
          caption: '',
          takenAt,
          previewUrl: URL.createObjectURL(
            new Blob([bytes as unknown as BlobPart], { type: 'image/jpeg' }),
          ),
        });
      } catch (error) {
        console.error('Could not read the picked photo:', error);
        // Most often a HEIC from an iPhone in a browser that cannot decode it.
        showToast(`Could not read "${file.name}". Try a JPEG instead.`, 'error');
      }
    }

    setBusy(false);
    if (added.length) onChange([...photos, ...added]);
  };

  const update = (id: string, caption: string) => {
    onChange(photos.map((photo) => (photo.id === id ? { ...photo, caption } : photo)));
  };

  const remove = (id: string) => {
    const photo = photos.find((candidate) => candidate.id === id);
    if (photo) URL.revokeObjectURL(photo.previewUrl);
    onChange(photos.filter((candidate) => candidate.id !== id));
  };

  const move = (index: number, by: number) => {
    const target = index + by;
    if (target < 0 || target >= photos.length) return;
    const reordered = [...photos];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    onChange(reordered);
  };

  const suggestions = Array.from(new Set(captionSuggestions.map((value) => value.trim()).filter(Boolean)));

  return (
    <div className="space-y-4">
      {photos.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 p-8 text-center">
          <Images className="w-8 h-8 mx-auto text-gray-400" />
          <p className="mt-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
            No photos added yet
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Add the photos you took during the job. They appear on their own page after the invoice,
            in the order shown here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800"
            >
              <div className="relative bg-gray-100 dark:bg-gray-900">
                <img
                  src={photo.previewUrl}
                  alt={photo.caption || `Photo ${index + 1}`}
                  className="w-full h-40 object-contain"
                />
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-fnt-red text-white text-xs font-bold">
                  {`${index + 1}`.padStart(2, '0')}
                </span>
                <button
                  type="button"
                  onClick={() => remove(photo.id)}
                  disabled={disabled}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 disabled:opacity-50"
                  title="Remove photo"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-3 space-y-2">
                <input
                  type="text"
                  value={photo.caption}
                  onChange={(event) => update(photo.id, event.target.value)}
                  list={CAPTION_LIST_ID}
                  maxLength={70}
                  disabled={disabled}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-fnt-red focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="What this photo shows"
                />
                <div className="flex items-center justify-between gap-2">
                  <p className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 min-w-0">
                    {photo.takenAt ? (
                      <>
                        <Clock className="w-3 h-3 shrink-0" />
                        <span className="truncate">{formatTakenAt(photo.takenAt)}</span>
                      </>
                    ) : (
                      <span className="truncate">No capture time</span>
                    )}
                  </p>
                  <div className="flex items-center shrink-0">
                    <button
                      type="button"
                      onClick={() => move(index, -1)}
                      disabled={disabled || index === 0}
                      className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-30"
                      title="Move earlier"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(index, 1)}
                      disabled={disabled || index === photos.length - 1}
                      className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-30"
                      title="Move later"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <datalist id={CAPTION_LIST_ID}>
        {suggestions.map((suggestion) => (
          <option key={suggestion} value={suggestion} />
        ))}
      </datalist>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          disabled={disabled || busy || photos.length >= MAX_PROOF_PHOTOS}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg btn-glass-red text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              Reading photos...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              {photos.length ? 'Add more photos' : 'Add photos'}
            </>
          )}
        </button>
        <button
          type="button"
          onClick={() => cameraInput.current?.click()}
          disabled={disabled || busy || photos.length >= MAX_PROOF_PHOTOS}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
        >
          <Camera className="w-4 h-4" />
          Take photo
        </button>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {photos.length} of {MAX_PROOF_PHOTOS} &middot; four per page
        </p>
      </div>

      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        multiple
        onChange={addFiles}
        className="hidden"
      />
      <input
        ref={cameraInput}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={addFiles}
        className="hidden"
      />
    </div>
  );
};

export default ProofOfWorkPhotos;
