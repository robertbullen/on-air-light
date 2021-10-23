import { Service } from '../service';

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

export abstract class OnAirLightService<
	TConfig extends object = object,
	TDependencies extends object = object,
> extends Service<TConfig, TDependencies, OnAirLightState> {
	public abstract getState(): Promise<OnAirLightState>;
	public abstract setState(state: Partial<OnAirLightState>): Promise<OnAirLightState>;
}
