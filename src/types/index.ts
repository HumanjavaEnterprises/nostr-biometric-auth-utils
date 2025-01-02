/**
 * @module types
 * @description Type definitions for biometric authentication
 */

export type AuthType = 'webauthn' | 'touchid' | 'securitykey' | 'custom';

export interface AuthRequirements {
  required: AuthType[];
  devices?: string[];
  timeout?: number;
  metadata?: Record<string, any>;
}

export interface AuthProof {
  type: AuthType;
  proof: any;
  deviceId?: string;
  timestamp: number;
}

export interface DeviceInfo {
  id: string;
  name: string;
  capabilities: AuthType[];
  lastUsed?: number;
  metadata?: Record<string, any>;
}

export interface AuthChallenge {
  challenge: string;
  timestamp: number;
  expires: number;
  metadata?: Record<string, any>;
}

export interface AuthResult {
  success: boolean;
  deviceId?: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface BiometricSettings {
  timeout: number;  // in milliseconds
  allowedDevices?: string[];
  requiredAuth: AuthType[];
  riskLevel: 'low' | 'medium' | 'high';
  metadata?: Record<string, any>;
}
