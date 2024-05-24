import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import { Command } from './base-command';
import { IBotContext } from '../context/context.interface';
import { GoogleSheetsService } from '../googlesheets/googlesheets.service';
import { DataInterface } from '../googlesheets/types';

export class TextCommand extends Command {
    googleSheetsService: GoogleSheetsService;

    constructor(bot: Telegraf<IBotContext>, googleSheetsService: GoogleSheetsService) {
        super(bot);
        this.googleSheetsService = googleSheetsService;
    }

    handle(): void {
        this.bot.on(message('text'), async (ctx) => {
            const text = ctx.message.text;
            console.log(text);

            if (/склад|напечатано/.test(text.toLowerCase())) {
                const instructions = text.split(/,\s*/);
                const data: DataInterface[] = [];
                instructions.forEach(async(instruction) => {
                    const [step, article, amount] = instruction.replace(/\s+/, ' ').split(' ');
                    data.push({
                        article,
                        step,
                        amount,
                    });
                })
                const result = await this.googleSheetsService.setToWarehouse(data);
                if (result) {
                    data.forEach(({step, amount, article}) => {
                        if (step.toLowerCase() === 'склад') {
                            ctx.reply(`Положил на склад ${amount} шт ${article}`);
                        } else {
                            ctx.reply(`Напечатали ${amount} шт ${article}`);
                        }
                    })
                }
            }

        })
    }
    
}