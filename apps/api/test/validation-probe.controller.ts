import {Body, Controller, Post} from '@nestjs/common';
import {z} from 'zod';

export const validationProbeSchema = z.object({
	name: z.string().min(1),
});

export type ValidationProbeDto = z.infer<typeof validationProbeSchema>;

@Controller('__test')
export class ValidationProbeController {
	@Post('validate')
	validate(@Body({schema: validationProbeSchema}) body: ValidationProbeDto) {
		return body;
	}
}
