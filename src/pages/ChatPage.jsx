import { useState, useEffect, useRef } from 'react'
import { PaperAirplaneIcon, UserIcon, CpuChipIcon, MicrophoneIcon, StopIcon, SpeakerWaveIcon, SpeakerXMarkIcon, PlayIcon, PauseIcon, Cog6ToothIcon } from '@heroicons/react/24/outline'
import { elevenLabsService, VOICES, DEFAULT_VOICE_SETTINGS } from '../services/elevenlabs'
import { chatAPI, handleAPIError } from '../services/api'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'
import '../styles/markdown.css'

const ChatPage = () => {
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [loadingStep, setLoadingStep] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const [speechError, setSpeechError] = useState('')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [speechSynthesisSupported, setSpeechSynthesisSupported] = useState(false)
  const [elevenLabsSupported, setElevenLabsSupported] = useState(true)
  const [speechSettings, setSpeechSettings] = useState({
    enabled: true,
    provider: 'elevenlabs', // 'elevenlabs' или 'browser'
    voice: 'rachel',
    speed: 1.0,
    stability: 0.75,
    similarity_boost: 0.3,
    style: 0.3,
    use_speaker_boost: false
  })
  const [showVoiceSettings, setShowVoiceSettings] = useState(false)
  const [showSettingsMenu, setShowSettingsMenu] = useState(false)
  const messagesEndRef = useRef(null)
  const recognitionRef = useRef(null)
  const synthesisRef = useRef(null)
  const currentAudioRef = useRef(null)

  // Этапы загрузки
  const loadingSteps = [
    'Отправляю запрос...',
    'Подключаюсь к серверу...',
    'Думаю...',
    'Анализирую контекст...',
    'Планирую задачи...',
    'Собираю информацию...',
    'Обрабатываю данные...',
    'Анализирую данные...',
    'Проверяю источники...',
    'Валидация...',
    'Формирую ответ...',
    'Проверяю качество...',
    'Оптимизирую результат...',
    'Проверяю результат...',
    'Финальная проверка...',
    'Завершаю обработку...'
  ]

  // Функция для показа этапов загрузки
  const showLoadingSteps = () => {
    let stepIndex = 0
    const interval = setInterval(() => {
      if (stepIndex < loadingSteps.length) {
        setLoadingStep(loadingSteps[stepIndex])
        stepIndex++
      } else {
        clearInterval(interval)
        setLoadingStep('')
      }
    }, 2000) // Каждый этап показывается 1200мс
  }

  // Проверка поддержки Speech Recognition и Speech Synthesis
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setSpeechSupported(true)
      initializeSpeechRecognition()
    }
    
    if ('speechSynthesis' in window) {
      setSpeechSynthesisSupported(true)
      initializeSpeechSynthesis()
    }

    // Проверка ElevenLabs API
    checkElevenLabsSupport()
  }, [])

  // Проверка поддержки ElevenLabs
  const checkElevenLabsSupport = async () => {
    try {
      // Проверяем наличие API ключа
      const apiKey = process.env.REACT_APP_ELEVENLABS_API_KEY
      if (apiKey && apiKey !== 'your-api-key-here') {
        setElevenLabsSupported(true)
        initializeElevenLabs()
      }
    } catch (error) {
      console.error('ElevenLabs not supported:', error)
    }
  }

  // Инициализация Speech Recognition
  const initializeSpeechRecognition = () => {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      
      if (!SpeechRecognition) {
        console.error('Speech Recognition not supported')
        setSpeechSupported(false)
        return
      }
      
      recognitionRef.current = new SpeechRecognition()
      
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = 'ru-RU'
      
      recognitionRef.current.onstart = () => {
        console.log('Speech recognition started')
        setIsListening(true)
        setSpeechError('')
      }
      
      recognitionRef.current.onresult = (event) => {
        console.log('Speech recognition result:', event.results)
        const transcript = event.results[0][0].transcript
        setInputMessage(prev => prev + transcript)
        setIsListening(false)
      }
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
        
        switch (event.error) {
          case 'no-speech':
            setSpeechError('Не удалось распознать речь. Попробуйте еще раз.')
            break
          case 'audio-capture':
            setSpeechError('Микрофон недоступен. Проверьте разрешения.')
            break
          case 'not-allowed':
            setSpeechError('Доступ к микрофону запрещен. Разрешите использование микрофона.')
            break
          case 'network':
            setSpeechError('Ошибка сети. Проверьте подключение к интернету.')
            break
          default:
            setSpeechError('Ошибка распознавания речи. Попробуйте еще раз.')
        }
      }
      
      recognitionRef.current.onend = () => {
        console.log('Speech recognition ended')
        setIsListening(false)
        setSpeechError('')
      }
      
      console.log('Speech Recognition initialized successfully')
    } catch (error) {
      console.error('Error initializing Speech Recognition:', error)
      setSpeechSupported(false)
    }
  }

  // Инициализация Speech Synthesis
  const initializeSpeechSynthesis = () => {
    // Загружаем настройки из localStorage
    const savedSettings = localStorage.getItem('speechSettings')
    if (savedSettings) {
      setSpeechSettings(JSON.parse(savedSettings))
    }
  }

  // Инициализация ElevenLabs
  const initializeElevenLabs = () => {
    // Загружаем настройки из localStorage
    const savedSettings = localStorage.getItem('speechSettings')
    if (savedSettings) {
      const settings = JSON.parse(savedSettings)
      // Если настройки содержат ElevenLabs конфигурацию, используем их
      if (settings.provider === 'elevenlabs') {
        setSpeechSettings(settings)
      }
    }
  }

  // Сохранение сообщений в localStorage
  useEffect(() => {
    localStorage.setItem('chatMessages', JSON.stringify(messages))
  }, [messages])

  // Автоскролл к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Закрытие меню настроек при клике вне его
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSettingsMenu && !event.target.closest('.settings-menu')) {
        setShowSettingsMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showSettingsMenu])

  // Глобальная клавиша Escape для остановки записи
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isListening) {
        console.log('🚨 ESCAPE KEY PRESSED - FORCE STOP')
        stopListening()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isListening])

  const generateAIResponse = (userMessage) => {
    const responses = [
      "Отличный вопрос! Для эффективного управления финансами рекомендую создать бюджет по правилу 50/30/20: 50% на необходимые расходы, 30% на желания, 20% на сбережения и инвестиции.",
      "Инвестирование - это долгосрочная стратегия. Начните с диверсифицированного портфеля: 60% акции, 30% облигации, 10% альтернативные инвестиции. Не забывайте про индексные фонды!",
      "Экстренный фонд должен покрывать 3-6 месяцев ваших расходов. Храните его на высокодоходном сберегательном счете или краткосрочных депозитах.",
      "Для достижения финансовых целей используйте метод SMART: конкретные, измеримые, достижимые, релевантные и ограниченные по времени цели.",
      "Автоматизируйте сбережения! Настройте автоматические переводы на сберегательный счет сразу после получения зарплаты.",
      "Отслеживайте все расходы в течение месяца. Это поможет выявить скрытые траты и найти возможности для экономии.",
      "Рассмотрите возможность рефинансирования долгов с высокими процентами. Это может сэкономить тысячи рублей в год.",
      "Не забывайте про пенсионные накопления. Чем раньше начнете, тем больше будет ваш пенсионный капитал благодаря сложным процентам."
    ]
    
    return responses[Math.floor(Math.random() * responses.length)]
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!inputMessage.trim()) return

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      isUser: true,
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    const currentMessage = inputMessage
    setInputMessage('')
    setIsTyping(true)
    showLoadingSteps()

    try {
      // Отправляем сообщение в AI API
      const response = await chatAPI.sendMessage(currentMessage)
      
      const aiResponse = {
        id: Date.now() + 1,
        text: response.response,
        isUser: false,
        timestamp: new Date().toISOString()
      }
      
      setMessages(prev => [...prev, aiResponse])
      setIsTyping(false)
      
      // Автоматически озвучиваем ответ бота
      setTimeout(() => {
        speakText(aiResponse.text)
      }, 500) // Небольшая задержка для лучшего UX
    } catch (error) {
      console.error('Error sending message:', error)
      
      // Показываем ошибку пользователю
      const errorMessage = {
        id: Date.now() + 1,
        text: `Ошибка: ${handleAPIError(error)}`,
        isUser: false,
        timestamp: new Date().toISOString(),
        isError: true
      }
      
      setMessages(prev => [...prev, errorMessage])
      setIsTyping(false)
    }
  }

  // Функции для голосового ввода
  const startListening = () => {
    setInputMessage('')
    if (recognitionRef.current && !isListening) {
      setSpeechError('')
      try {
        recognitionRef.current.start()
      } catch (error) {
        console.error('Error starting speech recognition:', error)
        setSpeechError('Ошибка запуска распознавания речи')
        setIsListening(false)
      }
    }
  }

  const stopListening = () => {
    console.log('🛑 STOP LISTENING CALLED')
    console.log('Current state - isListening:', isListening)
    console.log('recognitionRef exists:', !!recognitionRef.current)
    
    // НЕМЕДЛЕННО сбрасываем состояние
    setIsListening(false)
    setSpeechError('')
    
    // Принудительно останавливаем все процессы
    if (recognitionRef.current) {
      try {
        console.log('🛑 Stopping recognition...')
        recognitionRef.current.stop()
        console.log('✅ Recognition stopped')
      } catch (error) {
        console.error('❌ Error stopping recognition:', error)
      }
    }
    
    // Уничтожаем ссылку на recognition
    recognitionRef.current = null
    
    // Принудительно пересоздаем recognition
    setTimeout(() => {
      console.log('🔄 Reinitializing speech recognition...')
      initializeSpeechRecognition()
    }, 200)
  }

  // Функции для text-to-speech
  const speakText = async (text) => {
    if (!speechSettings.enabled) return

    try {
      setIsSpeaking(true)
      setSpeechError('')

      // Останавливаем текущее воспроизведение
      if (currentAudioRef.current) {
        currentAudioRef.current.pause()
        currentAudioRef.current = null
      }

      if (speechSettings.provider === 'elevenlabs' && elevenLabsSupported) {
        // Используем ElevenLabs
        const voiceSettings = {
          stability: speechSettings.stability,
          similarity_boost: speechSettings.similarity_boost,
          style: speechSettings.style,
          use_speaker_boost: speechSettings.use_speaker_boost
        }
        
        await elevenLabsService.speak(text, speechSettings.voice, voiceSettings, speechSettings.speed)
      } else if (speechSynthesisSupported) {
        // Fallback на браузерный speech synthesis
        if (synthesisRef.current) {
          window.speechSynthesis.cancel()
        }

        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = 'ru-RU'
        utterance.rate = 1
        utterance.pitch = 1
        utterance.volume = 0.8

        utterance.onstart = () => {
          setIsSpeaking(true)
        }

        utterance.onend = () => {
          setIsSpeaking(false)
        }

        utterance.onerror = (event) => {
          console.error('Speech synthesis error:', event.error)
          setIsSpeaking(false)
        }

        synthesisRef.current = utterance
        window.speechSynthesis.speak(utterance)
      }
    } catch (error) {
      console.error('Error speaking text:', error)
      setSpeechError('Ошибка воспроизведения речи. Попробуйте еще раз.')
      setIsSpeaking(false)
    }
  }

  const stopSpeaking = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current = null
    }
    
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel()
    }
    
    setIsSpeaking(false)
  }

  const toggleSpeechSettings = () => {
    const newSettings = { ...speechSettings, enabled: !speechSettings.enabled }
    setSpeechSettings(newSettings)
    localStorage.setItem('speechSettings', JSON.stringify(newSettings))
  }

  const updateVoiceSettings = (newSettings) => {
    const updatedSettings = { ...speechSettings, ...newSettings }
    setSpeechSettings(updatedSettings)
    localStorage.setItem('speechSettings', JSON.stringify(updatedSettings))
  }

  const switchProvider = (provider) => {
    updateVoiceSettings({ provider })
  }

  const clearChat = () => {
    setMessages([
      {
        id: 1,
        text: "Привет! Я ваш финансовый AI-помощник. Я могу помочь вам с планированием бюджета, анализом расходов, инвестиционными советами и достижением финансовых целей. Чем могу помочь?",
        isUser: false,
        timestamp: new Date().toISOString()
      }
    ])
  }

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Заголовок */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
              <span className="text-lg">👩‍💼</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">AI-sha</h1>
              <p className="text-xs text-gray-500">Ваш финансовый помощник</p>
            </div>
          </div>
          
          {/* Меню настроек */}
          <div className="relative settings-menu">
            <button
              onClick={() => setShowSettingsMenu(!showSettingsMenu)}
              className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
              title="Настройки"
            >
              <Cog6ToothIcon className="w-5 h-5" />
            </button>
            
            {/* Выпадающее меню */}
            {showSettingsMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                {(speechSynthesisSupported || elevenLabsSupported) && (
                  <button
                    onClick={() => {
                      setShowVoiceSettings(true)
                      setShowSettingsMenu(false)
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <SpeakerWaveIcon className="w-4 h-4" />
                    <span>Настройки голоса</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    clearChat()
                    setShowSettingsMenu(false)
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                >
                  <div className="w-4 h-4">🗑️</div>
                  <span>Очистить чат</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Основная область чата */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        <div className="flex-1 flex flex-col bg-white rounded-t-xl shadow-sm border border-gray-200">

          {/* Область сообщений */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start space-x-3 max-w-[85%] sm:max-w-[75%] lg:max-w-[65%] ${message.isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  {/* Аватар */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    message.isUser 
                      ? 'bg-primary' 
                      : 'bg-pink-100'
                  }`}>
                    {message.isUser ? (
                      <UserIcon className="w-5 h-5 text-white" />
                    ) : (
                      <span className="text-lg">👩‍💼</span>
                    )}
                  </div>
                  
                  {/* Сообщение */}
                  <div className={`rounded-2xl px-4 py-3 ${
                    message.isUser
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                  {message.isError ? (
                    <p className="text-sm leading-relaxed">{message.text}</p>
                  ) : (
                    <div className={`text-sm leading-relaxed prose prose-sm max-w-none ${
                      message.isUser ? 'prose text-white' : 'prose text-dark'
                    }`}>
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeSanitize]}
                      >
                        {message.text}
                      </ReactMarkdown>
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-1">
                    <p className={`text-xs ${
                      message.isUser ? 'text-white/70' : 'text-gray'
                    }`}>
                      {formatTime(message.timestamp)}
                    </p>
                    
                    {/* Кнопка озвучивания для сообщений бота */}
                    {!message.isUser && speechSynthesisSupported && (
                      <button
                        onClick={() => speakText(message.text)}
                        className="p-1 rounded-full hover:bg-white/20 transition-colors"
                        title="Озвучить сообщение"
                      >
                        <SpeakerWaveIcon className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center">
                  <span className="text-lg">👩‍💼</span>
                </div>
                <div className="bg-gray-100 text-gray-900 rounded-2xl px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm font-medium">
                      {loadingStep || 'AI-sha думает...'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

          {/* Быстрые вопросы - только если чат пустой */}
          {messages.length === 0 && (
            <div className="px-4 sm:px-6 py-3 bg-gray-50 border-t border-gray-200">
              <div className="flex flex-wrap gap-2">
                {[
                  "Составь отчет на этот месяц",
                  "Хочу накопить на что-то", 
                  "Оплати текущий ежемесячный платеж",
                  "Дай рекомендацию по моим финансовым целям"
                ].map((question) => (
                  <button
                    key={question}
                    onClick={() => setInputMessage(question)}
                    className="text-sm bg-white px-3 py-2 rounded-full transition-colors border border-gray-200 hover:border-primary shadow-sm group cursor-pointer"
                  >
                    <span className="text-gray-700 transition-colors">
                      {question}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Форма ввода */}
          <div className="p-4 sm:p-6 bg-white border-t border-gray-200">
            {/* Сообщение об ошибке speech recognition */}
            {speechError && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-red-700 text-sm">{speechError}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSendMessage} className="flex space-x-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={isListening ? "Слушаю..." : "Задайте вопрос о финансах..."}
                  className={`w-full px-4 py-3 pr-12 bg-white border rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors ${
                    isListening 
                      ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  disabled={isTyping}
                />
              
              {/* Индикатор записи */}
              {isListening && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-red-500 font-medium">Запись...</span>
                  </div>
                </div>
              )}
            </div>
            
              <div className="flex items-center space-x-2">
                {/* Кнопка микрофона */}
                {speechSupported && (
                  <button
                    type="button"
                    onClick={isListening ? stopListening : startListening}
                    disabled={isTyping}
                    className={`p-3 rounded-lg transition-colors ${
                      isListening
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-600 disabled:bg-gray-50 disabled:text-gray-400'
                    }`}
                    title={isListening ? "Остановить запись" : "Начать голосовой ввод"}
                  >
                    {isListening ? (
                      <StopIcon className="w-5 h-5" />
                    ) : (
                      <MicrophoneIcon className="w-5 h-5" />
                    )}
                  </button>
                )}
                
                
                {/* Кнопка отправки */}
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isTyping}
                  className="bg-primary hover:bg-dark-green disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold p-3 rounded-lg transition-colors"
                >
                  <PaperAirplaneIcon className="w-5 h-5" />
                </button>
              </div>
          </form>
        </div>
      </div>
    </div>

      {/* Модальное окно настроек голоса */}
      {showVoiceSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md border border-gray-200 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-dark">Настройки голоса</h2>
              <button
                onClick={() => setShowVoiceSettings(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {/* Выбор провайдера */}
              <div>
                <label className="block text-sm font-medium text-dark mb-2">
                  Провайдер озвучивания
                </label>
                <div className="flex space-x-2">
                  {elevenLabsSupported && (
                    <button
                      onClick={() => switchProvider('elevenlabs')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        speechSettings.provider === 'elevenlabs'
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      ElevenLabs (Премиум)
                    </button>
                  )}
                  {speechSynthesisSupported && (
                    <button
                      onClick={() => switchProvider('browser')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        speechSettings.provider === 'browser'
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Браузер
                    </button>
                  )}
                </div>
              </div>

              {/* Настройки ElevenLabs */}
              {speechSettings.provider === 'elevenlabs' && elevenLabsSupported && (
                <>
                  {/* Выбор голоса */}
                  <div>
                    <label className="block text-sm font-medium text-dark mb-2">
                      Голос
                    </label>
                    <select
                      value={speechSettings.voice}
                      onChange={(e) => updateVoiceSettings({ voice: e.target.value })}
                      className="w-full px-3 py-2 border border-light rounded-lg text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    >
                      {Object.entries(VOICES).map(([key, voice]) => (
                        <option key={key} value={key}>
                          {voice.name} - {voice.description}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Стабильность */}
                  <div>
                    <label className="block text-sm font-medium text-dark mb-2">
                      Стабильность: {speechSettings.stability}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={speechSettings.stability}
                      onChange={(e) => updateVoiceSettings({ stability: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                  </div>

                  {/* Similarity Boost */}
                  <div>
                    <label className="block text-sm font-medium text-dark mb-2">
                      Схожесть: {speechSettings.similarity_boost}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={speechSettings.similarity_boost}
                      onChange={(e) => updateVoiceSettings({ similarity_boost: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                  </div>

                  {/* Style */}
                  <div>
                    <label className="block text-sm font-medium text-dark mb-2">
                      Стиль: {speechSettings.style}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={speechSettings.style}
                      onChange={(e) => updateVoiceSettings({ style: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                  </div>

                  {/* Speaker Boost */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="speakerBoost"
                      checked={speechSettings.use_speaker_boost}
                      onChange={(e) => updateVoiceSettings({ use_speaker_boost: e.target.checked })}
                      className="rounded"
                    />
                    <label htmlFor="speakerBoost" className="text-sm text-dark">
                      Усиление голоса
                    </label>
                  </div>
                </>
              )}

              {/* Информация о провайдерах */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h3 className="text-sm font-medium text-blue-800 mb-1">Информация о провайдерах:</h3>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• <strong>ElevenLabs:</strong> Высокое качество, естественная речь</li>
                  <li>• <strong>Браузер:</strong> Быстро, не требует API ключа</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowVoiceSettings(false)}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-dark-green transition-colors"
              >
                Готово
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChatPage
