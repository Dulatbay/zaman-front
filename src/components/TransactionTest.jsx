import React, { useState, useEffect } from 'react'
import { transactionsAPI } from '../services/api'

const TransactionTest = () => {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const testAPI = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await transactionsAPI.getAllTransactions()
      console.log('Full API Response:', response)
      setTransactions(Array.isArray(response) ? response : [])
    } catch (err) {
      console.error('API Error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    testAPI()
  }, [])

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Transaction API Test</h2>
      
      <button 
        onClick={testAPI}
        disabled={loading}
        className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg mb-4"
      >
        {loading ? 'Loading...' : 'Test API'}
      </button>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-600">Error: {error}</p>
        </div>
      )}

      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Transactions Count: {transactions.length}</h3>
      </div>

      {transactions.length > 0 && (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {transactions.slice(0, 10).map((transaction, index) => (
            <div key={index} className="bg-gray-50 p-3 rounded-lg">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><strong>Date:</strong> {transaction.date}</div>
                <div><strong>Amount:</strong> {transaction.amount} {transaction.currency}</div>
                <div><strong>Type:</strong> {transaction.type}</div>
                <div><strong>Details:</strong> {transaction.details}</div>
                <div><strong>Transaction ID:</strong> {transaction.transaction_id}</div>
                <div><strong>User ID:</strong> {transaction.user_id}</div>
              </div>
            </div>
          ))}
          {transactions.length > 10 && (
            <p className="text-gray-500 text-center">... and {transactions.length - 10} more transactions</p>
          )}
        </div>
      )}
    </div>
  )
}

export default TransactionTest
