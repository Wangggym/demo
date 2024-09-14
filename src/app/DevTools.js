import React, { useState, useEffect, useRef } from 'react';
import styles from './DevTools.module.css';

export default function DevTools() {
  const [isActive, setIsActive] = useState(false);
  const [selectedElement, setSelectedElement] = useState(null);
  const overlayRef = useRef(null);

  useEffect(() => {
    const iframe = document.querySelector('iframe');
    if (isActive && iframe) {
      iframe.contentDocument.addEventListener('mousemove', handleMouseMove);
      iframe.contentDocument.addEventListener('click', handleClick);
    } else if (iframe) {
      iframe.contentDocument.removeEventListener('mousemove', handleMouseMove);
      iframe.contentDocument.removeEventListener('click', handleClick);
    }

    return () => {
      if (iframe) {
        iframe.contentDocument.removeEventListener('mousemove', handleMouseMove);
        iframe.contentDocument.removeEventListener('click', handleClick);
      }
    };
  }, [isActive]);

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
    const iframe = document.querySelector('iframe');
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

  return (
    <div className={styles.devTools}>
      <button className={styles.devToolsButton} onClick={toggleDevTools}>
        {isActive ? 'Stop Selecting' : 'Select Element'}
      </button>
      <div ref={overlayRef} className={styles.overlay}></div>
      {selectedElement && (
        <div className={styles.elementInfo}>
          <h3>Selected Element:</h3>
          <p>Tag: {selectedElement.tagName}</p>
          <p>Classes: {selectedElement.className}</p>
          <p>ID: {selectedElement.id}</p>
        </div>
      )}
    </div>
  );
}