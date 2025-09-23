import { groupByStepAndInsights } from './groupByStepAndInsights';

describe('groupByStepAndInsights', () => {
  test('groups items by step and merges insights', () => {
    const data = [
      { step: 'one', insight: ['a', 'b'] },
      { step: 'two', insight: ['c'] },
      { step: 'one', insight: ['d'] }
    ];
    const result = groupByStepAndInsights(data);
    expect(result).toEqual([
      { step: 'one', insights: ['a', 'b', 'd'] },
      { step: 'two', insights: ['c'] }
    ]);
  });

  test('skips entries without step or insight', () => {
    const data = [
      { step: 'one', insight: ['a'] },
      { step: null, insight: ['b'] },
      { step: 'two' }
    ];
    const result = groupByStepAndInsights(data);
    expect(result).toEqual([{ step: 'one', insights: ['a'] }]);
  });
});
