import { describe, expect, it } from 'vitest';
import {
  mergeVehiclesById,
  normalizeText,
  parseByPrefix,
  parseMakerModel,
  parsePrice,
  parseYearOnly,
  sanitizeScrapedValue,
} from './jpauc-utils.mjs';

describe('JPAUC utilities', () => {
  it('removes corrupt text markers recursively', () => {
    const lostMarker = '?'.repeat(3);
    const replacementCharacter = String.fromCharCode(0xfffd);
    expect(normalizeText(`  Test ${lostMarker} ${replacementCharacter} value  `)).toBe('Test value');
    expect(sanitizeScrapedValue({
      title: lostMarker,
      details: [`ok ${replacementCharacter} text`],
    })).toEqual({
      title: '',
      details: ['ok text'],
    });
  });

  it('parses common listing fields', () => {
    expect(parseMakerModel('Toyota Corolla')).toEqual({ maker: 'Toyota', model: 'Corolla' });
    expect(parseMakerModel('LAND ROVER Defender')).toEqual({ maker: 'LAND ROVER', model: 'Defender' });
    expect(parsePrice('Price: ¥ 1,234,500')).toBe('¥ 1,234,500');
    expect(parseByPrefix('Mileage: 80,000 km | Color: Black', 'Color')).toBe('Black');
    expect(parseYearOnly('Year: 1990 Grade X')).toBe('1990');
  });

  it('replaces existing vehicles and appends new IDs without reordering', () => {
    expect(
      mergeVehiclesById(
        [{ id: 'a', value: 1 }, { id: 'b', value: 1 }],
        [{ id: 'b', value: 2 }, { id: 'c', value: 3 }]
      )
    ).toEqual([{ id: 'a', value: 1 }, { id: 'b', value: 2 }, { id: 'c', value: 3 }]);
  });
});
