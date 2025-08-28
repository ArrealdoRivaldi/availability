import React from 'react';
import { Tooltip } from '@mui/material';
import { useUserRole } from '../hooks/useUserRole';

interface WriteGuardProps {
  children: React.ReactElement;
  showTooltip?: boolean;
  tooltipMessage?: string;
}

const WriteGuard: React.FC<WriteGuardProps> = ({ 
  children, 
  showTooltip = true,
  tooltipMessage = "Guest mode: Tidak dapat melakukan perubahan data"
}) => {
  const { isGuest, canWrite } = useUserRole();

  if (!canWrite && isGuest) {
    const disabledChild = React.cloneElement(children, {
      disabled: true,
      sx: {
        ...children.props.sx,
        opacity: 0.5,
        cursor: 'not-allowed',
      }
    });

    if (showTooltip) {
      return (
        <Tooltip title={tooltipMessage} arrow>
          <span>{disabledChild}</span>
        </Tooltip>
      );
    }

    return disabledChild;
  }

  return children;
};

export default WriteGuard;
