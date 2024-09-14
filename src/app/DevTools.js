import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './DevTools.module.css';
import { generateHtmlChange } from './openaiService';

function DOMTreeNode({ node, depth = 0, selectedNode, onNodeClick }) {
  const isSelected = node === selectedNode;
  const hasChildren = node.children.length > 0;

  return (
    <div style={{ marginLeft: `${depth * 20}px` }}>
      <span 
        className={`${styles.treeNode} ${isSelected ? styles.selectedNode : ''}`}
        onClick={() => onNodeClick(node)}
      >
        {hasChildren ? (node.expanded ? '▼' : '▶') : '•'} {node.tagName.toLowerCase()}
        {node.id && `#${node.id}`}
        {node.className && `.${node.className.split(' ').join('.')}`}
      </span>
      {hasChildren && node.expanded && (
        <div>
          {Array.from(node.children).map((child, index) => (
            <DOMTreeNode 
              key={index} 
              node={child} 
              depth={depth + 1} 
              selectedNode={selectedNode}
              onNodeClick={onNodeClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function DevTools({ onHtmlChange }) {
  const [isActive, setIsActive] = useState(false);
  const [selectedElement, setSelectedElement] = useState(null);
  const [domTree, setDomTree] = useState(null);
  const [changeInput, setChangeInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const overlayRef = useRef(null);
  const iframeRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const setupListeners = () => {
      const iframe = document.querySelector('iframe');
      if (iframe) {
        iframeRef.current = iframe;
        if (isActive && iframe.contentDocument) {
          iframe.contentDocument.addEventListener('mousemove', handleMouseMove);
          iframe.contentDocument.addEventListener('click', handleClick);
          setDomTree(iframe.contentDocument.body);
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
      updateDOMTree(element);
      setIsActive(false);
    }
  };

  const updateDOMTree = (selectedElement) => {
    if (iframeRef.current && iframeRef.current.contentDocument) {
      const body = iframeRef.current.contentDocument.body;
      setDomTree(body);
      expandToNode(body, selectedElement);
    }
  };

  const expandToNode = (node, targetNode) => {
    if (node === targetNode) {
      node.expanded = true;
      return true;
    }
    if (node.children) {
      for (let child of node.children) {
        if (expandToNode(child, targetNode)) {
          node.expanded = true;
          return true;
        }
      }
    }
    return false;
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

  const handleTreeNodeClick = (node) => {
    node.expanded = !node.expanded;
    setSelectedElement(node);
    highlightElement(node);
    setDomTree({ ...domTree });
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 300);
  };

  const handleChangeSubmit = async () => {
    if (!changeInput.trim()) {
      alert('Please enter a change request');
      return;
    }
    setIsLoading(true);
    if (iframeRef.current && iframeRef.current.contentDocument && selectedElement) {
      const updatedHtml = await generateHtmlChange(selectedElement, iframeRef.current.contentDocument.body, changeInput);
      if (updatedHtml) {
        onHtmlChange(updatedHtml);
      } else {
        alert('Error generating HTML change, please try again.');
      }
    }
    setChangeInput('');
    setIsLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isLoading) {
      handleChangeSubmit();
    }
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
        onClick={() => setIsActive(!isActive)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {isActive ? 'Stop Selecting' : 'Select Element to change what you want'}
      </motion.button>
      <div ref={overlayRef} className={styles.overlay}></div>
      {selectedElement && (
        <div className={styles.elementInfo}>
          <h3>Selected Element:</h3>
          <p>Tag: {selectedElement.tagName}</p>
          <p>Classes: {selectedElement.className}</p>
          <p>ID: {selectedElement.id}</p>
          <input
            ref={inputRef}
            type="text"
            placeholder="Describe the change you want..."
            className={styles.changeInput}
            value={changeInput}
            onChange={(e) => setChangeInput(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button
            onClick={handleChangeSubmit}
            className={styles.changeButton}
            disabled={isLoading || !changeInput.trim()}
          >
            {isLoading ? 'Updating...' : 'Update Element'}
          </button>
        </div>
      )}
      {domTree && (
        <div className={styles.domTree}>
          <h3>DOM Tree:</h3>
          <DOMTreeNode 
            node={domTree} 
            selectedNode={selectedElement}
            onNodeClick={handleTreeNodeClick}
          />
        </div>
      )}
      {isLoading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner}></div>
        </div>
      )}
    </motion.div>
  );
}