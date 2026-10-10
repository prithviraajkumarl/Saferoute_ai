import { describe, it, expect } from 'vitest';
import { en } from '../translations/en';
import { ta } from '../translations/ta';

describe('Bilingual Internationalization (EN / TA)', () => {
  it('contains critical emergency keys in English', () => {
    expect(en.app_title).toBe('SafeRoute AI');
    expect(en.sos_button).toContain('SOS');
    expect(en.safe_corridor).toBeDefined();
    expect(en.closure_warning).toContain('Road closure');
  });

  it('contains parallel Tamil translation keys', () => {
    expect(ta.app_title).toBe('SafeRoute AI');
    expect(ta.sos_button).toContain('SOS');
    expect(ta.safe_corridor).toContain('பாதை');
    expect(ta.closure_warning).toContain('சாலை அடைப்பு');
  });

  it('has identical key parity between English and Tamil dictionaries', () => {
    const enKeys = Object.keys(en);
    const taKeys = Object.keys(ta);
    expect(taKeys.sort()).toEqual(enKeys.sort());
  });
});
