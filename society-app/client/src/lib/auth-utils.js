const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SUSPICIOUS_DOMAINS = [
  'tempmail.com', 'throwaway.email', 'guerrillamail.com', 'mailinator.com',
  '10minutemail.com', 'trashmail.com', 'fakeinbox.com', 'yopmail.com',
  'getnada.com', 'sharklasers.com', 'spam4.me', 'grr.la', 'maildrop.cc'
];

export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return { valid: false, message: 'Email is required' };
  }
  
  const trimmed = email.trim().toLowerCase();
  
  if (trimmed.length === 0) {
    return { valid: false, message: 'Email is required' };
  }
  
  if (!EMAIL_REGEX.test(trimmed)) {
    return { valid: false, message: 'Please enter a valid email address' };
  }
  
  const domain = trimmed.split('@')[1]?.toLowerCase();
  if (SUSPICIOUS_DOMAINS.includes(domain)) {
    return { valid: false, message: 'Please use a permanent email address' };
  }
  
  return { valid: true, message: '' };
};

export const validatePassword = (password) => {
  if (!password) {
    return { valid: false, message: 'Password is required' };
  }
  
  if (password.length < 6) {
    return { valid: false, message: 'Password must be at least 6 characters' };
  }
  
  return { valid: true, message: '' };
};

export const validatePhone = (phone) => {
  if (!phone) {
    return { valid: false, message: 'Phone number is required' };
  }
  
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 10) {
    return { valid: false, message: 'Please enter a valid 10-digit phone number' };
  }
  
  return { valid: true, message: '' };
};

export const validateName = (name) => {
  if (!name || typeof name !== 'string') {
    return { valid: false, message: 'Name is required' };
  }
  
  const trimmed = name.trim();
  if (trimmed.length < 2) {
    return { valid: false, message: 'Please enter your full name (at least 2 characters)' };
  }
  
  if (trimmed.length > 100) {
    return { valid: false, message: 'Name is too long (max 100 characters)' };
  }
  
  if (/^\d+$/.test(trimmed)) {
    return { valid: false, message: 'Name cannot contain only numbers' };
  }
  
  return { valid: true, message: '' };
};

export const formatAuthError = (error) => {
  if (!error) return 'An unexpected error occurred';
  
  const message = error.message || error.toString();
  
  if (message.includes('429') || message.includes('rate limit')) {
    return 'Too many requests. Please wait a moment and try again.';
  }
  
  if (message.includes('Invalid login credentials')) {
    return 'Invalid email or password. Please check your credentials and try again.';
  }
  
  if (message.includes('User not found') || message.includes('No user found')) {
    return 'No account found with this email. Please sign up first.';
  }
  
  if (message.includes('Email already registered') || message.includes('already exists') || message.includes('duplicate')) {
    return 'An account with this email already exists. Please sign in instead.';
  }
  
  if (message.includes('Password') && message.includes('weak')) {
    return 'Please choose a stronger password';
  }
  
  if (message.includes('Network') || message.includes('fetch') || message.includes('connection')) {
    return 'Network error. Please check your internet connection and try again.';
  }
  
  if (message.includes('Sign up is disabled') || message.includes('sign-up disabled')) {
    return 'Sign up is currently disabled. Please contact support.';
  }
  
  return message;
};

export const isRateLimitedError = (error) => {
  if (!error) return false;
  const message = error.message || error.toString();
  return message.includes('429') || message.includes('rate limit') || message.includes('Too many requests');
};

export const isExistingUserError = (error) => {
  if (!error) return false;
  const message = error.message || error.toString();
  return message.includes('already registered') || message.includes('already exists') || message.includes('duplicate') || message.includes('422');
};

export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const debounce = (fn, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

export const throttle = (fn, limit) => {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};