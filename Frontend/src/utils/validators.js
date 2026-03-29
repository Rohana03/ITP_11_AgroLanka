/**
 * AgroLanka – Shared Input Validators
 * Reusable pure functions for all form validation.
 */

/** Basic RFC-style email check */
export const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !email.trim()) return 'Email is required.';
    if (!re.test(email.trim())) return 'Please enter a valid email address.';
    return null; // null = valid
};

/**
 * SL NIC – Two accepted formats:
 *  Old: 9 digits followed by V or X  (e.g. 881234567V)
 *  New: 12 digits                      (e.g. 198812345678)
 */
export const validateNIC = (nic) => {
    if (!nic || !nic.trim()) return 'NIC is required.';
    const cleaned = nic.trim().toUpperCase();
    const old = /^\d{9}[VX]$/;
    const newFormat = /^\d{12}$/;
    if (!old.test(cleaned) && !newFormat.test(cleaned)) {
        return 'Invalid NIC. Use old format (9 digits + V/X) or new format (12 digits).';
    }
    return null;
};

/**
 * Sri Lanka mobile numbers – must start with 07 and be exactly 10 digits.
 * Accepts optional leading + or country code 94.
 */
export const validatePhone = (phone) => {
    if (!phone || !phone.trim()) return null; // phone is optional in most forms
    const digits = phone.trim().replace(/[\s\-]/g, '');
    // Allow +94XXXXXXXXX or 94XXXXXXXXX or 07XXXXXXXX
    const re = /^(\+94|94)?0?7\d{8}$/;
    if (!re.test(digits)) {
        return 'Invalid phone number. Use Sri Lanka format (e.g. 0712345678).';
    }
    return null;
};

/**
 * Password strength:
 *  - At least 8 characters
 *  - At least one digit
 *  - At least one letter
 */
export const validatePassword = (password) => {
    if (!password) return 'Password is required.';
    if (password.length < 8) return 'Password must be at least 8 characters.';
    if (!/\d/.test(password)) return 'Password must contain at least one number.';
    if (!/[a-zA-Z]/.test(password)) return 'Password must contain at least one letter.';
    return null;
};

/** Generic "required" check */
export const required = (value, label = 'This field') => {
    if (!value || !String(value).trim()) return `${label} is required.`;
    return null;
};

/**
 * Price validation – must be a positive number.
 */
export const validatePrice = (price) => {
    const n = Number(price);
    if (!price && price !== 0) return 'Price is required.';
    if (isNaN(n) || n <= 0) return 'Price must be greater than 0.';
    return null;
};

/**
 * Image file validation – max size in bytes.
 */
export const validateImageFile = (file, maxMB = 2) => {
    if (!file) return 'Please select an image.';
    if (file.size > maxMB * 1024 * 1024) return `Image must be under ${maxMB} MB.`;
    return null;
};

/**
 * Card number – exactly 16 digits (spaces stripped).
 */
export const validateCardNumber = (number) => {
    const digits = number.replace(/\s/g, '');
    if (!digits) return 'Card number is required.';
    if (!/^\d{16}$/.test(digits)) return 'Card number must be 16 digits.';
    return null;
};

/**
 * Expiry MM/YY – must be a valid future date.
 */
export const validateExpiry = (expiry) => {
    if (!expiry) return 'Expiry date is required.';
    if (!/^\d{2}\/\d{2}$/.test(expiry)) return 'Use MM/YY format (e.g. 08/27).';
    const [mm, yy] = expiry.split('/').map(Number);
    if (mm < 1 || mm > 12) return 'Invalid month.';
    const now = new Date();
    const expiryDate = new Date(2000 + yy, mm - 1, 1);
    if (expiryDate < new Date(now.getFullYear(), now.getMonth(), 1)) {
        return 'Card has expired.';
    }
    return null;
};

/**
 * CVV – exactly 3 digits.
 */
export const validateCVV = (cvv) => {
    if (!cvv) return 'CVV is required.';
    if (!/^\d{3}$/.test(cvv)) return 'CVV must be 3 digits.';
    return null;
};
