import { describe, it, expect } from 'vitest';
import generateToken from '../utils/generateToken.js';
import jwt from 'jsonwebtoken';

process.env.SECRET_KEY = 'test-secret-key';

describe('generateToken', () => {
  it('should return a token as a string', () => {
    const user = { _id: '1', role: 'member' };

    expect(generateToken(user)).toBeTypeOf('string');
  });

  it('should contain the user id and role', () => {
    const user = { _id: '123', role: 'manager' };

    const token = generateToken(user);

    const decoded = jwt.decode(token);

    expect(decoded.id).toBe('123');
    expect(decoded.role).toBe('manager');
  });

  it('should create a token that can be verified with the secret key', () => {
    const user = { _id: '123', role: 'manager' };
    const token = generateToken(user);

    const decoded = jwt.verify(token, process.env.SECRET_KEY);

    expect(decoded.id).toBe('123');
    expect(decoded.role).toBe('manager');
  });

  it('should reject the token when the wrong secret is used', () => {
    const user = { _id: '123', role: 'manager' };

    const token = generateToken(user);

    expect(() => {
      jwt.verify(token, 'wrong-secret');
    }).toThrow();
  });

  it('should expire the token after 2 days', () => {
    const user = { _id: '123', role: 'manager' };

    const token = generateToken(user);

    const decoded = jwt.decode(token);

    expect(decoded.exp - decoded.iat).toBe(172800);
  })
});
