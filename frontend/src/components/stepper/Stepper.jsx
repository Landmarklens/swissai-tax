import React, { useLayoutEffect, useState, useRef, useEffect, useMemo } from 'react';
import Box from '@mui/material/Box';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Loading from '../Loading/Loading';
import { jsonData } from '../../db';
import { styled } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import '../../pages/Chat/Sidebar/SearchProperties/SearchProperties.scss';

const StyledStepper = styled(Stepper)(({ theme }) => ({
  '& .MuiStepConnector-root': {
    marginLeft: '16px!important'
  }
}));

const StyledStepLabel = styled(StepLabel)(({ theme, activeSteps, tempStep }) => ({
  svg: {
    width: 32,
    height: 32
  },
  circle: {
    fill: '#D9D9E0'
  },
  text: {
    fill: '#202020'
  },
  '&:not(.Mui-disabled)': {
    circle: {
      fill: '#3E63DD'
    },
    text: {
      fill: '#fff'
    }
  }
}));

export function VerticalLinearStepper({ currentStep, isDone }) {
  const { steps, activeSteps, tempStep, aiResponses } = useSelector(
    (state) => state.conversations || {}
  );

  const { t } = useTranslation();
  const [activeStep, setActiveStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const scrollRef = useRef(null);
  const currentStepRef = useRef(null);

  const dynamicSteps = useMemo(() => {
    let mergedSteps = [...jsonData.stepper];

    const uniqueAiSteps = [];

    if (aiResponses && aiResponses.length > 0) {
      aiResponses.forEach((response, index) => {
        if (response.step) {
          const existsInJsonData = mergedSteps.some(
            (step) => step.label === response.step || t(step.label) === response.step
          );

          const existsInAiSteps = uniqueAiSteps.some((step) => step.label === response.step);

          if (!existsInJsonData && !existsInAiSteps) {
            const newStep = {
              label: response.step,
              id: `ai_step_${response.step.replace(/\s+/g, '_').toLowerCase()}_${index}`,
              isFromAI: true,
              timestamp: response.timestamp || Date.now() + index
            };

            uniqueAiSteps.push(newStep);
          }
        }
      });
    }

    uniqueAiSteps.sort((a, b) => a.timestamp - b.timestamp);

    const generalPreferencesIndex = mergedSteps.findIndex(
      (step) => step.label === 'General Preferences' || t(step.label) === 'General Preferences'
    );

    const insertIndex = generalPreferencesIndex >= 0 ? generalPreferencesIndex + 1 : 0;

    mergedSteps.splice(insertIndex, 0, ...uniqueAiSteps);

    return mergedSteps;
  }, [jsonData.stepper, activeSteps, aiResponses, t]);

  const getStepStatus = (step, index) => {
    const isActive = activeSteps?.includes(step.label);
    const isTemp = step.label === tempStep;
    const isFromAI = step.isFromAI;

    return {
      isActive,
      isTemp,
      isFromAI,
      className: `${isActive ? 'active-step' : ''} ${isTemp ? 'temp-step' : ''} ${isFromAI ? 'ai-step' : ''}`
    };
  };

  useLayoutEffect(() => {
    typeof currentStep === 'number' && setActiveStep(currentStep);
  }, [currentStep]);

  useEffect(() => {
    if (scrollRef.current) {
      const stepElement = Array.from(scrollRef.current.children).find(
        (child, index) => index === currentStep
      );

      if (stepElement) {
        stepElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }
  }, [currentStep]);

  useEffect(() => {
    if (tempStep && scrollRef.current) {
      const tempStepIndex = dynamicSteps.findIndex((step) => step.label === tempStep);
      if (tempStepIndex >= 0) {
        setTimeout(() => {
          const stepElement = Array.from(scrollRef.current.children)[tempStepIndex];
          if (stepElement) {
            stepElement.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            });
          }
        }, 100);
      }
    }
  }, [tempStep, dynamicSteps]);

  return (
    <>
      {!isLoading ? (
        <Box className="styled-step-label" sx={{ maxWidth: 400, mr: '56px', pb: 2 }}>
          <StyledStepper
            ref={scrollRef}
            id="VerticalLinearStepper"
            activeStep={activeStep}
            orientation="vertical">
            {dynamicSteps.map((step, index) => {
              const stepStatus = getStepStatus(step, index);

              return (
                <Step
                  {...(isDone ? { completed: isDone } : {})}
                  ref={currentStepRef}
                  id={`step_${index}`}
                  key={step.id || index}>
                  <StyledStepLabel
                    className={stepStatus.className}
                    data-step-type={stepStatus.isFromAI ? 'ai' : 'default'}>
                    {stepStatus.isFromAI ? step.label : t(step.label)}
                  </StyledStepLabel>
                </Step>
              );
            })}
          </StyledStepper>
        </Box>
      ) : (
        <Loading />
      )}
    </>
  );
}
