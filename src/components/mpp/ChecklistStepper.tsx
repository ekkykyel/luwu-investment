import React from 'react';
import { 
  InteractiveRequirementStepper, 
  InteractiveRequirementStepperProps, 
  RequirementServiceKey,
  resolveServiceKey 
} from './InteractiveRequirementStepper';

export interface ChecklistStepperProps extends InteractiveRequirementStepperProps {
  service?: RequirementServiceKey | string;
}

/**
 * ChecklistStepper component alias for dynamic document requirements and checklist steps
 */
export const ChecklistStepper: React.FC<ChecklistStepperProps> = ({ service, initialService, ...props }) => {
  return (
    <InteractiveRequirementStepper 
      initialService={service || initialService} 
      {...props} 
    />
  );
};

export default ChecklistStepper;
export { resolveServiceKey };
export type { RequirementServiceKey };
