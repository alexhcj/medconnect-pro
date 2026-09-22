import {Body, Controller, Post} from '@nestjs/common';
import {z} from 'zod';
import {Public} from '../src/identity/auth.decorators.js';

export const validationProbeSchema = z.object({
	name: z.string().min(1),
});

export type ValidationProbeDto = z.infer<typeof validationProbeSchema>;

@Public()
@Controller('__test')
export class ValidationProbeController {
	@Post('validate')
	validate(@Body({schema: validationProbeSchema}) body: ValidationProbeDto) {
		return body;
	}
}
