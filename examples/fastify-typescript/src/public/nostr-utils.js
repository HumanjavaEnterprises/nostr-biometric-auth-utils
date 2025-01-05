/**
 * Browser-compatible utilities for nostr-biometric-login
 */

/**
 * Convert npub to hex public key
 * @param {string} npub The npub to convert
 */
export function npubToHex(npub) {
    console.log('🔍 Starting npub conversion:', npub);
    
    if (!npub.startsWith('npub1')) {
        throw new Error('Invalid npub format - must start with npub1');
    }

    // Remove the npub1 prefix
    const data = npub.slice(5);
    console.log('📝 Data after removing prefix:', data);

    // Decode the base32 string
    try {
        const decoded = base32ToBytes(data);
        console.log('🔄 Decoded bytes:', decoded);

        // Remove the checksum (last 4 bytes)
        const pubkeyBytes = decoded.slice(0, -4);
        console.log('✂️ Pubkey bytes (without checksum):', pubkeyBytes);

        // Convert to hex
        const hex = bytesToHex(pubkeyBytes);
        console.log('✅ Final hex:', hex);
        
        return hex;
    } catch (error) {
        console.error('❌ Error during conversion:', error);
        throw new Error('Invalid npub format: ' + error.message);
    }
}

/**
 * Convert base32 string to bytes
 * @param {string} str Base32 string
 */
function base32ToBytes(str) {
    const alphabet = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
    const bytes = [];
    let val = 0;
    let bits = 0;

    for (let i = 0; i < str.length; i++) {
        const c = str.charAt(i);
        const v = alphabet.indexOf(c);
        if (v === -1) {
            throw new Error('Invalid character: ' + c);
        }
        val = (val << 5) | v;
        bits += 5;
        
        if (bits >= 8) {
            bits -= 8;
            bytes.push((val >> bits) & 0xff);
        }
    }

    return new Uint8Array(bytes);
}

/**
 * Convert bytes to hex string
 * @param {Uint8Array} bytes Bytes to convert
 */
function bytesToHex(bytes) {
    return Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

/**
 * Generate a random string of specified length
 * @param {number} length Length of the random string
 */
export function generateRandomString(length) {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return bytesToHex(bytes);
}
