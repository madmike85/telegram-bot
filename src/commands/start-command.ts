import { Telegraf } from 'telegraf';
import { Command } from './base-command';
import { IBotContext } from '../context/context.interface';

export class StartCommand extends Command {
    constructor(bot: Telegraf<IBotContext>) {
        super(bot);
    }

    handle(): void {
        this.bot.start((ctx) => {
            console.log(ctx.session);
            ctx.reply(
                'Добрый день! Я кладовщик Иван!',
            );
        });
    }
    
}