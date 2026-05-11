import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadMultipleImages } from '../api';
import toast from 'react-hot-toast';

interface Props {
  value: string[]; // Array of URLs
  onChange: (urls: string[]) => void;
}

export default function MultiImageUploader({ value, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(f => f.type.startsWith('image/'));
    if (validFiles.length === 0) return toast.error('Only image files allowed');
    if (validFiles.length > 24) return toast.error('Max 24 images allowed');
    
    setUploading(true);
    try {
      const { urls } = await uploadMultipleImages(validFiles);
      onChange([...value, ...urls]);
      toast.success(`${urls.length} images uploaded`);
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
  };

  const removeImage = (index: number) => {
    const newVal = [...value];
    newVal.splice(index, 1);
    onChange(newVal);
  };

  return (
    <div className="multi-image-uploader" style={{ marginTop: 12 }}>
      <label style={{ fontSize: '10px', color: 'var(--t4)', textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>360° View Images ({value.length})</label>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', gap: 8, marginBottom: 8 }}>
        {value.map((url, i) => (
          <div key={i} style={{ position: 'relative', width: 60, height: 60, background: 'var(--ink-3)', border: '1px solid var(--line)' }}>
            <img src={url} alt={`img-${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <button 
              onClick={(e) => { e.stopPropagation(); removeImage(i); }}
              style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: '50%', background: 'var(--red)', color: '#fff', border: 'none', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >×</button>
          </div>
        ))}
        
        <motion.div
          className={`image-dropzone ${dragOver ? 'drag-over' : ''} ${uploading ? 'uploading' : ''}`}
          style={{ width: 60, height: 60, minHeight: 'auto', padding: 0 }}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          whileHover={{ borderColor: 'var(--red)' }}
        >
          {uploading ? (
            <div className="upload-spinner" style={{ width: 16, height: 16 }} />
          ) : (
            <span style={{ fontSize: '14px' }}>+</span>
          )}
        </motion.div>
      </div>
      
      <p className="dropzone-hint" style={{ fontSize: '9px', margin: 0 }}>
        Upload 8–24 photos from different angles for the 360 viewer.
      </p>

      <input ref={inputRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
        onChange={(e) => { if (e.target.files) handleFiles(e.target.files); e.target.value = ''; }} />
    </div>
  );
}
