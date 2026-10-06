import React from 'react';
import { Colors } from '../../theme/theme';
import { resolveApiAssetUrl } from '../../api/client';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  source?: string;
  size?: AvatarSize;
  initials?: string;
  color?: string;
}

const getSize = (size: AvatarSize) => {
  switch (size) {
    case 'sm':
      return 40;
    case 'lg':
      return 80;
    case 'xl':
      return 100;
    default:
      return 60;
  }
};

const getSizeClass = (size: AvatarSize) => {
  switch (size) {
    case 'sm':
      return 'w-10 h-10';
    case 'lg':
      return 'w-20 h-20';
    case 'xl':
      return 'w-24 h-24';
    default:
      return 'w-16 h-16';
  }
};

const Avatar: React.FC<AvatarProps> = ({
  source,
  size = 'md',
  initials = '?',
  color = Colors.primary,
}) => {
  const sizeValue = getSize(size);
  const sizeClass = getSizeClass(size);
  const resolvedSource = source ? resolveApiAssetUrl(source) : '';

  return (
    <div
      className={`${sizeClass} flex justify-center items-center rounded-full shadow-lg hover:shadow-xl relative overflow-hidden before:absolute before:top-[-50%] before:left-[-50%] before:w-[200%] before:h-[200%] before:bg-conic-gradient before:from-transparent before:via-white/10 before:to-transparent before:animate-rotate border-2 border-white`}
      style={{
        backgroundColor: color,
      }}
    >
      {resolvedSource ? (
        <img
          src={resolvedSource}
          alt="Avatar"
          className="relative z-10"
          style={{
            width: sizeValue,
            height: sizeValue,
            borderRadius: sizeValue / 2,
          }}
        />
      ) : (
        <span
          className="relative z-10 text-2xl font-bold"
          style={{
            color: Colors.text,
          }}
        >
          {initials}
        </span>
      )}
    </div>
  );
};

export default Avatar;

