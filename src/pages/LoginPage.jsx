import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserIcon, LockClosedIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../contexts/AuthContext'
import { getUserByID } from '../services/api'

const LoginPage = () => {
  const [formData, setFormData] = useState({
    userId: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Очищаем ошибку при изменении полей
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Валидация
      if (!formData.userId.trim()) {
        setError('Пожалуйста, введите User ID')
        return
      }
      if (!formData.password.trim()) {
        setError('Пожалуйста, введите пароль')
        return
      }

      // Отправляем запрос на получение пользователя
      const response = await getUserByID(formData.userId)
      
      if (response.success && response.data) {
        // Пользователь найден - используем контекст для входа
        login(formData.userId)
        navigate('/')
      } else {
        // Пользователь не найден
        setError('Пользователь с таким ID не существует')
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('Ошибка при входе в систему. Попробуйте позже.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-white to-light-green/10 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        {/* Логотип и заголовок */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <UserIcon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-dark mb-2">ZAMAN Finance</h1>
          <p className="text-sm sm:text-base text-gray">Войдите в свой аккаунт</p>
        </div>

        {/* Форма логина */}
        <div className="bg-white rounded-2xl shadow-xl border border-light p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* User ID поле */}
            <div>
              <label htmlFor="userId" className="block text-sm font-medium text-dark mb-2">
                User ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="userId"
                  name="userId"
                  type="text"
                  value={formData.userId}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-light rounded-xl text-dark placeholder-gray focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
                  placeholder="Введите ваш User ID"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Поле пароля */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-dark mb-2">
                Пароль
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-12 py-3 border border-light rounded-xl text-dark placeholder-gray focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
                  placeholder="Введите пароль"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Сообщение об ошибке */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-red-700 text-sm">{error}</span>
                </div>
              </div>
            )}

            {/* Кнопка входа */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-dark-green disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 shadow-lg disabled:shadow-none"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Вход...</span>
                </div>
              ) : (
                'Войти'
              )}
            </button>
          </form>

          {/* Дополнительная информация */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray">
              Нет аккаунта?{' '}
              <span className="text-primary font-medium cursor-pointer hover:text-dark-green transition-colors">
                Свяжитесь с администратором
              </span>
            </p>
          </div>
        </div>

        {/* Демо информация */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Демо режим</h3>
          <p className="text-xs text-blue-700">
            Для тестирования используйте любой User ID и пароль. 
            Система проверит существование пользователя в базе данных.
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
