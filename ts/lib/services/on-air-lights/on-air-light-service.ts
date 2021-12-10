import { methodName } from '../../logging';
import { Service } from '../service';
import { UserActivity } from '../user-states/user-states';

export const Color = {
	black: 'black',
	white: 'white',
	red: 'red',
	yellow: 'yellow',
	lime: 'lime',
	cyan: 'cyan',
	blue: 'blue',
	magenta: 'magenta',
} as const;
export type Color = typeof Color[keyof typeof Color];

export const Pattern = {
	alternate: 'alternate',
	blink: 'blink',
	flash: 'flash',
	progress: 'progress',
	pulse: 'pulse',
	solid: 'solid',
	spin: 'spin',
} as const;
export type Pattern = typeof Pattern[keyof typeof Pattern];

export interface OnAirLightState {
	color: Color;
	duration: number;
	pattern: Pattern;
}

export abstract class OnAirLightState {
	public static fromUserActivities(activities: Set<UserActivity>): OnAirLightState {
		const prefix: string = methodName(OnAirLightState, OnAirLightState.fromUserActivities);
		console.info(prefix, { activities });

		const state: OnAirLightState = {
			color: Color.black,
			duration: 2000,
			pattern: Pattern.solid,
		};
		if (activities.has(UserActivity.detected)) {
			if (activities.has(UserActivity.presenting)) {
				state.color = Color.red;
				state.pattern = Pattern.pulse;
			} else if (activities.has(UserActivity.meeting)) {
				state.color = Color.red;
				state.pattern = Pattern.solid;
			} else if (activities.has(UserActivity.busy)) {
				state.color = Color.yellow;
				state.pattern = Pattern.solid;
			} else {
				state.color = Color.lime;
				state.pattern = Pattern.solid;
			}
		}

		console.info(prefix, { result: state });
		return state;
	}
}

export abstract class OnAirLightService<
	TConfig extends object = object,
	TDependencies extends object = object,
> extends Service<TConfig, TDependencies, OnAirLightState> {
	public abstract getState(): Promise<OnAirLightState>;
	public abstract setState(state: Partial<OnAirLightState>): Promise<OnAirLightState>;
}
