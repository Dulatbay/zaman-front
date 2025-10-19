import { useState, useEffect, useRef } from 'react'
import { 
  MicrophoneIcon, 
  StopIcon, 
  SpeakerWaveIcon, 
  SpeakerXMarkIcon,
  PlayIcon,
  PauseIcon,
  Cog6ToothIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  UserIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline'
import { elevenLabsService, VOICES, DEFAULT_VOICE_SETTINGS } from '../services/elevenlabs'

const VoiceChatPage = () => {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [conversationHistory, setConversationHistory] = useState([])
  const [currentTranscript, setCurrentTranscript] = useState('')
  const [speechSupported, setSpeechSupported] = useState(false)
  const [elevenLabsSupported, setElevenLabsSupported] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [speechError, setSpeechError] = useState('')
  
  const [voiceSettings, setVoiceSettings] = useState({
    enabled: true,
    provider: 'elevenlabs',
    voice: 'rachel',
    speed: 1.0,
    stability: 0.75,
    similarity_boost: 0.3,
    style: 0.3,
    use_speaker_boost: false
  })

  const recognitionRef = useRef(null)
  const currentAudioRef = useRef(null)
  const conversationEndRef = useRef(null)

  // Инициализация при загрузке
  useEffect(() => {
    initializeSpeechRecognition()
    loadSettings()
    
    // Приветственное сообщение
    setConversationHistory([
      {
        id: 1,
        type: 'ai',
        text: 'Привет! Я ваш финансовый AI-помощник. Говорите со мной, и я отвечу голосом. Нажмите микрофон, чтобы начать разговор!',
        timestamp: new Date().toISOString()
      }
    ])
  }, [])

  // Автоскролл к последнему сообщению
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversationHistory])

  // Загрузка настроек
  const loadSettings = () => {
    const savedSettings = localStorage.getItem('voiceSettings')
    if (savedSettings) {
      setVoiceSettings(JSON.parse(savedSettings))
    }
  }

  // Сохранение настроек
  const saveSettings = (newSettings) => {
    setVoiceSettings(newSettings)
    localStorage.setItem('voiceSettings', JSON.stringify(newSettings))
  }

  // Инициализация Speech Recognition
  const initializeSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setSpeechSupported(true)
      
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = 'ru-RU'
      
      recognitionRef.current.onstart = () => {
        setIsListening(true)
        setSpeechError('')
      }
      
      recognitionRef.current.onresult = (event) => {
        let finalTranscript = ''
        let interimTranscript = ''
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }
        
        setCurrentTranscript(interimTranscript)
        
        if (finalTranscript) {
          handleUserSpeech(finalTranscript)
          // Останавливаем прослушивание после получения финального результата
          if (recognitionRef.current) {
            recognitionRef.current.stop()
          }
        }
      }
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
        setSpeechError(getErrorMessage(event.error))
      }
      
      recognitionRef.current.onend = () => {
        setIsListening(false)
      }
    }
  }

  // Получение сообщения об ошибке
  const getErrorMessage = (error) => {
    switch (error) {
      case 'no-speech':
        return 'Не удалось распознать речь. Попробуйте еще раз.'
      case 'audio-capture':
        return 'Микрофон недоступен. Проверьте разрешения.'
      case 'not-allowed':
        return 'Доступ к микрофону запрещен. Разрешите использование микрофона.'
      case 'network':
        return 'Ошибка сети. Проверьте подключение к интернету.'
      default:
        return 'Ошибка распознавания речи. Попробуйте еще раз.'
    }
  }

  // Обработка речи пользователя
  const handleUserSpeech = async (transcript) => {
    if (!transcript.trim()) return

    // Сразу останавливаем прослушивание
    setIsListening(false)
    setCurrentTranscript('')

    // Добавляем сообщение пользователя
    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: transcript,
      timestamp: new Date().toISOString()
    }
    
    setConversationHistory(prev => [...prev, userMessage])
    setIsProcessing(true)

    try {
      // Генерируем ответ AI
      const aiResponse = generateAIResponse(transcript)
      
      // Добавляем ответ AI
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        text: aiResponse,
        timestamp: new Date().toISOString()
      }
      
      setConversationHistory(prev => [...prev, aiMessage])
      
      // Озвучиваем ответ
      if (voiceSettings.enabled) {
        await speakText(aiResponse)
      }
    } catch (error) {
      console.error('Error processing speech:', error)
      setSpeechError('Ошибка обработки речи. Попробуйте еще раз.')
    } finally {
      setIsProcessing(false)
    }
  }

  // Генерация ответа AI
  const generateAIResponse = (userMessage) => {
    const responses = [
      "Отличный вопрос! Для эффективного управления финансами рекомендую создать бюджет по правилу 50/30/20: 50% на необходимые расходы, 30% на желания, 20% на сбережения и инвестиции.",
      "Инвестирование - это долгосрочная стратегия. Начните с диверсифицированного портфеля: 60% акции, 30% облигации, 10% альтернативные инвестиции. Не забывайте про индексные фонды!",
      "Экстренный фонд должен покрывать 3-6 месяцев ваших расходов. Храните его на высокодоходном сберегательном счете или краткосрочных депозитах.",
      "Для достижения финансовых целей используйте метод SMART: конкретные, измеримые, достижимые, релевантные и ограниченные по времени цели.",
      "Автоматизируйте сбережения! Настройте автоматические переводы на сберегательный счет сразу после получения зарплаты.",
      "Отслеживайте все расходы в течение месяца. Это поможет выявить скрытые траты и найти возможности для экономии.",
      "Рассмотрите возможность рефинансирования долгов с высокими процентами. Это может сэкономить тысячи рублей в год.",
      "Не забывайте про пенсионные накопления. Чем раньше начнете, тем больше будет ваш пенсионный капитал благодаря сложным процентам.",
      "Диверсификация - ключ к успешному инвестированию. Не кладите все яйца в одну корзину!",
      "Составьте план погашения долгов. Сначала погашайте долги с самыми высокими процентами."
    ]
    
    return responses[Math.floor(Math.random() * responses.length)]
  }

  // Озвучивание текста
  const speakText = async (text) => {
    if (!voiceSettings.enabled) return

    try {
      setIsSpeaking(true)
      
      if (voiceSettings.provider === 'elevenlabs' && elevenLabsSupported) {
        const settings = {
          stability: voiceSettings.stability,
          similarity_boost: voiceSettings.similarity_boost,
          style: voiceSettings.style,
          use_speaker_boost: voiceSettings.use_speaker_boost
        }
        
        await elevenLabsService.speak(text, voiceSettings.voice, settings, voiceSettings.speed)
      }
    } catch (error) {
      console.error('Error speaking:', error)
      setSpeechError('Ошибка воспроизведения речи.')
    } finally {
      setIsSpeaking(false)
    }
  }

  // Управление прослушиванием
  const startListening = () => {
    if (recognitionRef.current && !isListening && !isProcessing && !isSpeaking) {
      setSpeechError('')
      setCurrentTranscript('')
      recognitionRef.current.start()
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
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

  // Очистка истории
  const clearHistory = () => {
    setConversationHistory([
      {
        id: 1,
        type: 'ai',
        text: 'История разговора очищена. Говорите со мной!',
        timestamp: new Date().toISOString()
      }
    ])
  }

  // Форматирование времени
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-white to-light-green/10 flex items-center justify-center px-2 sm:px-4 py-4 sm:py-8">
      <div className="max-w-2xl w-full">
        {/* Заголовок */}
        <div className="text-center mb-4 sm:mb-6 lg:mb-8">
          <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
            <ChatBubbleLeftRightIcon className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-dark mb-2">Живой разговор с AI</h1>
          <p className="text-xs sm:text-sm lg:text-base text-gray">Говорите естественно, AI отвечает голосом</p>
        </div>

        {/* Основная область */}
        <div className="bg-white rounded-2xl shadow-xl border border-light p-3 sm:p-6 lg:p-8">
          {/* Сообщение об ошибке */}
          {speechError && (
            <div className="mb-3 sm:mb-4 lg:mb-6 bg-red-50 border border-red-200 rounded-xl p-2 sm:p-3 lg:p-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-red-700 text-xs sm:text-sm">{speechError}</span>
              </div>
            </div>
          )}

          {/* Центральная кнопка */}
          <div className="flex flex-col items-center space-y-3 sm:space-y-4 lg:space-y-6">
            {/* Главная кнопка разговора */}
            <button
              onClick={isListening ? stopListening : startListening}
              disabled={!speechSupported || isProcessing || isSpeaking}
              className={`w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 rounded-full font-bold transition-all duration-300 transform hover:scale-105 shadow-2xl disabled:hover:scale-100 ${
                isListening
                  ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse shadow-red-500/50'
                  : isSpeaking
                  ? 'bg-green-500 hover:bg-green-600 text-white animate-pulse shadow-green-500/50'
                  : isProcessing
                  ? 'bg-yellow-500 hover:bg-yellow-600 text-white animate-pulse shadow-yellow-500/50'
                  : 'bg-primary hover:bg-dark-green text-white disabled:bg-gray-400 disabled:cursor-not-allowed shadow-primary/50'
              }`}
              title={
                isListening 
                  ? "Остановить прослушивание" 
                  : isSpeaking 
                  ? "AI говорит..." 
                  : isProcessing 
                  ? "AI думает..." 
                  : "Начать разговор"
              }
            >
              {isListening ? (
                <StopIcon className="w-6 h-6 sm:w-8 sm:h-8 lg:w-12 lg:h-12 mx-auto" />
              ) : isSpeaking ? (
                <SpeakerWaveIcon className="w-6 h-6 sm:w-8 sm:h-8 lg:w-12 lg:h-12 mx-auto" />
              ) : isProcessing ? (
                <div className="flex space-x-1">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              ) : (
                <MicrophoneIcon className="w-8 h-8 sm:w-12 sm:h-12 mx-auto" />
              )}
            </button>

            {/* Статус */}
            <div className="text-center">
              {isListening ? (
                <div className="text-red-500 font-medium text-sm sm:text-base lg:text-lg animate-pulse">
                  🎤 Слушаю вас...
                </div>
              ) : isSpeaking ? (
                <div className="text-green-500 font-medium text-sm sm:text-base lg:text-lg animate-pulse">
                  🔊 AI говорит...
                </div>
              ) : isProcessing ? (
                <div className="text-yellow-500 font-medium text-sm sm:text-base lg:text-lg animate-pulse">
                  🤔 AI думает...
                </div>
              ) : (
                <div className="text-gray-500 font-medium text-sm sm:text-base lg:text-lg">
                  Нажмите кнопку, чтобы начать разговор
                </div>
              )}
            </div>

            {/* Текущий транскрипт */}
            {currentTranscript && (
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 sm:p-4 w-full">
                <p className="text-primary text-xs sm:text-sm italic text-center">
                  "{currentTranscript}"
                </p>
              </div>
            )}

            {/* Кнопки управления */}
            <div className="flex items-center justify-center space-x-1.5 sm:space-x-2 lg:space-x-4">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-1.5 sm:p-2 lg:p-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors"
                title="Настройки голоса"
              >
                <Cog6ToothIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              
              {isSpeaking && (
                <button
                  onClick={stopSpeaking}
                  className="p-1.5 sm:p-2 lg:p-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
                  title="Остановить воспроизведение"
                >
                  <PauseIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}
              
              <button
                onClick={clearHistory}
                className="p-1.5 sm:p-2 lg:p-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors"
                title="Очистить историю"
              >
                <div className="w-4 h-4 sm:w-5 sm:h-5">🗑️</div>
              </button>
            </div>

            {/* Информация о статусе */}
            <div className="flex items-center justify-center space-x-4 sm:space-x-6 text-xs text-gray-500">
              {speechSupported && (
                <div className="flex items-center space-x-1">
                  <MicrophoneIcon className="w-3 h-3" />
                  <span className="hidden sm:inline">Голосовой ввод</span>
                  <span className="sm:hidden">Голос</span>
                </div>
              )}
              {elevenLabsSupported && (
                <div className="flex items-center space-x-1">
                  <SpeakerWaveIcon className="w-3 h-3" />
                  <span>ElevenLabs</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Модальное окно настроек */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-md border border-light shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-dark">Настройки голоса</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-500 hover:text-gray-700 text-xl sm:text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {/* Выбор голоса */}
              <div>
                <label className="block text-sm font-medium text-dark mb-2">
                  Голос
                </label>
                <select
                  value={voiceSettings.voice}
                  onChange={(e) => saveSettings({ ...voiceSettings, voice: e.target.value })}
                  className="w-full px-3 py-2 border border-light rounded-lg text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  {Object.entries(VOICES).map(([key, voice]) => (
                    <option key={key} value={key}>
                      {voice.name} - {voice.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Скорость */}
              <div>
                <label className="block text-sm font-medium text-dark mb-2">
                  Скорость: {voiceSettings.speed}x
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={voiceSettings.speed}
                  onChange={(e) => saveSettings({ ...voiceSettings, speed: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>

              {/* Стабильность */}
              <div>
                <label className="block text-sm font-medium text-dark mb-2">
                  Стабильность: {voiceSettings.stability}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={voiceSettings.stability}
                  onChange={(e) => saveSettings({ ...voiceSettings, stability: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>

              {/* Схожесть */}
              <div>
                <label className="block text-sm font-medium text-dark mb-2">
                  Схожесть: {voiceSettings.similarity_boost}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={voiceSettings.similarity_boost}
                  onChange={(e) => saveSettings({ ...voiceSettings, similarity_boost: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>

              {/* Стиль */}
              <div>
                <label className="block text-sm font-medium text-dark mb-2">
                  Стиль: {voiceSettings.style}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={voiceSettings.style}
                  onChange={(e) => saveSettings({ ...voiceSettings, style: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>

              {/* Speaker Boost */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="speakerBoost"
                  checked={voiceSettings.use_speaker_boost}
                  onChange={(e) => saveSettings({ ...voiceSettings, use_speaker_boost: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="speakerBoost" className="text-sm text-dark">
                  Усиление голоса
                </label>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowSettings(false)}
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

export default VoiceChatPage
