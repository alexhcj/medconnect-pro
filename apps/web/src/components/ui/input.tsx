import {forwardRef, InputHTMLAttributes} from 'react'
import {formControlClassName} from '@/components/forms/form-field-styles'
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
						formControlClassName,
						"mt-0",
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