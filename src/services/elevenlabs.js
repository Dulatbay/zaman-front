const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1'
const ELEVENLABS_API_KEY = 'sk_f38f08264a87cecc933f23dd3995618482cafa5b51366a20'

// Доступные голоса ElevenLabs
export const VOICES = {
  'rachel': {
    id: '21m00Tcm4TlvDq8ikWAM',
    name: 'Rachel',
    description: 'Американский женский голос'
  },
  'drew': {
    id: '29vD33N1CtxCmqQRPOHJ',
    name: 'Drew',
    description: 'Американский мужской голос'
  },
  'clyde': {
    id: '2EiwWnXFnvU5JabPnv8n',
    name: 'Clyde',
    description: 'Американский мужской голос'
  },
  'paul': {
    id: '5Q0t7uMcjvnagumLfvZi',
    name: 'Paul',
    description: 'Американский мужской голос'
  },
  'domi': {
    id: 'AZnzlk1XvdvUeBnXmlld',
    name: 'Domi',
    description: 'Американский женский голос'
  },
  'dave': {
    id: 'CYw3kZ02Hs0563khs1Fj',
    name: 'Dave',
    description: 'Американский мужской голос'
  },
  'alice': {
    id: 'Xb7hH8MSUJpSbSDYk0k2',
    name: 'Alice',
    description: 'Американский женский голос'
  },
  'fin': {
    id: 'D38z5RcWu1voky8WS1ja',
    name: 'Fin',
    description: 'Американский мужской голос'
  },
  'sarah': {
    id: 'EXAVITQu4vr4xnSDxMaL',
    name: 'Sarah',
    description: 'Американский женский голос'
  },
  'antoni': {
    id: 'ErXwobaYiN019PkySvjV',
    name: 'Antoni',
    description: 'Американский мужской голос'
  },
  'thomas': {
    id: 'GBv7mTt0atIp3Br8iCZE',
    name: 'Thomas',
    description: 'Американский мужской голос'
  },
  'charlie': {
    id: 'IKne3meq5aSn9XLyUdCD',
    name: 'Charlie',
    description: 'Австралийский мужской голос'
  },
  'emily': {
    id: 'LcfcDJNUP1GQjkzn1xUU',
    name: 'Emily',
    description: 'Американский женский голос'
  },
  'elli': {
    id: 'MF3mGyEYCl7XYWbV9V6O',
    name: 'Elli',
    description: 'Американский женский голос'
  },
  'callum': {
    id: 'N2lVS1w4EtoT3dr4eOWO',
    name: 'Callum',
    description: 'Британский мужской голос'
  },
  'patrick': {
    id: 'ODq5zmih8GrVes37Dizd',
    name: 'Patrick',
    description: 'Ирландский мужской голос'
  },
  'harry': {
    id: 'SOYHLrjzK2X1ezoPC6cr',
    name: 'Harry',
    description: 'Британский мужской голос'
  },
  'liam': {
    id: 'TX3LPaxmHKxFdv7VOQHJ',
    name: 'Liam',
    description: 'Американский мужской голос'
  },
  'dorothy': {
    id: 'ThT5KcBeYPX3keUQqHPh',
    name: 'Dorothy',
    description: 'Американский женский голос'
  },
  'josh': {
    id: 'TxGEqnHWrfWFTfGW9XjX',
    name: 'Josh',
    description: 'Американский мужской голос'
  },
  'arnold': {
    id: 'VR6AewLTigWG4xSOukaG',
    name: 'Arnold',
    description: 'Американский мужской голос'
  },
  'adam': {
    id: 'pNInz6obpgDQGcFmaJgB',
    name: 'Adam',
    description: 'Американский мужской голос'
  },
  'sam': {
    id: 'yoZ06aMxZJJ28mfd3POQ',
    name: 'Sam',
    description: 'Американский мужской голос'
  }
}

// Настройки по умолчанию
export const DEFAULT_VOICE_SETTINGS = {
  stability: 0.5,
  similarity_boost: 0.5,
  style: 0.0,
  use_speaker_boost: true
}

// Основной класс для работы с ElevenLabs
export class ElevenLabsService {
  constructor(apiKey = ELEVENLABS_API_KEY) {
    this.apiKey = apiKey
    this.baseURL = ELEVENLABS_API_URL
  }

  // Получить список доступных голосов
  async getVoices() {
    try {
      const response = await fetch(`${this.baseURL}/voices`, {
        headers: {
          'xi-api-key': this.apiKey
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching voices:', error)
      throw error
    }
  }

  // Синтезировать речь
  async synthesizeSpeech(text, voiceId, settings = DEFAULT_VOICE_SETTINGS, speed = 1.0) {
    try {
      const response = await fetch(`${this.baseURL}/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: settings,
          generation_config: {
            speed: speed
          }
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.blob()
    } catch (error) {
      console.error('Error synthesizing speech:', error)
      throw error
    }
  }

  // Воспроизвести аудио
  async playAudio(audioBlob) {
    return new Promise((resolve, reject) => {
      const audio = new Audio()
      const audioURL = URL.createObjectURL(audioBlob)
      
      audio.src = audioURL
      audio.onended = () => {
        URL.revokeObjectURL(audioURL)
        resolve()
      }
      audio.onerror = (error) => {
        URL.revokeObjectURL(audioURL)
        reject(error)
      }
      
      audio.play().catch(reject)
    })
  }

  // Синтезировать и воспроизвести речь
  async speak(text, voiceId = 'rachel', settings = DEFAULT_VOICE_SETTINGS, speed = 1.0) {
    try {
      const audioBlob = await this.synthesizeSpeech(text, VOICES[voiceId]?.id || voiceId, settings, speed)
      await this.playAudio(audioBlob)
      return true
    } catch (error) {
      console.error('Error speaking:', error)
      throw error
    }
  }
}

// Создаем экземпляр сервиса
export const elevenLabsService = new ElevenLabsService()

// Утилиты для работы с голосами
export const getVoiceById = (voiceId) => {
  return Object.values(VOICES).find(voice => voice.id === voiceId)
}

export const getVoiceByName = (name) => {
  return VOICES[name.toLowerCase()]
}

export const getAllVoices = () => {
  return Object.entries(VOICES).map(([key, voice]) => ({
    key,
    ...voice
  }))
}
