// @ts-check

const path = require('path');

/** @type {import('webpack').Configuration} */
module.exports = {
	context: __dirname,
	devtool: 'inline-source-map',
	entry: {
		'./authorizer/index': './authorizer/index.ts',
		'./handler/index': './handler/index.ts',
	},
	externals: {
		'aws-sdk': 'commonjs aws-sdk',
	},
	mode: 'development',
	module: {
		rules: [
			{
				exclude: /node_modules/,
				test: /\.ts$/,
				use: 'ts-loader',
			},
		],
	},
	output: {
		clean: true,
		library: {
			type: 'commonjs2',
		},
	},
	resolve: {
		extensions: ['.ts', '.js'],
	},
	target: 'node',
};
