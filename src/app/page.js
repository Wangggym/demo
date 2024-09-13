'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import styles from './FloatingBar.module.css'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export default function Home() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [inputText, setInputText] = useState('')
  const [backgroundHtml, setBackgroundHtml] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showContent, setShowContent] = useState(true)
  const inputRef = useRef(null)

  const toggleExpand = () => {
    setIsExpanded(!isExpanded)
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus()
      }
    }, 300)
  }

  const generateHtml = async (prompt) => {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {role: "system", content: "You are an HTML generator. Create a simple HTML page based on the user's prompt."},
          {role: "user", content: prompt}
        ],
        max_tokens: 1000
      });
      return response.choices[0].message.content;
    } catch (error) {
      return null;
    }
  }

  const handleSubmit = async () => {
    if (!inputText.trim()) {
      alert('Please enter content before submitting');
      return;
    }
    setIsLoading(true)
    const prompt = `Create an HTML page about: ${inputText}. Include some basic CSS styles.`
    const generatedHtml = await generateHtml(prompt)
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

  useEffect(() => {
    if (backgroundHtml) {
      const iframe = document.createElement('iframe')
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

  return (
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
                  animate={{ opacity: 1, width: "300px" }}
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
                  />
                  <button 
                    onClick={handleSubmit} 
                    className={styles.submitButton} 
                    disabled={isLoading || !inputText.trim()}
                  >
                    {isLoading ? 'Generating...' : 'Generate'}
                  </button>
                </motion.div>
              ) : (
                <motion.button
                  key="button"
                  className={styles.circleButton}
                  onClick={toggleExpand}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  +
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
