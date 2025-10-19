import React, { useState, useEffect } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  RadialBarChart,
  RadialBar,
  ComposedChart
} from 'recharts'
import { transactionsAPI, handleAPIError } from '../services/api'

const ChartsSection = ({ goals, badHabits, accountBalance }) => {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Загрузка транзакций при монтировании
  useEffect(() => {
    loadTransactions()
  }, [])

  const loadTransactions = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await transactionsAPI.getAllTransactions()
      console.log('API Response:', response)
      
      // API возвращает объект с полями: user_id, start_date, end_date, transactions, count, status
      if (response && response.transactions && Array.isArray(response.transactions)) {
        setTransactions(response.transactions)
        console.log('Loaded transactions:', response.transactions.length)
      } else if (response && Array.isArray(response)) {
        setTransactions(response)
      } else {
        console.warn('No transactions data received or invalid format')
        setTransactions([])
      }
    } catch (err) {
      console.error('Error loading transactions:', err)
      setError(handleAPIError(err))
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }

  // Обработка данных транзакций для аналитики
  const processTransactionData = () => {
    if (!transactions || transactions.length === 0) {
      return {
        expenseData: [
          { name: 'Еда и напитки', value: 0, color: '#ef4444' },
          { name: 'Транспорт', value: 0, color: '#3b82f6' },
          { name: 'Шоппинг', value: 0, color: '#10b981' },
          { name: 'Развлечения', value: 0, color: '#f59e0b' },
          { name: 'Другие', value: 0, color: '#8b5cf6' }
        ],
        monthlyExpenses: [],
        weeklySpending: [],
        totalIncome: 0,
        totalExpenses: 0
      }
    }

    // Функция для определения категории по типу транзакции
    const getCategoryFromType = (type, details) => {
      if (!type) return 'Другие'
      
      const typeLower = type.toLowerCase()
      const detailsLower = (details || '').toLowerCase()
      
      if (typeLower.includes('покупка')) {
        // Анализируем детали для более точной категоризации
        if (detailsLower.includes('coffee') || detailsLower.includes('кафе') || detailsLower.includes('ресторан') || 
            detailsLower.includes('еда') || detailsLower.includes('продукт') || detailsLower.includes('food') ||
            detailsLower.includes('green food') || detailsLower.includes('alma') || detailsLower.includes('minimarket') ||
            detailsLower.includes('naubay') || detailsLower.includes('doner') || detailsLower.includes('chapsan') ||
            detailsLower.includes('zebra') || detailsLower.includes('kingwaffle') || detailsLower.includes('ata doner')) {
          return 'Еда и напитки'
        } else if (detailsLower.includes('avtobys') || detailsLower.includes('транспорт') || detailsLower.includes('такси') || 
                   detailsLower.includes('бензин') || detailsLower.includes('автобус') || detailsLower.includes('yandex') ||
                   detailsLower.includes('jet sharing') || detailsLower.includes('автобус')) {
          return 'Транспорт'
        } else if (detailsLower.includes('footpoint') || detailsLower.includes('одежда') || detailsLower.includes('магазин') || 
                   detailsLower.includes('шоппинг') || detailsLower.includes('store') || detailsLower.includes('outfit') ||
                   detailsLower.includes('realist') || detailsLower.includes('a-store') || detailsLower.includes('kaspi magazin')) {
          return 'Шоппинг'
        } else if (detailsLower.includes('кино') || detailsLower.includes('развлечение') || detailsLower.includes('игра') ||
                   detailsLower.includes('chaplin') || detailsLower.includes('sport') || detailsLower.includes('fitness') ||
                   detailsLower.includes('barbershop') || detailsLower.includes('travel') || detailsLower.includes('kaspi travel')) {
          return 'Развлечения'
        } else if (detailsLower.includes('apple') || detailsLower.includes('google') || detailsLower.includes('youtube') ||
                   detailsLower.includes('kcell') || detailsLower.includes('qazaq mobile') || detailsLower.includes('onay')) {
          return 'Связь и интернет'
        } else if (detailsLower.includes('квартир') || detailsLower.includes('квартира') || detailsLower.includes('yurta') ||
                   detailsLower.includes('alsеко') || detailsLower.includes('жилье')) {
          return 'Жилье'
        } else if (detailsLower.includes('kaspi') || detailsLower.includes('банк') || detailsLower.includes('депозит') ||
                   detailsLower.includes('терминал') || detailsLower.includes('банкомат')) {
          return 'Банковские услуги'
        } else {
          return 'Другие расходы'
        }
      } else if (typeLower.includes('пополнение') || typeLower.includes('зарплата') || typeLower.includes('доход')) {
        return 'Доходы'
      }
      
      return 'Другие'
    }

    // Группировка по категориям
    const categoryTotals = {}
    const monthlyData = {}
    const weeklyData = { Пн: 0, Вт: 0, Ср: 0, Чт: 0, Пт: 0, Сб: 0, Вс: 0 }
    let totalIncome = 0
    let totalExpenses = 0

    transactions.forEach(transaction => {
      // Парсим amount как строку в число
      const amount = parseFloat(transaction.amount || 0)
      const category = getCategoryFromType(transaction.type, transaction.details)
      const date = new Date(transaction.date)
      const month = date.toLocaleDateString('ru-RU', { month: 'short' })
      const dayOfWeek = date.toLocaleDateString('ru-RU', { weekday: 'short' })

      // В реальных данных все суммы положительные, тип определяет доход/расход
      if (transaction.type === 'Пополнение' || transaction.type === 'Пополнение') {
        totalIncome += amount
        // Группировка доходов по месяцам
        if (!monthlyData[month]) {
          monthlyData[month] = { expenses: 0, income: 0 }
        }
        monthlyData[month].income += amount
      } else {
        // Все остальные типы - расходы
        totalExpenses += amount
        
        // Группировка по категориям (только расходы)
        if (!categoryTotals[category]) {
          categoryTotals[category] = 0
        }
        categoryTotals[category] += amount

        // Группировка по месяцам
        if (!monthlyData[month]) {
          monthlyData[month] = { expenses: 0, income: 0 }
        }
        monthlyData[month].expenses += amount

        // Группировка по дням недели
        if (weeklyData[dayOfWeek] !== undefined) {
          weeklyData[dayOfWeek] += amount
        }
      }
    })

    // Формирование данных для диаграмм
    const expenseData = Object.entries(categoryTotals).map(([category, amount], index) => ({
      name: category,
      value: amount,
      color: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'][index % 5]
    }))

    const monthlyExpenses = Object.entries(monthlyData).map(([month, data]) => ({
      month,
      expenses: data.expenses,
      income: data.income,
      savings: data.income - data.expenses
    }))

    const weeklySpending = Object.entries(weeklyData).map(([day, amount]) => ({
      day,
      amount
    }))

    return {
      expenseData,
      monthlyExpenses,
      weeklySpending,
      totalIncome,
      totalExpenses
    }
  }

  const processedData = processTransactionData()

  // Отладочная информация
  console.log('Transactions:', transactions)
  console.log('Processed Data:', processedData)

  // Fallback данные если нет транзакций
  const fallbackMonthlyExpenses = [
    { month: 'Янв', expenses: 3200, income: 5000, savings: 1800 },
    { month: 'Фев', expenses: 2800, income: 5000, savings: 2200 },
    { month: 'Мар', expenses: 3500, income: 5200, savings: 1700 },
    { month: 'Апр', expenses: 3100, income: 5000, savings: 1900 },
    { month: 'Май', expenses: 2900, income: 5100, savings: 2200 },
    { month: 'Июн', expenses: 3300, income: 5000, savings: 1700 }
  ]

  const monthlyExpenses = processedData.monthlyExpenses.length > 0 ? processedData.monthlyExpenses : fallbackMonthlyExpenses

  const goalProgressData = goals.map(goal => ({
    name: goal.title,
    current: parseFloat(goal.currentAmount),
    target: parseFloat(goal.targetAmount),
    progress: (parseFloat(goal.currentAmount) / parseFloat(goal.targetAmount)) * 100
  }))

  const habitsData = badHabits.map(habit => ({
    name: habit.name,
    cost: habit.monthlyCost,
    category: habit.category
  }))

  // Используем реальные данные из транзакций или fallback
  const incomeData = processedData.totalIncome > 0 ? [
    { source: 'Зарплата', amount: processedData.totalIncome * 0.9, percentage: 90 },
    { source: 'Другие доходы', amount: processedData.totalIncome * 0.1, percentage: 10 }
  ] : [
    { source: 'Зарплата', amount: 4500, percentage: 90 },
    { source: 'Фриланс', amount: 300, percentage: 6 },
    { source: 'Инвестиции', amount: 200, percentage: 4 }
  ]

  const weeklySpending = processedData.weeklySpending.length > 0 ? processedData.weeklySpending : [
    { day: 'Пн', amount: 120 },
    { day: 'Вт', amount: 85 },
    { day: 'Ср', amount: 200 },
    { day: 'Чт', amount: 150 },
    { day: 'Пт', amount: 300 },
    { day: 'Сб', amount: 450 },
    { day: 'Вс', amount: 200 }
  ]

  // Создаем данные для сравнения бюджета на основе реальных расходов
  const categoryComparison = processedData.expenseData.length > 0 ? 
    processedData.expenseData.map(expense => ({
      category: expense.name,
      budget: expense.value * 1.2, // Бюджет на 20% больше расходов
      spent: expense.value,
      remaining: expense.value * 0.2
    })) : [
      { category: 'Еда и напитки', budget: 2000, spent: 1800, remaining: 200 },
      { category: 'Транспорт', budget: 1000, spent: 800, remaining: 200 },
      { category: 'Шоппинг', budget: 500, spent: 450, remaining: 50 },
      { category: 'Развлечения', budget: 800, spent: 1200, remaining: -400 },
      { category: 'Связь и интернет', budget: 300, spent: 250, remaining: 50 },
      { category: 'Жилье', budget: 5000, spent: 4500, remaining: 500 }
    ]

  // Создаем тренд накоплений на основе реальных данных
  const savingsTrend = processedData.monthlyExpenses.length > 0 ? 
    processedData.monthlyExpenses.map((month, index) => ({
      month: month.month,
      amount: month.savings > 0 ? month.savings : 0
    })) : [
    { month: 'Янв', amount: 5000 },
    { month: 'Фев', amount: 7200 },
    { month: 'Мар', amount: 8900 },
    { month: 'Апр', amount: 10800 },
    { month: 'Май', amount: 13000 },
    { month: 'Июн', amount: 14700 }
    ]

  // Убеждаемся, что все данные для диаграмм существуют
  const safeExpenseData = processedData.expenseData.length > 0 ? processedData.expenseData : [
    { name: 'Еда и напитки', value: 0, color: '#ef4444' },
    { name: 'Транспорт', value: 0, color: '#3b82f6' },
    { name: 'Шоппинг', value: 0, color: '#10b981' },
    { name: 'Развлечения', value: 0, color: '#f59e0b' },
    { name: 'Связь и интернет', value: 0, color: '#8b5cf6' },
    { name: 'Жилье', value: 0, color: '#ec4899' },
    { name: 'Банковские услуги', value: 0, color: '#06b6d4' },
    { name: 'Другие расходы', value: 0, color: '#84cc16' }
  ]

  const safeMonthlyExpenses = monthlyExpenses.length > 0 ? monthlyExpenses : fallbackMonthlyExpenses
  const safeWeeklySpending = weeklySpending.length > 0 ? weeklySpending : [
    { day: 'Пн', amount: 0 },
    { day: 'Вт', amount: 0 },
    { day: 'Ср', amount: 0 },
    { day: 'Чт', amount: 0 },
    { day: 'Пт', amount: 0 },
    { day: 'Сб', amount: 0 },
    { day: 'Вс', amount: 0 }
  ]

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Заголовок */}
      <div className="text-center">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-dark mb-2">Financial Analytics</h2>
        <p className="text-sm sm:text-base text-gray-600">Comprehensive analysis of your financial data</p>
        {loading && (
          <div className="mt-4 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="ml-2 text-gray-600">Loading transaction data...</span>
          </div>
        )}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">Error loading transactions: {error}</p>
            <button 
              onClick={loadTransactions}
              className="mt-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      {/* Первый ряд - расходы и доходы */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Круговая диаграмма расходов */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-light shadow-lg">
          <h3 className="text-lg sm:text-xl font-bold text-dark mb-3 sm:mb-4">Expenses by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={safeExpenseData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {safeExpenseData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Столбчатая диаграмма доходов */}
        <div className="bg-white rounded-2xl p-6 border border-light shadow-lg">
          <h3 className="text-xl font-bold text-dark mb-4">Income Sources</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={incomeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="source" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="amount" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Второй ряд - тренды */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Линейная диаграмма месячных расходов */}
        <div className="bg-white rounded-2xl p-6 border border-light shadow-lg">
          <h3 className="text-xl font-bold text-dark mb-4">Monthly Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={safeMonthlyExpenses}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
              <Line type="monotone" dataKey="income" stroke="#10b981" name="Income" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Областная диаграмма накоплений */}
        <div className="bg-white rounded-2xl p-6 border border-light shadow-lg">
          <h3 className="text-xl font-bold text-dark mb-4">Savings Growth</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={savingsTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="amount" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Третий ряд - цели и привычки */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Прогресс целей */}
        <div className="bg-white rounded-2xl p-6 border border-light shadow-lg">
          <h3 className="text-xl font-bold text-dark mb-4">Goals Progress</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={goalProgressData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip />
              <Bar dataKey="current" fill="#3b82f6" name="Current" />
              <Bar dataKey="target" fill="#e5e7eb" name="Target" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Плохие привычки */}
        <div className="bg-white rounded-2xl p-6 border border-light shadow-lg">
          <h3 className="text-xl font-bold text-dark mb-4">Bad Habits Cost</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={habitsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="cost" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Четвертый ряд - сравнения и детали */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Сравнение бюджета и трат */}
        <div className="bg-white rounded-2xl p-6 border border-light shadow-lg">
          <h3 className="text-xl font-bold text-dark mb-4">Budget vs Spending</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryComparison}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="budget" fill="#e5e7eb" name="Budget" />
              <Bar dataKey="spent" fill="#3b82f6" name="Spent" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Недельные траты */}
        <div className="bg-white rounded-2xl p-6 border border-light shadow-lg">
          <h3 className="text-xl font-bold text-dark mb-4">Weekly Spending</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={safeWeeklySpending}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="amount" stroke="#f59e0b" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Пятый ряд - радиальные диаграммы */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Радиальная диаграмма общего прогресса */}
        <div className="bg-white rounded-2xl p-6 border border-light shadow-lg">
          <h3 className="text-xl font-bold text-dark mb-4">Overall Progress</h3>
          <ResponsiveContainer width="100%" height={250}>
            <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%" data={[
              { 
                name: 'Goals', 
                value: goals.length > 0 ? Math.round(goalProgressData.reduce((sum, goal) => sum + goal.progress, 0) / goals.length) : 0, 
                fill: '#3b82f6' 
              },
              { 
                name: 'Savings', 
                value: processedData.totalIncome > 0 ? Math.round((processedData.totalIncome - processedData.totalExpenses) / processedData.totalIncome * 100) : 40, 
                fill: '#10b981' 
              },
              { 
                name: 'Investments', 
                value: 45, 
                fill: '#f59e0b' 
              }
            ]}>
              <RadialBar dataKey="value" />
              <Tooltip />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>

        {/* Круговая диаграмма распределения активов */}
        <div className="bg-white rounded-2xl p-6 border border-light shadow-lg">
          <h3 className="text-xl font-bold text-dark mb-4">Asset Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Cash', value: accountBalance, fill: '#10b981' },
                  { name: 'Goals', value: goals.reduce((sum, goal) => sum + parseFloat(goal.currentAmount), 0), fill: '#3b82f6' },
                  { name: 'Monthly Expenses', value: processedData.totalExpenses, fill: '#f59e0b' },
                  { name: 'Net Savings', value: Math.max(0, processedData.totalIncome - processedData.totalExpenses), fill: '#ef4444' }
                ]}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                dataKey="value"
              >
                {[
                  { name: 'Cash', value: accountBalance, fill: '#10b981' },
                  { name: 'Goals', value: goals.reduce((sum, goal) => sum + parseFloat(goal.currentAmount), 0), fill: '#3b82f6' },
                  { name: 'Monthly Expenses', value: processedData.totalExpenses, fill: '#f59e0b' },
                  { name: 'Net Savings', value: Math.max(0, processedData.totalIncome - processedData.totalExpenses), fill: '#ef4444' }
                ].map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Статистика */}
        <div className="bg-white rounded-2xl p-6 border border-light shadow-lg">
          <h3 className="text-xl font-bold text-dark mb-4">Quick Stats</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-green-600 font-medium">Total Income</span>
              <span className="text-green-700 font-bold">
                {processedData.totalIncome > 0 ? processedData.totalIncome.toLocaleString() : '30,000'} ₸
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
              <span className="text-red-600 font-medium">Total Expenses</span>
              <span className="text-red-700 font-bold">
                {processedData.totalExpenses > 0 ? processedData.totalExpenses.toLocaleString() : '18,000'} ₸
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="text-blue-600 font-medium">Net Savings</span>
              <span className="text-blue-700 font-bold">
                {processedData.totalIncome > 0 ? (processedData.totalIncome - processedData.totalExpenses).toLocaleString() : '12,000'} ₸
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
              <span className="text-purple-600 font-medium">Savings Rate</span>
              <span className="text-purple-700 font-bold">
                {processedData.totalIncome > 0 ? 
                  Math.round(((processedData.totalIncome - processedData.totalExpenses) / processedData.totalIncome) * 100) : 40}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChartsSection
