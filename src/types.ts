import {Command, Event} from './classes';

export type Constructor<T extends {} = {}> = new (...args: any[]) => T;
export type MaybeCommand = Constructor<Command> | {default: Constructor<Command>};
export type MaybeEvent = Constructor<Event> | {default: Constructor<Event>};
