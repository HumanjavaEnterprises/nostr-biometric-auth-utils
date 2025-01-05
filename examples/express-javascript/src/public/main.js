// Initialize WebAuthn client
const webAuthnClient = new WebAuthnClient({
  rpName: 'Nostr Biometric Login',
  rpId: window.location.hostname
});

// DOM elements
const npubInput = document.getElementById('npubInput');
const fetchProfileBtn = document.getElementById('fetchProfileBtn');
const registerButton = document.getElementById('registerButton');
const loginButton = document.getElementById('loginButton');
const statusDiv = document.getElementById('status');
const profileCard = document.getElementById('profileCard');
const profileImage = document.getElementById('profileImage');
const profileName = document.getElementById('profileName');
const profileNpub = document.getElementById('profileNpub');
const magicLinkDiv = document.getElementById('magicLink');
const webauthnSupportDiv = document.getElementById('webauthnSupport');

// Current profile state
let currentProfile = null;

// Helper functions
function showError(message) {
  statusDiv.className = 'status error';
  statusDiv.textContent = message;
}

function showSuccess(message) {
  statusDiv.className = 'status success';
  statusDiv.textContent = message;
}

function clearStatus() {
  statusDiv.className = 'status';
  statusDiv.textContent = '';
}

function showMagicLink(link) {
  magicLinkDiv.textContent = `Magic Link: ${link}`;
  magicLinkDiv.classList.add('visible');
}

function hideMagicLink() {
  magicLinkDiv.classList.remove('visible');
}

function updateProfileDisplay(profile) {
  if (profile) {
    profileImage.src = profile.picture || 'https://robohash.org/' + profile.pubkey;
    profileName.textContent = profile.name || 'Anonymous';
    profileNpub.textContent = profile.pubkey;
    profileCard.classList.add('visible');
  } else {
    profileCard.classList.remove('visible');
  }
}

// Check WebAuthn support
async function checkWebAuthnSupport() {
  const isSupported = webAuthnClient.isSupported();
  const isAvailable = await webAuthnClient.isAvailable();
  
  webauthnSupportDiv.innerHTML = `
    <p>WebAuthn Support: ${isSupported ? '✅' : '❌'}</p>
    <p>Platform Authenticator: ${isAvailable ? '✅' : '❌'}</p>
  `;
  
  registerButton.disabled = !isSupported || !isAvailable;
  loginButton.disabled = !isSupported || !isAvailable;
}

// Fetch profile
async function fetchProfile() {
  clearStatus();
  hideMagicLink();
  
  try {
    const npub = npubInput.value.trim();
    if (!npub) {
      throw new Error('Please enter your npub');
    }

    const response = await fetch('/npub-to-hex', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ npub })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to convert npub');
    }
    
    const { pubkey, profile } = await response.json();
    currentProfile = { ...profile, pubkey };
    updateProfileDisplay(currentProfile);
    
    showSuccess('Profile fetched successfully!');
  } catch (error) {
    showError(error.message);
    currentProfile = null;
    updateProfileDisplay(null);
  }
}

// Register handler
async function handleRegistration() {
  clearStatus();
  hideMagicLink();
  
  try {
    if (!currentProfile || !currentProfile.pubkey) {
      throw new Error('Please fetch your profile first by entering your npub');
    }

    // Get challenge from server
    const challengeResponse = await fetch('/auth/webauthn/register/challenge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentProfile.pubkey })
    });
    
    if (!challengeResponse.ok) {
      const error = await challengeResponse.json();
      throw new Error(error.error || 'Failed to get challenge');
    }
    
    const { challenge } = await challengeResponse.json();
    
    // Register with WebAuthn
    const credential = await webAuthnClient.register(
      challenge,
      currentProfile.pubkey,
      currentProfile.name || 'Anonymous'
    );
    
    // Verify registration with server
    const verifyResponse = await fetch('/auth/webauthn/register/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentProfile.pubkey,
        credential
      })
    });
    
    if (!verifyResponse.ok) {
      const error = await verifyResponse.json();
      throw new Error(error.error || 'Failed to verify registration');
    }
    
    const { success } = await verifyResponse.json();
    if (success) {
      showSuccess('Registration successful! You can now login.');
    } else {
      throw new Error('Registration failed');
    }
  } catch (error) {
    showError(error.message);
  }
}

// Login handler
async function handleLogin() {
  clearStatus();
  hideMagicLink();
  
  try {
    if (!currentProfile || !currentProfile.pubkey) {
      throw new Error('Please fetch your profile first by entering your npub');
    }

    // Get challenge from server
    const challengeResponse = await fetch('/auth/webauthn/authenticate/challenge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentProfile.pubkey })
    });
    
    if (!challengeResponse.ok) {
      const error = await challengeResponse.json();
      throw new Error(error.error || 'Failed to get challenge');
    }
    
    const { challenge } = await challengeResponse.json();
    
    // Authenticate with WebAuthn
    const credential = await webAuthnClient.authenticate(challenge);
    
    // Verify authentication with server
    const verifyResponse = await fetch('/auth/webauthn/authenticate/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentProfile.pubkey,
        credential
      })
    });
    
    if (!verifyResponse.ok) {
      const error = await verifyResponse.json();
      throw new Error(error.error || 'Failed to verify authentication');
    }
    
    const { success } = await verifyResponse.json();
    if (success) {
      showSuccess('Login successful!');
    } else {
      throw new Error('Login failed');
    }
  } catch (error) {
    showError(error.message);
  }
}

// Event listeners
fetchProfileBtn.addEventListener('click', fetchProfile);
registerButton.addEventListener('click', handleRegistration);
loginButton.addEventListener('click', handleLogin);

// Initialize
checkWebAuthnSupport();
