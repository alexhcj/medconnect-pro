import Daily, {type DailyCall} from '@daily-co/daily-js';

export function createDailyCallObject(): DailyCall {
	return Daily.createCallObject();
}
