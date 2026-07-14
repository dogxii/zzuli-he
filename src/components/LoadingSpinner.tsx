import React from "react";

const LoadingSpinner: React.FC = () => {
	return (
		<div className="flex min-h-screen items-center justify-center">
			<div className="h-7 w-7 animate-spin border-2 border-slate-200 border-t-blue-500 dark:border-white/10 dark:border-t-blue-400" />
		</div>
	);
};

export default LoadingSpinner;
