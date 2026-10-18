import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const formatLabel = (s: string) => {
    switch (s) {
      case 'OPEN':
        return 'Open';
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'AWAITING_APPROVAL':
        return 'Awaiting Approval';
      case 'AWAITING_CUSTOMER':
        return 'Awaiting Customer';
      case 'RESOLVED':
        return 'Resolved';
      case 'CLOSED':
        return 'Closed';
      default:
        return s;
    }
  };

  return (
    <span className={`badge status-${status}`}>
      <span className="badge-dot" />
      {formatLabel(status)}
    </span>
  );
};

export const PriorityBadge: React.FC<{ priority: string }> = ({ priority }) => {
  return <span className={`badge prio-${priority}`}>{priority}</span>;
};
