const API_BASE_URL = 'https://zaman-back.vercel.app/api'
// const API_BASE_URL = 'http://localhost:3000/api'

// Функция для получения userId из localStorage
const getUserId = () => {
  return localStorage.getItem('userId') || 'user123'
}

// API для целей
export const goalsAPI = {
  // Создать цель
  createGoal: async (goalData) => {
    const response = await fetch(`${API_BASE_URL}/goals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: getUserId(),
        title: goalData.title,
        target_amount: parseFloat(goalData.targetAmount),
        current_amount: parseFloat(goalData.currentAmount),
        deadline: goalData.deadline,
        category: goalData.category,
        monthly_cost: parseFloat(goalData.monthlyCost || 0)
      })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  },

  // Получить цели пользователя
  getGoalsByUser: async (userId = getUserId()) => {
    const response = await fetch(`${API_BASE_URL}/goals/user/${userId}`)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  },

  // Обновить цель
  updateGoal: async (goalId, goalData) => {
    const response = await fetch(`${API_BASE_URL}/goals/${goalId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: goalData.title,
        target_amount: parseFloat(goalData.targetAmount),
        current_amount: parseFloat(goalData.currentAmount),
        deadline: goalData.deadline,
        category: goalData.category,
        monthly_cost: parseFloat(goalData.monthlyCost || 0)
      })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  },

  // Удалить цель
  deleteGoal: async (goalId) => {
    const response = await fetch(`${API_BASE_URL}/goals/${goalId}`, {
      method: 'DELETE'
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  },

  // Пополнить цель
  topupGoal: async (goalId, amount) => {
    const response = await fetch(`${API_BASE_URL}/goals/${goalId}/topup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: parseFloat(amount)
      })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  }
}

// API для привычек
export const habitsAPI = {
  // Получить привычки пользователя
  getHabitsByUser: async (userId = getUserId()) => {
    const response = await fetch(`${API_BASE_URL}/habits/user/${userId}`)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  },

  // Создать привычку
  createHabit: async (habitData) => {
    const response = await fetch(`${API_BASE_URL}/habits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: getUserId(),
        habit_description: habitData.description,
        monthly_cost: habitData.monthlyCost,
        category: habitData.category,
        frequency: habitData.frequency
      })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  },

  // Обновить привычку
  updateHabit: async (habitId, habitData) => {
    const response = await fetch(`${API_BASE_URL}/habits/${habitId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        habit_description: habitData.description,
        monthly_cost: habitData.monthlyCost,
        category: habitData.category,
        frequency: habitData.frequency
      })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  },

  // Удалить привычку
  deleteHabit: async (habitId) => {
    const response = await fetch(`${API_BASE_URL}/habits/${habitId}`, {
      method: 'DELETE'
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  }
}

// API для аутентификации
export const authAPI = {
  // Получить пользователя по ID
  getUserByID: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  }
}

// API для чата с AI
export const chatAPI = {
  // Отправить сообщение в AI чат
  sendMessage: async (message, userId = getUserId()) => {
    const response = await fetch('https://2tqxb4pmpg5qsbedfafjxzlf3i0eptdq.lambda-url.eu-central-1.on.aws/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        message: message
      })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  }
}

// API для анализа вредных привычек
export const badHabitsAPI = {
  // Получить анализ вредных привычек
  getBadHabitsAnalysis: async (startDate, endDate, userId = getUserId()) => {
    const response = await fetch('https://xm4ji5phy2iiiox2uujfwpejxu0ccrmf.lambda-url.eu-central-1.on.aws/ ', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        start_date: startDate,
        end_date: endDate,
        user_id: userId
      })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  }
}

// API для транзакций
export const transactionsAPI = {
  // Получить все транзакции
  getAllTransactions: async (userId = getUserId(), startDate = null, endDate = null) => {
    // Если даты не указаны, берем последние 3 месяца
    if (!startDate || !endDate) {
      const now = new Date()
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1)
      startDate = threeMonthsAgo.toISOString().split('T')[0]
      endDate = now.toISOString().split('T')[0]
    }

    const response = await fetch('https://kews5ye56swbpvyv4nbn5quz440pqvyw.lambda-url.eu-central-1.on.aws/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        start_date: startDate,
        end_date: endDate,
        user_id: userId
      })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  }
}

// API для обязательных платежей
export const paymentsAPI = {
  // Создать новый обязательный платеж
  createPayment: async (paymentData) => {
    const response = await fetch(`${API_BASE_URL}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: getUserId(),
        name: paymentData.name,
        cost: parseFloat(paymentData.cost),
        payment_day: parseInt(paymentData.payment_day)
      })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  },

  // Получить все обязательные платежи пользователя
  getPaymentsByUser: async (userId = getUserId()) => {
    const response = await fetch(`${API_BASE_URL}/payments/user/${userId}`)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  },

  // Обновить обязательный платеж
  updatePayment: async (paymentId, paymentData) => {
    const response = await fetch(`${API_BASE_URL}/payments/${paymentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: paymentData.name,
        cost: parseFloat(paymentData.cost),
        payment_day: parseInt(paymentData.payment_day)
      })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  },

  // Удалить обязательный платеж
  deletePayment: async (paymentId) => {
    const response = await fetch(`${API_BASE_URL}/payments/${paymentId}`, {
      method: 'DELETE'
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  }
}

// API для управления балансом
export const balanceAPI = {
  // Пополнение баланса
  topupBalance: async (amount, userId = getUserId()) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/balance/topup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: parseFloat(amount)
      })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  },

  // Получение текущего баланса
  getBalance: async (userId = getUserId()) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/balance`)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  }
}

// Экспорт для обратной совместимости
export const getUserByID = authAPI.getUserByID

// Утилиты для обработки ошибок
export const handleAPIError = (error) => {
  console.error('API Error:', error)
  
  if (error.message.includes('Failed to fetch')) {
    return 'Не удается подключиться к серверу. Проверьте подключение к интернету.'
  }
  
  if (error.message.includes('404')) {
    return 'Ресурс не найден.'
  }
  
  if (error.message.includes('500')) {
    return 'Ошибка сервера. Попробуйте позже.'
  }
  
  return 'Произошла ошибка при выполнении запроса.'
}
