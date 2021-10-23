export function functionName(func: Function): string {
	return `${func.name}()`;
}

export function methodName(owner: object, method: Function): string {
	return `${Object.getPrototypeOf(owner).constructor.name}.${functionName(method)}`;
}

export function mask(value: string, minLength: number = 16): string {
	return (
		value.substring(0, 1) +
		'*'.repeat(Math.max(minLength, value.length) - 2) +
		value.substring(value.length - 1)
	);
}
