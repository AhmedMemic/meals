import { describe, expect, it } from 'vitest';
import { parseJson } from './ai';
import { AiError } from './aiKey';

describe('ai', () => {
  it('reads JSON also when wrapped in text', () => {
    expect(parseJson('{"deals":[]}')).toEqual({ deals: [] });
    expect(parseJson('Evo:\n```json\n{"deals":[{"name":"a"}]}\n```')).toEqual({ deals: [{ name: 'a' }] });
    expect(() => parseJson('nema ništa')).toThrow(AiError);
  });
});
