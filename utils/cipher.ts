// A lightweight XOR cipher with a validation tripwire

export const encryptPayload = (text: string, key: string) => {
  // Prepend a hidden signature to verify correct decryption later
  const textToEncode = encodeURIComponent("SECURE::" + text);
  let result = '';
  for (let i = 0; i < textToEncode.length; i++) {
    result += String.fromCharCode(textToEncode.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return btoa(result);
};

export const decryptPayload = (hash: string, key: string) => {
  try {
    const decoded = atob(hash);
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    
    const unescaped = decodeURIComponent(result);
    
    // Check if our validation tripwire survived the decryption
    if (unescaped.startsWith("SECURE::")) {
      return unescaped.replace("SECURE::", ""); // Strip the tripwire and return actual text
    } else {
      return "ERR_INVALID_CIPHER"; // The math worked, but the password was wrong
    }
  } catch (error) {
    console.error("Error in deciphering", error)
    return "ERR_INVALID_CIPHER";
  }
};