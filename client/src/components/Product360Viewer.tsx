import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface Props {
  images: string[] | string; // Can be JSON string or array
  onClose: () => void;
  productName: string;
}

export default function Product360Viewer({ images, onClose, productName }: Props) {
  const [imageList, setImageList] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startIndex = useRef(0);

  useEffect(() => {
    let list: string[] = [];
    try {
      if (typeof images === 'string') list = JSON.parse(images);
      else if (Array.isArray(images)) list = images;
    } catch { list = []; }
    
    if (list.length > 0) {
      setImageList(list);
      // Preload images
      let loaded = 0;
      list.forEach(src => {
        const img = new Image();
        img.src = src;
        img.onload = () => {
          loaded++;
          if (loaded === list.length) setLoading(false);
        };
      });
    } else {
      setLoading(false);
    }
  }, [images]);

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    isDragging.current = true;
    startX.current = 'touches' in e ? e.touches[0].clientX : e.clientX;
    startIndex.current = index;
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging.current || imageList.length < 2) return;
    const currentX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const diff = currentX - startX.current;
    
    // Sensitivity: how many pixels per image frame
    const sensitivity = 15; 
    const moveIndex = Math.floor(diff / sensitivity);
    
    let newIndex = (startIndex.current - moveIndex) % imageList.length;
    if (newIndex < 0) newIndex += imageList.length;
    
    setIndex(newIndex);
  };

  const handleEnd = () => {
    isDragging.current = false;
  };

  useEffect(() => {
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchend', handleEnd);
    return () => {
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchend', handleEnd);
    };
  }, []);

  return (
    <motion.div className="cart-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div 
        className="viewer3d-modal" 
        style={{ width: '100%', maxWidth: 600, background: 'var(--ink-2)' }}
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="reviews-modal-header">
          <div>
            <h3>360° INTERACTIVE VIEW</h3>
            <p style={{ color: 'var(--t3)', fontSize: '0.75rem' }}>{productName}</p>
          </div>
          <button className="cart-close" onClick={onClose}>✕</button>
        </div>

        <div 
          className="viewer360-container"
          style={{ 
            position: 'relative', 
            width: '100%', 
            aspectRatio: '1/1', 
            cursor: 'grab', 
            userSelect: 'none',
            overflow: 'hidden',
            background: '#000'
          }}
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
        >
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <div className="tryon-spinner" />
              <p style={{ marginTop: 12, fontSize: '0.8rem', color: 'var(--t4)' }}>Loading 360° Experience...</p>
            </div>
          ) : imageList.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--t4)' }}>
              No 360° images available for this product.
            </div>
          ) : (
            <>
              <img 
                src={imageList[index]} 
                alt={productName} 
                draggable={false}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
              />
              <div style={{ position: 'absolute', bottom: 20, left: 0, right: 0, textAlign: 'center', pointerEvents: 'none' }}>
                <span style={{ background: 'rgba(0,0,0,0.6)', color: 'var(--t2)', padding: '4px 12px', fontSize: '0.7rem', borderRadius: 20 }}>
                  DRAG TO ROTATE
                </span>
              </div>
            </>
          )}
        </div>

        <div className="tryon-footer">
          <p className="tryon-tip">High-fidelity 360° spin captured from {imageList.length} angles.</p>
        </div>
      </motion.div>
    </motion.div>
  );
}
