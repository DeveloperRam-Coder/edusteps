  import { useEffect } from 'react';
  import logo from '../../../assets/images/internsteps_logo.png';

  export default function SplashScreen() {
    useEffect(() => {
      // Navigation will be handled by Router based on auth state
    }, []);

    return (
      <div className="flex flex-col justify-center items-center min-h-screen relative  from-slate-900 via-slate-800 to-slate-700 overflow-hidden before:absolute before:top-[-50%] before:right-[-20%] before:w-[800px] before:h-[800px] before:bg-radial-gradient-purple before:rounded-full after:absolute after:bottom-[-30%] after:left-[-10%] after:w-[600px] after:h-[600px] after:bg-radial-gradient-cyan after:rounded-full">
        {/* Main Content */}
        <div className="flex flex-col items-center justify-center z-10">
          {/* Logo Container */}
          <div className="mb-8">
            <div className="w-36 h-36 rounded-full flex justify-center items-center border-2 border-primary-dark bg-white/5 backdrop-blur-md shadow-2xl shadow-primary/40 relative overflow-hidden">
              <img
                src={logo}
                alt="InternSteps Logo"
                className="w-24 h-24 object-contain relative z-10"
              />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-6xl font-extrabold mb-3   tracking-tighter">
            InternSteps
          </h1>
          <p className="text-base text-dark-400 mb-12 font-light">
            Your Learning Journey Starts Here
          </p>

          {/* Loading Indicator with Animation */}
          <div className="flex flex-row gap-3 mb-6 h-3">
            <div className="w-3 h-3 rounded-full bg-primary-dark delay-0 shadow-lg shadow-primary/50" />
            <div className="w-3 h-3 rounded-full bg-primary delay-150 shadow-lg shadow-primary/50" />
            <div className="w-3 h-3 rounded-full bg-primary-light delay-300 shadow-lg shadow-primary/50" />
          </div>

          {/* Loading Text */}
          <p className="text-sm text-slate-500 italic font-light">
            Initializing your experience...
          </p>
        </div>

        {/* Footer */}
        <div className="absolute bottom-10 text-center z-10">
          <p className="text-xs text-slate-500 tracking-widest">© 2025 InternSteps</p>
        </div>
      </div>
    );
  }
