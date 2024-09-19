import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import styles from './DevTools.module.css';
import { generateHtmlChange } from './openaiService';

export default function DevTools({ onHtmlChange }) {
  const [isActive, setIsActive] = useState(false);
  const [selectedElement, setSelectedElement] = useState(null);
  const [changeInput, setChangeInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const overlayRef = useRef(null);
  const iframeRef = useRef(null);
  const inputRef = useRef(null);
  const [history, setHistory] = useState([]);
  const [currentVersion, setCurrentVersion] = useState(0);

  useEffect(() => {
    const setupListeners = () => {
      const iframe = document.getElementById('generated_iframe');
      if (iframe) {
        iframeRef.current = iframe;
        if (isActive && iframe.contentDocument) {
          iframe.contentDocument.addEventListener('mousemove', handleMouseMove);
          iframe.contentDocument.addEventListener('click', handleClick);
        }
      }
    };

    const cleanupListeners = () => {
      if (iframeRef.current && iframeRef.current.contentDocument) {
        iframeRef.current.contentDocument.removeEventListener('mousemove', handleMouseMove);
        iframeRef.current.contentDocument.removeEventListener('click', handleClick);
      }
    };

    if (isActive) {
      setupListeners();
    } else {
      cleanupListeners();
    }

    return cleanupListeners;
  }, [isActive]);

  useEffect(() => {
    const handleHtmlChange = () => {
      setSelectedElement(null);
      setIsActive(false);
      setChangeInput('');
      if (overlayRef.current) {
        overlayRef.current.style.display = 'none';
      }
    };

    // Assuming there's a way to detect HTML changes, e.g., a custom event
    window.addEventListener('htmlChanged', handleHtmlChange);

    return () => {
      window.removeEventListener('htmlChanged', handleHtmlChange);
    };
  }, []);

  const handleMouseMove = (e) => {
    const element = e.target;
    if (element && element !== overlayRef.current) {
      highlightElement(element);
    }
  };

  const handleClick = (e) => {
    e.preventDefault();
    const element = e.target;
    if (element && element !== overlayRef.current) {
      setSelectedElement(element);
      setIsActive(false);
    }
  };

  const highlightElement = (element) => {
    const rect = element.getBoundingClientRect();
    const iframe = iframeRef.current;
    const overlay = overlayRef.current;
    if (overlay && iframe) {
      const iframeRect = iframe.getBoundingClientRect();
      overlay.style.top = `${rect.top + iframeRect.top}px`;
      overlay.style.left = `${rect.left + iframeRect.left}px`;
      overlay.style.width = `${rect.width}px`;
      overlay.style.height = `${rect.height}px`;
      overlay.style.display = 'block';
    }
  };

  const toggleDevTools = () => {
    setIsActive(!isActive);
    setSelectedElement(null);
    if (overlayRef.current) {
      overlayRef.current.style.display = 'none';
    }
  };

  const handleChangeSubmit = async () => {
    if (!changeInput.trim()) {
      alert('Please enter a change request');
      return;
    }
    setIsLoading(true);
    if (iframeRef.current && iframeRef.current.contentDocument && selectedElement) {
      const updatedHtml = await generateHtmlChange(
        selectedElement,
        iframeRef.current.contentDocument.body,
        changeInput,
        {
          tagName: selectedElement.tagName,
          className: selectedElement.className,
          id: selectedElement.id,
          innerHTML: selectedElement.innerHTML,
          style: selectedElement.style.cssText,
        }
      );
      if (updatedHtml) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = updatedHtml;
        const newElement = tempDiv.firstElementChild || tempDiv;

        // Apply changes to the selected element
        selectedElement.outerHTML = newElement.outerHTML;

        // Trigger a reflow to ensure changes are applied
        iframeRef.current.contentDocument.body.offsetHeight;

        const newHtml = iframeRef.current.contentDocument.documentElement.outerHTML;
        onHtmlChange(newHtml);
        
        // Add new version to history
        setHistory(prevHistory => [...prevHistory, { html: newHtml, timestamp: new Date() }]);
        setCurrentVersion(prevVersion => prevVersion + 1);
        
        // Dispatch a custom event to notify of HTML change
        window.dispatchEvent(new Event('htmlChanged'));
      } else {
        alert('Error generating HTML change, please try again.');
      }
    }
    setChangeInput('');
    setIsLoading(false);
    setSelectedElement(null);
    setIsActive(false); // Reset isActive state after any change attempt
  };

  const handleVersionChange = (index) => {
    if (index !== currentVersion && history[index]) {
      const version = history[index];
      if (iframeRef.current) {
        onHtmlChange(version.html);
        setCurrentVersion(index);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isLoading) {
      handleChangeSubmit();
    }
  };

  const togglePanel = () => {
    setIsPanelCollapsed(!isPanelCollapsed);
  };

  const handleRegenerateClick = () => {
    if (changeInput.trim()) {
      handleChangeSubmit();
    } else {
      alert('Please enter a change request before regenerating');
    }
  };

  const handleHtmlChange = (newHtml) => {
    onHtmlChange(newHtml);
    setIsActive(false);
  };

  return (
    <motion.div 
      className={styles.devTools}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <motion.button 
        className={styles.devToolsButton} 
        onClick={toggleDevTools}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {isActive ? 'Cancel Selection' : 'Select Element to change what you want'}
      </motion.button>
      {/* <motion.button 
        className={styles.regenerateButton} 
        onClick={handleRegenerateClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        disabled={!changeInput.trim() || isLoading}
      >
        Click me to regenerate
      </motion.button> */}
      <div ref={overlayRef} className={styles.overlay}></div>
      {selectedElement && (
        <div className={styles.elementInfo}>
          <p>Tag: {selectedElement.tagName}</p>
          <input
            ref={inputRef}
            type="text"
            placeholder="Describe the change..."
            className={styles.changeInput}
            value={changeInput}
            onChange={(e) => setChangeInput(e.target.value)}
            onKeyPress={handleKeyPress}
          />
        </div>
      )}
      {isLoading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner}></div>
        </div>
      )}
      
      {history.length > 0 && (
        <div className={styles.historyBar}>
          {history.map((version, index) => (
            <motion.div 
              key={index}
              className={`${styles.historyItem} ${index === currentVersion ? styles.currentVersion : ''}`}
              onClick={() => handleVersionChange(index)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <iframe
                srcDoc={`<html><head><style>body{zoom:0.2;-moz-transform:scale(0.2);-moz-transform-origin:0 0;}</style></head><body>${version.html}</body></html>`}
                width={120}
                height={50}
              />
              <span className={styles.versionNumber}>V{index + 1}</span>
              <span className={styles.timestamp}>{version.timestamp.toLocaleTimeString()}</span>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}