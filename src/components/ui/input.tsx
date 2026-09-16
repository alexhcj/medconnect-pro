import {forwardRef, InputHTMLAttributes} from 'react'
import {cn} from '@/lib/utils/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
	label?: string
	error?: string
	helperText?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
	({className, type, label, error, helperText, ...props}, ref) => {
		return (
			<div className="space-y-2">
				{label && (
					<label className="text-sm font-medium text-gray-700">
						{label}
						{props.required && <span className="text-red-500 ml-1">*</span>}
					</label>
				)}
				<input
					type={type}
					className={cn(
						"flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50",
						error && "border-red-500 focus:ring-red-500",
						className
					)}
					ref={ref}
					{...props}
				/>
				{error && (
					<p className="text-sm text-red-600">{error}</p>
				)}
				{helperText && !error && (
					<p className="text-sm text-gray-500">{helperText}</p>
				)}
			</div>
		)
	}
)

Input.displayName = "Input"

export {Input}