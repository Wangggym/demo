import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './DevTools.module.css';
import { generateHtmlChange, evaluateHtml, optimizeHtml } from './openaiService';

export default function DevTools({ onHtmlChange, initialHtml }) {
  const [isActive, setIsActive] = useState(false);
  const [selectedElement, setSelectedElement] = useState(null);
  const [changeInput, setChangeInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const overlayRef = useRef(null);
  const iframeRef = useRef(null);
  const inputRef = useRef(null);
  const [history, setHistory] = useState([]);
  const [currentVersion, setCurrentVersion] = useState(0);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isEvaluationCollapsed, setIsEvaluationCollapsed] = useState(false);

  useEffect(() => {
    if (initialHtml) {
      addNewVersion(initialHtml);
    }
  }, []);

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

    setupListeners();

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

  const addNewVersion = (newHtml) => {
    const newVersion = {
      html: newHtml,
      evaluation: null,
      timestamp: new Date()
    };
    var newHistory = [...history, newVersion];
    setHistory(newHistory);
    const newVersionIndex = newHistory.length - 1;
    setCurrentVersion(newVersionIndex);
    onHtmlChange(newHtml);

    // Start evaluation (non-blocking)
    setIsEvaluating(true);
    evaluateHtml(newHtml).then(newEvaluation => {
      setHistory(prevHistory => {
        const updatedHistory = [...prevHistory];
        updatedHistory[newVersionIndex].evaluation = newEvaluation;
        return updatedHistory;
      });
      setIsEvaluating(false);
    }).catch(error => {
      console.error('Error evaluating HTML:', error);
      setIsEvaluating(false);
    });
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

        addNewVersion(newHtml);  // 非阻塞调用

        // Dispatch a custom event to notify of HTML change
        window.dispatchEvent(new Event('htmlChanged'));
      } else {
        alert('Error generating HTML change, please try again.');
      }
    }
    setChangeInput('');
    setIsLoading(false);
    setSelectedElement(null);
    setIsActive(false);
  };

  const handleOptimize = async () => {
    const currentVersionData = history[currentVersion];
    if (!currentVersionData.evaluation) {
      alert('Please wait for the evaluation to complete before optimizing.');
      return;
    }
    setIsLoading(true);
    const optimizedHtml = await optimizeHtml(currentVersionData.html, currentVersionData.evaluation);
    if (optimizedHtml) {
      addNewVersion(optimizedHtml);  // 非阻塞调用
    } else {
      alert('Error optimizing HTML, please try again.');
    }
    setIsLoading(false);
  };

  const handleVersionChange = (index) => {
    if (index !== currentVersion && history[index]) {
      const version = history[index];
      if (iframeRef.current) {
        setIsActive(false);
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

  const toggleEvaluation = () => {
    setIsEvaluationCollapsed(!isEvaluationCollapsed);
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

      {history[currentVersion]?.evaluation && (
        <div className={`${styles.evaluation} ${isEvaluationCollapsed ? styles.collapsed : ''}`}>
          <h3 onClick={toggleEvaluation} className={styles.evaluationHeader}>
            Evaluation Results
            <span className={styles.collapseIcon}>{isEvaluationCollapsed ? '▼' : '▲'}</span>
          </h3>
          <AnimatePresence>
            {!isEvaluationCollapsed && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                {Object.entries(history[currentVersion].evaluation).map(([key, value]) =>
                  key !== 'overallScore' ? (
                    <div key={key} className={styles.evaluationItem}>
                      <h4>{key.charAt(0).toUpperCase() + key.slice(1)}</h4>
                      <p>Score: {value.score}/10</p>
                      <p className={styles.feedbackText}>{value.feedback}</p>
                      <p className={styles.suggestionText}>Suggestion: {value.suggestion}</p>
                    </div>
                  ) : null
                )}
                <div className={styles.overallScore}>
                  <h4>Overall Score: {history[currentVersion].evaluation.overallScore}/10</h4>
                </div>
                <motion.button
                  className={styles.optimizeButton}
                  onClick={handleOptimize}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={isLoading || isEvaluating || !history[currentVersion].evaluation}
                >
                  Optimize HTML
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {isEvaluating && (
        <div className={styles.evaluatingOverlay}>
          <div className={styles.spinner}></div>
          <p>Evaluating HTML...</p>
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
              {version.evaluation && (
                <span className={styles.score}>Score: {version.evaluation.overallScore}/10</span>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}