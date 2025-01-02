// WebAuthn configuration settings
export const config = {
    // Application settings
    app: {
        name: "NostrWalletAuth Demo",
        origin: "https://TravelLaptop.local:3000",
        id: "nostr.walletauth.demo"
    },

    // Server settings
    server: {
        port: 3000,
        host: '0.0.0.0',
        https: {
            enabled: true,
            cert: './proof_of_concept/cert.pem',
            key: './proof_of_concept/key.pem'
        }
    },

    // Nostr settings
    nostr: {
        defaultRelays: [
            "wss://relay.damus.io",
            "wss://nos.lol",
            "wss://relay.nostr.band",
            "wss://relay.snort.social"
        ],
        relayTimeout: 5000,
        privateKey: process.env.NOSTR_PRIVATE_KEY || 'your-private-key-here'
    },

    // WebAuthn settings
    webauthn: {
        // Relying Party settings
        rp: {
            name: "NostrWalletAuth Demo",
            id: "TravelLaptop.local"
        },
        // Authenticator settings
        authenticator: {
            attachment: null, // Allow any authenticator type
            residentKey: "preferred", // Make resident key optional
            userVerification: "preferred", // Make user verification optional
            timeout: 60000
        }
    }
};
