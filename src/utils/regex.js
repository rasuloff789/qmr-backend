function checkUzPhoneInt(input) {
  const digits = input.toString();

  if (digits.length === 9) {
    // oldiga 998 qo‘shish
    const normalized = '998' + digits;
    return { valid: true, normalized };
  }

  if (digits.length === 12 && digits.startsWith('998')) {
    // to‘liq xalqaro format
    return { valid: true, normalized: digits };
  }

  // boshqa formatlar rad
  return { valid: false, reason: 'Raqam formati noto‘g‘ri. Kutilgan: 9 xonali mahalliy yoki 12 xonali 998 bilan boshlanadigan.' };
}

function checkTurkeyPhoneInt(input) {

  const digits = input.toString();

  // Mahalliy: 10 xonali, 5XXYYYYYYY
  if (digits.length === 10 && digits.startsWith('5')) {
    // oldiga 90 qo‘shib xalqaro formatga o'tkazamiz
    const normalized = '90' + digits;
    return { valid: true, normalized };
  }

  // Xalqaro: 12 xonali, 90XXXXXXXXXX
  if (digits.length === 12 && digits.startsWith('90')) {
    return { valid: true, normalized: digits };
  }

  return { valid: false, reason: 'Raqam formati noto‘g‘ri. Kutilgan: 10 xonali mahalliy (5XXYYYYYYY) yoki 12 xonali xalqaro (90XXXXXXXXXX).' };
}

function checkTelegramUsername(username) {
  const raw = username.trim();

  // Regex: @ optional, 5-32 belgi, harf/raqam/_ faqat
  const regex = /^(?!.*\s)@?[a-zA-Z0-9_]{5,32}$/;

  if (!regex.test(raw)) {
    return { valid: false, reason: 'Noto‘g‘ri format. Telegram username faqat harflar, raqamlar va "_" belgisidan iborat, uzunligi 5–32.' };
  }

  // Agar kerak bo‘lsa, oldidagi @ ni olib tashlash va normalized qilish
  const normalized = raw.startsWith('@') ? raw.slice(1) : raw;

  return { valid: true, normalized };
}

function checkUsername(username) {
  
  const regex = /^(?!.*\s)[a-z0-9]{4,10}$/;

  if (!regex.test(username)) {
    return { valid: false, reason: 'Username faqat kichik harflar va raqamdan iborat bo‘lishi kerak, uzunligi 4–10.' };
  }

  return { valid: true, normalized: username };
}

function isValidBirthdate(dateStr) {
  // YYYY-MM-DD formatini tekshiradi
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;

  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

function isValidPassword(password) {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{5,10}$/;
  return regex.test(password);
}

export { checkTelegramUsername, checkUzPhoneInt, checkTurkeyPhoneInt, checkUsername, isValidBirthdate, isValidPassword };