
import { LuChevronRight } from 'react-icons/lu';

interface InfoCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress: () => void;
}

export default function InfoCard({
  icon,
  title,
  subtitle,
  onPress,
}: InfoCardProps) {
  return (
    <div 
      className="flex items-center bg-white/5 backdrop-blur-lg backdrop-saturate-180 border-2 border-blue-700 rounded-2xl p-5 mb-3 cursor-pointer transition-all duration-300 relative overflow-hidden before:absolute before:top-0 before:left-0 before:w-1 before:h-full before:bg-gradient-to-b before:from-cyan-400 before:to-blue-500 hover:-translate-y-1 hover:bg-white/8 hover:border-primary/30 hover:shadow-lg group"
      onClick={onPress}
    >
      <div className="flex items-center w-full relative z-10">
        <div
          className="flex items-center justify-center bg-cyan-400/15 rounded-lg mr-6 group-hover:bg-cyan-400/25 group-hover:scale-105 transition-all"
          style={{
            width: 56,
            height: 56,
          }}
        >
          <div className="text-2xl">{icon}</div>
        </div>

        <div className="flex-1">
          <div className="text-base font-bold text-gray-800 mb-1">
            {title}
          </div>
          {subtitle && (
            <div className="text-sm text-gray-600">
              {subtitle}
            </div>
          )}
        </div>

        <LuChevronRight className="text-lg text-gray-500 ml-4 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-primary" />
      </div>
    </div>
  );
}
