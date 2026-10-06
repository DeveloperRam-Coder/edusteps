import React from 'react';
import { Colors, Spacing } from '../../theme/theme';

interface DividerProps {
  vertical?: boolean;
  spacing?: number;
}

const Divider: React.FC<DividerProps> = ({ vertical = false, spacing = Spacing.md }) => {
  return vertical ? (
    <div
      className="h-full"
      style={{
        width: spacing,
        backgroundColor: Colors.divider,
      }}
    />
  ) : (
    <div
      className="w-full"
      style={{
        height: 2,
        backgroundColor: Colors.divider,
        marginTop: spacing,
        marginBottom: spacing,
      }}
    />
  );
};

export default Divider;

