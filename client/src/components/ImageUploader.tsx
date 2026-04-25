import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadImage } from '../api';
import toast from 'react-hot-toast';

interface Props {
  value: string;
  onChange: (url: string) => void;
}

export default function ImageUploader({ value, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return toast.error('Only image files allowed');
    if (file.size > 5 * 1024 * 1024) return toast.error('Max file size is 5MB');
    setUploading(true);
    try {
      const { url } = await uploadImage(file);
      onChange(url);
      toast.success('Image uploaded');
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="image-uploader">
      <AnimatePresence mode="wait">
        {value ? (
          <motion.div key="preview" className="image-preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <img src={value} alt="Product" className="image-preview-img" />
            <div className="image-preview-actions">
              <button className="image-change-btn" onClick={() => inputRef.current?.click()} disabled={uploading}>
                {uploading ? 'Uploading...' : 'Change'}
              </button>
              <button className="image-remove-btn" onClick={() => onChange('')}>Remove</button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="dropzone"
            className={`image-dropzone ${dragOver ? 'drag-over' : ''} ${uploading ? 'uploading' : ''}`}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            whileHover={{ borderColor: '#ff0000' }}
          >
            {uploading ? (
              <div className="upload-spinner" />
            ) : (
              <>
                <span className="dropzone-icon">📷</span>
                <p className="dropzone-text">Drop image here or <span>click to upload</span></p>
                <p className="dropzone-hint">JPG, PNG, WebP · max 5MB</p>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
    </div>
  );
}
