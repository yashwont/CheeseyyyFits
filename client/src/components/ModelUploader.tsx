import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadImage } from '../api';
import toast from 'react-hot-toast';

interface Props {
  value: string;
  onChange: (url: string) => void;
}

export default function ModelUploader({ value, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    const is3D = file.name.endsWith('.glb') || file.name.endsWith('.gltf');
    if (!is3D) return toast.error('Only .glb or .gltf files allowed');
    if (file.size > 20 * 1024 * 1024) return toast.error('Max file size is 20MB');
    
    setUploading(true);
    try {
      // Re-using uploadImage API as it accepts any file and returns the path
      const { url } = await uploadImage(file);
      onChange(url);
      toast.success('3D Model uploaded');
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
    <div className="image-uploader" style={{ marginTop: 12 }}>
      <label style={{ fontSize: '10px', color: 'var(--t4)', textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>3D Model (.glb)</label>
      <AnimatePresence mode="wait">
        {value ? (
          <motion.div key="preview" className="image-preview" style={{ height: 60 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ flex: 1, fontSize: '11px', color: 'var(--green)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingLeft: 12 }}>
              ✓ {value.split('/').pop()}
            </div>
            <div className="image-preview-actions">
              <button className="image-change-btn" onClick={() => inputRef.current?.click()} disabled={uploading}>
                {uploading ? '...' : 'Change'}
              </button>
              <button className="image-remove-btn" onClick={() => onChange('')}>Remove</button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="dropzone"
            className={`image-dropzone ${dragOver ? 'drag-over' : ''} ${uploading ? 'uploading' : ''}`}
            style={{ height: 60, minHeight: 'auto' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            whileHover={{ borderColor: 'var(--red)' }}
          >
            {uploading ? (
              <div className="upload-spinner" style={{ width: 20, height: 20 }} />
            ) : (
              <p className="dropzone-text" style={{ fontSize: '11px' }}>Drop .glb here or <span>upload 3D</span></p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <input ref={inputRef} type="file" accept=".glb,.gltf" style={{ display: 'none' }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
    </div>
  );
}
