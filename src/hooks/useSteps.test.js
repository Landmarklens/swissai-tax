import { renderHook, act } from '@testing-library/react';
import { useSteps } from './useSteps';

describe('useSteps', () => {
  it('should initialize with default initial step', () => {
    const { result } = renderHook(() => useSteps({ totalSteps: 5 }));

    expect(result.current.currentStep).toBe(1);
    expect(result.current.steps.isStep1).toBe(true);
    expect(result.current.steps.isStep2).toBe(false);
  });

  it('should initialize with custom initial step', () => {
    const { result } = renderHook(() => 
      useSteps({ initialStep: 3, totalSteps: 5 })
    );

    expect(result.current.currentStep).toBe(3);
    expect(result.current.steps.isStep3).toBe(true);
    expect(result.current.steps.isStep1).toBe(false);
  });

  it('should generate step flags correctly', () => {
    const { result } = renderHook(() => 
      useSteps({ initialStep: 2, totalSteps: 4 })
    );

    expect(result.current.steps).toEqual({
      isStep1: false,
      isStep2: true,
      isStep3: false,
      isStep4: false
    });
  });

  it('should increment step', () => {
    const { result } = renderHook(() => 
      useSteps({ initialStep: 1, totalSteps: 3 })
    );

    act(() => {
      result.current.incrementStep();
    });

    expect(result.current.currentStep).toBe(2);
    expect(result.current.steps.isStep2).toBe(true);
  });

  it('should not increment beyond totalSteps', () => {
    const { result } = renderHook(() => 
      useSteps({ initialStep: 3, totalSteps: 3 })
    );

    act(() => {
      result.current.incrementStep();
    });

    expect(result.current.currentStep).toBe(3);
    expect(result.current.steps.isStep3).toBe(true);
  });

  it('should decrement step', () => {
    const { result } = renderHook(() => 
      useSteps({ initialStep: 1, totalSteps: 3 })
    );

    // First go to step 3
    act(() => {
      result.current.goToStep(3);
    });

    // Then decrement
    act(() => {
      result.current.decrementStep();
    });

    expect(result.current.currentStep).toBe(2);
    expect(result.current.steps.isStep2).toBe(true);
  });

  it('should not decrement below initialStep', () => {
    const { result } = renderHook(() => 
      useSteps({ initialStep: 2, totalSteps: 5 })
    );

    act(() => {
      result.current.decrementStep();
    });

    expect(result.current.currentStep).toBe(2);
    expect(result.current.steps.isStep2).toBe(true);
  });

  it('should go to specific step within valid range', () => {
    const { result } = renderHook(() => 
      useSteps({ initialStep: 1, totalSteps: 5 })
    );

    act(() => {
      result.current.goToStep(4);
    });

    expect(result.current.currentStep).toBe(4);
    expect(result.current.steps.isStep4).toBe(true);
  });

  it('should not go to step below initialStep', () => {
    const { result } = renderHook(() => 
      useSteps({ initialStep: 2, totalSteps: 5 })
    );

    act(() => {
      result.current.goToStep(1);
    });

    expect(result.current.currentStep).toBe(2);
  });

  it('should not go to step above totalSteps', () => {
    const { result } = renderHook(() => 
      useSteps({ initialStep: 1, totalSteps: 3 })
    );

    act(() => {
      result.current.goToStep(5);
    });

    expect(result.current.currentStep).toBe(1);
  });

  it('should reset to initial step', () => {
    const { result } = renderHook(() => 
      useSteps({ initialStep: 2, totalSteps: 5 })
    );

    // Go to different step
    act(() => {
      result.current.goToStep(4);
    });

    // Reset
    act(() => {
      result.current.resetSteps();
    });

    expect(result.current.currentStep).toBe(2);
    expect(result.current.steps.isStep2).toBe(true);
  });

  it('should update steps object when currentStep changes', () => {
    const { result } = renderHook(() => 
      useSteps({ initialStep: 1, totalSteps: 3 })
    );

    expect(result.current.steps.isStep1).toBe(true);

    act(() => {
      result.current.incrementStep();
    });

    expect(result.current.steps.isStep1).toBe(false);
    expect(result.current.steps.isStep2).toBe(true);

    act(() => {
      result.current.incrementStep();
    });

    expect(result.current.steps.isStep2).toBe(false);
    expect(result.current.steps.isStep3).toBe(true);
  });

  it('should handle edge case with 1 total step', () => {
    const { result } = renderHook(() => 
      useSteps({ initialStep: 1, totalSteps: 1 })
    );

    expect(result.current.currentStep).toBe(1);
    expect(result.current.steps).toEqual({ isStep1: true });

    act(() => {
      result.current.incrementStep();
    });

    expect(result.current.currentStep).toBe(1);

    act(() => {
      result.current.decrementStep();
    });

    expect(result.current.currentStep).toBe(1);
  });
});