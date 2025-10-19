import { useState, useEffect } from 'react'
import { 
  PlusIcon, 
  TrashIcon, 
  PencilIcon,
  BanknotesIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  SunIcon,
  AcademicCapIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  ClockIcon,
  ChartPieIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import ChartsSection from '../components/ChartsSection'
import TransactionTest from '../components/TransactionTest'
import { goalsAPI, habitsAPI, badHabitsAPI, paymentsAPI, balanceAPI, handleAPIError } from '../services/api'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'
import '../styles/markdown.css'

const MainPage = () => {
  const [goals, setGoals] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingGoal, setEditingGoal] = useState(null)
  const [showDebugTools, setShowDebugTools] = useState(false)
  const [showTopupModal, setShowTopupModal] = useState(false)
  const [showHabitsModal, setShowHabitsModal] = useState(false)
  const [showCharts, setShowCharts] = useState(false)
  const [showTransactionTest, setShowTransactionTest] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showPaymentManagement, setShowPaymentManagement] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState(null)
  const [topupAmount, setTopupAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // Обязательные платежи
  const [mandatoryPayments, setMandatoryPayments] = useState([])
  const [paymentFormData, setPaymentFormData] = useState({
    name: '',
    cost: '',
    payment_day: '',
    paid: false
  })
  const [editingPayment, setEditingPayment] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    targetAmount: '',
    currentAmount: '',
    deadline: '',
    category: 'savings',
    monthlyCost: ''
  })
  
  // Debug tools state
  const [accountBalance, setAccountBalance] = useState(0)
  
  // Bad habits state
  const [badHabitsRecommendations, setBadHabitsRecommendations] = useState('')
  const [badHabits, setBadHabits] = useState([
    {
      id: 1,
      name: 'Кофе на вынос',
      description: 'Ежедневные покупки кофе в кафе',
      monthlyCost: 300,
      frequency: 'Ежедневно',
      category: 'Еда и напитки'
    },
    {
      id: 2,
      name: 'Такси вместо транспорта',
      description: 'Использование такси вместо общественного транспорта',
      monthlyCost: 800,
      frequency: '3-4 раза в неделю',
      category: 'Транспорт'
    },
    {
      id: 3,
      name: 'Импульсивные покупки',
      description: 'Покупки ненужных вещей под влиянием эмоций',
      monthlyCost: 1200,
      frequency: '2-3 раза в месяц',
      category: 'Шоппинг'
    },
    {
      id: 4,
      name: 'Подписки на сервисы',
      description: 'Множественные подписки на стриминговые сервисы',
      monthlyCost: 450,
      frequency: 'Ежемесячно',
      category: 'Развлечения'
    },
    {
      id: 5,
      name: 'Дорогие обеды',
      description: 'Частые походы в рестораны вместо домашней еды',
      monthlyCost: 1500,
      frequency: '2-3 раза в неделю',
      category: 'Еда и напитки'
    }
  ])

  // Загрузка данных из API при монтировании
  useEffect(() => {
    loadData()
    loadMandatoryPayments()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Загружаем цели
      const goalsResponse = await goalsAPI.getGoalsByUser()
      if (goalsResponse.success) {
        const formattedGoals = goalsResponse.data.map(goal => ({
          id: goal.goal_id,
          title: goal.goal_title,
          targetAmount: goal.goal_cost.toString(),
          currentAmount: goal.goal_cost_collected.toString(),
          deadline: goal.deadline,
          category: goal.category ? goal.category.toLowerCase() : 'other',
          monthlyCost: goal.payment_period_cost ? goal.payment_period_cost.toString() : '0',
          createdAt: goal.timestamp,
          completed: goal.completed,
          paymentPeriod: goal.payment_period
        }))
        setGoals(formattedGoals)
      }

      // Загружаем баланс
      const balanceResponse = await balanceAPI.getBalance()
      if (balanceResponse.success) {
        setAccountBalance(balanceResponse.data.account_balance || 0)
      }

      // Загружаем анализ вредных привычек
      const currentDate = new Date()
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
      
      const badHabitsResponse = await badHabitsAPI.getBadHabitsAnalysis(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      )
      
      if (badHabitsResponse.analysis) {
        const formattedHabits = badHabitsResponse.analysis.bad_habits.map((habit, index) => ({
          id: `habit_${index}`,
          name: habit.category,
          description: `${habit.category} expenses`,
          monthlyCost: parseFloat(habit.total_cost),
          frequency: 'Ежемесячно',
          category: habit.category,
          products: habit.products
        }))
        setBadHabits(formattedHabits)
        
        // Сохраняем рекомендации из API, если они есть
        if (badHabitsResponse.analysis.recommendations) {
          // Сохраняем рекомендации как строку для ReactMarkdown
          setBadHabitsRecommendations(badHabitsResponse.analysis.recommendations)
        }
      }

      // Загружаем баланс из localStorage (пока нет API для баланса)
      const savedBalance = localStorage.getItem('accountBalance')
      if (savedBalance) {
        setAccountBalance(parseFloat(savedBalance))
      }
    } catch (err) {
      console.error('Error loading data:', err)
      setError(handleAPIError(err))
      
      // Fallback к localStorage при ошибке API
      const savedGoals = localStorage.getItem('financialGoals')
      const savedBalance = localStorage.getItem('accountBalance')
      const savedHabits = localStorage.getItem('badHabits')
      const savedRecommendations = localStorage.getItem('badHabitsRecommendations')
      
      if (savedGoals) {
        setGoals(JSON.parse(savedGoals))
      }
      if (savedBalance) {
        setAccountBalance(parseFloat(savedBalance))
      }
      if (savedHabits) {
        setBadHabits(JSON.parse(savedHabits))
      }
      if (savedRecommendations) {
        setBadHabitsRecommendations(savedRecommendations)
      }
    } finally {
      setLoading(false)
    }
  }

  // Загрузка обязательных платежей
  const loadMandatoryPayments = async () => {
    try {
      const response = await paymentsAPI.getPaymentsByUser()
      if (response.success) {
        setMandatoryPayments(response.data || [])
      }
    } catch (err) {
      console.error('Error loading mandatory payments:', err)
      // Fallback к localStorage
      const savedPayments = localStorage.getItem('mandatoryPayments')
      if (savedPayments) {
        setMandatoryPayments(JSON.parse(savedPayments))
      }
    }
  }

  // Создание/обновление обязательного платежа
  const handlePaymentSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      if (editingPayment !== null) {
        // Редактирование существующего платежа
        await paymentsAPI.updatePayment(editingPayment.id, paymentFormData)
        
        const updatedPayments = mandatoryPayments.map((payment, index) => 
          index === editingPayment ? { ...payment, ...paymentFormData } : payment
        )
        setMandatoryPayments(updatedPayments)
        setEditingPayment(null)
      } else {
        // Создание нового платежа
        const response = await paymentsAPI.createPayment(paymentFormData)
        
        if (response.success) {
          const newPayment = {
            ...paymentFormData,
            id: response.data.payment_id,
            user_id: response.data.user_id
          }
          setMandatoryPayments([...mandatoryPayments, newPayment])
        }
      }
      
      setPaymentFormData({
        name: '',
        cost: '',
        payment_day: '',
        paid: false
      })
      setShowPaymentModal(false)
    } catch (err) {
      console.error('Error saving payment:', err)
      setError(handleAPIError(err))
    } finally {
      setLoading(false)
    }
  }

  // Удаление обязательного платежа
  const handleDeletePayment = async (index) => {
    const paymentToDelete = mandatoryPayments[index]
    setLoading(true)
    setError(null)
    
    try {
      await paymentsAPI.deletePayment(paymentToDelete.id)
      const updatedPayments = mandatoryPayments.filter((_, i) => i !== index)
      setMandatoryPayments(updatedPayments)
    } catch (err) {
      console.error('Error deleting payment:', err)
      setError(handleAPIError(err))
    } finally {
      setLoading(false)
    }
  }

  // Редактирование обязательного платежа
  const handleEditPayment = (payment, index) => {
    setPaymentFormData(payment)
    setEditingPayment(index)
    setShowPaymentModal(true)
  }

  // Обновление баланса с сервера
  const refreshBalance = async () => {
    try {
      const balanceResponse = await balanceAPI.getBalance()
      if (balanceResponse.success) {
        setAccountBalance(balanceResponse.data.account_balance || 0)
      }
    } catch (err) {
      console.error('Error refreshing balance:', err)
    }
  }

  // Сохранение данных в localStorage при изменении
  useEffect(() => {
    localStorage.setItem('financialGoals', JSON.stringify(goals))
  }, [goals])
  
  useEffect(() => {
    localStorage.setItem('accountBalance', accountBalance.toString())
  }, [accountBalance])
  
  useEffect(() => {
    localStorage.setItem('badHabits', JSON.stringify(badHabits))
  }, [badHabits])
  
  useEffect(() => {
    localStorage.setItem('badHabitsRecommendations', badHabitsRecommendations)
  }, [badHabitsRecommendations])

  useEffect(() => {
    localStorage.setItem('mandatoryPayments', JSON.stringify(mandatoryPayments))
  }, [mandatoryPayments])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      if (editingGoal !== null) {
        // Редактирование существующей цели через API
        const goalToUpdate = goals[editingGoal]
        await goalsAPI.updateGoal(goalToUpdate.id, formData)
        
        // Обновляем локальное состояние
        const updatedGoals = goals.map((goal, index) => 
          index === editingGoal ? { ...formData, id: goal.id, createdAt: goal.createdAt } : goal
        )
        setGoals(updatedGoals)
        setEditingGoal(null)
      } else {
        // Добавление новой цели через API
        const response = await goalsAPI.createGoal(formData)
        
        if (response.success) {
          const newGoal = {
            ...formData,
            id: response.data.goal_id,
            createdAt: response.data.created_at
          }
          setGoals([...goals, newGoal])
        }
      }
      
      setFormData({
        title: '',
        targetAmount: '',
        currentAmount: '',
        deadline: '',
        category: 'savings',
        monthlyCost: ''
      })
      setShowAddForm(false)
    } catch (err) {
      console.error('Error saving goal:', err)
      setError(handleAPIError(err))
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (goal, index) => {
    setFormData(goal)
    setEditingGoal(index)
    setShowAddForm(true)
  }

  const handleDelete = async (index) => {
    const goalToDelete = goals[index]
    setLoading(true)
    setError(null)
    
    try {
      await goalsAPI.deleteGoal(goalToDelete.id)
      const updatedGoals = goals.filter((_, i) => i !== index)
      setGoals(updatedGoals)
    } catch (err) {
      console.error('Error deleting goal:', err)
      setError(handleAPIError(err))
    } finally {
      setLoading(false)
    }
  }

  const handleTopup = (goal, index) => {
    setSelectedGoal({ goal, index })
    setTopupAmount('')
    setShowTopupModal(true)
  }

  const confirmTopup = async () => {
    if (!topupAmount || parseFloat(topupAmount) <= 0) return

    setLoading(true)
    setError(null)
    
    try {
      const amount = parseFloat(topupAmount)
      
        // Пополняем цель (тратим деньги из баланса)
        await goalsAPI.topupGoal(selectedGoal.goal.id, amount)
        
        // Обновляем локальное состояние цели
        const updatedGoals = goals.map((goal, index) => 
          index === selectedGoal.index 
            ? { ...goal, currentAmount: (parseFloat(goal.currentAmount) + amount).toString() }
            : goal
        )
        setGoals(updatedGoals)
        
        await refreshBalance()
        
        setShowTopupModal(false)
        setTopupAmount('')
        setSelectedGoal(null)
   
    } catch (err) {
      console.error('Error topping up goal:', err)
      setError(handleAPIError(err))
    } finally {
      setLoading(false)
    }
  }

  const processMonthlyPayments = () => {
    const totalMonthlyCost = goals.reduce((sum, goal) => 
      sum + parseFloat(goal.monthlyCost || 0), 0
    )
    
    if (totalMonthlyCost > accountBalance) {
      alert('Недостаточно средств для ежемесячных платежей!')
      return
    }

    const updatedGoals = goals.map(goal => ({
      ...goal,
      currentAmount: (parseFloat(goal.currentAmount) + parseFloat(goal.monthlyCost || 0)).toString()
    }))
    
    setGoals(updatedGoals)
    setAccountBalance(accountBalance - totalMonthlyCost)
  }

  const getTotalHabitsCost = () => {
    return badHabits.reduce((sum, habit) => sum + habit.monthlyCost, 0)
  }

  const getHabitsByCategory = () => {
    const categories = {}
    badHabits.forEach(habit => {
      if (!categories[habit.category]) {
        categories[habit.category] = []
      }
      categories[habit.category].push(habit)
    })
    return categories
  }

  const calculateProgress = (current, target) => {
    return Math.min((current / target) * 100, 100)
  }

  const getTotalProgress = () => {
    const totalTarget = goals.reduce((sum, goal) => sum + parseFloat(goal.targetAmount || 0), 0)
    const totalCurrent = goals.reduce((sum, goal) => sum + parseFloat(goal.currentAmount || 0), 0)
    return totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0
  }

  const getCategoryIcon = (category) => {
    const icons = {
      savings: BanknotesIcon,
      investment: ChartBarIcon,
      emergency: ShieldCheckIcon,
      vacation: SunIcon,
      education: AcademicCapIcon
    }
    return icons[category] || BanknotesIcon
  }

  const getCategoryColor = (category) => {
    const colors = {
      savings: 'bg-green-100 text-green-600 border-green-200',
      investment: 'bg-blue-100 text-blue-600 border-blue-200',
      emergency: 'bg-red-100 text-red-600 border-red-200',
      vacation: 'bg-yellow-100 text-yellow-600 border-yellow-200',
      education: 'bg-purple-100 text-purple-600 border-purple-200'
    }
    return colors[category] || 'bg-gray-100 text-gray-600 border-gray-200'
  }

  const getCategoryGradient = (category) => {
    const gradients = {
      savings: 'from-green-400 to-emerald-500',
      investment: 'from-blue-400 to-cyan-500',
      emergency: 'from-red-400 to-pink-500',
      vacation: 'from-yellow-400 to-orange-500',
      education: 'from-purple-400 to-indigo-500'
    }
    return gradients[category] || 'from-gray-400 to-gray-500'
  }

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-2 sm:py-4 lg:py-8">
      {/* Заголовок и статистика */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 space-y-3 sm:space-y-0">
          <h1 className="text-xl sm:text-2xl lg:text-4xl font-bold text-dark">
            Financial Dashboard
          </h1>
          <div className="flex flex-col sm:flex-row gap-2 sm:space-x-3">
            <button
              onClick={() => setShowCharts(!showCharts)}
              className={`flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                showCharts 
                  ? 'bg-primary text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <ChartPieIcon className="w-4 h-4" />
              <span className="hidden sm:inline">{showCharts ? 'Hide' : 'Show'} Analytics</span>
              <span className="sm:hidden">Analytics</span>
            </button>
            <button
              onClick={() => setShowDebugTools(!showDebugTools)}
              className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-xs sm:text-sm"
            >
              <span className="hidden sm:inline">{showDebugTools ? 'Hide' : 'Show'} Debug Tools</span>
              <span className="sm:hidden">Debug</span>
            </button>
          </div>
        </div>
        
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-center space-x-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
              <span className="text-red-700 font-medium">Ошибка:</span>
              <span className="text-red-600">{error}</span>
            </div>
          </div>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <span className="text-blue-700">Загрузка...</span>
            </div>
          </div>
        )}

        {/* Transaction Test */}
        {showTransactionTest && (
          <div className="mb-6">
            <TransactionTest />
          </div>
        )}

        {/* Payment Management */}
        {showPaymentManagement && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-bold text-dark mb-4">Payment Management</h3>
            
            <div className="mb-4">
              <button
                onClick={() => setShowPaymentModal(true)}
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg"
              >
                Add New Payment
              </button>
            </div>

            <div className="space-y-3">
              {mandatoryPayments.map((payment, index) => (
                <div key={index} className={`bg-white border rounded-lg p-4 flex justify-between items-center ${
                  payment.paid ? 'border-green-200 bg-green-50' : 'border-purple-200'
                }`}>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-semibold text-dark">{payment.name}</h4>
                      {payment.paid && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                          Paid
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      Cost: {payment.cost} KZT | Day: {payment.payment_day}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        const updatedPayments = mandatoryPayments.map((p, i) => 
                          i === index ? { ...p, paid: !p.paid } : p
                        )
                        setMandatoryPayments(updatedPayments)
                      }}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        payment.paid 
                          ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
                          : 'bg-green-500 hover:bg-green-600 text-white'
                      }`}
                    >
                      {payment.paid ? 'Mark Unpaid' : 'Mark Paid'}
                    </button>
                    <button
                      onClick={() => handleEditPayment(payment, index)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeletePayment(index)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              
              {mandatoryPayments.length === 0 && (
                <p className="text-gray-500 text-center py-4">No mandatory payments added yet.</p>
              )}
            </div>
          </div>
        )}

        {/* Debug Tools */}
        {showDebugTools && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-bold text-dark mb-4">Debug Tools</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark mb-2">Account Balance</label>
                <input
                  type="number"
                  value={accountBalance}
                  onChange={(e) => setAccountBalance(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-light rounded-lg"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={processMonthlyPayments}
                  className="bg-primary hover:bg-dark-green text-white px-4 py-2 rounded-lg"
                >
                  Process Monthly Payments
                </button>
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={loadData}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg mr-2"
              >
                Reload Data
              </button>
              <button
                onClick={() => setShowTransactionTest(!showTransactionTest)}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
              >
                {showTransactionTest ? 'Hide' : 'Show'} Transaction Test
              </button>
              <button
                onClick={() => setShowPaymentManagement(!showPaymentManagement)}
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg"
              >
                {showPaymentManagement ? 'Hide' : 'Show'} Payment Management
              </button>
              <button
                onClick={async () => {
                  const amount = prompt('Enter amount to topup balance:')
                  if (amount && parseFloat(amount) > 0) {
                    try {
                      const response = await balanceAPI.topupBalance(parseFloat(amount))
                      if (response.success) {
                        await refreshBalance()
                        alert('Balance topped up successfully!')
                      } else {
                        alert('Failed to topup balance')
                      }
                    } catch (err) {
                      alert('Error topping up balance: ' + err.message)
                    }
                  }
                }}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg"
              >
                Topup Balance
              </button>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
          <div className="bg-white rounded-xl p-4 sm:p-6 border border-light shadow-sm">
            <h3 className="text-sm sm:text-lg font-semibold text-dark mb-2">Account Balance</h3>
            <div className="flex items-baseline flex-wrap">
              <span className="text-lg sm:text-2xl font-bold text-primary">{accountBalance.toLocaleString()}</span>
              <span className="text-base sm:text-xl font-bold text-primary ml-1">&#8376;</span>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 sm:p-6 border border-light shadow-sm">
            <h3 className="text-sm sm:text-lg font-semibold text-dark mb-2">Total Goals</h3>
            <p className="text-2xl sm:text-3xl font-bold text-primary">{goals.length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 sm:p-6 border border-light shadow-sm cursor-pointer hover:shadow-md transition-all duration-200" onClick={() => setShowHabitsModal(true)}>
            <h3 className="text-sm sm:text-lg font-semibold text-dark mb-2">Bad Habits</h3>
            <p className="text-2xl sm:text-3xl font-bold text-red-500">{badHabits.length}</p>
            <p className="text-xs sm:text-sm text-gray mt-1">Click for details</p>
          </div>
          <div className="bg-white rounded-xl p-4 sm:p-6 border border-light shadow-sm">
            <h3 className="text-sm sm:text-lg font-semibold text-dark mb-2">Overall Progress</h3>
            <p className="text-2xl sm:text-3xl font-bold text-primary">{getTotalProgress().toFixed(1)}%</p>
          </div>
          <div className="bg-white rounded-xl p-4 sm:p-6 border border-light shadow-sm">
            <h3 className="text-sm sm:text-lg font-semibold text-dark mb-2">Total Target</h3>
            <div className="flex items-baseline flex-wrap">
              <span className="text-lg sm:text-xl font-bold text-primary">
                {goals.reduce((sum, goal) => sum + parseFloat(goal.targetAmount || 0), 0).toLocaleString()}
              </span>
              <span className="text-base sm:text-xl font-bold text-primary ml-1">&#8376;</span>
            </div>
          </div>
        </div>
      </div>

      {/* Переключение между целями и диаграммами */}
      {!showCharts && (
        <div className="mb-6 sm:mb-8">
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full sm:w-auto bg-primary hover:bg-dark-green text-white font-bold py-3 px-4 sm:px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-sm flex items-center justify-center space-x-2"
          >
            <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base">Add Financial Goal</span>
          </button>
        </div>
      )}

      {/* Диаграммы */}
      {showCharts && (
        <ChartsSection 
          goals={goals} 
          badHabits={badHabits} 
          accountBalance={accountBalance}
        />
      )}

      {/* Форма добавления/редактирования */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-md border border-light shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl sm:text-2xl font-bold text-dark mb-4">
              {editingGoal !== null ? 'Edit Goal' : 'Add New Goal'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-dark font-medium mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-4 py-2 bg-white border border-light rounded-lg text-dark placeholder-gray focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Enter goal title"
                  required
                />
              </div>
              <div>
                <label className="block text-dark font-medium mb-2">Target Amount (&#8376;)</label>
                <input
                  type="number"
                  value={formData.targetAmount}
                  onChange={(e) => setFormData({...formData, targetAmount: e.target.value})}
                  className="w-full px-4 py-2 bg-white border border-light rounded-lg text-dark placeholder-gray focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Enter target amount"
                  required
                />
              </div>
              <div>
                <label className="block text-dark font-medium mb-2">Current Amount (&#8376;)</label>
                <input
                  type="number"
                  value={formData.currentAmount}
                  onChange={(e) => setFormData({...formData, currentAmount: e.target.value})}
                  className="w-full px-4 py-2 bg-white border border-light rounded-lg text-dark placeholder-gray focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Enter current amount"
                  required
                />
              </div>
              <div>
                <label className="block text-dark font-medium mb-2">Deadline</label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                  className="w-full px-4 py-2 bg-white border border-light rounded-lg text-dark placeholder-gray focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-dark font-medium mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-4 py-2 bg-white border border-light rounded-lg text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="savings">Savings</option>
                  <option value="investment">Investment</option>
                  <option value="emergency">Emergency Fund</option>
                  <option value="vacation">Vacation</option>
                  <option value="education">Education</option>
                </select>
              </div>
              <div>
                <label className="block text-dark font-medium mb-2">Monthly Cost (&#8376;)</label>
                <input
                  type="number"
                  value={formData.monthlyCost}
                  onChange={(e) => setFormData({...formData, monthlyCost: e.target.value})}
                  className="w-full px-4 py-2 bg-white border border-light rounded-lg text-dark placeholder-gray focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Enter monthly contribution"
                />
              </div>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-primary hover:bg-dark-green disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200"
                >
                  {loading ? 'Saving...' : (editingGoal !== null ? 'Update Goal' : 'Add Goal')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false)
                    setEditingGoal(null)
                    setFormData({
                      title: '',
                      targetAmount: '',
                      currentAmount: '',
                      deadline: '',
                      category: 'savings'
                    })
                  }}
                  className="flex-1 bg-gray hover:bg-gray/80 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Список целей */}
      {!showCharts && (
        <div className="space-y-6">
        {goals.map((goal, index) => {
          const progress = calculateProgress(parseFloat(goal.currentAmount), parseFloat(goal.targetAmount))
          const remaining = parseFloat(goal.targetAmount) - parseFloat(goal.currentAmount)
          const deadlineDate = new Date(goal.deadline * 1000)
          const daysLeft = Math.ceil((deadlineDate - new Date()) / (1000 * 60 * 60 * 24))
          const CategoryIcon = getCategoryIcon(goal.category)
          const categoryColor = getCategoryColor(goal.category)
          const categoryGradient = getCategoryGradient(goal.category)
          
          return (
            <div key={goal.id} className={`relative overflow-hidden bg-white rounded-2xl p-4 sm:p-6 border border-gray-200 hover:shadow-lg transition-all duration-300 shadow-sm animate-slide-in-up group`}>
              {/* Header section */}
              <div className="flex flex-col lg:flex-row lg:items-start justify-between mb-4 gap-4">
                <div className="flex items-start space-x-4 min-w-0 flex-1">
                  <div className={`relative p-2 sm:p-3 rounded-xl ${categoryColor} border shadow-sm flex-shrink-0`}>
                    <CategoryIcon className="w-4 h-4 sm:w-6 sm:h-6" />
                    <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xs sm:text-sm font-bold text-dark mb-2 leading-tight break-words hyphens-auto">{goal.title}</h3>
                    <div className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${categoryColor}`}>
                      {goal.category.charAt(0).toUpperCase() + goal.category.slice(1)}
                    </div>
                  </div>
                </div>
                
                {/* Action buttons */}
                <div className="flex flex-row sm:flex-col space-x-2 sm:space-x-0 sm:space-y-2 flex-shrink-0">
                  <button
                    onClick={() => handleTopup(goal, index)}
                    className="flex-1 sm:flex-none bg-primary hover:bg-dark-green text-white px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 hover:scale-105 flex items-center justify-center space-x-1 shadow-sm"
                  >
                    <CurrencyDollarIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Add</span>
                    <span className="sm:hidden">+</span>
                  </button>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleEdit(goal, index)}
                      className="p-1.5 sm:p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-all duration-200"
                    >
                      <PencilIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(index)}
                      className="p-1.5 sm:p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
                    >
                      <TrashIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Financial metrics grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-4">
                <div className="text-center p-2 sm:p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-xs sm:text-sm text-green-600 font-medium mb-1">Current</div>
                  <div className="text-sm sm:text-lg font-bold text-green-700 break-words">{parseFloat(goal.currentAmount).toLocaleString()} &#8376;</div>
                </div>
                <div className="text-center p-2 sm:p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-xs sm:text-sm text-blue-600 font-medium mb-1">Target</div>
                  <div className="text-sm sm:text-lg font-bold text-blue-700 break-words">{parseFloat(goal.targetAmount).toLocaleString()} &#8376;</div>
                </div>
                <div className="text-center p-2 sm:p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="text-xs sm:text-sm text-orange-600 font-medium mb-1">Remaining</div>
                  <div className="text-sm sm:text-lg font-bold text-orange-700 break-words">{remaining.toLocaleString()} &#8376;</div>
                </div>
                <div className="text-center p-2 sm:p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="text-xs sm:text-sm text-purple-600 font-medium mb-1">Days left</div>
                  <div className={`text-sm sm:text-lg font-bold ${daysLeft < 30 ? 'text-red-500' : daysLeft < 90 ? 'text-yellow-500' : 'text-purple-700'}`}>
                    {daysLeft > 0 ? daysLeft : 'Overdue'}
                  </div>
                </div>
              </div>

              {/* Horizontal Progress Bar with Roadmap */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs sm:text-sm font-medium text-gray-600">Progress</span>
                  <span className={`text-xs sm:text-sm font-bold ${progress === 100 ? 'text-green-500' : 'text-primary'}`}>
                    {progress.toFixed(1)}%
                  </span>
                </div>
                
                {/* Progress Bar Container */}
                <div className="relative">
                  {/* Background Track */}
                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                    {/* Progress Fill */}
                    <div 
                      className={`h-full rounded-full transition-all duration-1500 ease-out ${
                        progress === 100 
                          ? 'bg-gradient-to-r from-green-400 to-green-500' 
                          : 'bg-gradient-to-r from-blue-400 to-blue-500'
                      }`}
                      style={{ 
                        width: `${progress}%`,
                        boxShadow: progress > 0 ? '0 0 10px rgba(59, 130, 246, 0.3)' : 'none'
                      }}
                    />
                  </div>
                  
                  {/* Roadmap Icons */}
                  <div className="absolute top-0 left-0 w-full h-3 flex items-center justify-between">
                    {/* Start Icon */}
                    <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 ${
                      progress > 0 ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-gray-300 text-gray-400'
                    } transition-all duration-500`}>
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    
                    {/* Milestone Icons */}
                    {[25, 50, 75].map((milestone, idx) => (
                      <div key={idx} className={`flex items-center justify-center w-6 h-6 rounded-full border-2 transition-all duration-500 ${
                        progress >= milestone 
                          ? 'bg-green-500 border-green-500 text-white' 
                          : 'bg-white border-gray-300 text-gray-400'
                      }`}>
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ))}
                    
                    {/* End Icon */}
                    <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 ${
                      progress === 100 
                        ? 'bg-green-500 border-green-500 text-white' 
                        : 'bg-white border-gray-300 text-gray-400'
                    } transition-all duration-500`}>
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                {/* Progress Stats */}
                <div className="flex justify-between items-center mt-2 sm:mt-3 text-xs text-gray-500">
                  <span className="hidden sm:inline">Start</span>
                  <span className="sm:hidden">0%</span>
                  <span>25%</span>
                  <span>50%</span>
                  <span>75%</span>
                  <span className="hidden sm:inline">Goal</span>
                  <span className="sm:hidden">100%</span>
                </div>
              </div>

              {/* Monthly cost info */}
              {goal.monthlyCost && parseFloat(goal.monthlyCost) > 0 && (
                <div className="pt-3 sm:pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between p-2 sm:p-3 bg-primary/5 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CalendarDaysIcon className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                      <span className="text-xs sm:text-sm text-primary font-medium">Monthly Contribution</span>
                    </div>
                    <span className="text-sm sm:text-base font-bold text-primary">{parseFloat(goal.monthlyCost).toLocaleString()} &#8376;</span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
        </div>
      )}

      {!showCharts && goals.length === 0 && (
        <div className="text-center py-12 animate-fade-in">
          <div className="text-6xl mb-4 animate-bounce">🎯</div>
          <h3 className="text-2xl font-bold text-dark mb-2">No Financial Goals Yet</h3>
          <p className="text-gray mb-6">Start by adding your first financial goal!</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-primary hover:bg-dark-green text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-sm hover:shadow-lg"
          >
            <PlusIcon className="w-5 h-5 inline mr-2" />
            Create Your First Goal
          </button>
        </div>
      )}

      {/* Модальное окно пополнения */}
      {showTopupModal && selectedGoal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-md border border-light shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg sm:text-2xl font-bold text-dark mb-4">
              Add Money to "{selectedGoal.goal.title}"
            </h2>
            <div className="mb-4">
              <label className="block text-dark font-medium mb-2">Amount (&#8376;)</label>
              <input
                type="number"
                value={topupAmount}
                onChange={(e) => setTopupAmount(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-light rounded-lg text-dark placeholder-gray focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="Enter amount to add"
              />
              <p className="text-sm text-gray mt-1">
                Available balance: {accountBalance.toLocaleString()} &#8376;
              </p>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <button
                onClick={confirmTopup}
                disabled={loading}
                className="flex-1 bg-primary hover:bg-dark-green disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200"
              >
                {loading ? 'Adding...' : 'Add Money'}
              </button>
              <button
                onClick={() => {
                  setShowTopupModal(false)
                  setTopupAmount('')
                  setSelectedGoal(null)
                }}
                className="flex-1 bg-gray hover:bg-gray/80 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно плохих привычек */}
      {showHabitsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-4xl max-h-[90vh] border border-light shadow-xl overflow-y-auto">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-2xl font-bold text-dark">
                Bad Habits Analysis
              </h2>
              <button
                onClick={() => setShowHabitsModal(false)}
                className="text-gray-500 hover:text-gray-700 text-xl sm:text-2xl"
              >
                ×
              </button>
            </div>
            
            {/* Общая статистика */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
                <h3 className="text-sm sm:text-lg font-semibold text-red-600 mb-1">Total Habits</h3>
                <p className="text-xl sm:text-2xl font-bold text-red-600">{badHabits.length}</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
                <h3 className="text-sm sm:text-lg font-semibold text-red-600 mb-1">Monthly Cost</h3>
                <p className="text-xl sm:text-2xl font-bold text-red-600">{getTotalHabitsCost().toLocaleString()} &#8376;</p>
              </div>
            </div>

            {/* Детальная информация по категориям */}
            <div className="space-y-4 sm:space-y-6">
              {Object.entries(getHabitsByCategory()).map(([category, habits]) => (
                <div key={category} className="border border-light rounded-lg p-3 sm:p-4">
                  <h3 className="text-base sm:text-lg font-semibold text-dark mb-2 sm:mb-3">{category}</h3>
                  <div className="space-y-2 sm:space-y-3">
                    {habits.map(habit => (
                      <div key={habit.id} className="bg-gray-50 rounded-lg p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 space-y-2 sm:space-y-0">
                          <div className="flex-1">
                            <h4 className="text-sm sm:text-base font-semibold text-dark">{habit.name}</h4>
                            <p className="text-xs sm:text-sm text-gray">{habit.description}</p>
                          </div>
                          <div className="text-left sm:text-right">
                            <p className="text-base sm:text-lg font-bold text-red-600">{habit.monthlyCost.toLocaleString()} &#8376;/month</p>
                            <p className="text-xs sm:text-sm text-gray">{habit.frequency}</p>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs sm:text-sm text-gray">Annual impact: {(habit.monthlyCost * 12).toLocaleString()} &#8376;</span>
                        </div>
                        {habit.products && habit.products.length > 0 && (
                          <div className="mt-2 sm:mt-3">
                            <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">Products/Services:</p>
                            <div className="flex flex-wrap gap-1 sm:gap-2">
                              {habit.products.map((product, index) => (
                                <span key={index} className="bg-blue-100 text-blue-800 text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                                  {product}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Рекомендации */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-600 mb-2">💡 Recommendations</h3>
              {badHabitsRecommendations ? (
                <div className="text-sm text-blue-700 prose prose-sm max-w-none prose-blue">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeSanitize]}
                  >
                    {badHabitsRecommendations}
                  </ReactMarkdown>
                </div>
              ) : (
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Consider reducing coffee purchases by 50% to save {Math.round(getTotalHabitsCost() * 0.15).toLocaleString()} &#8376;/month</li>
                  <li>• Use public transport more often to save {Math.round(getTotalHabitsCost() * 0.2).toLocaleString()} &#8376;/month</li>
                  <li>• Cancel unused subscriptions to save {Math.round(getTotalHabitsCost() * 0.1).toLocaleString()} &#8376;/month</li>
                  <li>• Cook at home more often to save {Math.round(getTotalHabitsCost() * 0.3).toLocaleString()} &#8376;/month</li>
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-dark mb-4">
              {editingPayment !== null ? 'Edit Payment' : 'Add New Payment'}
            </h3>
            
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark mb-2">Payment Name</label>
                <input
                  type="text"
                  value={paymentFormData.name}
                  onChange={(e) => setPaymentFormData({...paymentFormData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-light rounded-lg"
                  placeholder="e.g., Rent, Utilities, Insurance"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-dark mb-2">Cost (KZT)</label>
                <input
                  type="number"
                  value={paymentFormData.cost}
                  onChange={(e) => setPaymentFormData({...paymentFormData, cost: e.target.value})}
                  className="w-full px-3 py-2 border border-light rounded-lg"
                  placeholder="15000"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-dark mb-2">Payment Day (1-31)</label>
                <input
                  type="number"
                  value={paymentFormData.payment_day}
                  onChange={(e) => setPaymentFormData({...paymentFormData, payment_day: e.target.value})}
                  className="w-full px-3 py-2 border border-light rounded-lg"
                  placeholder="15"
                  min="1"
                  max="31"
                  required
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="paid"
                  checked={paymentFormData.paid}
                  onChange={(e) => setPaymentFormData({...paymentFormData, paid: e.target.checked})}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <label htmlFor="paid" className="text-sm text-dark">
                  Mark as paid
                </label>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-lg disabled:opacity-50"
                >
                  {loading ? 'Saving...' : (editingPayment !== null ? 'Update' : 'Create')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentModal(false)
                    setEditingPayment(null)
                    setPaymentFormData({name: '', cost: '', payment_day: '', paid: false})
                  }}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Notifications */}
      {mandatoryPayments.length > 0 && (
        <div className="fixed bottom-4 right-4 z-40 space-y-2">
          {mandatoryPayments.map((payment, index) => {
            // Показываем уведомления только для неоплаченных платежей
            if (payment.paid) return null
            
            const today = new Date().getDate()
            const paymentDay = parseInt(payment.payment_day)
            const daysUntilPayment = paymentDay - today
            const isOverdue = daysUntilPayment < 0
            const isDueToday = daysUntilPayment === 0
            const isDueSoon = daysUntilPayment > 0 && daysUntilPayment <= 3
            
            if (isOverdue || isDueToday || isDueSoon) {
              return (
                <div
                  key={index}
                  className={`bg-white border-l-4 rounded-lg shadow-lg p-4 max-w-sm ${
                    isOverdue ? 'border-red-500' : 
                    isDueToday ? 'border-yellow-500' : 
                    'border-blue-500'
                  }`}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      {isOverdue ? (
                        <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
                      ) : isDueToday ? (
                        <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />
                      ) : (
                        <ExclamationTriangleIcon className="w-5 h-5 text-blue-500" />
                      )}
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {payment.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {payment.cost} KZT
                      </p>
                      <p className={`text-xs ${
                        isOverdue ? 'text-red-600' : 
                        isDueToday ? 'text-yellow-600' : 
                        'text-blue-600'
                      }`}>
                        {isOverdue ? `Overdue by ${Math.abs(daysUntilPayment)} day(s)` :
                         isDueToday ? 'Due today!' :
                         `Due in ${daysUntilPayment} day(s)`}
                      </p>
                      <button
                        onClick={() => {
                          const updatedPayments = mandatoryPayments.map((p, i) => 
                            i === index ? { ...p, paid: true } : p
                          )
                          setMandatoryPayments(updatedPayments)
                        }}
                        className="mt-2 bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                      >
                        Mark as Paid
                      </button>
                    </div>
                  </div>
                </div>
              )
            }
            return null
          })}
        </div>
      )}
    </div>
  )
}

export default MainPage
