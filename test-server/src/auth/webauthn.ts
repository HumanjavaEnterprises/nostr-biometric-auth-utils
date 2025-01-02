import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse
} from '@simplewebauthn/server';
import type { 
  GenerateRegistrationOptionsOpts,
  VerifyRegistrationResponseOpts,
  GenerateAuthenticationOptionsOpts,
  VerifyAuthenticationResponseOpts
} from '@simplewebauthn/server';
import { Request, Response } from 'express';

export class WebAuthnHandler {
  private rpName = 'Nostr Wallet Test';
  private rpID = 'localhost';
  private origin = 'http://localhost:3000';
  
  // In-memory storage for demo (use proper storage in production)
  private authenticators: Map<string, any> = new Map();
  private challenges: Map<string, string> = new Map();

  /**
   * Get registration options
   */
  getRegistrationOptions = async (req: Request, res: Response) => {
    const { username, deviceName } = req.body;
    
    try {
      const options = await generateRegistrationOptions({
        rpName: this.rpName,
        rpID: this.rpID,
        userID: username,
        userName: username,
        userDisplayName: deviceName,
        attestationType: 'direct',
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'required'
        }
      });

      // Save challenge for verification
      this.challenges.set(username, options.challenge);

      res.json(options);
    } catch (error) {
      console.error('Registration options error:', error);
      res.status(500).json({ error: 'Failed to generate registration options' });
    }
  };

  /**
   * Verify registration response
   */
  verifyRegistration = async (req: Request, res: Response) => {
    const { username, response } = req.body;
    
    try {
      const expectedChallenge = this.challenges.get(username);
      if (!expectedChallenge) {
        throw new Error('Challenge not found');
      }

      const verification = await verifyRegistrationResponse({
        response,
        expectedChallenge,
        expectedOrigin: this.origin,
        expectedRPID: this.rpID
      });

      if (verification.verified) {
        // Store the authenticator
        this.authenticators.set(username, verification.registrationInfo);
        this.challenges.delete(username);
      }

      res.json({ verified: verification.verified });
    } catch (error) {
      console.error('Registration verification error:', error);
      res.status(500).json({ error: 'Failed to verify registration' });
    }
  };

  /**
   * Get authentication options
   */
  getAuthenticationOptions = async (req: Request, res: Response) => {
    const { username } = req.body;
    
    try {
      const options = await generateAuthenticationOptions({
        rpID: this.rpID,
        userVerification: 'required',
        allowCredentials: []
      });

      this.challenges.set(username, options.challenge);

      res.json(options);
    } catch (error) {
      console.error('Authentication options error:', error);
      res.status(500).json({ error: 'Failed to generate authentication options' });
    }
  };

  /**
   * Verify authentication response
   */
  verifyAuthentication = async (req: Request, res: Response) => {
    const { username, response } = req.body;
    
    try {
      const expectedChallenge = this.challenges.get(username);
      if (!expectedChallenge) {
        throw new Error('Challenge not found');
      }

      const authenticator = this.authenticators.get(username);
      if (!authenticator) {
        throw new Error('Authenticator not found');
      }

      const verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge,
        expectedOrigin: this.origin,
        expectedRPID: this.rpID,
        authenticator
      });

      if (verification.verified) {
        this.challenges.delete(username);
      }

      res.json({ 
        verified: verification.verified,
        authData: verification.authenticationInfo
      });
    } catch (error) {
      console.error('Authentication verification error:', error);
      res.status(500).json({ error: 'Failed to verify authentication' });
    }
  };

  /**
   * Test utilities
   */
  simulateAuthFailure = async (req: Request, res: Response) => {
    const { type, username } = req.body;
    
    switch (type) {
      case 'biometric':
        // Simulate biometric failure
        res.status(401).json({ 
          error: 'Biometric verification failed',
          code: 'BIOMETRIC_FAILED'
        });
        break;
      
      case 'device':
        // Simulate device not found
        res.status(401).json({
          error: 'Device not registered',
          code: 'DEVICE_NOT_FOUND'
        });
        break;
      
      case 'timeout':
        // Simulate timeout
        setTimeout(() => {
          res.status(408).json({
            error: 'Authentication timed out',
            code: 'AUTH_TIMEOUT'
          });
        }, 5000);
        break;
      
      default:
        res.status(400).json({ error: 'Invalid simulation type' });
    }
  };
}
