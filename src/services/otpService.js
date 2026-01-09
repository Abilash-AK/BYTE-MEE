const OTP_KEY = 'colearn_otp_codes';

const readStore = () => {
  try {
    return JSON.parse(localStorage.getItem(OTP_KEY) || '{}');
  } catch (e) {
    return {};
  }
};

const writeStore = (data) => localStorage.setItem(OTP_KEY, JSON.stringify(data));

export const sendOtp = (email) => {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const store = readStore();
  store[email] = { code, expiresAt: Date.now() + 5 * 60 * 1000 };
  writeStore(store);
  return code; // For demo we surface the code so the user can enter it locally.
};

export const verifyOtp = (email, code) => {
  const store = readStore();
  const entry = store[email];
  if (!entry) return false;
  const isValid = entry.code === code && Date.now() < entry.expiresAt;
  if (isValid) {
    delete store[email];
    writeStore(store);
  }
  return isValid;
};
