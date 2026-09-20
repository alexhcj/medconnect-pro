import React from "react";
import {QueryClientProvider} from "@tanstack/react-query";
import {queryClient} from '@/lib/api/api'
import {ReactQueryDevtools} from "@tanstack/react-query-devtools";
import {SessionProvider} from "@/components/providers/session-provider";
import {Toaster} from "react-hot-toast";
import "./globals.css";

export default function RootLayout({children}: { children: React.ReactNode }) {
	return (
		<html lang="en">
		<body>
		<QueryClientProvider client={queryClient}>
			<SessionProvider>
				{children}
				<Toaster
					position="top-right"
					toastOptions={{
						duration: 4000,
						style: {
							background: '#fff',
							color: '#374151',
							border: '1px solid #e5e7eb',
						},
						success: {
							iconTheme: {
								primary: '#10b981',
								secondary: '#fff',
							},
						},
						error: {
							iconTheme: {
								primary: '#ef4444',
								secondary: '#fff',
							},
						},
					}}
				/>
			</SessionProvider>

			{/* React Query DevTools (only in development) */}
			{process.env.NODE_ENV === 'development' && (
				<ReactQueryDevtools initialIsOpen={false}/>
			)}
		</QueryClientProvider>
		</body>
		</html>
	);
}