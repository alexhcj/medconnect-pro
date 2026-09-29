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
					<label className="text-sm font-medium text-foreground-label">
						{label}
						{props.required && <span className="ml-1 text-danger">*</span>}
					</label>
				)}
				<input
					type={type}
					className={cn(
						"flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-foreground-placeholder focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50",
						error && "border-danger focus-visible:ring-ring-danger",
						className
					)}
					ref={ref}
					{...props}
					aria-invalid={error ? true : undefined}
				/>
				{error && (
					<p className="text-sm text-danger">{error}</p>
				)}
				{helperText && !error && (
					<p className="text-sm text-foreground-muted">{helperText}</p>
				)}
			</div>
		)
	}
)

Input.displayName = "Input"

export {Input}