// @ts-check

const path = require('path');

/** @type {import('webpack').Configuration} */
module.exports = {
	context: __dirname,
	devtool: 'inline-source-map',
	entry: './index.ts',
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
		filename: 'index.js',
		path: path.resolve(__dirname, 'dist'),
	},
	resolve: {
		extensions: ['.ts', '.js'],
	},
	target: 'node',
};
