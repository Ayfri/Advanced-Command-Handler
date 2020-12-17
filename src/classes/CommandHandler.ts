import {ClientApplication, ClientOptions, Collection} from 'discord.js';
import {readdirSync, readFileSync} from 'fs';
import {join} from 'path';
import {Logger} from '../utils/Logger.js';
import AdvancedClient from './AdvancedClient.js';
import Command from './Command.js';
import CommandHandlerError from './CommandHandlerError.js';

export interface CommandHandlerInstance {
	commandsDir: string;
	eventsDir: string;
	owners?: string[] | null;
	prefixes?: string[] | null;
	client: AdvancedClient | null;
	commands: Collection<string, Command>;
	cooldowns: Collection<string, number>;
}

export default class CommandHandler {
	public static instance: CommandHandlerInstance;
	
	private constructor() {
		throw new CommandHandlerError('CommandHandler is not a class that can be instantiated.', 'CommandHandlerConstructor');
	}
	
	public static get owners() {
		return CommandHandler.instance?.owners;
	}
	
	public static set owners(owners: string[] | null | undefined) {
		CommandHandler.instance.owners = owners;
	}
	
	public static get prefixes() {
		return CommandHandler.instance?.prefixes;
	}
	
	public static set prefixes(prefixes: string[] | null | undefined) {
		CommandHandler.instance.prefixes = prefixes;
	}
	
	public static get client() {
		return CommandHandler.instance?.client;
	}
	
	public static set client(client) {
		CommandHandler.instance.client = client;
	}
	
	public static get commands() {
		return CommandHandler.instance?.commands ?? new Collection();
	}
	
	public static set commands(commands: Collection<string, Command>) {
		CommandHandler.instance.commands = commands;
	}
	
	public static get cooldowns() {
		return CommandHandler.instance?.cooldowns ?? new Collection();
	}
	
	public static create(options: {commandsDir: string; eventsDir: string; owners?: string[]; prefixes?: string[]}) {
		Logger.log(Logger.setColor('magenta') + readFileSync(join(__dirname, '../../assets/presentation.txt')).toString('utf8'), 'Loading');
		if (!CommandHandler.instance) {
			CommandHandler.instance = {
				commandsDir: options.commandsDir,
				eventsDir: options.eventsDir,
				prefixes: options.prefixes,
				owners: options.owners,
				client: null,
				commands: new Collection(),
				cooldowns: new Collection(),
			};
		}

		process.on('warning', error => {
			Logger.error(`An error occurred. \n${error.stack}`);
		});
		process.on('uncaughtException', error => {
			Logger.error(`An error occurred. \n${error.stack}`);
		});
	}
	
	public static launch(options: {token: string; clientOptions?: ClientOptions}): void {
		CommandHandler.client = new AdvancedClient(CommandHandler.instance, options.token, options.clientOptions ?? {});
		CommandHandler.loadCommands(CommandHandler.instance.commandsDir);
		CommandHandler.loadEvents(CommandHandler.instance.eventsDir);

		CommandHandler.client
			.login(options.token)
			.then(() => {
				CommandHandler.prefixes?.push(`<@${CommandHandler.client?.user?.id}>`);
				CommandHandler.client
					?.fetchApplication()
					.then((application: ClientApplication) => {
						CommandHandler.owners?.push(application.owner?.id ?? '');
					})
					.catch((err: Error) => Logger.error(err));
			})
			.catch(err => Logger.error(err));
	}
	
	public static loadCommand(path: string, name: string) {
		const command = require(join(process.cwd(), `./${path}/${name}`));
		if (!command) {
			throw new Error(`Command given name or path is not valid.\nPath : ${path}\nName:${name}`);
		}

		CommandHandler.instance.commands.set(name, command);
		Logger.comment(`Loading the command : ${Logger.setColor('gold', name)}`, 'loading');
	}
	
	public static loadCommands(path: string) {
		const dirs = readdirSync(path);
		Logger.info('Loading commands.', 'loading');
		Logger.comment(`Categories : (${dirs.length})`, 'loading');

		if(dirs) {
			for (const dir of dirs) {
				const files = readdirSync(join(process.cwd(), `${path}/${dir}`));
				if (files.length === 0) continue;
				
				Logger.comment(`Commands in the category '${dir}' : (${files.length})`, 'loading');
				
				for (const file of files) {
					CommandHandler.loadCommand(`${path}/${dir}`, file);
				}
			}
		}

		Logger.info(`${CommandHandler.instance.commands.size} commands loaded.`, 'loading');
	}
	
	public static loadEvents(path: string) {
		const files = readdirSync(path);
		Logger.info('Loading events.', 'loading');
		Logger.comment(`Events : (${files.length})`, 'loading');
		if (files) {
			for (const file of files) {
				const event = require(join(process.cwd(), `${path}/${file}`));
				if (!event) throw new Error(`Command given name or path is not valid.\nPath : ${path}\nName:${file}`);
				
				const eventName = file.split('.')[0];
				CommandHandler.client?.on(eventName, event.bind(null, CommandHandler));
				Logger.comment(`Event loading : ${Logger.setColor('gold', `${eventName}.js`)}`, 'loading');
			}
		}
		
		Logger.info(`${CommandHandler.client?.eventNames().length ?? 0} events loaded.`, 'loading');
	}
}
