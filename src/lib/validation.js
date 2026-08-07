export const validateName = (name) => {
  if (!name.trim()) return 'Please enter your name.'
  if (name.trim().length < 2) return 'Name must be at least 2 characters.'
  return ''
}

export const validateEmail = (email) => {
  if (!email.trim()) return 'Please enter your email.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
    return 'Please enter a valid email address.'
  return ''
}

export const validatePassword = (password) => {
  if (!password) return 'Please enter a password.'
  if (password.length < 8) return 'Password must be at least 8 characters.'
  if (!/[A-Z]/.test(password)) return 'Add at least one uppercase letter.'
  if (!/[0-9]/.test(password)) return 'Add at least one number.'
  return ''
}

export const passwordStrength = (password) => {
  if (!password) return { score: 0, label: '' }
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  return { score, label: ['Very weak', 'Weak', 'Fair', 'Good', 'Strong'][score] }
}
