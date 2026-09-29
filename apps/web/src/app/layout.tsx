import React from "react";
import {Inter} from "next/font/google";
import {QueryClientProvider} from "@tanstack/react-query";
import {queryClient} from '@/lib/api/api'
import {ReactQueryDevtools} from "@tanstack/react-query-devtools";
import {Toaster} from "react-hot-toast";
import "./globals.css";

const inter = Inter({
	subsets: ["latin"],
	display: "swap",
	variable: "--font-inter",
});

export default function RootLayout({children}: { children: React.ReactNode }) {
	return (
		<html lang="en" className={inter.variable}>
		<body className="font-sans antialiased text-foreground">
		<QueryClientProvider client={queryClient}>
			{children}
			<Toaster
				position="top-right"
				toastOptions={{
					duration: 4000,
					style: {
						background: 'var(--color-bg-surface)',
						color: 'var(--color-text-label)',
						border: '1px solid var(--color-border-default)',
					},
					success: {
						iconTheme: {
							primary: 'var(--color-bg-success)',
							secondary: 'var(--color-text-inverse)',
						},
					},
					error: {
						iconTheme: {
							primary: 'var(--color-focus-danger)',
							secondary: 'var(--color-text-inverse)',
						},
					},
				}}
			/>

			{process.env.NODE_ENV === 'development' && (
				<ReactQueryDevtools initialIsOpen={false}/>
			)}
		</QueryClientProvider>
		</body>
		</html>
	);
}
