'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import styles from './FloatingBar.module.css'
import getDemoPages from './demoPagesData';
import DevTools from './DevTools';
import { generateHtml } from './openaiService';

export default function Home() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [inputText, setInputText] = useState('')
  const [backgroundHtml, setBackgroundHtml] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showContent, setShowContent] = useState(true)
  const [suggestions, setSuggestions] = useState([
    'Portfolio website',
    'Online store',
    'Blog',
    'Restaurant menu',
    'Travel guide'
  ])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef(null)

  const toggleExpand = () => {
    setIsExpanded(!isExpanded)
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus()
      }
    }, 300)
  }

  const handleSubmit = async () => {
    if (!inputText.trim()) {
      alert('Please enter content before submitting');
      return;
    }
    setIsLoading(true)
    const prompt = `Create an HTML page about: ${inputText}. Include some basic CSS styles.`
    const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

    let generatedHtml;
    if (useMockData) {
      // Use mock data
      const demoPages = getDemoPages();
      generatedHtml = demoPages[Math.floor(Math.random() * demoPages.length)];
    } else {
      // Use real OpenAI API
      generatedHtml = await generateHtml(prompt);
    }

    if (generatedHtml) {
      setShowContent(false)
      setTimeout(() => {
        setBackgroundHtml(generatedHtml)
      }, 500)
    } else {
      alert('Error generating HTML, please try again.')
    }
    setInputText('')
    setIsExpanded(false)
    setIsLoading(false)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSubmit();
    }
  }

  const handleInputClick = () => {
    setShowSuggestions(true);
  }

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => setShowSuggestions(false), 200);
  }

  const handleSuggestionClick = (suggestion) => {
    setInputText(suggestion);
    setShowSuggestions(false);
    // Don't call handleSubmit() here, let the user decide when to submit
  }

  useEffect(() => {
    if (backgroundHtml) {
      const iframe = document.getElementById('generated_iframe') || document.createElement('iframe');
      iframe.id = 'generated_iframe'
      iframe.srcdoc = backgroundHtml
      iframe.style.position = 'fixed'
      iframe.style.top = '0'
      iframe.style.left = '0'
      iframe.style.width = '100%'
      iframe.style.height = '100%'
      iframe.style.border = 'none'
      iframe.style.zIndex = '-1'
      document.body.appendChild(iframe)

      return () => {
        document.body.removeChild(iframe)
      }
    }
  }, [backgroundHtml])

  const handleHtmlChange = (newHtml) => {
    setBackgroundHtml(newHtml);
  };

  return (
    <>
      <AnimatePresence>
        {showContent && (
          <motion.div
            className={styles.container}
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <AnimatePresence>
              {!backgroundHtml && (
                <motion.div
                  className={styles.welcomeScreen}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className={styles.welcomeContent}>
                    <h1 className={styles.title}>AI Webpage Generator</h1>
                    <p className={styles.subtitle}>Enter your idea, let AI create a unique webpage for you</p>
                    <div className={styles.features}>
                      <div className={styles.feature}>
                        <span className={styles.icon}>🚀</span>
                        <span>Fast Generation</span>
                      </div>
                      <div className={styles.feature}>
                        <span className={styles.icon}>🎨</span>
                        <span>Creative Design</span>
                      </div>
                      <div className={styles.feature}>
                        <span className={styles.icon}>🔧</span>
                        <span>Custom Options</span>
                      </div>
                    </div>
                    <button className={styles.startButton} onClick={toggleExpand}>
                      Start Creating
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <motion.div
              className={styles.floatingBar}
              initial={false}
              animate={isExpanded ? "expanded" : "collapsed"}
            >
              <AnimatePresence mode="wait">
                {isExpanded ? (
                  <motion.div
                    key="input"
                    className={styles.inputContainer}
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "350px" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder="Describe your webpage idea..."
                      className={styles.input}
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyPress={handleKeyPress}
                      onClick={handleInputClick}
                      onBlur={handleInputBlur}
                    />
                    <button
                      onClick={handleSubmit}
                      className={styles.submitButton}
                      disabled={isLoading || !inputText.trim()}
                    >
                      {isLoading ? 'Generating...' : 'Generate'}
                    </button>
                    <AnimatePresence>
                      {showSuggestions && (
                        <motion.ul
                          className={styles.suggestions}
                          initial={{ opacity: 0, y: 10 }} // Change from -10 to 10
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }} // Change from -10 to 10
                          transition={{ duration: 0.2 }}
                        >
                          {suggestions.map((suggestion, index) => (
                            <motion.li
                              key={index}
                              onMouseDown={(e) => {
                                e.preventDefault(); // Prevent input blur
                                handleSuggestionClick(suggestion);
                              }}
                            >
                              {suggestion}
                            </motion.li>
                          ))}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ) : (
                  <motion.button
                    key="button"
                    className={styles.squareButton}
                    onClick={toggleExpand}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    +
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {backgroundHtml && <DevTools onHtmlChange={handleHtmlChange} />}
    </>
  )
}
