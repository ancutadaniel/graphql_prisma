import { getFirstName, isValidPassword } from '../utils/user';

test('should return first name when given full name', () => {
  const firstName = getFirstName('Mike Smith');
  expect(firstName).toBe('Mike');
});

test('should return first name when given first name', () => {
  const firstName = getFirstName('Jen');
  expect(firstName).toBe('Jen');
});

test('should reject password shorter than 8 characters', () => {
  const isValid = isValidPassword('abc123');
  expect(isValid).toBe(false);
});

test('should reject password that contains the word password', () => {
  const isValid = isValidPassword('abcpassword123');
  expect(isValid).toBe(false);
});
