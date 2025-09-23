import { useMemo, useState } from 'react';

const useSteps = ({ initialStep = 1, totalSteps }) => {
  const [currentStep, setCurrentStep] = useState(initialStep);

  const incrementStep = () => {
    setCurrentStep((step) => Math.min(step + 1, totalSteps));
  };

  const decrementStep = () => {
    setCurrentStep((step) => Math.max(step - 1, initialStep));
  };

  const goToStep = (step) => {
    if (step >= initialStep && step <= totalSteps) {
      setCurrentStep(step);
    }
  };

  const resetSteps = () => {
    setCurrentStep(initialStep);
  };

  const steps = useMemo(() => {
    const flags = {};
    for (let i = 1; i <= totalSteps; i++) {
      flags[`isStep${i}`] = currentStep === i;
    }
    return flags;
  }, [currentStep, totalSteps]);

  return {
    currentStep,
    incrementStep,
    decrementStep,
    goToStep,
    resetSteps,
    steps
  };
};

export { useSteps };
