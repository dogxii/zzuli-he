import type React from "react";

const LoadingSpinner: React.FC = () => {
	return (
		<div className="min-h-[60vh] flex flex-col items-center justify-center space-y-8 animate-fade-in">
			<div className="relative w-16 h-16">
				<div className="absolute inset-0 border-t-2 border-sys-accent dark:border-sys-accent-dark rounded-full animate-spin"></div>
				<div className="absolute inset-2 border-b-2 border-[#1A1A1A] dark:border-[#E5E5E5] rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
			</div>
			<p className="font-mono text-sm tracking-widest text-gray-400 uppercase animate-pulse">
				Fetching Systems...
			</p>
		</div>
	);
};

export default LoadingSpinner;
