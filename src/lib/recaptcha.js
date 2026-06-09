/**
 * Utility to execute Google reCAPTCHA v3 and retrieve a token.
 * @param {string} action - The action name (e.g., 'login', 'signup')
 * @returns {Promise<string|null>} - The reCAPTCHA token, or null if it fails
 */
export const executeRecaptcha = async (action) => {
  try {
    if (typeof window === 'undefined' || !window.grecaptcha) {
      console.warn('reCAPTCHA not loaded.');
      return null;
    }

    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    if (!siteKey || siteKey === 'YOUR_RECAPTCHA_SITE_KEY') {
      console.warn('reCAPTCHA site key not configured.');
      return null; // Bypass in dev if not configured
    }

    return new Promise((resolve) => {
      window.grecaptcha.ready(async () => {
        try {
          const token = await window.grecaptcha.execute(siteKey, { action });
          resolve(token);
        } catch (err) {
          console.error('Error executing reCAPTCHA:', err);
          resolve(null);
        }
      });
    });
  } catch (error) {
    console.error('reCAPTCHA wrapper error:', error);
    return null;
  }
};
