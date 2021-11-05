import * as yup from 'yup';

export interface EnvironmentVariables {
	TABLE_NAME: string;
}

function schema(): yup.SchemaOf<EnvironmentVariables> {
	return yup.object({
		TABLE_NAME: yup.string().required(),
	});
}

export function env(): Readonly<EnvironmentVariables> {
	env._instance ??= Object.freeze(schema().validateSync(process.env, { stripUnknown: true }));
	return env._instance;
}
env._instance = undefined as Readonly<EnvironmentVariables> | undefined;
